import { PrismaClient, DecisionStatus } from '@prisma/client';

/**
 * AuditLogService - APPEND-ONLY audit trail for all decision changes
 * 
 * All audit logs are immutable once created. This service only creates
 * new audit log entries and queries existing ones.
 */
export class AuditLogService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Log decision creation
   */
  async logDecisionCreated(
    decisionId: number,
    actorId: string,
    actorType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.prisma.decisionAuditLog.create({
      data: {
        decisionId,
        action: 'CREATED',
        previousStatus: null,
        newStatus: DecisionStatus.PENDING,
        actorId,
        actorType,
        metadata: metadata || {}
      }
    });
  }

  /**
   * Log status change
   */
  async logStatusChange(
    decisionId: number,
    previousStatus: DecisionStatus,
    newStatus: DecisionStatus,
    actorId: string,
    actorType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.prisma.decisionAuditLog.create({
      data: {
        decisionId,
        action: 'STATUS_CHANGED',
        previousStatus,
        newStatus,
        actorId,
        actorType,
        metadata: metadata || {}
      }
    });
  }

  /**
   * Log decision expiry (system-driven)
   */
  async logDecisionExpired(
    decisionId: number,
    previousStatus: DecisionStatus,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.prisma.decisionAuditLog.create({
      data: {
        decisionId,
        action: 'EXPIRED',
        previousStatus,
        newStatus: DecisionStatus.EXPIRED,
        actorId: 'SYSTEM',
        actorType: 'SYSTEM',
        metadata: metadata || {}
      }
    });
  }

  /**
   * Log decision cancellation (system-driven)
   */
  async logDecisionCancelled(
    decisionId: number,
    previousStatus: DecisionStatus,
    actorId: string,
    actorType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.prisma.decisionAuditLog.create({
      data: {
        decisionId,
        action: 'CANCELLED',
        previousStatus,
        newStatus: DecisionStatus.CANCELLED,
        actorId,
        actorType,
        metadata: metadata || {}
      }
    });
  }

  /**
   * Query audit logs for a decision
   */
  async getAuditLogs(decisionId: number) {
    return this.prisma.decisionAuditLog.findMany({
      where: { decisionId },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(filters: {
    decisionId?: number;
    action?: string;
    actorId?: string;
    actorType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.decisionId) {
      where.decisionId = filters.decisionId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters.actorType) {
      where.actorType = filters.actorType;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.decisionAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100
    });
  }

  /**
   * Log system events (circuit breaker, SLA breach, etc.)
   */
  async logSystemEvent(
    action: string,
    actorType: string,
    actorId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.prisma.decisionAuditLog.create({
      data: {
        decisionId: 0,
        action,
        previousStatus: null,
        newStatus: null,
        actorId,
        actorType,
        metadata: metadata || {}
      }
    });
  }
}
