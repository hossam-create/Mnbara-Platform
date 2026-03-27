// ============================================================
// PHASE 4.1 — Wallet Repository
// Database access layer - uses raw SQL for critical operations
// ============================================================

import { PrismaClient } from '@prisma/client';
import {
  Wallet,
  WalletWithBalance,
  LedgerEntry,
  OwnerType,
  WalletStatus,
  EntryType,
  LedgerReason,
  ReferenceType,
  LedgerFilterOptions,
  PaginatedResponse,
} from '../types';
import {
  WalletNotFoundError,
  WalletAlreadyExistsError,
  WalletFrozenError,
  WalletClosedError,
  InsufficientBalanceError,
  DuplicateOperationError,
} from '../errors/wallet.errors';

const prisma = new PrismaClient();

export const walletRepository = {
  // ============================================================
  // WALLET OPERATIONS
  // ============================================================

  /**
   * Create a new wallet
   */
  async createWallet(
    ownerType: OwnerType,
    ownerId: string,
    currency: string = 'EGP'
  ): Promise<Wallet> {
    try {
      const wallet = await prisma.wallet.create({
        data: {
          ownerType,
          ownerId,
          currency: currency.toUpperCase(),
          status: WalletStatus.ACTIVE,
        },
      });

      return this.mapToWallet(wallet);
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        throw new WalletAlreadyExistsError(ownerType, ownerId, currency);
      }
      throw error;
    }
  },

  /**
   * Get wallet by ID
   */
  async getWalletById(walletId: string): Promise<Wallet | null> {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    return wallet ? this.mapToWallet(wallet) : null;
  },

  /**
   * Get wallet by owner
   */
  async getWalletByOwner(
    ownerType: OwnerType,
    ownerId: string,
    currency: string = 'EGP'
  ): Promise<Wallet | null> {
    const wallet = await prisma.wallet.findFirst({
      where: {
        ownerType,
        ownerId,
        currency: currency.toUpperCase(),
      },
    });

    return wallet ? this.mapToWallet(wallet) : null;
  },

  /**
   * Get wallet with computed balance
   */
  async getWalletWithBalance(walletId: string): Promise<WalletWithBalance | null> {
    const wallet = await this.getWalletById(walletId);
    if (!wallet) return null;

    const balance = await this.computeBalance(walletId);

    return {
      ...wallet,
      balance,
    };
  },

  /**
   * Update wallet status
   */
  async updateWalletStatus(walletId: string, status: WalletStatus): Promise<Wallet> {
    const wallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { status },
    });

    return this.mapToWallet(wallet);
  },

  // ============================================================
  // BALANCE COMPUTATION
  // ============================================================

  /**
   * Compute wallet balance from ledger entries
   * Uses the most recent entry's balance_after for O(1) performance
   */
  async computeBalance(walletId: string): Promise<bigint> {
    const lastEntry = await prisma.ledgerEntry.findFirst({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfter: true },
    });

    return lastEntry ? BigInt(lastEntry.balanceAfter) : BigInt(0);
  },

  /**
   * Verify balance by summing all entries (for integrity checks)
   */
  async verifyBalance(walletId: string): Promise<bigint> {
    const result = await prisma.ledgerEntry.groupBy({
      by: ['walletId'],
      where: { walletId },
      _sum: {
        amount: true,
      },
    });

    if (result.length === 0) return BigInt(0);

    // We need to calculate credits - debits
    const entries = await prisma.ledgerEntry.findMany({
      where: { walletId },
      select: { entryType: true, amount: true },
    });

    let balance = BigInt(0);
    for (const entry of entries) {
      const amount = BigInt(entry.amount);
      if (entry.entryType === EntryType.CREDIT) {
        balance += amount;
      } else {
        balance -= amount;
      }
    }

    return balance;
  },

  // ============================================================
  // LEDGER OPERATIONS
  // ============================================================

  /**
   * Create a ledger entry (atomic with balance calculation)
   */
  async createLedgerEntry(data: {
    walletId: string;
    entryType: EntryType;
    amount: bigint;
    reason: LedgerReason;
    description?: string;
    referenceType: ReferenceType;
    referenceId?: string;
    idempotencyKey: string;
    createdBy: string;
  }): Promise<LedgerEntry> {
    // Use transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // Lock wallet row and check status
      const wallet = await tx.wallet.findUnique({
        where: { id: data.walletId },
      });

      if (!wallet) {
        throw new WalletNotFoundError(data.walletId);
      }

      if (wallet.status === WalletStatus.FROZEN) {
        throw new WalletFrozenError(data.walletId);
      }

      if (wallet.status === WalletStatus.CLOSED) {
        throw new WalletClosedError(data.walletId);
      }

      // Get current balance
      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { walletId: data.walletId },
        orderBy: { createdAt: 'desc' },
        select: { balanceAfter: true },
      });

      const currentBalance = lastEntry ? BigInt(lastEntry.balanceAfter) : BigInt(0);

      // Calculate new balance
      let newBalance: bigint;
      if (data.entryType === EntryType.CREDIT) {
        newBalance = currentBalance + data.amount;
      } else {
        newBalance = currentBalance - data.amount;
      }

      // Prevent negative balance
      if (newBalance < BigInt(0)) {
        throw new InsufficientBalanceError(currentBalance, data.amount);
      }

      // Create ledger entry
      try {
        const entry = await tx.ledgerEntry.create({
          data: {
            walletId: data.walletId,
            entryType: data.entryType,
            amount: data.amount,
            reason: data.reason,
            description: data.description || null,
            referenceType: data.referenceType,
            referenceId: data.referenceId || null,
            idempotencyKey: data.idempotencyKey,
            balanceAfter: newBalance,
            createdBy: data.createdBy,
          },
        });

        // Update wallet timestamp
        await tx.wallet.update({
          where: { id: data.walletId },
          data: { updatedAt: new Date() },
        });

        return this.mapToLedgerEntry(entry);
      } catch (error: any) {
        // Handle idempotency key violation
        if (error.code === 'P2002') {
          throw new DuplicateOperationError(data.idempotencyKey);
        }
        throw error;
      }
    });
  },

  /**
   * Get ledger entry by ID
   */
  async getLedgerEntryById(entryId: string): Promise<LedgerEntry | null> {
    const entry = await prisma.ledgerEntry.findUnique({
      where: { id: entryId },
    });

    return entry ? this.mapToLedgerEntry(entry) : null;
  },

  /**
   * Get ledger entry by idempotency key
   */
  async getLedgerEntryByIdempotencyKey(
    walletId: string,
    idempotencyKey: string
  ): Promise<LedgerEntry | null> {
    const entry = await prisma.ledgerEntry.findFirst({
      where: {
        walletId,
        idempotencyKey,
      },
    });

    return entry ? this.mapToLedgerEntry(entry) : null;
  },

  /**
   * List ledger entries with filtering and pagination
   */
  async listLedgerEntries(
    walletId: string,
    options: LedgerFilterOptions = {}
  ): Promise<PaginatedResponse<LedgerEntry>> {
    const { limit = 20, offset = 0, entryType, reason, referenceType, referenceId, fromDate, toDate } = options;

    // Build where clause
    const where: any = { walletId };

    if (entryType) where.entryType = entryType;
    if (reason) where.reason = reason;
    if (referenceType) where.referenceType = referenceType;
    if (referenceId) where.referenceId = referenceId;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    // Get total count
    const total = await prisma.ledgerEntry.count({ where });

    // Get entries
    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return {
      data: entries.map(this.mapToLedgerEntry),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  },

  // ============================================================
  // MAPPING HELPERS
  // ============================================================

  mapToWallet(dbWallet: any): Wallet {
    return {
      id: dbWallet.id,
      ownerType: dbWallet.ownerType as OwnerType,
      ownerId: dbWallet.ownerId,
      currency: dbWallet.currency,
      status: dbWallet.status as WalletStatus,
      createdAt: dbWallet.createdAt,
      updatedAt: dbWallet.updatedAt,
    };
  },

  mapToLedgerEntry(dbEntry: any): LedgerEntry {
    return {
      id: dbEntry.id,
      walletId: dbEntry.walletId,
      entryType: dbEntry.entryType as EntryType,
      amount: BigInt(dbEntry.amount),
      reason: dbEntry.reason as LedgerReason,
      description: dbEntry.description,
      referenceType: dbEntry.referenceType as ReferenceType,
      referenceId: dbEntry.referenceId,
      idempotencyKey: dbEntry.idempotencyKey,
      balanceAfter: BigInt(dbEntry.balanceAfter),
      createdAt: dbEntry.createdAt,
      createdBy: dbEntry.createdBy,
    };
  },
};
