/**
 * Financial Dashboard Service
 * 
 * Provides aggregated financial data for admin dashboard.
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  FinancialOverviewMetrics,
  DailyTransactionVolume,
  FeesByCategory,
  PayoutsByStatus,
  EscrowHold,
  EscrowHoldsResponse,
  WalletTransaction,
  TransactionsResponse,
  PendingPayout,
  PendingPayoutsResponse,
  FinancialFilters,
  FinancialDashboardData,
} from '../types/financial-dashboard.types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class FinancialDashboardService {
  /**
   * Get overview metrics
   */
  async getOverviewMetrics(): Promise<FinancialOverviewMetrics> {
    logger.info('Getting financial overview metrics');

    try {
      // Total escrow held
      const escrowResult = await prisma.escrowHold.aggregate({
        where: { status: 'HELD' },
        _sum: {
          amount: true,
          platformFee: true,
        },
      });

      const totalEscrowHeld = new Decimal(escrowResult._sum.amount || 0)
        .plus(escrowResult._sum.platformFee || 0)
        .toNumber();

      // Pending payouts amount
      const payoutsResult = await prisma.payoutRequest.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      });

      const pendingPayoutsAmount = new Decimal(
        payoutsResult._sum.amount || 0
      ).toNumber();

      // Platform revenue (completed fees)
      const revenueResult = await prisma.walletTransaction.aggregate({
        where: {
          transactionType: 'FEE_DEDUCTION',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      });

      const platformRevenue = new Decimal(
        revenueResult._sum.amount || 0
      ).toNumber();

      // Today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = await prisma.walletTransaction.aggregate({
        where: {
          createdAt: { gte: today },
          status: 'COMPLETED',
        },
        _count: { id: true },
        _sum: { amount: true },
      });

      logger.info('Financial overview metrics retrieved successfully');

      return {
        totalEscrowHeld,
        pendingPayoutsAmount,
        platformRevenue,
        todayTransactions: {
          count: todayTransactions._count.id,
          value: new Decimal(todayTransactions._sum.amount || 0).toNumber(),
        },
      };
    } catch (error) {
      logger.error('Failed to get overview metrics', error as Error);
      throw error;
    }
  }

  /**
   * Get daily transaction volume for last 30 days
   */
  async getDailyTransactionVolume(): Promise<DailyTransactionVolume[]> {
    logger.info('Getting daily transaction volume');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transactions = await prisma.walletTransaction.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
        },
        select: {
          createdAt: true,
          amount: true,
        },
      });

      // Group by date
      const volumeMap = new Map<string, { count: number; value: Decimal }>();

      transactions.forEach((tx) => {
        const date = tx.createdAt.toISOString().split('T')[0];
        const existing = volumeMap.get(date) || { count: 0, value: new Decimal(0) };
        
        volumeMap.set(date, {
          count: existing.count + 1,
          value: existing.value.plus(tx.amount),
        });
      });

      // Convert to array and sort
      const result: DailyTransactionVolume[] = Array.from(volumeMap.entries())
        .map(([date, data]) => ({
          date,
          count: data.count,
          value: data.value.toNumber(),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      logger.info('Daily transaction volume retrieved successfully', {
        days: result.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get daily transaction volume', error as Error);
      throw error;
    }
  }

  /**
   * Get fees by category
   */
  async getFeesByCategory(): Promise<FeesByCategory[]> {
    logger.info('Getting fees by category');

    try {
      const fees = await prisma.walletTransaction.findMany({
        where: {
          transactionType: 'FEE_DEDUCTION',
          status: 'COMPLETED',
        },
        select: {
          amount: true,
          referenceType: true,
        },
      });

      // Group by reference type (category)
      const categoryMap = new Map<string, Decimal>();
      let total = new Decimal(0);

      fees.forEach((fee) => {
        const category = fee.referenceType || 'Other';
        const existing = categoryMap.get(category) || new Decimal(0);
        const amount = new Decimal(fee.amount);
        
        categoryMap.set(category, existing.plus(amount));
        total = total.plus(amount);
      });

      // Convert to array with percentages
      const result: FeesByCategory[] = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount: amount.toNumber(),
          percentage: total.isZero() ? 0 : amount.div(total).mul(100).toNumber(),
        }))
        .sort((a, b) => b.amount - a.amount);

      logger.info('Fees by category retrieved successfully', {
        categories: result.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get fees by category', error as Error);
      throw error;
    }
  }

  /**
   * Get payouts by status
   */
  async getPayoutsByStatus(): Promise<PayoutsByStatus[]> {
    logger.info('Getting payouts by status');

    try {
      const payouts = await prisma.payoutRequest.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      });

      const result: PayoutsByStatus[] = payouts.map((p) => ({
        status: p.status,
        count: p._count.id,
        amount: new Decimal(p._sum.amount || 0).toNumber(),
      }));

      logger.info('Payouts by status retrieved successfully', {
        statuses: result.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get payouts by status', error as Error);
      throw error;
    }
  }

  /**
   * Get escrow holds with pagination and filters
   */
  async getEscrowHolds(filters: FinancialFilters): Promise<EscrowHoldsResponse> {
    logger.info('Getting escrow holds', { filters });

    try {
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        where.heldAt = {};
        if (filters.startDate) {
          where.heldAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.heldAt.lte = filters.endDate;
        }
      }

      const [holds, total] = await Promise.all([
        prisma.escrowHold.findMany({
          where,
          include: {
            buyerWallet: true,
            sellerWallet: true,
          },
          orderBy: { heldAt: 'desc' },
          take: pageSize,
          skip,
        }),
        prisma.escrowHold.count({ where }),
      ]);

      const result: EscrowHold[] = holds.map((h) => ({
        id: h.id,
        requestId: h.requestId,
        buyerId: h.buyerWallet.userId,
        buyerName: `User ${h.buyerWallet.userId}`, // User email not available in schema
        sellerId: h.sellerWallet.userId,
        sellerName: `User ${h.sellerWallet.userId}`, // User email not available in schema
        amount: new Decimal(h.amount).toNumber(),
        fee: new Decimal(h.platformFee).toNumber(),
        status: h.status,
        heldDate: h.heldAt,
        expectedReleaseDate: h.expiresAt || new Date(), // Handle null
      }));

      logger.info('Escrow holds retrieved successfully', {
        count: result.length,
        total,
      });

      return {
        holds: result,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      logger.error('Failed to get escrow holds', error as Error);
      throw error;
    }
  }

  /**
   * Get wallet transactions with pagination and filters
   */
  async getTransactions(filters: FinancialFilters): Promise<TransactionsResponse> {
    logger.info('Getting wallet transactions', { filters });

    try {
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          include: {
            wallet: true,
          },
          orderBy: { createdAt: 'desc' },
          take: pageSize,
          skip,
        }),
        prisma.walletTransaction.count({ where }),
      ]);

      const result: WalletTransaction[] = transactions.map((t) => ({
        id: t.id,
        userId: t.wallet.userId,
        userName: `User ${t.wallet.userId}`, // User email not available in schema
        type: t.transactionType,
        amount: new Decimal(t.amount).toNumber(),
        status: t.status,
        timestamp: t.createdAt,
        description: t.referenceType
          ? `${t.referenceType} #${t.referenceId}`
          : undefined,
      }));

      logger.info('Wallet transactions retrieved successfully', {
        count: result.length,
        total,
      });

      return {
        transactions: result,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      logger.error('Failed to get wallet transactions', error as Error);
      throw error;
    }
  }

  /**
   * Get pending payouts with pagination
   */
  async getPendingPayouts(filters: FinancialFilters): Promise<PendingPayoutsResponse> {
    logger.info('Getting pending payouts', { filters });

    try {
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const skip = (page - 1) * pageSize;

      const where: any = { status: 'PENDING' };

      if (filters.startDate || filters.endDate) {
        where.requestedAt = {};
        if (filters.startDate) {
          where.requestedAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.requestedAt.lte = filters.endDate;
        }
      }

      const [payouts, total] = await Promise.all([
        prisma.payoutRequest.findMany({
          where,
          orderBy: { requestedAt: 'asc' },
          take: pageSize,
          skip,
        }),
        prisma.payoutRequest.count({ where }),
      ]);

      const result: PendingPayout[] = payouts.map((p) => ({
        id: p.id, // Already a string (UUID)
        userId: p.userId,
        userName: `User ${p.userId}`, // User email not available in schema
        amount: new Decimal(p.amount).toNumber(),
        requestedDate: p.requestedAt,
        status: p.status,
      }));

      logger.info('Pending payouts retrieved successfully', {
        count: result.length,
        total,
      });

      return {
        payouts: result,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      logger.error('Failed to get pending payouts', error as Error);
      throw error;
    }
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(): Promise<FinancialDashboardData> {
    logger.info('Getting complete financial dashboard data');

    try {
      const [
        metrics,
        dailyVolume,
        feesByCategory,
        payoutsByStatus,
        escrowHoldsResponse,
        transactionsResponse,
        pendingPayoutsResponse,
      ] = await Promise.all([
        this.getOverviewMetrics(),
        this.getDailyTransactionVolume(),
        this.getFeesByCategory(),
        this.getPayoutsByStatus(),
        this.getEscrowHolds({ page: 1, pageSize: 10 }),
        this.getTransactions({ page: 1, pageSize: 10 }),
        this.getPendingPayouts({ page: 1, pageSize: 10 }),
      ]);

      logger.info('Complete financial dashboard data retrieved successfully');

      return {
        metrics,
        charts: {
          dailyVolume,
          feesByCategory,
          payoutsByStatus,
        },
        recentEscrowHolds: escrowHoldsResponse.holds,
        recentTransactions: transactionsResponse.transactions,
        pendingPayouts: pendingPayoutsResponse.payouts,
      };
    } catch (error) {
      logger.error('Failed to get complete dashboard data', error as Error);
      throw error;
    }
  }
}

export const financialDashboardService = new FinancialDashboardService();
