import { Request, Response } from 'express';
import { PrismaClient, CryptoCurrency, TransactionType, TransactionStatus } from '@prisma/client';
import { walletService } from '../services/wallet.service';
import { exchangeService } from '../services/exchange.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const transactionController = {
  // إنشاء إيداع - Create deposit
  async createDeposit(req: Request, res: Response) {
    try {
      const { userId, currency } = req.body;

      if (!userId || !currency) {
        return res.status(400).json({
          success: false,
          message: 'userId and currency are required',
          messageAr: 'معرف المستخدم والعملة مطلوبان'
        });
      }

      if (!['BTC', 'ETH', 'USDC', 'USDT'].includes(currency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency',
          messageAr: 'عملة غير صالحة'
        });
      }

      const wallet = await prisma.cryptoWallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found',
          messageAr: 'المحفظة غير موجودة'
        });
      }

      const rate = await exchangeService.getRate(currency as CryptoCurrency);
      
      // Set expiry (1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const addressMap: Record<string, string | null> = {
        BTC: wallet.btcAddress,
        ETH: wallet.ethAddress,
        USDC: wallet.usdcAddress,
        USDT: wallet.usdtAddress
      };

      const deposit = await prisma.cryptoDeposit.create({
        data: {
          walletId: wallet.id,
          currency: currency as CryptoCurrency,
          amount: 0,
          amountUsd: 0,
          depositAddress: addressMap[currency] || '',
          exchangeRate: Number(rate.priceUsd),
          expiresAt
        }
      });

      res.status(201).json({
        success: true,
        message: 'Deposit address generated',
        messageAr: 'تم إنشاء عنوان الإيداع',
        data: {
          depositId: deposit.id,
          currency,
          address: deposit.depositAddress,
          network: currency === 'BTC' ? 'Bitcoin' : 'Ethereum (ERC-20)',
          minDeposit: currency === 'BTC' ? 0.0001 : currency === 'ETH' ? 0.001 : 1,
          confirmationsRequired: currency === 'BTC' ? 3 : 12,
          expiresAt: deposit.expiresAt
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إنشاء الإيداع'
      });
    }
  },

  // إنشاء سحب - Create withdrawal
  async createWithdrawal(req: Request, res: Response) {
    try {
      const { userId, currency, amount, toAddress, twoFactorCode } = req.body;

      if (!userId || !currency || !amount || !toAddress) {
        return res.status(400).json({
          success: false,
          message: 'userId, currency, amount, and toAddress are required',
          messageAr: 'معرف المستخدم والعملة والمبلغ والعنوان مطلوبة'
        });
      }

      if (!['BTC', 'ETH', 'USDC', 'USDT'].includes(currency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency',
          messageAr: 'عملة غير صالحة'
        });
      }

      const wallet = await prisma.cryptoWallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found',
          messageAr: 'المحفظة غير موجودة'
        });
      }

      // Check balance
      const balanceField = {
        BTC: 'btcBalance',
        ETH: 'ethBalance',
        USDC: 'usdcBalance',
        USDT: 'usdtBalance'
      }[currency];

      const balance = Number(wallet[balanceField as keyof typeof wallet]);
      const withdrawAmount = parseFloat(amount);

      // Get network fee
      const fees = await exchangeService.getNetworkFee(currency as CryptoCurrency);
      const networkFee = fees.fees.medium.amount;

      const totalRequired = withdrawAmount + networkFee;

      if (balance < totalRequired) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Required: ${totalRequired} ${currency} (including ${networkFee} network fee)`,
          messageAr: 'رصيد غير كافي'
        });
      }

      const rate = await exchangeService.getRate(currency as CryptoCurrency);

      const withdrawal = await prisma.cryptoWithdrawal.create({
        data: {
          walletId: wallet.id,
          currency: currency as CryptoCurrency,
          amount: withdrawAmount,
          amountUsd: withdrawAmount * Number(rate.priceUsd),
          toAddress,
          exchangeRate: Number(rate.priceUsd),
          networkFee,
          twoFactorVerified: !!twoFactorCode,
          ipAddress: req.ip
        }
      });

      // Deduct from wallet
      await walletService.updateBalance(wallet.id, currency as CryptoCurrency, totalRequired, 'subtract');

      res.status(201).json({
        success: true,
        message: 'Withdrawal request created',
        messageAr: 'تم إنشاء طلب السحب',
        data: {
          withdrawalId: withdrawal.id,
          currency,
          amount: withdrawAmount,
          networkFee,
          totalDeducted: totalRequired,
          toAddress,
          status: withdrawal.status,
          estimatedTime: '10-60 minutes'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إنشاء السحب'
      });
    }
  },

  // الحصول على معاملة - Get transaction
  async getTransaction(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;

      const transaction = await prisma.cryptoTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          messageAr: 'المعاملة غير موجودة'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على المعاملة'
      });
    }
  },

  // الحصول على حالة الإيداع - Get deposit status
  async getDepositStatus(req: Request, res: Response) {
    try {
      const { depositId } = req.params;

      const deposit = await prisma.cryptoDeposit.findUnique({
        where: { id: depositId }
      });

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message: 'Deposit not found',
          messageAr: 'الإيداع غير موجود'
        });
      }

      // Check if expired
      if (deposit.status === 'PENDING' && new Date() > deposit.expiresAt) {
        await prisma.cryptoDeposit.update({
          where: { id: depositId },
          data: { status: 'EXPIRED' }
        });
        deposit.status = 'EXPIRED';
      }

      res.json({
        success: true,
        data: deposit
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على حالة الإيداع'
      });
    }
  },

  // الحصول على حالة السحب - Get withdrawal status
  async getWithdrawalStatus(req: Request, res: Response) {
    try {
      const { withdrawalId } = req.params;

      const withdrawal = await prisma.cryptoWithdrawal.findUnique({
        where: { id: withdrawalId }
      });

      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: 'Withdrawal not found',
          messageAr: 'السحب غير موجود'
        });
      }

      res.json({
        success: true,
        data: withdrawal
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على حالة السحب'
      });
    }
  },

  // تحويل داخلي - Internal transfer
  async internalTransfer(req: Request, res: Response) {
    try {
      const { fromUserId, toUserId, currency, amount } = req.body;

      if (!fromUserId || !toUserId || !currency || !amount) {
        return res.status(400).json({
          success: false,
          message: 'fromUserId, toUserId, currency, and amount are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      if (!['BTC', 'ETH', 'USDC', 'USDT'].includes(currency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency',
          messageAr: 'عملة غير صالحة'
        });
      }

      const fromWallet = await prisma.cryptoWallet.findUnique({
        where: { userId: fromUserId }
      });

      const toWallet = await prisma.cryptoWallet.findUnique({
        where: { userId: toUserId }
      });

      if (!fromWallet || !toWallet) {
        return res.status(404).json({
          success: false,
          message: 'One or both wallets not found',
          messageAr: 'المحفظة غير موجودة'
        });
      }

      const transferAmount = parseFloat(amount);
      const rate = await exchangeService.getRate(currency as CryptoCurrency);

      // Deduct from sender
      await walletService.updateBalance(fromWallet.id, currency as CryptoCurrency, transferAmount, 'subtract');

      // Add to receiver
      await walletService.updateBalance(toWallet.id, currency as CryptoCurrency, transferAmount, 'add');

      // Create transaction records
      const txId = uuidv4();

      await prisma.cryptoTransaction.createMany({
        data: [
          {
            walletId: fromWallet.id,
            type: 'TRANSFER',
            currency: currency as CryptoCurrency,
            amount: -transferAmount,
            amountUsd: transferAmount * Number(rate.priceUsd),
            toAddress: toWallet.userId,
            exchangeRate: Number(rate.priceUsd),
            status: 'CONFIRMED',
            confirmations: 1,
            confirmedAt: new Date(),
            metadata: { transferId: txId, direction: 'out' }
          },
          {
            walletId: toWallet.id,
            type: 'TRANSFER',
            currency: currency as CryptoCurrency,
            amount: transferAmount,
            amountUsd: transferAmount * Number(rate.priceUsd),
            fromAddress: fromWallet.userId,
            exchangeRate: Number(rate.priceUsd),
            status: 'CONFIRMED',
            confirmations: 1,
            confirmedAt: new Date(),
            metadata: { transferId: txId, direction: 'in' }
          }
        ]
      });

      res.json({
        success: true,
        message: 'Transfer completed',
        messageAr: 'تم التحويل بنجاح',
        data: {
          transferId: txId,
          from: fromUserId,
          to: toUserId,
          currency,
          amount: transferAmount,
          usdValue: transferAmount * Number(rate.priceUsd),
          fee: 0 // Internal transfers are free
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في التحويل'
      });
    }
  }
};
