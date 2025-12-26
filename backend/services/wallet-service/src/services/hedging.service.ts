import { PrismaClient, Currency, HedgeType, HedgingStatus } from '@prisma/client';
import { forexService } from './forex.service';

const prisma = new PrismaClient();

// Premium rates for hedging (percentage of amount)
const HEDGING_PREMIUMS: Record<HedgeType, number> = {
  FORWARD: 0.5,   // 0.5% for forward contracts
  OPTION: 1.0,    // 1% for options
  STOP_LOSS: 0.3  // 0.3% for stop-loss
};

export const hedgingService = {
  // إنشاء أمر تحوط - Create hedging order
  async createHedgingOrder(data: {
    userId: string;
    currency: Currency;
    amount: number;
    hedgeType: HedgeType;
    targetRate: number;
    protectionCurrency: Currency;
    durationDays: number;
  }) {
    const { userId, currency, amount, hedgeType, targetRate, protectionCurrency, durationDays } = data;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get current rate
    const currentRateData = await forexService.getRate(currency, protectionCurrency);
    const currentRate = currentRateData.rate;

    // Calculate premium
    const premiumPercentage = HEDGING_PREMIUMS[hedgeType];
    const premium = amount * (premiumPercentage / 100);

    // Check if user has enough balance for premium
    const balance = wallet.balances.find(b => b.currency === currency);
    if (!balance || Number(balance.availableBalance) < premium) {
      throw new Error('Insufficient balance for hedging premium');
    }

    // Calculate protection amount
    const protectionAmount = amount * targetRate;

    // Set expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    // Deduct premium from wallet
    await prisma.walletBalance.update({
      where: { id: balance.id },
      data: {
        balance: { decrement: premium },
        availableBalance: { decrement: premium }
      }
    });

    // Create hedging order
    const order = await prisma.hedgingOrder.create({
      data: {
        walletId: wallet.id,
        currency,
        amount,
        hedgeType,
        targetRate,
        currentRate,
        protectionCurrency,
        protectionAmount,
        expiresAt,
        premium
      }
    });

    // Create premium transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'HEDGING_PREMIUM',
        currency,
        amount: -premium,
        balanceAfter: Number(balance.balance) - premium,
        status: 'COMPLETED',
        referenceId: order.id,
        referenceType: 'hedging',
        description: `Hedging premium for ${hedgeType} order`,
        descriptionAr: `رسوم التحوط لأمر ${hedgeType}`,
        completedAt: new Date()
      }
    });

    return {
      orderId: order.id,
      hedgeType,
      currency,
      amount,
      targetRate,
      currentRate,
      protectionCurrency,
      protectionAmount,
      premium,
      expiresAt,
      status: 'ACTIVE'
    };
  },

  // الحصول على أمر تحوط - Get hedging order
  async getHedgingOrder(orderId: string) {
    const order = await prisma.hedgingOrder.findUnique({
      where: { id: orderId },
      include: {
        wallet: {
          select: { userId: true }
        }
      }
    });

    if (!order) {
      throw new Error('Hedging order not found');
    }

    // Get current rate
    const currentRateData = await forexService.getRate(order.currency, order.protectionCurrency);
    
    return {
      ...order,
      currentMarketRate: currentRateData.rate,
      inTheMoney: order.hedgeType === 'FORWARD' 
        ? currentRateData.rate > Number(order.targetRate)
        : currentRateData.rate < Number(order.targetRate)
    };
  },

  // الحصول على أوامر التحوط للمستخدم - Get user hedging orders
  async getUserHedgingOrders(userId: string, options: {
    status?: HedgingStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const { status, limit = 20, offset = 0 } = options;

    const orders = await prisma.hedgingOrder.findMany({
      where: {
        walletId: wallet.id,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.hedgingOrder.count({
      where: {
        walletId: wallet.id,
        ...(status && { status })
      }
    });

    return {
      orders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  },

  // تنفيذ أمر التحوط - Execute hedging order
  async executeHedgingOrder(orderId: string) {
    const order = await prisma.hedgingOrder.findUnique({
      where: { id: orderId },
      include: {
        wallet: {
          include: { balances: true }
        }
      }
    });

    if (!order) {
      throw new Error('Hedging order not found');
    }

    if (order.status !== 'ACTIVE') {
      throw new Error('Order is not active');
    }

    // Get current rate
    const currentRateData = await forexService.getRate(order.currency, order.protectionCurrency);
    const currentRate = currentRateData.rate;

    // Check if order should be executed
    const shouldExecute = 
      (order.hedgeType === 'FORWARD') ||
      (order.hedgeType === 'OPTION' && currentRate < Number(order.targetRate)) ||
      (order.hedgeType === 'STOP_LOSS' && currentRate < Number(order.targetRate));

    if (!shouldExecute) {
      throw new Error('Conditions not met for execution');
    }

    // Calculate payout
    const payout = Number(order.amount) * Number(order.targetRate);
    
    // Find protection currency balance
    const protectionBalance = order.wallet.balances.find(
      b => b.currency === order.protectionCurrency
    );

    if (!protectionBalance) {
      throw new Error('Protection currency balance not found');
    }

    // Update order status
    await prisma.hedgingOrder.update({
      where: { id: orderId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date()
      }
    });

    // Add payout to wallet
    await prisma.walletBalance.update({
      where: { id: protectionBalance.id },
      data: {
        balance: { increment: payout },
        availableBalance: { increment: payout }
      }
    });

    // Create payout transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: order.walletId,
        type: 'HEDGING_PAYOUT',
        currency: order.protectionCurrency,
        amount: payout,
        balanceAfter: Number(protectionBalance.balance) + payout,
        status: 'COMPLETED',
        referenceId: order.id,
        referenceType: 'hedging',
        description: `Hedging payout for ${order.hedgeType} order`,
        descriptionAr: `عائد التحوط لأمر ${order.hedgeType}`,
        completedAt: new Date()
      }
    });

    return {
      orderId: order.id,
      status: 'EXECUTED',
      payout,
      payoutCurrency: order.protectionCurrency,
      executedRate: Number(order.targetRate),
      marketRate: currentRate,
      savings: (Number(order.targetRate) - currentRate) * Number(order.amount)
    };
  },

  // إلغاء أمر التحوط - Cancel hedging order
  async cancelHedgingOrder(orderId: string) {
    const order = await prisma.hedgingOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Hedging order not found');
    }

    if (order.status !== 'ACTIVE') {
      throw new Error('Order is not active');
    }

    // Only OPTIONS can be cancelled (FORWARD and STOP_LOSS are binding)
    if (order.hedgeType !== 'OPTION') {
      throw new Error('Only OPTION orders can be cancelled');
    }

    await prisma.hedgingOrder.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    return {
      orderId: order.id,
      status: 'CANCELLED',
      message: 'Order cancelled. Premium is non-refundable.',
      messageAr: 'تم إلغاء الأمر. الرسوم غير قابلة للاسترداد.'
    };
  },

  // فحص الأوامر المنتهية - Check expired orders
  async checkExpiredOrders() {
    const expiredOrders = await prisma.hedgingOrder.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() }
      }
    });

    for (const order of expiredOrders) {
      await prisma.hedgingOrder.update({
        where: { id: order.id },
        data: { status: 'EXPIRED' }
      });
    }

    return {
      expiredCount: expiredOrders.length,
      expiredOrders: expiredOrders.map(o => o.id)
    };
  }
};
