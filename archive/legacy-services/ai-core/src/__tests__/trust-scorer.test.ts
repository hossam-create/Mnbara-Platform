/**
 * Trust Scorer Service Tests
 * Verifies deterministic trust computation
 */

import { trustScorerService, TrustInput } from '../services/trust-scorer.service';
import { TrustLevel } from '../types/ai-core.types';

describe('TrustScorerService', () => {
  const baseInput: TrustInput = {
    userId: 'user-1',
    isEmailVerified: true,
    isPhoneVerified: true,
    is2FAEnabled: true,
    totalTransactions: 50,
    successfulTransactions: 48,
    accountCreatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    averageRating: 4.8,
    totalRatings: 30,
    disputesRaised: 1,
    disputesLost: 0,
    responseRate: 0.95,
    kycLevel: 'enhanced',
  };

  describe('computeTrustScore', () => {
    it('should compute high trust score for verified user', () => {
      const result = trustScorerService.computeTrustScore(baseInput);

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.level).toBe(TrustLevel.VERIFIED);
      expect(result.userId).toBe('user-1');
    });

    it('should compute lower score for new user', () => {
      const newUserInput: TrustInput = {
        ...baseInput,
        isPhoneVerified: false,
        is2FAEnabled: false,
        totalTransactions: 0,
        successfulTransactions: 0,
        accountCreatedAt: new Date(), // Just created
        totalRatings: 0,
        kycLevel: 'none',
      };

      const result = trustScorerService.computeTrustScore(newUserInput);

      expect(result.score).toBeLessThan(50);
      expect(result.level).toBe(TrustLevel.NEW);
    });

    it('should penalize users with disputes', () => {
      const disputeInput: TrustInput = {
        ...baseInput,
        disputesRaised: 10,
        disputesLost: 5,
      };

      const normalResult = trustScorerService.computeTrustScore(baseInput);
      const disputeResult = trustScorerService.computeTrustScore(disputeInput);

      expect(disputeResult.score).toBeLessThan(normalResult.score);
    });

    it('should include all trust factors', () => {
      const result = trustScorerService.computeTrustScore(baseInput);

      expect(result.factors).toHaveLength(7);
      expect(result.factors.map((f) => f.name)).toContain('verification_status');
      expect(result.factors.map((f) => f.name)).toContain('transaction_history');
      expect(result.factors.map((f) => f.name)).toContain('account_age');
      expect(result.factors.map((f) => f.name)).toContain('rating_score');
      expect(result.factors.map((f) => f.name)).toContain('dispute_ratio');
      expect(result.factors.map((f) => f.name)).toContain('response_rate');
      expect(result.factors.map((f) => f.name)).toContain('kyc_level');
    });

    it('should compute factor contributions correctly', () => {
      const result = trustScorerService.computeTrustScore(baseInput);

      for (const factor of result.factors) {
        expect(factor.contribution).toBe(factor.value * factor.weight);
      }
    });

    it('should be deterministic', () => {
      const result1 = trustScorerService.computeTrustScore(baseInput);
      const result2 = trustScorerService.computeTrustScore(baseInput);

      expect(result1.score).toBe(result2.score);
      expect(result1.level).toBe(result2.level);
      expect(result1.factors).toEqual(result2.factors);
    });

    it('should cap score at 100', () => {
      const perfectInput: TrustInput = {
        ...baseInput,
        totalTransactions: 1000,
        successfulTransactions: 1000,
        averageRating: 5.0,
        totalRatings: 500,
        disputesRaised: 0,
        disputesLost: 0,
        responseRate: 1.0,
        kycLevel: 'full',
      };

      const result = trustScorerService.computeTrustScore(perfectInput);

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should floor score at 0', () => {
      const terribleInput: TrustInput = {
        userId: 'user-bad',
        isEmailVerified: false,
        isPhoneVerified: false,
        is2FAEnabled: false,
        totalTransactions: 100,
        successfulTransactions: 10,
        accountCreatedAt: new Date(),
        averageRating: 1.0,
        totalRatings: 50,
        disputesRaised: 50,
        disputesLost: 40,
        responseRate: 0,
        kycLevel: 'none',
      };

      const result = trustScorerService.computeTrustScore(terribleInput);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('compareTrustScores', () => {
    it('should identify compatible trust scores', () => {
      const score1 = trustScorerService.computeTrustScore(baseInput);
      const score2 = trustScorerService.computeTrustScore({
        ...baseInput,
        userId: 'user-2',
      });

      const comparison = trustScorerService.compareTrustScores(score1, score2);

      expect(comparison.compatible).toBe(true);
      expect(comparison.riskDelta).toBe(0);
    });

    it('should flag incompatible trust scores', () => {
      const highTrust = trustScorerService.computeTrustScore(baseInput);
      const lowTrust = trustScorerService.computeTrustScore({
        ...baseInput,
        userId: 'user-low',
        isEmailVerified: false,
        isPhoneVerified: false,
        is2FAEnabled: false,
        totalTransactions: 0,
        kycLevel: 'none',
        accountCreatedAt: new Date(),
      });

      const comparison = trustScorerService.compareTrustScores(highTrust, lowTrust);

      expect(comparison.riskDelta).toBeGreaterThan(40);
    });
  });
});
