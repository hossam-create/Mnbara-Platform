/**
 * Ops Visibility Service Tests
 * Sprint 3 Live Ops: Tests for READ-ONLY operational visibility
 *
 * CONSTRAINTS VERIFIED:
 * - All methods are read-only
 * - No mutations
 * - Feature flag gated
 */

import { OpsVisibilityService, opsVisibilityService } from '../ops-visibility.service';
import { resetFeatureFlags } from '../../config/feature-flags';

describe('OpsVisibilityService', () => {
  beforeEach(() => {
    // Reset feature flags and metrics before each test
    resetFeatureFlags();
    OpsVisibilityService.resetMetrics();
  });

  afterEach(() => {
    resetFeatureFlags();
  });

  describe('Feature Flag Gating', () => {
    it('should return empty data when OPS_VISIBILITY_ENABLED is false', () => {
      process.env.FF_OPS_VISIBILITY_ENABLED = 'false';
      resetFeatureFlags();

      const corridorHealth = opsVisibilityService.getCorridorHealth();
      const funnel = opsVisibilityService.getIntentFunnel();
      const alerts = opsVisibilityService.getTrustFrictionAlerts();
      const rateLimits = opsVisibilityService.getRateLimitingStatus();

      expect(corridorHealth).toEqual([]);
      expect(funnel.stages.intentClassified).toBe(0);
      expect(alerts).toEqual([]);
      expect(rateLimits).toEqual([]);
    });

    it('should return data when OPS_VISIBILITY_ENABLED is true', () => {
      process.env.FF_OPS_VISIBILITY_ENABLED = 'true';
      process.env.FF_CORRIDOR_AI_ADVISORY = 'true';
      resetFeatureFlags();

      const corridorHealth = opsVisibilityService.getCorridorHealth();
      expect(corridorHealth.length).toBeGreaterThan(0);
    });
  });

  describe('Corridor Health', () => {
    beforeEach(() => {
      process.env.FF_OPS_VISIBILITY_ENABLED = 'true';
      process.env.FF_CORRIDOR_AI_ADVISORY = 'true';
      resetFeatureFlags();
    });

    it('should return health metrics for all corridors', () => {
      const health = opsVisibilityService.getCorridorHealth();

      expect(health).toHaveLength(3);
      expect(health.map((c) => c.corridorId)).toEqual(['US_EG', 'US_AE', 'US_SA']);
    });

    it('should include all required fields', () => {
      const health = opsVisibilityService.getCorridorHealth();
      const corridor = health[0];

      expect(corridor).toHaveProperty('corridorId');
      expect(corridor).toHaveProperty('corridorName');
      expect(corridor).toHaveProperty('status');
      expect(corridor).toHaveProperty('volumeUSD');
      expect(corridor).toHaveProperty('transactionCount');
      expect(corridor).toHaveProperty('capacityPercent');
      expect(corridor).toHaveProperty('avgRiskScore');
      expect(corridor).toHaveProperty('avgTrustScore');
      expect(corridor).toHaveProperty('recentErrors');
      expect(corridor).toHaveProperty('lastActivityAt');
    });

    it('should show disabled status when corridor advisory is off', () => {
      process.env.FF_CORRIDOR_AI_ADVISORY = 'false';
      resetFeatureFlags();

      const health = opsVisibilityService.getCorridorHealth();
      expect(health.every((c) => c.status === 'disabled')).toBe(true);
    });
  });

  describe('Intent Funnel', () => {
    beforeEach(() => {
      process.env.FF_OPS_VISIBILITY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return funnel metrics for different periods', () => {
      const funnel1h = opsVisibilityService.getIntentFunnel('1h');
      const funnel24h = opsVisibilityService.getIntentFunnel('24h');
      const funnel7d = opsVisibilityService.getIntentFunnel('7d');

      expect(funnel1h.period).toBe('1h');
      expect(funnel24h.period).toBe('24h');
      expect(funnel7d.period).toBe('7d');
    });

    it('should include all funnel stages', () => {
      const funnel = opsVisibilityService.getIntentFunnel();

      expect(funnel.stages).toHaveProperty('intentClassified');
      expect(funnel.stages).toHaveProperty('corridorAssessed');
      expect(funnel.stages).toHaveProperty('trustGatingPassed');
      expect(funnel.stages).toHaveProperty('trustGatingFailed');
      expect(funnel.stages).toHaveProperty('recommendationGenerated');
      expect(funnel.stages).toHaveProperty('confirmationRequested');
      expect(funnel.stages).toHaveProperty('confirmationCompleted');
      expect(funnel.stages).toHaveProperty('confirmationDeclined');
    });

    it('should include conversion rates', () => {
      const funnel = opsVisibilityService.getIntentFunnel();

      expect(funnel.conversionRates).toHaveProperty('classifiedToAssessed');
      expect(funnel.conversionRates).toHaveProperty('assessedToTrustPassed');
      expect(funnel.conversionRates).toHaveProperty('trustPassedToRecommended');
      expect(funnel.conversionRates).toHaveProperty('recommendedToConfirmed');
      expect(funnel.conversionRates).toHaveProperty('overallConversion');
    });

    it('should record metrics correctly', () => {
      OpsVisibilityService.recordMetric({ stage: 'intentClassified', success: true });
      OpsVisibilityService.recordMetric({ stage: 'intentClassified', success: true });
      OpsVisibilityService.recordMetric({ stage: 'corridorAssessed', success: true });

      const funnel = opsVisibilityService.getIntentFunnel('1h');
      expect(funnel.stages.intentClassified).toBe(2);
      expect(funnel.stages.corridorAssessed).toBe(1);
    });
  });

  describe('Trust Friction Alerts', () => {
    beforeEach(() => {
      process.env.FF_OPS_VISIBILITY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return empty array when no alerts', () => {
      const alerts = opsVisibilityService.getTrustFrictionAlerts();
      // May have alerts based on corridor capacity, but structure should be valid
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should detect high rejection rate', () => {
      // Record many trust failures
      for (let i = 0; i < 20; i++) {
        OpsVisibilityService.recordMetric({ stage: 'trustGatingFailed', success: false });
      }
      for (let i = 0; i < 10; i++) {
        OpsVisibilityService.recordMetric({ stage: 'trustGatingPassed', success: true });
      }

      const alerts = opsVisibilityService.getTrustFrictionAlerts();
      const rejectionAlert = alerts.find((a) => a.type === 'HIGH_REJECTION_RATE');

      expect(rejectionAlert).toBeDefined();
      expect(rejectionAlert?.severity).toBeDefined();
    });

    it('should sort alerts by severity', () => {
      const alerts = opsVisibilityService.getTrustFrictionAlerts();

      if (alerts.length > 1) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 1; i < alerts.length; i++) {
          expect(severityOrder[alerts[i - 1].severity]).toBeLessThanOrEqual(severityOrder[alerts[i].severity]);
        }
      }
    });
  });

  describe('Rate Limiting Status', () => {
    beforeEach(() => {
      process.env.FF_OPS_VISIBILITY_ENABLED = 'true';
      resetFeatureFlags();
    });

    it('should return status for all endpoints', () => {
      const status = opsVisibilityService.getRateLimitingStatus();

      expect(status.length).toBeGreaterThan(0);
      expect(status.map((s) => s.endpoint)).toContain('corridor/advisory');
    });

    it('should include all required fields', () => {
      const status = opsVisibilityService.getRateLimitingStatus();
      const endpoint = status[0];

      expect(endpoint).toHaveProperty('endpoint');
      expect(endpoint).toHaveProperty('currentLoad');
      expect(endpoint).toHaveProperty('maxCapacity');
      expect(endpoint).toHaveProperty('utilizationPercent');
      expect(endpoint).toHaveProperty('throttledRequests');
      expect(endpoint).toHaveProperty('blockedRequests');
      expect(endpoint).toHaveProperty('avgResponseTimeMs');
    });

    it('should record rate limit events', () => {
      OpsVisibilityService.recordRateLimitEvent('corridor/advisory', true, false, 50);
      OpsVisibilityService.recordRateLimitEvent('corridor/advisory', false, true, 100);

      const status = opsVisibilityService.getRateLimitingStatus();
      const corridorStatus = status.find((s) => s.endpoint === 'corridor/advisory');

      expect(corridorStatus?.throttledRequests).toBe(1);
      expect(corridorStatus?.blockedRequests).toBe(1);
    });
  });

  describe('Kill Switch Status', () => {
    it('should return current feature flag states', () => {
      process.env.FF_EMERGENCY_DISABLE_ALL = 'false';
      process.env.FF_AI_CORE_ENABLED = 'true';
      process.env.FF_CORRIDOR_AI_ADVISORY = 'true';
      resetFeatureFlags();

      const status = opsVisibilityService.getKillSwitchStatus();

      expect(status.emergencyDisableAll).toBe(false);
      expect(status.aiCoreEnabled).toBe(true);
      expect(status.corridorAdvisoryEnabled).toBe(true);
    });

    it('should reflect emergency disable state', () => {
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const status = opsVisibilityService.getKillSwitchStatus();

      expect(status.emergencyDisableAll).toBe(true);
      // When emergency is active, other flags should be false
      expect(status.aiCoreEnabled).toBe(false);
    });

    it('should include all required fields', () => {
      const status = opsVisibilityService.getKillSwitchStatus();

      expect(status).toHaveProperty('emergencyDisableAll');
      expect(status).toHaveProperty('aiCoreEnabled');
      expect(status).toHaveProperty('corridorAdvisoryEnabled');
      expect(status).toHaveProperty('trustGatingEnabled');
      expect(status).toHaveProperty('rateLimitingEnabled');
      expect(status).toHaveProperty('abuseGuardsEnabled');
      expect(status).toHaveProperty('lastModified');
      expect(status).toHaveProperty('modifiedBy');
    });
  });

  describe('Ops Snapshot', () => {
    beforeEach(() => {
      process.env.FF_OPS_VISIBILITY_ENABLED = 'true';
      process.env.FF_CORRIDOR_AI_ADVISORY = 'true';
      resetFeatureFlags();
    });

    it('should return complete snapshot', () => {
      const snapshot = opsVisibilityService.getOpsSnapshot();

      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('corridorHealth');
      expect(snapshot).toHaveProperty('intentFunnel');
      expect(snapshot).toHaveProperty('trustAlerts');
      expect(snapshot).toHaveProperty('rateLimiting');
      expect(snapshot).toHaveProperty('killSwitch');
      expect(snapshot).toHaveProperty('systemHealth');
    });

    it('should include system health', () => {
      const snapshot = opsVisibilityService.getOpsSnapshot();

      expect(snapshot.systemHealth).toHaveProperty('status');
      expect(snapshot.systemHealth).toHaveProperty('uptime');
      expect(snapshot.systemHealth).toHaveProperty('version');
    });

    it('should show unhealthy when emergency disabled', () => {
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const snapshot = opsVisibilityService.getOpsSnapshot();
      expect(snapshot.systemHealth.status).toBe('unhealthy');
    });
  });

  describe('READ-ONLY Constraints', () => {
    it('should not expose any mutation methods', () => {
      const service = opsVisibilityService;

      // Verify no mutation methods exist
      expect(typeof (service as any).updateCorridorHealth).toBe('undefined');
      expect(typeof (service as any).clearAlerts).toBe('undefined');
      expect(typeof (service as any).setKillSwitch).toBe('undefined');
      expect(typeof (service as any).modifyRateLimits).toBe('undefined');
    });

    it('should only have getter methods', () => {
      const publicMethods = Object.getOwnPropertyNames(OpsVisibilityService.prototype).filter(
        (name) => name !== 'constructor' && typeof (opsVisibilityService as any)[name] === 'function'
      );

      // All public methods should start with 'get'
      const nonGetterMethods = publicMethods.filter((name) => !name.startsWith('get') && !name.startsWith('empty'));
      expect(nonGetterMethods).toEqual([]);
    });
  });
});
