// ============================================================
// Settlement Service - Real-time Processing & Fee Calculation
// Integrates ledger, compliance, and audit for complete settlement handling
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  FeeCalculation,
  FeeBreakdown,
  FeeConfig,
  LedgerEntry,
  AccountType,
  LedgerEntryType,
} from '../types/ledger.types';
import { ledgerService } from './ledger.service';
import { complianceService } from './compliance.service';
import { auditService } from './audit.service';
import { rollbackService } from './rollback.service';
import { TriggerType } from '../types/ledger.types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Default fee configuration
const DEFAULT_FEE_CONFIG: FeeConfig = {
  platformFeeRate: new Decimal('0.02'), // 2%
  processingFeeRate: new Decimal('0.029'), // 2.9%
  processingFeeFixed: new Decimal('0.30'), // $0.30
  minPlatformFee: new Decimal('1.00'),
  maxPlatformFee: new Decimal('1000.00'),
  feeExemptUserIds: [],
};

export class SettlementService {
  private feeConfig: FeeConfig = DEFAULT_FEE_CONFIG;

  /**
   * Configure fee settings
   */
  configureFees(config: Partial<FeeConfig>): void {
    this.feeConfig = { ...this.feeConfig, ...config };
    logger.info('Fee configuration updated', { config: this.feeConfig });
  }

  /**
   * Calculate fees for a transaction
   */
  calculateFees(
    amount: Decimal,
    userId: number
  ): FeeCalculation {
    const breakdown: FeeBreakdown[] = [];
    let platformFee: Decimal;
    let processingFee: Decimal;

    // Check if user is fee exempt
    if (this.feeConfig.feeExemptUserIds.includes(userId)) {
      platformFee = new Decimal(0);
      processingFee = new Decimal(0);
    } else {
      // Calculate platform fee
      platformFee = amount.times(this.feeConfig.platformFeeRate);
      platformFee = Decimal.max(platformFee, this.feeConfig.minPlatformFee);
      platformFee = Decimal.min(platformFee, this.feeConfig.maxPlatformFee);

      // Calculate processing fee
      const processingPercentage = amount.times(this.feeConfig.processingFeeRate);
      processingFee = processingPercentage.plus(this.feeConfig.processingFeeFixed);

      breakdown.push({
        feeType: 'PLATFORM_FEE',
        rate: this.feeConfig.platformFeeRate,
        amount: platformFee,
        description: 'Platform service fee',
      });

      breakdown.push({
        feeType: 'PROCESSING_FEE',
        rate: this.feeConfig.processingFeeRate,
        amount: processingFee,
        description: 'Payment processing fee',
      });
    }

    const totalFees = platformFee.plus(processingFee);
    const netAmount = amount.minus(totalFees);

    return {
      platformFee,
      processingFee,
      totalFees,
      netAmount,
      breakdown,
    };
  }

  /**
   * Process a complete settlement with all validations
   */
  async processSettlement(params: {
    fromUserId: number;
    toUserId: number;
    amount: Decimal;
    currency: string;
    referenceType: string;
    referenceId: string;
    description: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    fees?: FeeCalculation;
    error?: string;
  }> {
    logger.info('Processing settlement', {
      fromUserId: params.fromUserId,
      toUserId: params.toUserId,
      amount: params.amount.toString(),
      currency: params.currency,
    });

    try {
      // 1. Compliance check
      const complianceResult = await complianceService.performTransactionCheck(
        params.fromUserId,
        params.amount
      );

      if (!complianceResult.passed) {
        throw new Error(`Compliance check failed: ${complianceResult.reason}`);
      }

      // 2. Calculate fees
      const fees = this.calculateFees(params.amount, params.fromUserId);

      // 3. Get user wallets
      const fromWallet = await prisma.wallet.findFirst({
        where: {
          userId: params.fromUserId,
          currency: params.currency,
        },
      });

      const toWallet = await prisma.wallet.findFirst({
        where: {
          userId: params.toUserId,
          currency: params.currency,
        },
      });

      if (!fromWallet || !toWallet) {
        throw new Error('Wallets not found for settlement');
      }

      // 4. Validate balance
      if (new Decimal(fromWallet.availableBalance).lessThan(params.amount)) {
        throw new Error('Insufficient balance');
      }

      // 5. Generate transaction ID
      const transactionId = `SETT-${Date.now().toString(36).toUpperCase()}`;

      // 6. Create double-entry ledger entries
      // From user: Debit wallet (credit the account)
      const fromAccountId = `WALLET-${fromWallet.id}`;
      const toAccountId = `WALLET-${toWallet.id}`;
      const platformFeeAccount = 'PLATFORM_FEE_POOL';
      const processingFeeAccount = 'PROCESSING_FEE_POOL';

      // Create multi-entry for settlement
      const entries = await ledgerService.createMultiEntry(
        transactionId,
        params.description,
        [
          // Debit from user's wallet
          {
            accountType: AccountType.WALLET_AVAILABLE,
            accountId: fromAccountId,
            debitAmount: new Decimal(0),
            creditAmount: params.amount,
            currency: params.currency,
          },
          // Credit to recipient's wallet
          {
            accountType: AccountType.WALLET_AVAILABLE,
            accountId: toAccountId,
            debitAmount: fees.netAmount,
            creditAmount: new Decimal(0),
            currency: params.currency,
          },
          // Credit platform fee
          {
            accountType: AccountType.PLATFORM_FEE,
            accountId: platformFeeAccount,
            debitAmount: fees.platformFee,
            creditAmount: new Decimal(0),
            currency: params.currency,
          },
          // Credit processing fee
          {
            accountType: AccountType.PROCESSING_FEE,
            accountId: processingFeeAccount,
            debitAmount: fees.processingFee,
            creditAmount: new Decimal(0),
            currency: params.currency,
          },
        ],
        params.referenceType,
        params.referenceId
      );

      // 7. Update wallet balances
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: fromWallet.id },
          data: {
            availableBalance: new Decimal(fromWallet.availableBalance.toString()).minus(
              params.amount
            ),
          },
        }),
        prisma.wallet.update({
          where: { id: toWallet.id },
          data: {
            availableBalance: new Decimal(toWallet.availableBalance.toString()).plus(
              fees.netAmount
            ),
          },
        }),
      ]);

      // 8. Update transaction limits
      await complianceService.updateLimitUsage(
        params.fromUserId,
        'DAILY_TRANSACTION' as any,
        params.amount
      );

      // 9. Create wallet transaction records
      await prisma.walletTransaction.createMany({
        data: [
          {
            walletId: fromWallet.id,
            transactionType: 'SETTLEMENT_OUT' as any,
            amount: params.amount,
            referenceType: params.referenceType,
            referenceId: params.referenceId,
            status: 'COMPLETED' as any,
          },
          {
            walletId: toWallet.id,
            transactionType: 'SETTLEMENT_IN' as any,
            amount: fees.netAmount,
            referenceType: params.referenceType,
            referenceId: params.referenceId,
            status: 'COMPLETED' as any,
          },
        ],
      });

      // 10. Audit logging
      await auditService.log({
        action: 'SETTLEMENT_PROCESSED',
        entityType: 'Settlement',
        entityId: transactionId,
        userId: params.fromUserId,
        description: `Settlement: ${params.description}`,
        metadata: {
          toUserId: params.toUserId,
          amount: params.amount.toString(),
          netAmount: fees.netAmount.toString(),
          platformFee: fees.platformFee.toString(),
          processingFee: fees.processingFee.toString(),
          totalFees: fees.totalFees.toString(),
          currency: params.currency,
        },
      });

      logger.info('Settlement processed successfully', {
        transactionId,
        fromUserId: params.fromUserId,
        toUserId: params.toUserId,
        amount: params.amount.toString(),
      });

      return {
        success: true,
        transactionId,
        fees,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Settlement failed', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Rollback a settlement
   */
  async rollbackSettlement(
    transactionId: string,
    reason: string,
    triggeredBy: number
  ): Promise<{ success: boolean; error?: string }> {
    logger.info('Initiating settlement rollback', {
      transactionId,
      reason,
      triggeredBy,
    });

    try {
      // Get the original settlement entries
      const entries = await ledgerService.getEntriesByTransactionId(transactionId);

      if (entries.length === 0) {
        throw new Error('Transaction not found');
      }

      // Create rollback record
      const rollback = await rollbackService.createRollback({
        originalTransactionId: transactionId,
        entityType: 'Settlement',
        entityId: transactionId,
        reason,
        triggeredBy,
        triggerType: TriggerType.MANUAL,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Settlement rollback failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get settlement details
   */
  async getSettlementDetails(transactionId: string): Promise<{
    transactionId: string;
    entries: LedgerEntry[];
    totalDebits: Decimal;
    totalCredits: Decimal;
    isBalanced: boolean;
  }> {
    const summary = await ledgerService.getTransactionSummary(transactionId);
    return summary;
  }

  /**
   * Get fee statistics
   */
  async getFeeStats(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalPlatformFees: Decimal;
    totalProcessingFees: Decimal;
    transactionCount: number;
    averageFee: Decimal;
  }> {
    // Get ledger entries for fees
    const platformFeeEntries = await prisma.ledgerEntry.findMany({
      where: {
        accountType: 'PLATFORM_FEE' as any,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const processingFeeEntries = await prisma.ledgerEntry.findMany({
      where: {
        accountType: 'PROCESSING_FEE' as any,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalPlatformFees = platformFeeEntries.reduce(
      (sum, e) => sum.plus(e.debitAmount.toString()),
      new Decimal(0)
    );

    const totalProcessingFees = processingFeeEntries.reduce(
      (sum, e) => sum.plus(e.debitAmount.toString()),
      new Decimal(0)
    );

    const transactionCount = platformFeeEntries.length;
    const totalFees = totalPlatformFees.plus(totalProcessingFees);
    const averageFee = transactionCount > 0
      ? totalFees.dividedBy(transactionCount)
      : new Decimal(0);

    return {
      totalPlatformFees,
      totalProcessingFees,
      transactionCount,
      averageFee,
    };
  }
}

export const settlementService = new SettlementService();
