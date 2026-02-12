import { PayoutStatus, PayoutMethod, TransactionType, TransactionStatus, Currency, Prisma } from '@prisma/client';
import { prisma } from '../index';
import crypto from 'crypto';
import { Decimal } from 'decimal.js';
import { logger } from '../utils/logger';
import { updateSystemAccountBalance } from '../utils/systemAccounts';
import { createJournalEntries } from '../utils/journalEntries';
import { updateWalletBalance } from '../utils/walletBalance';
import { createAuditLog } from '../utils/audit';



interface PayoutAccountDetails {
  accountHolder: string;
  bankName?: string;
  bankCode?: string;
  branchCode?: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
}

interface CreatePayoutRequestData {
  userId: string;
  walletId: string;
  amount: number;
  currency: Currency;
  method: PayoutMethod;
  accountDetails: PayoutAccountDetails;
  description?: string;
  referenceId?: string;
  metadata?: any;
}

interface PayoutFilters {
  userId?: string;
  status?: PayoutStatus;
  method?: PayoutMethod;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export class PayoutService {
  private encryptionKey: string;
  private encryptionAlgorithm = 'aes-256-cbc';
  private MIN_PAYOUT_AMOUNT = 10;

  constructor() {
    this.encryptionKey = process.env.PAYOUT_ENCRYPTION_KEY || 'default-key-change-in-production';
    
    if (this.encryptionKey === 'default-key-change-in-production') {
      logger.warn('[PayoutService] WARNING: Using default encryption key. Set PAYOUT_ENCRYPTION_KEY in production!');
    }
  }

  /**
   * Encrypt account details
   */
  private encryptAccountDetails(details: PayoutAccountDetails): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(details), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt account details
   */
  // private decryptAccountDetails(encryptedData: string): PayoutAccountDetails {
  //   const parts = encryptedData.split(':');
  //   const iv = Buffer.from(parts[0], 'hex');
  //   const encrypted = parts[1];
  //   
  //   const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
  //   const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, key, iv);
  //   
  //   let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  //   decrypted += decipher.final('utf8');
  //   
  //   return JSON.parse(decrypted);
  // }

  /**
   * Create a payout request
   */
  async createPayoutRequest(data: CreatePayoutRequestData) {
    logger.info(`[PayoutService] Creating payout request for user ${data.userId}, amount: ${data.amount}`);

    // Validate minimum amount
    if (data.amount < this.MIN_PAYOUT_AMOUNT) {
      throw new Error(`Minimum payout amount is $${this.MIN_PAYOUT_AMOUNT}`);
    }

    // Check available balance
    const wallet = await prisma.wallet.findUnique({
      where: { id: data.walletId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.userId !== data.userId) {
      throw new Error('Wallet does not belong to user');
    }

    if (wallet.isFrozen) {
      throw new Error('Wallet is frozen');
    }

    // Compare Decimal values properly
    const availableBalance = new Decimal(wallet.availableBalance);
    const requestedAmount = new Decimal(data.amount);
    
    if (availableBalance.lessThan(requestedAmount)) {
      throw new Error(
        `Insufficient balance. Available: ${wallet.availableBalance}, Requested: ${data.amount}`
      );
    }

    // Encrypt account details
    const encryptedDetails = this.encryptAccountDetails(data.accountDetails);

    // Create payout request
    const payout = await prisma.payoutRequest.create({
      data: {
        userId: data.userId,
        walletId: data.walletId,
        amount: requestedAmount,
        currency: data.currency,
        method: data.method,
        accountDetails: encryptedDetails,
        referenceId: data.referenceId || null,
        metadata: data.metadata || null,
        status: PayoutStatus.PENDING,
      },
    });

    // Create transaction for balance hold
    const holdTransaction = await prisma.transaction.create({
      data: {
        walletId: data.walletId,
        userId: data.userId,
        type: TransactionType.PAYOUT_HOLD,
        status: TransactionStatus.COMPLETED,
        amount: requestedAmount.negated(),
        currency: data.currency,
        fee: 0,
        netAmount: requestedAmount.negated(),
        description: `Payout hold for request ${payout.id}`,
        referenceId: payout.id,
        metadata: data.metadata || null,
      },
    });

    // Update wallet balance (hold the amount)
    await updateWalletBalance(data.walletId, requestedAmount.negated().toNumber(), 'WITHDRAWAL');

    // Create journal entries for the hold (using withdrawal type for balance reduction)
    await createJournalEntries({
      transactionId: holdTransaction.id,
      walletId: data.walletId,
      userId: data.userId,
      amount: requestedAmount,
      currency: data.currency,
      transactionType: 'WITHDRAWAL',
      tx: prisma,
    });

    // Create audit log
    await createAuditLog({
      userId: data.userId,
      action: 'PAYOUT_REQUEST_CREATED',
      resourceType: 'PAYOUT_REQUEST',
      resourceId: payout.id,
      metadata: {
        amount: data.amount,
        currency: data.currency,
        method: data.method,
      },
    });

    return payout;
  }

  /**
   * Process a payout request
   */
  async processPayout(payoutId: string, processedBy: string) {
    logger.info(`[PayoutService] Processing payout request ${payoutId}`);

    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: {
        wallet: true,
        user: true,
      },
    });

    if (!payout) {
      throw new Error('Payout request not found');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new Error('Payout request is not in pending status');
    }

    // Update payout status to processing
    await prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.PROCESSING,
        processedBy,
        processedAt: new Date(),
      },
    });

    try {
      // Simulate bank processing (in real implementation, integrate with bank API)
      await this.simulateBankProcessing(payout);

      // Create actual payout transaction
      const payoutTransaction = await prisma.transaction.create({
        data: {
          walletId: payout.walletId,
          userId: payout.userId,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.COMPLETED,
          amount: payout.amount.negated(),
          currency: payout.currency,
          fee: 0,
          netAmount: payout.amount.negated(),
          description: `Payout to ${payout.method}`,
          referenceId: payout.id,
          metadata: payout.metadata ? JSON.stringify(payout.metadata) : Prisma.JsonNull,
        },
      });

      // Release hold and process actual payout
      await updateWalletBalance(payout.walletId, payout.amount.negated().toNumber(), 'WITHDRAWAL');

      // Update payout status to completed
      await prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.COMPLETED,
        },
      });

      // Create journal entries for the actual payout
      await createJournalEntries({
        transactionId: payoutTransaction.id,
        walletId: payout.walletId,
        userId: payout.userId,
        amount: payout.amount,
        currency: payout.currency,
        transactionType: 'WITHDRAWAL',
        tx: prisma,
      });

      // Update system accounts
      await updateSystemAccountBalance(
        'system-settlement-account',
        payout.amount.toNumber(),
        'DEBIT',
        `Payout ${payoutId} to ${payout.method}`
      );

      // Create audit log
      await createAuditLog({
        userId: payout.userId,
        action: 'PAYOUT_PROCESSED',
        resourceType: 'PAYOUT_REQUEST',
        resourceId: payoutId,
        metadata: {
          amount: payout.amount.toString(),
          currency: payout.currency,
          method: payout.method,
        },
      });

      return payout;
    } catch (error) {
      // Update payout status to failed
      await prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          failureReason: error instanceof Error ? error.message : String(error),
        },
      });

      // Release the hold and return funds to wallet
      await updateWalletBalance(payout.walletId, payout.amount.toNumber(), 'DEPOSIT');

      // Create audit log
      await createAuditLog({
        userId: payout.userId,
        action: 'PAYOUT_FAILED',
        resourceType: 'PAYOUT_REQUEST',
        resourceId: payoutId,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          amount: payout.amount.toString(),
          currency: payout.currency,
        },
      });

      throw error;
    }
  }

  /**
   * Get payout requests with filters
   */
  async getPayoutRequests(filters: PayoutFilters = {}) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.method) where.method = filters.method;
    if (filters.currency) where.currency = filters.currency;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    if (filters.minAmount || filters.maxAmount) {
      where.amount = {};
      if (filters.minAmount) where.amount.gte = filters.minAmount;
      if (filters.maxAmount) where.amount.lte = filters.maxAmount;
    }

    return await prisma.payoutRequest.findMany({
      where,
      include: {
        wallet: {
          select: {
            id: true,
            currency: true,
            balance: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get payout request by ID
   */
  async getPayoutRequest(payoutId: string, userId?: string) {
    const where: any = { id: payoutId };
    if (userId) where.userId = userId;

    const payout = await prisma.payoutRequest.findUnique({
      where,
      include: {
        wallet: {
          select: {
            id: true,
            currency: true,
            balance: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!payout) {
      throw new Error('Payout request not found');
    }

    return payout;
  }

  /**
   * Simulate bank processing (for development/testing)
   */
  private async simulateBankProcessing(payout: any) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures (10% failure rate for testing)
    if (Math.random() < 0.1) {
      throw new Error('Bank processing failed: Insufficient funds in settlement account');
    }
    
    logger.info(`[PayoutService] Simulated bank processing completed for payout ${payout.id}`);
  }
}