/**
 * Dispute & Claims Intelligence Service Tests
 * NO AUTOMATION - Advisory Only
 *
 * Tests verify:
 * - No auto-resolution
 * - No outcome enforcement
 * - Human decides everything
 * - Deterministic outputs
 * - Feature flag enforcement
 */

import { DisputeIntelService } from '../dispute-intel.service';
import { resetFeatureFlags } from '../../config/feature-flags';
import { DisputeContext } from '../../types/dispute-intel.types';

describe('DisputeIntelService', () => {
  let service: DisputeIntelService;

  const mockContext: DisputeContext = {
    disputeId: 'disp-123',
    transactionId: 'tx-456',
    buyerId: 'buyer-789',
    sellerId: 'seller-012',
    travelerId: 'traveler-345',
    amount: 150,
    currency: 'USD',
    itemDescription: 'Electronics item',
    claimDescription: 'Item not received, tracking shows delivered but I never got it',
    claimDate: '2025-12-19T10:00:00Z',
    transactionDate: '2025-12-10T10:00:00Z',
    deliveryDate: '2025-12-15T10:00:00Z',
    existingEvidence: ['tracking_screenshot'],
  };

  beforeEach(() => {
    DisputeIntelService.reset();
    resetFeatureFlags();
    service = new DisputeIntelService();
  });

  afterEach(() => {
    DisputeIntelService.reset();
    resetFeatureFlags();
  });

  describe('NO AUTOMATION Constraints', () => {
    beforeEach(() => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should always include disclaimer with no auto-resolution', () => {
      const advisory = service.getDisputeAdvisory(mockContext);

      expect(advisory).not.toBeNull();
      expect(advisory!.disclaimer).toBeDefined();
      expect(advisory!.disclaimer.isAdvisoryOnly).toBe(true);
      expect(advisory!.disclaimer.noAutoResolution).toBe(true);
      expect(advisory!.disclaimer.noOutcomeEnforcement).toBe(true);
      expect(advisory!.disclaimer.humanDecidesEverything).toBe(true);
    });

    it('should mark all suggested actions as requiring human approval', () => {
      const advisory = service.getDisputeAdvisory(mockContext);

      expect(advisory).not.toBeNull();
      advisory!.classification.suggestedActions.forEach((action) => {
        expect(action.requiresHumanApproval).toBe(true);
      });
    });

    it('should mark resolution guidance as requiring human decision', () => {
      const advisory = service.getDisputeAdvisory(mockContext);

      expect(advisory).not.toBeNull();
      expect(advisory!.resolutionGuidance.humanDecisionRequired).toBe(true);
    });

    it('should not execute any resolution actions', () => {
      const advisory = service.getDisputeAdvisory(mockContext);

      // Advisory should only contain guidance, not execution results
      expect(advisory).not.toBeNull();
      expect(advisory).not.toHaveProperty('resolutionExecuted');
      expect(advisory).not.toHaveProperty('refundProcessed');
      expect(advisory).not.toHaveProperty('outcomeEnforced');
    });
  });

  describe('Deterministic Outputs', () => {
    beforeEach(() => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return same classification for same input', () => {
      const result1 = service.classifyClaim(mockContext);
      const result2 = service.classifyClaim(mockContext);

      expect(result1.category).toBe(result2.category);
      expect(result1.severity).toBe(result2.severity);
      expect(result1.complexity).toBe(result2.complexity);
    });

    it('should return consistent evidence checklist for same category', () => {
      const checklist1 = service.generateEvidenceChecklist(mockContext, 'ITEM_NOT_RECEIVED');
      const checklist2 = service.generateEvidenceChecklist(mockContext, 'ITEM_NOT_RECEIVED');

      expect(checklist1.requiredEvidence.length).toBe(checklist2.requiredEvidence.length);
      expect(checklist1.category).toBe(checklist2.category);
    });

    it('should produce deterministic advisory for same context', () => {
      const advisory1 = service.getDisputeAdvisory(mockContext);
      const advisory2 = service.getDisputeAdvisory(mockContext);

      expect(advisory1!.classification.category).toBe(advisory2!.classification.category);
      expect(advisory1!.riskAssessment.overallRisk).toBe(advisory2!.riskAssessment.overallRisk);
    });
  });

  describe('Feature Flag Enforcement', () => {
    it('should return null when feature is disabled', () => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'false';
      resetFeatureFlags();

      const advisory = service.getDisputeAdvisory(mockContext);
      expect(advisory).toBeNull();
    });

    it('should return null when emergency disabled', () => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const advisory = service.getDisputeAdvisory(mockContext);
      expect(advisory).toBeNull();
    });
  });

  describe('Claim Classification', () => {
    beforeEach(() => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should classify ITEM_NOT_RECEIVED correctly', () => {
      const context = { ...mockContext, claimDescription: 'Item never arrived, not received' };
      const classification = service.classifyClaim(context);

      expect(classification.category).toBe('ITEM_NOT_RECEIVED');
    });

    it('should classify DAMAGED_ITEM correctly', () => {
      const context = { ...mockContext, claimDescription: 'Item arrived broken and damaged' };
      const classification = service.classifyClaim(context);

      expect(classification.category).toBe('DAMAGED_ITEM');
    });

    it('should classify ITEM_NOT_AS_DESCRIBED correctly', () => {
      const context = { ...mockContext, claimDescription: 'Item is different from description, not as described' };
      const classification = service.classifyClaim(context);

      expect(classification.category).toBe('ITEM_NOT_AS_DESCRIBED');
    });

    it('should classify WRONG_ITEM correctly', () => {
      const context = { ...mockContext, claimDescription: 'Received wrong item, not what I ordered' };
      const classification = service.classifyClaim(context);

      expect(classification.category).toBe('WRONG_ITEM');
    });

    it('should return valid classification structure', () => {
      const classification = service.classifyClaim(mockContext);

      expect(classification.classificationId).toBeDefined();
      expect(classification.disputeId).toBe(mockContext.disputeId);
      expect(classification.timestamp).toBeDefined();
      expect(classification.category).toBeDefined();
      expect(classification.severity).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
      expect(classification.complexity).toMatch(/^(SIMPLE|MODERATE|COMPLEX)$/);
      expect(classification.confidence).toBeGreaterThanOrEqual(0);
      expect(classification.confidence).toBeLessThanOrEqual(100);
      expect(classification.reasoning).toBeDefined();
      expect(classification.suggestedActions).toBeInstanceOf(Array);
      expect(classification.disclaimer).toBeDefined();
    });

    it('should include reasoning with factors', () => {
      const classification = service.classifyClaim(mockContext);

      expect(classification.reasoning.primaryFactors).toBeInstanceOf(Array);
      expect(classification.reasoning.primaryFactors.length).toBeGreaterThan(0);
      expect(classification.reasoning.uncertainties).toBeInstanceOf(Array);
      expect(classification.reasoning.alternativeCategories).toBeInstanceOf(Array);
    });
  });

  describe('Evidence Checklist', () => {
    beforeEach(() => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return valid checklist structure', () => {
      const checklist = service.generateEvidenceChecklist(mockContext, 'ITEM_NOT_RECEIVED');

      expect(checklist.checklistId).toBeDefined();
      expect(checklist.disputeId).toBe(mockContext.disputeId);
      expect(checklist.category).toBe('ITEM_NOT_RECEIVED');
      expect(checklist.timestamp).toBeDefined();
      expect(checklist.requiredEvidence).toBeInstanceOf(Array);
      expect(checklist.optionalEvidence).toBeInstanceOf(Array);
      expect(checklist.partyResponsibilities).toBeInstanceOf(Array);
      expect(checklist.timelineGuidance).toBeDefined();
      expect(checklist.disclaimer).toBeDefined();
    });

    it('should include required evidence items', () => {
      const checklist = service.generateEvidenceChecklist(mockContext, 'ITEM_NOT_RECEIVED');

      expect(checklist.requiredEvidence.length).toBeGreaterThan(0);
      checklist.requiredEvidence.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.type).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.importance).toMatch(/^(REQUIRED|RECOMMENDED|OPTIONAL)$/);
        expect(item.fromParty).toMatch(/^(BUYER|SELLER|TRAVELER|PLATFORM)$/);
        expect(item.examples).toBeInstanceOf(Array);
      });
    });

    it('should include party responsibilities', () => {
      const checklist = service.generateEvidenceChecklist(mockContext, 'DAMAGED_ITEM');

      expect(checklist.partyResponsibilities.length).toBeGreaterThan(0);
      const parties = checklist.partyResponsibilities.map((p) => p.party);
      expect(parties).toContain('BUYER');
      expect(parties).toContain('SELLER');
    });

    it('should include timeline guidance', () => {
      const checklist = service.generateEvidenceChecklist(mockContext, 'ITEM_NOT_AS_DESCRIBED');

      expect(checklist.timelineGuidance.recommendedResponseDays).toBeGreaterThan(0);
      expect(checklist.timelineGuidance.escalationThresholdDays).toBeGreaterThan(0);
      expect(checklist.timelineGuidance.maxResolutionDays).toBeGreaterThan(0);
      expect(checklist.timelineGuidance.milestones).toBeInstanceOf(Array);
      expect(checklist.timelineGuidance.milestones.length).toBeGreaterThan(0);
    });

    it('should generate different checklists for different categories', () => {
      const checklistINR = service.generateEvidenceChecklist(mockContext, 'ITEM_NOT_RECEIVED');
      const checklistDMG = service.generateEvidenceChecklist(mockContext, 'DAMAGED_ITEM');

      // Categories should differ
      expect(checklistINR.category).not.toBe(checklistDMG.category);

      // Evidence requirements may differ
      const inrTypes = checklistINR.requiredEvidence.map((e) => e.type);
      const dmgTypes = checklistDMG.requiredEvidence.map((e) => e.type);

      // Both should have some evidence but may have different types
      expect(inrTypes.length).toBeGreaterThan(0);
      expect(dmgTypes.length).toBeGreaterThan(0);
    });
  });

  describe('Full Advisory', () => {
    beforeEach(() => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return complete advisory structure', () => {
      const advisory = service.getDisputeAdvisory(mockContext);

      expect(advisory).not.toBeNull();
      expect(advisory!.advisoryId).toBeDefined();
      expect(advisory!.disputeId).toBe(mockContext.disputeId);
      expect(advisory!.timestamp).toBeDefined();
      expect(advisory!.classification).toBeDefined();
      expect(advisory!.evidenceChecklist).toBeDefined();
      expect(advisory!.resolutionGuidance).toBeDefined();
      expect(advisory!.riskAssessment).toBeDefined();
      expect(advisory!.disclaimer).toBeDefined();
    });

    it('should include resolution guidance', () => {
      const advisory = service.getDisputeAdvisory(mockContext);

      expect(advisory!.resolutionGuidance.recommendedApproach).toBeDefined();
      expect(advisory!.resolutionGuidance.possibleOutcomes).toBeInstanceOf(Array);
      expect(advisory!.resolutionGuidance.possibleOutcomes.length).toBeGreaterThan(0);
      expect(advisory!.resolutionGuidance.escalationCriteria).toBeInstanceOf(Array);
      expect(advisory!.resolutionGuidance.humanDecisionRequired).toBe(true);
    });

    it('should include risk assessment', () => {
      const advisory = service.getDisputeAdvisory(mockContext);

      expect(advisory!.riskAssessment.overallRisk).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
      expect(advisory!.riskAssessment.financialExposure).toBeDefined();
      expect(advisory!.riskAssessment.financialExposure.estimatedMin).toBeGreaterThanOrEqual(0);
      expect(advisory!.riskAssessment.financialExposure.estimatedMax).toBeGreaterThan(0);
      expect(advisory!.riskAssessment.reputationRisk).toMatch(/^(LOW|MEDIUM|HIGH)$/);
      expect(advisory!.riskAssessment.escalationRisk).toMatch(/^(LOW|MEDIUM|HIGH)$/);
      expect(advisory!.riskAssessment.factors).toBeInstanceOf(Array);
    });
  });

  describe('Health Check', () => {
    it('should return healthy when enabled', () => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'false';
      resetFeatureFlags();

      const health = service.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.featureFlags.disputeIntelEnabled).toBe(true);
      expect(health.featureFlags.emergencyDisabled).toBe(false);
    });

    it('should return degraded when disabled', () => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'false';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'false';
      resetFeatureFlags();

      const health = service.getHealth();

      expect(health.status).toBe('degraded');
      expect(health.featureFlags.disputeIntelEnabled).toBe(false);
    });

    it('should return disabled when emergency disabled', () => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const health = service.getHealth();

      expect(health.status).toBe('disabled');
      expect(health.featureFlags.emergencyDisabled).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should log advisory requests', () => {
      service.getDisputeAdvisory(mockContext);

      const logs = service.getAuditLog(mockContext.disputeId);
      expect(logs.some((l) => l.action === 'ADVISORY_REQUESTED')).toBe(true);
    });

    it('should log classification generation', () => {
      service.classifyClaim(mockContext);

      const logs = service.getAuditLog(mockContext.disputeId);
      expect(logs.some((l) => l.action === 'CLASSIFICATION_GENERATED')).toBe(true);
    });

    it('should log checklist generation', () => {
      service.generateEvidenceChecklist(mockContext, 'DAMAGED_ITEM');

      const logs = service.getAuditLog(mockContext.disputeId);
      expect(logs.some((l) => l.action === 'CHECKLIST_GENERATED')).toBe(true);
    });

    it('should not log sensitive content', () => {
      service.getDisputeAdvisory(mockContext);

      const logs = service.getAuditLog(mockContext.disputeId);
      logs.forEach((log) => {
        expect(log).not.toHaveProperty('claimDescription');
        expect(log).not.toHaveProperty('personalInfo');
        expect(log).not.toHaveProperty('evidenceContent');
      });
    });
  });

  describe('No Side Effects', () => {
    beforeEach(() => {
      process.env.FF_DISPUTE_INTEL_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should not modify dispute state', () => {
      const advisory1 = service.getDisputeAdvisory(mockContext);
      const advisory2 = service.getDisputeAdvisory(mockContext);

      // Multiple calls should not change classification
      expect(advisory1!.classification.category).toBe(advisory2!.classification.category);
      expect(advisory1!.classification.severity).toBe(advisory2!.classification.severity);
    });

    it('should not trigger any external actions', () => {
      const advisory = service.getDisputeAdvisory(mockContext);

      // Advisory should be pure data, no execution flags
      expect(advisory).not.toHaveProperty('emailSent');
      expect(advisory).not.toHaveProperty('notificationTriggered');
      expect(advisory).not.toHaveProperty('refundInitiated');
      expect(advisory).not.toHaveProperty('disputeResolved');
    });
  });
});
