/**
 * Financial Dashboard Service Tests
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { FinancialDashboardService } from '../financial-dashboard.service';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    escrowHold: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payoutRequest: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    walletTransaction: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('FinancialDashboardService', () => {
  let service: FinancialDashboardService;
  let mockPrisma: any;

  beforeEach(() => {
    service = new FinancialDashboardService();
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('getOverviewMetrics', () => {
    it('should return overview metrics', async () => {
      // Mock escrow aggregate
      mockPrisma.escrowHold.aggregate.mockResolvedValue({
        _sum: {
          amount: new Decimal(1000),
          platformFee: new Decimal(50),
        },
      });

      // Mock payouts aggregate
      mockPrisma.payoutRequest.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Decimal(500) },
      });

      // Mock revenue aggregate
      mockPrisma.walletTransaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Decimal(200) },
      });

      // Mock today's transactions
      mockPrisma.walletTransaction.aggregate.mockResolvedValueOnce({
        _count: { id: 25 },
        _sum: { amount: new Decimal(750) },
      });

      const result = await service.getOverviewMetrics();

      expect(result).toEqual({
        totalEscrowHeld: 1050,
        pendingPayoutsAmount: 500,
        platformRevenue: 200,
        todayTransactions: {
          count: 25,
          value: 750,
        },
      });
    });

    it('should handle zero values', async () => {
      mockPrisma.escrowHold.aggregate.mockResolvedValue({
        _sum: { amount: null, platformFee: null },
      });

      mockPrisma.payoutRequest.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      mockPrisma.walletTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({
          _count: { id: 0 },
          _sum: { amount: null },
        });

      const result = await service.getOverviewMetrics();

      expect(result.totalEscrowHeld).toBe(0);
      expect(result.pendingPayoutsAmount).toBe(0);
      expect(result.platformRevenue).toBe(0);
      expect(result.todayTransactions.count).toBe(0);
    });
  });

  describe('getDailyTransactionVolume', () => {
    it('should return daily volume for last 30 days', async () => {
      const mockTransactions = [
        {
          createdAt: new Date('2026-01-20'),
          amount: new Decimal(100),
        },
        {
          createdAt: new Date('2026-01-20'),
          amount: new Decimal(200),
        },
        {
          createdAt: new Date('2026-01-21'),
          amount: new Decimal(150),
        },
      ];

      mockPrisma.walletTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getDailyTransactionVolume();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2026-01-20',
        count: 2,
        value: 300,
      });
      expect(result[1]).toEqual({
        date: '2026-01-21',
        count: 1,
        value: 150,
      });
    });

    it('should return empty array when no transactions', async () => {
      mockPrisma.walletTransaction.findMany.mockResolvedValue([]);

      const result = await service.getDailyTransactionVolume();

      expect(result).toEqual([]);
    });
  });

  describe('getFeesByCategory', () => {
    it('should return fees grouped by category with percentages', async () => {
      const mockFees = [
        { amount: new Decimal(100), referenceType: 'Request' },
        { amount: new Decimal(50), referenceType: 'Request' },
        { amount: new Decimal(75), referenceType: 'Payout' },
        { amount: new Decimal(25), referenceType: null },
      ];

      mockPrisma.walletTransaction.findMany.mockResolvedValue(mockFees);

      const result = await service.getFeesByCategory();

      expect(result).toHaveLength(3);
      expect(result[0].category).toBe('Request');
      expect(result[0].amount).toBe(150);
      expect(result[0].percentage).toBeCloseTo(60, 1);
      
      expect(result[1].category).toBe('Payout');
      expect(result[1].amount).toBe(75);
      expect(result[1].percentage).toBeCloseTo(30, 1);
      
      expect(result[2].category).toBe('Other');
      expect(result[2].amount).toBe(25);
      expect(result[2].percentage).toBeCloseTo(10, 1);
    });
  });

  describe('getPayoutsByStatus', () => {
    it('should return payouts grouped by status', async () => {
      const mockPayouts = [
        {
          status: 'PENDING',
          _count: { id: 10 },
          _sum: { amount: new Decimal(1000) },
        },
        {
          status: 'COMPLETED',
          _count: { id: 25 },
          _sum: { amount: new Decimal(5000) },
        },
      ];

      mockPrisma.payoutRequest.groupBy.mockResolvedValue(mockPayouts);

      const result = await service.getPayoutsByStatus();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        status: 'PENDING',
        count: 10,
        amount: 1000,
      });
      expect(result[1]).toEqual({
        status: 'COMPLETED',
        count: 25,
        amount: 5000,
      });
    });
  });

  describe('getEscrowHolds', () => {
    it('should return paginated escrow holds', async () => {
      const mockHolds = [
        {
          id: 1,
          requestId: 100,
          amount: new Decimal(500),
          platformFee: new Decimal(25),
          status: 'HELD',
          heldAt: new Date('2026-01-20'),
          expiresAt: new Date('2026-01-27'),
          buyerWallet: {
            userId: 1,
          },
          sellerWallet: {
            userId: 2,
          },
        },
      ];

      mockPrisma.escrowHold.findMany.mockResolvedValue(mockHolds);
      mockPrisma.escrowHold.count.mockResolvedValue(1);

      const result = await service.getEscrowHolds({ page: 1, pageSize: 20 });

      expect(result.holds).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.holds[0].buyerName).toBe('User 1');
      expect(result.holds[0].sellerName).toBe('User 2');
    });

    it('should apply filters', async () => {
      mockPrisma.escrowHold.findMany.mockResolvedValue([]);
      mockPrisma.escrowHold.count.mockResolvedValue(0);

      await service.getEscrowHolds({
        status: 'HELD',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        page: 1,
        pageSize: 20,
      });

      expect(mockPrisma.escrowHold.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'HELD',
            heldAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const mockTransactions = [
        {
          id: 1,
          transactionType: 'DEPOSIT',
          amount: new Decimal(100),
          status: 'COMPLETED',
          createdAt: new Date('2026-01-20'),
          referenceType: 'Request',
          referenceId: '123',
          wallet: {
            userId: 1,
          },
        },
      ];

      mockPrisma.walletTransaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.walletTransaction.count.mockResolvedValue(1);

      const result = await service.getTransactions({ page: 1, pageSize: 20 });

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.transactions[0].userName).toBe('User 1');
      expect(result.transactions[0].description).toBe('Request #123');
    });
  });

  describe('getPendingPayouts', () => {
    it('should return paginated pending payouts', async () => {
      const mockPayouts = [
        {
          id: 'payout-uuid-1',
          userId: 1,
          amount: new Decimal(500),
          requestedAt: new Date('2026-01-20'),
          status: 'PENDING',
        },
      ];

      mockPrisma.payoutRequest.findMany.mockResolvedValue(mockPayouts);
      mockPrisma.payoutRequest.count.mockResolvedValue(1);

      const result = await service.getPendingPayouts({ page: 1, pageSize: 20 });

      expect(result.payouts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.payouts[0].userName).toBe('User 1');
      expect(result.payouts[0].status).toBe('PENDING');
    });
  });

  describe('getDashboardData', () => {
    it('should return complete dashboard data', async () => {
      // Mock all methods
      jest.spyOn(service, 'getOverviewMetrics').mockResolvedValue({
        totalEscrowHeld: 1000,
        pendingPayoutsAmount: 500,
        platformRevenue: 200,
        todayTransactions: { count: 25, value: 750 },
      });

      jest.spyOn(service, 'getDailyTransactionVolume').mockResolvedValue([
        { date: '2026-01-20', count: 10, value: 500 },
      ]);

      jest.spyOn(service, 'getFeesByCategory').mockResolvedValue([
        { category: 'Request', amount: 100, percentage: 50 },
      ]);

      jest.spyOn(service, 'getPayoutsByStatus').mockResolvedValue([
        { status: 'PENDING', count: 5, amount: 500 },
      ]);

      jest.spyOn(service, 'getEscrowHolds').mockResolvedValue({
        holds: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });

      jest.spyOn(service, 'getTransactions').mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });

      jest.spyOn(service, 'getPendingPayouts').mockResolvedValue({
        payouts: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });

      const result = await service.getDashboardData();

      expect(result.metrics).toBeDefined();
      expect(result.charts).toBeDefined();
      expect(result.recentEscrowHolds).toBeDefined();
      expect(result.recentTransactions).toBeDefined();
      expect(result.pendingPayouts).toBeDefined();
    });
  });
});
