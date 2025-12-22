/**
 * Signal Advisory Types
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

// ===========================================
// Signal Types
// ===========================================

export type SignalType = 'VOICE' | 'CAMERA';

export type AdvisoryOutputType =
  | 'INTENT_CLARIFICATION'
  | 'ITEM_DESCRIPTION'
  | 'RISK_EDUCATION'
  | 'NEXT_STEP_SUGGESTION';

// ===========================================
// Session Types
// ===========================================

export interface SignalSession {
  sessionId: string;
  userId: string;
  signalType: SignalType;
  consentTimestamp: string;
  consentVersion: string;
  createdAt: string;
  expiresAt: string;
  status: SessionStatus;
  optedOut: boolean;
}

export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'OPTED_OUT' | 'TERMINATED';

export interface SessionConsent {
  userId: string;
  signalType: SignalType;
  consentGiven: boolean;
  consentTimestamp: string;
  consentVersion: string;
  expiresAt: string;
}

// ===========================================
// Advisory Input Types
// ===========================================

export interface VoiceAdvisoryInput {
  sessionId: string;
  // Transcript only - no raw audio
  transcript: string;
  language: string;
  context: AdvisoryContext;
}

export interface CameraAdvisoryInput {
  sessionId: string;
  // Extracted features only - no raw image
  extractedFeatures: ExtractedFeatures;
  context: AdvisoryContext;
}

export interface ExtractedFeatures {
  // Text extracted from image (OCR)
  extractedText?: string;
  // Object labels (generic, no faces)
  objectLabels?: string[];
  // Color palette
  dominantColors?: string[];
  // Condition assessment
  conditionHints?: string[];
  // Category suggestion
  categoryHint?: string;
}

export interface AdvisoryContext {
  market: string;
  corridor?: string;
  intentType?: string;
  currentStep?: string;
}

// ===========================================
// Advisory Output Types
// ===========================================

export interface SignalAdvisoryResult {
  sessionId: string;
  outputType: AdvisoryOutputType;
  advisory: AdvisoryContent;
  disclaimer: SignalDisclaimer;
  timestamp: string;
  expiresAt: string;
}

export interface AdvisoryContent {
  // Intent clarification
  clarifiedIntent?: IntentClarification;
  // Item description
  itemDescription?: ItemDescriptionSummary;
  // Risk education
  riskEducation?: RiskEducationHint;
  // Next step suggestion
  nextStepSuggestion?: NextStepSuggestion;
}

export interface IntentClarification {
  originalInput: string;
  clarifiedIntent: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  alternatives?: string[];
  requiresHumanConfirmation: true;
}

export interface ItemDescriptionSummary {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedCategory?: string;
  suggestedCondition?: string;
  requiresHumanReview: true;
}

export interface RiskEducationHint {
  topic: string;
  explanation: string;
  learnMoreUrl?: string;
  isAdvisoryOnly: true;
}

export interface NextStepSuggestion {
  currentStep: string;
  suggestedNextStep: string;
  explanation: string;
  requiresHumanConfirmation: true;
}

// ===========================================
// Disclaimer Types
// ===========================================

export interface SignalDisclaimer {
  type: 'SIGNAL_ADVISORY';
  text: string;
  noMediaPersistence: true;
  noCrossSessionMemory: true;
  noMLTraining: true;
  humanConfirmationRequired: true;
  ephemeralOnly: true;
}

// ===========================================
// Audit Types (No Content Storage)
// ===========================================

export interface SignalAuditEntry {
  id: string;
  sessionId: string;
  userId: string;
  signalType: SignalType;
  outputType: AdvisoryOutputType;
  consentTimestamp: string;
  processedAt: string;
  // NO content stored - only metadata
  inputHash?: string; // Hash for dedup, not content
  success: boolean;
  errorCode?: string;
}

// ===========================================
// Rate Limiting Types
// ===========================================

export interface SignalRateLimits {
  voiceRequestsPerMinute: number;
  cameraRequestsPerMinute: number;
  sessionsPerHour: number;
  maxSessionDurationMinutes: number;
}

// ===========================================
// Kill Switch Types
// ===========================================

export interface SignalKillSwitch {
  voiceEnabled: boolean;
  cameraEnabled: boolean;
  globalEnabled: boolean;
  reason?: string;
  disabledAt?: string;
}

// ===========================================
// Health Types
// ===========================================

export interface SignalAdvisoryHealth {
  status: 'healthy' | 'degraded' | 'disabled';
  timestamp: string;
  activeSessions: number;
  killSwitch: SignalKillSwitch;
  featureFlags: {
    signalAdvisoryEnabled: boolean;
    voiceAdvisoryEnabled: boolean;
    cameraAdvisoryEnabled: boolean;
    emergencyDisabled: boolean;
  };
  rateLimits: SignalRateLimits;
}

// ===========================================
// API Response Types
// ===========================================

export interface CreateSessionResponse {
  session: SignalSession;
  disclaimer: SignalDisclaimer;
  constraints: SessionConstraints;
}

export interface SessionConstraints {
  maxDurationMinutes: number;
  autoExpireEnabled: true;
  consentRequired: true;
  noMediaPersistence: true;
}

export interface SessionStatusResponse {
  session: SignalSession;
  remainingTimeSeconds: number;
  canProcess: boolean;
  reason?: string;
}
