// ============================================================
// Unified Wallet Service - Consolidated Wallet & Ledger System
// ============================================================

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { CustomError } from '../utils/error-handler';
import { RedisClient } from '../utils/redis-client';

export interface WalletBalance {
  currency: string;
  available: number;
  pending: number;
  total: number;
  lastUpdated: Date;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  currency: string;
  type: 'debit' | 'credit';
  amount: number;
  balance: number;
  description: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  fee: number;
  netAmount: number;
}

export interface SettlementRequest {
  buyerWalletId: string;
  sellerWalletId: string;
  amount: number;
  currency: string;
  orderId: string;
  fees?: {
    platformFee?: number;
    processingFee?: number;
    conversionFee?: number;
  };
  metadata?: Record<string, any>;
}

export interface EscrowTransaction {
  id: string;
  buyerWalletId: string;
  sellerWalletId: string;
  amount: number;
  currency: string;
  orderId: string;
  status: 'pending' | 'held' | 'released' | 'cancelled' | 'disputed';
  releaseConditions: {
    type: 'manual' | 'automatic' | 'time_based' | 'milestone';
    conditions?: Record<string, any>;
  };
  holdDuration?: number; // in milliseconds
  createdAt: Date;
  releasedAt?: Date;
}

export interface PayoutRequest {
  walletId: string;
  amount: number;
  currency: string;
  destination: {
    type: 'bank_account' | 'paypal' | 'stripe' | 'crypto';
    details: Record<string, any>;
  };
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface ComplianceCheck {
  userId: string;
  transactionType: 'deposit' | 'withdrawal' | 'transfer' | 'conversion' | 'settlement';
  amount: number;
  currency: string;
  counterpartyId?: string;
  metadata?: Record<string, any>;
}

export class UnifiedWalletService extends EventEmitter {
  private prisma: PrismaClient;
  private logger: Logger;
  private redis: RedisClient;
  private eventBus: EventEmitter;
  
  // Supported currencies and their configurations
  private supportedCurrencies = [
    'USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'
  ];

  // Fee structure
  private feeStructure = {
    platform: 0.025, // 2.5%
    processing: 0.015, // 1.5%
    conversion: 0.01, // 1%
    minimumFee: 0.50 // Minimum fee in USD
  };

  constructor(prisma: PrismaClient, logger: Logger, redis: RedisClient) {
    super();
    this.prisma = prisma;
    this.logger = logger;
    this.redis = redis;
    this.eventBus = new EventEmitter();
  }

  /**
   * Create a new wallet for a user
   */
  async createWallet(userId: string, currency: string, options?: {
    type?: 'personal' | 'business';
    limits?: {
      daily?: number;
      monthly?: number;
      yearly?: number;
    };
  }): Promise<string> {
    try {
      // Validate currency
      if (!this.supportedCurrencies.includes(currency)) {
        throw new CustomError(`Unsupported currency: ${currency}`, 400);
      }

      // Check if wallet already exists
      const existingWallet = await this.prisma.wallet.findUnique({
        where: { userId_currency: { userId, currency } }
      });

      if (existingWallet) {
        throw new CustomError(`Wallet already exists for user ${userId} in ${currency}`, 409);
      }

      const walletId = uuidv4();

      // Create wallet
      const wallet = await this.prisma.wallet.create({
        data: {
          id: walletId,
          userId,
          currency,
          type: options?.type || 'personal',
          status: 'active',
          balance: 0,
          pendingBalance: 0,
          totalBalance: 0,
          dailyLimit: options?.limits?.daily || 10000,
          monthlyLimit: options?.limits?.monthly || 100000,
          yearlyLimit: options?.limits?.yearly || 1000000,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      this.logger.info(`Wallet created: ${walletId} for user ${userId} in ${currency}`);
      this.emit('wallet.created', { walletId, userId, currency });

      return walletId;
    } catch (error) {
      this.logger.error('Failed to create wallet', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(walletId: string): Promise<WalletBalance> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet) {
        throw new CustomError('Wallet not found', 404);
      }

      return {
        currency: wallet.currency,
        available: wallet.balance,
        pending: wallet.pendingBalance,
        total: wallet.totalBalance,
        lastUpdated: wallet.updatedAt
      };
    } catch (error) {
      this.logger.error('Failed to get wallet balance', error);
      throw error;
    }
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: string): Promise<WalletBalance[]> {
    try {
      const wallets = await this.prisma.wallet.findMany({
        where: { userId, status: 'active' }
      });

      return wallets.map(wallet => ({
        currency: wallet.currency,
        available: wallet.balance,
        pending: wallet.pendingBalance,
        total: wallet.totalBalance,
        lastUpdated: wallet.updatedAt
      }));
    } catch (error) {
      this.logger.error('Failed to get user wallets', error);
      throw error;
    }
  }

  /**
   * Deposit funds to wallet
   */
  async deposit(walletId: string, amount: number, referenceId: string, metadata?: Record<string, any>): Promise<LedgerEntry> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet) {
        throw new CustomError('Wallet not found', 404);
      }

      // Create ledger entry
      const ledgerEntry = await this.createLedgerEntry({
        walletId,
        currency: wallet.currency,
        type: 'credit',
        amount,
        description: 'Deposit',
        referenceId,
        metadata
      });

      // Update wallet balance
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: amount },
          totalBalance: { increment: amount },
          updatedAt: new Date()
        }
      });

      this.logger.info(`Deposit completed: ${amount} ${wallet.currency} to wallet ${walletId}`);
      this.emit('wallet.deposit', { walletId, amount, currency: wallet.currency, referenceId });

      return ledgerEntry;
    } catch (error) {
      this.logger.error('Failed to deposit funds', error);
      throw error;
    }
  }

  /**
   * Withdraw funds from wallet
   */
  async withdraw(walletId: string, amount: number, referenceId: string, metadata?: Record<string, any>): Promise<LedgerEntry> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet) {
        throw new CustomError('Wallet not found', 404);
      }

      // Check sufficient balance
      if (wallet.balance < amount) {
        throw new CustomError('Insufficient balance', 400);
      }

      // Create ledger entry
      const ledgerEntry = await this.createLedgerEntry({
        walletId,
        currency: wallet.currency,
        type: 'debit',
        amount,
        description: 'Withdrawal',
        referenceId,
        metadata
      });

      // Update wallet balance
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: { decrement: amount },
          totalBalance: { decrement: amount },
          updatedAt: new Date()
        }
      });

      this.logger.info(`Withdrawal completed: ${amount} ${wallet.currency} from wallet ${walletId}`);
      this.emit('wallet.withdrawal', { walletId, amount, currency: wallet.currency, referenceId });

      return ledgerEntry;
    } catch (error) {
      this.logger.error('Failed to withdraw funds', error);
      throw error;
    }
  }

  /**
   * Transfer funds between wallets
   */
  async transfer(fromWalletId: string, toWalletId: string, amount: number, referenceId: string, metadata?: Record<string, any>): Promise<{ fromEntry: LedgerEntry; toEntry: LedgerEntry }> {
    try {
      // Get both wallets
      const [fromWallet, toWallet] = await Promise.all([
        this.prisma.wallet.findUnique({ where: { id: fromWalletId } }),
        this.prisma.wallet.findUnique({ where: { id: toWalletId } })
      ]);

      if (!fromWallet || !toWallet) {
        throw new CustomError('One or both wallets not found', 404);
      }

      // Check sufficient balance
      if (fromWallet.balance < amount) {
        throw new CustomError('Insufficient balance', 400);
      }

      // Handle currency conversion if needed
      if (fromWallet.currency !== toWallet.currency) {
        return this.handleCrossCurrencyTransfer(fromWalletId, toWalletId, amount, referenceId, metadata);
      }

      // Create ledger entries
      const [fromEntry, toEntry] = await Promise.all([
        this.createLedgerEntry({
          walletId: fromWalletId,
          currency: fromWallet.currency,
          type: 'debit',
          amount,
          description: `Transfer to ${toWalletId}`,
          referenceId,
          metadata
        }),
        this.createLedgerEntry({
          walletId: toWalletId,
          currency: toWallet.currency,
          type: 'credit',
          amount,
          description: `Transfer from ${fromWalletId}`,
          referenceId,
          metadata
        })
      ]);

      // Update wallet balances
      await Promise.all([
        this.prisma.wallet.update({
          where: { id: fromWalletId },
          data: {
            balance: { decrement: amount },
            totalBalance: { decrement: amount },
            updatedAt: new Date()
          }
        }),
        this.prisma.wallet.update({
          where: { id: toWalletId },
          data: {
            balance: { increment: amount },
            totalBalance: { increment: amount },
            updatedAt: new Date()
          }
        })
      ]);

      this.logger.info(`Transfer completed: ${amount} ${fromWallet.currency} from ${fromWalletId} to ${toWalletId}`);
      this.emit('wallet.transfer', { fromWalletId, toWalletId, amount, currency: fromWallet.currency, referenceId });

      return { fromEntry, toEntry };
    } catch (error) {
      this.logger.error('Failed to transfer funds', error);
      throw error;
    }
  }

  /**
   * Create settlement between buyer and seller
   */
  async createSettlement(request: SettlementRequest): Promise<LedgerEntry[]> {
    try {
      const { buyerWalletId, sellerWalletId, amount, currency, orderId, fees = {}, metadata } = request;

      // Get wallets
      const [buyerWallet, sellerWallet] = await Promise.all([
        this.prisma.wallet.findUnique({ where: { id: buyerWalletId } }),
        this.prisma.wallet.findUnique({ where: { id: sellerWalletId } })
      ]);

      if (!buyerWallet || !sellerWallet) {
        throw new CustomError('One or both wallets not found', 404);
      }

      // Check buyer balance
      if (buyerWallet.balance < amount) {
        throw new CustomError('Insufficient buyer balance', 400);
      }

      // Calculate fees
      const platformFee = fees.platformFee || (amount * this.feeStructure.platform);
      const processingFee = fees.processingFee || (amount * this.feeStructure.processing);
      const totalFees = platformFee + processingFee;
      const netAmount = amount - totalFees;

      // Create ledger entries
      const entries: LedgerEntry[] = [];

      // Debit buyer
      entries.push(await this.createLedgerEntry({
        walletId: buyerWalletId,
        currency,
        type: 'debit',
        amount,
        description: `Purchase for order ${orderId}`,
        referenceId: orderId,
        metadata
      }));

      // Credit seller (net amount)
      entries.push(await this.createLedgerEntry({
        walletId: sellerWalletId,
        currency,
        type: 'credit',
        amount: netAmount,
        description: `Sale for order ${orderId}`,
        referenceId: orderId,
        metadata
      }));

      // Credit platform (fees)
      if (totalFees > 0) {
        entries.push(await this.createLedgerEntry({
          walletId: 'platform-fees', // Platform wallet
          currency,
          type: 'credit',
          amount: totalFees,
          description: `Platform fees for order ${orderId}`,
          referenceId: orderId,
          metadata: {
            platformFee,
            processingFee,
            orderId
          }
        }));
      }

      // Update wallet balances
      await Promise.all([
        this.prisma.wallet.update({
          where: { id: buyerWalletId },
          data: {
            balance: { decrement: amount },
            totalBalance: { decrement: amount },
            updatedAt: new Date()
          }
        }),
        this.prisma.wallet.update({
          where: { id: sellerWalletId },
          data: {
            balance: { increment: netAmount },
            totalBalance: { increment: netAmount },
            updatedAt: new Date()
          }
        })
      ]);

      this.logger.info(`Settlement completed: ${amount} ${currency} for order ${orderId}`);
      this.emit('wallet.settlement', { buyerWalletId, sellerWalletId, amount, currency, orderId, fees: totalFees });

      return entries;
    } catch (error) {
      this.logger.error('Failed to create settlement', error);
      throw error;
    }
  }

  /**
   * Create escrow transaction
   */
  async createEscrowTransaction(transaction: Omit<EscrowTransaction, 'id' | 'createdAt' | 'releasedAt'>): Promise<EscrowTransaction> {
    try {
      const escrow = await this.prisma.escrowTransaction.create({
        data: {
          id: uuidv4(),
          ...transaction,
          createdAt: new Date()
        }
      });

      // Hold funds from buyer
      await this.prisma.wallet.update({
        where: { id: transaction.buyerWalletId },
        data: {
          balance: { decrement: transaction.amount },
          pendingBalance: { increment: transaction.amount },
          updatedAt: new Date()
        }
      });

      this.logger.info(`Escrow created: ${escrow.id} for order ${transaction.orderId}`);
      this.emit('escrow.created', { escrowId: escrow.id, orderId: transaction.orderId });

      return escrow;
    } catch (error) {
      this.logger.error('Failed to create escrow transaction', error);
      throw error;
    }
  }

  /**
   * Release escrow funds
   */
  async releaseEscrow(escrowId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const escrow = await this.prisma.escrowTransaction.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        throw new CustomError('Escrow transaction not found', 404);
      }

      if (escrow.status !== 'held') {
        throw new CustomError('Escrow transaction cannot be released', 400);
      }

      // Update escrow status
      await this.prisma.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: 'released',
          releasedAt: new Date()
        }
      });

      // Release funds to seller
      await Promise.all([
        this.prisma.wallet.update({
          where: { id: escrow.buyerWalletId },
          data: {
            pendingBalance: { decrement: escrow.amount },
            updatedAt: new Date()
          }
        }),
        this.prisma.wallet.update({
          where: { id: escrow.sellerWalletId },
          data: {
            balance: { increment: escrow.amount },
            totalBalance: { increment: escrow.amount },
            updatedAt: new Date()
          }
        })
      ]);

      // Create ledger entry for release
      await this.createLedgerEntry({
        walletId: escrow.sellerWalletId,
        currency: escrow.currency,
        type: 'credit',
        amount: escrow.amount,
        description: `Escrow release for order ${escrow.orderId}`,
        referenceId: escrow.orderId,
        metadata
      });

      this.logger.info(`Escrow released: ${escrowId} for order ${escrow.orderId}`);
      this.emit('escrow.released', { escrowId, orderId: escrow.orderId });
    } catch (error) {
      this.logger.error('Failed to release escrow', error);
      throw error;
    }
  }

  /**
   * Convert currency
   */
  async convertCurrency(fromWalletId: string, toWalletId: string, fromAmount: number, toCurrency: string): Promise<CurrencyConversion> {
    try {
      const fromWallet = await this.prisma.wallet.findUnique({
        where: { id: fromWalletId }
      });

      if (!fromWallet) {
        throw new CustomError('Source wallet not found', 404);
      }

      // Check sufficient balance
      if (fromWallet.balance < fromAmount) {
        throw new CustomError('Insufficient balance for conversion', 400);
      }

      // Get exchange rate (mock implementation - should use real forex service)
      const exchangeRate = await this.getExchangeRate(fromWallet.currency, toCurrency);
      const toAmount = fromAmount * exchangeRate;
      const conversionFee = fromAmount * this.feeStructure.conversion;
      const netFromAmount = fromAmount - conversionFee;
      const netToAmount = netFromAmount * exchangeRate;

      // Perform conversion
      await this.withdraw(fromWalletId, fromAmount, `conversion-${Date.now()}`, {
        type: 'conversion',
        toCurrency,
        exchangeRate,
        conversionFee
      });

      // Deposit converted amount
      await this.deposit(toWalletId, netToAmount, `conversion-${Date.now()}`, {
        type: 'conversion',
        fromCurrency: fromWallet.currency,
        exchangeRate,
        conversionFee
      });

      this.logger.info(`Currency conversion: ${fromAmount} ${fromWallet.currency} -> ${netToAmount} ${toCurrency}`);

      return {
        fromCurrency: fromWallet.currency,
        toCurrency,
        fromAmount,
        toAmount: netToAmount,
        exchangeRate,
        fee: conversionFee,
        netAmount: netToAmount
      };
    } catch (error) {
      this.logger.error('Failed to convert currency', error);
      throw error;
    }
  }

  /**
   * Get ledger entries for a wallet
   */
  async getLedgerEntries(walletId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    type?: 'debit' | 'credit';
  }): Promise<{ entries: LedgerEntry[]; total: number }> {
    try {
      const where: any = { walletId };

      if (options?.startDate) {
        where.createdAt = { gte: options.startDate };
      }

      if (options?.endDate) {
        where.createdAt = { ...where.createdAt, lte: options.endDate };
      }

      if (options?.type) {
        where.type = options.type;
      }

      const [entries, total] = await Promise.all([
        this.prisma.ledgerEntry.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: options?.limit || 50,
          skip: options?.offset || 0
        }),
        this.prisma.ledgerEntry.count({ where })
      ]);

      return {
        entries: entries.map(entry => ({
          id: entry.id,
          walletId: entry.walletId,
          currency: entry.currency,
          type: entry.type as 'debit' | 'credit',
          amount: entry.amount,
          balance: entry.balance,
          description: entry.description,
          referenceId: entry.referenceId || undefined,
          metadata: entry.metadata || undefined,
          createdAt: entry.createdAt
        })),
        total
      };
    } catch (error) {
      this.logger.error('Failed to get ledger entries', error);
      throw error;
    }
  }

  /**
   * Process payout request
   */
  async processPayout(request: PayoutRequest): Promise<void> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: request.walletId }
      });

      if (!wallet) {
        throw new CustomError('Wallet not found', 404);
      }

      // Check sufficient balance
      if (wallet.balance < request.amount) {
        throw new CustomError('Insufficient balance for payout', 400);
      }

      // Perform compliance check
      await this.performComplianceCheck({
        userId: wallet.userId,
        transactionType: 'withdrawal',
        amount: request.amount,
        currency: request.currency,
        metadata: {
          destinationType: request.destination.type,
          referenceId: request.referenceId
        }
      });

      // Withdraw funds
      await this.withdraw(request.walletId, request.amount, request.referenceId || `payout-${Date.now()}`, {
        type: 'payout',
        destinationType: request.destination.type,
        destinationDetails: request.destination.details
      });

      // Create payout record
      await this.prisma.payout.create({
        data: {
          id: uuidv4(),
          walletId: request.walletId,
          amount: request.amount,
          currency: request.currency,
          destinationType: request.destination.type,
          destinationDetails: request.destination.details,
          referenceId: request.referenceId,
          status: 'pending',
          metadata: request.metadata,
          createdAt: new Date()
        }
      });

      this.logger.info(`Payout processed: ${request.amount} ${request.currency} from wallet ${request.walletId}`);
      this.emit('payout.created', { walletId: request.walletId, amount: request.amount, currency: request.currency });
    } catch (error) {
      this.logger.error('Failed to process payout', error);
      throw error;
    }
  }

  /**
   * Perform compliance check
   */
  async performComplianceCheck(check: ComplianceCheck): Promise<{ approved: boolean; reason?: string }> {
    try {
      // Mock compliance check - in production, integrate with AML/KYC services
      const { userId, transactionType, amount, currency } = check;

      // Check daily limits
      const dailyTotal = await this.getDailyTransactionTotal(userId, transactionType);
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return { approved: false, reason: 'User not found' };
      }

      // Check against user limits
      const limits = await this.getUserLimits(userId);
      if (dailyTotal + amount > limits.daily) {
        return { approved: false, reason: 'Daily limit exceeded' };
      }

      // Check transaction amount limits
      if (amount > limits.perTransaction) {
        return { approved: false, reason: 'Transaction amount exceeds limit' };
      }

      // Check KYC status
      if (amount > 1000 && !user.kycVerified) {
        return { approved: false, reason: 'KYC verification required for amounts over $1000' };
      }

      // Log compliance check
      await this.prisma.complianceCheck.create({
        data: {
          id: uuidv4(),
          userId,
          transactionType,
          amount,
          currency,
          counterpartyId: check.counterpartyId,
          status: 'approved',
          metadata: check.metadata,
          createdAt: new Date()
        }
      });

      return { approved: true };
    } catch (error) {
      this.logger.error('Compliance check failed', error);
      return { approved: false, reason: 'Internal error' };
    }
  }

  // Private helper methods

  private async createLedgerEntry(data: {
    walletId: string;
    currency: string;
    type: 'debit' | 'credit';
    amount: number;
    description: string;
    referenceId?: string;
    metadata?: Record<string, any>;
  }): Promise<LedgerEntry> {
    const entry = await this.prisma.ledgerEntry.create({
      data: {
        id: uuidv4(),
        ...data,
        balance: await this.calculateNewBalance(data.walletId, data.type, data.amount),
        createdAt: new Date()
      }
    });

    return {
      id: entry.id,
      walletId: entry.walletId,
      currency: entry.currency,
      type: entry.type as 'debit' | 'credit',
      amount: entry.amount,
      balance: entry.balance,
      description: entry.description,
      referenceId: entry.referenceId || undefined,
      metadata: entry.metadata || undefined,
      createdAt: entry.createdAt
    };
  }

  private async calculateNewBalance(walletId: string, type: 'debit' | 'credit', amount: number): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: { balance: true }
    });

    if (!wallet) {
      throw new CustomError('Wallet not found', 404);
    }

    return type === 'credit' ? wallet.balance + amount : wallet.balance - amount;
  }

  private async handleCrossCurrencyTransfer(fromWalletId: string, toWalletId: string, amount: number, referenceId: string, metadata?: Record<string, any>): Promise<{ fromEntry: LedgerEntry; toEntry: LedgerEntry }> {
    // This would involve more complex forex operations
    // For now, throw an error indicating this needs forex service integration
    throw new CustomError('Cross-currency transfers require forex service integration', 501);
  }

  private async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Mock exchange rates - in production, integrate with real forex service
    const mockRates: Record<string, number> = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.73,
      'EUR-USD': 1.18,
      'EUR-GBP': 0.86,
      'GBP-USD': 1.37,
      'GBP-EUR': 1.16
    };

    const key = `${fromCurrency}-${toCurrency}`;
    const rate = mockRates[key];

    if (!rate) {
      throw new CustomError(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`, 400);
    }

    return rate;
  }

  private async getDailyTransactionTotal(userId: string, transactionType: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.ledgerEntry.aggregate({
      where: {
        wallet: { userId },
        type: transactionType === 'deposit' ? 'credit' : 'debit',
        createdAt: { gte: today }
      },
      _sum: { amount: true }
    });

    return result._sum.amount || 0;
  }

  private async getUserLimits(userId: string): Promise<{ daily: number; monthly: number; yearly: number; perTransaction: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycVerified: true, userType: true }
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Base limits
    let limits = {
      daily: 1000,
      monthly: 10000,
      yearly: 100000,
      perTransaction: 500
    };

    // Adjust based on KYC status and user type
    if (user.kycVerified) {
      limits = {
        daily: 10000,
        monthly: 100000,
        yearly: 1000000,
        perTransaction: 5000
      };
    }

    if (user.userType === 'business') {
      limits = {
        daily: 50000,
        monthly: 500000,
        yearly: 5000000,
        perTransaction: 25000
      };
    }

    return limits;
  }
}