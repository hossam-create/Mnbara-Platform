// ============================================================
// Ledger Service - Double-Entry Bookkeeping System
// Implements proper debit/credit tracking for all financial movements
// ============================================================

import { PrismaClient, LedgerEntry as PrismaLedgerEntry } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  LedgerEntry,
  LedgerEntryType,
  AccountType,
  CreateLedgerEntryInput,
  LedgerBalance,
} from '../types/ledger.types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class LedgerService {
  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `TXN-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Create a single ledger entry
   */
  async createEntry(input: CreateLedgerEntryInput): Promise<LedgerEntry> {
    logger.info('Creating ledger entry', {
      transactionId: input.transactionId,
      accountType: input.accountType,
      accountId: input.accountId,
      debit: input.debitAmount.toString(),
      credit: input.creditAmount.toString(),
    });

    // Calculate running balance
    const previousBalance = await this.getAccountBalance(
      input.accountType,
      input.accountId,
      input.currency
    );

    const debitAmount = new Decimal(input.debitAmount);
    const creditAmount = new Decimal(input.creditAmount);
    const runningBalance = previousBalance
      .plus(debitAmount)
      .minus(creditAmount);

    const entry = await prisma.ledgerEntry.create({
      data: {
        transactionId: input.transactionId,
        entryType: input.entryType as any,
        accountType: input.accountType as any,
        accountId: input.accountId,
        debitAmount: debitAmount,
        creditAmount: creditAmount,
        currency: input.currency,
        runningBalance: runningBalance,
        description: input.description,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      },
    });

    logger.debug('Ledger entry created', { entryId: entry.id });

    return this.mapToLedgerEntry(entry);
  }

  /**
   * Create balanced double-entry (debit and credit)
   */
  async createDoubleEntry(
    transactionId: string,
    description: string,
    debitAccount: {
      accountType: AccountType;
      accountId: string;
      amount: Decimal;
      currency: string;
    },
    creditAccount: {
      accountType: AccountType;
      accountId: string;
      amount: Decimal;
      currency: string;
    },
    referenceType?: string,
    referenceId?: string
  ): Promise<{ debitEntry: LedgerEntry; creditEntry: LedgerEntry }> {
    logger.info('Creating double-entry transaction', {
      transactionId,
      description,
      debitAccount: debitAccount.accountType,
      creditAccount: creditAccount.accountType,
      amount: debitAccount.amount.toString(),
    });

    // Both entries must have same amount
    const amount = debitAccount.amount;

    // Create debit entry
    const debitEntry = await this.createEntry({
      transactionId,
      entryType: LedgerEntryType.JOURNAL,
      accountType: debitAccount.accountType,
      accountId: debitAccount.accountId,
      debitAmount: amount,
      creditAmount: new Decimal(0),
      currency: debitAccount.currency,
      description: `${description} - Debit`,
      referenceType,
      referenceId,
    });

    // Create credit entry
    const creditEntry = await this.createEntry({
      transactionId,
      entryType: LedgerEntryType.JOURNAL,
      accountType: creditAccount.accountType,
      accountId: creditAccount.accountId,
      debitAmount: new Decimal(0),
      creditAmount: amount,
      currency: creditAccount.currency,
      description: `${description} - Credit`,
      referenceType,
      referenceId,
    });

    logger.info('Double-entry transaction completed', {
      transactionId,
      debitEntryId: debitEntry.id,
      creditEntryId: creditEntry.id,
    });

    return { debitEntry, creditEntry };
  }

  /**
   * Create balanced multi-entry (for settlements with multiple parties)
   */
  async createMultiEntry(
    transactionId: string,
    description: string,
    entries: Array<{
      accountType: AccountType;
      accountId: string;
      debitAmount: Decimal;
      creditAmount: Decimal;
      currency: string;
    }>,
    referenceType?: string,
    referenceId?: string
  ): Promise<LedgerEntry[]> {
    logger.info('Creating multi-entry transaction', {
      transactionId,
      description,
      entryCount: entries.length,
    });

    // Validate: total debits must equal total credits
    const totalDebits = entries.reduce(
      (sum, e) => sum.plus(e.debitAmount),
      new Decimal(0)
    );
    const totalCredits = entries.reduce(
      (sum, e) => sum.plus(e.creditAmount),
      new Decimal(0)
    );

    if (!totalDebits.equals(totalCredits)) {
      throw new Error(
        `Imbalanced multi-entry: Debits ${totalDebits.toString()} != Credits ${totalCredits.toString()}`
      );
    }

    const createdEntries: LedgerEntry[] = [];

    for (const entry of entries) {
      const createdEntry = await this.createEntry({
        transactionId,
        entryType: LedgerEntryType.JOURNAL,
        accountType: entry.accountType,
        accountId: entry.accountId,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        currency: entry.currency,
        description: `${description} - ${entry.accountType}`,
        referenceType,
        referenceId,
      });
      createdEntries.push(createdEntry);
    }

    logger.info('Multi-entry transaction completed', {
      transactionId,
      entryCount: createdEntries.length,
    });

    return createdEntries;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(
    accountType: AccountType,
    accountId: string,
    currency: string
  ): Promise<Decimal> {
    const latestEntry = await prisma.ledgerEntry.findFirst({
      where: {
        accountType: accountType as any,
        accountId,
        currency,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return latestEntry ? latestEntry.runningBalance : new Decimal(0);
  }

  /**
   * Get ledger entries for a transaction
   */
  async getEntriesByTransactionId(
    transactionId: string
  ): Promise<LedgerEntry[]> {
    const entries = await prisma.ledgerEntry.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
    });

    return entries.map((e) => this.mapToLedgerEntry(e));
  }

  /**
   * Create reversal entry
   */
  async createReversal(
    originalTransactionId: string,
    reason: string
  ): Promise<LedgerEntry[]> {
    logger.info('Creating reversal entry', {
      originalTransactionId,
      reason,
    });

    const originalEntries = await this.getEntriesByTransactionId(
      originalTransactionId
    );

    if (originalEntries.length === 0) {
      throw new Error(`No entries found for transaction: ${originalTransactionId}`);
    }

    const reversalTransactionId = this.generateTransactionId();
    const reversedEntries: LedgerEntry[] = [];

    for (const entry of originalEntries) {
      // Swap debit and credit
      const reversedEntry = await this.createEntry({
        transactionId: reversalTransactionId,
        entryType: LedgerEntryType.REVERSAL,
        accountType: entry.accountType,
        accountId: entry.accountId,
        debitAmount: entry.creditAmount,
        creditAmount: entry.debitAmount,
        currency: entry.currency,
        description: `REVERSAL: ${entry.description} - ${reason}`,
        referenceType: 'Reversal',
        referenceId: originalTransactionId,
      });
      reversedEntries.push(reversedEntry);
    }

    logger.info('Reversal completed', {
      originalTransactionId,
      reversalTransactionId,
    });

    return reversedEntries;
  }

  /**
   * Get balance summary for an account type
   */
  async getBalanceSummary(
    accountType: AccountType,
    currency: string
  ): Promise<LedgerBalance> {
    const result = await prisma.ledgerEntry.aggregate({
      where: {
        accountType: accountType as any,
        currency,
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    const totalDebits = result._sum.debitAmount || new Decimal(0);
    const totalCredits = result._sum.creditAmount || new Decimal(0);
    const balance = totalDebits.minus(totalCredits);

    return {
      accountType,
      accountId: 'ALL', // Aggregate across all accounts
      totalDebits,
      totalCredits,
      balance,
      currency,
    };
  }

  /**
   * Get transaction summary (all entries)
   */
  async getTransactionSummary(transactionId: string): Promise<{
    transactionId: string;
    totalDebits: Decimal;
    totalCredits: Decimal;
    isBalanced: boolean;
    entries: LedgerEntry[];
  }> {
    const entries = await this.getEntriesByTransactionId(transactionId);

    const totalDebits = entries.reduce(
      (sum, e) => sum.plus(e.debitAmount),
      new Decimal(0)
    );
    const totalCredits = entries.reduce(
      (sum, e) => sum.plus(e.creditAmount),
      new Decimal(0)
    );

    return {
      transactionId,
      totalDebits,
      totalCredits,
      isBalanced: totalDebits.equals(totalCredits),
      entries,
    };
  }

  /**
   * Map Prisma model to LedgerEntry interface
   */
  private mapToLedgerEntry(entry: PrismaLedgerEntry): LedgerEntry {
    return {
      id: entry.id,
      transactionId: entry.transactionId,
      entryType: entry.entryType as LedgerEntryType,
      accountType: entry.accountType as AccountType,
      accountId: entry.accountId,
      debitAmount: new Decimal(entry.debitAmount.toString()),
      creditAmount: new Decimal(entry.creditAmount.toString()),
      currency: entry.currency,
      runningBalance: new Decimal(entry.runningBalance.toString()),
      description: entry.description,
      referenceType: entry.referenceType || undefined,
      referenceId: entry.referenceId || undefined,
      createdAt: entry.createdAt,
    };
  }
}

export const ledgerService = new LedgerService();
