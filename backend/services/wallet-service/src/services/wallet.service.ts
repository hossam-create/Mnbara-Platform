import { PrismaClient, Currency, TransactionType, TransactionStatus } from '@prisma/client';
import { forexService } from './forex.service';

const prisma = new PrismaClient();

const SUPPORTED_CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'];

export const walletService = {
  // إنشاء محفظة جديدة - Create new wallet
  async createWallet(userId: string, primaryCurrency: Currency = 'USD') {
    const existingWallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (existingWallet) {
      throw new Error('Wallet already exists for this user');
    }

    // Create wallet with balances for all supported currencies
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        primaryCurrency,
        balances: {
          create: SUPPORTED_CURRENCIES.map(currency => ({
            currency,
            balance: 0,
            availableBalance: 0,
            pendingBalance: 0
          }))
        }
      },
      include: { balances: true }
    });

    return wallet;
  },

  // الحصول على المحفظة - Get wallet
  async getWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        balances: true,
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  },

  // الحصول على الرصيد الإجمالي - Get total balance
  async getTotalBalance(userId: string, displayCurrency: Currency = 'USD') {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    let totalInDisplayCurrency = 0;
    const balanceDetails = [];

    for (const balance of wallet.balances) {
      const amount = Number(balance.balance);
      if (amount > 0) {
        const conversion = await forexService.convert(
          balance.currency,
          displayCurrency,
          amount,
          false
        );
        totalInDisplayCurrency += conversion.to.amount;
        balanceDetails.push({
          currency: balance.currency,
          amount,
          inDisplayCurrency: conversion.to.amount
        });
      }
    }

    return {
      totalBalance: totalInDisplayCurrency,
      displayCurrency,
      balances: balanceDetails,
      updatedAt: new Date()
    };
  },

  // إيداع - Deposit
  async deposit(userId: string, currency: Currency, amount: number, referenceId?: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balance = wallet.balances.find(b => b.currency === currency);
    if (!balance) {
      throw new Error('Currency not supported');
    }

    const newBalance = Number(balance.balance) + amount;

    // Update balance
    await prisma.walletBalance.update({
      where: { id: balance.id },
      data: {
        balance: newBalance,
        availableBalance: newBalance
      }
    });

    // Create transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        currency,
        amount,
        balanceAfter: newBalance,
        status: 'COMPLETED',
        referenceId,
        referenceType: 'deposit',
        description: `Deposit of ${amount} ${currency}`,
        descriptionAr: `إيداع ${amount} ${currency}`,
        completedAt: new Date()
      }
    });

    return {
      transactionId: transaction.id,
      currency,
      amount,
      newBalance,
      status: 'COMPLETED'
    };
  },

  // سحب - Withdraw
  async withdraw(userId: string, currency: Currency, amount: number, referenceId?: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balance = wallet.balances.find(b => b.currency === currency);
    if (!balance) {
      throw new Error('Currency not supported');
    }

    const currentBalance = Number(balance.availableBalance);
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWithdrawals = await prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        createdAt: { gte: today },
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });

    const todayTotal = Number(todayWithdrawals._sum.amount || 0);
    if (todayTotal + amount > Number(wallet.dailyLimit)) {
      throw new Error('Daily withdrawal limit exceeded');
    }

    const newBalance = currentBalance - amount;

    // Update balance
    await prisma.walletBalance.update({
      where: { id: balance.id },
      data: {
        balance: newBalance,
        availableBalance: newBalance
      }
    });

    // Create transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        currency,
        amount: -amount,
        balanceAfter: newBalance,
        status: 'COMPLETED',
        referenceId,
        referenceType: 'withdrawal',
        description: `Withdrawal of ${amount} ${currency}`,
        descriptionAr: `سحب ${amount} ${currency}`,
        completedAt: new Date()
      }
    });

    return {
      transactionId: transaction.id,
      currency,
      amount,
      newBalance,
      status: 'COMPLETED'
    };
  },

  // تحويل بين العملات - Convert between currencies
  async convert(
    userId: string,
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: number
  ) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const fromBalance = wallet.balances.find(b => b.currency === fromCurrency);
    const toBalance = wallet.balances.find(b => b.currency === toCurrency);

    if (!fromBalance || !toBalance) {
      throw new Error('Currency not supported');
    }

    if (Number(fromBalance.availableBalance) < amount) {
      throw new Error('Insufficient balance');
    }

    // Get conversion rate
    const conversion = await forexService.convert(fromCurrency, toCurrency, amount);

    // Update balances
    const newFromBalance = Number(fromBalance.balance) - amount;
    const newToBalance = Number(toBalance.balance) + conversion.to.amount;

    await prisma.$transaction([
      prisma.walletBalance.update({
        where: { id: fromBalance.id },
        data: {
          balance: newFromBalance,
          availableBalance: newFromBalance
        }
      }),
      prisma.walletBalance.update({
        where: { id: toBalance.id },
        data: {
          balance: newToBalance,
          availableBalance: newToBalance
        }
      })
    ]);

    // Create transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CONVERSION',
        currency: fromCurrency,
        amount: -amount,
        toCurrency,
        toAmount: conversion.to.amount,
        exchangeRate: conversion.rate,
        fee: conversion.fee.amount,
        feeCurrency: toCurrency,
        balanceAfter: newFromBalance,
        status: 'COMPLETED',
        description: `Converted ${amount} ${fromCurrency} to ${conversion.to.amount.toFixed(2)} ${toCurrency}`,
        descriptionAr: `تحويل ${amount} ${fromCurrency} إلى ${conversion.to.amount.toFixed(2)} ${toCurrency}`,
        completedAt: new Date()
      }
    });

    return {
      transactionId: transaction.id,
      from: {
        currency: fromCurrency,
        amount,
        newBalance: newFromBalance
      },
      to: {
        currency: toCurrency,
        amount: conversion.to.amount,
        newBalance: newToBalance
      },
      rate: conversion.rate,
      fee: conversion.fee
    };
  },

  // تحديث الحدود - Update limits
  async updateLimits(userId: string, dailyLimit?: number, monthlyLimit?: number) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return prisma.wallet.update({
      where: { userId },
      data: {
        ...(dailyLimit !== undefined && { dailyLimit }),
        ...(monthlyLimit !== undefined && { monthlyLimit })
      }
    });
  },

  // الحصول على تاريخ المعاملات - Get transaction history
  async getTransactionHistory(userId: string, options: {
    currency?: Currency;
    type?: TransactionType;
    limit?: number;
    offset?: number;
  } = {}) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const { currency, type, limit = 20, offset = 0 } = options;

    const transactions = await prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        ...(currency && { currency }),
        ...(type && { type })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.walletTransaction.count({
      where: {
        walletId: wallet.id,
        ...(currency && { currency }),
        ...(type && { type })
      }
    });

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }
};
