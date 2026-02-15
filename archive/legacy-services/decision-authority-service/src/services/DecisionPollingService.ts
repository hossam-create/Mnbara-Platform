import { PrismaClient, DecisionStatus as PrismaDecisionStatus } from '@prisma/client';
import { DecisionSourceFactory } from '../sources/DecisionSourceFactory';
import { DecisionStatus } from '../interfaces/IDecisionSource';
import { AuditLogService } from './AuditLogService';
import config from '../config/config';

/**
 * DecisionPollingService - Polls PENDING decisions from external source
 * 
 * CRITICAL RULES (Phase 3.0 Design Gate):
 * - Polling = Source of Truth (not webhooks)
 * - Poll interval: 5s (configurable)
 * - Max poll duration: 30s (configurable)
 * - Timeout → Fallback to INTERNAL
 * - Never block the main thread
 * 
 * Flow:
 * 1. Find PENDING decisions
 * 2. Poll external source
 * 3. Update status if changed
 * 4. Audit all changes
 * 5. Handle timeouts gracefully
 */

interface PollingStats {
  totalPolled: number;
  updated: number;
  timedOut: number;
  errors: number;
}

export class DecisionPollingService {
  private prisma: PrismaClient;
  private auditLogService: AuditLogService;
  private pollingInterval: number;
  private maxPollDuration: number;
  private isPolling: boolean = false;
  private pollingTimer: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditLogService = new AuditLogService(prisma);
    this.pollingInterval = config.decisionPollIntervalMs;
    this.maxPollDuration = config.decisionTimeoutMs;

    console.log('[DecisionPollingService] Initialized', {
      pollingInterval: this.pollingInterval,
      maxPollDuration: this.maxPollDuration
    });
  }

  /**
   * Start polling loop
   */
  start(): void {
    if (this.isPolling) {
      console.warn('[DecisionPollingService] Already polling');
      return;
    }

    this.isPolling = true;
    console.log('[DecisionPollingService] Starting polling loop');

    // Start immediate poll
    this.pollPendingDecisions();

    // Schedule recurring polls
    this.pollingTimer = setInterval(() => {
      this.pollPendingDecisions();
    }, this.pollingInterval);
  }

  /**
   * Stop polling loop
   */
  stop(): void {
    if (!this.isPolling) {
      return;
    }

    this.isPolling = false;

    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    console.log('[DecisionPollingService] Stopped polling loop');
  }

  /**
   * Poll all PENDING decisions
   */
  private async pollPendingDecisions(): Promise<PollingStats> {
    const stats: PollingStats = {
      totalPolled: 0,
      updated: 0,
      timedOut: 0,
      errors: 0
    };

    try {
      // Find all PENDING decisions
      const pendingDecisions = await this.prisma.assetDecisionRecord.findMany({
        where: {
          status: PrismaDecisionStatus.PENDING
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (pendingDecisions.length === 0) {
        return stats;
      }

      console.log('[DecisionPollingService] Polling decisions', {
        count: pendingDecisions.length
      });

      stats.totalPolled = pendingDecisions.length;

      // Poll each decision
      for (const decision of pendingDecisions) {
        try {
          await this.pollSingleDecision(decision.id, decision.externalDecisionId!, stats);
        } catch (error) {
          stats.errors++;
          console.error('[DecisionPollingService] Error polling decision', {
            decisionId: decision.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Log stats
      if (stats.updated > 0 || stats.timedOut > 0 || stats.errors > 0) {
        console.log('[DecisionPollingService] Polling complete', stats);
      }

    } catch (error) {
      console.error('[DecisionPollingService] Error in polling loop', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return stats;
  }

  /**
   * Poll a single decision
   */
  private async pollSingleDecision(
    decisionId: number,
    externalDecisionId: string,
    stats: PollingStats
  ): Promise<void> {
    // Check if decision has timed out
    const decision = await this.prisma.assetDecisionRecord.findUnique({
      where: { id: decisionId }
    });

    if (!decision) {
      return;
    }

    // Check timeout
    const now = new Date();
    const createdAt = decision.createdAt;
    const elapsedMs = now.getTime() - createdAt.getTime();

    if (elapsedMs > this.maxPollDuration) {
      await this.handleTimeout(decision);
      stats.timedOut++;
      return;
    }

    // Poll external source
    try {
      const decisionSource = DecisionSourceFactory.getDecisionSource();
      const response = await decisionSource.pollDecision(externalDecisionId);

      // Check if status changed
      if (response.status !== DecisionStatus.PENDING) {
        await this.updateDecisionStatus(decision, response.status, response.reason);
        stats.updated++;
      }

    } catch (error) {
      console.error('[DecisionPollingService] Error polling external source', {
        decisionId,
        externalDecisionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Check if we should timeout due to repeated errors
      if (elapsedMs > this.maxPollDuration / 2) {
        await this.handleTimeout(decision);
        stats.timedOut++;
      }
    }
  }

  /**
   * Update decision status from polling
   */
  private async updateDecisionStatus(
    decision: any,
    newStatus: DecisionStatus,
    reason?: string
  ): Promise<void> {
    console.log('[DecisionPollingService] Updating decision from poll', {
      decisionId: decision.id,
      oldStatus: decision.status,
      newStatus,
      reason
    });

    // Map internal status to Prisma status
    const prismaStatus = this.mapToPrismaStatus(newStatus);

    // Update decision
    await this.prisma.assetDecisionRecord.update({
      where: { id: decision.id },
      data: {
        status: prismaStatus,
        decidedAt: new Date(),
        reason: reason || `Decision ${newStatus.toLowerCase()} by external source`
      }
    });

    // Audit the change
    await this.auditLogService.logStatusChange(
      decision.id,
      decision.status,
      prismaStatus,
      'DECISION_SOURCE',
      'external-polling',
      reason
    );
  }

  /**
   * Handle decision timeout
   * 
   * CRITICAL: Timeout → EXPIRED (not APPROVED)
   * System must handle expired decisions appropriately
   */
  private async handleTimeout(decision: any): Promise<void> {
    console.warn('[DecisionPollingService] Decision timed out', {
      decisionId: decision.id,
      externalDecisionId: decision.externalDecisionId,
      createdAt: decision.createdAt
    });

    // Mark as EXPIRED
    await this.prisma.assetDecisionRecord.update({
      where: { id: decision.id },
      data: {
        status: PrismaDecisionStatus.EXPIRED,
        decidedAt: new Date(),
        reason: 'Decision timed out waiting for external source'
      }
    });

    // Audit the timeout
    await this.auditLogService.logStatusChange(
      decision.id,
      decision.status,
      PrismaDecisionStatus.EXPIRED,
      'SYSTEM',
      'polling-timeout',
      'Decision timed out after max poll duration'
    );
  }

  /**
   * Map internal status to Prisma status
   */
  private mapToPrismaStatus(status: DecisionStatus): PrismaDecisionStatus {
    const mapping: Record<DecisionStatus, PrismaDecisionStatus> = {
      [DecisionStatus.PENDING]: PrismaDecisionStatus.PENDING,
      [DecisionStatus.APPROVED]: PrismaDecisionStatus.APPROVED,
      [DecisionStatus.REJECTED]: PrismaDecisionStatus.REJECTED,
      [DecisionStatus.EXPIRED]: PrismaDecisionStatus.EXPIRED,
      [DecisionStatus.CANCELLED]: PrismaDecisionStatus.CANCELLED
    };

    return mapping[status];
  }

  /**
   * Get polling stats (for monitoring)
   */
  getStats(): { isPolling: boolean; pollingInterval: number; maxPollDuration: number } {
    return {
      isPolling: this.isPolling,
      pollingInterval: this.pollingInterval,
      maxPollDuration: this.maxPollDuration
    };
  }
}
