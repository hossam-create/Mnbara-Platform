/**
 * Payment Advisory Service Tests
 * READ-ONLY - Intelligence Only
 *
 * Tests verify:
 * - Determinism (same input = same output)
 * - No execution paths
 * - Kill-switch behavior
 * - Explanation presence
 */

import { PaymentAdvisoryService, paymentAdvisoryService } from '../payment-advisory.service';
import { resetFeatureFlags } from '../../config/feature-flags';
import { PaymentAdvisoryRequest } from '../../types/payment-advisory.types';

describe('PaymentAdvisoryService', () => {
  beforeEach(() => {
    resetFeatureFlags();
    PaymentAdvisoryService.resetSnapshots();
  });

  afterEach(() => {
    resetFeatureFlags();
  });

  describe('Feature Flag Gating', () => {
    it('should return empty results when PAYMENT_ADVISORY_ENABLED is false', () => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'false';
      resetFeatureFlags();

      const request: PaymentAdvisoryRequest = {
        requestId: 'test-1',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const comparison = paymentAdvisoryService.comparePaymentMethods(request);
      expect(comparison.methods).toHaveLength(0);
      expect(comparison.recommended).toBeNull();
    });

    it('should return results when PAYMENT_ADVISORY_ENABLED is true', () => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const request: PaymentAdvisoryRequest = {
        requestId: 'test-2',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const comparison = paymentAdvisoryService.comparePaymentMethods(request);
      expect(comparison.methods.length).toBeGreaterThan(0);
    });
  });

  describe('Kill Switch Behavior', () => {
    it('should disable all services when emergency kill switch is active', () => {
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const request: PaymentAdvisoryRequest = {
        requestId: 'test-kill',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const comparison = paymentAdvisoryService.comparePaymentMethods(request);
      const fxAdvisory = paymentAdvisoryService.getFXAdvisory('USD', 'EGP', 100);
      const riskAssessment = paymentAdvisoryService.assessPaymentRisks(request);

      expect(comparison.methods).toHaveLength(0);
      expect(fxAdvisory.rates).toHaveLength(0);
      expect(riskAssessment.warnings).toHaveLength(0);
    });

    it('should show unhealthy status when kill switch is active', () => {
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const health = paymentAdvisoryService.getHealth();
      expect(health.status).toBe('unhealthy');
      expect(health.featureFlags.emergencyDisabled).toBe(true);
    });
  });

  describe('Determinism', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return same payment method comparison for same input', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-determinism-1',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 250,
      };

      const result1 = paymentAdvisoryService.comparePaymentMethods({ ...request, requestId: 'r1' });
      const result2 = paymentAdvisoryService.comparePaymentMethods({ ...request, requestId: 'r2' });

      // Compare method scores (should be identical)
      expect(result1.methods.map((m) => m.score)).toEqual(result2.methods.map((m) => m.score));
      expect(result1.recommended).toEqual(result2.recommended);
    });

    it('should return same FX advisory for same input', () => {
      const result1 = paymentAdvisoryService.getFXAdvisory('USD', 'EGP', 100, 'fx-1');
      const result2 = paymentAdvisoryService.getFXAdvisory('USD', 'EGP', 100, 'fx-2');

      expect(result1.marketRate).toEqual(result2.marketRate);
      expect(result1.rates.map((r) => r.rate)).toEqual(result2.rates.map((r) => r.rate));
    });

    it('should return same risk assessment for same input', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-risk',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 1000,
        buyerTrustLevel: 'NEW',
      };

      const result1 = paymentAdvisoryService.assessPaymentRisks({ ...request, requestId: 'risk-1' });
      const result2 = paymentAdvisoryService.assessPaymentRisks({ ...request, requestId: 'risk-2' });

      expect(result1.riskScore).toEqual(result2.riskScore);
      expect(result1.overallRiskLevel).toEqual(result2.overallRiskLevel);
      expect(result1.warnings.map((w) => w.type)).toEqual(result2.warnings.map((w) => w.type));
    });
  });

  describe('No Execution Paths', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should always include advisory disclaimer', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-disclaimer',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const comparison = paymentAdvisoryService.comparePaymentMethods(request);
      const fxAdvisory = paymentAdvisoryService.getFXAdvisory('USD', 'EGP', 100);
      const riskAssessment = paymentAdvisoryService.assessPaymentRisks(request);

      // All results must have disclaimer
      expect(comparison.disclaimer.isAdvisoryOnly).toBe(true);
      expect(comparison.disclaimer.noExecution).toBe(true);
      expect(comparison.disclaimer.noGuarantee).toBe(true);

      expect(fxAdvisory.disclaimer.isAdvisoryOnly).toBe(true);
      expect(fxAdvisory.disclaimer.noExecution).toBe(true);

      expect(riskAssessment.disclaimer.isAdvisoryOnly).toBe(true);
      expect(riskAssessment.disclaimer.noExecution).toBe(true);
    });

    it('should not have any execute/process/charge methods', () => {
      const service = paymentAdvisoryService;

      // Verify no execution methods exist
      expect(typeof (service as any).executePayment).toBe('undefined');
      expect(typeof (service as any).processPayment).toBe('undefined');
      expect(typeof (service as any).chargeCard).toBe('undefined');
      expect(typeof (service as any).initiateTransfer).toBe('undefined');
      expect(typeof (service as any).createTransaction).toBe('undefined');
    });

    it('should only have read-only methods', () => {
      const publicMethods = Object.getOwnPropertyNames(PaymentAdvisoryService.prototype).filter(
        (name) => name !== 'constructor' && typeof (paymentAdvisoryService as any)[name] === 'function'
      );

      // All public methods should be getters/comparers/assessors
      const allowedPrefixes = ['get', 'compare', 'assess', 'build', 'calculate', 'generate', 'record', 'empty'];
      const invalidMethods = publicMethods.filter(
        (name) => !allowedPrefixes.some((prefix) => name.toLowerCase().startsWith(prefix))
      );

      expect(invalidMethods).toEqual([]);
    });
  });

  describe('Explanation Presence', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should include recommendation reason in method comparison', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-explain-1',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const comparison = paymentAdvisoryService.comparePaymentMethods(request);
      expect(comparison.recommendationReason).toBeTruthy();
      expect(comparison.recommendationReason.length).toBeGreaterThan(10);
    });

    it('should include explanation in FX advisory', () => {
      const fxAdvisory = paymentAdvisoryService.getFXAdvisory('USD', 'EGP', 100);
      expect(fxAdvisory.explanation).toBeTruthy();
      expect(fxAdvisory.explanation.length).toBeGreaterThan(10);
    });

    it('should include explanation in risk assessment', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-explain-3',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 1000,
      };

      const riskAssessment = paymentAdvisoryService.assessPaymentRisks(request);
      expect(riskAssessment.explanation).toBeTruthy();
      expect(riskAssessment.explanation.length).toBeGreaterThan(10);
    });

    it('should include pros and cons for each payment method', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-pros-cons',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const comparison = paymentAdvisoryService.comparePaymentMethods(request);

      for (const method of comparison.methods) {
        expect(Array.isArray(method.pros)).toBe(true);
        expect(Array.isArray(method.cons)).toBe(true);
      }
    });

    it('should include mitigations for risk warnings', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-mitigations',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 3000, // High value to trigger warnings
        buyerTrustLevel: 'NEW',
      };

      const riskAssessment = paymentAdvisoryService.assessPaymentRisks(request);

      if (riskAssessment.warnings.length > 0) {
        expect(riskAssessment.mitigations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Payment Method Comparison', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should filter methods by corridor', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-corridor-filter',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const comparison = paymentAdvisoryService.comparePaymentMethods(request);
      const availableMethods = comparison.methods.filter((m) => m.available);

      // Should have some available methods for US_EG
      expect(availableMethods.length).toBeGreaterThan(0);
    });

    it('should mark methods unavailable when amount exceeds limits', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-limits',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 50000, // Very high amount
      };

      const comparison = paymentAdvisoryService.comparePaymentMethods(request);
      const unavailableDueToLimits = comparison.methods.filter(
        (m) => !m.available && m.unavailableReason?.includes('limits')
      );

      expect(unavailableDueToLimits.length).toBeGreaterThan(0);
    });

    it('should calculate fees correctly', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-fees',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const comparison = paymentAdvisoryService.comparePaymentMethods(request);

      for (const method of comparison.methods) {
        expect(method.estimatedFeeUSD).toBeGreaterThanOrEqual(0);
        expect(method.estimatedTotal).toBeGreaterThan(method.estimatedFeeUSD);
      }
    });
  });

  describe('FX Advisory', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return rates for supported currency pairs', () => {
      const fxAdvisory = paymentAdvisoryService.getFXAdvisory('USD', 'EGP', 100);

      expect(fxAdvisory.marketRate).toBeGreaterThan(0);
      expect(fxAdvisory.rates.length).toBeGreaterThan(0);
    });

    it('should mark best rate as recommended', () => {
      const fxAdvisory = paymentAdvisoryService.getFXAdvisory('USD', 'EGP', 100);

      const recommendedCount = fxAdvisory.rates.filter((r) => r.isRecommended).length;
      expect(recommendedCount).toBe(1);
    });

    it('should include spread information', () => {
      const fxAdvisory = paymentAdvisoryService.getFXAdvisory('USD', 'EGP', 100);

      expect(fxAdvisory.spread).toBeDefined();
      expect(fxAdvisory.spreadPercent).toBeDefined();

      for (const rate of fxAdvisory.rates) {
        expect(rate.spreadPercent).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Risk Assessment', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should flag high-value transactions', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-high-value',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 3000,
      };

      const riskAssessment = paymentAdvisoryService.assessPaymentRisks(request);
      const highValueWarning = riskAssessment.warnings.find(
        (w) => w.type === 'HIGH_VALUE_TRANSACTION'
      );

      expect(highValueWarning).toBeDefined();
    });

    it('should flag new user trust mismatch', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-trust',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
        buyerTrustLevel: 'NEW',
      };

      const riskAssessment = paymentAdvisoryService.assessPaymentRisks(request);
      const trustWarning = riskAssessment.warnings.find((w) => w.type === 'TRUST_MISMATCH');

      expect(trustWarning).toBeDefined();
    });

    it('should calculate risk score correctly', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-score',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const riskAssessment = paymentAdvisoryService.assessPaymentRisks(request);

      expect(riskAssessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(riskAssessment.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Audit Snapshots', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should record audit snapshot for each request', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-audit-123',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      paymentAdvisoryService.comparePaymentMethods(request);

      const snapshot = paymentAdvisoryService.getSnapshot('test-audit-123');
      expect(snapshot).not.toBeNull();
      expect(snapshot?.requestId).toBe('test-audit-123');
    });

    it('should include feature flags in snapshot', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-flags-snapshot',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      paymentAdvisoryService.comparePaymentMethods(request);

      const snapshot = paymentAdvisoryService.getSnapshot('test-flags-snapshot');
      expect(snapshot?.featureFlags).toBeDefined();
      expect(snapshot?.featureFlags.paymentAdvisoryEnabled).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when enabled', () => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const health = paymentAdvisoryService.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.services.methodComparison).toBe(true);
      expect(health.services.fxAdvisory).toBe(true);
      expect(health.services.riskAssessment).toBe(true);
    });

    it('should include FX snapshot timestamp', () => {
      const health = paymentAdvisoryService.getHealth();
      expect(health.lastFXUpdate).toBeTruthy();
    });
  });

  // ===========================================
  // Sprint 6: Bank Integration Advisory Tests
  // ===========================================

  describe('Compliance Advisory', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return compliance boundaries for corridor', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-compliance-1',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const compliance = paymentAdvisoryService.getComplianceAdvisory(request);

      expect(compliance.boundaries.length).toBeGreaterThan(0);
      expect(compliance.overallStatus).toBeDefined();
      expect(compliance.disclaimer.isAdvisoryOnly).toBe(true);
    });

    it('should flag KYC requirement for high-value transactions', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-compliance-kyc',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 2000,
      };

      const compliance = paymentAdvisoryService.getComplianceAdvisory(request);
      const kycBoundary = compliance.boundaries.find(b => b.type === 'KYC_REQUIREMENT');

      expect(kycBoundary).toBeDefined();
      expect(kycBoundary?.status).toBe('PENDING');
    });

    it('should block sanctioned corridors', () => {
      const request: PaymentAdvisoryRequest = {
        requestId: 'test-compliance-sanctions',
        corridor: 'US_IR',
        originCountry: 'US',
        destinationCountry: 'IR',
        amountUSD: 100,
      };

      const compliance = paymentAdvisoryService.getComplianceAdvisory(request);

      expect(compliance.overallStatus).toBe('BLOCKED');
      expect(compliance.blockers.length).toBeGreaterThan(0);
    });

    it('should return empty when disabled', () => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'false';
      resetFeatureFlags();

      const request: PaymentAdvisoryRequest = {
        requestId: 'test-compliance-disabled',
        corridor: 'US_EG',
        originCountry: 'US',
        destinationCountry: 'EG',
        amountUSD: 100,
      };

      const compliance = paymentAdvisoryService.getComplianceAdvisory(request);

      expect(compliance.boundaries).toHaveLength(0);
      expect(compliance.blockers.length).toBeGreaterThan(0);
    });
  });

  describe('Partner Readiness Check', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return partner readiness for corridor', () => {
      const result = paymentAdvisoryService.checkPartnerReadiness('US_EG');

      expect(result.partners.length).toBeGreaterThan(0);
      expect(result.disclaimer.isAdvisoryOnly).toBe(true);
    });

    it('should recommend ready partners', () => {
      const result = paymentAdvisoryService.checkPartnerReadiness('US_EG');

      if (result.recommendedPartner) {
        const recommended = result.partners.find(p => p.partnerId === result.recommendedPartner);
        expect(recommended?.status).toBe('READY');
      }
    });

    it('should include advisory note for each partner', () => {
      const result = paymentAdvisoryService.checkPartnerReadiness('US_EG');

      for (const partner of result.partners) {
        expect(partner.advisory).toBeTruthy();
        expect(partner.advisory.toLowerCase()).toContain('advisory');
      }
    });

    it('should return empty when disabled', () => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'false';
      resetFeatureFlags();

      const result = paymentAdvisoryService.checkPartnerReadiness('US_EG');

      expect(result.partners).toHaveLength(0);
      expect(result.recommendedPartner).toBeNull();
    });
  });

  describe('Fee Breakdown', () => {
    beforeEach(() => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return detailed fee breakdown', () => {
      const breakdown = paymentAdvisoryService.getFeeBreakdown('CARD_VISA', 100, 'US_EG');

      expect(breakdown.baseFee).toBeDefined();
      expect(breakdown.percentageFee).toBeDefined();
      expect(breakdown.totalFee).toBeDefined();
      expect(breakdown.explanation).toBeTruthy();
    });

    it('should include FX spread for cross-border', () => {
      const breakdown = paymentAdvisoryService.getFeeBreakdown('CARD_VISA', 100, 'US_EG');

      expect(breakdown.fxSpread).toBeGreaterThan(0);
    });

    it('should not include FX spread for domestic', () => {
      const breakdown = paymentAdvisoryService.getFeeBreakdown('CARD_VISA', 100, 'US');

      expect(breakdown.fxSpread).toBe(0);
    });

    it('should return empty for unknown method', () => {
      const breakdown = paymentAdvisoryService.getFeeBreakdown('UNKNOWN_METHOD', 100, 'US_EG');

      expect(breakdown.totalFee).toBe(0);
      expect(breakdown.explanation).toContain('not found');
    });
  });

  describe('Extended Health Check', () => {
    it('should include compliance and partner services', () => {
      process.env.FF_PAYMENT_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const health = paymentAdvisoryService.getExtendedHealth();

      expect(health.services.complianceCheck).toBe(true);
      expect(health.services.partnerReadiness).toBe(true);
    });

    it('should show version 2.0.0', () => {
      const health = paymentAdvisoryService.getExtendedHealth();
      expect(health.version).toBe('2.0.0');
    });
  });
});
