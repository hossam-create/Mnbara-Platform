/**
 * Disputes Service
 * Requirements: 12.3, 12.4, 17.3 - Implement dispute resolution with escrow actions and audit logging
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  DisputeStatus,
  DisputePriority,
  ResolutionOutcome,
  DisputeFiltersDto,
  ResolveDisputeDto,
} from './disputes.dto';

// Audit action types (matching Prisma enum)
const AuditAction = {
  DISPUTE_STATUS_CHANGED: 'DISPUTE_STATUS_CHANGED',
  DISPUTE_RESOLVED: 'DISPUTE_RESOLVED',
} as const;

// Audit severity levels (matching Prisma enum)
const AuditSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
} as const;

const prisma = new PrismaClient();

export interface DisputeResolutionResult {
  dispute: any;
  escrowAction?: {
    type: 'release' | 'refund' | 'partial_refund' | 'none';
    amount?: number;
    transactionId?: string;
    status: 'success' | 'failed' | 'pending';
    message?: string;
  };
  auditLogId?: string;
}

@Injectable()
export class DisputesService {
  /**
   * Get paginated list of disputes with filters
   * Requirements: 12.1, 17.1
   */
  async getDisputes(filters: DisputeFiltersDto) {
    const { page = 1, limit = 20, status, priority, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { order: { id: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          order: {
            select: {
              id: true,
              listingTitle: true,
              amount: true,
              buyerId: true,
              sellerId: true,
            },
          },
          raisedByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      data: disputes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single dispute with full details
   * Requirements: 12.2, 17.2
   */
  async getDispute(disputeId: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          select: {
            id: true,
            listingTitle: true,
            amount: true,
            buyerId: true,
            sellerId: true,
            escrowId: true,
          },
        },
        raisedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        evidence: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${disputeId} not found`);
    }

    return dispute;
  }

  /**
   * Update dispute status
   * Requirements: 12.3
   */
  async updateStatus(disputeId: string, status: DisputeStatus, adminId: string) {
    const dispute = await this.getDispute(disputeId);

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        order: true,
        raisedByUser: true,
      },
    });

    // Log the status change for audit
    await this.logAuditAction(
      AuditAction.DISPUTE_STATUS_CHANGED,
      adminId,
      disputeId,
      `Dispute status changed from ${dispute.status} to ${status}`,
      { previousStatus: dispute.status, newStatus: status }
    );

    return updated;
  }

  /**
   * Resolve dispute with escrow action
   * Requirements: 12.3, 12.4, 17.3 - Implement escrow release/refund trigger and audit logging
   */
  async resolveDispute(
    disputeId: string,
    resolution: ResolveDisputeDto,
    adminId: string,
    adminName: string
  ): Promise<DisputeResolutionResult> {
    const dispute = await this.getDispute(disputeId);

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Dispute is already resolved');
    }

    // Start transaction for atomic resolution
    const result = await prisma.$transaction(async (tx) => {
      let escrowAction: DisputeResolutionResult['escrowAction'] = undefined;
      let transactionId: string | undefined;

      // Process escrow action based on outcome
      if (resolution.outcome !== ResolutionOutcome.NO_ACTION && dispute.order.escrowId) {
        escrowAction = await this.processEscrowAction(
          dispute.order.escrowId,
          dispute.order.amount,
          resolution.outcome,
          resolution.amount,
          adminId
        );
        transactionId = escrowAction.transactionId;
      }

      // Update dispute with resolution
      const resolvedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution: {
            outcome: resolution.outcome,
            amount: resolution.amount,
            notes: resolution.notes,
            resolvedBy: adminName,
            resolvedAt: new Date().toISOString(),
            escrowTransactionId: transactionId,
          },
          updatedAt: new Date(),
        },
        include: {
          order: true,
          raisedByUser: true,
          evidence: true,
          messages: true,
        },
      });

      return { dispute: resolvedDispute, escrowAction };
    });

    // Log resolution action for audit (Requirements: 12.4)
    const auditLogId = await this.logAuditAction(
      AuditAction.DISPUTE_RESOLVED,
      adminId,
      disputeId,
      `Dispute resolved with outcome: ${resolution.outcome}`,
      {
        outcome: resolution.outcome,
        amount: resolution.amount,
        notes: resolution.notes,
        escrowAction: result.escrowAction,
        orderId: dispute.order.id,
        orderAmount: dispute.order.amount,
      }
    );

    return {
      dispute: result.dispute,
      escrowAction: result.escrowAction,
      auditLogId,
    };
  }

  /**
   * Process escrow action based on resolution outcome
   * Requirements: 12.3 - Implement escrow release/refund trigger
   */
  private async processEscrowAction(
    escrowId: string,
    orderAmount: number,
    outcome: ResolutionOutcome,
    partialAmount?: number,
    adminId?: string
  ): Promise<DisputeResolutionResult['escrowAction']> {
    try {
      switch (outcome) {
        case ResolutionOutcome.REFUND_BUYER:
          // Full refund to buyer
          const refundResult = await this.triggerEscrowRefund(escrowId, orderAmount, adminId);
          return {
            type: 'refund',
            amount: orderAmount,
            transactionId: refundResult.transactionId,
            status: refundResult.success ? 'success' : 'failed',
            message: refundResult.message,
          };

        case ResolutionOutcome.RELEASE_SELLER:
          // Release full amount to seller
          const releaseResult = await this.triggerEscrowRelease(escrowId, adminId);
          return {
            type: 'release',
            amount: orderAmount,
            transactionId: releaseResult.transactionId,
            status: releaseResult.success ? 'success' : 'failed',
            message: releaseResult.message,
          };

        case ResolutionOutcome.PARTIAL_REFUND:
          // Partial refund to buyer, rest to seller
          if (!partialAmount || partialAmount <= 0) {
            throw new BadRequestException('Partial refund amount is required');
          }
          const partialResult = await this.triggerPartialRefund(
            escrowId,
            partialAmount,
            orderAmount - partialAmount,
            adminId
          );
          return {
            type: 'partial_refund',
            amount: partialAmount,
            transactionId: partialResult.transactionId,
            status: partialResult.success ? 'success' : 'failed',
            message: partialResult.message,
          };

        default:
          return { type: 'none', status: 'success' };
      }
    } catch (error) {
      return {
        type: outcome === ResolutionOutcome.REFUND_BUYER ? 'refund' :
              outcome === ResolutionOutcome.RELEASE_SELLER ? 'release' : 'partial_refund',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Escrow action failed',
      };
    }
  }

  /**
   * Trigger escrow release to seller
   */
  private async triggerEscrowRelease(escrowId: string, adminId?: string) {
    // Call payment service to release escrow
    // In production, this would make an HTTP call to payment-service
    try {
      const escrow = await prisma.escrow.findUnique({ where: { id: parseInt(escrowId) } });
      if (!escrow) {
        return { success: false, message: 'Escrow not found' };
      }

      // Update escrow status to released
      await prisma.escrow.update({
        where: { id: parseInt(escrowId) },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          metadata: {
            ...(escrow.metadata as object || {}),
            releasedByAdmin: adminId,
            releaseReason: 'Dispute resolution - release to seller',
          },
        },
      });

      return {
        success: true,
        transactionId: `ESC-REL-${Date.now()}`,
        message: 'Escrow released to seller',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to release escrow',
      };
    }
  }

  /**
   * Trigger escrow refund to buyer
   */
  private async triggerEscrowRefund(escrowId: string, amount: number, adminId?: string) {
    try {
      const escrow = await prisma.escrow.findUnique({ where: { id: parseInt(escrowId) } });
      if (!escrow) {
        return { success: false, message: 'Escrow not found' };
      }

      // Update escrow status to refunded
      await prisma.escrow.update({
        where: { id: parseInt(escrowId) },
        data: {
          status: 'REFUNDED',
          releasedAt: new Date(),
          metadata: {
            ...(escrow.metadata as object || {}),
            refundedByAdmin: adminId,
            refundReason: 'Dispute resolution - refund to buyer',
            refundAmount: amount,
          },
        },
      });

      return {
        success: true,
        transactionId: `ESC-REF-${Date.now()}`,
        message: 'Escrow refunded to buyer',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to refund escrow',
      };
    }
  }

  /**
   * Trigger partial refund
   */
  private async triggerPartialRefund(
    escrowId: string,
    refundAmount: number,
    releaseAmount: number,
    adminId?: string
  ) {
    try {
      const escrow = await prisma.escrow.findUnique({ where: { id: parseInt(escrowId) } });
      if (!escrow) {
        return { success: false, message: 'Escrow not found' };
      }

      // Update escrow with partial refund details
      await prisma.escrow.update({
        where: { id: parseInt(escrowId) },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          metadata: {
            ...(escrow.metadata as object || {}),
            partialRefundByAdmin: adminId,
            partialRefundReason: 'Dispute resolution - partial refund',
            refundAmount,
            releaseAmount,
          },
        },
      });

      return {
        success: true,
        transactionId: `ESC-PART-${Date.now()}`,
        message: `Partial refund: $${refundAmount} to buyer, $${releaseAmount} to seller`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process partial refund',
      };
    }
  }

  /**
   * Add message to dispute
   */
  async addMessage(disputeId: string, message: string, adminId: string, adminName: string) {
    await this.getDispute(disputeId); // Verify dispute exists

    const newMessage = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: adminId,
        senderName: adminName,
        senderRole: 'admin',
        message,
      },
    });

    return newMessage;
  }

  /**
   * Get audit logs for a dispute
   * Requirements: 12.4 - Log resolution action for audit
   */
  async getAuditLogs(disputeId: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        targetId: parseInt(disputeId) || undefined,
        targetType: 'Dispute',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      logs: logs.map((log) => ({
        id: log.id.toString(),
        action: log.action,
        actorId: log.actorId?.toString() || '',
        actorName: log.actorEmail || 'System',
        description: log.description,
        metadata: log.metadata as Record<string, any> || {},
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Log audit action
   * Requirements: 12.4 - Log resolution action for audit
   */
  private async logAuditAction(
    action: string,
    actorId: string,
    disputeId: string,
    description: string,
    metadata: Record<string, any>
  ): Promise<string> {
    try {
      const log = await prisma.auditLog.create({
        data: {
          action: action as any,
          severity: (action === AuditAction.DISPUTE_RESOLVED ? AuditSeverity.WARNING : AuditSeverity.INFO) as any,
          actorId: parseInt(actorId) || undefined,
          targetId: parseInt(disputeId) || undefined,
          targetType: 'Dispute',
          description,
          metadata,
        },
      });
      return log.id.toString();
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return '';
    }
  }
}
