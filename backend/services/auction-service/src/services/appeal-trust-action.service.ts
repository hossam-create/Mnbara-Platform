// ============================================================
// PHASE 6.3 — Appeal Trust Action Service
//
// CRITICAL RULES:
// ❌ Appeals can NEVER auto-reverse enforcement
// ❌ Appeals can NEVER modify ledger entries
// ❌ Appeals can NEVER release escrow
// ❌ Appeals can NEVER be decided by Frontend
// ❌ No deletes, no updates to historical actions
//
// ✅ Appeals are REQUESTS only
// ✅ Decisions are ADMIN / CONTROL CENTER only
// ✅ Every step is logged and immutable
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum AppealReason {
  INCORRECT_ENFORCEMENT = 'INCORRECT_ENFORCEMENT',
  EVIDENCE_MISUNDERSTOOD = 'EVIDENCE_MISUNDERSTOOD',
  CIRCUMSTANCES_CHANGED = 'CIRCUMSTANCES_CHANGED',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  OTHER = 'OTHER',
}

export enum AppealStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SubjectType {
  USER = 'USER',
  WALLET = 'WALLET',
  AUCTION = 'AUCTION',
}

export interface AppealSubmissionRequest {
  trustActionId: number;
  subjectType: SubjectType;
  subjectId: number;
  appealReason: AppealReason;
  userStatement: string;
  evidence?: Record<string, any>;
}

export interface AppealDecisionRequest {
  appealId: number;
  decision: 'APPROVED' | 'REJECTED';
  justification: string;
  decidedBy: string;
  secondApprovedBy?: string; // Required for APPROVED
}

// ============================================================
// APPEAL TRUST ACTION SERVICE
// ============================================================

export class AppealTrustActionService {
  // ============================================================
  // SUBMIT APPEAL
  // User submits appeal for trust action
  // ============================================================
  async submitAppeal(params: AppealSubmissionRequest): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Verify trust action exists and is ACTIVE
      const trustAction = await tx.trustAction.findUnique({
        where: { id: params.trustActionId },
      });

      if (!trustAction) {
        throw new Error('Trust action not found');
      }

      if (trustAction.status !== 'ACTIVE') {
        throw new Error(`Cannot appeal action in status: ${trustAction.status}`);
      }

      // 2. Check if appeal already exists
      const existingAppeal = await tx.appeal.findFirst({
        where: {
          trustActionId: params.trustActionId,
        },
      });

      if (existingAppeal) {
        throw new Error('Appeal already exists for this trust action');
      }

      // 3. Create appeal (APPEND-ONLY)
      const appeal = await tx.appeal.create({
        data: {
          trustActionId: params.trustActionId,
          subjectType: params.subjectType,
          subjectId: params.subjectId,
          appealReason: params.appealReason,
          userStatement: params.userStatement,
          status: AppealStatus.PENDING,
          evidence: params.evidence || {},
          submittedAt: new Date(),
        },
      });

      // 4. Create audit log (APPEND-ONLY)
      await tx.appealDecisionLog.create({
        data: {
          appealId: appeal.id,
          action: 'SUBMITTED',
          metadata: {
            trustActionId: params.trustActionId,
            appealReason: params.appealReason,
            subjectType: params.subjectType,
            subjectId: params.subjectId,
          },
        },
      });

      console.log(`[APPEAL_SUBMITTED] Appeal ${appeal.id}:`, {
        trustActionId: params.trustActionId,
        appealReason: params.appealReason,
        subjectType: params.subjectType,
      });

      return appeal;
    });
  }

  // ============================================================
  // GET APPEAL
  // ============================================================
  async getAppeal(appealId: number): Promise<any> {
    return await prisma.appeal.findUnique({
      where: { id: appealId },
      include: {
        trustAction: true,
        decisionLogs: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  // ============================================================
  // GET APPEALS FOR USER
  // ============================================================
  async getAppealsForUser(userId: number): Promise<any[]> {
    return await prisma.appeal.findMany({
      where: {
        trustAction: {
          userId,
        },
      },
      include: {
        trustAction: true,
        decisionLogs: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // ============================================================
  // GET PENDING APPEALS (ADMIN)
  // ============================================================
  async getPendingAppeals(limit: number = 50, offset: number = 0): Promise<any> {
    const [appeals, total] = await Promise.all([
      prisma.appeal.findMany({
        where: {
          status: { in: [AppealStatus.PENDING, AppealStatus.UNDER_REVIEW] },
        },
        include: {
          trustAction: true,
          decisionLogs: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: { submittedAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.appeal.count({
        where: {
          status: { in: [AppealStatus.PENDING, AppealStatus.UNDER_REVIEW] },
        },
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
  // GET APPEAL HISTORY
  // ============================================================
  async getAppealHistory(
    trustActionId?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<any> {
    const where: any = {};
    if (trustActionId) where.trustActionId = trustActionId;

    const [appeals, total] = await Promise.all([
      prisma.appeal.findMany({
        where,
        include: {
          trustAction: true,
          decisionLogs: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.appeal.count({ where }),
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
  // VERIFY APPEAL CANNOT CHANGE ENFORCEMENT
  // ============================================================
  async verifyEnforcementImmutable(appealId: number): Promise<boolean> {
    const appeal = await prisma.appeal.findUnique({
      where: { id: appealId },
      include: { trustAction: true },
    });

    if (!appeal) {
      throw new Error('Appeal not found');
    }

    // Verify trust action is still in same state
    const trustAction = await prisma.trustAction.findUnique({
      where: { id: appeal.trustActionId },
    });

    if (!trustAction) {
      throw new Error('Trust action not found');
    }

    // Trust action should still be ACTIVE (unless manually lifted)
    // Appeal cannot change this
    return trustAction.status === 'ACTIVE' || trustAction.status === 'LIFTED';
  }
}

// Export singleton instance
export const appealTrustActionService = new AppealTrustActionService();
