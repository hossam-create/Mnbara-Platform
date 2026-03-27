import { PrismaClient, DecisionStatus } from '@prisma/client';
import { AuditLogService } from '../AuditLogService';

// Mock Prisma Client
const mockPrisma = {
  decisionAuditLog: {
    create: jest.fn(),
    findMany: jest.fn()
  }
} as unknown as PrismaClient;

describe('AuditLogService', () => {
  let auditLogService: AuditLogService;

  beforeEach(() => {
    auditLogService = new AuditLogService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('logDecisionCreated', () => {
    it('should create audit log for decision creation', async () => {
      const mockAuditLog = {
        id: 1,
        decisionId: 1,
        action: 'CREATED',
        previousStatus: null,
        newStatus: DecisionStatus.PENDING,
        actorId: 'SYSTEM',
        actorType: 'SYSTEM',
        metadata: {},
        createdAt: new Date()
      };

      (mockPrisma.decisionAuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditLogService.logDecisionCreated(1, 'SYSTEM', 'SYSTEM', { test: 'data' });

      expect(mockPrisma.decisionAuditLog.create).toHaveBeenCalledWith({
        data: {
          decisionId: 1,
          action: 'CREATED',
          previousStatus: null,
          newStatus: DecisionStatus.PENDING,
          actorId: 'SYSTEM',
          actorType: 'SYSTEM',
          metadata: { test: 'data' }
        }
      });
    });

    it('should use empty metadata if not provided', async () => {
      await auditLogService.logDecisionCreated(1, 'SYSTEM', 'SYSTEM');

      expect(mockPrisma.decisionAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: {}
        })
      });
    });
  });

  describe('logStatusChange', () => {
    it('should create audit log for status change', async () => {
      await auditLogService.logStatusChange(
        1,
        DecisionStatus.PENDING,
        DecisionStatus.APPROVED,
        'SOURCE',
        'DECISION_SOURCE',
        { reason: 'Approved by regulator' }
      );

      expect(mockPrisma.decisionAuditLog.create).toHaveBeenCalledWith({
        data: {
          decisionId: 1,
          action: 'STATUS_CHANGED',
          previousStatus: DecisionStatus.PENDING,
          newStatus: DecisionStatus.APPROVED,
          actorId: 'SOURCE',
          actorType: 'DECISION_SOURCE',
          metadata: { reason: 'Approved by regulator' }
        }
      });
    });
  });

  describe('logDecisionExpired', () => {
    it('should create audit log for expiry with SYSTEM actor', async () => {
      await auditLogService.logDecisionExpired(
        1,
        DecisionStatus.PENDING,
        { expiresAt: new Date() }
      );

      expect(mockPrisma.decisionAuditLog.create).toHaveBeenCalledWith({
        data: {
          decisionId: 1,
          action: 'EXPIRED',
          previousStatus: DecisionStatus.PENDING,
          newStatus: DecisionStatus.EXPIRED,
          actorId: 'SYSTEM',
          actorType: 'SYSTEM',
          metadata: expect.objectContaining({ expiresAt: expect.any(Date) })
        }
      });
    });
  });

  describe('logDecisionCancelled', () => {
    it('should create audit log for cancellation', async () => {
      await auditLogService.logDecisionCancelled(
        1,
        DecisionStatus.PENDING,
        'ADMIN',
        'SYSTEM',
        { reason: 'Asset removed' }
      );

      expect(mockPrisma.decisionAuditLog.create).toHaveBeenCalledWith({
        data: {
          decisionId: 1,
          action: 'CANCELLED',
          previousStatus: DecisionStatus.PENDING,
          newStatus: DecisionStatus.CANCELLED,
          actorId: 'ADMIN',
          actorType: 'SYSTEM',
          metadata: { reason: 'Asset removed' }
        }
      });
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs for a decision', async () => {
      const mockLogs = [
        { id: 1, action: 'CREATED', createdAt: new Date() },
        { id: 2, action: 'STATUS_CHANGED', createdAt: new Date() }
      ];

      (mockPrisma.decisionAuditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const result = await auditLogService.getAuditLogs(1);

      expect(result).toEqual(mockLogs);
      expect(mockPrisma.decisionAuditLog.findMany).toHaveBeenCalledWith({
        where: { decisionId: 1 },
        orderBy: { createdAt: 'asc' }
      });
    });
  });

  describe('queryAuditLogs', () => {
    it('should query audit logs with all filters', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await auditLogService.queryAuditLogs({
        decisionId: 1,
        action: 'STATUS_CHANGED',
        actorId: 'SYSTEM',
        actorType: 'SYSTEM',
        startDate,
        endDate,
        limit: 50
      });

      expect(mockPrisma.decisionAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          decisionId: 1,
          action: 'STATUS_CHANGED',
          actorId: 'SYSTEM',
          actorType: 'SYSTEM',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    });

    it('should use default limit of 100 if not provided', async () => {
      await auditLogService.queryAuditLogs({});

      expect(mockPrisma.decisionAuditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    });

    it('should handle partial date filters', async () => {
      const startDate = new Date('2026-01-01');

      await auditLogService.queryAuditLogs({ startDate });

      expect(mockPrisma.decisionAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    });
  });
});
