// ============================================================
// Rollback Service - Transaction Rollback Mechanism
// Handles rollback operations for failed transactions with compensation
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  RollbackRecord,
  RollbackStatus,
  TriggerType,
  CreateRollbackInput,
  RollbackResult,
  LedgerEntry,
} from '../types/ledger.types';
import { ledgerService } from './ledger.service';
import { auditService } from './audit.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class RollbackService {
  /**
   * Create a rollback request
   */
  async createRollback(input: CreateRollbackInput): Promise<RollbackRecord> {
    logger.info('Creating rollback request', {
      originalTransactionId: input.originalTransactionId,
      entityType: input.entityType,
      reason: input.reason,
    });

    const rollback = await prisma.rollbackRecord.create({
      data: {
        originalTransactionId: input.originalTransactionId,
        entityType: input.entityType,
        entityId: input.entityId,
        reason: input.reason,
        status: RollbackStatus.PENDING,
        triggeredBy: input.triggeredBy,
        triggerType: input.triggerType,
        compensationData: input.compensationData as any,
      },
    });

    await auditService.log({
      action: 'ROLLBACK_CREATED',
      entityType: 'RollbackRecord',
      entityId: rollback.id,
      userId: input.triggeredBy,
      description: `Rollback initiated: ${input.reason}`,
      metadata: {
        originalTransactionId: input.originalTransactionId,
        entityType: input.entityType,
        entityId: input.entityId,
        triggerType: input.triggerType,
      },
    });

    // Process rollback asynchronously
    this.processRollback(rollback.id).catch((error) => {
      logger.error('Async rollback processing failed', {
        rollbackId: rollback.id,
        error: error.message,
      });
    });

    return this.mapToRollbackRecord(rollback);
  }

  /**
   * Process a rollback
   */
  async processRollback(rollbackId: string): Promise<RollbackResult> {
    logger.info('Processing rollback', { rollbackId });

    const rollback = await prisma.rollbackRecord.findUnique({
      where: { id: rollbackId },
    });

    if (!rollback) {
      return {
        success: false,
        rollbackRecord: {} as RollbackRecord,
        compensatingTransactions: [],
        error: 'Rollback record not found',
      };
    }

    if (rollback.status !== RollbackStatus.PENDING) {
      return {
        success: false,
        rollbackRecord: this.mapToRollbackRecord(rollback),
        compensatingTransactions: [],
        error: `Rollback already processed: ${rollback.status}`,
      };
    }

    // Update status to processing
    await prisma.rollbackRecord.update({
      where: { id: rollbackId },
      data: { status: RollbackStatus.PROCESSING, processedAt: new Date() },
    });

    try {
      // Create reversal entries in ledger
      const reversalEntries = await ledgerService.createReversal(
        rollback.originalTransactionId,
        rollback.reason
      );

      // Update original transaction status
      await this.updateOriginalTransactionStatus(
        rollback.entityType,
        rollback.entityId
      );

      // Complete rollback
      await prisma.rollbackRecord.update({
        where: { id: rollbackId },
        data: {
          status: RollbackStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await auditService.logRollback(
        rollback.originalTransactionId,
        rollback.entityType,
        rollback.entityId,
        rollback.triggeredBy || 0,
        rollback.reason,
        true
      );

      logger.info('Rollback completed successfully', { rollbackId });

      return {
        success: true,
        rollbackRecord: {
          ...this.mapToRollbackRecord(rollback),
          status: RollbackStatus.COMPLETED,
          completedAt: new Date(),
        },
        compensatingTransactions: reversalEntries,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Mark rollback as failed
      await prisma.rollbackRecord.update({
        where: { id: rollbackId },
        data: {
          status: RollbackStatus.FAILED,
          failureReason: errorMessage,
        },
      });

      await auditService.logRollback(
        rollback.originalTransactionId,
        rollback.entityType,
        rollback.entityId,
        rollback.triggeredBy || 0,
        rollback.reason,
        false
      );

      logger.error('Rollback failed', { rollbackId, error: errorMessage });

      return {
        success: false,
        rollbackRecord: {
          ...this.mapToRollbackRecord(rollback),
          status: RollbackStatus.FAILED,
          failureReason: errorMessage,
        },
        compensatingTransactions: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Cancel a pending rollback
   */
  async cancelRollback(rollbackId: string, cancelledBy: number): Promise<void> {
    const rollback = await prisma.rollbackRecord.findUnique({
      where: { id: rollbackId },
    });

    if (!rollback) {
      throw new Error('Rollback not found');
    }

    if (rollback.status !== RollbackStatus.PENDING) {
      throw new Error('Only pending rollbacks can be cancelled');
    }

    await prisma.rollbackRecord.update({
      where: { id: rollbackId },
      data: { status: RollbackStatus.CANCELLED },
    });

    await auditService.log({
      action: 'ROLLBACK_CANCELLED',
      entityType: 'RollbackRecord',
      entityId: rollbackId,
      userId: cancelledBy,
      description: `Rollback cancelled: ${rollback.reason}`,
    });
  }

  /**
   * Retry a failed rollback
   */
  async retryRollback(rollbackId: string): Promise<RollbackResult> {
    const rollback = await prisma.rollbackRecord.findUnique({
      where: { id: rollbackId },
    });

    if (!rollback) {
      return {
        success: false,
        rollbackRecord: {} as RollbackRecord,
        compensatingTransactions: [],
        error: 'Rollback record not found',
      };
    }

    if (rollback.status !== RollbackStatus.FAILED) {
      return {
        success: false,
        rollbackRecord: this.mapToRollbackRecord(rollback),
        compensatingTransactions: [],
        error: `Cannot retry rollback with status: ${rollback.status}`,
      };
    }

    // Reset status and retry
    await prisma.rollbackRecord.update({
      where: { id: rollbackId },
      data: {
        status: RollbackStatus.PENDING,
        processedAt: null,
        completedAt: null,
        failureReason: null,
      },
    });

    return this.processRollback(rollbackId);
  }

  /**
   * Get rollback status
   */
  async getRollbackStatus(rollbackId: string): Promise<RollbackRecord | null> {
    const rollback = await prisma.rollbackRecord.findUnique({
      where: { id: rollbackId },
    });

    return rollback ? this.mapToRollbackRecord(rollback) : null;
  }

  /**
   * Get rollbacks for a transaction
   */
  async getRollbacksForTransaction(
    originalTransactionId: string
  ): Promise<RollbackRecord[]> {
    const rollbacks = await prisma.rollbackRecord.findMany({
      where: { originalTransactionId },
      orderBy: { createdAt: 'desc' },
    });

    return rollbacks.map((r) => this.mapToRollbackRecord(r));
  }

  /**
   * Get pending rollbacks
   */
  async getPendingRollbacks(): Promise<RollbackRecord[]> {
    const rollbacks = await prisma.rollbackRecord.findMany({
      where: { status: RollbackStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });

    return rollbacks.map((r) => this.mapToRollbackRecord(r));
  }

  /**
   * Get rollback statistics
   */
  async getRollbackStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    averageProcessingTimeMs: number;
  }> {
    const [total, pending, completed, failed] = await Promise.all([
      prisma.rollbackRecord.count(),
      prisma.rollbackRecord.count({ where: { status: RollbackStatus.PENDING } }),
      prisma.rollbackRecord.count({ where: { status: RollbackStatus.COMPLETED } }),
      prisma.rollbackRecord.count({ where: { status: RollbackStatus.FAILED } }),
    ]);

    // Calculate average processing time
    const completedRollbacks = await prisma.rollbackRecord.findMany({
      where: { status: RollbackStatus.COMPLETED },
      select: { processedAt: true, completedAt: true },
    });

    let avgTime = 0;
    if (completedRollbacks.length > 0) {
      const totalTime = completedRollbacks.reduce((sum, r) => {
        if (r.processedAt && r.completedAt) {
          return sum + (r.completedAt.getTime() - r.processedAt.getTime());
        }
        return sum;
      }, 0);
      avgTime = totalTime / completedRollbacks.length;
    }

    return {
      total,
      pending,
      completed,
      failed,
      averageProcessingTimeMs: avgTime,
    };
  }

  /**
   * Update original transaction status
   */
  private async updateOriginalTransactionStatus(
    entityType: string,
    entityId: string
  ): Promise<void> {
    switch (entityType) {
      case 'WalletTransaction':
        await prisma.walletTransaction.updateMany({
          where: { walletId: parseInt(entityId) },
          data: { status: 'ROLLED_BACK' as any },
        });
        break;
      case 'MatchingSettlement':
        await prisma.matchingSettlement.update({
          where: { id: entityId },
          data: { status: 'ROLLED_BACK' as any },
        });
        break;
      case 'EscrowHold':
        await prisma.escrowHold.update({
          where: { id: parseInt(entityId) },
          data: { status: 'CANCELLED' as any },
        });
        break;
      default:
        logger.warn('Unknown entity type for rollback', { entityType });
    }
  }

  /**
   * Map Prisma model to RollbackRecord interface
   */
  private mapToRollbackRecord(record: any): RollbackRecord {
    return {
      id: record.id,
      originalTransactionId: record.originalTransactionId,
      entityType: record.entityType,
      entityId: record.entityId,
      reason: record.reason,
      status: record.status as RollbackStatus,
      triggeredBy: record.triggeredBy || undefined,
      triggerType: record.triggerType as TriggerType,
      processedAt: record.processedAt || undefined,
      completedAt: record.completedAt || undefined,
      failureReason: record.failureReason || undefined,
      compensationData: record.compensationData || undefined,
      createdAt: record.createdAt,
    };
  }
}

export const rollbackService = new RollbackService();
