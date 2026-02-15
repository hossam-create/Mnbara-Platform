// ============================================================
// Audit Service - Complete Audit Trail
// Logs all actions with before/after values and verification
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { AuditLog, CreateAuditLogInput } from '../types/ledger.types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AuditService {
  /**
   * Log an audit event
   */
  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    logger.info('Creating audit log', {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
    });

    // Compute changes if old and new values provided
    let changes = undefined;
    if (input.oldValues && input.newValues) {
      changes = this.computeChanges(input.oldValues, input.newValues);
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId,
        userRole: input.userRole,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        oldValues: input.oldValues as any,
        newValues: input.newValues as any,
        changes: changes as any,
        description: input.description,
        metadata: input.metadata as any,
        isVerified: false,
      },
    });

    logger.debug('Audit log created', { auditId: auditLog.id });

    return this.mapToAuditLog(auditLog);
  }

  /**
   * Log wallet transaction
   */
  async logWalletTransaction(
    userId: number,
    transactionType: string,
    amount: Decimal,
    walletId: number,
    oldBalance: Decimal,
    newBalance: Decimal,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      action: `WALLET_${transactionType}`,
      entityType: 'WalletTransaction',
      entityId: walletId.toString(),
      userId,
      oldValues: { balance: oldBalance.toString() },
      newValues: { balance: newBalance.toString() },
      description: `Wallet ${transactionType} of ${amount.toString()}`,
      metadata,
    });
  }

  /**
   * Log settlement
   */
  async logSettlement(
    settlementId: string,
    buyerId: number,
    sellerId: number,
    amount: Decimal,
    fees: Decimal,
    status: string
  ): Promise<void> {
    await this.log({
      action: `SETTLEMENT_${status}`,
      entityType: 'MatchingSettlement',
      entityId: settlementId,
      userId: buyerId,
      metadata: {
        sellerId,
        amount: amount.toString(),
        fees: fees.toString(),
      },
      description: `Settlement ${status}: ${amount.toString()}`,
    });
  }

  /**
   * Log compliance check
   */
  async logComplianceCheck(
    userId: number,
    checkType: string,
    status: string,
    riskLevel?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      action: `COMPLIANCE_${checkType}`,
      entityType: 'ComplianceCheck',
      entityId: userId.toString(),
      userId,
      description: `Compliance ${checkType}: ${status}`,
      metadata: {
        status,
        riskLevel,
        ...details,
      },
    });
  }

  /**
   * Log rollback event
   */
  async logRollback(
    originalTransactionId: string,
    entityType: string,
    entityId: string,
    triggeredBy: number,
    reason: string,
    success: boolean
  ): Promise<void> {
    await this.log({
      action: success ? 'ROLLBACK_COMPLETED' : 'ROLLBACK_FAILED',
      entityType,
      entityId,
      userId: triggeredBy,
      description: `Rollback of ${entityType} ${entityId}: ${reason}`,
      metadata: {
        originalTransactionId,
        success,
      },
    });
  }

  /**
   * Get audit logs for an entity
   */
  async getAuditLogs(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((l) => this.mapToAuditLog(l));
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: number, limit = 100): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((l) => this.mapToAuditLog(l));
  }

  /**
   * Get audit logs by action
   */
  async getAuditLogsByAction(action: string, limit = 100): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((l) => this.mapToAuditLog(l));
  }

  /**
   * Verify an audit log
   */
  async verify(auditId: string, verifiedBy: number): Promise<void> {
    await prisma.auditLog.update({
      where: { id: auditId },
      data: {
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });

    logger.info('Audit log verified', { auditId, verifiedBy });
  }

  /**
   * Get audit trail summary for a transaction
   */
  async getTransactionAuditTrail(transactionId: string): Promise<{
    transactionId: string;
    events: AuditLog[];
  }> {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: transactionId },
          { metadata: { path: ['transactionId'], equals: transactionId } } as any,
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      transactionId,
      events: logs.map((l) => this.mapToAuditLog(l)),
    };
  }

  /**
   * Compute changes between old and new values
   */
  private computeChanges(
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
  ): Record<string, { from: unknown; to: unknown }> {
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    const allKeys = new Set([
      ...Object.keys(oldValues),
      ...Object.keys(newValues),
    ]);

    for (const key of allKeys) {
      const oldValue = oldValues[key];
      const newValue = newValues[key];

      // Deep comparison for objects
      if (typeof oldValue === 'object' && typeof newValue === 'object') {
        const innerChanges = this.computeChanges(
          oldValue as Record<string, unknown>,
          newValue as Record<string, unknown>
        );
        if (Object.keys(innerChanges).length > 0) {
          changes[key] = { from: oldValue, to: newValue };
        }
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { from: oldValue, to: newValue };
      }
    }

    return changes;
  }

  /**
   * Map Prisma model to AuditLog interface
   */
  private mapToAuditLog(log: any): AuditLog {
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId || undefined,
      userRole: log.userRole || undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      oldValues: log.oldValues || undefined,
      newValues: log.newValues || undefined,
      changes: log.changes || undefined,
      description: log.description || undefined,
      metadata: log.metadata || undefined,
      isVerified: log.isVerified,
      verifiedBy: log.verifiedBy || undefined,
      verifiedAt: log.verifiedAt || undefined,
      createdAt: log.createdAt,
    };
  }
}

export const auditService = new AuditService();
