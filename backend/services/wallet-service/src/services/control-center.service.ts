// ============================================================
// PHASE 4.1 — Control Center Service
// Read-only endpoints for admin finance dashboard
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
  PaginationOptions,
} from '../types';
import { formatMoney } from '../utils/money';

const prisma = new PrismaClient();

/**
 * Wallet list filter options
 */
export interface WalletListFilters {
  ownerType?: OwnerType;
  status?: WalletStatus;
  currency?: string;
  search?: string; // Search by owner_id
  limit?: number;
  offset?: number;
}

/**
 * System totals response
 */
export interface SystemTotals {
  currency: string;
  totalWallets: number;
  activeWallets: number;
  frozenWallets: number;
  closedWallets: number;
  totalBalance: string;
  totalBalanceFormatted: string;
  byOwnerType: {
    ownerType: OwnerType;
    count: number;
    balance: string;
    balanceFormatted: string;
  }[];
}

/**
 * Wallet summary for lists
 */
export interface WalletSummary {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  currency: string;
  status: WalletStatus;
  balance: string;
  balanceFormatted: string;
  entryCount: number;
  lastActivity: string | null;
  createdAt: string;
}

/**
 * Ledger trail entry
 */
export interface LedgerTrailEntry {
  id: string;
  walletId: string;
  walletOwnerType: OwnerType;
  walletOwnerId: string;
  entryType: EntryType;
  amount: string;
  amountFormatted: string;
  reason: LedgerReason;
  description: string | null;
  referenceType: ReferenceType;
  referenceId: string | null;
  balanceAfter: string;
  balanceAfterFormatted: string;
  createdAt: string;
  createdBy: string;
}

/**
 * Control Center Service
 * 
 * Provides read-only views for admin finance dashboard:
 * - Wallet listing with filters
 * - Balance snapshots
 * - Ledger audit trail
 * - System-wide totals
 */
export const controlCenterService = {
  // ============================================================
  // LIST ALL WALLETS
  // Paginated with filters
  // ============================================================

  async listWallets(filters: WalletListFilters = {}): Promise<{
    wallets: WalletSummary[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }> {
    const { ownerType, status, currency, search, limit = 20, offset = 0 } = filters;

    // Build where clause
    const where: any = {};
    if (ownerType) where.ownerType = ownerType;
    if (status) where.status = status;
    if (currency) where.currency = currency.toUpperCase();
    if (search) where.ownerId = { contains: search, mode: 'insensitive' };

    // Get total count
    const total = await prisma.wallet.count({ where });

    // Get wallets with last ledger entry
    const wallets = await prisma.wallet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            balanceAfter: true,
            createdAt: true,
          },
        },
        _count: {
          select: { ledgerEntries: true },
        },
      },
    });

    // Map to summary
    const summaries: WalletSummary[] = wallets.map((w: any) => {
      const lastEntry = w.ledgerEntries[0];
      const balance = lastEntry ? BigInt(lastEntry.balanceAfter) : BigInt(0);

      return {
        id: w.id,
        ownerType: w.ownerType as OwnerType,
        ownerId: w.ownerId,
        currency: w.currency,
        status: w.status as WalletStatus,
        balance: balance.toString(),
        balanceFormatted: formatMoney(balance, w.currency),
        entryCount: w._count.ledgerEntries,
        lastActivity: lastEntry ? lastEntry.createdAt.toISOString() : null,
        createdAt: w.createdAt.toISOString(),
      };
    });

    return {
      wallets: summaries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  },

  // ============================================================
  // WALLET BALANCE SNAPSHOT
  // Detailed view of single wallet
  // ============================================================

  async getWalletSnapshot(walletId: string): Promise<{
    wallet: WalletSummary;
    recentTransactions: LedgerTrailEntry[];
    dailyVolume: { date: string; credits: string; debits: string }[];
  }> {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { ledgerEntries: true },
        },
      },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get last entry for balance
    const lastEntry = wallet.ledgerEntries[0];
    const balance = lastEntry ? BigInt(lastEntry.balanceAfter) : BigInt(0);

    // Get daily volume for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyEntries = await prisma.ledgerEntry.groupBy({
      by: ['entryType'],
      where: {
        walletId,
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: { amount: true },
    });

    // Map recent transactions
    const recentTransactions: LedgerTrailEntry[] = wallet.ledgerEntries.map((e: any) => ({
      id: e.id,
      walletId: e.walletId,
      walletOwnerType: wallet.ownerType as OwnerType,
      walletOwnerId: wallet.ownerId,
      entryType: e.entryType as EntryType,
      amount: e.amount.toString(),
      amountFormatted: formatMoney(BigInt(e.amount), wallet.currency),
      reason: e.reason as LedgerReason,
      description: e.description,
      referenceType: e.referenceType as ReferenceType,
      referenceId: e.referenceId,
      balanceAfter: e.balanceAfter.toString(),
      balanceAfterFormatted: formatMoney(BigInt(e.balanceAfter), wallet.currency),
      createdAt: e.createdAt.toISOString(),
      createdBy: e.createdBy,
    }));

    return {
      wallet: {
        id: wallet.id,
        ownerType: wallet.ownerType as OwnerType,
        ownerId: wallet.ownerId,
        currency: wallet.currency,
        status: wallet.status as WalletStatus,
        balance: balance.toString(),
        balanceFormatted: formatMoney(balance, wallet.currency),
        entryCount: wallet._count.ledgerEntries,
        lastActivity: lastEntry ? lastEntry.createdAt.toISOString() : null,
        createdAt: wallet.createdAt.toISOString(),
      },
      recentTransactions,
      dailyVolume: dailyEntries.map((d: any) => ({
        date: new Date().toISOString().split('T')[0],
        credits: d.entryType === 'CREDIT' ? (d._sum.amount?.toString() || '0') : '0',
        debits: d.entryType === 'DEBIT' ? (d._sum.amount?.toString() || '0') : '0',
      })),
    };
  },

  // ============================================================
  // LEDGER TRAIL
  // System-wide audit trail with filters
  // ============================================================

  async getLedgerTrail(filters: {
    walletId?: string;
    ownerType?: OwnerType;
    entryType?: EntryType;
    reason?: LedgerReason;
    referenceType?: ReferenceType;
    referenceId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    entries: LedgerTrailEntry[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }> {
    const { 
      walletId, ownerType, entryType, reason, referenceType, referenceId,
      fromDate, toDate, limit = 50, offset = 0 
    } = filters;

    // Build where clause
    const where: any = {};
    if (walletId) where.walletId = walletId;
    if (entryType) where.entryType = entryType;
    if (reason) where.reason = reason;
    if (referenceType) where.referenceType = referenceType;
    if (referenceId) where.referenceId = referenceId;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    // Filter by owner type if specified
    if (ownerType) {
      where.wallet = { ownerType };
    }

    // Get total count
    const total = await prisma.ledgerEntry.count({ where });

    // Get entries with wallet info
    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        wallet: {
          select: {
            ownerType: true,
            ownerId: true,
            currency: true,
          },
        },
      },
    });

    // Map to trail entries
    const trailEntries: LedgerTrailEntry[] = entries.map((e: any) => ({
      id: e.id,
      walletId: e.walletId,
      walletOwnerType: e.wallet.ownerType as OwnerType,
      walletOwnerId: e.wallet.ownerId,
      entryType: e.entryType as EntryType,
      amount: e.amount.toString(),
      amountFormatted: formatMoney(BigInt(e.amount), e.wallet.currency),
      reason: e.reason as LedgerReason,
      description: e.description,
      referenceType: e.referenceType as ReferenceType,
      referenceId: e.referenceId,
      balanceAfter: e.balanceAfter.toString(),
      balanceAfterFormatted: formatMoney(BigInt(e.balanceAfter), e.wallet.currency),
      createdAt: e.createdAt.toISOString(),
      createdBy: e.createdBy,
    }));

    return {
      entries: trailEntries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  },

  // ============================================================
  // SYSTEM TOTAL BALANCES
  // Aggregate balances by currency
  // ============================================================

  async getSystemTotals(): Promise<SystemTotals[]> {
    // Get all currencies in use
    const currencies = await prisma.wallet.groupBy({
      by: ['currency'],
    });

    const totals: SystemTotals[] = [];

    for (const { currency } of currencies) {
      // Get wallet counts by status
      const statusCounts = await prisma.wallet.groupBy({
        by: ['status'],
        where: { currency },
        _count: { id: true },
      });

      const activeWallets = statusCounts.find((s: any) => s.status === 'ACTIVE')?._count.id || 0;
      const frozenWallets = statusCounts.find((s: any) => s.status === 'FROZEN')?._count.id || 0;
      const closedWallets = statusCounts.find((s: any) => s.status === 'CLOSED')?._count.id || 0;
      const totalWallets = activeWallets + frozenWallets + closedWallets;

      // Get wallets with their current balance
      const wallets = await prisma.wallet.findMany({
        where: { currency },
        select: {
          id: true,
          ownerType: true,
          ledgerEntries: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { balanceAfter: true },
          },
        },
      });

      // Calculate total balance and by owner type
      let totalBalance = BigInt(0);
      const byOwnerType: Record<string, { count: number; balance: bigint }> = {};

      for (const wallet of wallets) {
        const balance = wallet.ledgerEntries[0] 
          ? BigInt(wallet.ledgerEntries[0].balanceAfter)
          : BigInt(0);
        
        totalBalance += balance;

        if (!byOwnerType[wallet.ownerType]) {
          byOwnerType[wallet.ownerType] = { count: 0, balance: BigInt(0) };
        }
        byOwnerType[wallet.ownerType].count++;
        byOwnerType[wallet.ownerType].balance += balance;
      }

      totals.push({
        currency,
        totalWallets,
        activeWallets,
        frozenWallets,
        closedWallets,
        totalBalance: totalBalance.toString(),
        totalBalanceFormatted: formatMoney(totalBalance, currency),
        byOwnerType: Object.entries(byOwnerType).map(([ownerType, data]) => ({
          ownerType: ownerType as OwnerType,
          count: data.count,
          balance: data.balance.toString(),
          balanceFormatted: formatMoney(data.balance, currency),
        })),
      });
    }

    return totals;
  },

  // ============================================================
  // DAILY TRANSACTION SUMMARY
  // For charts and reporting
  // ============================================================

  async getDailyTransactionSummary(days: number = 30): Promise<{
    date: string;
    totalCredits: string;
    totalDebits: string;
    transactionCount: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all entries in date range
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        entryType: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyMap: Record<string, { credits: bigint; debits: bigint; count: number }> = {};

    for (const entry of entries) {
      const dateKey = entry.createdAt.toISOString().split('T')[0];
      
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { credits: BigInt(0), debits: BigInt(0), count: 0 };
      }

      if (entry.entryType === 'CREDIT') {
        dailyMap[dateKey].credits += BigInt(entry.amount);
      } else {
        dailyMap[dateKey].debits += BigInt(entry.amount);
      }
      dailyMap[dateKey].count++;
    }

    // Fill in missing dates
    const result: { date: string; totalCredits: string; totalDebits: string; transactionCount: number }[] = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayData = dailyMap[dateKey] || { credits: BigInt(0), debits: BigInt(0), count: 0 };

      result.push({
        date: dateKey,
        totalCredits: dayData.credits.toString(),
        totalDebits: dayData.debits.toString(),
        transactionCount: dayData.count,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  },

  // ============================================================
  // ESCROW CONTROL CENTER READS
  // ============================================================

  async listEscrows(filters: {
    status?: any; // EscrowStatus
    referenceType?: any; // EscrowReferenceType
    search?: string; // Reference ID
    minAmount?: bigint;
    maxAmount?: bigint;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    escrows: any[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }> {
    const { status, referenceType, search, minAmount, maxAmount, limit = 20, offset = 0 } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (referenceType) where.referenceType = referenceType;
    if (search) where.referenceId = { contains: search, mode: 'insensitive' };
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = minAmount;
      if (maxAmount) where.amount.lte = maxAmount;
    }

    const total = await prisma.escrow.count({ where });

    const escrows = await prisma.escrow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        // Typically we might include minimal wallet info, but existing model 
        // relations to Wallet might not be named 'buyer'/'seller' in Prisma schema strictly?
        // Let's check schema: buyerWalletId, sellerWalletId are fields, but relation names?
        // Schema had: buyerWalletId String ... and NO strict relation field defined in Escrow model 
        // pointing to Wallet unless implicit?
        // Wait, schema: 
        // buyerWalletId     String
        // sellerWalletId    String
        // CONSTRAINT fk_buyer_wallet FOREIGN KEY ...
        // BUT did I add @relation fields in Prisma model?
        // Looking at Step 190 output:
        // model Escrow { ... buyerWalletId String ... constraint fk_buyer_wallet ... }
        // BUT Prisma schema syntax needs `buyer Wallet @relation(...)` for `include` to work.
        // My DDL (Migration) added FKs at DB level.
        // My Prisma model in Step 190 DID NOT have proper relation fields (it had buyerWalletId String).
        // It DOES NOT have `buyer Wallet @relation(...)`.
        // So `include` won't work in Prisma client unless I update schema.prisma properly.
        // Since I cannot run `prisma generate`, I will just return IDs.
      }
    });

    return {
      escrows: escrows.map((e: any) => ({
        ...e,
        amount: e.amount.toString(),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  },

  async getEscrowDetails(escrowId: string) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) return null;

    return {
      ...escrow,
      amount: escrow.amount.toString(),
    };
  },

  async getEscrowTotals() {
    const byStatus = await prisma.escrow.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    const totalCount = await prisma.escrow.count();
    const totalVolume = await prisma.escrow.aggregate({ _sum: { amount: true } });

    return {
      totalCount,
      totalVolume: (totalVolume._sum.amount || BigInt(0)).toString(),
      byStatus: byStatus.map((s: any) => ({
        status: s.status,
        count: s._count.id,
        volume: (s._sum.amount || BigInt(0)).toString(),
      })),
    };
  },

  async getWalletEscrowExposure(walletId: string) {
    // 1. As Buyer (Funds Locked)
    // Status: FUNDED, DISPUTED
    const asBuyer = await prisma.escrow.aggregate({
      where: {
        buyerWalletId: walletId,
        status: { in: ['FUNDED', 'DISPUTED'] },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 2. As Seller (Funds Incoming)
    // Status: FUNDED, DISPUTED
    const asSeller = await prisma.escrow.aggregate({
      where: {
        sellerWalletId: walletId,
        status: { in: ['FUNDED', 'DISPUTED'] },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 3. Lifetime stats
    const lifetimeBuy = await prisma.escrow.aggregate({
      where: { buyerWalletId: walletId, status: 'RELEASED' },
      _sum: { amount: true },
    });
    const lifetimeSell = await prisma.escrow.aggregate({
      where: { sellerWalletId: walletId, status: 'RELEASED' },
      _sum: { amount: true },
    });

    return {
      walletId,
      currentLocked: (asBuyer._sum.amount || BigInt(0)).toString(),
      currentIncoming: (asSeller._sum.amount || BigInt(0)).toString(),
      activeCountAsBuyer: asBuyer._count.id,
      activeCountAsSeller: asSeller._count.id,
      lifetimeSpent: (lifetimeBuy._sum.amount || BigInt(0)).toString(),
      lifetimeEarned: (lifetimeSell._sum.amount || BigInt(0)).toString(),
    };
  },
};
