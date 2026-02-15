import { PrismaClient, DecisionStatus as PrismaDecisionStatus } from '@prisma/client';
import { AuditLogService } from './AuditLogService';
import config from '../config/config';

export class DeadDecisionCleanupService {
  private prisma: PrismaClient;
  private auditLogService: AuditLogService;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditLogService = new AuditLogService(prisma);
  }

  start(intervalMs: number = 60000): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('[DeadDecisionCleanup] Starting cleanup service');

    this.cleanupTimer = setInterval(() => {
      this.cleanupStuckDecisions();
    }, intervalMs);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    console.log('[DeadDecisionCleanup] Stopped cleanup service');
  }

  async cleanupStuckDecisions(): Promise<number> {
    try {
      const maxAge = config.decisionTimeoutMs * 2;
      const cutoffTime = new Date(Date.now() - maxAge);

      const stuckDecisions = await this.prisma.assetDecisionRecord.findMany({
        where: {
          status: PrismaDecisionStatus.PENDING,
          createdAt: {
            lt: cutoffTime
          }
        }
      });

      if (stuckDecisions.length === 0) {
        return 0;
      }

      console.log(`[DeadDecisionCleanup] Found ${stuckDecisions.length} stuck decisions`);

      for (const decision of stuckDecisions) {
        await this.expireStuckDecision(decision);
      }

      return stuckDecisions.length;
    } catch (error) {
      console.error('[DeadDecisionCleanup] Error during cleanup', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  private async expireStuckDecision(decision: any): Promise<void> {
    try {
      console.log('[DeadDecisionCleanup] Expiring stuck decision', {
        decisionId: decision.id,
        age: Date.now() - decision.createdAt.getTime()
      });

      await this.prisma.assetDecisionRecord.update({
        where: { id: decision.id },
        data: {
          status: PrismaDecisionStatus.EXPIRED,
          decidedAt: new Date(),
          reason: 'Decision stuck in PENDING beyond maximum duration'
        }
      });

      await this.auditLogService.logDecisionExpired(
        decision.id,
        decision.status,
        {
          reason: 'STUCK_DECISION_CLEANUP',
          ageMs: Date.now() - decision.createdAt.getTime(),
          maxAgeMs: config.decisionTimeoutMs * 2
        }
      );
    } catch (error) {
      console.error('[DeadDecisionCleanup] Failed to expire decision', {
        decisionId: decision.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
