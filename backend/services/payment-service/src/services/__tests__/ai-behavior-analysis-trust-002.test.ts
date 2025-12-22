import { AIBehaviorAnalysisService } from '../ai-behavior-analysis.service';
import { BehaviorEvaluationRequest } from '../../types/behavior-analysis.types';

describe('AIBehaviorAnalysisService - AI-TRUST-002', () => {
  let service: AIBehaviorAnalysisService;

  beforeEach(() => {
    service = new AIBehaviorAnalysisService();
  });

  describe('evaluateSellerBehavior', () => {
    it('should successfully evaluate seller behavior with valid sellerId', async () => {
      const request: BehaviorEvaluationRequest = {
        sellerId: 123
      };

      const result = await service.evaluateSellerBehavior(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.sellerId).toBe(123);
      expect(result.data?.behaviorRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.data?.behaviorRiskScore).toBeLessThanOrEqual(1);
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.data?.behaviorRiskLevel);
      expect(Array.isArray(result.data?.detectedPatterns)).toBe(true);
      expect(result.evaluationTimeMs).toBeGreaterThan(0);
    });

    it('should handle evaluation errors gracefully', async () => {
      // Mock a failure scenario
      jest.spyOn(service as any, 'collectSellerMetrics').mockRejectedValue(new Error('Database connection failed'));

      const request: BehaviorEvaluationRequest = {
        sellerId: 123
      };

      const result = await service.evaluateSellerBehavior(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Database connection failed');
      expect(result.evaluationTimeMs).toBeGreaterThan(0);
    });

    it('should accept custom time windows configuration', async () => {
      const request: BehaviorEvaluationRequest = {
        sellerId: 123,
        timeWindows: {
          hours24: 48, // Custom 48-hour window
          days7: 14,   // Custom 14-day window
          days30: 60,  // Custom 60-day window
          days90: 180  // Custom 180-day window
        }
      };

      const result = await service.evaluateSellerBehavior(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should accept custom detection configuration', async () => {
      const request: BehaviorEvaluationRequest = {
        sellerId: 123,
        configOverrides: {
          volumeSpikeThreshold: 300, // 300% increase threshold
          disputeBurstThreshold: 5,  // 5 disputes per hour
          offerRejectionRateThreshold: 0.9 // 90% rejection rate
        }
      };

      const result = await service.evaluateSellerBehavior(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('pattern detection', () => {
    it('should detect volume spikes correctly', async () => {
      const metrics = {
        sellerId: 123,
        timestamp: new Date(),
        ordersCount: { hours24: 100, days7: 50, days30: 200, days90: 500 },
        orderVelocity: { hours24: 4.17, days7: 7.14, days30: 6.67, days90: 5.56 },
        claimsCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        claimRate: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        refundsCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        refundRate: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        escrowDisputesCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        disputeRate: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        trustScoreDeltas: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        trustScoreVolatility: 0,
        offersMadeCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        offersRejectedCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        offerRejectionRate: { hours24: 0, days7: 0, days30: 0, days90: 0 }
      };

      const patterns = await (service as any).detectPatterns(metrics, service['defaultConfig']);

      // Should detect volume spike in 24h window (100 orders vs historical avg ~250)
      const volumeSpikes = patterns.patterns.filter(p => p.patternType === 'VOLUME_SPIKE');
      expect(volumeSpikes.length).toBeGreaterThan(0);
    });

    it('should calculate risk score correctly based on detected patterns', async () => {
      const patterns = [
        {
          patternType: 'VOLUME_SPIKE',
          timeWindow: 'hours24',
          severity: 'HIGH',
          confidence: 0.8,
          riskContribution: 0.7,
          explanation: 'Test pattern',
          recommendations: ['Test recommendation'],
          detectedAt: new Date()
        }
      ];

      const riskScore = (service as any).calculateRiskScore(patterns);

      expect(riskScore.score).toBeGreaterThan(0);
      expect(riskScore.score).toBeLessThanOrEqual(1);
      expect(riskScore.level).toBe('HIGH');
    });

    it('should return LOW risk when no patterns are detected', async () => {
      const riskScore = (service as any).calculateRiskScore([]);

      expect(riskScore.score).toBe(0);
      expect(riskScore.level).toBe('LOW');
    });
  });

  describe('helper methods', () => {
    it('should calculate historical average correctly', () => {
      const metrics = { hours24: 100, days7: 50, days30: 200, days90: 500 };
      const average = (service as any).calculateHistoricalAverage(metrics, 'hours24');

      // Average of days7, days30, days90: (50 + 200 + 500) / 3 = 250
      expect(average).toBe(250);
    });

    it('should determine volume spike severity correctly', () => {
      const severity1 = (service as any).determineVolumeSpikeSeverity(1000, 200, 200);
      expect(severity1).toBe('CRITICAL'); // 5x increase

      const severity2 = (service as any).determineVolumeSpikeSeverity(800, 200, 200);
      expect(severity2).toBe('HIGH'); // 4x increase

      const severity3 = (service as any).determineVolumeSpikeSeverity(600, 200, 200);
      expect(severity3).toBe('MEDIUM'); // 3x increase

      const severity4 = (service as any).determineVolumeSpikeSeverity(400, 200, 200);
      expect(severity4).toBe('LOW'); // 2x increase
    });

    it('should calculate volume spike confidence correctly', () => {
      const confidence1 = (service as any).calculateVolumeSpikeConfidence(1000, 200);
      expect(confidence1).toBeGreaterThan(0.5);

      const confidence2 = (service as any).calculateVolumeSpikeConfidence(300, 200);
      expect(confidence2).toBeLessThan(0.5);
    });

    it('should calculate volume spike risk contribution correctly', () => {
      const risk1 = (service as any).calculateVolumeSpikeRiskContribution(1000, 200);
      expect(risk1).toBeGreaterThan(0.5);

      const risk2 = (service as any).calculateVolumeSpikeRiskContribution(300, 200);
      expect(risk2).toBeLessThan(0.3);
    });
  });

  describe('deterministic behavior', () => {
    it('should produce identical results for identical inputs', async () => {
      const request: BehaviorEvaluationRequest = {
        sellerId: 123
      };

      const result1 = await service.evaluateSellerBehavior(request);
      const result2 = await service.evaluateSellerBehavior(request);

      // Results should be deterministic (same input → same output)
      expect(result1.success).toBe(result2.success);
      if (result1.success && result2.success) {
        expect(result1.data?.behaviorRiskScore).toBe(result2.data?.behaviorRiskScore);
        expect(result1.data?.behaviorRiskLevel).toBe(result2.data?.behaviorRiskLevel);
        expect(result1.data?.detectedPatterns.length).toBe(result2.data?.detectedPatterns.length);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle zero historical data gracefully', async () => {
      // Mock metrics with all zeros except current window
      const metrics = {
        sellerId: 123,
        timestamp: new Date(),
        ordersCount: { hours24: 10, days7: 0, days30: 0, days90: 0 },
        orderVelocity: { hours24: 0.42, days7: 0, days30: 0, days90: 0 },
        claimsCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        claimRate: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        refundsCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        refundRate: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        escrowDisputesCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        disputeRate: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        trustScoreDeltas: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        trustScoreVolatility: 0,
        offersMadeCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        offersRejectedCount: { hours24: 0, days7: 0, days30: 0, days90: 0 },
        offerRejectionRate: { hours24: 0, days7: 0, days30: 0, days90: 0 }
      };

      const patterns = await (service as any).detectPatterns(metrics, service['defaultConfig']);
      
      // Should handle zero historical data without errors
      expect(patterns.patterns).toBeDefined();
      expect(Array.isArray(patterns.patterns)).toBe(true);
    });

    it('should handle division by zero scenarios', async () => {
      const rates = (service as any).calculateRate(
        { hours24: 5, days7: 3, days30: 10, days90: 20 },
        { hours24: 0, days7: 0, days30: 0, days90: 0 } // Zero denominator
      );

      expect(rates.hours24).toBe(0);
      expect(rates.days7).toBe(0);
      expect(rates.days30).toBe(0);
      expect(rates.days90).toBe(0);
    });
  });
});