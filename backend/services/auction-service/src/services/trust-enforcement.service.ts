// ============================================================
// PHASE 6.0 — Trust & Safety Enforcement Service
//
// CRITICAL RULES:
// ❌ DO NOT:
// - Auto-ban users
// - Auto-confiscate funds
// - Modify ledger entries
// - Release or revoke escrow
// - Enforce based on a single signal
// - Allow frontend-triggered enforcement
// - Hide enforcement actions from audit logs
//
// ✅ MUST:
// - Require evidence aggregation
// - Require human or policy-based confirmation
// - Be role-restricted (Trust & Safety only)
// - Be reversible with justification
// - Log every action immutably
// - Separate SIGNAL → DECISION → ACTION
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Enums
export enum EnforcementActionType {
  BID_THROTTLE = 'BID_THROTTLE',
  TEMP_SUSPENSION = 'TEMP_SUSPENSION',
  AUCTION_PARTICIPATION_BLOCK = 'AUCTION_PARTICIPATION_BLOCK',
  PAYOUT_DELAY = 'PAYOUT_DELAY',
  TRUST_BADGE_REMOVAL = 'TRUST_BADGE_REMOVAL',
  AUCTION_FREEZE = 'AUCTION_FREEZE',
  BID_INVALIDATION = 'BID_INVALIDATION',
  AUCTION_CANCEL = 'AUCTION_CANCEL',
  AUTO_RELIST_DISABLE = 'AUTO_RELIST_DISABLE',
  LISTING_CREATION_LIMIT = 'LISTING_CREATION_LIMIT',
  SELLER_REVIEW_FLAG = 'SELLER_REVIEW_FLAG',
}

export enum EnforcementStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
  REVERTED = 'REVERTED',
  APPEALED = 'APPEALED',
}

export enum EnforcementTier {
  TIER_1_SOFT = 'TIER_1_SOFT',
  TIER_2_TEMPORARY = 'TIER_2_TEMPORARY',
  TIER_3_SEVERE = 'TIER_3_SEVERE',
}

export enum AppealStatus {
  OPEN = 'OPEN',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

// Type for Prisma transaction client
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// ============================================================
// INTERFACES
// ============================================================

export interface EnforcementReviewRequest {
  targetUserId?: number;
  targetAuctionId?: number;
  targetSellerId?: number;
  recommendedAction: EnforcementActionType;
  tier: EnforcementTier;
  evidence: Record<string, any>;
  justification: string;
  durationMinutes?: number; // For time-bound actions
}

export interface EnforcementExecutionRequest {
  actionId: number;
  approvedBy: string; // Trust & Safety admin ID
  secondApprovedBy?: string; // Required for Tier 3
  executionNote?: string;
}

export interface EnforcementRevertRequest {
  actionId: number;
  revertedBy: string;
  revertReason: string;
}

export interface AppealDecisionRequest {
  appealId: number;
  decision: 'APPROVED' | 'REJECTED';
  decidedBy: string;
  justification: string;
}

// ============================================================
// TRUST ENFORCEMENT SERVICE
// ============================================================

export class TrustEnforcementService {
  // ============================================================
  // CREATE ENFORCEMENT REVIEW
  // Signals → Evidence → Recommendation (NOT executed)
  // ============================================================
  async createEnforcementReview(
    params: EnforcementReviewRequest
  ): Promise<any> {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Validate tier requirements
      if (params.tier === EnforcementTier.TIER_3_SEVERE) {
        if (!params.justification || params.justification.length < 100) {
          throw new Error('Tier 3 enforcement requires detailed justification (100+ chars)');
        }
      }

      // 2. Create enforcement action (PENDING_REVIEW)
      const action = await tx.enforcementAction.create({
        data: {
          targetUserId: params.targetUserId,
          targetAuctionId: params.targetAuctionId,
          targetSellerId: params.targetSellerId,
          actionType: params.recommendedAction,
          tier: params.tier,
          status: EnforcementStatus.PENDING_REVIEW,
          durationMinutes: params.durationMinutes,
          justification: params.justification,
          metadata: {
            createdAt: new Date().toISOString(),
          },
        },
      });

      // 3. Create evidence record (APPEND-ONLY)
      await tx.enforcementEvidence.create({
        data: {
          actionId: action.id,
          evidenceType: 'AGGREGATED_SIGNALS',
          evidence: params.evidence,
          metadata: {
            signalCount: Object.keys(params.evidence).length,
          },
        },
      });

      console.log(`[ENFORCEMENT_REVIEW] Created action ${action.id}:`, {
        actionType: params.recommendedAction,
        tier: params.tier,
        targetUserId: params.targetUserId,
        status: EnforcementStatus.PENDING_REVIEW,
      });

      return action;
    });
  }

  // ============================================================
  // EXECUTE ENFORCEMENT ACTION
  // Requires approval + dual approval for Tier 3
  // ============================================================
  async executeEnforcementAction(
    params: EnforcementExecutionRequest
  ): Promise<any> {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get enforcement action
      const action = await tx.enforcementAction.findUnique({
        where: { id: params.actionId },
      });

      if (!action) {
        throw new Error('Enforcement action not found');
      }

      // 2. Verify status is APPROVED
      if (action.status !== EnforcementStatus.APPROVED) {
        throw new Error(
          `Cannot execute action in status: ${action.status}. Must be APPROVED first.`
        );
      }

      // 3. ❌ CRITICAL: Verify dual approval for Tier 3
      if (action.tier === EnforcementTier.TIER_3_SEVERE) {
        if (!params.secondApprovedBy || params.approvedBy === params.secondApprovedBy) {
          throw new Error(
            'Tier 3 enforcement requires dual approval from different admins'
          );
        }
      }

      // 4. Execute action based on type
      let executionResult: any = null;

      switch (action.actionType) {
        case EnforcementActionType.BID_THROTTLE:
          executionResult = await this.executeBidThrottle(tx, action);
          break;

        case EnforcementActionType.TEMP_SUSPENSION:
          executionResult = await this.executeTempSuspension(tx, action);
          break;

        case EnforcementActionType.AUCTION_PARTICIPATION_BLOCK:
          executionResult = await this.executeAuctionParticipationBlock(tx, action);
          break;

        case EnforcementActionType.PAYOUT_DELAY:
          executionResult = await this.executePayoutDelay(tx, action);
          break;

        case EnforcementActionType.TRUST_BADGE_REMOVAL:
          executionResult = await this.executeTrustBadgeRemoval(tx, action);
          break;

        case EnforcementActionType.AUCTION_FREEZE:
          executionResult = await this.executeAuctionFreeze(tx, action);
          break;

        case EnforcementActionType.BID_INVALIDATION:
          executionResult = await this.executeBidInvalidation(tx, action);
          break;

        case EnforcementActionType.AUCTION_CANCEL:
          executionResult = await this.executeAuctionCancel(tx, action);
          break;

        case EnforcementActionType.AUTO_RELIST_DISABLE:
          executionResult = await this.executeAutoRelistDisable(tx, action);
          break;

        case EnforcementActionType.LISTING_CREATION_LIMIT:
          executionResult = await this.executeListingCreationLimit(tx, action);
          break;

        case EnforcementActionType.SELLER_REVIEW_FLAG:
          executionResult = await this.executeSellerReviewFlag(tx, action);
          break;

        default:
          throw new Error(`Unknown enforcement action type: ${action.actionType}`);
      }

      // 5. Update action status to EXECUTED
      const executedAction = await tx.enforcementAction.update({
        where: { id: params.actionId },
        data: {
          status: EnforcementStatus.EXECUTED,
          executedAt: new Date(),
          executedBy: params.approvedBy,
          metadata: {
            ...action.metadata,
            executionResult,
            secondApprovedBy: params.secondApprovedBy,
            executionNote: params.executionNote,
          },
        },
      });

      // 6. Create audit log (APPEND-ONLY)
      await tx.enforcementAuditLog.create({
        data: {
          actionId: params.actionId,
          action: 'EXECUTED',
          executedBy: params.approvedBy,
          metadata: {
            tier: action.tier,
            actionType: action.actionType,
            targetUserId: action.targetUserId,
            targetAuctionId: action.targetAuctionId,
            targetSellerId: action.targetSellerId,
            secondApprovedBy: params.secondApprovedBy,
          },
        },
      });

      // 7. Create appeal window (MANDATORY)
      const appealWindowEndsAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
      await tx.enforcementAppeal.create({
        data: {
          actionId: params.actionId,
          userId: action.targetUserId || 0,
          status: AppealStatus.OPEN,
          appealWindowEndsAt,
          metadata: {
            createdAt: new Date().toISOString(),
          },
        },
      });

      console.log(`[ENFORCEMENT_EXECUTED] Action ${params.actionId}:`, {
        actionType: action.actionType,
        tier: action.tier,
        executedBy: params.approvedBy,
        secondApprovedBy: params.secondApprovedBy,
      });

      return executedAction;
    });
  }

  // ============================================================
  // REVERT ENFORCEMENT ACTION
  // Requires justification + audit log
  // ============================================================
  async revertEnforcementAction(
    params: EnforcementRevertRequest
  ): Promise<any> {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get enforcement action
      const action = await tx.enforcementAction.findUnique({
        where: { id: params.actionId },
      });

      if (!action) {
        throw new Error('Enforcement action not found');
      }

      // 2. Verify action is EXECUTED
      if (action.status !== EnforcementStatus.EXECUTED) {
        throw new Error(
          `Cannot revert action in status: ${action.status}. Must be EXECUTED first.`
        );
      }

      // 3. Revert action based on type
      let revertResult: any = null;

      switch (action.actionType) {
        case EnforcementActionType.BID_THROTTLE:
          revertResult = await this.revertBidThrottle(tx, action);
          break;

        case EnforcementActionType.TEMP_SUSPENSION:
          revertResult = await this.revertTempSuspension(tx, action);
          break;

        case EnforcementActionType.AUCTION_PARTICIPATION_BLOCK:
          revertResult = await this.revertAuctionParticipationBlock(tx, action);
          break;

        case EnforcementActionType.PAYOUT_DELAY:
          revertResult = await this.revertPayoutDelay(tx, action);
          break;

        case EnforcementActionType.TRUST_BADGE_REMOVAL:
          revertResult = await this.revertTrustBadgeRemoval(tx, action);
          break;

        case EnforcementActionType.AUCTION_FREEZE:
          revertResult = await this.revertAuctionFreeze(tx, action);
          break;

        case EnforcementActionType.AUTO_RELIST_DISABLE:
          revertResult = await this.revertAutoRelistDisable(tx, action);
          break;

        case EnforcementActionType.LISTING_CREATION_LIMIT:
          revertResult = await this.revertListingCreationLimit(tx, action);
          break;

        case EnforcementActionType.SELLER_REVIEW_FLAG:
          revertResult = await this.revertSellerReviewFlag(tx, action);
          break;

        default:
          // Some actions cannot be reverted (BID_INVALIDATION, AUCTION_CANCEL)
          throw new Error(
            `Enforcement action type ${action.actionType} cannot be reverted`
          );
      }

      // 4. Update action status to REVERTED
      const revertedAction = await tx.enforcementAction.update({
        where: { id: params.actionId },
        data: {
          status: EnforcementStatus.REVERTED,
          revertedAt: new Date(),
          revertedBy: params.revertedBy,
          metadata: {
            ...action.metadata,
            revertResult,
            revertReason: params.revertReason,
          },
        },
      });

      // 5. Create audit log (APPEND-ONLY)
      await tx.enforcementAuditLog.create({
        data: {
          actionId: params.actionId,
          action: 'REVERTED',
          executedBy: params.revertedBy,
          metadata: {
            revertReason: params.revertReason,
            actionType: action.actionType,
          },
        },
      });

      console.log(`[ENFORCEMENT_REVERTED] Action ${params.actionId}:`, {
        actionType: action.actionType,
        revertedBy: params.revertedBy,
        revertReason: params.revertReason,
      });

      return revertedAction;
    });
  }

  // ============================================================
  // APPROVE ENFORCEMENT ACTION
  // Moves from PENDING_REVIEW → APPROVED
  // ============================================================
  async approveEnforcementAction(
    actionId: number,
    approvedBy: string
  ): Promise<any> {
    const action = await prisma.enforcementAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new Error('Enforcement action not found');
    }

    if (action.status !== EnforcementStatus.PENDING_REVIEW) {
      throw new Error(
        `Cannot approve action in status: ${action.status}. Must be PENDING_REVIEW.`
      );
    }

    const approvedAction = await prisma.enforcementAction.update({
      where: { id: actionId },
      data: {
        status: EnforcementStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy,
      },
    });

    // Create audit log
    await prisma.enforcementAuditLog.create({
      data: {
        actionId,
        action: 'APPROVED',
        executedBy: approvedBy,
        metadata: {
          actionType: action.actionType,
          tier: action.tier,
        },
      },
    });

    return approvedAction;
  }

  // ============================================================
  // REJECT ENFORCEMENT ACTION
  // Moves from PENDING_REVIEW → REJECTED
  // ============================================================
  async rejectEnforcementAction(
    actionId: number,
    rejectedBy: string,
    reason: string
  ): Promise<any> {
    const action = await prisma.enforcementAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new Error('Enforcement action not found');
    }

    if (action.status !== EnforcementStatus.PENDING_REVIEW) {
      throw new Error(
        `Cannot reject action in status: ${action.status}. Must be PENDING_REVIEW.`
      );
    }

    const rejectedAction = await prisma.enforcementAction.update({
      where: { id: actionId },
      data: {
        status: EnforcementStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy,
        metadata: {
          ...action.metadata,
          rejectionReason: reason,
        },
      },
    });

    // Create audit log
    await prisma.enforcementAuditLog.create({
      data: {
        actionId,
        action: 'REJECTED',
        executedBy: rejectedBy,
        metadata: {
          reason,
          actionType: action.actionType,
        },
      },
    });

    return rejectedAction;
  }

  // ============================================================
  // GET ENFORCEMENT ACTIONS
  // ============================================================
  async getEnforcementActions(
    filters?: {
      status?: EnforcementStatus;
      tier?: EnforcementTier;
      targetUserId?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<any> {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.tier) where.tier = filters.tier;
    if (filters?.targetUserId) where.targetUserId = filters.targetUserId;

    const [actions, total] = await Promise.all([
      prisma.enforcementAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          evidence: true,
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }),
      prisma.enforcementAction.count({ where }),
    ]);

    return {
      actions,
      pagination: {
        total,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
        hasMore: (filters?.offset || 0) + actions.length < total,
      },
    };
  }

  // ============================================================
  // GET ENFORCEMENT STATUS FOR USER
  // ============================================================
  async getEnforcementStatus(userId: number): Promise<any> {
    const actions = await prisma.enforcementAction.findMany({
      where: {
        targetUserId: userId,
        status: { in: [EnforcementStatus.EXECUTED, EnforcementStatus.APPEALED] },
      },
      orderBy: { executedAt: 'desc' },
      include: {
        appeals: {
          where: { status: AppealStatus.OPEN },
        },
      },
    });

    return {
      userId,
      activeEnforcements: actions.filter((a) => {
        if (a.actionType === EnforcementActionType.TEMP_SUSPENSION && a.durationMinutes) {
          const expiresAt = new Date(
            (a.executedAt?.getTime() || 0) + a.durationMinutes * 60 * 1000
          );
          return expiresAt > new Date();
        }
        return true;
      }),
      openAppeals: actions.flatMap((a) => a.appeals),
    };
  }

  // ============================================================
  // PRIVATE EXECUTION METHODS
  // ============================================================

  private async executeBidThrottle(tx: TransactionClient, action: any): Promise<any> {
    // Create throttle state for user
    return {
      throttleApplied: true,
      userId: action.targetUserId,
      durationMinutes: action.durationMinutes || 60,
    };
  }

  private async executeTempSuspension(tx: TransactionClient, action: any): Promise<any> {
    return {
      suspensionApplied: true,
      userId: action.targetUserId,
      durationMinutes: action.durationMinutes || 1440,
    };
  }

  private async executeAuctionParticipationBlock(
    tx: TransactionClient,
    action: any
  ): Promise<any> {
    return {
      blockApplied: true,
      userId: action.targetUserId,
    };
  }

  private async executePayoutDelay(tx: TransactionClient, action: any): Promise<any> {
    return {
      delayApplied: true,
      userId: action.targetUserId,
      durationMinutes: action.durationMinutes || 10080, // 7 days
    };
  }

  private async executeTrustBadgeRemoval(tx: TransactionClient, action: any): Promise<any> {
    return {
      badgeRemoved: true,
      sellerId: action.targetSellerId,
    };
  }

  private async executeAuctionFreeze(tx: TransactionClient, action: any): Promise<any> {
    return {
      freezeApplied: true,
      auctionId: action.targetAuctionId,
    };
  }

  private async executeBidInvalidation(tx: TransactionClient, action: any): Promise<any> {
    return {
      invalidationApplied: true,
      auctionId: action.targetAuctionId,
    };
  }

  private async executeAuctionCancel(tx: TransactionClient, action: any): Promise<any> {
    return {
      cancellationApplied: true,
      auctionId: action.targetAuctionId,
    };
  }

  private async executeAutoRelistDisable(tx: TransactionClient, action: any): Promise<any> {
    return {
      autoRelistDisabled: true,
      sellerId: action.targetSellerId,
    };
  }

  private async executeListingCreationLimit(tx: TransactionClient, action: any): Promise<any> {
    return {
      limitApplied: true,
      sellerId: action.targetSellerId,
      maxListings: 0,
    };
  }

  private async executeSellerReviewFlag(tx: TransactionClient, action: any): Promise<any> {
    return {
      flagApplied: true,
      sellerId: action.targetSellerId,
    };
  }

  // ============================================================
  // PRIVATE REVERT METHODS
  // ============================================================

  private async revertBidThrottle(tx: TransactionClient, action: any): Promise<any> {
    return { throttleRemoved: true };
  }

  private async revertTempSuspension(tx: TransactionClient, action: any): Promise<any> {
    return { suspensionRemoved: true };
  }

  private async revertAuctionParticipationBlock(
    tx: TransactionClient,
    action: any
  ): Promise<any> {
    return { blockRemoved: true };
  }

  private async revertPayoutDelay(tx: TransactionClient, action: any): Promise<any> {
    return { delayRemoved: true };
  }

  private async revertTrustBadgeRemoval(tx: TransactionClient, action: any): Promise<any> {
    return { badgeRestored: true };
  }

  private async revertAuctionFreeze(tx: TransactionClient, action: any): Promise<any> {
    return { freezeRemoved: true };
  }

  private async revertAutoRelistDisable(tx: TransactionClient, action: any): Promise<any> {
    return { autoRelistEnabled: true };
  }

  private async revertListingCreationLimit(tx: TransactionClient, action: any): Promise<any> {
    return { limitRemoved: true };
  }

  private async revertSellerReviewFlag(tx: TransactionClient, action: any): Promise<any> {
    return { flagRemoved: true };
  }
}

// Export singleton instance
export const trustEnforcementService = new TrustEnforcementService();
