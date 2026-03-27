// ============================================================
// PHASE 6.2 — Trust Rule Evaluator
//
// Evaluates user behavior against hard rules
// Determines if trust actions should be triggered
// ============================================================

import { PrismaClient } from '@prisma/client';
import { TrustActionType, TrustSeverity } from './trust-action.service';

const prisma = new PrismaClient();

export interface TrustRuleEvaluation {
  shouldTriggerAction: boolean;
  actionType?: TrustActionType;
  severity?: TrustSeverity;
  reason?: string;
  durationMinutes?: number;
}

export interface UserTrustMetrics {
  userId: number;
  disputeLossCount: number;
  disputeLossRatio: number;
  invalidatedBidsCount: number;
  chargebackCount: number;
  paymentReversalCount: number;
  auctionViolationCount: number;
  manualFlagCount: number;
}

// ============================================================
// TRUST RULE EVALUATOR
// ============================================================

export class TrustRuleEvaluator {
  // ============================================================
  // EVALUATE USER TRUST
  // Check if user should have trust actions triggered
  // ============================================================
  async evaluateUserTrust(userId: number): Promise<TrustRuleEvaluation> {
    // Get user metrics
    const metrics = await this.getUserTrustMetrics(userId);

    // Evaluate rules
    return this.evaluateRules(metrics);
  }

  // ============================================================
  // GET USER TRUST METRICS
  // Aggregate all trust-related metrics
  // ============================================================
  private async getUserTrustMetrics(userId: number): Promise<UserTrustMetrics> {
    // Get dispute loss count (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const disputes = await prisma.auctionDispute.findMany({
      where: {
        bid: {
          bidder: { id: userId },
        },
        status: 'RESOLVED',
        resolution: 'INVALIDATE',
        resolvedAt: { gte: thirtyDaysAgo },
      },
    });

    // Get total disputes for ratio
    const totalDisputes = await prisma.auctionDispute.findMany({
      where: {
        bid: {
          bidder: { id: userId },
        },
        status: 'RESOLVED',
      },
    });

    // Get invalidated bids count
    const invalidatedBids = await prisma.bidInvalidationLog.findMany({
      where: {
        bid: {
          bidder: { id: userId },
        },
      },
    });

    // Get manual flags count
    const manualFlags = await prisma.enforcementAction.findMany({
      where: {
        targetUserId: userId,
        status: 'EXECUTED',
      },
    });

    const disputeLossRatio =
      totalDisputes.length > 0 ? disputes.length / totalDisputes.length : 0;

    return {
      userId,
      disputeLossCount: disputes.length,
      disputeLossRatio,
      invalidatedBidsCount: invalidatedBids.length,
      chargebackCount: 0, // Would come from payment service
      paymentReversalCount: 0, // Would come from payment service
      auctionViolationCount: invalidatedBids.length,
      manualFlagCount: manualFlags.length,
    };
  }

  // ============================================================
  // EVALUATE RULES
  // Apply hard rules to metrics
  // ============================================================
  private evaluateRules(metrics: UserTrustMetrics): TrustRuleEvaluation {
    // Rule 1: 3+ disputes lost in 30 days → FREEZE_PAYOUTS
    if (metrics.disputeLossCount >= 3) {
      return {
        shouldTriggerAction: true,
        actionType: TrustActionType.BLOCK_PAYOUTS,
        severity: TrustSeverity.HIGH,
        reason: `${metrics.disputeLossCount} disputes lost in 30 days`,
        durationMinutes: 7 * 24 * 60, // 7 days
      };
    }

    // Rule 2: Dispute loss ratio > 50% → FREEZE_WALLET
    if (metrics.disputeLossRatio > 0.5 && metrics.invalidatedBidsCount > 2) {
      return {
        shouldTriggerAction: true,
        actionType: TrustActionType.FREEZE_WALLET,
        severity: TrustSeverity.CRITICAL,
        reason: `High dispute loss ratio (${(metrics.disputeLossRatio * 100).toFixed(1)}%) with multiple invalidated bids`,
        durationMinutes: 14 * 24 * 60, // 14 days
      };
    }

    // Rule 3: 2+ invalidated bids → AUCTION_BID_BLOCK
    if (metrics.invalidatedBidsCount >= 2) {
      return {
        shouldTriggerAction: true,
        actionType: TrustActionType.AUCTION_BID_BLOCK,
        severity: TrustSeverity.MEDIUM,
        reason: `${metrics.invalidatedBidsCount} bids invalidated`,
        durationMinutes: 3 * 24 * 60, // 3 days
      };
    }

    // Rule 4: Chargeback confirmed → FREEZE_WALLET
    if (metrics.chargebackCount > 0) {
      return {
        shouldTriggerAction: true,
        actionType: TrustActionType.FREEZE_WALLET,
        severity: TrustSeverity.CRITICAL,
        reason: `Chargeback confirmed (${metrics.chargebackCount})`,
        durationMinutes: 30 * 24 * 60, // 30 days
      };
    }

    // Rule 5: Payment reversal → FREEZE_ESCROW_RELEASE
    if (metrics.paymentReversalCount > 0) {
      return {
        shouldTriggerAction: true,
        actionType: TrustActionType.FREEZE_ESCROW_RELEASE,
        severity: TrustSeverity.HIGH,
        reason: `Payment reversal detected (${metrics.paymentReversalCount})`,
        durationMinutes: 14 * 24 * 60, // 14 days
      };
    }

    // Rule 6: Multiple manual flags → ACCOUNT_RESTRICTED
    if (metrics.manualFlagCount >= 2) {
      return {
        shouldTriggerAction: true,
        actionType: TrustActionType.ACCOUNT_RESTRICTED,
        severity: TrustSeverity.MEDIUM,
        reason: `Multiple manual enforcement flags (${metrics.manualFlagCount})`,
        durationMinutes: 7 * 24 * 60, // 7 days
      };
    }

    // No rule triggered
    return {
      shouldTriggerAction: false,
    };
  }

  // ============================================================
  // EVALUATE WALLET TRUST
  // Check if wallet should have trust actions
  // ============================================================
  async evaluateWalletTrust(walletId: number): Promise<TrustRuleEvaluation> {
    // Get wallet owner
    const wallet = await prisma.user.findFirst({
      where: {
        // Assuming wallet is linked to user
        // This would depend on your wallet schema
      },
    });

    if (!wallet) {
      return { shouldTriggerAction: false };
    }

    return this.evaluateUserTrust(wallet.id);
  }

  // ============================================================
  // EVALUATE AUCTION TRUST
  // Check if auction should have trust actions
  // ============================================================
  async evaluateAuctionTrust(auctionId: number): Promise<TrustRuleEvaluation> {
    // Get auction
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return { shouldTriggerAction: false };
    }

    // Check if auction has multiple disputes
    const disputes = await prisma.auctionDispute.findMany({
      where: {
        auctionId,
        status: 'RESOLVED',
      },
    });

    if (disputes.length >= 2) {
      return {
        shouldTriggerAction: true,
        actionType: TrustActionType.AUCTION_BID_BLOCK,
        severity: TrustSeverity.MEDIUM,
        reason: `Auction has ${disputes.length} resolved disputes`,
        durationMinutes: 24 * 60, // 1 day
      };
    }

    return { shouldTriggerAction: false };
  }

  // ============================================================
  // EVALUATE MANUAL FLAG
  // Admin manually flags user for trust action
  // ============================================================
  async evaluateManualFlag(
    userId: number,
    reason: string,
    severity: TrustSeverity
  ): Promise<TrustRuleEvaluation> {
    // Determine action type based on severity
    let actionType: TrustActionType;
    let durationMinutes: number;

    switch (severity) {
      case TrustSeverity.CRITICAL:
        actionType = TrustActionType.FREEZE_WALLET;
        durationMinutes = 30 * 24 * 60; // 30 days
        break;
      case TrustSeverity.HIGH:
        actionType = TrustActionType.BLOCK_PAYOUTS;
        durationMinutes = 14 * 24 * 60; // 14 days
        break;
      case TrustSeverity.MEDIUM:
        actionType = TrustActionType.ACCOUNT_RESTRICTED;
        durationMinutes = 7 * 24 * 60; // 7 days
        break;
      case TrustSeverity.LOW:
        actionType = TrustActionType.AUCTION_BID_BLOCK;
        durationMinutes = 3 * 24 * 60; // 3 days
        break;
    }

    return {
      shouldTriggerAction: true,
      actionType,
      severity,
      reason: `Manual flag: ${reason}`,
      durationMinutes,
    };
  }
}

// Export singleton instance
export const trustRuleEvaluator = new TrustRuleEvaluator();
