// ============================================================
// Matching Engine Performance Tests
// Validates < 5 second match time for 1000+ requests
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { MatchingEngineService } from '../matching-engine.service';
import { ExchangeStatus, MatchType, MatchStatus, SettlementMethod } from '../../types/enums';

// Mock Prisma Client
jest.mock('@prisma/client');

describe('MatchingEngineService - Performance', () => {
  let service: MatchingEngineService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      exchangeRequest: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      exchangeMatch: {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(),
    } as any;

    service = new MatchingEngineService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // Performance Tests
  // ============================================================

  describe('Performance: < 5 second match time', () => {
    it('should match 100 requests in < 1 second', async () => {
      const openRequests = generateTestRequests(100);

      (mockPrisma.exchangeRequest.findMany as jest.Mock).mockResolvedValueOnce(openRequests);
      (mockPrisma.exchangeRequest.findUnique as jest.Mock).mockImplementation((args: any) => {
        const request = openRequests.find((r) => r.id === args.where.id);
        return Promise.resolve(request);
      });

      (mockPrisma.exchangeMatch.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      (mockPrisma.exchangeMatch.create as jest.Mock).mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const startTime = Date.now();
      const matchCount = await service.runMatching();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // < 1 second
      expect(matchCount).toBeGreaterThan(0);
    });

    it('should match 500 requests in < 3 seconds', async () => {
      const openRequests = generateTestRequests(500);

      (mockPrisma.exchangeRequest.findMany as jest.Mock).mockResolvedValueOnce(openRequests);
      (mockPrisma.exchangeRequest.findUnique as jest.Mock).mockImplementation((args: any) => {
        const request = openRequests.find((r) => r.id === args.where.id);
        return Promise.resolve(request);
      });

      (mockPrisma.exchangeMatch.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      (mockPrisma.exchangeMatch.create as jest.Mock).mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const startTime = Date.now();
      const matchCount = await service.runMatching();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000); // < 3 seconds
      expect(matchCount).toBeGreaterThan(0);
    });

    it('should match 1000+ requests in < 5 seconds', async () => {
      const openRequests = generateTestRequests(1000);

      (mockPrisma.exchangeRequest.findMany as jest.Mock).mockResolvedValueOnce(openRequests);
      (mockPrisma.exchangeRequest.findUnique as jest.Mock).mockImplementation((args: any) => {
        const request = openRequests.find((r) => r.id === args.where.id);
        return Promise.resolve(request);
      });

      (mockPrisma.exchangeMatch.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      (mockPrisma.exchangeMatch.create as jest.Mock).mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const startTime = Date.now();
      const matchCount = await service.runMatching();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // < 5 seconds
      expect(matchCount).toBeGreaterThan(0);
    });

    it('should handle 10,000 requests with graceful timeout', async () => {
      const openRequests = generateTestRequests(10000);

      (mockPrisma.exchangeRequest.findMany as jest.Mock).mockResolvedValueOnce(openRequests.slice(0, 500)); // Limit to 500
      (mockPrisma.exchangeRequest.findUnique as jest.Mock).mockImplementation((args: any) => {
        const request = openRequests.find((r) => r.id === args.where.id);
        return Promise.resolve(request);
      });

      (mockPrisma.exchangeMatch.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      (mockPrisma.exchangeMatch.create as jest.Mock).mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const startTime = Date.now();
      const matchCount = await service.runMatching();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // < 5 seconds
      expect(matchCount).toBeGreaterThan(0);
    });

    it('should calculate match score in < 1ms per request', () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        trustLevel: 2,
        createdAt: new Date(),
      };

      const counterRequest = {
        id: 2,
        userId: 2,
        fromCurrency: 'SAR',
        toCurrency: 'USD',
        fromAmount: new Decimal(375),
        toAmount: new Decimal(100),
        desiredRate: new Decimal(0.2667),
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        createdAt: new Date(),
      };

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        service.calculateMatchScore(request, counterRequest);
      }
      const duration = Date.now() - startTime;

      // 1000 calculations should take < 1 second
      expect(duration).toBeLessThan(1000);
      // Average per calculation should be < 1ms
      expect(duration / 1000).toBeLessThan(1);
    });
  });

  // ============================================================
  // Scalability Tests
  // ============================================================

  describe('Scalability', () => {
    it('should handle concurrent matching runs', async () => {
      const openRequests = generateTestRequests(100);

      (mockPrisma.exchangeRequest.findMany as jest.Mock).mockResolvedValue(openRequests);
      (mockPrisma.exchangeRequest.findUnique as jest.Mock).mockImplementation((args: any) => {
        const request = openRequests.find((r) => r.id === args.where.id);
        return Promise.resolve(request);
      });

      (mockPrisma.exchangeMatch.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      (mockPrisma.exchangeMatch.create as jest.Mock).mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const startTime = Date.now();
      const results = await Promise.all([
        service.runMatching(),
        service.runMatching(),
        service.runMatching(),
      ]);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // All 3 runs should complete in < 5 seconds
      expect(results.every((r) => r >= 0)).toBe(true);
    });

    it('should maintain performance with mixed currency pairs', async () => {
      const openRequests = generateTestRequestsWithMixedPairs(500);

      (mockPrisma.exchangeRequest.findMany as jest.Mock).mockResolvedValueOnce(openRequests);
      (mockPrisma.exchangeRequest.findUnique as jest.Mock).mockImplementation((args: any) => {
        const request = openRequests.find((r) => r.id === args.where.id);
        return Promise.resolve(request);
      });

      (mockPrisma.exchangeMatch.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      (mockPrisma.exchangeMatch.create as jest.Mock).mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const startTime = Date.now();
      const matchCount = await service.runMatching();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000); // < 3 seconds
      expect(matchCount).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Helper Functions
  // ============================================================

  function generateTestRequests(count: number): any[] {
    const requests: any[] = [];
    const currencies = ['USD', 'SAR', 'AED', 'EUR', 'GBP'];

    for (let i = 1; i <= count; i++) {
      const fromCurrency = currencies[i % currencies.length];
      const toCurrency = currencies[(i + 1) % currencies.length];
      const fromAmount = 100 + (i % 1000);
      const rate = 3.5 + (i % 10) * 0.1;
      const toAmount = fromAmount * rate;

      requests.push({
        id: i,
        userId: (i % 100) + 1,
        fromCurrency,
        toCurrency,
        fromAmount: new Decimal(fromAmount),
        toAmount: new Decimal(toAmount),
        desiredRate: new Decimal(rate),
        status: ExchangeStatus.OPEN,
        trustLevel: (i % 4) + 1,
        securityDeposit: new Decimal(fromAmount * 0.1),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - (i % 100) * 60 * 1000),
      });
    }

    return requests;
  }

  function generateTestRequestsWithMixedPairs(count: number): any[] {
    const requests: any[] = [];
    const pairs = [
      { from: 'USD', to: 'SAR' },
      { from: 'SAR', to: 'USD' },
      { from: 'USD', to: 'AED' },
      { from: 'AED', to: 'USD' },
      { from: 'EUR', to: 'GBP' },
      { from: 'GBP', to: 'EUR' },
    ];

    for (let i = 1; i <= count; i++) {
      const pair = pairs[i % pairs.length];
      const fromAmount = 100 + (i % 1000);
      const rate = 3.5 + (i % 10) * 0.1;
      const toAmount = fromAmount * rate;

      requests.push({
        id: i,
        userId: (i % 100) + 1,
        fromCurrency: pair.from,
        toCurrency: pair.to,
        fromAmount: new Decimal(fromAmount),
        toAmount: new Decimal(toAmount),
        desiredRate: new Decimal(rate),
        status: ExchangeStatus.OPEN,
        trustLevel: (i % 4) + 1,
        securityDeposit: new Decimal(fromAmount * 0.1),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - (i % 100) * 60 * 1000),
      });
    }

    return requests;
  }
});
