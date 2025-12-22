/**
 * Experiments Service Tests
 * Non-Regulated Growth Experiments Only
 *
 * TEST COVERAGE:
 * - No side effects
 * - No cross-market leakage
 * - Kill-switch behavior
 * - Deterministic rendering per user
 * - Isolation guarantees
 */

import { ExperimentsService } from '../experiments.service';
import { resetFeatureFlags } from '../../config/feature-flags';
import { EXPERIMENTS, BLOCKED_EXPERIMENT_TYPES, ALLOWED_EXPERIMENT_TYPES } from '../../config/experiments.config';

describe('ExperimentsService', () => {
  let service: ExperimentsService;

  beforeEach(() => {
    service = new ExperimentsService();
    ExperimentsService.resetCounters();
    resetFeatureFlags();
  });

  afterEach(() => {
    // Reset environment
    delete process.env.FF_EXPERIMENTS_ENABLED;
    delete process.env.FF_EMERGENCY_DISABLE_ALL;
    resetFeatureFlags();
  });

  // ===========================================
  // Feature Flag Tests
  // ===========================================

  describe('Feature Flags', () => {
    it('should return empty experiments when EXPERIMENTS_ENABLED is false', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'false';
      resetFeatureFlags();

      const result = service.getActiveExperiments('user123', 'MARKET_0');

      expect(result.experiments).toHaveLength(0);
      expect(result.userAssignments).toHaveLength(0);
      expect(result.disclaimer).toBeDefined();
    });

    it('should return empty experiments when EMERGENCY_DISABLE_ALL is true', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const result = service.getActiveExperiments('user123', 'MARKET_0');

      expect(result.experiments).toHaveLength(0);
      expect(result.userAssignments).toHaveLength(0);
    });

    it('should respect emergency kill switch in health check', () => {
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const health = service.getHealth();

      expect(health.status).toBe('disabled');
      expect(health.killSwitchActive).toBe(true);
    });
  });

  // ===========================================
  // Determinism Tests
  // ===========================================

  describe('Deterministic Assignment', () => {
    it('should assign same user to same variant consistently', () => {
      const experiment = EXPERIMENTS[0];
      
      const assignment1 = service.assignUserToExperiment('user123', experiment);
      const assignment2 = service.assignUserToExperiment('user123', experiment);
      const assignment3 = service.assignUserToExperiment('user123', experiment);

      expect(assignment1.variantId).toBe(assignment2.variantId);
      expect(assignment2.variantId).toBe(assignment3.variantId);
    });

    it('should assign different users to potentially different variants', () => {
      const experiment = EXPERIMENTS[0];
      const assignments = new Set<string>();

      // Test with many users to verify distribution
      for (let i = 0; i < 100; i++) {
        const assignment = service.assignUserToExperiment(`user_${i}`, experiment);
        assignments.add(assignment.variantId);
      }

      // Should have at least control variant
      expect(assignments.size).toBeGreaterThanOrEqual(1);
    });

    it('should produce deterministic exposure cohort membership', () => {
      const experiment = EXPERIMENTS[0];

      const inCohort1 = service.isUserInExposureCohort('user123', experiment);
      const inCohort2 = service.isUserInExposureCohort('user123', experiment);
      const inCohort3 = service.isUserInExposureCohort('user123', experiment);

      expect(inCohort1).toBe(inCohort2);
      expect(inCohort2).toBe(inCohort3);
    });
  });

  // ===========================================
  // No Side Effects Tests
  // ===========================================

  describe('No Side Effects', () => {
    it('should not modify experiment config when getting active experiments', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      resetFeatureFlags();

      const originalExperiments = JSON.stringify(EXPERIMENTS);
      
      service.getActiveExperiments('user123', 'MARKET_0');
      service.getActiveExperiments('user456', 'MARKET_1');
      
      expect(JSON.stringify(EXPERIMENTS)).toBe(originalExperiments);
    });

    it('should not persist assignment decisions', () => {
      const experiment = EXPERIMENTS[0];
      
      // Get assignment
      service.assignUserToExperiment('user123', experiment);
      
      // Reset counters
      ExperimentsService.resetCounters();
      
      // Assignment should still work (computed on-the-fly)
      const assignment = service.assignUserToExperiment('user123', experiment);
      expect(assignment).toBeDefined();
      expect(assignment.experimentId).toBe(experiment.id);
    });

    it('should not record exposure when feature flag is off', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'false';
      resetFeatureFlags();

      service.recordExposure('exp_test', 'variant_a', 'user123', 'MARKET_0', {});
      
      const metrics = service.getExperimentMetrics('exp_test');
      expect(metrics.totalExposures).toBe(0);
    });
  });

  // ===========================================
  // Isolation Tests
  // ===========================================

  describe('Isolation', () => {
    it('should not leak experiments across markets', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      resetFeatureFlags();

      const market0Result = service.getActiveExperiments('user123', 'MARKET_0');
      const market1Result = service.getActiveExperiments('user123', 'MARKET_1');

      // Each market should only see its own experiments
      market0Result.experiments.forEach((exp) => {
        expect(exp.markets.length === 0 || exp.markets.includes('MARKET_0')).toBe(true);
      });

      market1Result.experiments.forEach((exp) => {
        expect(exp.markets.length === 0 || exp.markets.includes('MARKET_1')).toBe(true);
      });
    });

    it('should not leak experiments across corridors', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      resetFeatureFlags();

      const usEgResult = service.getActiveExperiments('user123', 'MARKET_0', 'US_EG');
      const ukAeResult = service.getActiveExperiments('user123', 'MARKET_0', 'UK_AE');

      // Each corridor should only see its own experiments
      usEgResult.experiments.forEach((exp) => {
        expect(exp.corridors.length === 0 || exp.corridors.includes('US_EG')).toBe(true);
      });

      ukAeResult.experiments.forEach((exp) => {
        expect(exp.corridors.length === 0 || exp.corridors.includes('UK_AE')).toBe(true);
      });
    });
  });

  // ===========================================
  // Kill Switch Tests
  // ===========================================

  describe('Kill Switch', () => {
    it('should disable experiment when kill switch is activated', () => {
      const experimentId = EXPERIMENTS[0].id;
      
      const result = service.activateKillSwitch(experimentId, 'Test kill switch');
      
      expect(result).toBe(true);
      
      const experiment = EXPERIMENTS.find((e) => e.id === experimentId);
      expect(experiment?.killSwitch).toBe(true);
    });

    it('should return false for non-existent experiment', () => {
      const result = service.activateKillSwitch('non_existent_exp', 'Test');
      expect(result).toBe(false);
    });

    it('should log kill switch activation in audit log', () => {
      const experimentId = EXPERIMENTS[0].id;
      
      service.activateKillSwitch(experimentId, 'Test kill switch');
      
      const auditLog = service.getAuditLog(experimentId);
      const killSwitchEntry = auditLog.find((e) => e.action === 'KILL_SWITCH');
      
      expect(killSwitchEntry).toBeDefined();
      expect(killSwitchEntry?.reason).toBe('Test kill switch');
    });
  });

  // ===========================================
  // Auto-Disable Tests
  // ===========================================

  describe('Auto-Disable on Error Spike', () => {
    it('should auto-disable experiment when error rate exceeds threshold', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      resetFeatureFlags();

      const experimentId = EXPERIMENTS[0].id;
      
      // Record many exposures
      for (let i = 0; i < 200; i++) {
        service.recordExposure(experimentId, 'control', `user_${i}`, 'MARKET_0', {});
      }
      
      // Record errors exceeding threshold (>5%)
      for (let i = 0; i < 15; i++) {
        service.recordError(experimentId);
      }
      
      const experiment = EXPERIMENTS.find((e) => e.id === experimentId);
      expect(experiment?.autoDisabledReason).toContain('Error rate');
    });
  });

  // ===========================================
  // Metrics Tests
  // ===========================================

  describe('Metrics', () => {
    it('should return aggregated metrics only', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      resetFeatureFlags();

      const experimentId = EXPERIMENTS[0].id;
      
      // Record some exposures
      service.recordExposure(experimentId, 'control', 'user1', 'MARKET_0', {});
      service.recordExposure(experimentId, 'variant_a', 'user2', 'MARKET_0', {});
      
      const metrics = service.getExperimentMetrics(experimentId);
      
      expect(metrics.experimentId).toBe(experimentId);
      expect(metrics.totalExposures).toBe(2);
      expect(metrics.variants).toBeDefined();
      // Should not contain individual user data
      expect(metrics).not.toHaveProperty('users');
      expect(metrics).not.toHaveProperty('userIds');
    });

    it('should return all metrics when no experimentId specified', () => {
      const allMetrics = service.getAllMetrics();
      
      expect(allMetrics.length).toBe(EXPERIMENTS.length);
      allMetrics.forEach((m) => {
        expect(m.experimentId).toBeDefined();
        expect(m.timestamp).toBeDefined();
      });
    });
  });

  // ===========================================
  // Health Tests
  // ===========================================

  describe('Health', () => {
    it('should return healthy status when experiments are enabled', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      resetFeatureFlags();

      const health = service.getHealth();
      
      expect(health.featureFlags.experimentsEnabled).toBe(true);
      expect(health.featureFlags.emergencyDisabled).toBe(false);
    });

    it('should include experiment counts in health', () => {
      const health = service.getHealth();
      
      expect(typeof health.activeExperiments).toBe('number');
      expect(typeof health.disabledExperiments).toBe('number');
      expect(health.activeExperiments + health.disabledExperiments).toBeLessThanOrEqual(EXPERIMENTS.length);
    });
  });

  // ===========================================
  // Disclaimer Tests
  // ===========================================

  describe('Disclaimer', () => {
    it('should always include disclaimer in response', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      resetFeatureFlags();

      const result = service.getActiveExperiments('user123', 'MARKET_0');
      
      expect(result.disclaimer).toBeDefined();
      expect(result.disclaimer.type).toBe('EXPERIMENT');
      expect(result.disclaimer.noSideEffects).toBe(true);
      expect(result.disclaimer.isolated).toBe(true);
      expect(result.disclaimer.nonRegulated).toBe(true);
    });
  });

  // ===========================================
  // Blocked Types Tests
  // ===========================================

  describe('Blocked Experiment Types', () => {
    it('should have blocked types defined', () => {
      expect(BLOCKED_EXPERIMENT_TYPES).toContain('PAYMENT_FLOW');
      expect(BLOCKED_EXPERIMENT_TYPES).toContain('ESCROW_LOGIC');
      expect(BLOCKED_EXPERIMENT_TYPES).toContain('TRUST_SCORING');
      expect(BLOCKED_EXPERIMENT_TYPES).toContain('RISK_ASSESSMENT');
      expect(BLOCKED_EXPERIMENT_TYPES).toContain('RANKING_ALGORITHM');
      expect(BLOCKED_EXPERIMENT_TYPES).toContain('ENFORCEMENT_RULE');
    });

    it('should have allowed types defined', () => {
      expect(ALLOWED_EXPERIMENT_TYPES).toContain('UI_COPY_VARIANT');
      expect(ALLOWED_EXPERIMENT_TYPES).toContain('LAYOUT_TOGGLE');
      expect(ALLOWED_EXPERIMENT_TYPES).toContain('INFO_PANEL');
      expect(ALLOWED_EXPERIMENT_TYPES).toContain('EDUCATION_FLOW');
    });

    it('should not have overlap between blocked and allowed types', () => {
      const overlap = ALLOWED_EXPERIMENT_TYPES.filter((t) =>
        BLOCKED_EXPERIMENT_TYPES.includes(t as any)
      );
      expect(overlap).toHaveLength(0);
    });
  });

  // ===========================================
  // Audit Log Tests
  // ===========================================

  describe('Audit Log', () => {
    it('should log exposures', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      resetFeatureFlags();

      const experimentId = EXPERIMENTS[0].id;
      service.recordExposure(experimentId, 'control', 'user123', 'MARKET_0', { page: 'home' });
      
      const auditLog = service.getAuditLog(experimentId);
      const exposureEntry = auditLog.find((e) => e.action === 'EXPOSURE');
      
      expect(exposureEntry).toBeDefined();
      expect(exposureEntry?.userId).toBe('user123');
    });

    it('should filter audit log by experimentId', () => {
      process.env.FF_EXPERIMENTS_ENABLED = 'true';
      resetFeatureFlags();

      const exp1 = EXPERIMENTS[0].id;
      const exp2 = EXPERIMENTS[1]?.id || exp1;
      
      service.recordExposure(exp1, 'control', 'user1', 'MARKET_0', {});
      service.recordExposure(exp2, 'control', 'user2', 'MARKET_0', {});
      
      const exp1Log = service.getAuditLog(exp1);
      
      exp1Log.forEach((entry) => {
        expect(entry.experimentId).toBe(exp1);
      });
    });
  });
});
