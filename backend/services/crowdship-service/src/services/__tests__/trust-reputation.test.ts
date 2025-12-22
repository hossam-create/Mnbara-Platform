/**
 * Trust & Reputation Service Tests
 * ADVISORY ONLY - No Score Mutation
 *
 * Tests verify:
 * - Deterministic outputs
 * - No side effects
 * - Feature flag enforcement
 * - All signals visible
 * - No hidden penalties
 */

import { TrustReputationService } from '../trust-reputation.service';
import { resetFeatureFlags } from '../../config/feature-flags';

describe('TrustReputationService', () => {
  let service: TrustReputationService;

  beforeEach(() => {
    TrustReputationService.reset();
    resetFeatureFlags();
    service = new TrustReputationService();
  });

  afterEach(() => {
    TrustReputationService.reset();
    resetFeatureFlags();
  });

  describe('Advisory-Only Constraints', () => {
    it('should return read-only snapshots with disclaimer', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();

      const snapshot = service.getReputationSnapshot('user-123');

      expect(snapshot).not.toBeNull();
      expect(snapshot!.disclaimer).toBeDefined();
      expect(snapshot!.disclaimer.isAdvisoryOnly).toBe(true);
      expect(snapshot!.disclaimer.noEnforcement).toBe(true);
      expect(snapshot!.disclaimer.noAutoRanking).toBe(true);
      expect(snapshot!.disclaimer.noHiddenPenalties).toBe(true);
      expect(snapshot!.disclaimer.allSignalsVisible).toBe(true);
    });

    it('should have all signals visible (no hidden penalties)', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();

      const snapshot = service.getReputationSnapshot('user-456');

      expect(snapshot).not.toBeNull();
      snapshot!.signals.forEach((signal) => {
        expect(signal.isVisible).toBe(true);
      });
    });

    it('should not mutate trust scores', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();

      const snapshot1 = service.getReputationSnapshot('user-789');
      const snapshot2 = service.getReputationSnapshot('user-789');

      expect(snapshot1!.trustScore).toBe(snapshot2!.trustScore);
      expect(snapshot1!.trustLevel).toBe(snapshot2!.trustLevel);
    });
  });

  describe('Deterministic Outputs', () => {
    it('should return same output for same input', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();

      const result1 = service.getReputationSnapshot('deterministic-user');
      const result2 = service.getReputationSnapshot('deterministic-user');

      expect(result1!.trustScore).toBe(result2!.trustScore);
      expect(result1!.trustLevel).toBe(result2!.trustLevel);
      expect(result1!.signals.length).toBe(result2!.signals.length);
    });

    it('should return deterministic history', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();

      const history1 = service.getTrustHistory('history-user', 7);
      const history2 = service.getTrustHistory('history-user', 7);

      expect(history1!.history.length).toBe(history2!.history.length);
      expect(history1!.trend.direction).toBe(history2!.trend.direction);
    });

    it('should return deterministic portability check', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();

      const port1 = service.checkPortability('port-user', 'MARKET_0', ['MARKET_1']);
      const port2 = service.checkPortability('port-user', 'MARKET_0', ['MARKET_1']);

      expect(port1!.overallPortable).toBe(port2!.overallPortable);
      expect(port1!.portabilityScore).toBe(port2!.portabilityScore);
    });
  });

  describe('Feature Flag Enforcement', () => {
    it('should return null when feature is disabled', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'false';
      resetFeatureFlags();

      const snapshot = service.getReputationSnapshot('user-123');
      expect(snapshot).toBeNull();
    });

    it('should return null when emergency disabled', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const snapshot = service.getReputationSnapshot('user-123');
      expect(snapshot).toBeNull();
    });

    it('should disable history when feature is off', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'false';
      resetFeatureFlags();

      const history = service.getTrustHistory('user-123', 30);
      expect(history).toBeNull();
    });

    it('should disable portability when feature is off', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'false';
      resetFeatureFlags();

      const portability = service.checkPortability('user-123', 'MARKET_0', ['MARKET_1']);
      expect(portability).toBeNull();
    });
  });

  describe('Reputation Snapshot', () => {
    beforeEach(() => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return valid snapshot structure', () => {
      const snapshot = service.getReputationSnapshot('struct-user');

      expect(snapshot).not.toBeNull();
      expect(snapshot!.snapshotId).toBeDefined();
      expect(snapshot!.userId).toBe('struct-user');
      expect(snapshot!.timestamp).toBeDefined();
      expect(snapshot!.trustLevel).toBeDefined();
      expect(snapshot!.trustScore).toBeGreaterThanOrEqual(0);
      expect(snapshot!.trustScore).toBeLessThanOrEqual(100);
      expect(snapshot!.signals).toBeInstanceOf(Array);
      expect(snapshot!.marketScores).toBeInstanceOf(Array);
      expect(snapshot!.decayIndicators).toBeInstanceOf(Array);
      expect(snapshot!.portabilityStatus).toBeDefined();
      expect(snapshot!.explanation).toBeDefined();
    });

    it('should include market-specific scores', () => {
      const snapshot = service.getReputationSnapshot('market-user');

      expect(snapshot!.marketScores.length).toBeGreaterThan(0);
      snapshot!.marketScores.forEach((ms) => {
        expect(ms.market).toBeDefined();
        expect(ms.trustLevel).toBeDefined();
        expect(ms.trustScore).toBeGreaterThanOrEqual(0);
        expect(ms.transactionCount).toBeGreaterThanOrEqual(0);
        expect(ms.positiveRate).toBeGreaterThanOrEqual(0);
        expect(ms.positiveRate).toBeLessThanOrEqual(1);
      });
    });

    it('should include explanation with factors', () => {
      const snapshot = service.getReputationSnapshot('explain-user');

      expect(snapshot!.explanation.summary).toBeDefined();
      expect(snapshot!.explanation.positiveFactors).toBeInstanceOf(Array);
      expect(snapshot!.explanation.negativeFactors).toBeInstanceOf(Array);
      expect(snapshot!.explanation.improvementTips).toBeInstanceOf(Array);
    });
  });

  describe('Trust History', () => {
    beforeEach(() => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return valid history structure', () => {
      const history = service.getTrustHistory('hist-struct-user', 14);

      expect(history).not.toBeNull();
      expect(history!.userId).toBe('hist-struct-user');
      expect(history!.requestId).toBeDefined();
      expect(history!.timestamp).toBeDefined();
      expect(history!.history).toBeInstanceOf(Array);
      expect(history!.trend).toBeDefined();
      expect(history!.disclaimer).toBeDefined();
    });

    it('should respect days parameter', () => {
      const history7 = service.getTrustHistory('days-user', 7);
      const history14 = service.getTrustHistory('days-user', 14);

      expect(history7!.history.length).toBeLessThanOrEqual(7);
      expect(history14!.history.length).toBeLessThanOrEqual(14);
    });

    it('should include trend analysis', () => {
      const history = service.getTrustHistory('trend-user', 30);

      expect(history!.trend.direction).toMatch(/^(IMPROVING|STABLE|DECLINING)$/);
      expect(typeof history!.trend.changePercent).toBe('number');
      expect(history!.trend.periodDays).toBeGreaterThan(0);
      expect(history!.trend.explanation).toBeDefined();
    });
  });

  describe('Cross-Market Portability', () => {
    beforeEach(() => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return valid portability structure', () => {
      const portability = service.checkPortability('port-struct-user', 'MARKET_0', [
        'MARKET_1',
        'MARKET_2',
      ]);

      expect(portability).not.toBeNull();
      expect(portability!.sourceMarket).toBe('MARKET_0');
      expect(portability!.targetMarkets.length).toBe(2);
      expect(typeof portability!.overallPortable).toBe('boolean');
      expect(portability!.portabilityScore).toBeGreaterThanOrEqual(0);
      expect(portability!.portabilityScore).toBeLessThanOrEqual(100);
      expect(portability!.explanation).toBeDefined();
    });

    it('should include requirements and blockers', () => {
      const portability = service.checkPortability('req-user', 'MARKET_0', ['MARKET_1']);

      portability!.targetMarkets.forEach((tm) => {
        expect(tm.requirements).toBeInstanceOf(Array);
        expect(tm.blockers).toBeInstanceOf(Array);
        expect(typeof tm.isPortable).toBe('boolean');
        expect(tm.portabilityPercent).toBeGreaterThanOrEqual(0);
        expect(tm.portabilityPercent).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Decay Indicators', () => {
    beforeEach(() => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should include visible decay indicators', () => {
      const snapshot = service.getReputationSnapshot('decay-user');

      expect(snapshot!.decayIndicators).toBeInstanceOf(Array);
      snapshot!.decayIndicators.forEach((di) => {
        expect(di.id).toBeDefined();
        expect(di.type).toBeDefined();
        expect(typeof di.currentValue).toBe('number');
        expect(typeof di.thresholdValue).toBe('number');
        expect(typeof di.decayRate).toBe('number');
        expect(typeof di.daysUntilDecay).toBe('number');
        expect(di.explanation).toBeDefined();
        expect(di.preventionTip).toBeDefined();
      });
    });
  });

  describe('Health Check', () => {
    it('should return healthy when enabled', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'false';
      resetFeatureFlags();

      const health = service.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.featureFlags.trustReputationEnabled).toBe(true);
      expect(health.featureFlags.emergencyDisabled).toBe(false);
    });

    it('should return degraded when disabled', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'false';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'false';
      resetFeatureFlags();

      const health = service.getHealth();

      expect(health.status).toBe('degraded');
      expect(health.featureFlags.trustReputationEnabled).toBe(false);
    });

    it('should return disabled when emergency disabled', () => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const health = service.getHealth();

      expect(health.status).toBe('disabled');
      expect(health.featureFlags.emergencyDisabled).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should log snapshot creation', () => {
      service.getReputationSnapshot('audit-user-1');

      const logs = service.getAuditLog('audit-user-1');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('SNAPSHOT_CREATED');
      expect(logs[0].userId).toBe('audit-user-1');
    });

    it('should log history queries', () => {
      service.getTrustHistory('audit-user-2', 7);

      const logs = service.getAuditLog('audit-user-2');
      expect(logs.some((l) => l.action === 'HISTORY_QUERIED')).toBe(true);
    });

    it('should log portability checks', () => {
      service.checkPortability('audit-user-3', 'MARKET_0', ['MARKET_1']);

      const logs = service.getAuditLog('audit-user-3');
      expect(logs.some((l) => l.action === 'PORTABILITY_CHECKED')).toBe(true);
    });

    it('should not log content, only metadata', () => {
      service.getReputationSnapshot('audit-content-user');

      const logs = service.getAuditLog('audit-content-user');
      logs.forEach((log) => {
        expect(log).not.toHaveProperty('trustScore');
        expect(log).not.toHaveProperty('signals');
        expect(log).not.toHaveProperty('rawData');
      });
    });
  });

  describe('No Side Effects', () => {
    beforeEach(() => {
      process.env.FF_TRUST_REPUTATION_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should not modify external state on snapshot', () => {
      const before = service.getReputationSnapshot('side-effect-user');
      service.getReputationSnapshot('side-effect-user');
      service.getReputationSnapshot('side-effect-user');
      const after = service.getReputationSnapshot('side-effect-user');

      expect(before!.trustScore).toBe(after!.trustScore);
    });

    it('should not modify external state on history query', () => {
      const before = service.getReputationSnapshot('history-side-user');
      service.getTrustHistory('history-side-user', 30);
      service.getTrustHistory('history-side-user', 30);
      const after = service.getReputationSnapshot('history-side-user');

      expect(before!.trustScore).toBe(after!.trustScore);
    });

    it('should not modify external state on portability check', () => {
      const before = service.getReputationSnapshot('port-side-user');
      service.checkPortability('port-side-user', 'MARKET_0', ['MARKET_1', 'MARKET_2']);
      const after = service.getReputationSnapshot('port-side-user');

      expect(before!.trustScore).toBe(after!.trustScore);
    });
  });
});
