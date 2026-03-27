import { PrismaClient, CryptoCurrency, PaymentStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { exchangeService } from './exchange.service';
import { walletService } from './wallet.service';

const prisma = new PrismaClient();

// Generate payment address (in production, use HD wallet derivation)
const generatePaymentAddress = (currency: CryptoCurrency): string => {
  const prefixes: Record<CryptoCurrency, string> = {
    BTC: '3',  // P2SH address
    ETH: '0x',
    USDC: '0x',
    USDT: '0x'
  };
  const randomHex = uuidv4().replace(/-/g, '');
  return `${prefixes[currency]}${randomHex}`;
};

export const paymentService = {
  // إنشاء طلب دفع - Create payment request
  async createPayment(data: {
    orderId: string;
    merchantId: string;
    amountUsd: number;
    currency: CryptoCurrency;
    callbackUrl?: string;
    metadata?: any;
  }) {
    const { orderId, merchantId, amountUsd, currency, callbackUrl, metadata } = data;

    // Check if payment already exists for this order
    const existingPayment = await prisma.cryptoPayment.findUnique({
      where: { orderId }
    });

    if (existingPayment) {
      throw new Error('Payment already exists for this order');
    }

    // Get current exchange rate
    const rate = await exchangeService.getRate(currency);
    const exchangeRate = Number(rate.priceUsd);
    
    // Calculate crypto amount
    const cryptoAmount = amountUsd / exchangeRate;

    // Generate unique payment address
    const paymentAddress = generatePaymentAddress(currency);

    // Set expiry (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const payment = await prisma.cryptoPayment.create({
      data: {
        orderId,
        merchantId,
        currency,
        amount: cryptoAmount,
        amountUsd,
        paymentAddress,
        exchangeRate,
        expiresAt,
        callbackUrl,
        metadata
      }
    });

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      currency: payment.currency,
      amount: Number(payment.amount),
      amountUsd: Number(payment.amountUsd),
      paymentAddress: payment.paymentAddress,
      exchangeRate: Number(payment.exchangeRate),
      expiresAt: payment.expiresAt,
      status: payment.status,
      qrCode: `${currency.toLowerCase()}:${paymentAddress}?amount=${cryptoAmount}`
    };
  },

  // التحقق من حالة الدفع - Check payment status
  async getPaymentStatus(paymentId: string) {
    const payment = await prisma.cryptoPayment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if expired
    if (payment.status === 'PENDING' && new Date() > payment.expiresAt) {
      await prisma.cryptoPayment.update({
        where: { id: paymentId },
        data: { status: 'EXPIRED' }
      });
      payment.status = 'EXPIRED';
    }

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      currency: payment.currency,
      amount: Number(payment.amount),
      amountUsd: Number(payment.amountUsd),
      receivedAmount: Number(payment.receivedAmount),
      paymentAddress: payment.paymentAddress,
      txHash: payment.txHash,
      status: payment.status,
      expiresAt: payment.expiresAt,
      completedAt: payment.completedAt
    };
  },

  // تأكيد الدفع (webhook من blockchain) - Confirm payment
  async confirmPayment(paymentId: string, txHash: string, receivedAmount: number) {
    const payment = await prisma.cryptoPayment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'COMPLETED') {
      return payment;
    }

    const expectedAmount = Number(payment.amount);
    const tolerance = 0.001; // 0.1% tolerance for network fees

    let newStatus: PaymentStatus;
    if (receivedAmount >= expectedAmount * (1 - tolerance)) {
      newStatus = 'COMPLETED';
    } else if (receivedAmount > 0) {
      newStatus = 'PARTIAL';
    } else {
      newStatus = 'PENDING';
    }

    const updatedPayment = await prisma.cryptoPayment.update({
      where: { id: paymentId },
      data: {
        txHash,
        receivedAmount,
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date() : null
      }
    });

    // Send webhook if callback URL exists
    if (payment.callbackUrl && newStatus === 'COMPLETED') {
      // In production, use a queue for reliable webhook delivery
      try {
        await fetch(payment.callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: payment.id,
            orderId: payment.orderId,
            status: newStatus,
            txHash,
            receivedAmount
          })
        });
        
        await prisma.cryptoPayment.update({
          where: { id: paymentId },
          data: { webhookSent: true }
        });
      } catch (error) {
        console.error('Webhook delivery failed:', error);
      }
    }

    return updatedPayment;
  },

  // استرداد الدفع - Refund payment
  async refundPayment(paymentId: string, refundAddress: string) {
    const payment = await prisma.cryptoPayment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Can only refund completed payments');
    }

    // In production, initiate actual blockchain transaction
    const refundTxHash = `refund_${uuidv4().replace(/-/g, '')}`;

    const updatedPayment = await prisma.cryptoPayment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        metadata: {
          ...(payment.metadata as object || {}),
          refund: {
            address: refundAddress,
            txHash: refundTxHash,
            amount: Number(payment.receivedAmount),
            timestamp: new Date()
          }
        }
      }
    });

    return {
      paymentId: payment.id,
      status: 'REFUNDED',
      refundTxHash,
      refundAmount: Number(payment.receivedAmount),
      refundAddress
    };
  },

  // الحصول على مدفوعات التاجر - Get merchant payments
  async getMerchantPayments(merchantId: string, options: {
    status?: PaymentStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, limit = 20, offset = 0 } = options;

    const payments = await prisma.cryptoPayment.findMany({
      where: {
        merchantId,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.cryptoPayment.count({
      where: {
        merchantId,
        ...(status && { status })
      }
    });

    // Calculate totals
    const completedPayments = await prisma.cryptoPayment.aggregate({
      where: {
        merchantId,
        status: 'COMPLETED'
      },
      _sum: {
        amountUsd: true
      },
      _count: true
    });

    return {
      payments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      summary: {
        totalCompleted: completedPayments._count,
        totalVolumeUsd: Number(completedPayments._sum.amountUsd || 0)
      }
    };
  },

  // دفع من المحفظة - Pay from wallet
  async payFromWallet(userId: string, paymentId: string) {
    const payment = await prisma.cryptoPayment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      throw new Error('Payment is not pending');
    }

    if (new Date() > payment.expiresAt) {
      throw new Error('Payment has expired');
    }

    // Get user wallet
    const wallet = await prisma.cryptoWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check balance
    const balanceField = {
      BTC: 'btcBalance',
      ETH: 'ethBalance',
      USDC: 'usdcBalance',
      USDT: 'usdtBalance'
    }[payment.currency];

    const balance = Number(wallet[balanceField as keyof typeof wallet]);
    const amount = Number(payment.amount);

    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct from wallet
    await walletService.updateBalance(wallet.id, payment.currency, amount, 'subtract');

    // Create transaction record
    const transaction = await prisma.cryptoTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'PAYMENT',
        currency: payment.currency,
        amount: amount,
        amountUsd: Number(payment.amountUsd),
        orderId: payment.orderId,
        exchangeRate: Number(payment.exchangeRate),
        status: 'CONFIRMED',
        confirmations: 1,
        confirmedAt: new Date()
      }
    });

    // Update payment status
    const txHash = `internal_${transaction.id}`;
    await this.confirmPayment(paymentId, txHash, amount);

    return {
      success: true,
      transactionId: transaction.id,
      paymentId: payment.id,
      amount,
      currency: payment.currency
    };
  }
};
