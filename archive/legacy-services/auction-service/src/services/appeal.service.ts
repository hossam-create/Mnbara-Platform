// ============================================================
// PHASE 6.0 — Enforcement Appeal Service
//
// CRITICAL RULES:
// - Every enforcement action creates an appeal window
// - Appeals are read/write isolated
// - Appeals do NOT auto-revert actions
// - Decisions require justification
// - Appeal outcomes logged immutably
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum AppealStatus {
  OPEN = 'OPEN',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

// ============================================================
// INTERFACES
// ============================================================

export interface SubmitAppealRequest {
  actionId: number;
  userId: number;
  reason: string;
  evidence?: Record<string, any>;
}

export interface DecideAppealRequest {
  appealId: number;
  decision: 'APPROVED' | 'REJECTED';
  decidedBy: string;
  justification: string;
  metadata?: Record<string, any>;
}

// ============================================================
// APPEAL SERVICE
// ============================================================

export class AppealService {
  // ============================================================
  // SUBMIT APPEAL
  // User submits appeal during appeal window
  // ============================================================
  async submitAppeal(params: SubmitAppealRequest): Promise<any> {
    // 1. Get enforcement action
    const action = await prisma.enforcementAction.findUnique({
      where: { id: params.actionId },
    });

    if (!action) {
      throw new Error('Enforcement action not found');
    }

    // 2. Get appeal
    const appeal = await prisma.enforcementAppeal.findFirst({
      where: { actionId: params.actionId },
    });

    if (!appeal) {
      throw new Error('Appeal not found for this enforcement action');
    }

    // 3. ❌ CRITICAL: Verify appeal window is still open
    const now = new Date();
    if (now > appeal.appealWindowEndsAt) {
      throw new Error(
        `Appeal window has closed. Window ended at ${appeal.appealWindowEndsAt.toISOString()}`
      );
    }

    // 4. Verify user is the target of enforcement
    if (appeal.userId !== params.userId) {
      throw new Error('User cannot appeal enforcement action against another user');
    }

    // 5. Create appeal submission (APPEND-ONLY)
    const submission = await prisma.enforcementAppealSubmission.create({
      data: {
        appealId: appeal.id,
        userId: params.userId,
        reason: params.reason,
        evidence: params.evidence,
        submittedAt: new Date(),
      },
    });

    // 6. Update appeal status to APPEALED
    const updatedAppeal = await prisma.enforcementAppeal.update({
      where: { id: appeal.id },
      data: {
        status: AppealStatus.OPEN, // Still open, awaiting decision
        submittedAt: new Date(),
      },
    });

    // 7. Update enforcement action status
    await prisma.enforcementAction.update({
      where: { id: params.actionId },
      data: {
        status: 'APPEALED',
      },
    });

    console.log(`[APPEAL_SUBMITTED] Appeal ${appeal.id}:`, {
      actionId: params.actionId,
      userId: params.userId,
      reason: params.reason,
      windowEndsAt: appeal.appealWindowEndsAt.toISOString(),
    });

    return {
      appeal: updatedAppeal,
      submission,
    };
  }

  // ============================================================
  // DECIDE APPEAL
  // Admin decides on appeal (APPROVED or REJECTED)
  // ============================================================
  async decideAppeal(params: DecideAppealRequest): Promise<any> {
    // 1. Get appeal
    const appeal = await prisma.enforcementAppeal.findUnique({
      where: { id: params.appealId },
      include: {
        action: true,
        submissions: { orderBy: { submittedAt: 'desc' }, take: 1 },
      },
    });

    if (!appeal) {
      throw new Error('Appeal not found');
    }

    // 2. Verify appeal is still open
    if (appeal.status !== AppealStatus.OPEN) {
      throw new Error(`Appeal is already ${appeal.status}`);
    }

    // 3. Verify appeal window is still open
    const now = new Date();
    if (now > appeal.appealWindowEndsAt) {
      throw new Error('Appeal window has closed');
    }

    // 4. Create appeal decision (APPEND-ONLY)
    const decision = await prisma.enforcementAppealDecision.create({
      data: {
        appealId: params.appealId,
        decision: params.decision,
        decidedBy: params.decidedBy,
        justification: params.justification,
        metadata: params.metadata,
        decidedAt: new Date(),
      },
    });

    // 5. Update appeal status
    const newStatus = params.decision === 'APPROVED' ? AppealStatus.APPROVED : AppealStatus.REJECTED;
    const updatedAppeal = await prisma.enforcementAppeal.update({
      where: { id: params.appealId },
      data: {
        status: newStatus,
        decidedAt: new Date(),
      },
    });

    // 6. If appeal is APPROVED, revert the enforcement action
    if (params.decision === 'APPROVED') {
      // Note: Actual revert logic would be handled by TrustEnforcementService
      // This just marks it for revert
      await prisma.enforcementAction.update({
        where: { id: appeal.actionId },
        data: {
          metadata: {
            ...appeal.action.metadata,
            appealApproved: true,
            appealApprovedAt: new Date().toISOString(),
          },
        },
      });
    }

    // 7. Create audit log (APPEND-ONLY)
    await prisma.enforcementAuditLog.create({
      data: {
        actionId: appeal.actionId,
        action: `APPEAL_${params.decision}`,
        executedBy: params.decidedBy,
        metadata: {
          appealId: params.appealId,
          justification: params.justification,
        },
      },
    });

    console.log(`[APPEAL_DECIDED] Appeal ${params.appealId}:`, {
      decision: params.decision,
      decidedBy: params.decidedBy,
      actionId: appeal.actionId,
    });

    return {
      appeal: updatedAppeal,
      decision,
    };
  }

  // ============================================================
  // GET APPEAL
  // ============================================================
  async getAppeal(appealId: number): Promise<any> {
    return prisma.enforcementAppeal.findUnique({
      where: { id: appealId },
      include: {
        action: true,
        submissions: { orderBy: { submittedAt: 'desc' } },
        decision: true,
      },
    });
  }

  // ============================================================
  // GET APPEALS FOR USER
  // ============================================================
  async getAppealsForUser(userId: number): Promise<any> {
    return prisma.enforcementAppeal.findMany({
      where: { userId },
      include: {
        action: true,
        submissions: { orderBy: { submittedAt: 'desc' } },
        decision: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // GET OPEN APPEALS (ADMIN)
  // ============================================================
  async getOpenAppeals(limit: number = 50, offset: number = 0): Promise<any> {
    const [appeals, total] = await Promise.all([
      prisma.enforcementAppeal.findMany({
        where: { status: AppealStatus.OPEN },
        include: {
          action: true,
          submissions: { orderBy: { submittedAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.enforcementAppeal.count({
        where: { status: AppealStatus.OPEN },
      }),
    ]);

    return {
      appeals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + appeals.length < total,
      },
    };
  }

  // ============================================================
  // CHECK IF APPEAL WINDOW IS OPEN
  // ============================================================
  async isAppealWindowOpen(actionId: number): Promise<boolean> {
    const appeal = await prisma.enforcementAppeal.findFirst({
      where: { actionId },
    });

    if (!appeal) {
      return false;
    }

    return new Date() < appeal.appealWindowEndsAt;
  }

  // ============================================================
  // GET APPEAL WINDOW INFO
  // ============================================================
  async getAppealWindowInfo(actionId: number): Promise<any> {
    const appeal = await prisma.enforcementAppeal.findFirst({
      where: { actionId },
    });

    if (!appeal) {
      throw new Error('Appeal not found for this action');
    }

    const now = new Date();
    const isOpen = now < appeal.appealWindowEndsAt;
    const timeRemainingMs = appeal.appealWindowEndsAt.getTime() - now.getTime();

    return {
      appealId: appeal.id,
      actionId,
      status: appeal.status,
      isOpen,
      windowEndsAt: appeal.appealWindowEndsAt,
      timeRemainingMinutes: Math.ceil(timeRemainingMs / (1000 * 60)),
      submissions: await prisma.enforcementAppealSubmission.count({
        where: { appealId: appeal.id },
      }),
    };
  }
}

// Export singleton instance
export const appealService = new AppealService();
