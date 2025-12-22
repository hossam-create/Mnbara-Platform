/**
 * AI Core Integration Service Tests
 * Sprint 1: Verify deterministic, advisory-only behavior
 */

import { AICoreIntegrationService, TrustLevel, RiskLevel, RecommendedAction } from '../ai-core-integration.service';

// Mock feature flags to enable all features for testing
jest.mock('../../config/feature-flags', () => ({
  getFeatureFlags: () => ({
    AI_CORE_ENABLED: true,
    AI_INTENT_CLASSIFICATION: true,
    AI_TRUST_SCORING: true,
    AI_RISK_ASSESSMENT: true,
    AI_DECISION_RECOMMENDATIONS: true,
    AI_AUDIT_LOGGING: true,
  }),
  isAIFeatureEnabled: () => true,
}));

describe('AICoreIntegrationService', () => {
  let service: AICoreIntegrationService;

  beforeEach(() => {
    service = new AICoreIntegrationService('test-correlation-id');
  });

  describe('Intent Classification', () => {
    it('should classify REQUEST intent for buyer creating request', () => {
      const result = service.classifyIntent({
        pageContext: '/request/create',
        action: 'submit_request',
        userRole: 'buyer',
      });

      expect(result).not.toBeNull();
      expect(result!.intent).toBe('REQUEST');
      expect(result!.confidence).toBeGreaterThan(0.5);
      expect(result!.confidenceLevel).toBe('HIGH');
    });

    it('should classify TRAVEL intent for traveler posting trip', () => {
      const result = service.classifyIntent({
        pageContext: '/trip/create',
        action: 'post_trip',
        userRole: 'traveler',
      });

      expect(result).not.toBeNull();
      expect(result!.intent).toBe('TRAVEL');
    });

    it('should return UNKNOWN for insufficient signals', () => {
      const result = service.classifyIntent({});

      expect(result).not.toBeNull();
      expect(result!.intent).toBe('UNKNOWN');
    });

    it('should be deterministic - same input produces same output', () => {
      const input = { pageContext: '/request/create', action: 'submit_request' };
      const result1 = service.classifyIntent(input);
      const result2 = service.classifyIntent(input);

      expect(result1!.intent).toBe(result2!.intent);
      expect(result1!.confidence).toBe(result2!.confidence);
    });
  });


  describe('Trust Scoring', () => {
    const baseBuyerInput = {
      userId: 'buyer-123',
      role: 'BUYER' as const,
      isEmailVerified: true,
      isPhoneVerified: true,
      is2FAEnabled: false,
      totalTransactions: 10,
      successfulTransactions: 9,
      accountCreatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      averageRating: 4.5,
      totalRatings: 5,
      disputesRaised: 1,
      disputesLost: 0,
      responseRate: 0.9,
      kycLevel: 'basic' as const,
    };

    it('should compute trust score for buyer', () => {
      const result = service.computeTrustScore(baseBuyerInput);

      expect(result).not.toBeNull();
      expect(result!.userId).toBe('buyer-123');
      expect(result!.role).toBe('BUYER');
      expect(result!.score).toBeGreaterThan(0);
      expect(result!.score).toBeLessThanOrEqual(100);
      expect(result!.factors.length).toBeGreaterThan(0);
    });

    it('should compute trust score for traveler with delivery metrics', () => {
      const result = service.computeTrustScore({
        ...baseBuyerInput,
        userId: 'traveler-456',
        role: 'TRAVELER',
        passportVerified: true,
        totalDeliveries: 20,
        successfulDeliveries: 19,
        onTimeDeliveries: 18,
      });

      expect(result).not.toBeNull();
      expect(result!.role).toBe('TRAVELER');
      expect(result!.factors.some(f => f.name === 'delivery_success')).toBe(true);
    });

    it('should assign VERIFIED level for high trust score', () => {
      const result = service.computeTrustScore({
        ...baseBuyerInput,
        isPhoneVerified: true,
        is2FAEnabled: true,
        totalTransactions: 100,
        successfulTransactions: 100,
        accountCreatedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
        averageRating: 5.0,
        totalRatings: 50,
        disputesRaised: 0,
        disputesLost: 0,
        responseRate: 1.0,
        kycLevel: 'full',
      });

      expect(result!.level).toBe(TrustLevel.VERIFIED);
    });

    it('should assign RESTRICTED level for very low trust score', () => {
      const result = service.computeTrustScore({
        ...baseBuyerInput,
        isEmailVerified: false,
        isPhoneVerified: false,
        is2FAEnabled: false,
        totalTransactions: 5,
        successfulTransactions: 1,
        accountCreatedAt: new Date(),
        averageRating: 1.0,
        totalRatings: 3,
        disputesRaised: 4,
        disputesLost: 3,
        responseRate: 0.1,
        kycLevel: 'none',
      });

      expect(result!.level).toBe(TrustLevel.RESTRICTED);
    });

    it('should be deterministic', () => {
      const result1 = service.computeTrustScore(baseBuyerInput);
      const result2 = service.computeTrustScore(baseBuyerInput);

      expect(result1!.score).toBe(result2!.score);
      expect(result1!.level).toBe(result2!.level);
    });
  });


  describe('Risk Assessment', () => {
    const baseRiskInput = {
      requestId: 'req-123',
      itemValue: 500,
      currency: 'USD',
      buyerTrust: {
        userId: 'buyer-1', role: 'BUYER' as const, score: 65, level: TrustLevel.TRUSTED,
        factors: [], computedAt: new Date().toISOString(),
      },
      travelerTrust: {
        userId: 'traveler-1', role: 'TRAVELER' as const, score: 70, level: TrustLevel.TRUSTED,
        factors: [], computedAt: new Date().toISOString(),
      },
      originCountry: 'US',
      destinationCountry: 'EG',
      itemCategory: 'electronics',
      buyerAccountAgeDays: 60,
      travelerAccountAgeDays: 90,
    };

    it('should assess risk for cross-border delivery', () => {
      const result = service.assessRisk(baseRiskInput);

      expect(result).not.toBeNull();
      expect(result!.requestId).toBe('req-123');
      expect(result!.riskScore).toBeGreaterThan(0);
      expect(result!.factors.length).toBeGreaterThan(0);
      expect(result!.flags.some(f => f.code === 'CROSS_BORDER')).toBe(true);
    });

    it('should flag high-value items', () => {
      const result = service.assessRisk({
        ...baseRiskInput,
        itemValue: 5500,
      });

      expect(result!.flags.some(f => f.code === 'VERY_HIGH_VALUE')).toBe(true);
      expect(result!.overallRisk).not.toBe(RiskLevel.MINIMAL);
    });

    it('should flag new accounts', () => {
      const result = service.assessRisk({
        ...baseRiskInput,
        buyerAccountAgeDays: 3,
      });

      expect(result!.flags.some(f => f.code === 'VERY_NEW_BUYER')).toBe(true);
    });

    it('should flag high-risk categories', () => {
      const result = service.assessRisk({
        ...baseRiskInput,
        itemCategory: 'luxury jewelry',
      });

      expect(result!.flags.some(f => f.code === 'HIGH_RISK_CATEGORY')).toBe(true);
    });

    it('should be deterministic', () => {
      const result1 = service.assessRisk(baseRiskInput);
      const result2 = service.assessRisk(baseRiskInput);

      expect(result1!.riskScore).toBe(result2!.riskScore);
      expect(result1!.overallRisk).toBe(result2!.overallRisk);
    });
  });


  describe('Decision Recommendation', () => {
    const baseRecommendationInput = {
      requestId: 'req-123',
      travelerId: 'traveler-456',
      buyerTrust: {
        userId: 'buyer-1', role: 'BUYER' as const, score: 65, level: TrustLevel.TRUSTED,
        factors: [], computedAt: new Date().toISOString(),
      },
      travelerTrust: {
        userId: 'traveler-1', role: 'TRAVELER' as const, score: 70, level: TrustLevel.TRUSTED,
        factors: [], computedAt: new Date().toISOString(),
      },
      riskAssessment: {
        requestId: 'req-123', overallRisk: RiskLevel.LOW, riskScore: 25,
        factors: [], flags: [], recommendations: [], assessedAt: new Date().toISOString(),
      },
    };

    it('should generate recommendation with reasoning', () => {
      const result = service.generateRecommendation(baseRecommendationInput);

      expect(result).not.toBeNull();
      expect(result!.requestId).toBe('req-123');
      expect(result!.travelerId).toBe('traveler-456');
      expect(result!.action).toBeDefined();
      expect(result!.confidence).toBeGreaterThan(0);
      expect(result!.reasoning.length).toBeGreaterThan(0);
      expect(result!.disclaimer).toContain('advisory');
    });

    it('should recommend PROCEED for low risk + trusted parties', () => {
      const result = service.generateRecommendation(baseRecommendationInput);

      expect([RecommendedAction.PROCEED, RecommendedAction.PROCEED_WITH_ESCROW]).toContain(result!.action);
    });

    it('should recommend DECLINE for critical risk + restricted trust', () => {
      const result = service.generateRecommendation({
        ...baseRecommendationInput,
        buyerTrust: { ...baseRecommendationInput.buyerTrust, score: 10, level: TrustLevel.RESTRICTED },
        riskAssessment: { ...baseRecommendationInput.riskAssessment, overallRisk: RiskLevel.CRITICAL, riskScore: 85 },
      });

      expect(result!.action).toBe(RecommendedAction.DECLINE);
    });

    it('should include warnings from risk flags', () => {
      const result = service.generateRecommendation({
        ...baseRecommendationInput,
        riskAssessment: {
          ...baseRecommendationInput.riskAssessment,
          flags: [{ code: 'TEST_FLAG', severity: RiskLevel.MEDIUM, message: 'Test warning', recommendation: 'Test rec' }],
        },
      });

      expect(result!.warnings).toContain('Test warning');
    });

    it('should be deterministic', () => {
      const result1 = service.generateRecommendation(baseRecommendationInput);
      const result2 = service.generateRecommendation(baseRecommendationInput);

      expect(result1!.action).toBe(result2!.action);
      expect(result1!.confidence).toBe(result2!.confidence);
    });
  });

  describe('Audit Logging', () => {
    it('should log operations and retrieve them', () => {
      // Perform some operations
      service.classifyIntent({ pageContext: '/request/create' });
      
      const logs = AICoreIntegrationService.getAuditLogs({ operation: 'CLASSIFY_INTENT', limit: 10 });
      
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].operation).toBe('CLASSIFY_INTENT');
      expect(logs[0].correlationId).toBeDefined();
    });
  });
});
