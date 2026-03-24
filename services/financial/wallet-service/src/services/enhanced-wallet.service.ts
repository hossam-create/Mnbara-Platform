/**
 * Enhanced Travel Wallet Service
 * Multi-currency wallet with conversion rates, audit trail, and balance management
 */

import { PrismaClient } from '@prisma/client';
import { forexService } from './forex.service';

const prisma = new PrismaClient();

// Supported currencies for travel wallet
export const SUPPORTED_CURRENCIES = [
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'SAR', // Saudi Riyal
  'AED', // UAE Dirham
  'EGP', // Egyptian Pound
  'JPY', // Japanese Yen
  'CNY', // Chinese Yuan
  'INR', // Indian Rupee
  'TRY', // Turkish Lira
  'THB', // Thai Baht
  'IDR', // Indonesian Rupiah
  'MYR', // Malaysian Ringgit
  'SGD', // Singapore Dollar
  'AUD', // Australian Dollar
  'CAD', // Canadian Dollar
  'CHF', // Swiss Franc
  'KWD', // Kuwaiti Dinar
  'QAR', // Qatari Riyal
  'BHD', // Bahraini Dinar
  'OMR', // Omani Rial
  'JOD', // Jordanian Dinar
  'MAD', // Moroccan Dirham
  'TND', // Tunisian Dinar
  'DZD', // Algerian Dinar
  'LBP', // Lebanese Pound
  'SYR', // Syrian Pound
  'IQD', // Iraqi Dinar
  'ALL', // Albanian Lek
  'BGN', // Bulgarian Lev
  'HRK', // Croatian Kuna
  'CZK', // Czech Koruna
  'DKK', // Danish Krone
  'HUF', // Hungarian Forint
  'ISK', // Icelandic Krona
  'NOK', // Norwegian Krone
  'PLN', // Polish Zloty
  'RON', // Romanian Leu
  'SEK', // Swedish Krona
  'UAH', // Ukrainian Hryvnia
  'ZAR', // South African Rand
  'BRL', // Brazilian Real
  'MXN', // Mexican Peso
  'CLP', // Chilean Peso
  'COP', // Colombian Peso
  'PEN', // Peruvian Sol
  'UYU', // Uruguayan Peso
  'VND', // Vietnamese Dong
  'PHP', // Philippine Peso
  'NZD', // New Zealand Dollar
  'KRW', // South Korean Won
  'TWD', // Taiwan Dollar
  'HKD', // Hong Kong Dollar
  'MOP', // Macau Pataca
] as const;

export type Currency = typeof SUPPORTED_CURRENCIES[number];

export interface TransactionFilters {
  currency?: Currency;
  type?: 'DEPOSIT' | 'WITHDRAWAL' | 'CONVERSION' | 'TRANSFER' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'REFUND' | 'FEE';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface WalletWithBalances {
  id: string;
  userId: string;
  primaryCurrency: Currency;
  totalBalanceUSD: number;
  balances: {
    currency: Currency;
    available: number;
    pending: number;
    total: number;
    convertedToUSD: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversionQuote {
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  rate: number;
  inverseRate: number;
  fee: number;
  feeCurrency: Currency;
  totalFromAmount: number;
  expiresAt: Date;
}

export class EnhancedWalletService {
  private prisma: PrismaClient;
  private conversionQuotes: Map<string, ConversionQuote> = new Map();
  private QUOTE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * إنشاء محفظة جديدة - Create new multi-currency wallet
   */
  async createWallet(userId: string, primaryCurrency: Currency = 'USD'): Promise<any> {
    const existingWallet = await prisma.wallet.findUnique({
      where: { userId },
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
            pendingBalance: 0,
          })),
        },
      },
      include: { balances: true },
    });

    // Create audit trail
    await this.createAuditTrail(wallet.id, 'WALLET_CREATED', userId, {
      primaryCurrency,
      currenciesEnabled: SUPPORTED_CURRENCIES,
    });

    return wallet;
  }

  /**
   * الحصول على المحفظة - Get wallet with all balances
   */
  async getWallet(userId: string): Promise<WalletWithBalances> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Calculate total balance in USD
    let totalBalanceUSD = 0;
    const balanceDetails: any[] = [];

    for (const balance of wallet.balances) {
      const amount = Number(balance.balance);
      if (amount > 0) {
        try {
          const conversion = await forexService.convert(
            balance.currency,
            'USD',
            amount,
            false
          );
          totalBalanceUSD += conversion.to.amount;
          balanceDetails.push({
            currency: balance.currency,
            available: Number(balance.availableBalance),
            pending: Number(balance.pendingBalance),
            total: amount,
            convertedToUSD: conversion.to.amount,
          });
        } catch {
          balanceDetails.push({
            currency: balance.currency,
            available: Number(balance.availableBalance),
            pending: Number(balance.pendingBalance),
            total: amount,
            convertedToUSD: 0,
          });
        }
      }
    }

    return {
      id: wallet.id,
      userId: wallet.userId,
      primaryCurrency: wallet.primaryCurrency as Currency,
      totalBalanceUSD,
      balances: balanceDetails,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  /**
   * إيداع funds - Deposit funds to wallet
   */
  async deposit(
    userId: string,
    currency: Currency,
    amount: number,
    referenceId?: string,
    source?: 'bank' | 'card' | 'paypal' | 'paymob' | 'stripe' | 'refund' | 'escrow_release'
  ): Promise<any> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balance = wallet.balances.find((b: any) => b.currency === currency);
    if (!balance) {
      throw new Error('Currency not supported');
    }

    return await this.prisma.$transaction(async (tx: any) => {
      const newBalance = Number(balance.balance) + amount;
      const newAvailableBalance = Number(balance.availableBalance) + amount;

      // Update balance
      await tx.walletBalance.update({
        where: { id: balance.id },
        data: {
          balance: newBalance,
          availableBalance: newAvailableBalance,
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          currency,
          amount,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          referenceId,
          referenceType: source || 'manual',
          description: `Deposit of ${amount} ${currency}`,
          completedAt: new Date(),
        },
      });

      // Create audit trail
      await this.createAuditTrailWithTx(tx, wallet.id, 'DEPOSIT', userId, {
        transactionId: transaction.id,
        currency,
        amount,
        balanceAfter: newBalance,
        source,
        referenceId,
      });

      return {
        transactionId: transaction.id,
        currency,
        amount,
        newBalance,
        availableBalance: newAvailableBalance,
        status: 'COMPLETED',
      };
    });
  }

  /**
   * سحب funds - Withdraw funds from wallet
   */
  async withdraw(
    userId: string,
    currency: Currency,
    amount: number,
    referenceId?: string,
    destination?: 'bank' | 'card' | 'paypal' | 'paymob' | 'stripe'
  ): Promise<any> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balance = wallet.balances.find((b: any) => b.currency === currency);
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
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const todayTotal = Number(todayWithdrawals._sum.amount || 0);
    if (todayTotal + amount > Number(wallet.dailyLimit || 10000)) {
      throw new Error('Daily withdrawal limit exceeded');
    }

    return await this.prisma.$transaction(async (tx: any) => {
      const newBalance = currentBalance - amount;

      // Update balance
      await tx.walletBalance.update({
        where: { id: balance.id },
        data: {
          balance: newBalance,
          availableBalance: newBalance,
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          currency,
          amount: -amount,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          referenceId,
          referenceType: destination || 'manual',
          description: `Withdrawal of ${amount} ${currency}`,
          completedAt: new Date(),
        },
      });

      // Create audit trail
      await this.createAuditTrailWithTx(tx, wallet.id, 'WITHDRAWAL', userId, {
        transactionId: transaction.id,
        currency,
        amount,
        balanceAfter: newBalance,
        destination,
        referenceId,
      });

      return {
        transactionId: transaction.id,
        currency,
        amount,
        newBalance,
        status: 'COMPLETED',
      };
    });
  }

  /**
   * تحويل بين العملات - Get conversion quote
   */
  async getConversionQuote(
    fromCurrency: Currency,
    toCurrency: Currency,
    fromAmount: number
  ): Promise<ConversionQuote> {
    if (fromCurrency === toCurrency) {
      throw new Error('Source and target currencies must be different');
    }

    if (fromAmount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Get conversion rate from forex service
    const conversion = await forexService.convert(fromCurrency, toCurrency, fromAmount);

    // Calculate fee (0.5% of converted amount)
    const feeRate = 0.005;
    const fee = conversion.to.amount * feeRate;
    const toAmountAfterFee = conversion.to.amount - fee;

    const quote: ConversionQuote = {
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount: toAmountAfterFee,
      rate: conversion.rate,
      inverseRate: 1 / conversion.rate,
      fee,
      feeCurrency: toCurrency,
      totalFromAmount: fromAmount,
      expiresAt: new Date(Date.now() + this.QUOTE_EXPIRY_MS),
    };

    // Store quote for later execution
    const quoteId = `${fromCurrency}_${toCurrency}_${Date.now()}`;
    this.conversionQuotes.set(quoteId, quote);

    return quote;
  }

  /**
   * تنفيذ التحويل - Execute currency conversion
   */
  async executeConversion(
    userId: string,
    quoteId: string
  ): Promise<any> {
    const quote = this.conversionQuotes.get(quoteId);
    
    if (!quote) {
      throw new Error('Conversion quote not found or expired');
    }

    if (new Date() > quote.expiresAt) {
      this.conversionQuotes.delete(quoteId);
      throw new Error('Conversion quote has expired');
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const fromBalance = wallet.balances.find((b: any) => b.currency === quote.fromCurrency);
    const toBalance = wallet.balances.find((b: any) => b.currency === quote.toCurrency);

    if (!fromBalance || !toBalance) {
      throw new Error('Currency not supported');
    }

    if (Number(fromBalance.availableBalance) < quote.fromAmount) {
      throw new Error('Insufficient balance for conversion');
    }

    return await this.prisma.$transaction(async (tx: any) => {
      const newFromBalance = Number(fromBalance.balance) - quote.fromAmount;
      const newToBalance = Number(toBalance.balance) + quote.toAmount;

      // Update balances
      await tx.walletBalance.update({
        where: { id: fromBalance.id },
        data: {
          balance: newFromBalance,
          availableBalance: newFromBalance,
        },
      });

      await tx.walletBalance.update({
        where: { id: toBalance.id },
        data: {
          balance: newToBalance,
          availableBalance: newToBalance,
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CONVERSION',
          currency: quote.fromCurrency,
          amount: -quote.fromAmount,
          toCurrency: quote.toCurrency,
          toAmount: quote.toAmount,
          exchangeRate: quote.rate,
          fee: quote.fee,
          feeCurrency: quote.feeCurrency,
          balanceAfter: newFromBalance,
          status: 'COMPLETED',
          description: `Converted ${quote.fromAmount} ${quote.fromCurrency} to ${quote.toAmount.toFixed(2)} ${quote.toCurrency}`,
          completedAt: new Date(),
        },
      });

      // Create audit trail
      await this.createAuditTrailWithTx(tx, wallet.id, 'CONVERSION', userId, {
        transactionId: transaction.id,
        fromCurrency: quote.fromCurrency,
        toCurrency: quote.toCurrency,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        rate: quote.rate,
        fee: quote.fee,
      });

      // Delete used quote
      this.conversionQuotes.delete(quoteId);

      return {
        transactionId: transaction.id,
        from: {
          currency: quote.fromCurrency,
          amount: quote.fromAmount,
          newBalance: newFromBalance,
        },
        to: {
          currency: quote.toCurrency,
          amount: quote.toAmount,
          newBalance: newToBalance,
        },
        rate: quote.rate,
        fee: quote.fee,
      };
    });
  }

  /**
   * الحصول على تاريخ المعاملات - Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    filters: TransactionFilters = {}
  ): Promise<{ transactions: any[]; pagination: any }> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const { currency, type, status, startDate, endDate, limit = 20, offset = 0 } = filters;

    const whereClause: any = {
      walletId: wallet.id,
      ...(currency && { currency }),
      ...(type && { type }),
      ...(status && { status }),
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const transactions = await prisma.walletTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.walletTransaction.count({
      where: whereClause,
    });

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * الحصول على الرصيد الإجمالي - Get total balance in specified currency
   */
  async getTotalBalance(
    userId: string,
    displayCurrency: Currency = 'USD'
  ): Promise<any> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    let totalInDisplayCurrency = 0;
    const balanceDetails: any[] = [];

    for (const balance of wallet.balances) {
      const amount = Number(balance.balance);
      if (amount > 0) {
        try {
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
            inDisplayCurrency: conversion.to.amount,
          });
        } catch {
          balanceDetails.push({
            currency: balance.currency,
            amount,
            inDisplayCurrency: 0,
          });
        }
      }
    }

    return {
      totalBalance: totalInDisplayCurrency,
      displayCurrency,
      balances: balanceDetails,
      updatedAt: new Date(),
    };
  }

  /**
   * إنشاء سجل تدقيق - Create audit trail entry
   */
  private async createAuditTrail(
    walletId: string,
    action: string,
    performedBy: string,
    metadata?: any
  ): Promise<void> {
    await prisma.walletAuditLog.create({
      data: {
        walletId,
        action,
        performedBy,
        metadata: metadata || {},
        timestamp: new Date(),
      },
    });
  }

  /**
   * إنشاء سجل تدقيق داخل معاملة - Create audit trail within transaction
   */
  private async createAuditTrailWithTx(
    tx: any,
    walletId: string,
    action: string,
    performedBy: string,
    metadata?: any
  ): Promise<void> {
    await tx.walletAuditLog.create({
      data: {
        walletId,
        action,
        performedBy,
        metadata: metadata || {},
        timestamp: new Date(),
      },
    });
  }

  /**
   * الحصول على سجل التدقيق - Get audit log
   */
  async getAuditLog(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: any[]; total: number }> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const logs = await prisma.walletAuditLog.findMany({
      where: { walletId: wallet.id },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.walletAuditLog.count({
      where: { walletId: wallet.id },
    });

    return { logs, total };
  }
}

export const enhancedWalletService = new EnhancedWalletService();
