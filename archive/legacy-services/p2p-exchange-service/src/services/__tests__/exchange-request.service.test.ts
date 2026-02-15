// ============================================================
// Exchange Request Service Tests
// Comprehensive tests for Exchange Request Management
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { ExchangeRequestService } from '../exchange-request.service';
import { ExchangeStatus } from '../../types/enums';
import {
  ExchangeRequestNotFoundError,
  InvalidExchangeStatusError,
  InvalidAmountError,
  InvalidCurrencyPairError,
} from '../../errors/ExchangeErrors';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    exchangeRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('ExchangeRequestService', () => {
  let service: ExchangeRequestService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    service = new ExchangeRequestService(mockPrisma);
  });

  // ============================================================
  // 1. CREATE REQUEST TESTS
  // ============================================================

  describe('createRequest', () => {
    it('should create exchange request with valid input', async () => {
      const input = {
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(100),
        desiredRate: new Decimal(0.85),
        expiresIn: 24,
        useExternalEscrow: false,
      };

      const mockRequest = {
        id: 1,
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(85),
        desiredRate: new Decimal(0.85),
        actualRate: null,
        platformFee: new Decimal(1.5),
        protectionFee: null,
        status: ExchangeStatus.OPEN,
        trustLevel: 1,
        securityDeposit: new Decimal(10),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        matchedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.exchangeRequest.create.mockResolvedValue(mockRequest);

      const result = await service.createRequest(input);

      expect(result.request.userId).toBe(123);
      expect(result.request.fromCurrency).toBe('USD');
      expect(result.request.toCurrency).toBe('EUR');
      expect(result.request.status).toBe(ExchangeStatus.OPEN);
      expect(result.estimatedMatchTime).toBeGreaterThan(0);
      expect(mockPrisma.exchangeRequest.create).toHaveBeenCalled();
    });

    it('should calculate platform fee correctly for small amount', async () => {
      const input = {
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(200),
        desiredRate: new Decimal(0.85),
        expiresIn: 24,
        useExternalEscrow: false,
      };

      const mockRequest = {
        id: 1,
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(200),
        toAmount: new Decimal(170),
        desiredRate: new Decimal(0.85),
        actualRate: null,
        platformFee: new Decimal(3), // 1.5% of 200
        protectionFee: null,
        status: ExchangeStatus.OPEN,
        trustLevel: 1,
        securityDeposit: new Decimal(10),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        matchedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.exchangeRequest.create.mockResolvedValue(mockRequest);

      const result = await service.createRequest(input);

      expect(result.request.platformFee.toString()).toBe('3');
    });

    it('should add protection fee when using external escrow', async () => {
      const input = {
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(100),
        desiredRate: new Decimal(0.85),
        expiresIn: 24,
        useExternalEscrow: true,
      };

      const mockRequest = {
        id: 1,
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(85),
        desiredRate: new Decimal(0.85),
        actualRate: null,
        platformFee: new Decimal(1.5),
        protectionFee: new Decimal(2),
        status: ExchangeStatus.OPEN,
        trustLevel: 1,
        securityDeposit: new Decimal(10),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        matchedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.exchangeRequest.create.mockResolvedValue(mockRequest);

      const result = await service.createRequest(input);

      expect(result.request.protectionFee).not.toBeNull();
      expect(result.request.protectionFee?.toString()).toBe('2');
    });

    it('should reject negative amount', async () => {
      const input = {
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(-100),
        desiredRate: new Decimal(0.85),
        expiresIn: 24,
        useExternalEscrow: false,
      };

      await expect(service.createRequest(input)).rejects.toThrow(InvalidAmountError);
    });

    it('should reject same currency pair', async () => {
      const input = {
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'USD',
        fromAmount: new Decimal(100),
        desiredRate: new Decimal(1),
        expiresIn: 24,
        useExternalEscrow: false,
      };

      await expect(service.createRequest(input)).rejects.toThrow(
        InvalidCurrencyPairError
      );
    });

    it('should reject invalid expiration time', async () => {
      const input = {
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(100),
        desiredRate: new Decimal(0.85),
        expiresIn: 200, // > 168 hours
        useExternalEscrow: false,
      };

      await expect(service.createRequest(input)).rejects.toThrow(
        'Expiration must be between 1 and 168 hours'
      );
    });
  });

  // ============================================================
  // 2. GET REQUEST TESTS
  // ============================================================

  describe('getRequest', () => {
    it('should return request when found', async () => {
      const mockRequest = {
        id: 1,
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(85),
        desiredRate: new Decimal(0.85),
        actualRate: null,
        platformFee: new Decimal(1.5),
        protectionFee: null,
        status: ExchangeStatus.OPEN,
        trustLevel: 1,
        securityDeposit: new Decimal(10),
        expiresAt: new Date(),
        matchedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(mockRequest);

      const result = await service.getRequest(1);

      expect(result.id).toBe(1);
      expect(result.userId).toBe(123);
      expect(mockPrisma.exchangeRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw ExchangeRequestNotFoundError when not found', async () => {
      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(null);

      await expect(service.getRequest(999)).rejects.toThrow(
        ExchangeRequestNotFoundError
      );
    });
  });

  // ============================================================
  // 3. GET USER REQUESTS TESTS
  // ============================================================

  describe('getUserRequests', () => {
    it('should return user requests with filters', async () => {
      const mockRequests = [
        {
          id: 1,
          userId: 123,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: new Decimal(100),
          toAmount: new Decimal(85),
          desiredRate: new Decimal(0.85),
          actualRate: null,
          platformFee: new Decimal(1.5),
          protectionFee: null,
          status: ExchangeStatus.OPEN,
          trustLevel: 1,
          securityDeposit: new Decimal(10),
          expiresAt: new Date(),
          matchedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.exchangeRequest.findMany.mockResolvedValue(mockRequests);

      const result = await service.getUserRequests(123, {
        status: ExchangeStatus.OPEN,
        fromCurrency: 'USD',
      });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(123);
      expect(mockPrisma.exchangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 123,
            status: ExchangeStatus.OPEN,
            fromCurrency: 'USD',
          }),
        })
      );
    });

    it('should support pagination', async () => {
      mockPrisma.exchangeRequest.findMany.mockResolvedValue([]);

      await service.getUserRequests(123, {
        page: 2,
        limit: 20,
      });

      expect(mockPrisma.exchangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 20,
        })
      );
    });
  });

  // ============================================================
  // 4. GET OPEN REQUESTS (MARKETPLACE) TESTS
  // ============================================================

  describe('getOpenRequests', () => {
    it('should return open requests for marketplace', async () => {
      const mockRequests = [
        {
          id: 1,
          userId: 456,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: new Decimal(100),
          toAmount: new Decimal(85),
          desiredRate: new Decimal(0.85),
          actualRate: null,
          platformFee: new Decimal(1.5),
          protectionFee: null,
          status: ExchangeStatus.OPEN,
          trustLevel: 2,
          securityDeposit: new Decimal(10),
          expiresAt: new Date(),
          matchedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.exchangeRequest.findMany.mockResolvedValue(mockRequests);

      const result = await service.getOpenRequests({
        fromCurrency: 'USD',
        toCurrency: 'EUR',
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(ExchangeStatus.OPEN);
      expect(mockPrisma.exchangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ExchangeStatus.OPEN,
            fromCurrency: 'USD',
            toCurrency: 'EUR',
          }),
        })
      );
    });

    it('should filter by amount range', async () => {
      mockPrisma.exchangeRequest.findMany.mockResolvedValue([]);

      await service.getOpenRequests({
        minAmount: new Decimal(100),
        maxAmount: new Decimal(500),
      });

      expect(mockPrisma.exchangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fromAmount: {
              gte: new Decimal(100),
              lte: new Decimal(500),
            },
          }),
        })
      );
    });

    it('should filter by trust level', async () => {
      mockPrisma.exchangeRequest.findMany.mockResolvedValue([]);

      await service.getOpenRequests({
        minTrustLevel: 2,
      });

      expect(mockPrisma.exchangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            trustLevel: { gte: 2 },
          }),
        })
      );
    });

    it('should support sorting by rate', async () => {
      mockPrisma.exchangeRequest.findMany.mockResolvedValue([]);

      await service.getOpenRequests({
        sortBy: 'rate',
        sortOrder: 'asc',
      });

      expect(mockPrisma.exchangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { desiredRate: 'asc' },
        })
      );
    });

    it('should support sorting by amount', async () => {
      mockPrisma.exchangeRequest.findMany.mockResolvedValue([]);

      await service.getOpenRequests({
        sortBy: 'amount',
        sortOrder: 'desc',
      });

      expect(mockPrisma.exchangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { fromAmount: 'desc' },
        })
      );
    });
  });

  // ============================================================
  // 5. CANCEL REQUEST TESTS
  // ============================================================

  describe('cancelRequest', () => {
    it('should cancel open request', async () => {
      const mockRequest = {
        id: 1,
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(85),
        desiredRate: new Decimal(0.85),
        actualRate: null,
        platformFee: new Decimal(1.5),
        protectionFee: null,
        status: ExchangeStatus.OPEN,
        trustLevel: 1,
        securityDeposit: new Decimal(10),
        expiresAt: new Date(),
        matchedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.exchangeRequest.update.mockResolvedValue(mockRequest);

      await service.cancelRequest(1, 123);

      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: ExchangeStatus.CANCELLED },
      });
    });

    it('should reject cancellation by non-owner', async () => {
      const mockRequest = {
        id: 1,
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(85),
        desiredRate: new Decimal(0.85),
        actualRate: null,
        platformFee: new Decimal(1.5),
        protectionFee: null,
        status: ExchangeStatus.OPEN,
        trustLevel: 1,
        securityDeposit: new Decimal(10),
        expiresAt: new Date(),
        matchedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(mockRequest);

      await expect(service.cancelRequest(1, 456)).rejects.toThrow('Unauthorized');
    });

    it('should reject cancellation of completed request', async () => {
      const mockRequest = {
        id: 1,
        userId: 123,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: new Decimal(100),
        toAmount: new Decimal(85),
        desiredRate: new Decimal(0.85),
        actualRate: null,
        platformFee: new Decimal(1.5),
        protectionFee: null,
        status: ExchangeStatus.COMPLETED,
        trustLevel: 1,
        securityDeposit: new Decimal(10),
        expiresAt: new Date(),
        matchedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.exchangeRequest.findUnique.mockResolvedValue(mockRequest);

      await expect(service.cancelRequest(1, 123)).rejects.toThrow(
        InvalidExchangeStatusError
      );
    });
  });

  // ============================================================
  // 6. UPDATE STATUS TESTS
  // ============================================================

  describe('updateStatus', () => {
    it('should update status to MATCHED', async () => {
      mockPrisma.exchangeRequest.update.mockResolvedValue({});

      await service.updateStatus(1, ExchangeStatus.MATCHED);

      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: ExchangeStatus.MATCHED,
          matchedAt: expect.any(Date),
        }),
      });
    });

    it('should update status to COMPLETED', async () => {
      mockPrisma.exchangeRequest.update.mockResolvedValue({});

      await service.updateStatus(1, ExchangeStatus.COMPLETED);

      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: ExchangeStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      });
    });
  });

  // ============================================================
  // 7. EXPIRE OLD REQUESTS TESTS
  // ============================================================

  describe('expireOldRequests', () => {
    it('should expire old open requests', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const mockExpiredRequests = [
        {
          id: 1,
          userId: 123,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: new Decimal(100),
          toAmount: new Decimal(85),
          desiredRate: new Decimal(0.85),
          actualRate: null,
          platformFee: new Decimal(1.5),
          protectionFee: null,
          status: ExchangeStatus.OPEN,
          trustLevel: 1,
          securityDeposit: new Decimal(10),
          expiresAt: expiredDate,
          matchedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.exchangeRequest.findMany.mockResolvedValue(mockExpiredRequests);
      mockPrisma.exchangeRequest.update.mockResolvedValue({});

      await service.expireOldRequests();

      expect(mockPrisma.exchangeRequest.findMany).toHaveBeenCalledWith({
        where: {
          status: ExchangeStatus.OPEN,
          expiresAt: { lte: expect.any(Date) },
        },
      });

      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: ExchangeStatus.EXPIRED },
      });
    });

    it('should handle no expired requests', async () => {
      mockPrisma.exchangeRequest.findMany.mockResolvedValue([]);

      await service.expireOldRequests();

      expect(mockPrisma.exchangeRequest.update).not.toHaveBeenCalled();
    });
  });
});
