// ============================================================
// PHASE 6.4 — Trust Score Calculator Service
//
// CRITICAL RULES:
// ❌ Trust Score can NEVER move money
// ❌ Trust Score can NEVER freeze/unfreeze by itself
// ❌ Trust Score is NOT used for auto-enforcement
// ❌ No ML black-box scoring
// ❌ No real-time mutation during transactions
//
// ✅ Trust Score is READ-ONLY input to policies
// ✅ Enforcement still requires TrustAction
// ✅ Deterministic math only
// ✅ Same inputs = same score
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum TrustScoreLevel {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  WATCH = 'WATCH',
  RESTRICTED = 'RESTRICTED',
}

export interface ScoreBreakdown {
  completedTransactions: number;
  successfulDeliveries: number;
  disputesOpened: number;
  disputesLost: number;
  trustActionsApplied: number;
  appealsApproved: number;
  totalScore: number;
}

// ============================================================
// TRUST SCORE CALCULATOR SERVICE
// ============================================================

export class TrustScoreCalculatorService {
  // ============================================================
  // SCORE THRESHOLDS (STATIC, IMMUTABLE)
  // ============================================================
  private readonly THRESHOLDS = {
    EXCELLENT: { min: 80, max: 100 },
    GOOD: { min: 60, max: 79 },
    WATCH: { min: 40, max: 59 },
    RESTRICTED: { min: 0, max: 39 },
  };

  // ============================================================
  // SCORING WEIGHTS (DETERMINISTIC, EXPLAINABLE)
  // ============================================================
  private readonly WEIGHTS = {
    // Positive factors
    completedTransaction: 2, // +2 per completed transaction
    successfulDelivery: 3, // +3 per successful delivery
    appealApproved: 5, // +5 per approved appeal (partial recovery)

    // Negative factors
    disputeOpened: -3, // -3 per dispute opened
    disputeLost: -8, // -8 per dispute lost
    trustActionApplied: -15, // -15 per trust action applied (heavy negative)
  };

  // ============================================================
  // CALCULATE TRUST SCORE
  // Deterministic calculation based on user behavior
  // ============================================================
  async calculateScore(userId: number): Promise<{ score: number; level: TrustScoreLevel; breakdown: ScoreBreakdown }> {
    // 1. Get user behavior metrics
    const breakdown = await this.getScoreBreakdown(userId);

    // 2. Calculate total score (deterministic math)
    const totalScore = this.calculateTotalScore(breakdown);

    // 3. Clamp score to 0-100 range
    const clampedScore = Math.max(0, Math.min(100, totalScore));

    // 4. Determine level based on thresholds
    const level = this.getScoreLevelFromScore(clampedScore);

    console.log(`[TRUST_SCORE_CALCULATED] User ${userId}:`, {
      score: clampedScore,
      level,
      breakdown,
    });

    return {
      score: clampedScore,
      level,
      breakdown: { ...breakdown, totalScore: clampedScore },
    };
  }

  // ============================================================
  // GET SCORE BREAKDOWN
  // Returns detailed breakdown of score components
  // ============================================================
  async getScoreBreakdown(userId: number): Promise<ScoreBreakdown> {
    // 1. Count completed transactions (bids that resulted in wins)
    const completedTransactions = await prisma.bid.count({
      where: {
        bidderId: userId,
        status: 'WON',
      },
    });

    // 2. Count successful deliveries (settled auctions)
    const successfulDeliveries = await prisma.bid.count({
      where: {
        bidderId: userId,
        status: 'SETTLED',
      },
    });

    // 3. Count disputes opened against user
    const disputesOpened = await prisma.auctionDispute.count({
      where: {
        bid: {
          bidderId: userId,
        },
        status: 'OPEN',
      },
    });

    // 4. Count disputes lost (resolved against user)
    const disputesLost = await prisma.auctionDispute.count({
      where: {
        bid: {
          bidderId: userId,
        },
        status: 'RESOLVED',
        resolution: 'INVALIDATE',
      },
    });

    // 5. Count trust actions applied to user
    const trustActionsApplied = await prisma.trustAction.count({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    // 6. Count appeals approved for user
    const appealsApproved = await prisma.appeal.count({
      where: {
        trustAction: {
          userId,
        },
        status: 'APPROVED',
      },
    });

    return {
      completedTransactions,
      successfulDeliveries,
      disputesOpened,
      disputesLost,
      trustActionsApplied,
      appealsApproved,
      totalScore: 0, // Will be calculated separately
    };
  }

  // ============================================================
  // CALCULATE TOTAL SCORE
  // Deterministic math: same inputs = same score
  // ============================================================
  private calculateTotalScore(breakdown: ScoreBreakdown): number {
    let score = 50; // Start with neutral baseline

    // Apply positive factors
    score += breakdown.completedTransactions * this.WEIGHTS.completedTransaction;
    score += breakdown.successfulDeliveries * this.WEIGHTS.successfulDelivery;
    score += breakdown.appealsApproved * this.WEIGHTS.appealApproved;

    // Apply negative factors
    score += breakdown.disputesOpened * this.WEIGHTS.disputeOpened;
    score += breakdown.disputesLost * this.WEIGHTS.disputeLost;
    score += breakdown.trustActionsApplied * this.WEIGHTS.trustActionApplied;

    return score;
  }

  // ============================================================
  // GET SCORE LEVEL FROM SCORE
  // Deterministic level assignment
  // ============================================================
  private getScoreLevelFromScore(score: number): TrustScoreLevel {
    if (score >= this.THRESHOLDS.EXCELLENT.min) {
      return TrustScoreLevel.EXCELLENT;
    } else if (score >= this.THRESHOLDS.GOOD.min) {
      return TrustScoreLevel.GOOD;
    } else if (score >= this.THRESHOLDS.WATCH.min) {
      return TrustScoreLevel.WATCH;
    } else {
      return TrustScoreLevel.RESTRICTED;
    }
  }

  // ============================================================
  // GET SCORE EXPLANATION
  // Returns human-readable explanation of score
  // ============================================================
  getScoreExplanation(breakdown: ScoreBreakdown, score: number): string {
    const parts: string[] = [];

    if (breakdown.completedTransactions > 0) {
      parts.push(`${breakdown.completedTransactions} completed transactions (+${breakdown.completedTransactions * this.WEIGHTS.completedTransaction})`);
    }

    if (breakdown.successfulDeliveries > 0) {
      parts.push(`${breakdown.successfulDeliveries} successful deliveries (+${breakdown.successfulDeliveries * this.WEIGHTS.successfulDelivery})`);
    }

    if (breakdown.disputesOpened > 0) {
      parts.push(`${breakdown.disputesOpened} disputes opened (${breakdown.disputesOpened * this.WEIGHTS.disputeOpened})`);
    }

    if (breakdown.disputesLost > 0) {
      parts.push(`${breakdown.disputesLost} disputes lost (${breakdown.disputesLost * this.WEIGHTS.disputeLost})`);
    }

    if (breakdown.trustActionsApplied > 0) {
      parts.push(`${breakdown.trustActionsApplied} enforcement actions (${breakdown.trustActionsApplied * this.WEIGHTS.trustActionApplied})`);
    }

    if (breakdown.appealsApproved > 0) {
      parts.push(`${breakdown.appealsApproved} appeals approved (+${breakdown.appealsApproved * this.WEIGHTS.appealApproved})`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No activity recorded';
  }

  // ============================================================
  // GET SCORE LEVEL DESCRIPTION
  // Returns description of score level
  // ============================================================
  getScoreLevelDescription(level: TrustScoreLevel): string {
    const descriptions: Record<TrustScoreLevel, string> = {
      [TrustScoreLevel.EXCELLENT]: 'Excellent trust score. User has strong transaction history with minimal disputes.',
      [TrustScoreLevel.GOOD]: 'Good trust score. User has solid transaction history with few issues.',
      [TrustScoreLevel.WATCH]: 'Watch status. User has some disputes or enforcement actions. Monitor closely.',
      [TrustScoreLevel.RESTRICTED]: 'Restricted status. User has significant issues. Manual review recommended.',
    };

    return descriptions[level];
  }

  // ============================================================
  // VERIFY SCORE DETERMINISM
  // Verify that same inputs produce same score
  // ============================================================
  async verifyDeterminism(userId: number, expectedScore: number): Promise<boolean> {
    const { score } = await this.calculateScore(userId);
    return score === expectedScore;
  }
}

// Export singleton instance
export const trustScoreCalculatorService = new TrustScoreCalculatorService();
