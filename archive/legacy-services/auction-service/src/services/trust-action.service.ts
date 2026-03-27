// ============================================================
// PHASE 6.2 — Trust Action Service (Hard Controls)
//
// CRITICAL RULES:
// ❌ DO NOT:
// - Modify balances directly
// - Delete historical data
// - Auto-execute without audit log
// - Trust frontend inputs
// - Bypass wallet/escrow/auction checks
//
// ✅ MUST:
// - Backend-only execution
// - Every action logged immutably
// - Every action reversible
// - Integrate with existing services
// - Check enforcement before any operation
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum TrustActionType {
  FREEZE_WALLET = 'FREEZE_WALLET',
  FREEZE_ESCROW_RELEASE = 'FREEZE_ESCROW_RELEASE',
  BLOCK_PAYOUTS = 'BLOCK_PAYOUTS',
  AUCTION_BID_BLOCK = 'AUCTION_BID_BLOCK',
  ACCOUNT_RESTRICTED = 'ACCOUNT_RESTRICTED',
}

export enum TrustSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TrustActionStatus {
  ACTIVE = 'ACTIVE',
  LIFTED = 'LIFTED',
  EXPIRED = 'EXPIRED',
  REVERTED = 'REVERTED',
}

export interface TrustActionRequest {
  userId: number;
  walletId?: number;
  auctionId?: number;
  actionType: TrustActionType;
  severity: TrustSeverity;
  reason: string;
  durationMinutes?: number;
  metadata?: Record<string, any>;
}

export interface TrustActionCheckRequest {
  userId?: number;
  walletId?: number;
  auctionId?: number;
  actionType?: TrustActionType;
}

// ============================================================
// TRUST ACTION SERVICE
// ============================================================

export class TrustActionService {
  // ============================================================
  // EXECUTE TRUST ACTION
  // Backend-only, fully logged, reversible
  // ============================================================
  async executeTrustAction(params: TrustActionRequest): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Check if action already active
      const existingAction = await tx.trustAction.findFirst({
        where: {
          userId: params.userId,
          walletId: params.walletId,
          auctionId: params.auctionId,
          actionType: params.actionType,
          status: TrustActionStatus.ACTIVE,
        },
      });

      if (existingAction) {
        throw new Error(`Action ${params.actionType} already active for this target`);
      }

      // 2. Create trust action (APPEND-ONLY)
      const expiresAt = params.durationMinutes
        ? new Date(Date.now() + params.durationMinutes * 60 * 1000)
        : null;

      const action = await tx.trustAction.create({
        data: {
          userId: params.userId,
          walletId: params.walletId,
          auctionId: params.auctionId,
          actionType: params.actionType,
          severity: params.severity,
          status: TrustActionStatus.ACTIVE,
          reason: params.reason,
          durationMinutes: params.durationMinutes,
          expiresAt,
          metadata: params.metadata || {},
          activatedAt: new Date(),
        },
      });

      // 3. Create audit log (APPEND-ONLY)
      await tx.trustActionLog.create({
        data: {
          actionId: action.id,
          action: 'ACTIVATED',
          metadata: {
            actionType: params.actionType,
            severity: params.severity,
            reason: params.reason,
            userId: params.userId,
            walletId: params.walletId,
            auctionId: params.auctionId,
          },
        },
      });

      console.log(`[TRUST_ACTION_EXECUTED] ${params.actionType}:`, {
        userId: params.userId,
        walletId: params.walletId,
        auctionId: params.auctionId,
        severity: params.severity,
        expiresAt: expiresAt?.toISOString(),
      });

      return action;
    });
  }

  // ============================================================
  // CHECK IF ACTION IS ACTIVE
  // Used by other services before operations
  // ============================================================
  async isActionActive(params: TrustActionCheckRequest): Promise<boolean> {
    const action = await prisma.trustAction.findFirst({
      where: {
        userId: params.userId,
        walletId: params.walletId,
        auctionId: params.auctionId,
        actionType: params.actionType,
        status: TrustActionStatus.ACTIVE,
      },
    });

    if (!action) {
      return false;
    }

    // Check if expired
    if (action.expiresAt && action.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  // ============================================================
  // GET ACTIVE ACTIONS FOR USER
  // ============================================================
  async getActiveActionsForUser(userId: number): Promise<any[]> {
    const actions = await prisma.trustAction.findMany({
      where: {
        userId,
        status: TrustActionStatus.ACTIVE,
      },
      orderBy: { activatedAt: 'desc' },
    });

    // Filter out expired actions
    return actions.filter((action) => {
      if (action.expiresAt && action.expiresAt < new Date()) {
        return false;
      }
      return true;
    });
  }

  // ============================================================
  // GET ACTIVE ACTIONS FOR WALLET
  // ============================================================
  async getActiveActionsForWallet(walletId: number): Promise<any[]> {
    const actions = await prisma.trustAction.findMany({
      where: {
        walletId,
        status: TrustActionStatus.ACTIVE,
      },
      orderBy: { activatedAt: 'desc' },
    });

    return actions.filter((action) => {
      if (action.expiresAt && action.expiresAt < new Date()) {
        return false;
      }
      return true;
    });
  }

  // ============================================================
  // GET ACTIVE ACTIONS FOR AUCTION
  // ============================================================
  async getActiveActionsForAuction(auctionId: number): Promise<any[]> {
    const actions = await prisma.trustAction.findMany({
      where: {
        auctionId,
        status: TrustActionStatus.ACTIVE,
      },
      orderBy: { activatedAt: 'desc' },
    });

    return actions.filter((action) => {
      if (action.expiresAt && action.expiresAt < new Date()) {
        return false;
      }
      return true;
    });
  }

  // ============================================================
  // LIFT TRUST ACTION
  // Manually lift action with justification
  // ============================================================
  async liftTrustAction(
    actionId: number,
    liftedBy: string,
    reason: string
  ): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const action = await tx.trustAction.findUnique({
        where: { id: actionId },
      });

      if (!action) {
        throw new Error('Trust action not found');
      }

      if (action.status !== TrustActionStatus.ACTIVE) {
        throw new Error(`Cannot lift action in status: ${action.status}`);
      }

      // Update status to LIFTED
      const lifted = await tx.trustAction.update({
        where: { id: actionId },
        data: {
          status: TrustActionStatus.LIFTED,
          liftedAt: new Date(),
          liftedBy,
        },
      });

      // Create audit log
      await tx.trustActionLog.create({
        data: {
          actionId,
          action: 'LIFTED',
          metadata: {
            liftedBy,
            reason,
            actionType: action.actionType,
          },
        },
      });

      console.log(`[TRUST_ACTION_LIFTED] Action ${actionId}:`, {
        reason,
        liftedBy,
      });

      return lifted;
    });
  }

  // ============================================================
  // REVERT TRUST ACTION
  // Revert action (same as lift but different semantics)
  // ============================================================
  async revertTrustAction(
    actionId: number,
    revertedBy: string,
    reason: string
  ): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const action = await tx.trustAction.findUnique({
        where: { id: actionId },
      });

      if (!action) {
        throw new Error('Trust action not found');
      }

      if (action.status !== TrustActionStatus.ACTIVE) {
        throw new Error(`Cannot revert action in status: ${action.status}`);
      }

      // Update status to REVERTED
      const reverted = await tx.trustAction.update({
        where: { id: actionId },
        data: {
          status: TrustActionStatus.REVERTED,
          revertedAt: new Date(),
          revertedBy,
        },
      });

      // Create audit log
      await tx.trustActionLog.create({
        data: {
          actionId,
          action: 'REVERTED',
          metadata: {
            revertedBy,
            reason,
            actionType: action.actionType,
          },
        },
      });

      console.log(`[TRUST_ACTION_REVERTED] Action ${actionId}:`, {
        reason,
        revertedBy,
      });

      return reverted;
    });
  }

  // ============================================================
  // AUTO-EXPIRE ACTIONS
  // Called periodically to expire old actions
  // ============================================================
  async autoExpireActions(): Promise<number> {
    const now = new Date();

    const expiredActions = await prisma.trustAction.findMany({
      where: {
        status: TrustActionStatus.ACTIVE,
        expiresAt: { lte: now },
      },
    });

    let expiredCount = 0;

    for (const action of expiredActions) {
      await prisma.trustAction.update({
        where: { id: action.id },
        data: {
          status: TrustActionStatus.EXPIRED,
          expiredAt: new Date(),
        },
      });

      await prisma.trustActionLog.create({
        data: {
          actionId: action.id,
          action: 'EXPIRED',
          metadata: {
            actionType: action.actionType,
            expiresAt: action.expiresAt?.toISOString(),
          },
        },
      });

      expiredCount++;
    }

    if (expiredCount > 0) {
      console.log(`[TRUST_ACTION_AUTO_EXPIRE] Expired ${expiredCount} actions`);
    }

    return expiredCount;
  }

  // ============================================================
  // GET ACTION DETAILS
  // ============================================================
  async getActionDetails(actionId: number): Promise<any> {
    return await prisma.trustAction.findUnique({
      where: { id: actionId },
      include: {
        logs: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  // ============================================================
  // GET ACTION HISTORY
  // ============================================================
  async getActionHistory(
    userId?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<any> {
    const where: any = {};
    if (userId) where.userId = userId;

    const [actions, total] = await Promise.all([
      prisma.trustAction.findMany({
        where,
        orderBy: { activatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          logs: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
      }),
      prisma.trustAction.count({ where }),
    ]);

    return {
      actions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + actions.length < total,
      },
    };
  }
}

// Export singleton instance
export const trustActionService = new TrustActionService();
