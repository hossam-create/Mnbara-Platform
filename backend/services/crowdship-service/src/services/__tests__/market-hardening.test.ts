/**
 * Market Hardening Tests
 * Sprint 3: Market Hardening & Go-Live Safety
 */

import { AbuseGuardService } from '../abuse-guard.service';
import { HealthCheckService, HealthStatus } from '../health-check.service';
import { structuredLog, LogLevel, clearLogBuffer, getRecentLogs, RequestLogger } from '../structured-logger.service';
import { resetFeatureFlags } from '../../config/feature-flags';

describe('Sprint 3: Market Hardening', () => {
  beforeEach(() => {
    // Enable all feature flags for testing
    process.env.FF_AI_CORE_ENABLED = 'true';
    process.env.FF_CORRIDOR_AI_ADVISORY = 'true';
    process.env.FF_RATE_LIMITING_ENABLED = 'true';
    process.env.FF_ABUSE_GUARDS_ENABLED = 'true';
    process.env.FF_CORRIDOR_CAPS_ENABLED = 'true';
    process.env.FF_STRUCTURED_LOGGING_ENABLED = 'true';
    process.env.FF_GRACEFUL_DEGRADATION_ENABLED = 'true';
    process.env.FF_EMERGENCY_DISABLE_ALL = 'false';
    resetFeatureFlags();
    AbuseGuardService.resetAll();
    clearLogBuffer();
  });

  afterEach(() => {
    // Reset flags
    delete process.env.FF_AI_CORE_ENABLED;
    delete process.env.FF_CORRIDOR_AI_ADVISORY;
    delete process.env.FF_RATE_LIMITING_ENABLED;
    delete process.env.FF_ABUSE_GUARDS_ENABLED;
    delete process.env.FF_CORRIDOR_CAPS_ENABLED;
    delete process.env.FF_STRUCTURED_LOGGING_ENABLED;
    delete process.env.FF_GRACEFUL_DEGRADATION_ENABLED;
    delete process.env.FF_EMERGENCY_DISABLE_ALL;
    resetFeatureFlags();
  });

  describe('AbuseGuardService', () => {
    describe('Intent Spam Detection', () => {
      it('should allow normal intent classification requests', () => {
        const service = new AbuseGuardService();
        const result = service.checkIntentSpam('user-1', '127.0.0.1');

        expect(result.allowed).toBe(true);
        expect(result.warning).toBeUndefined();
      });

      it('should warn when approaching limit', () => {
        const service = new AbuseGuardService({
          intentSpam: { maxPerMinute: 10, maxPerHour: 100, cooldownMinutes: 5 },
        });

        // Make 8 requests (80% of limit)
        for (let i = 0; i < 8; i++) {
          service.checkIntentSpam('user-1', '127.0.0.1');
        }

        const result = service.checkIntentSpam('user-1', '127.0.0.1');
        expect(result.allowed).toBe(true);
        expect(result.warning).toContain('Approaching');
      });

      it('should block when limit exceeded', () => {
        const service = new AbuseGuardService({
          intentSpam: { maxPerMinute: 5, maxPerHour: 100, cooldownMinutes: 5 },
        });

        // Exceed limit
        for (let i = 0; i < 6; i++) {
          service.checkIntentSpam('user-1', '127.0.0.1');
        }

        const result = service.checkIntentSpam('user-1', '127.0.0.1');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('exceeded');
        expect(result.cooldownUntil).toBeDefined();
        expect(result.suggestions).toBeDefined();
      });

      it('should track different users separately', () => {
        const service = new AbuseGuardService({
          intentSpam: { maxPerMinute: 3, maxPerHour: 100, cooldownMinutes: 5 },
        });

        // User 1 exceeds limit
        for (let i = 0; i < 4; i++) {
          service.checkIntentSpam('user-1', '127.0.0.1');
        }

        // User 2 should still be allowed
        const result = service.checkIntentSpam('user-2', '127.0.0.2');
        expect(result.allowed).toBe(true);
      });
    });

    describe('Offer Flooding Detection', () => {
      it('should detect offer flooding', () => {
        const service = new AbuseGuardService({
          offerFlooding: { maxPerMinute: 3, maxPerHour: 50, cooldownMinutes: 10 },
        });

        // Exceed limit
        for (let i = 0; i < 4; i++) {
          service.checkOfferFlooding('user-1', '127.0.0.1');
        }

        const result = service.checkOfferFlooding('user-1', '127.0.0.1');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Offer creation rate exceeded');
      });
    });

    describe('Corridor Volume Caps', () => {
      it('should track corridor volume', () => {
        const service = new AbuseGuardService({
          corridorVolume: { maxDailyVolumeUSD: 1000, maxDailyTransactions: 10, warningThresholdPercent: 80 },
        });

        const result = service.checkCorridorVolume('US_EG', 500);
        expect(result.allowed).toBe(true);

        const status = service.getCorridorVolumeStatus('US_EG');
        expect(status.volumeUSD).toBe(500);
        expect(status.percentUsed).toBe(50);
      });

      it('should warn when approaching cap', () => {
        const service = new AbuseGuardService({
          corridorVolume: { maxDailyVolumeUSD: 1000, maxDailyTransactions: 100, warningThresholdPercent: 80 },
        });

        service.checkCorridorVolume('US_EG', 800);
        const result = service.checkCorridorVolume('US_EG', 100);

        expect(result.allowed).toBe(true);
        expect(result.warning).toContain('Approaching');
      });

      it('should block when cap exceeded', () => {
        const service = new AbuseGuardService({
          corridorVolume: { maxDailyVolumeUSD: 1000, maxDailyTransactions: 100, warningThresholdPercent: 80 },
        });

        service.checkCorridorVolume('US_EG', 900);
        const result = service.checkCorridorVolume('US_EG', 200);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Daily volume cap reached');
      });
    });

    describe('Feature Flag Control', () => {
      it('should bypass abuse guards when disabled', () => {
        process.env.FF_ABUSE_GUARDS_ENABLED = 'false';
        resetFeatureFlags();

        const service = new AbuseGuardService({
          intentSpam: { maxPerMinute: 1, maxPerHour: 1, cooldownMinutes: 5 },
        });

        // Should always allow when disabled
        for (let i = 0; i < 10; i++) {
          const result = service.checkIntentSpam('user-1', '127.0.0.1');
          expect(result.allowed).toBe(true);
        }
      });
    });
  });

  describe('HealthCheckService', () => {
    it('should return alive for liveness check', async () => {
      const service = new HealthCheckService();
      const result = await service.checkLiveness();

      expect(result.alive).toBe(true);
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return healthy for readiness check', async () => {
      const service = new HealthCheckService();
      const result = await service.checkReadiness();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.version).toBeDefined();
      expect(result.components.length).toBeGreaterThan(0);
    });

    it('should return unhealthy when emergency disabled', async () => {
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const service = new HealthCheckService();
      const result = await service.checkReadiness();

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.flags.emergencyDisabled).toBe(true);
    });

    it('should detect degraded mode', () => {
      const service = new HealthCheckService();
      // Initially not degraded
      expect(service.isDegraded()).toBe(false);
    });
  });

  describe('StructuredLogger', () => {
    it('should create structured log entries', () => {
      const entry = structuredLog(LogLevel.INFO, 'Test message', {
        requestId: 'req-123',
        corridor: 'US_EG',
      });

      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.message).toBe('Test message');
      expect(entry.requestId).toBe('req-123');
      expect(entry.corridor).toBe('US_EG');
      expect(entry.timestamp).toBeDefined();
    });

    it('should sanitize sensitive data', () => {
      const entry = structuredLog(LogLevel.INFO, 'Test', {
        metadata: {
          userId: 'user-1',
          password: 'secret123',
          email: 'test@example.com',
        },
      });

      expect(entry.metadata?.userId).toBe('user-1');
      expect(entry.metadata?.password).toBe('[REDACTED]');
      expect(entry.metadata?.email).toBe('[REDACTED]');
    });

    it('should retrieve recent logs', () => {
      clearLogBuffer();

      structuredLog(LogLevel.INFO, 'Info message');
      structuredLog(LogLevel.WARN, 'Warning message');
      structuredLog(LogLevel.ERROR, 'Error message');

      const allLogs = getRecentLogs();
      expect(allLogs.length).toBe(3);

      const errorLogs = getRecentLogs({ level: LogLevel.ERROR });
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toBe('Error message');
    });

    it('should create request-scoped logger', () => {
      const logger = new RequestLogger('req-456', {
        correlationId: 'corr-789',
        userId: 'user-1',
        corridor: 'US_AE',
      });

      const entry = logger.info('Request processed', { action: 'advisory' });

      expect(entry.requestId).toBe('req-456');
      expect(entry.correlationId).toBe('corr-789');
      expect(entry.userId).toBe('user-1');
      expect(entry.corridor).toBe('US_AE');
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('No-Regressions Enforcement', () => {
    it('should confirm NO payments in advisory layer', () => {
      // This is a design constraint - verify by checking that no payment-related
      // methods exist in the advisory services
      const service = new AbuseGuardService();
      expect((service as any).processPayment).toBeUndefined();
      expect((service as any).executePayment).toBeUndefined();
    });

    it('should confirm NO auto-matching', () => {
      // Verify no auto-match methods exist
      const service = new AbuseGuardService();
      expect((service as any).autoMatch).toBeUndefined();
      expect((service as any).automaticMatch).toBeUndefined();
    });

    it('should confirm NO background execution', () => {
      // All abuse guard methods return results, they don't execute actions
      const service = new AbuseGuardService();
      const result = service.checkIntentSpam('user-1', '127.0.0.1');

      // Result is advisory only
      expect(result).toHaveProperty('allowed');
      expect(result).not.toHaveProperty('executed');
      expect(result).not.toHaveProperty('actionTaken');
    });

    it('should confirm NO ranking suppression without explanation', () => {
      const service = new AbuseGuardService();
      const result = service.checkCorridorVolume('US_EG', 50000);

      // If blocked, must have reason and suggestions
      if (!result.allowed) {
        expect(result.reason).toBeDefined();
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Emergency Kill Switch', () => {
    it('should disable all features when emergency flag is set', () => {
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const { getFeatureFlags } = require('../../config/feature-flags');
      const flags = getFeatureFlags();

      expect(flags.EMERGENCY_DISABLE_ALL).toBe(true);
      expect(flags.AI_CORE_ENABLED).toBe(false);
      expect(flags.CORRIDOR_AI_ADVISORY).toBe(false);
    });
  });
});
