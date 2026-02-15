/**
 * Signal Advisory Service
 * Voice / Camera / Signals (Advisory-Only)
 *
 * HARD RULES:
 * - Feature flags OFF by default
 * - Explicit session-level consent required
 * - Ephemeral processing only
 * - No raw audio/video persistence
 * - No cross-session memory
 * - No ML training from signals
 */

import { createHash, randomUUID } from 'crypto';
import { getFeatureFlags } from '../config/feature-flags';
import {
  SignalType,
  AdvisoryOutputType,
  SignalSession,
  SessionStatus,
  SessionConsent,
  VoiceAdvisoryInput,
  CameraAdvisoryInput,
  SignalAdvisoryResult,
  AdvisoryContent,
  SignalDisclaimer,
  SignalAuditEntry,
  SignalRateLimits,
  SignalKillSwitch,
  SignalAdvisoryHealth,
  CreateSessionResponse,
  SessionStatusResponse,
  SessionConstraints,
} from '../types/signal-advisory.types';

// ===========================================
// Constants
// ===========================================

const SESSION_TTL_MINUTES = 15;
const MAX_SESSIONS_PER_USER = 3;
const VOICE_REQUESTS_PER_MINUTE = 10;
const CAMERA_REQUESTS_PER_MINUTE = 5;
const SESSIONS_PER_HOUR = 10;
const CONSENT_VERSION = '1.0.0';
const MAX_AUDIT_LOG = 500;

// ===========================================
// In-Memory Stores (Ephemeral Only)
// ===========================================

// Active sessions (auto-expire)
const activeSessions: Map<string, SignalSession> = new Map();

// Rate limiting counters
const userRequestCounts: Map<string, { voice: number; camera: number; lastReset: number }> = new Map();
const userSessionCounts: Map<string, { count: number; lastReset: number }> = new Map();

// Audit log (in-memory, capped, no content)
const auditLog: SignalAuditEntry[] = [];

// Kill switches
const killSwitch: SignalKillSwitch = {
  voiceEnabled: true,
  cameraEnabled: true,
  globalEnabled: true,
};

// ===========================================
// Disclaimer Generator
// ===========================================

function generateDisclaimer(): SignalDisclaimer {
  return {
    type: 'SIGNAL_ADVISORY',
    text: 'This is advisory only. No media is stored. No cross-session memory. No ML training. Human confirmation required for all actions.',
    noMediaPersistence: true,
    noCrossSessionMemory: true,
    noMLTraining: true,
    humanConfirmationRequired: true,
    ephemeralOnly: true,
  };
}

// ===========================================
// Signal Advisory Service
// ===========================================

export class SignalAdvisoryService {
  /**
   * Create a new advisory session with explicit consent
   */
  createSession(
    userId: string,
    signalType: SignalType,
    consent: SessionConsent
  ): CreateSessionResponse | null {
    const flags = getFeatureFlags();

    // Check feature flags
    if (flags.EMERGENCY_DISABLE_ALL || !flags.SIGNAL_ADVISORY_ENABLED) {
      return null;
    }

    // Check signal-specific flags
    if (signalType === 'VOICE' && !flags.VOICE_ADVISORY_ENABLED) return null;
    if (signalType === 'CAMERA' && !flags.CAMERA_ADVISORY_ENABLED) return null;

    // Check kill switches
    if (!killSwitch.globalEnabled) return null;
    if (signalType === 'VOICE' && !killSwitch.voiceEnabled) return null;
    if (signalType === 'CAMERA' && !killSwitch.cameraEnabled) return null;

    // Validate consent
    if (!consent.consentGiven) return null;

    // Check session rate limit
    if (!this.checkSessionRateLimit(userId)) return null;

    // Check max concurrent sessions
    const userSessions = this.getUserActiveSessions(userId);
    if (userSessions.length >= MAX_SESSIONS_PER_USER) {
      // Expire oldest session
      const oldest = userSessions.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];
      this.terminateSession(oldest.sessionId);
    }

    // Create session
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MINUTES * 60 * 1000);

    const session: SignalSession = {
      sessionId: `sig_${randomUUID()}`,
      userId,
      signalType,
      consentTimestamp: consent.consentTimestamp,
      consentVersion: CONSENT_VERSION,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'ACTIVE',
      optedOut: false,
    };

    activeSessions.set(session.sessionId, session);
    this.incrementSessionCount(userId);

    return {
      session,
      disclaimer: generateDisclaimer(),
      constraints: this.getSessionConstraints(),
    };
  }

  /**
   * Process voice advisory request
   * EPHEMERAL - No audio storage
   */
  processVoiceAdvisory(input: VoiceAdvisoryInput): SignalAdvisoryResult | null {
    const flags = getFeatureFlags();

    if (flags.EMERGENCY_DISABLE_ALL || !flags.SIGNAL_ADVISORY_ENABLED || !flags.VOICE_ADVISORY_ENABLED) {
      return null;
    }

    if (!killSwitch.globalEnabled || !killSwitch.voiceEnabled) return null;

    // Validate session
    const session = this.validateSession(input.sessionId, 'VOICE');
    if (!session) return null;

    // Check rate limit
    if (!this.checkRequestRateLimit(session.userId, 'VOICE')) return null;

    // Process transcript (deterministic, no ML)
    const advisory = this.generateVoiceAdvisory(input);

    // Log audit (no content)
    this.logAudit({
      id: `audit_${Date.now()}`,
      sessionId: input.sessionId,
      userId: session.userId,
      signalType: 'VOICE',
      outputType: advisory.outputType,
      consentTimestamp: session.consentTimestamp,
      processedAt: new Date().toISOString(),
      inputHash: this.hashInput(input.transcript),
      success: true,
    });

    return advisory;
  }

  /**
   * Process camera advisory request
   * EPHEMERAL - No image storage
   */
  processCameraAdvisory(input: CameraAdvisoryInput): SignalAdvisoryResult | null {
    const flags = getFeatureFlags();

    if (flags.EMERGENCY_DISABLE_ALL || !flags.SIGNAL_ADVISORY_ENABLED || !flags.CAMERA_ADVISORY_ENABLED) {
      return null;
    }

    if (!killSwitch.globalEnabled || !killSwitch.cameraEnabled) return null;

    // Validate session
    const session = this.validateSession(input.sessionId, 'CAMERA');
    if (!session) return null;

    // Check rate limit
    if (!this.checkRequestRateLimit(session.userId, 'CAMERA')) return null;

    // Process features (deterministic, no ML)
    const advisory = this.generateCameraAdvisory(input);

    // Log audit (no content)
    this.logAudit({
      id: `audit_${Date.now()}`,
      sessionId: input.sessionId,
      userId: session.userId,
      signalType: 'CAMERA',
      outputType: advisory.outputType,
      consentTimestamp: session.consentTimestamp,
      processedAt: new Date().toISOString(),
      inputHash: this.hashInput(JSON.stringify(input.extractedFeatures)),
      success: true,
    });

    return advisory;
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): SessionStatusResponse | null {
    const session = activeSessions.get(sessionId);
    if (!session) return null;

    // Check expiry
    this.checkAndExpireSession(session);

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime());

    return {
      session,
      remainingTimeSeconds: Math.floor(remainingMs / 1000),
      canProcess: session.status === 'ACTIVE' && !session.optedOut,
      reason: session.status !== 'ACTIVE' ? `Session ${session.status.toLowerCase()}` : undefined,
    };
  }

  /**
   * Opt out of session (full opt-out enforcement)
   */
  optOut(sessionId: string): boolean {
    const session = activeSessions.get(sessionId);
    if (!session) return false;

    session.status = 'OPTED_OUT';
    session.optedOut = true;

    this.logAudit({
      id: `audit_${Date.now()}`,
      sessionId,
      userId: session.userId,
      signalType: session.signalType,
      outputType: 'INTENT_CLARIFICATION',
      consentTimestamp: session.consentTimestamp,
      processedAt: new Date().toISOString(),
      success: true,
    });

    return true;
  }

  /**
   * Terminate session
   */
  terminateSession(sessionId: string): boolean {
    const session = activeSessions.get(sessionId);
    if (!session) return false;

    session.status = 'TERMINATED';
    activeSessions.delete(sessionId);
    return true;
  }

  /**
   * Get health status
   */
  getHealth(): SignalAdvisoryHealth {
    const flags = getFeatureFlags();

    // Clean expired sessions
    this.cleanExpiredSessions();

    return {
      status: flags.EMERGENCY_DISABLE_ALL ? 'disabled' : 
              (killSwitch.globalEnabled ? 'healthy' : 'degraded'),
      timestamp: new Date().toISOString(),
      activeSessions: activeSessions.size,
      killSwitch: { ...killSwitch },
      featureFlags: {
        signalAdvisoryEnabled: flags.SIGNAL_ADVISORY_ENABLED,
        voiceAdvisoryEnabled: flags.VOICE_ADVISORY_ENABLED,
        cameraAdvisoryEnabled: flags.CAMERA_ADVISORY_ENABLED,
        emergencyDisabled: flags.EMERGENCY_DISABLE_ALL,
      },
      rateLimits: this.getRateLimits(),
    };
  }

  /**
   * Activate kill switch
   */
  activateKillSwitch(type: 'VOICE' | 'CAMERA' | 'GLOBAL', reason: string): void {
    if (type === 'VOICE') killSwitch.voiceEnabled = false;
    else if (type === 'CAMERA') killSwitch.cameraEnabled = false;
    else killSwitch.globalEnabled = false;

    killSwitch.reason = reason;
    killSwitch.disabledAt = new Date().toISOString();
  }

  /**
   * Get audit log (no content)
   */
  getAuditLog(sessionId?: string): SignalAuditEntry[] {
    if (sessionId) {
      return auditLog.filter((e) => e.sessionId === sessionId);
    }
    return [...auditLog];
  }

  // ===========================================
  // Private Methods
  // ===========================================

  private validateSession(sessionId: string, expectedType: SignalType): SignalSession | null {
    const session = activeSessions.get(sessionId);
    if (!session) return null;
    if (session.signalType !== expectedType) return null;
    if (session.optedOut) return null;

    this.checkAndExpireSession(session);
    if (session.status !== 'ACTIVE') return null;

    return session;
  }

  private checkAndExpireSession(session: SignalSession): void {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now >= expiresAt && session.status === 'ACTIVE') {
      session.status = 'EXPIRED';
    }
  }

  private cleanExpiredSessions(): void {
    const now = new Date();
    for (const [id, session] of activeSessions) {
      const expiresAt = new Date(session.expiresAt);
      if (now >= expiresAt) {
        session.status = 'EXPIRED';
        activeSessions.delete(id);
      }
    }
  }

  private getUserActiveSessions(userId: string): SignalSession[] {
    const sessions: SignalSession[] = [];
    for (const session of activeSessions.values()) {
      if (session.userId === userId && session.status === 'ACTIVE') {
        sessions.push(session);
      }
    }
    return sessions;
  }

  private checkSessionRateLimit(userId: string): boolean {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const counts = userSessionCounts.get(userId);

    if (!counts || now - counts.lastReset > hourMs) {
      userSessionCounts.set(userId, { count: 1, lastReset: now });
      return true;
    }

    if (counts.count >= SESSIONS_PER_HOUR) return false;
    counts.count++;
    return true;
  }

  private incrementSessionCount(userId: string): void {
    const counts = userSessionCounts.get(userId);
    if (counts) counts.count++;
  }

  private checkRequestRateLimit(userId: string, type: SignalType): boolean {
    const now = Date.now();
    const minuteMs = 60 * 1000;
    const counts = userRequestCounts.get(userId);

    if (!counts || now - counts.lastReset > minuteMs) {
      userRequestCounts.set(userId, { voice: 0, camera: 0, lastReset: now });
    }

    const current = userRequestCounts.get(userId)!;
    const limit = type === 'VOICE' ? VOICE_REQUESTS_PER_MINUTE : CAMERA_REQUESTS_PER_MINUTE;
    const count = type === 'VOICE' ? current.voice : current.camera;

    if (count >= limit) return false;

    if (type === 'VOICE') current.voice++;
    else current.camera++;

    return true;
  }

  private getRateLimits(): SignalRateLimits {
    return {
      voiceRequestsPerMinute: VOICE_REQUESTS_PER_MINUTE,
      cameraRequestsPerMinute: CAMERA_REQUESTS_PER_MINUTE,
      sessionsPerHour: SESSIONS_PER_HOUR,
      maxSessionDurationMinutes: SESSION_TTL_MINUTES,
    };
  }

  private getSessionConstraints(): SessionConstraints {
    return {
      maxDurationMinutes: SESSION_TTL_MINUTES,
      autoExpireEnabled: true,
      consentRequired: true,
      noMediaPersistence: true,
    };
  }

  private generateVoiceAdvisory(input: VoiceAdvisoryInput): SignalAdvisoryResult {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 min expiry

    // Deterministic intent clarification based on keywords
    const advisory: AdvisoryContent = {
      clarifiedIntent: {
        originalInput: input.transcript,
        clarifiedIntent: this.clarifyIntent(input.transcript),
        confidence: this.assessConfidence(input.transcript),
        alternatives: this.generateAlternatives(input.transcript),
        requiresHumanConfirmation: true,
      },
    };

    return {
      sessionId: input.sessionId,
      outputType: 'INTENT_CLARIFICATION',
      advisory,
      disclaimer: generateDisclaimer(),
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  private generateCameraAdvisory(input: CameraAdvisoryInput): SignalAdvisoryResult {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    const features = input.extractedFeatures;

    const advisory: AdvisoryContent = {
      itemDescription: {
        suggestedTitle: this.generateTitle(features),
        suggestedDescription: this.generateDescription(features),
        suggestedCategory: features.categoryHint,
        suggestedCondition: features.conditionHints?.[0],
        requiresHumanReview: true,
      },
    };

    return {
      sessionId: input.sessionId,
      outputType: 'ITEM_DESCRIPTION',
      advisory,
      disclaimer: generateDisclaimer(),
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  // Deterministic helpers (no ML)
  private clarifyIntent(transcript: string): string {
    const lower = transcript.toLowerCase();
    if (lower.includes('buy') || lower.includes('purchase')) return 'Purchase item';
    if (lower.includes('sell') || lower.includes('list')) return 'List item for sale';
    if (lower.includes('ship') || lower.includes('deliver')) return 'Arrange delivery';
    if (lower.includes('price') || lower.includes('cost')) return 'Check pricing';
    return 'General inquiry';
  }

  private assessConfidence(transcript: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const words = transcript.split(/\s+/).length;
    if (words < 3) return 'LOW';
    if (words < 10) return 'MEDIUM';
    return 'HIGH';
  }

  private generateAlternatives(transcript: string): string[] {
    const lower = transcript.toLowerCase();
    const alternatives: string[] = [];
    if (lower.includes('item')) alternatives.push('Browse items', 'Search catalog');
    if (lower.includes('help')) alternatives.push('Contact support', 'View FAQ');
    return alternatives.slice(0, 3);
  }

  private generateTitle(features: CameraAdvisoryInput['extractedFeatures']): string {
    const parts: string[] = [];
    if (features.categoryHint) parts.push(features.categoryHint);
    if (features.objectLabels?.[0]) parts.push(features.objectLabels[0]);
    return parts.join(' - ') || 'Item';
  }

  private generateDescription(features: CameraAdvisoryInput['extractedFeatures']): string {
    const parts: string[] = [];
    if (features.extractedText) parts.push(features.extractedText);
    if (features.conditionHints?.length) parts.push(`Condition: ${features.conditionHints[0]}`);
    if (features.dominantColors?.length) parts.push(`Colors: ${features.dominantColors.join(', ')}`);
    return parts.join('. ') || 'No description available';
  }

  private hashInput(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 16);
  }

  private logAudit(entry: SignalAuditEntry): void {
    auditLog.push(entry);
    if (auditLog.length > MAX_AUDIT_LOG) {
      auditLog.shift();
    }
  }

  /**
   * Reset for testing
   */
  static reset(): void {
    activeSessions.clear();
    userRequestCounts.clear();
    userSessionCounts.clear();
    auditLog.length = 0;
    killSwitch.voiceEnabled = true;
    killSwitch.cameraEnabled = true;
    killSwitch.globalEnabled = true;
    killSwitch.reason = undefined;
    killSwitch.disabledAt = undefined;
  }
}

export const signalAdvisoryService = new SignalAdvisoryService();
