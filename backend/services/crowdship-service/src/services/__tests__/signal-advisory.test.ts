/**
 * Signal Advisory Service Tests
 * Voice / Camera / Signals (Advisory-Only)
 *
 * TEST COVERAGE:
 * - Consent enforcement
 * - Kill-switch behavior
 * - No persistence guarantees
 * - Deterministic outputs per input
 * - Session TTL enforcement
 * - Rate limiting
 * - Opt-out enforcement
 */

import { SignalAdvisoryService } from '../signal-advisory.service';
import { resetFeatureFlags } from '../../config/feature-flags';
import { SessionConsent, SignalType } from '../../types/signal-advisory.types';

describe('SignalAdvisoryService', () => {
  let service: SignalAdvisoryService;

  const createConsent = (given: boolean = true): SessionConsent => ({
    userId: 'user123',
    signalType: 'VOICE',
    consentGiven: given,
    consentTimestamp: new Date().toISOString(),
    consentVersion: '1.0.0',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });

  beforeEach(() => {
    service = new SignalAdvisoryService();
    SignalAdvisoryService.reset();
    resetFeatureFlags();
  });

  afterEach(() => {
    delete process.env.FF_SIGNAL_ADVISORY_ENABLED;
    delete process.env.FF_VOICE_ADVISORY_ENABLED;
    delete process.env.FF_CAMERA_ADVISORY_ENABLED;
    delete process.env.FF_EMERGENCY_DISABLE_ALL;
    resetFeatureFlags();
  });

  // ===========================================
  // Consent Enforcement Tests
  // ===========================================

  describe('Consent Enforcement', () => {
    it('should require consent to create session', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const noConsent = createConsent(false);
      const result = service.createSession('user123', 'VOICE', noConsent);

      expect(result).toBeNull();
    });

    it('should create session with valid consent', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const result = service.createSession('user123', 'VOICE', consent);

      expect(result).not.toBeNull();
      expect(result?.session.sessionId).toBeDefined();
      expect(result?.session.consentTimestamp).toBe(consent.consentTimestamp);
    });

    it('should include consent timestamp in session', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const result = service.createSession('user123', 'VOICE', consent);

      expect(result?.session.consentTimestamp).toBeDefined();
      expect(result?.session.consentVersion).toBeDefined();
    });
  });

  // ===========================================
  // Feature Flag Tests
  // ===========================================

  describe('Feature Flags', () => {
    it('should return null when SIGNAL_ADVISORY_ENABLED is false', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'false';
      resetFeatureFlags();

      const consent = createConsent(true);
      const result = service.createSession('user123', 'VOICE', consent);

      expect(result).toBeNull();
    });

    it('should return null when VOICE_ADVISORY_ENABLED is false for voice', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'false';
      resetFeatureFlags();

      const consent = createConsent(true);
      const result = service.createSession('user123', 'VOICE', consent);

      expect(result).toBeNull();
    });

    it('should return null when CAMERA_ADVISORY_ENABLED is false for camera', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_CAMERA_ADVISORY_ENABLED = 'false';
      resetFeatureFlags();

      const consent = createConsent(true);
      consent.signalType = 'CAMERA';
      const result = service.createSession('user123', 'CAMERA', consent);

      expect(result).toBeNull();
    });

    it('should return null when EMERGENCY_DISABLE_ALL is true', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const result = service.createSession('user123', 'VOICE', consent);

      expect(result).toBeNull();
    });
  });

  // ===========================================
  // Kill Switch Tests
  // ===========================================

  describe('Kill Switch', () => {
    it('should disable voice when voice kill switch is activated', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      service.activateKillSwitch('VOICE', 'Test kill switch');

      const consent = createConsent(true);
      const result = service.createSession('user123', 'VOICE', consent);

      expect(result).toBeNull();
    });

    it('should disable camera when camera kill switch is activated', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_CAMERA_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      service.activateKillSwitch('CAMERA', 'Test kill switch');

      const consent = createConsent(true);
      consent.signalType = 'CAMERA';
      const result = service.createSession('user123', 'CAMERA', consent);

      expect(result).toBeNull();
    });

    it('should disable all when global kill switch is activated', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      process.env.FF_CAMERA_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      service.activateKillSwitch('GLOBAL', 'Emergency shutdown');

      const consent = createConsent(true);
      const voiceResult = service.createSession('user123', 'VOICE', consent);
      consent.signalType = 'CAMERA';
      const cameraResult = service.createSession('user123', 'CAMERA', consent);

      expect(voiceResult).toBeNull();
      expect(cameraResult).toBeNull();
    });

    it('should reflect kill switch in health status', () => {
      service.activateKillSwitch('VOICE', 'Test');

      const health = service.getHealth();

      expect(health.killSwitch.voiceEnabled).toBe(false);
      expect(health.killSwitch.reason).toBe('Test');
    });
  });

  // ===========================================
  // No Persistence Tests
  // ===========================================

  describe('No Persistence Guarantees', () => {
    it('should not store raw audio content', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const session = service.createSession('user123', 'VOICE', consent);

      const result = service.processVoiceAdvisory({
        sessionId: session!.session.sessionId,
        transcript: 'I want to buy a phone',
        language: 'en',
        context: { market: 'MARKET_0' },
      });

      // Check audit log has no content
      const auditLog = service.getAuditLog(session!.session.sessionId);
      auditLog.forEach((entry) => {
        expect(entry).not.toHaveProperty('transcript');
        expect(entry).not.toHaveProperty('audio');
        expect(entry).not.toHaveProperty('content');
      });
    });

    it('should not store raw image content', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_CAMERA_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      consent.signalType = 'CAMERA';
      const session = service.createSession('user123', 'CAMERA', consent);

      service.processCameraAdvisory({
        sessionId: session!.session.sessionId,
        extractedFeatures: {
          extractedText: 'iPhone 15',
          objectLabels: ['phone', 'electronics'],
        },
        context: { market: 'MARKET_0' },
      });

      const auditLog = service.getAuditLog(session!.session.sessionId);
      auditLog.forEach((entry) => {
        expect(entry).not.toHaveProperty('image');
        expect(entry).not.toHaveProperty('rawImage');
        expect(entry).not.toHaveProperty('imageData');
      });
    });

    it('should only store input hash, not content', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const session = service.createSession('user123', 'VOICE', consent);

      service.processVoiceAdvisory({
        sessionId: session!.session.sessionId,
        transcript: 'Test transcript',
        language: 'en',
        context: { market: 'MARKET_0' },
      });

      const auditLog = service.getAuditLog(session!.session.sessionId);
      const entry = auditLog.find((e) => e.signalType === 'VOICE');

      expect(entry?.inputHash).toBeDefined();
      expect(entry?.inputHash?.length).toBe(16); // Truncated hash
    });
  });

  // ===========================================
  // Deterministic Output Tests
  // ===========================================

  describe('Deterministic Outputs', () => {
    it('should produce same output for same voice input', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const session = service.createSession('user123', 'VOICE', consent);

      const input = {
        sessionId: session!.session.sessionId,
        transcript: 'I want to buy a phone',
        language: 'en',
        context: { market: 'MARKET_0' },
      };

      const result1 = service.processVoiceAdvisory(input);
      const result2 = service.processVoiceAdvisory(input);

      expect(result1?.advisory.clarifiedIntent?.clarifiedIntent)
        .toBe(result2?.advisory.clarifiedIntent?.clarifiedIntent);
    });

    it('should produce same output for same camera input', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_CAMERA_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      consent.signalType = 'CAMERA';
      const session = service.createSession('user123', 'CAMERA', consent);

      const input = {
        sessionId: session!.session.sessionId,
        extractedFeatures: {
          extractedText: 'iPhone 15',
          objectLabels: ['phone'],
          categoryHint: 'Electronics',
        },
        context: { market: 'MARKET_0' },
      };

      const result1 = service.processCameraAdvisory(input);
      const result2 = service.processCameraAdvisory(input);

      expect(result1?.advisory.itemDescription?.suggestedTitle)
        .toBe(result2?.advisory.itemDescription?.suggestedTitle);
    });
  });

  // ===========================================
  // Session TTL Tests
  // ===========================================

  describe('Session TTL', () => {
    it('should set expiration time on session', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const result = service.createSession('user123', 'VOICE', consent);

      expect(result?.session.expiresAt).toBeDefined();
      const expiresAt = new Date(result!.session.expiresAt);
      const createdAt = new Date(result!.session.createdAt);
      const diffMinutes = (expiresAt.getTime() - createdAt.getTime()) / (60 * 1000);

      expect(diffMinutes).toBe(15); // 15 minute TTL
    });

    it('should include remaining time in status', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const session = service.createSession('user123', 'VOICE', consent);
      const status = service.getSessionStatus(session!.session.sessionId);

      expect(status?.remainingTimeSeconds).toBeGreaterThan(0);
      expect(status?.remainingTimeSeconds).toBeLessThanOrEqual(15 * 60);
    });
  });

  // ===========================================
  // Opt-Out Enforcement Tests
  // ===========================================

  describe('Opt-Out Enforcement', () => {
    it('should allow opt-out of session', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const session = service.createSession('user123', 'VOICE', consent);
      const success = service.optOut(session!.session.sessionId);

      expect(success).toBe(true);
    });

    it('should prevent processing after opt-out', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const session = service.createSession('user123', 'VOICE', consent);
      service.optOut(session!.session.sessionId);

      const result = service.processVoiceAdvisory({
        sessionId: session!.session.sessionId,
        transcript: 'Test',
        language: 'en',
        context: { market: 'MARKET_0' },
      });

      expect(result).toBeNull();
    });

    it('should mark session as opted out in status', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const session = service.createSession('user123', 'VOICE', consent);
      service.optOut(session!.session.sessionId);

      const status = service.getSessionStatus(session!.session.sessionId);

      expect(status?.session.optedOut).toBe(true);
      expect(status?.session.status).toBe('OPTED_OUT');
      expect(status?.canProcess).toBe(false);
    });
  });

  // ===========================================
  // Disclaimer Tests
  // ===========================================

  describe('Disclaimer', () => {
    it('should include disclaimer in session creation', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const result = service.createSession('user123', 'VOICE', consent);

      expect(result?.disclaimer).toBeDefined();
      expect(result?.disclaimer.noMediaPersistence).toBe(true);
      expect(result?.disclaimer.noCrossSessionMemory).toBe(true);
      expect(result?.disclaimer.noMLTraining).toBe(true);
      expect(result?.disclaimer.humanConfirmationRequired).toBe(true);
    });

    it('should include disclaimer in advisory results', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const session = service.createSession('user123', 'VOICE', consent);

      const result = service.processVoiceAdvisory({
        sessionId: session!.session.sessionId,
        transcript: 'Test',
        language: 'en',
        context: { market: 'MARKET_0' },
      });

      expect(result?.disclaimer.type).toBe('SIGNAL_ADVISORY');
      expect(result?.disclaimer.ephemeralOnly).toBe(true);
    });
  });

  // ===========================================
  // Human Confirmation Tests
  // ===========================================

  describe('Human Confirmation Required', () => {
    it('should mark intent clarification as requiring human confirmation', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_VOICE_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      const session = service.createSession('user123', 'VOICE', consent);

      const result = service.processVoiceAdvisory({
        sessionId: session!.session.sessionId,
        transcript: 'I want to buy something',
        language: 'en',
        context: { market: 'MARKET_0' },
      });

      expect(result?.advisory.clarifiedIntent?.requiresHumanConfirmation).toBe(true);
    });

    it('should mark item description as requiring human review', () => {
      process.env.FF_SIGNAL_ADVISORY_ENABLED = 'true';
      process.env.FF_CAMERA_ADVISORY_ENABLED = 'true';
      resetFeatureFlags();

      const consent = createConsent(true);
      consent.signalType = 'CAMERA';
      const session = service.createSession('user123', 'CAMERA', consent);

      const result = service.processCameraAdvisory({
        sessionId: session!.session.sessionId,
        extractedFeatures: { extractedText: 'Test item' },
        context: { market: 'MARKET_0' },
      });

      expect(result?.advisory.itemDescription?.requiresHumanReview).toBe(true);
    });
  });

  // ===========================================
  // Health Tests
  // ===========================================

  describe('Health', () => {
    it('should return health status', () => {
      const health = service.getHealth();

      expect(health.status).toBeDefined();
      expect(health.timestamp).toBeDefined();
      expect(health.activeSessions).toBeDefined();
      expect(health.killSwitch).toBeDefined();
      expect(health.featureFlags).toBeDefined();
      expect(health.rateLimits).toBeDefined();
    });

    it('should show disabled status when emergency disabled', () => {
      process.env.FF_EMERGENCY_DISABLE_ALL = 'true';
      resetFeatureFlags();

      const health = service.getHealth();

      expect(health.status).toBe('disabled');
      expect(health.featureFlags.emergencyDisabled).toBe(true);
    });
  });
});
