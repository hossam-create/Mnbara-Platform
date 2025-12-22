/**
 * Corridor Advisory Service Tests
 * Sprint 2: Trust-First Market Activation
 */

import { CorridorAdvisoryService, MarketIntent, TrustLevel, RiskLevel, RecommendedAction } from '../corridor-advisory.service';
import { resetFeatureFlags } from '../../config/feature-flags';

describe('CorridorAdvisoryService', () => {
  beforeEach(() => {
    // Enable all feature flags for testing
    process.env.FF_AI_CORE_ENABLED = 'true';
    process.env.FF_CORRIDOR_AI_ADVISORY = 'true';
    process.env.FF_TRUST_GATING = 'true';
    process.env.FF_INTENT_CHIP_UI = 'true';
    process.env.FF_HUMAN_CONFIRMATION_CHECKPOINTS = 'true';
    process.env.FF_AI_TRUST_SCORING = 'true';
    process.env.FF_AI_RISK_ASSESSMENT = 'true';
    resetFeatureFlags();
  });

  afterEach(() => {
    // Reset flags
    delete process.env.FF_AI_CORE_ENABLED;
    delete process.env.FF_CORRIDOR_AI_ADVISORY;
    delete process.env.FF_TRUST_GATING;
    delete process.env.FF_INTENT_CHIP_UI;
    delete process.env.FF_HUMAN_CONFIRMATION_CHECKPOINTS;
    delete process.env.FF_AI_TRUST_SCORING;
    delete process.env.FF_AI_RISK_ASSESSMENT;
    resetFeatureFlags();
  });

  describe('classifyMarketIntent', () => {
    it('should classify BUY_FROM_ABROAD intent for cross-border buyer', () => {
      const service = new CorridorAdvisoryService();
      const result = service.classifyMarketIntent({
        isCrossBorder: true,
        productUrl: 'https://amazon.com/product/123',
        userRole: 'buyer',
      });

      expect(result).not.toBeNull();
      expect(result!.intent).toBe(MarketIntent.BUY_FROM_ABROAD);
      expect(result!.confidence).toBeGreaterThan(0.5);
      expect(result!.editable).toBe(true);
    });

    it('should classify TRAVEL_MATCH intent for traveler browsing requests', () => {
      const service = new CorridorAdvisoryService();
      const result = service.classifyMarketIntent({
        userRole: 'traveler',
        action: 'browse_requests',
      });

      expect(result).not.toBeNull();
      expect(result!.intent).toBe(MarketIntent.TRAVEL_MATCH);
    });

    it('should classify PRICE_VERIFY intent when price is missing', () => {
      const service = new CorridorAdvisoryService();
      const result = service.classifyMarketIntent({
        productUrl: 'https://example.com/product',
        hasPrice: false,
      });

      expect(result).not.toBeNull();
      expect(result!.intent).toBe(MarketIntent.PRICE_VERIFY);
    });

    it('should return null when feature flag is disabled', () => {
      process.env.FF_CORRIDOR_AI_ADVISORY = 'false';
      resetFeatureFlags();

      const service = new CorridorAdvisoryService();
      const result = service.classifyMarketIntent({ userRole: 'buyer' });

      expect(result).toBeNull();
    });

    it('should be deterministic - same input produces same output', () => {
      const service = new CorridorAdvisoryService();
      const signals = { isCrossBorder: true, userRole: 'buyer' as const };

      const result1 = service.classifyMarketIntent(signals);
      const result2 = service.classifyMarketIntent(signals);

      expect(result1!.intent).toBe(result2!.intent);
      expect(result1!.confidence).toBe(result2!.confidence);
    });
  });

  describe('assessCorridor', () => {
    const mockBuyerTrust = {
      userId: 'buyer-1',
      role: 'BUYER' as const,
      score: 65,
      level: TrustLevel.TRUSTED,
      factors: [],
      computedAt: new Date().toISOString(),
    };

    const mockTravelerTrust = {
      userId: 'traveler-1',
      role: 'TRAVELER' as const,
      score: 80,
      level: TrustLevel.VERIFIED,
      factors: [],
      computedAt: new Date().toISOString(),
    };

    it('should assess US → EG corridor correctly', () => {
      const service = new CorridorAdvisoryService();
      const result = service.assessCorridor({
        origin: 'US',
        destination: 'EG',
        itemValueUSD: 250,
        deliveryDays: 14,
        buyerTrust: mockBuyerTrust,
        travelerTrust: mockTravelerTrust,
      });

      expect(result).not.toBeNull();
      expect(result!.corridorId).toBe('US_EG');
      expect(result!.isSupported).toBe(true);
      expect(result!.riskMultiplier).toBeGreaterThan(1);
      expect(result!.valueBand.label).toBe('Elevated');
    });

    it('should mark unsupported corridor', () => {
      const service = new CorridorAdvisoryService();
      const result = service.assessCorridor({
        origin: 'XX',
        destination: 'YY',
        itemValueUSD: 100,
        deliveryDays: 14,
        buyerTrust: mockBuyerTrust,
        travelerTrust: mockTravelerTrust,
      });

      expect(result).not.toBeNull();
      expect(result!.isSupported).toBe(false);
      expect(result!.warnings).toContain('This corridor is not currently supported');
    });

    it('should apply trust gating for high-value items', () => {
      const service = new CorridorAdvisoryService();
      const lowTrustBuyer = { ...mockBuyerTrust, score: 35, level: TrustLevel.STANDARD };

      const result = service.assessCorridor({
        origin: 'US',
        destination: 'EG',
        itemValueUSD: 300, // High value
        deliveryDays: 14,
        buyerTrust: lowTrustBuyer,
        travelerTrust: mockTravelerTrust,
      });

      expect(result).not.toBeNull();
      expect(result!.trustGating.passed).toBe(false);
      expect(result!.trustGating.isHighValue).toBe(true);
      expect(result!.trustGating.downgradeReason).toContain('Buyer trust');
    });

    it('should recommend escrow for cross-border', () => {
      const service = new CorridorAdvisoryService();
      const result = service.assessCorridor({
        origin: 'US',
        destination: 'AE',
        itemValueUSD: 150,
        deliveryDays: 10,
        buyerTrust: mockBuyerTrust,
        travelerTrust: mockTravelerTrust,
      });

      expect(result).not.toBeNull();
      expect(result!.escrowRecommendation.recommended).toBe(true);
      expect(result!.escrowRecommendation.required).toBe(false); // Never enforced
    });
  });

  describe('generateRecommendationLanes', () => {
    it('should generate all three lanes', () => {
      const service = new CorridorAdvisoryService();
      
      const corridorAssessment = {
        corridorId: 'US_EG',
        corridorName: 'United States → Egypt',
        origin: 'US',
        destination: 'EG',
        isSupported: true,
        riskMultiplier: 1.3,
        valueBand: { label: 'Standard', multiplier: 1.1 },
        trustGating: {
          passed: true,
          buyerMeetsRequirement: true,
          travelerMeetsRequirement: true,
          requiredBuyerTrust: 'TRUSTED' as const,
          requiredTravelerTrust: 'TRUSTED' as const,
          actualBuyerTrust: TrustLevel.TRUSTED,
          actualTravelerTrust: TrustLevel.VERIFIED,
          isHighValue: false,
        },
        escrowRecommendation: {
          recommended: true,
          required: false,
          reason: 'Cross-border protection',
          policy: 'ALWAYS_RECOMMENDED',
        },
        restrictions: [],
        warnings: [],
        timestamp: new Date().toISOString(),
      };

      const riskAssessment = {
        requestId: 'req-1',
        overallRisk: RiskLevel.LOW,
        riskScore: 25,
        factors: [],
        flags: [],
        recommendations: [],
        assessedAt: new Date().toISOString(),
      };

      const recommendation = {
        requestId: 'req-1',
        travelerId: 'traveler-1',
        action: RecommendedAction.PROCEED_WITH_ESCROW,
        confidence: 0.85,
        reasoning: [{ step: 1, factor: 'Trust', evaluation: 'Both parties trusted', impact: 'POSITIVE' as const }],
        warnings: [],
        alternatives: [],
        disclaimer: 'Advisory only',
        generatedAt: new Date().toISOString(),
      };

      const lanes = service.generateRecommendationLanes({
        corridorAssessment,
        riskAssessment,
        recommendation,
      });

      expect(lanes.recommended.length).toBeGreaterThan(0);
      expect(lanes.whyRecommended.length).toBeGreaterThan(0);
      expect(lanes.recommended[0].userChoiceAllowed).toBe(true);
    });
  });

  describe('getConfirmationCheckpoints', () => {
    it('should return checkpoints for cross-border transaction', () => {
      const service = new CorridorAdvisoryService();
      const checkpoints = service.getConfirmationCheckpoints({
        isCrossBorder: true,
        isContactingTraveler: true,
        isSelectingPayment: true,
      });

      expect(checkpoints.length).toBe(3);
      expect(checkpoints.map(c => c.type)).toContain('CONTACT_TRAVELER');
      expect(checkpoints.map(c => c.type)).toContain('SELECT_PAYMENT');
      expect(checkpoints.map(c => c.type)).toContain('PROCEED_CROSS_BORDER');
      
      checkpoints.forEach(cp => {
        expect(cp.requiredConfirmation).toBe(true);
        expect(cp.warnings.length).toBeGreaterThan(0);
      });
    });

    it('should return empty when feature flag disabled', () => {
      process.env.FF_HUMAN_CONFIRMATION_CHECKPOINTS = 'false';
      resetFeatureFlags();

      const service = new CorridorAdvisoryService();
      const checkpoints = service.getConfirmationCheckpoints({
        isCrossBorder: true,
        isContactingTraveler: true,
        isSelectingPayment: true,
      });

      expect(checkpoints.length).toBe(0);
    });
  });

  describe('createSnapshot', () => {
    it('should create and retrieve snapshot', () => {
      const service = new CorridorAdvisoryService();
      const requestId = `test-${Date.now()}`;

      const snapshot = service.createSnapshot({
        requestId,
        intent: null,
        buyerTrust: null,
        travelerTrust: null,
        risk: null,
        recommendation: null,
        corridor: null,
      });

      expect(snapshot.requestId).toBe(requestId);
      expect(snapshot.correlationId).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();

      const retrieved = CorridorAdvisoryService.getSnapshot(requestId);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.requestId).toBe(requestId);
    });
  });
});
