// ============================================================
// Settlement Coordinator Service Tests
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { SettlementCoordinatorService } from '../settlement-coordinator.service';
import {
  SettlementMethod,
  SettlementStatus,
  MatchStatus,
  ExchangeStatus,
} from '../../types/enums';
import {
  SettlementNotFoundError,
  InvalidSettlementStatusError,
} from '../../errors/ExchangeErrors';

// Mock Prisma Client
jest.mock('@prisma/client');

describe('SettlementCoordinatorService', () => {
  let service: SettlementCoordinatorService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      settlement: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      exchangeMatch: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      exchangeRequest: {
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;

    service = new SettlementCoordinatorService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // initiateSettlement() Tests
  // ============================================================

  describe('initiateSettlement', () => {
    it('should initiate internal settlement', async () => {
      const match = {
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        status: MatchStatus.ESCROWED,
        settlementMethod: SettlementMethod.INTERNAL,
        request: {
          id: 1,
          userId: 1,
          fromCurrency: 'USD',
          toCurrency: 'SAR',
          fromAmount: new Decimal(100),
        },
        counterRequest: {
          id: 2,
          userId: 2,
          fromCurrency: 'SAR',
          toCurrency: 'USD',
          fromAmount: new Decimal(375),
        },
      };

      const settlement = {
        id: 1,
        matchId: 1,
        method: SettlementMethod.INTERNAL,
        status: SettlementStatus.PENDING,
        retryCount: 0,
        initiatedAt: new Date(),
      };

      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(match as any);
      mockPrisma.settlement.create.mockResolvedValue(settlement as any);
      mockPrisma.exchangeMatch.update.mockResolvedValue({} as any);

      // Mock internal settlement processing
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      mockPrisma.settlement.findUnique.mockResolvedValue({
        ...settlement,
        settlement,
      } as any);

      const result = await service.initiateSettlement({ matchId: 1 });

      expect(result.matchId).toBe(1);
      expect(result.method).toBe(SettlementMethod.INTERNAL);
      expect(mockPrisma.settlement.create).toHaveBeenCalled();
    });

    it('should initiate external settlement', async () => {
      const match = {
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        status: MatchStatus.ESCROWED,
        settlementMethod: SettlementMethod.EXTERNAL_MANDATORY,
        request: {
          id: 1,
          userId: 1,
          fromCurrency: 'USD',
          toCurrency: 'SAR',
          fromAmount: new Decimal(6000),
        },
        counterRequest: {
          id: 2,
          userId: 2,
          fromCurrency: 'SAR',
          toCurrency: 'USD',
          fromAmount: new Decimal(22500),
        },
      };

      const settlement = {
        id: 1,
        matchId: 1,
        method: SettlementMethod.EXTERNAL_MANDATORY,
        status: SettlementStatus.PENDING,
        retryCount: 0,
        initiatedAt: new Date(),
      };

      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(match as any);
      mockPrisma.settlement.create.mockResolvedValue(settlement as any);
      mockPrisma.exchangeMatch.update.mockResolvedValue({} as any);
      mockPrisma.settlement.update.mockResolvedValue({} as any);

      const result = await service.initiateSettlement({
        matchId: 1,
        externalEscrowProvider: 'tatum',
      });

      expect(result.matchId).toBe(1);
      expect(result.method).toBe(SettlementMethod.EXTERNAL_MANDATORY);
    });

    it('should throw error if match not found', async () => {
      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(null);

      await expect(service.initiateSettlement({ matchId: 999 })).rejects.toThrow(
        'Match 999 not found'
      );
    });

    it('should throw error if match not in ESCROWED status', async () => {
      const match = {
        id: 1,
        status: MatchStatus.PENDING,
        settlementMethod: SettlementMethod.INTERNAL,
      };

      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(match as any);

      await expect(service.initiateSettlement({ matchId: 1 })).rejects.toThrow(
        'must be in ESCROWED status'
      );
    });
  });

  // ============================================================
  // processInternalSettlement() Tests
  // ============================================================

  describe('processInternalSettlement', () => {
    it('should complete internal settlement successfully', async () => {
      const match = {
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        status: MatchStatus.SETTLING,
        request: {
          id: 1,
          userId: 1,
        },
        counterRequest: {
          id: 2,
          userId: 2,
        },
        settlement: {
          id: 1,
          matchId: 1,
          status: SettlementStatus.PENDING,
        },
      };

      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(match as any);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      await service.processInternalSettlement(1);

      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: SettlementStatus.COMPLETED,
          }),
        })
      );

      expect(mockPrisma.exchangeMatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: MatchStatus.COMPLETED,
          }),
        })
      );

      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledTimes(2);
    });

    it('should fail settlement on error', async () => {
      const match = {
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        settlement: {
          id: 1,
          matchId: 1,
        },
      };

      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(match as any);

      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.processInternalSettlement(1)).rejects.toThrow(
        'Database error'
      );
    });
  });

  // ============================================================
  // processExternalSettlement() Tests
  // ============================================================

  describe('processExternalSettlement', () => {
    it('should initiate external settlement', async () => {
      const match = {
        id: 1,
        requestId: 1,
        counterRequestId: 2,
        settlement: {
          id: 1,
          matchId: 1,
          status: SettlementStatus.PENDING,
        },
        request: {
          id: 1,
          userId: 1,
        },
        counterRequest: {
          id: 2,
          userId: 2,
        },
      };

      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(match as any);
      mockPrisma.settlement.update.mockResolvedValue({} as any);

      await service.processExternalSettlement(1, 'tatum');

      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: SettlementStatus.PSP_PROCESSING,
            externalEscrowProvider: 'tatum',
          }),
        })
      );
    });

    it('should throw error if match not found', async () => {
      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(null);

      await expect(service.processExternalSettlement(999, 'tatum')).rejects.toThrow(
        'Match 999'
      );
    });
  });

  // ============================================================
  // handlePSPWebhook() Tests
  // ============================================================

  describe('handlePSPWebhook', () => {
    it('should complete settlement on successful webhook', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        pspTransactionId: 'txn_123',
        pspProvider: 'stripe',
        status: SettlementStatus.PSP_PROCESSING,
        match: {
          id: 1,
          requestId: 1,
          counterRequestId: 2,
          request: {
            id: 1,
            userId: 1,
          },
          counterRequest: {
            id: 2,
            userId: 2,
          },
        },
      };

      mockPrisma.settlement.findFirst.mockResolvedValue(settlement as any);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      await service.handlePSPWebhook('stripe', {
        transactionId: 'txn_123',
        status: 'completed',
      });

      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: SettlementStatus.COMPLETED,
          }),
        })
      );
    });

    it('should fail settlement on failed webhook', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        pspTransactionId: 'txn_123',
        pspProvider: 'stripe',
        status: SettlementStatus.PSP_PROCESSING,
        match: {
          id: 1,
          requestId: 1,
          counterRequestId: 2,
        },
      };

      mockPrisma.settlement.findFirst.mockResolvedValue(settlement as any);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      await service.handlePSPWebhook('stripe', {
        transactionId: 'txn_123',
        status: 'failed',
        metadata: {
          failureReason: 'Insufficient funds',
        },
      });

      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: SettlementStatus.FAILED,
            failureReason: 'Insufficient funds',
          }),
        })
      );
    });

    it('should update status on pending webhook', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        pspTransactionId: 'txn_123',
        pspProvider: 'stripe',
        status: SettlementStatus.PSP_PROCESSING,
      };

      mockPrisma.settlement.findFirst.mockResolvedValue(settlement as any);
      mockPrisma.settlement.update.mockResolvedValue({} as any);

      await service.handlePSPWebhook('stripe', {
        transactionId: 'txn_123',
        status: 'pending',
      });

      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            pspStatus: 'pending',
          }),
        })
      );
    });

    it('should handle settlement not found gracefully', async () => {
      mockPrisma.settlement.findFirst.mockResolvedValue(null);

      // Should not throw
      await service.handlePSPWebhook('stripe', {
        transactionId: 'txn_999',
        status: 'completed',
      });

      expect(mockPrisma.settlement.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // retrySettlement() Tests
  // ============================================================

  describe('retrySettlement', () => {
    it('should retry failed internal settlement', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        method: SettlementMethod.INTERNAL,
        status: SettlementStatus.FAILED,
        retryCount: 0,
        match: {
          id: 1,
          requestId: 1,
          counterRequestId: 2,
          request: {
            id: 1,
            userId: 1,
          },
          counterRequest: {
            id: 2,
            userId: 2,
          },
          settlement: {
            id: 1,
            matchId: 1,
          },
        },
      };

      mockPrisma.settlement.findUnique.mockResolvedValue(settlement as any);
      mockPrisma.settlement.update.mockResolvedValue({} as any);

      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(settlement.match as any);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      await service.retrySettlement(1);

      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: SettlementStatus.PENDING,
            retryCount: 1,
          }),
        })
      );
    });

    it('should retry failed external settlement', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        method: SettlementMethod.EXTERNAL_MANDATORY,
        status: SettlementStatus.FAILED,
        retryCount: 1,
        externalEscrowProvider: 'tatum',
        match: {
          id: 1,
          requestId: 1,
          counterRequestId: 2,
          settlement: {
            id: 1,
            matchId: 1,
          },
        },
      };

      mockPrisma.settlement.findUnique
        .mockResolvedValueOnce(settlement as any)
        .mockResolvedValueOnce(settlement as any);

      mockPrisma.settlement.update.mockResolvedValue({} as any);

      mockPrisma.exchangeMatch.findUnique.mockResolvedValue(settlement.match as any);

      await service.retrySettlement(1);

      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: SettlementStatus.PENDING,
            retryCount: 2,
          }),
        })
      );
    });

    it('should throw error if settlement not found', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue(null);

      await expect(service.retrySettlement(999)).rejects.toThrow(
        SettlementNotFoundError
      );
    });

    it('should throw error if settlement not in FAILED status', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        status: SettlementStatus.COMPLETED,
        retryCount: 0,
      };

      mockPrisma.settlement.findUnique.mockResolvedValue(settlement as any);

      await expect(service.retrySettlement(1)).rejects.toThrow(
        InvalidSettlementStatusError
      );
    });

    it('should throw error if retry limit exceeded', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        status: SettlementStatus.FAILED,
        retryCount: 3,
      };

      mockPrisma.settlement.findUnique.mockResolvedValue(settlement as any);

      await expect(service.retrySettlement(1)).rejects.toThrow(
        'exceeded retry limit'
      );
    });
  });

  // ============================================================
  // completeSettlement() Tests
  // ============================================================

  describe('completeSettlement', () => {
    it('should complete settlement successfully', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        status: SettlementStatus.PSP_PROCESSING,
        match: {
          id: 1,
          requestId: 1,
          counterRequestId: 2,
        },
      };

      mockPrisma.settlement.findUnique.mockResolvedValue(settlement as any);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      await service.completeSettlement(1);

      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: SettlementStatus.COMPLETED,
          }),
        })
      );

      expect(mockPrisma.exchangeMatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: MatchStatus.COMPLETED,
          }),
        })
      );

      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledTimes(2);
    });

    it('should throw error if settlement not found', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue(null);

      await expect(service.completeSettlement(999)).rejects.toThrow(
        SettlementNotFoundError
      );
    });
  });

  // ============================================================
  // failSettlement() Tests
  // ============================================================

  describe('failSettlement', () => {
    it('should fail settlement with reason', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        status: SettlementStatus.PSP_PROCESSING,
        match: {
          id: 1,
          requestId: 1,
          counterRequestId: 2,
        },
      };

      mockPrisma.settlement.findUnique.mockResolvedValue(settlement as any);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      await service.failSettlement(1, 'PSP timeout');

      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: SettlementStatus.FAILED,
            failureReason: 'PSP timeout',
          }),
        })
      );

      expect(mockPrisma.exchangeMatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: MatchStatus.FAILED,
          }),
        })
      );

      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.exchangeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ExchangeStatus.DISPUTED,
          }),
        })
      );
    });

    it('should throw error if settlement not found', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue(null);

      await expect(service.failSettlement(999, 'Test reason')).rejects.toThrow(
        SettlementNotFoundError
      );
    });
  });

  // ============================================================
  // getSettlement() Tests
  // ============================================================

  describe('getSettlement', () => {
    it('should get settlement by ID', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        method: SettlementMethod.INTERNAL,
        status: SettlementStatus.COMPLETED,
        pspProvider: null,
        pspTransactionId: null,
        pspStatus: null,
        externalEscrowProvider: null,
        externalEscrowId: null,
        initiatedAt: new Date(),
        completedAt: new Date(),
        failedAt: null,
        failureReason: null,
        retryCount: 0,
        match: {
          id: 1,
          requestId: 1,
          counterRequestId: 2,
          request: {
            id: 1,
            userId: 1,
          },
          counterRequest: {
            id: 2,
            userId: 2,
          },
        },
      };

      mockPrisma.settlement.findUnique.mockResolvedValue(settlement as any);

      const result = await service.getSettlement(1);

      expect(result.id).toBe(1);
      expect(result.matchId).toBe(1);
      expect(result.status).toBe(SettlementStatus.COMPLETED);
    });

    it('should throw error if settlement not found', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue(null);

      await expect(service.getSettlement(999)).rejects.toThrow(
        SettlementNotFoundError
      );
    });
  });

  // ============================================================
  // getSettlementByMatchId() Tests
  // ============================================================

  describe('getSettlementByMatchId', () => {
    it('should get settlement by match ID', async () => {
      const settlement = {
        id: 1,
        matchId: 1,
        method: SettlementMethod.INTERNAL,
        status: SettlementStatus.COMPLETED,
        pspProvider: null,
        pspTransactionId: null,
        pspStatus: null,
        externalEscrowProvider: null,
        externalEscrowId: null,
        initiatedAt: new Date(),
        completedAt: new Date(),
        failedAt: null,
        failureReason: null,
        retryCount: 0,
      };

      mockPrisma.settlement.findUnique.mockResolvedValue(settlement as any);

      const result = await service.getSettlementByMatchId(1);

      expect(result).not.toBeNull();
      expect(result!.matchId).toBe(1);
    });

    it('should return null if settlement not found', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue(null);

      const result = await service.getSettlementByMatchId(999);

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // checkSettlementTimeouts() Tests
  // ============================================================

  describe('checkSettlementTimeouts', () => {
    it('should timeout pending settlements after 24 hours', async () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

      const timedOutSettlements = [
        {
          id: 1,
          matchId: 1,
          status: SettlementStatus.PENDING,
          initiatedAt: oldDate,
        },
        {
          id: 2,
          matchId: 2,
          status: SettlementStatus.PSP_PROCESSING,
          initiatedAt: oldDate,
        },
      ];

      mockPrisma.settlement.findMany.mockResolvedValue(timedOutSettlements as any);
      mockPrisma.settlement.update.mockResolvedValue({} as any);

      await service.checkSettlementTimeouts();

      expect(mockPrisma.settlement.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: SettlementStatus.TIMEOUT,
            failureReason: expect.stringContaining('timed out'),
          }),
        })
      );
    });

    it('should not timeout recent settlements', async () => {
      const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

      mockPrisma.settlement.findMany.mockResolvedValue([]);

      await service.checkSettlementTimeouts();

      expect(mockPrisma.settlement.update).not.toHaveBeenCalled();
    });
  });
});
