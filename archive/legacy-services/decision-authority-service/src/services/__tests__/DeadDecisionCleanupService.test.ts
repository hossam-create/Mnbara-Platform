import { PrismaClient, DecisionStatus } from '@prisma/client';
import { DeadDecisionCleanupService } from '../DeadDecisionCleanupService';
import { AuditLogService } from '../AuditLogService';

jest.mock('../AuditLogService');

describe('DeadDecisionCleanupService', () => {
  let prisma: PrismaClient;
  let service: DeadDecisionCleanupService;
  let mockAuditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    prisma = {
      assetDecisionRecord: {
        findMany: jest.fn(),
        update: jest.fn()
      }
    } as any;

    service = new DeadDecisionCleanupService(prisma);
    mockAuditLogService = (service as any).auditLogService;
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.stop();
  });

  describe('Service Lifecycle', () => {
    it('should start cleanup service', () => {
      service.start(1000);
      expect((service as any).isRunning).toBe(true);
    });

    it('should stop cleanup service', () => {
      service.start(1000);
      service.stop();
      expect((service as any).isRunning).toBe(false);
    });

    it('should not start if already running', () => {
      service.start(1000);
      const timer1 = (service as any).cleanupTimer;

      service.start(1000);
      const timer2 = (service as any).cleanupTimer;

      expect(timer1).toBe(timer2);
    });

    it('should not stop if not running', () => {
      service.stop();
      expect((service as any).isRunning).toBe(false);
    });
  });

  describe('Stuck Decision Detection', () => {
    it('should find stuck decisions older than max age', async () => {
      const oldDate = new Date(Date.now() - 70000); // 70 seconds ago (max age is 60s)
      const stuckDecisions = [
        {
          id: 'decision-1',
          status: DecisionStatus.PENDING,
          createdAt: oldDate
        }
      ];

      (prisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue(stuckDecisions);
      (prisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue({});
      mockAuditLogService.logDecisionExpired.mockResolvedValue(undefined);

      const count = await service.cleanupStuckDecisions();

      expect(count).toBe(1);
      expect(prisma.assetDecisionRecord.findMany).toHaveBeenCalledWith({
        where: {
          status: DecisionStatus.PENDING,
          createdAt: {
            lt: expect.any(Date)
          }
        }
      });
    });

    it('should not find recent decisions', async () => {
      (prisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue([]);

      const count = await service.cleanupStuckDecisions();

      expect(count).toBe(0);
    });

    it('should handle multiple stuck decisions', async () => {
      const oldDate = new Date(Date.now() - 70000);
      const stuckDecisions = [
        { id: 'decision-1', status: DecisionStatus.PENDING, createdAt: oldDate },
        { id: 'decision-2', status: DecisionStatus.PENDING, createdAt: oldDate },
        { id: 'decision-3', status: DecisionStatus.PENDING, createdAt: oldDate }
      ];

      (prisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue(stuckDecisions);
      (prisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue({});
      mockAuditLogService.logDecisionExpired.mockResolvedValue(undefined);

      const count = await service.cleanupStuckDecisions();

      expect(count).toBe(3);
      expect(prisma.assetDecisionRecord.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('Decision Expiry', () => {
    it('should expire stuck decision', async () => {
      const oldDate = new Date(Date.now() - 70000);
      const stuckDecision = {
        id: 'decision-1',
        status: DecisionStatus.PENDING,
        createdAt: oldDate
      };

      (prisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue([stuckDecision]);
      (prisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue({});
      mockAuditLogService.logDecisionExpired.mockResolvedValue(undefined);

      await service.cleanupStuckDecisions();

      expect(prisma.assetDecisionRecord.update).toHaveBeenCalledWith({
        where: { id: 'decision-1' },
        data: {
          status: DecisionStatus.EXPIRED,
          decidedAt: expect.any(Date),
          reason: 'Decision stuck in PENDING beyond maximum duration'
        }
      });
    });

    it('should log expiry to audit log', async () => {
      const oldDate = new Date(Date.now() - 70000);
      const stuckDecision = {
        id: 'decision-1',
        status: DecisionStatus.PENDING,
        createdAt: oldDate
      };

      (prisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue([stuckDecision]);
      (prisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue({});
      mockAuditLogService.logDecisionExpired.mockResolvedValue(undefined);

      await service.cleanupStuckDecisions();

      expect(mockAuditLogService.logDecisionExpired).toHaveBeenCalledWith(
        'decision-1',
        DecisionStatus.PENDING,
        expect.objectContaining({
          reason: 'STUCK_DECISION_CLEANUP',
          ageMs: expect.any(Number),
          maxAgeMs: expect.any(Number)
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.assetDecisionRecord.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const count = await service.cleanupStuckDecisions();

      expect(count).toBe(0);
    });

    it('should continue cleanup if one decision fails', async () => {
      const oldDate = new Date(Date.now() - 70000);
      const stuckDecisions = [
        { id: 'decision-1', status: DecisionStatus.PENDING, createdAt: oldDate },
        { id: 'decision-2', status: DecisionStatus.PENDING, createdAt: oldDate }
      ];

      (prisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue(stuckDecisions);
      (prisma.assetDecisionRecord.update as jest.Mock)
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce({});
      mockAuditLogService.logDecisionExpired.mockResolvedValue(undefined);

      const count = await service.cleanupStuckDecisions();

      expect(count).toBe(2);
      expect(prisma.assetDecisionRecord.update).toHaveBeenCalledTimes(2);
    });

    it('should handle audit log errors gracefully', async () => {
      const oldDate = new Date(Date.now() - 70000);
      const stuckDecision = {
        id: 'decision-1',
        status: DecisionStatus.PENDING,
        createdAt: oldDate
      };

      (prisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue([stuckDecision]);
      (prisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue({});
      mockAuditLogService.logDecisionExpired.mockRejectedValue(new Error('Audit log failed'));

      const count = await service.cleanupStuckDecisions();

      // Should still count as cleaned up
      expect(count).toBe(1);
    });
  });

  describe('Periodic Cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should run cleanup periodically', async () => {
      const cleanupSpy = jest.spyOn(service, 'cleanupStuckDecisions');
      (prisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue([]);

      service.start(1000);

      // Fast-forward time
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(cleanupSpy).toHaveBeenCalledTimes(2);
    });

    it('should stop periodic cleanup when stopped', async () => {
      const cleanupSpy = jest.spyOn(service, 'cleanupStuckDecisions');
      (prisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue([]);

      service.start(1000);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      service.stop();

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Should not be called again after stop
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });
  });
});
