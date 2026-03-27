import { LaunchReadinessService } from '../services/LaunchReadiness.service';
import { LaunchStatus, LaunchPhase } from '../types/LaunchReadiness.types';

describe('Launch Readiness Service', () => {
  let launchReadinessService: LaunchReadinessService;

  beforeEach(() => {
    launchReadinessService = new LaunchReadinessService();
  });

  afterEach(() => {
    launchReadinessService.reset();
  });

  describe('PART 1 — SYSTEM FREEZE', () => {
    it('should apply system freeze with correct version', async () => {
      const systemFreeze = launchReadinessService.applySystemFreeze();

      expect(systemFreeze.version).toBe('RELEASE_CANDIDATE_v1');
      expect(systemFreeze.tag).toBe('RELEASE_CANDIDATE_v1');
      expect(systemFreeze.frozenComponents.apis).toBe(true);
      expect(systemFreeze.frozenComponents.roles).toBe(true);
      expect(systemFreeze.frozenComponents.flows).toBe(true);
      expect(systemFreeze.frozenComponents.schema).toBe(true);
      expect(systemFreeze.restrictions.noNewFeatures).toBe(true);
      expect(systemFreeze.restrictions.noBusinessLogicChanges).toBe(true);
      expect(systemFreeze.restrictions.noFinancialBehaviorChanges).toBe(true);
      expect(systemFreeze.restrictions.analysisAndDeclarationOnly).toBe(true);
    });

    it('should log system freeze event', async () => {
      launchReadinessService.applySystemFreeze();
      const events = launchReadinessService.getLaunchEvents();

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('SYSTEM_FREEZE_APPLIED');
      expect(events[0].data.version).toBe('RELEASE_CANDIDATE_v1');
    });
  });

  describe('PART 2 — LAUNCH SCOPE LOCK', () => {
    it('should lock launch scope with correct live components', async () => {
      const scopeLock = launchReadinessService.lockLaunchScope();

      // Live components should be enabled
      expect(scopeLock.liveComponents.auctions.bidding).toBe(true);
      expect(scopeLock.liveComponents.auctions.antiSniping).toBe(true);
      expect(scopeLock.liveComponents.auctions.reserve).toBe(true);
      expect(scopeLock.liveComponents.auctions.settlement).toBe(true);
      expect(scopeLock.liveComponents.wallet.readOnly).toBe(true);
      expect(scopeLock.liveComponents.wallet.mutations).toBe(false);
      expect(scopeLock.liveComponents.escrow.backendControlled).toBe(true);
      expect(scopeLock.liveComponents.escrow.autoRelease).toBe(false);
      expect(scopeLock.liveComponents.disputes.guarantees).toBe(true);
      expect(scopeLock.liveComponents.disputes.readOnlyUI).toBe(true);
      expect(scopeLock.liveComponents.trustAndSafety.rules).toBe(true);
      expect(scopeLock.liveComponents.trustAndSafety.throttling).toBe(true);
      expect(scopeLock.liveComponents.trustAndSafety.logging).toBe(true);
      expect(scopeLock.liveComponents.affiliateAndReferral.trackingOnly).toBe(true);
      expect(scopeLock.liveComponents.affiliateAndReferral.payouts).toBe(false);
      expect(scopeLock.liveComponents.eventLogging.appendOnly).toBe(true);
      expect(scopeLock.liveComponents.eventLogging.mutable).toBe(false);
    });

    it('should lock launch scope with correct locked components', async () => {
      const scopeLock = launchReadinessService.lockLaunchScope();

      // Locked components should be true (disabled for launch)
      expect(scopeLock.lockedComponents.realBankSettlement).toBe(true);
      expect(scopeLock.lockedComponents.payoutExecution).toBe(true);
      expect(scopeLock.lockedComponents.walletMutationsFromUI).toBe(true);
      expect(scopeLock.lockedComponents.autoEscrowRelease).toBe(true);
      expect(scopeLock.lockedComponents.commissionPayout).toBe(true);
      expect(scopeLock.lockedComponents.fxMultiCurrency).toBe(true);
    });

    it('should log scope lock event', async () => {
      launchReadinessService.lockLaunchScope();
      const events = launchReadinessService.getLaunchEvents();

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('LAUNCH_SCOPE_LOCKED');
      expect(events[0].data.scope).toBeDefined();
    });
  });

  describe('PART 3 — AUTHORITY MATRIX', () => {
    it('should finalize authority matrix with correct frontend restrictions', async () => {
      const authorityMatrix = launchReadinessService.finalizeAuthorityMatrix();

      expect(authorityMatrix.frontend.capabilities.viewOnly).toBe(true);
      expect(authorityMatrix.frontend.capabilities.intentOnly).toBe(true);
      expect(authorityMatrix.frontend.capabilities.zeroFinancialAuthority).toBe(true);
      expect(authorityMatrix.frontend.restrictions.noDirectWalletAccess).toBe(true);
      expect(authorityMatrix.frontend.restrictions.noEscrowControl).toBe(true);
      expect(authorityMatrix.frontend.restrictions.noSettlementAuthority).toBe(true);
      expect(authorityMatrix.frontend.restrictions.noPayoutControl).toBe(true);
    });

    it('should finalize authority matrix with correct backend capabilities', async () => {
      const authorityMatrix = launchReadinessService.finalizeAuthorityMatrix();

      expect(authorityMatrix.backend.capabilities.allDecisions).toBe(true);
      expect(authorityMatrix.backend.capabilities.allMoney).toBe(true);
      expect(authorityMatrix.backend.capabilities.allStateTransitions).toBe(true);
      expect(authorityMatrix.backend.capabilities.sourceOfTruth).toBe(true);
      expect(authorityMatrix.backend.responsibilities.financialControl).toBe(true);
      expect(authorityMatrix.backend.responsibilities.stateManagement).toBe(true);
      expect(authorityMatrix.backend.responsibilities.securityEnforcement).toBe(true);
      expect(authorityMatrix.backend.responsibilities.complianceMonitoring).toBe(true);
    });

    it('should finalize authority matrix with correct admin restrictions', async () => {
      const authorityMatrix = launchReadinessService.finalizeAuthorityMatrix();

      expect(authorityMatrix.admin.capabilities.visibilityOnly).toBe(true);
      expect(authorityMatrix.admin.capabilities.noForceActions).toBe(true);
      expect(authorityMatrix.admin.capabilities.noOverrides).toBe(true);
      expect(authorityMatrix.admin.capabilities.readOnly).toBe(true);
      expect(authorityMatrix.admin.restrictions.noFinancialOperations).toBe(true);
      expect(authorityMatrix.admin.restrictions.noStateModifications).toBe(true);
      expect(authorityMatrix.admin.restrictions.noUserImpersonation).toBe(true);
      expect(authorityMatrix.admin.restrictions.noSystemOverrides).toBe(true);
    });

    it('should log authority matrix finalization event', async () => {
      launchReadinessService.finalizeAuthorityMatrix();
      const events = launchReadinessService.getLaunchEvents();

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('AUTHORITY_MODEL_FINALIZED');
      expect(events[0].data.authority).toBeDefined();
    });
  });

  describe('PART 4 — GO-LIVE CHECKLIST', () => {
    it('should generate checklist with all checks passed', async () => {
      const checklist = launchReadinessService.generateGoLiveChecklist();

      expect(checklist.items.ledgerImmutable).toBe(true);
      expect(checklist.items.escrowControlled).toBe(true);
      expect(checklist.items.settlementFinal).toBe(true);
      expect(checklist.items.appealsTimeBound).toBe(true);
      expect(checklist.items.throttlingActive).toBe(true);
      expect(checklist.items.eventLoggingVerified).toBe(true);
      expect(checklist.items.noMockData).toBe(true);
      expect(checklist.items.adminReadOnly).toBe(true);
      expect(checklist.items.arabicUIOptional).toBe(true);
      expect(checklist.items.affiliateTrackingActive).toBe(true);
      expect(checklist.totalChecks).toBe(10);
      expect(checklist.passedChecks).toBe(10);
      expect(checklist.allPassed).toBe(true);
    });

    it('should log go-live ready confirmed event', async () => {
      launchReadinessService.generateGoLiveChecklist();
      const events = launchReadinessService.getLaunchEvents();

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('GO_LIVE_READY_CONFIRMED');
      expect(events[0].data.decision).toBe('YES');
    });

    it('should return correct launch status', async () => {
      const status = launchReadinessService.getLaunchReadinessStatus();
      expect(status).toBe(LaunchStatus.READY_FOR_SOFT_LAUNCH);
    });
  });

  describe('PART 5 — POST-LAUNCH FLAGS', () => {
    it('should document post-launch phases correctly', async () => {
      const postLaunchFlags = launchReadinessService.documentPostLaunchFlags();

      expect(postLaunchFlags.currentPhase).toBe(LaunchPhase.PHASE_1_AUCTION_CORE);
      expect(postLaunchFlags.futurePhases).toHaveLength(4);
      
      // Check Phase 2 - Bank/PSP
      const phase2 = postLaunchFlags.futurePhases[0];
      expect(phase2.phase).toBe(LaunchPhase.PHASE_2_BANK_PSP);
      expect(phase2.description).toContain('bank settlement');
      expect(phase2.capabilities).toContain('Real bank transfers');
      expect(phase2.dependencies).toContain('Bank partnerships');
      expect(phase2.estimatedTimeline).toBe('Q2 2025');
      expect(phase2.status).toBe('PLANNED');

      // Check Phase 3 - Payouts
      const phase3 = postLaunchFlags.futurePhases[1];
      expect(phase3.phase).toBe(LaunchPhase.PHASE_3_PAYOUTS);
      expect(phase3.description).toContain('payout execution');
      expect(phase3.capabilities).toContain('Automated payouts');
      expect(phase3.estimatedTimeline).toBe('Q3 2025');

      // Check Phase 4 - Commission Settlement
      const phase4 = postLaunchFlags.futurePhases[2];
      expect(phase4.phase).toBe(LaunchPhase.PHASE_4_COMMISSION_SETTLEMENT);
      expect(phase4.description).toContain('commission settlement');
      expect(phase4.capabilities).toContain('Commission calculation');
      expect(phase4.estimatedTimeline).toBe('Q4 2025');

      // Check Phase 5 - AI/ML
      const phase5 = postLaunchFlags.futurePhases[3];
      expect(phase5.phase).toBe(LaunchPhase.PHASE_5_AI_ML);
      expect(phase5.description).toContain('AI/ML');
      expect(phase5.capabilities).toContain('Fraud detection');
      expect(phase5.estimatedTimeline).toBe('Q1 2026');
    });
  });

  describe('Launch Readiness Report Generation', () => {
    it('should generate complete launch readiness report', async () => {
      const request = {
        includeSystemFreeze: true,
        includeScopeLock: true,
        includeAuthorityMatrix: true,
        includeGoLiveChecklist: true,
        includePostLaunchFlags: true,
        autoGenerateReport: true
      };

      const result = launchReadinessService.generateLaunchReadinessReport(request);

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report?.status).toBe(LaunchStatus.READY_FOR_SOFT_LAUNCH);
      expect(result.report?.goLiveDecision).toBe('YES');
      expect(result.report?.systemFreeze.version).toBe('RELEASE_CANDIDATE_v1');
      expect(result.report?.scopeLock.liveComponents.auctions.bidding).toBe(true);
      expect(result.report?.authorityMatrix.frontend.capabilities.zeroFinancialAuthority).toBe(true);
      expect(result.report?.goLiveChecklist.allPassed).toBe(true);
      expect(result.report?.postLaunchFlags.currentPhase).toBe(LaunchPhase.PHASE_1_AUCTION_CORE);
      expect(result.report?.events.length).toBeGreaterThan(0);
      expect(result.validation?.isValid).toBe(true);
    });

    it('should validate report correctly', async () => {
      const request = {
        includeSystemFreeze: true,
        includeScopeLock: true,
        includeAuthorityMatrix: true,
        includeGoLiveChecklist: true,
        includePostLaunchFlags: true,
        autoGenerateReport: true
      };

      const result = launchReadinessService.generateLaunchReadinessReport(request);

      expect(result.validation?.isValid).toBe(true);
      expect(result.validation?.errors).toHaveLength(0);
      expect(result.validation?.recommendations).toContain('System is ready for soft launch');
    });

    it('should generate report with minimal request', async () => {
      const request = {
        includeSystemFreeze: false,
        includeScopeLock: false,
        includeAuthorityMatrix: false,
        includeGoLiveChecklist: false,
        includePostLaunchFlags: false,
        autoGenerateReport: false
      };

      const result = launchReadinessService.generateLaunchReadinessReport(request);

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      // Even with minimal request, all components should still be generated
      expect(result.report?.systemFreeze).toBeDefined();
      expect(result.report?.scopeLock).toBeDefined();
      expect(result.report?.authorityMatrix).toBeDefined();
      expect(result.report?.goLiveChecklist).toBeDefined();
      expect(result.report?.postLaunchFlags).toBeDefined();
    });
  });

  describe('Event Logging', () => {
    it('should log all required events', async () => {
      // Generate complete report to trigger all events
      const request = {
        includeSystemFreeze: true,
        includeScopeLock: true,
        includeAuthorityMatrix: true,
        includeGoLiveChecklist: true,
        includePostLaunchFlags: true,
        autoGenerateReport: true
      };

      launchReadinessService.generateLaunchReadinessReport(request);
      const events = launchReadinessService.getLaunchEvents();

      expect(events).toHaveLength(4);
      expect(events.map(e => e.type)).toContain('SYSTEM_FREEZE_APPLIED');
      expect(events.map(e => e.type)).toContain('LAUNCH_SCOPE_LOCKED');
      expect(events.map(e => e.type)).toContain('AUTHORITY_MODEL_FINALIZED');
      expect(events.map(e => e.type)).toContain('GO_LIVE_READY_CONFIRMED');
    });

    it('should limit events when requested', async () => {
      // Generate multiple events
      launchReadinessService.applySystemFreeze();
      launchReadinessService.lockLaunchScope();
      launchReadinessService.finalizeAuthorityMatrix();
      launchReadinessService.generateGoLiveChecklist();

      const allEvents = launchReadinessService.getLaunchEvents();
      const limitedEvents = launchReadinessService.getLaunchEvents(2);

      expect(allEvents.length).toBe(4);
      expect(limitedEvents.length).toBe(2);
      expect(limitedEvents).toEqual(allEvents.slice(-2));
    });
  });

  describe('Error Handling', () => {
    it('should handle service reset gracefully', async () => {
      // Generate some events
      launchReadinessService.applySystemFreeze();
      expect(launchReadinessService.getLaunchEvents()).toHaveLength(1);

      // Reset service
      launchReadinessService.reset();
      expect(launchReadinessService.getLaunchEvents()).toHaveLength(0);
    });

    it('should maintain consistent state across multiple calls', async () => {
      // Multiple calls should produce consistent results
      const status1 = launchReadinessService.getLaunchReadinessStatus();
      const status2 = launchReadinessService.getLaunchReadinessStatus();
      
      expect(status1).toBe(status2);
      expect(status1).toBe(LaunchStatus.READY_FOR_SOFT_LAUNCH);
    });

    it('should generate consistent system freeze declarations', async () => {
      const freeze1 = launchReadinessService.applySystemFreeze();
      const freeze2 = launchReadinessService.applySystemFreeze();
      
      expect(freeze1.version).toBe(freeze2.version);
      expect(freeze1.tag).toBe(freeze2.tag);
      expect(freeze1.frozenComponents).toEqual(freeze2.frozenComponents);
    });
  });

  describe('Configuration and Defaults', () => {
    it('should use correct default version', async () => {
      const systemFreeze = launchReadinessService.applySystemFreeze();
      expect(systemFreeze.version).toBe('RELEASE_CANDIDATE_v1');
      expect(systemFreeze.tag).toBe('RELEASE_CANDIDATE_v1');
    });

    it('should have correct default checklist items', async () => {
      const checklist = launchReadinessService.generateGoLiveChecklist();
      expect(checklist.totalChecks).toBe(10);
      expect(checklist.passedChecks).toBe(10);
      expect(checklist.allPassed).toBe(true);
    });

    it('should have correct post-launch phases count', async () => {
      const postLaunchFlags = launchReadinessService.documentPostLaunchFlags();
      expect(postLaunchFlags.futurePhases).toHaveLength(4);
      expect(postLaunchFlags.currentPhase).toBe(LaunchPhase.PHASE_1_AUCTION_CORE);
    });
  });
});
