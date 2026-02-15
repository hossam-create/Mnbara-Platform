// ============================================================
// Trust Level Service Tests
// Comprehensive tests for Layer 2: Anti-Scam
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { TrustLevelService } from '../trust-level.service';
import {
  TrustLevelNotFoundError,
  ExceedsTransactionLimitError,
  InsufficientTrustLevelError,
} from '../../errors/ExchangeErrors';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    trustLevel: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('TrustLevelService', () => {
  let service: TrustLevelService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    service = new TrustLevelService(mockPrisma);
  });

  // ============================================================
  // 1. GET TRUST LEVEL TESTS
  // ============================================================

  describe('getTrustLevel', () => {
    it('should return trust level when found', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 123,
        level: 2,
        maxTransactionAmount: new Decimal(500),
        successfulExchanges: 10,
        totalVolume: new Decimal(1000),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);

      const result = await service.getTrustLevel(123);

      expect(result.userId).toBe(123);
      expect(result.level).toBe(2);
      expect(mockPrisma.trustLevel.findUnique).toHaveBeenCalledWith({
        where: { userId: 123 },
      });
    });

    it('should throw TrustLevelNotFoundError when not found', async () => {
      mockPrisma.trustLevel.findUnique.mockResolvedValue(null);

      await expect(service.getTrustLevel(123)).rejects.toThrow(
        TrustLevelNotFoundError
      );
    });
  });

  // ============================================================
  // 2. INITIALIZE TRUST LEVEL TESTS
  // ============================================================

  describe('initializeTrustLevel', () => {
    it('should create Level 1 trust level for new user', async () => {
      mockPrisma.trustLevel.findUnique.mockResolvedValue(null);

      const mockTrustLevel = {
        id: 1,
        userId: 456,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 0,
        totalVolume: new Decimal(0),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.create.mockResolvedValue(mockTrustLevel);

      const result = await service.initializeTrustLevel(456);

      expect(result.userId).toBe(456);
      expect(result.level).toBe(1);
      expect(result.maxTransactionAmount.toString()).toBe('100');
      expect(mockPrisma.trustLevel.create).toHaveBeenCalledWith({
        data: {
          userId: 456,
          level: 1,
          maxTransactionAmount: new Decimal(100),
          successfulExchanges: 0,
          totalVolume: new Decimal(0),
          disputeCount: 0,
          timeoutCount: 0,
        },
      });
    });

    it('should return existing trust level if already initialized', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 456,
        level: 2,
        maxTransactionAmount: new Decimal(500),
        successfulExchanges: 10,
        totalVolume: new Decimal(1000),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);

      const result = await service.initializeTrustLevel(456);

      expect(result.level).toBe(2);
      expect(mockPrisma.trustLevel.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 3. UPDATE AFTER EXCHANGE TESTS
  // ============================================================

  describe('updateAfterExchange', () => {
    it('should increment counters after successful exchange', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 123,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 3,
        totalVolume: new Decimal(300),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);
      mockPrisma.trustLevel.update.mockResolvedValue(mockTrustLevel);

      await service.updateAfterExchange(123, new Decimal(50));

      expect(mockPrisma.trustLevel.update).toHaveBeenCalledWith({
        where: { userId: 123 },
        data: expect.objectContaining({
          successfulExchanges: 4,
          totalVolume: new Decimal(350),
        }),
      });
    });

    it('should level up when requirements are met', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 123,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 4,
        totalVolume: new Decimal(450),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);
      mockPrisma.trustLevel.update.mockResolvedValue(mockTrustLevel);

      await service.updateAfterExchange(123, new Decimal(50));

      expect(mockPrisma.trustLevel.update).toHaveBeenCalledWith({
        where: { userId: 123 },
        data: expect.objectContaining({
          level: 2,
          maxTransactionAmount: new Decimal(500),
          successfulExchanges: 5,
          totalVolume: new Decimal(500),
        }),
      });
    });
  });

  // ============================================================
  // 4. DOWNGRADE LEVEL TESTS
  // ============================================================

  describe('downgradeLevel', () => {
    it('should increment dispute count', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 123,
        level: 2,
        maxTransactionAmount: new Decimal(500),
        successfulExchanges: 10,
        totalVolume: new Decimal(1000),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);
      mockPrisma.trustLevel.update.mockResolvedValue(mockTrustLevel);

      await service.downgradeLevel(123, 'dispute');

      expect(mockPrisma.trustLevel.update).toHaveBeenCalledWith({
        where: { userId: 123 },
        data: expect.objectContaining({
          disputeCount: 1,
        }),
      });
    });

    it('should downgrade level when dispute limit exceeded', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 123,
        level: 2,
        maxTransactionAmount: new Decimal(500),
        successfulExchanges: 10,
        totalVolume: new Decimal(1000),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);
      mockPrisma.trustLevel.update.mockResolvedValue(mockTrustLevel);

      await service.downgradeLevel(123, 'dispute');

      expect(mockPrisma.trustLevel.update).toHaveBeenCalledWith({
        where: { userId: 123 },
        data: expect.objectContaining({
          disputeCount: 1,
          level: 1,
          maxTransactionAmount: new Decimal(100),
        }),
      });
    });

    it('should not downgrade below level 1', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 123,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 3,
        totalVolume: new Decimal(300),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);
      mockPrisma.trustLevel.update.mockResolvedValue(mockTrustLevel);

      await service.downgradeLevel(123, 'dispute');

      expect(mockPrisma.trustLevel.update).toHaveBeenCalledWith({
        where: { userId: 123 },
        data: expect.objectContaining({
          level: 1,
        }),
      });
    });
  });

  // ============================================================
  // 5. CAN PERFORM EXCHANGE TESTS
  // ============================================================

  describe('canPerformExchange', () => {
    it('should allow exchange within limit', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 123,
        level: 2,
        maxTransactionAmount: new Decimal(500),
        successfulExchanges: 10,
        totalVolume: new Decimal(1000),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);

      const result = await service.canPerformExchange(123, new Decimal(300));

      expect(result.canPerformExchange).toBe(true);
      expect(result.maxAllowedAmount.toString()).toBe('500');
    });

    it('should reject exchange exceeding limit', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 123,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 3,
        totalVolume: new Decimal(300),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);

      const result = await service.canPerformExchange(123, new Decimal(200));

      expect(result.canPerformExchange).toBe(false);
      expect(result.reason).toContain('exceeds trust level');
      expect(result.maxAllowedAmount.toString()).toBe('100');
    });

    it('should initialize trust level for new user', async () => {
      mockPrisma.trustLevel.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          userId: 789,
          level: 1,
          maxTransactionAmount: new Decimal(100),
          successfulExchanges: 0,
          totalVolume: new Decimal(0),
          disputeCount: 0,
          timeoutCount: 0,
          lastLevelUpAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockPrisma.trustLevel.create.mockResolvedValue({
        id: 1,
        userId: 789,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 0,
        totalVolume: new Decimal(0),
        disputeCount: 0,
        timeoutCount: 0,
        lastLevelUpAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.canPerformExchange(789, new Decimal(50));

      expect(result.canPerformExchange).toBe(true);
      expect(mockPrisma.trustLevel.create).toHaveBeenCalled();
    });
  });

  // ============================================================
  // 6. GET MAX TRANSACTION AMOUNT TESTS
  // ============================================================

  describe('getMaxTransactionAmount', () => {
    it('should return max transaction amount', async () => {
      const mockTrustLevel = {
        id: 1,
        userId: 123,
        level: 3,
        maxTransactionAmount: new Decimal(2000),
        successfulExchanges: 25,
        totalVolume: new Decimal(6000),
        disputeCount: 0,
        timeoutCount: 1,
        lastLevelUpAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.trustLevel.findUnique.mockResolvedValue(mockTrustLevel);

      const result = await service.getMaxTransactionAmount(123);

      expect(result.toString()).toBe('2000');
    });
  });
});
