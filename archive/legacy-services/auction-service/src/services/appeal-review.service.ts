// ============================================================
// PHASE 6.3 — Appeal Review Service
//
// Handles review and decision of appeals
// Dual approval required for reversals
// Original enforcement remains immutable
// ============================================================

import { PrismaClient } from '@prisma/client';
import { TrustActionType, TrustSeverity } from './trust-action.service';

const prisma = new PrismaClient();

export interface ReviewAssignmentRequest {
  appealId: number;
  assignedTo: string;
}

export interface AppealDecisionRequest {
  appealId: number;
  decision: 'APPROVED' | 'REJECTED';
  justification: string;
  decidedBy: string;
  secondApprovedBy?: string; // Required for APPROVED
}

// ============================================================
// APPEAL REVIEW SERVICE
// ============================================================

export class AppealReviewService {
  // ============================================================
  // ASSIGN REVIEWER
  // Assign appeal to reviewer
  // ============================================================
  async assignReviewer(params: ReviewAssignmentRequest): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const appeal = await tx.appeal.findUnique({
        where: { id: params.appealId },
      });

      if (!appeal) {
        throw new Error('Appeal not found');
      }

      if (appeal.status !== 'PENDING') {
        throw new Error(`Cannot assign appeal in status: ${appeal.status}`);
      }

      // Update status to UNDER_REVIEW
      const updated = await tx.appeal.update({
        where: { id: params.appealId },
        data: {
          status: 'UNDER_REVIEW',
          assignedTo: params.assignedTo,
          assignedAt: new Date(),
        },
      });

      // Create audit log
      await tx.appealDecisionLog.create({
        data: {
          appealId: params.appealId,
          action: 'ASSIGNED',
          metadata: {
            assignedTo: params.assignedTo,
          },
        },
      });

      console.log(`[APPEAL_ASSIGNED] Appeal ${params.appealId}:`, {
        assignedTo: params.assignedTo,
      });

      return updated;
    });
  }

  // ============================================================
  // APPROVE APPEAL
  // Approve appeal and create reversal action
  // Requires dual approval
  // ============================================================
  async approveAppeal(params: AppealDecisionRequest): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Verify dual approval
      if (!params.secondApprovedBy || params.decidedBy === params.secondApprovedBy) {
        throw new Error('Appeal approval requires dual approval from different reviewers');
      }

      // 2. Get appeal and trust action
      const appeal = await tx.appeal.findUnique({
        where: { id: params.appealId },
        include: { trustAction: true },
      });

      if (!appeal) {
        throw new Error('Appeal not found');
      }

      if (appeal.status !== 'UNDER_REVIEW') {
        throw new Error(`Cannot approve appeal in status: ${appeal.status}`);
      }

      // 3. Update appeal status to APPROVED
      const approvedAppeal = await tx.appeal.update({
        where: { id: params.appealId },
        data: {
          status: 'APPROVED',
          decidedAt: new Date(),
          decidedBy: params.decidedBy,
          decision: 'APPROVED',
          justification: params.justification,
        },
      });

      // 4. Create reversal trust action (explicit, not edit)
      const reversalActionType = this.getReversalActionType(appeal.trustAction.actionType);

      const reversalAction = await tx.trustAction.create({
        data: {
          userId: appeal.trustAction.userId,
          walletId: appeal.trustAction.walletId,
          auctionId: appeal.trustAction.auctionId,
          actionType: reversalActionType,
          severity: TrustSeverity.MEDIUM,
          status: 'ACTIVE',
          reason: `Reversal of ${appeal.trustAction.actionType} due to approved appeal #${params.appealId}`,
          durationMinutes: null, // Permanent reversal
          metadata: {
            appealId: params.appealId,
            originalActionId: appeal.trustActionId,
            reversalReason: params.justification,
            approvedBy: params.decidedBy,
            secondApprovedBy: params.secondApprovedBy,
          },
          activatedAt: new Date(),
        },
      });

      // 5. Create audit logs
      await tx.appealDecisionLog.create({
        data: {
          appealId: params.appealId,
          action: 'APPROVED',
          metadata: {
            decidedBy: params.decidedBy,
            secondApprovedBy: params.secondApprovedBy,
            justification: params.justification,
            reversalActionId: reversalAction.id,
          },
        },
      });

      // 6. Log reversal action
      await tx.trustActionLog.create({
        data: {
          actionId: reversalAction.id,
          action_type: 'ACTIVATED',
          metadata: {
            appealId: params.appealId,
            originalActionId: appeal.trustActionId,
            reversalReason: params.justification,
          },
        },
      });

      console.log(`[APPEAL_APPROVED] Appeal ${params.appealId}:`, {
        decidedBy: params.decidedBy,
        secondApprovedBy: params.secondApprovedBy,
        reversalActionId: reversalAction.id,
      });

      return {
        appeal: approvedAppeal,
        reversalAction,
      };
    });
  }

  // ============================================================
  // REJECT APPEAL
  // Reject appeal (enforcement remains active)
  // ============================================================
  async rejectAppeal(params: AppealDecisionRequest): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const appeal = await tx.appeal.findUnique({
        where: { id: params.appealId },
      });

      if (!appeal) {
        throw new Error('Appeal not found');
      }

      if (appeal.status !== 'UNDER_REVIEW') {
        throw new Error(`Cannot reject appeal in status: ${appeal.status}`);
      }

      // Update appeal status to REJECTED
      const rejectedAppeal = await tx.appeal.update({
        where: { id: params.appealId },
        data: {
          status: 'REJECTED',
          decidedAt: new Date(),
          decidedBy: params.decidedBy,
          decision: 'REJECTED',
          justification: params.justification,
        },
      });

      // Create audit log
      await tx.appealDecisionLog.create({
        data: {
          appealId: params.appealId,
          action: 'REJECTED',
          metadata: {
            decidedBy: params.decidedBy,
            justification: params.justification,
          },
        },
      });

      console.log(`[APPEAL_REJECTED] Appeal ${params.appealId}:`, {
        decidedBy: params.decidedBy,
      });

      return rejectedAppeal;
    });
  }

  // ============================================================
  // GET REVERSAL ACTION TYPE
  // Map original action to reversal action
  // ============================================================
  private getReversalActionType(originalActionType: TrustActionType): TrustActionType {
    const reversalMap: Record<TrustActionType, TrustActionType> = {
      [TrustActionType.FREEZE_WALLET]: TrustActionType.FREEZE_WALLET, // Placeholder
      [TrustActionType.FREEZE_ESCROW_RELEASE]: TrustActionType.FREEZE_ESCROW_RELEASE,
      [TrustActionType.BLOCK_PAYOUTS]: TrustActionType.BLOCK_PAYOUTS,
      [TrustActionType.AUCTION_BID_BLOCK]: TrustActionType.AUCTION_BID_BLOCK,
      [TrustActionType.ACCOUNT_RESTRICTED]: TrustActionType.ACCOUNT_RESTRICTED,
    };

    return reversalMap[originalActionType] || originalActionType;
  }

  // ============================================================
  // GET APPEAL TIMELINE
  // Get full timeline of appeal and related actions
  // ============================================================
  async getAppealTimeline(appealId: number): Promise<any> {
    const appeal = await prisma.appeal.findUnique({
      where: { id: appealId },
      include: {
        trustAction: {
          include: {
            logs: { orderBy: { createdAt: 'asc' } },
          },
        },
        decisionLogs: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!appeal) {
      throw new Error('Appeal not found');
    }

    // Build timeline
    const timeline: any[] = [];

    // Add trust action activation
    if (appeal.trustAction) {
      timeline.push({
        timestamp: appeal.trustAction.activatedAt,
        type: 'ENFORCEMENT_ACTIVATED',
        actionType: appeal.trustAction.actionType,
        severity: appeal.trustAction.severity,
      });

      // Add trust action logs
      for (const log of appeal.trustAction.logs) {
        timeline.push({
          timestamp: log.createdAt,
          type: 'ENFORCEMENT_LOG',
          action: log.action_type,
        });
      }
    }

    // Add appeal submission
    timeline.push({
      timestamp: appeal.submittedAt,
      type: 'APPEAL_SUBMITTED',
      reason: appeal.appealReason,
    });

    // Add appeal decision logs
    for (const log of appeal.decisionLogs) {
      timeline.push({
        timestamp: log.createdAt,
        type: 'APPEAL_LOG',
        action: log.action,
      });
    }

    // Sort by timestamp
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      appealId,
      timeline,
      appeal,
    };
  }
}

// Export singleton instance
export const appealReviewService = new AppealReviewService();
