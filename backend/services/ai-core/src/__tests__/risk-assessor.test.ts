/**
 * Risk Assessor Service Tests
 * Verifies deterministic risk assessment
 */

import { riskAssessorService, RiskContext } from '../services/risk-assessor.service';
import { AssessRiskRequest, RiskLevel, TrustLevel } from '../types/ai-core.types';

describe('RiskAssessorService', () => {
  const baseRequest: AssessRiskRequest = {
    transactionId: 'txn-123',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    amount: 500,
    currency: 'USD',
    itemDetails: {
      id: 'item-1',
      category: 'clothing',
      condition: 'new',
      price: 500,
      description: 'Designer jacket',
    },
  };

  const baseContext: RiskContext = {
    buyerTrust: {
      userId: 'buyer-1',
      score: 75,
      level: TrustLevel.TRUSTED,
      factors: [],
      computedAt: new Date().toISOString(),
    },
    sellerTrust: {
      userId: 'seller-1',
      score: 80,
      level: TrustLevel.VERIFIED,
      factors: [],
      computedAt: new Date().toISOString(),
    },
    buyerRecentTransactions: 3,
    sellerRecentTransactions: 5,
    buyerLocation: { country: 'US', city: 'New York' },
    sellerLocation: { country: 'US', city: 'Los Angeles' },
    transactionTime: new Date(),
    deviceId: 'device-abc123',
    isNewDevice: false,
  };

  describe('assessRisk', () => {
    it('should assess low risk for standard transaction', () => {
      const result = riskAssessorService.assessRisk(baseRequest, baseContext);

      expect(result.transactionId).toBe('txn-123');
      expect(result.overallRisk).toBe(RiskLevel.LOW);
      expect(result.riskScore).toBeLessThan(40);
    });

    it('should assess higher risk for high-value transaction', () => {
      const highValueRequest = {
        ...baseRequest,
        amount: 15000,
      };

      const result = riskAssessorService.assessRisk(highValueRequest, baseContext);

      expect(result.riskScore).toBeGreaterThan(30);
      expect(result.flags.some((f) => f.code === 'VERY_HIGH_VALUE')).toBe(true);
    });

    it('should assess higher risk for high-risk category', () => {
      const highRiskRequest = {
        ...baseRequest,
        itemDetails: {
          ...baseRequest.itemDetails,
          category: 'electronics',
        },
      };

      const result = riskAssessorService.assessRisk(highRiskRequest, baseContext);

      expect(result.flags.some((f) => f.code === 'HIGH_RISK_CATEGORY')).toBe(true);
    });

    it('should assess higher risk for low trust party', () => {
      const lowTrustContext: RiskContext = {
        ...baseContext,
        buyerTrust: {
          ...baseContext.buyerTrust,
          score: 15,
          level: TrustLevel.RESTRICTED,
        },
      };

      const result = riskAssessorService.assessRisk(baseRequest, lowTrustContext);

      expect(result.flags.some((f) => f.code === 'LOW_TRUST_PARTY')).toBe(true);
      expect(result.overallRisk).not.toBe(RiskLevel.MINIMAL);
    });

    it('should assess higher risk for high velocity', () => {
      const highVelocityContext: RiskContext = {
        ...baseContext,
        buyerRecentTransactions: 25,
      };

      const result = riskAssessorService.assessRisk(baseRequest, highVelocityContext);

      expect(result.flags.some((f) => f.code === 'HIGH_VELOCITY')).toBe(true);
    });

    it('should include all risk factors', () => {
      const result = riskAssessorService.assessRisk(baseRequest, baseContext);

      expect(result.factors).toHaveLength(7);
      expect(result.factors.map((f) => f.category)).toContain('trust_differential');
      expect(result.factors.map((f) => f.category)).toContain('transaction_amount');
      expect(result.factors.map((f) => f.category)).toContain('item_category');
      expect(result.factors.map((f) => f.category)).toContain('velocity');
      expect(result.factors.map((f) => f.category)).toContain('geographic');
      expect(result.factors.map((f) => f.category)).toContain('time_pattern');
      expect(result.factors.map((f) => f.category)).toContain('device_fingerprint');
    });

    it('should be deterministic', () => {
      const result1 = riskAssessorService.assessRisk(baseRequest, baseContext);
      const result2 = riskAssessorService.assessRisk(baseRequest, baseContext);

      expect(result1.riskScore).toBe(result2.riskScore);
      expect(result1.overallRisk).toBe(result2.overallRisk);
      expect(result1.factors).toEqual(result2.factors);
    });

    it('should flag new device', () => {
      const newDeviceContext: RiskContext = {
        ...baseContext,
        isNewDevice: true,
      };

      const result = riskAssessorService.assessRisk(baseRequest, newDeviceContext);

      expect(result.flags.some((f) => f.code === 'NEW_DEVICE')).toBe(true);
    });

    it('should flag off-hours transaction', () => {
      const offHoursContext: RiskContext = {
        ...baseContext,
        transactionTime: new Date('2024-01-15T03:00:00Z'), // 3 AM UTC
      };

      const result = riskAssessorService.assessRisk(baseRequest, offHoursContext);

      expect(result.flags.some((f) => f.code === 'OFF_HOURS_TRANSACTION')).toBe(true);
    });

    it('should include recommendations in flags', () => {
      const highRiskRequest = {
        ...baseRequest,
        amount: 15000,
        itemDetails: {
          ...baseRequest.itemDetails,
          category: 'electronics',
        },
      };

      const result = riskAssessorService.assessRisk(highRiskRequest, baseContext);

      for (const flag of result.flags) {
        expect(flag.recommendation).toBeDefined();
        expect(flag.recommendation.length).toBeGreaterThan(0);
      }
    });
  });
});
