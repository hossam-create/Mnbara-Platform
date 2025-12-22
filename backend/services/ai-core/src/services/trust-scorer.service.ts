/**
 * Trust Scorer Service
 * Consumes trust data and computes deterministic trust scores
 * Read-only - does not modify any trust data
 */

import {
  TrustScore,
  TrustLevel,
  TrustFactor,
} from '../types/ai-core.types';

// Trust factor weights (must sum to 1.0)
const TRUST_FACTOR_WEIGHTS: Record<string, number> = {
  verification_status: 0.25,
  transaction_history: 0.20,
  account_age: 0.15,
  rating_score: 0.15,
  dispute_ratio: 0.10,
  response_rate: 0.10,
  kyc_level: 0.05,
};

// Trust level thresholds
const TRUST_THRESHOLDS: Record<TrustLevel, number> = {
  [TrustLevel.VERIFIED]: 80,
  [TrustLevel.TRUSTED]: 60,
  [TrustLevel.STANDARD]: 40,
  [TrustLevel.NEW]: 20,
  [TrustLevel.RESTRICTED]: 0,
};

export interface TrustInput {
  userId: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  is2FAEnabled: boolean;
  totalTransactions: number;
  successfulTransactions: number;
  accountCreatedAt: Date;
  averageRating: number;
  totalRatings: number;
  disputesRaised: number;
  disputesLost: number;
  responseRate: number;
  kycLevel: 'none' | 'basic' | 'enhanced' | 'full';
}

export class TrustScorerService {
  /**
   * Compute trust score from input factors
   * Deterministic calculation - same inputs always produce same outputs
   */
  computeTrustScore(input: TrustInput): TrustScore {
    const factors: TrustFactor[] = [];

    // Verification status (0-100)
    const verificationScore = this.computeVerificationScore(input);
    factors.push({
      name: 'verification_status',
      weight: TRUST_FACTOR_WEIGHTS.verification_status,
      value: verificationScore,
      contribution: verificationScore * TRUST_FACTOR_WEIGHTS.verification_status,
    });

    // Transaction history (0-100)
    const transactionScore = this.computeTransactionScore(input);
    factors.push({
      name: 'transaction_history',
      weight: TRUST_FACTOR_WEIGHTS.transaction_history,
      value: transactionScore,
      contribution: transactionScore * TRUST_FACTOR_WEIGHTS.transaction_history,
    });

    // Account age (0-100)
    const ageScore = this.computeAccountAgeScore(input);
    factors.push({
      name: 'account_age',
      weight: TRUST_FACTOR_WEIGHTS.account_age,
      value: ageScore,
      contribution: ageScore * TRUST_FACTOR_WEIGHTS.account_age,
    });

    // Rating score (0-100)
    const ratingScore = this.computeRatingScore(input);
    factors.push({
      name: 'rating_score',
      weight: TRUST_FACTOR_WEIGHTS.rating_score,
      value: ratingScore,
      contribution: ratingScore * TRUST_FACTOR_WEIGHTS.rating_score,
    });

    // Dispute ratio (0-100, inverted - lower disputes = higher score)
    const disputeScore = this.computeDisputeScore(input);
    factors.push({
      name: 'dispute_ratio',
      weight: TRUST_FACTOR_WEIGHTS.dispute_ratio,
      value: disputeScore,
      contribution: disputeScore * TRUST_FACTOR_WEIGHTS.dispute_ratio,
    });

    // Response rate (0-100)
    const responseScore = this.computeResponseScore(input);
    factors.push({
      name: 'response_rate',
      weight: TRUST_FACTOR_WEIGHTS.response_rate,
      value: responseScore,
      contribution: responseScore * TRUST_FACTOR_WEIGHTS.response_rate,
    });

    // KYC level (0-100)
    const kycScore = this.computeKycScore(input);
    factors.push({
      name: 'kyc_level',
      weight: TRUST_FACTOR_WEIGHTS.kyc_level,
      value: kycScore,
      contribution: kycScore * TRUST_FACTOR_WEIGHTS.kyc_level,
    });

    // Calculate total score
    const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);
    const normalizedScore = Math.round(Math.min(100, Math.max(0, totalScore)));

    return {
      userId: input.userId,
      score: normalizedScore,
      level: this.getTrustLevel(normalizedScore),
      factors,
      computedAt: new Date().toISOString(),
    };
  }

  private computeVerificationScore(input: TrustInput): number {
    let score = 0;
    if (input.isEmailVerified) score += 30;
    if (input.isPhoneVerified) score += 40;
    if (input.is2FAEnabled) score += 30;
    return score;
  }

  private computeTransactionScore(input: TrustInput): number {
    if (input.totalTransactions === 0) return 0;

    const successRate = input.successfulTransactions / input.totalTransactions;
    const volumeBonus = Math.min(30, input.totalTransactions * 0.5);

    return Math.round(successRate * 70 + volumeBonus);
  }

  private computeAccountAgeScore(input: TrustInput): number {
    const now = new Date();
    const ageInDays = Math.floor(
      (now.getTime() - input.accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Score increases with age, caps at 365 days
    if (ageInDays < 7) return 10;
    if (ageInDays < 30) return 30;
    if (ageInDays < 90) return 50;
    if (ageInDays < 180) return 70;
    if (ageInDays < 365) return 85;
    return 100;
  }

  private computeRatingScore(input: TrustInput): number {
    if (input.totalRatings === 0) return 50; // Neutral for new users

    // Rating is 1-5, normalize to 0-100
    const normalizedRating = ((input.averageRating - 1) / 4) * 100;

    // Apply confidence factor based on number of ratings
    const confidenceFactor = Math.min(1, input.totalRatings / 10);

    return Math.round(normalizedRating * confidenceFactor + 50 * (1 - confidenceFactor));
  }

  private computeDisputeScore(input: TrustInput): number {
    if (input.totalTransactions === 0) return 100;

    const disputeRatio = input.disputesRaised / input.totalTransactions;
    const lostRatio = input.disputesLost / Math.max(1, input.disputesRaised);

    // Lower disputes = higher score
    const baseScore = 100 - disputeRatio * 200;
    const lostPenalty = lostRatio * 30;

    return Math.round(Math.max(0, Math.min(100, baseScore - lostPenalty)));
  }

  private computeResponseScore(input: TrustInput): number {
    // Response rate is 0-1, convert to 0-100
    return Math.round(input.responseRate * 100);
  }

  private computeKycScore(input: TrustInput): number {
    const kycScores: Record<string, number> = {
      none: 0,
      basic: 40,
      enhanced: 70,
      full: 100,
    };
    return kycScores[input.kycLevel] ?? 0;
  }

  private getTrustLevel(score: number): TrustLevel {
    if (score >= TRUST_THRESHOLDS[TrustLevel.VERIFIED]) return TrustLevel.VERIFIED;
    if (score >= TRUST_THRESHOLDS[TrustLevel.TRUSTED]) return TrustLevel.TRUSTED;
    if (score >= TRUST_THRESHOLDS[TrustLevel.STANDARD]) return TrustLevel.STANDARD;
    if (score >= TRUST_THRESHOLDS[TrustLevel.NEW]) return TrustLevel.NEW;
    return TrustLevel.RESTRICTED;
  }

  /**
   * Compare two trust scores for matching purposes
   */
  compareTrustScores(score1: TrustScore, score2: TrustScore): {
    compatible: boolean;
    riskDelta: number;
    recommendation: string;
  } {
    const scoreDiff = Math.abs(score1.score - score2.score);
    const minScore = Math.min(score1.score, score2.score);

    // High risk if one party has very low trust
    if (minScore < 20) {
      return {
        compatible: false,
        riskDelta: scoreDiff,
        recommendation: 'One party has restricted trust level. Manual review required.',
      };
    }

    // Moderate risk if large trust gap
    if (scoreDiff > 40) {
      return {
        compatible: true,
        riskDelta: scoreDiff,
        recommendation: 'Significant trust gap. Consider additional verification.',
      };
    }

    return {
      compatible: true,
      riskDelta: scoreDiff,
      recommendation: 'Trust levels are compatible for transaction.',
    };
  }
}

export const trustScorerService = new TrustScorerService();
