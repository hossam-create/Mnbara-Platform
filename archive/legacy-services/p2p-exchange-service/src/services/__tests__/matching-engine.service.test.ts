// ============================================================
// Matching Engine Service Tests
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { MatchingEngineService } from '../matching-engine.service';
import {
  ExchangeStatus,
  MatchType,
  MatchStatus,
  SettlementMethod,
} from '../../types/enums';
import {
  ExchangeRequestNotFoundError,
  InvalidExchangeStatusError,
  InsufficientSecurityDepositError,
} from '../../errors/ExchangeErrors';

// Mock Prisma Client
jest.mock('@prisma/client');

describe('MatchingEngineService', () => {
  let service: MatchingEngineService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      exchangeRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      exchangeMatch: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;

    service = new MatchingEngineService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // runMatching() Tests
  // ============================================================

  describe('runMatching', () => {
    it('should match compatible requests automatically', async () => {
      const openRequests = [
        {
          id: 1,
          userId: 1,
          fromCurrency: 'USD',
          toCurrency: 'SAR',
          fromAmount: new Decimal(100),
          toAmount: new Decimal(375),
          desiredRate: new Decimal(3.75),
          status: ExchangeStatus.OPEN,
          trustLevel: 2,
          securityDeposit: new Decimal(20),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      const counterRequests = [
        {
          id: 2,
          userId: 2,
          fromCurrency: 'SAR',
          toCurrency: 'USD',
          fromAmount: new Decimal(375),
          toAmount: new Decimal(100),
          desiredRate: new Decimal(0.2667),
          status: ExchangeStatus.OPEN,
          trustLevel: 2,
          securityDeposit: new Decimal(40),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      mockPrisma.exchangeRequest.findMany
        .mockResolvedValueOnce(openRequests)
        .mockResolvedValueOnce(counterRequests);

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(openRequests[0])
        .mockResolvedValueOnce(openRequests[0])
        .mockResolvedValueOnce(counterRequests[0]);

      mockPrisma.exchangeMatch.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      mockPrisma.exchangeMatch.create.mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const matchCount = await service.runMatching();

      expect(matchCount).toBe(1);
      expect(mockPrisma.exchangeMatch.create).toHaveBeenCalled();
    });

    it('should skip requests with no compatible matches', async () => {
      const openRequests = [
        {
          id: 1,
          userId: 1,
          fromCurrency: 'USD',
          toCurrency: 'SAR',
          fromAmount: new Decimal(100),
          toAmount: new Decimal(375),
          desiredRate: new Decimal(3.75),
          status: ExchangeStatus.OPEN,
          trustLevel: 2,
          securityDeposit: new Decimal(20),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      mockPrisma.exchangeRequest.findMany
        .mockResolvedValueOnce(openRequests)
        .mockResolvedValueOnce([]); // No counter-requests

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(openRequests[0]);

      const matchCount = await service.runMatching();

      expect(matchCount).toBe(0);
      expect(mockPrisma.exchangeMatch.create).not.toHaveBeenCalled();
    });

    it('should skip matches with score below threshold', async () => {
      const openRequests = [
        {
          id: 1,
          userId: 1,
          fromCurrency: 'USD',
          toCurrency: 'SAR',
          fromAmount: new Decimal(100),
          toAmount: new Decimal(375),
          desiredRate: new Decimal(3.75),
          status: ExchangeStatus.OPEN,
          trustLevel: 1,
          securityDeposit: new Decimal(20),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      const counterRequests = [
        {
          id: 2,
          userId: 2,
          fromCurrency: 'SAR',
          toCurrency: 'USD',
          fromAmount: new Decimal(500), // Very different amount
          toAmount: new Decimal(100),
          desiredRate: new Decimal(0.2),
          status: ExchangeStatus.OPEN,
          trustLevel: 4,
          securityDeposit: new Decimal(50),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      mockPrisma.exchangeRequest.findMany
        .mockResolvedValueOnce(openRequests)
        .mockResolvedValueOnce(counterRequests);

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(openRequests[0]);

      const matchCount = await service.runMatching();

      expect(matchCount).toBe(0);
      expect(mockPrisma.exchangeMatch.create).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and continue', async () => {
      const openRequests = [
        {
          id: 1,
          userId: 1,
          fromCurrency: 'USD',
          toCurrency: 'SAR',
          fromAmount: new Decimal(100),
          toAmount: new Decimal(375),
          desiredRate: new Decimal(3.75),
          status: ExchangeStatus.OPEN,
          trustLevel: 2,
          securityDeposit: new Decimal(20),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: 3,
          userId: 3,
          fromCurrency: 'EUR',
          toCurrency: 'GBP',
          fromAmount: new Decimal(200),
          toAmount: new Decimal(180),
          desiredRate: new Decimal(0.9),
          status: ExchangeStatus.OPEN,
          trustLevel: 2,
          securityDeposit: new Decimal(30),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      mockPrisma.exchangeRequest.findMany.mockResolvedValueOnce(openRequests);

      mockPrisma.exchangeRequest.findUnique
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(openRequests[1]);

      mockPrisma.exchangeRequest.findMany.mockResolvedValueOnce([]);

      const matchCount = await service.runMatching();

      expect(matchCount).toBe(0);
    });
  });

  // ============================================================
  // findCompatibleRequests() Tests
  // ============================================================

  describe('findCompatibleRequests', () => {
    it('should find compatible counter-requests', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      const counterRequests = [
        {
          id: 2,
          userId: 2,
          fromCurrency: 'SAR',
          toCurrency: 'USD',
          fromAmount: new Decimal(380), // Within 10% tolerance
          toAmount: new Decimal(100),
          desiredRate: new Decimal(0.2632),
          status: ExchangeStatus.OPEN,
          trustLevel: 2,
          securityDeposit: new Decimal(40),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(request as any);
      mockPrisma.exchangeRequest.findMany.mockResolvedValue(counterRequests as any);

      const compatible = await service.findCompatibleRequests(1);

      expect(compatible).toHaveLength(1);
      expect(compatible[0].id).toBe(2);
    });

    it('should filter out incompatible amounts', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      const counterRequests = [
        {
          id: 2,
          userId: 2,
          fromCurrency: 'SAR',
          toCurrency: 'USD',
          fromAmount: new Decimal(500), // More than 10% difference
          toAmount: new Decimal(100),
          desiredRate: new Decimal(0.2),
          status: ExchangeStatus.OPEN,
          trustLevel: 2,
          securityDeposit: new Decimal(50),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(request as any);
      mockPrisma.exchangeRequest.findMany.mockResolvedValue(counterRequests as any);

      const compatible = await service.findCompatibleRequests(1);

      expect(compatible).toHaveLength(0);
    });

    it('should exclude same user requests', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(request as any);
      mockPrisma.exchangeRequest.findMany.mockResolvedValue([]);

      const compatible = await service.findCompatibleRequests(1);

      expect(compatible).toHaveLength(0);
      expect(mockPrisma.exchangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: { not: 1 },
          }),
        })
      );
    });

    it('should throw error if request not found', async () => {
      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(null);

      await expect(service.findCompatibleRequests(999)).rejects.toThrow(
        ExchangeRequestNotFoundError
      );
    });
  });

  // ============================================================
  // calculateMatchScore() Tests
  // ============================================================

  describe('calculateMatchScore', () => {
    it('should give high score for perfect match', () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        trustLevel: 2,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
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
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      };

      const score = service.calculateMatchScore(request, counterRequest);

      expect(score.gte(90)).toBe(true); // Should be very high
    });

    it('should give lower score for rate mismatch', () => {
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
        desiredRate: new Decimal(0.24), // 10% different rate
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        createdAt: new Date(),
      };

      const score = service.calculateMatchScore(request, counterRequest);

      expect(score.lt(80)).toBe(true);
    });

    it('should give lower score for amount mismatch', () => {
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
        fromAmount: new Decimal(400), // 6.7% different
        toAmount: new Decimal(100),
        desiredRate: new Decimal(0.2667),
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        createdAt: new Date(),
      };

      const score = service.calculateMatchScore(request, counterRequest);

      expect(score.lt(90)).toBe(true);
    });

    it('should give lower score for trust level mismatch', () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        trustLevel: 1,
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
        trustLevel: 4, // 3 levels different
        securityDeposit: new Decimal(40),
        createdAt: new Date(),
      };

      const score = service.calculateMatchScore(request, counterRequest);

      expect(score.lt(85)).toBe(true);
    });

    it('should give higher score for older requests', () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        trustLevel: 2,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
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
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
      };

      const scoreOld = service.calculateMatchScore(request, counterRequest);

      const requestNew = { ...request, createdAt: new Date() };
      const counterRequestNew = { ...counterRequest, createdAt: new Date() };

      const scoreNew = service.calculateMatchScore(requestNew, counterRequestNew);

      expect(scoreOld.gt(scoreNew)).toBe(true);
    });
  });

  // ============================================================
  // createMatch() Tests
  // ============================================================

  describe('createMatch', () => {
    it('should create match with internal settlement for small amounts', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any)
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      mockPrisma.exchangeMatch.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      mockPrisma.exchangeMatch.create.mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const match = await service.createMatch(
        1,
        2,
        MatchType.AUTOMATIC,
        new Decimal(85)
      );

      expect(match.settlementMethod).toBe(SettlementMethod.INTERNAL);
      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledTimes(2);
    });

    it('should create match with external mandatory settlement for large amounts', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(6000), // Large amount
        toAmount: new Decimal(22500),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 4,
        securityDeposit: new Decimal(600),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      const counterRequest = {
        id: 2,
        userId: 2,
        fromCurrency: 'SAR',
        toCurrency: 'USD',
        fromAmount: new Decimal(22500),
        toAmount: new Decimal(6000),
        desiredRate: new Decimal(0.2667),
        status: ExchangeStatus.OPEN,
        trustLevel: 4,
        securityDeposit: new Decimal(2250),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any)
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      mockPrisma.exchangeMatch.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      mockPrisma.exchangeMatch.create.mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(90),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.EXTERNAL_MANDATORY,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const match = await service.createMatch(
        1,
        2,
        MatchType.AUTOMATIC,
        new Decimal(90)
      );

      expect(match.settlementMethod).toBe(SettlementMethod.EXTERNAL_MANDATORY);
    });

    it('should create match with external optional settlement when protection fee present', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(500),
        toAmount: new Decimal(1875),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(50),
        protectionFee: new Decimal(5), // User opted for protection
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      const counterRequest = {
        id: 2,
        userId: 2,
        fromCurrency: 'SAR',
        toCurrency: 'USD',
        fromAmount: new Decimal(1875),
        toAmount: new Decimal(500),
        desiredRate: new Decimal(0.2667),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(187.5),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any)
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      mockPrisma.exchangeMatch.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      mockPrisma.exchangeMatch.create.mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(88),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.EXTERNAL_OPTIONAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const match = await service.createMatch(
        1,
        2,
        MatchType.AUTOMATIC,
        new Decimal(88)
      );

      expect(match.settlementMethod).toBe(SettlementMethod.EXTERNAL_OPTIONAL);
    });

    it('should update both request statuses to MATCHED', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any)
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      mockPrisma.exchangeMatch.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      mockPrisma.exchangeMatch.create.mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.AUTOMATIC,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.createMatch(1, 2, MatchType.AUTOMATIC, new Decimal(85));

      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: ExchangeStatus.MATCHED,
          }),
        })
      );

      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: expect.objectContaining({
            status: ExchangeStatus.MATCHED,
          }),
        })
      );
    });
  });

  // ============================================================
  // manualAccept() Tests
  // ============================================================

  describe('manualAccept', () => {
    it('should create manual match when user accepts offer', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        protectionFee: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any)
        .mockResolvedValueOnce(counterRequest as any)
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      mockPrisma.exchangeMatch.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      mockPrisma.exchangeMatch.create.mockResolvedValue({
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        matchType: MatchType.MANUAL,
        matchScore: new Decimal(85),
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const match = await service.manualAccept({
        userId: 1,
        requestId: 1,
        counterRequestId: 2,
      });

      expect(match.matchType).toBe(MatchType.MANUAL);
    });

    it('should throw error if user does not own request', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(request as any);

      await expect(
        service.manualAccept({
          userId: 999, // Different user
          requestId: 1,
          counterRequestId: 2,
        })
      ).rejects.toThrow('Unauthorized');
    });
  });

  // ============================================================
  // validateMatch() Tests
  // ============================================================

  describe('validateMatch', () => {
    it('should validate compatible requests', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      mockPrisma.exchangeMatch.findFirst.mockResolvedValue(null);

      await expect(service.validateMatch(1, 2)).resolves.not.toThrow();
    });

    it('should throw error if request not found', async () => {
      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({} as any);

      await expect(service.validateMatch(999, 2)).rejects.toThrow(
        ExchangeRequestNotFoundError
      );
    });

    it('should throw error if request status is not OPEN', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.COMPLETED, // Not OPEN
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      await expect(service.validateMatch(1, 2)).rejects.toThrow(
        InvalidExchangeStatusError
      );
    });

    it('should throw error if request has expired', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        expiresAt: new Date(Date.now() - 1000), // Expired
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
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      await expect(service.validateMatch(1, 2)).rejects.toThrow('has expired');
    });

    it('should throw error if currency pairs are incompatible', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      const counterRequest = {
        id: 2,
        userId: 2,
        fromCurrency: 'EUR', // Wrong currency
        toCurrency: 'GBP',
        fromAmount: new Decimal(375),
        toAmount: new Decimal(100),
        desiredRate: new Decimal(0.2667),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      await expect(service.validateMatch(1, 2)).rejects.toThrow(
        'Currency pairs are not compatible'
      );
    });

    it('should throw error if security deposit is insufficient', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(5), // Insufficient (< 10% of amount)
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      await expect(service.validateMatch(1, 2)).rejects.toThrow(
        InsufficientSecurityDepositError
      );
    });

    it('should throw error if request is already matched', async () => {
      const request = {
        id: 1,
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(375),
        desiredRate: new Decimal(3.75),
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(20),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
        status: ExchangeStatus.OPEN,
        trustLevel: 2,
        securityDeposit: new Decimal(40),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique
        .mockResolvedValueOnce(request as any)
        .mockResolvedValueOnce(counterRequest as any);

      mockPrisma.exchangeMatch.findFirst.mockResolvedValue({
        id: 99,
        requestId: 1,
        counterRequestId: 3,
      } as any);

      await expect(service.validateMatch(1, 2)).rejects.toThrow(
        'already matched'
      );
    });
  });
});
