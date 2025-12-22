/**
 * Feature Flags Configuration
 * Sprint 1: AI Core Integration
 * Sprint 2: Trust-First Market Activation
 * Sprint 3: Market Hardening & Go-Live Safety
 * All flags default OFF - manual enable per environment
 */

export interface FeatureFlags {
  // Sprint 1: AI Core Integration Flags
  AI_INTENT_CLASSIFICATION: boolean;
  AI_TRUST_SCORING: boolean;
  AI_RISK_ASSESSMENT: boolean;
  AI_DECISION_RECOMMENDATIONS: boolean;
  AI_AUDIT_LOGGING: boolean;
  AI_CORE_ENABLED: boolean;

  // Sprint 2: Market Corridor Flags
  CORRIDOR_AI_ADVISORY: boolean;
  TRUST_GATING: boolean;
  INTENT_CHIP_UI: boolean;
  HUMAN_CONFIRMATION_CHECKPOINTS: boolean;

  // Sprint 3: Market Hardening Flags
  RATE_LIMITING_ENABLED: boolean;
  ABUSE_GUARDS_ENABLED: boolean;
  CORRIDOR_CAPS_ENABLED: boolean;
  STRUCTURED_LOGGING_ENABLED: boolean;
  GRACEFUL_DEGRADATION_ENABLED: boolean;
  EMERGENCY_DISABLE_ALL: boolean; // Global kill switch

  // Sprint 3 Live Ops: Visibility Flags
  OPS_VISIBILITY_ENABLED: boolean;

  // Sprint 4: Market 1 Flags
  MARKET_1_ENABLED: boolean;

  // Payment Advisory Flags (READ-ONLY)
  PAYMENT_ADVISORY_ENABLED: boolean;

  // Growth Experiments Flags (Non-Regulated)
  EXPERIMENTS_ENABLED: boolean;

  // Sprint 5: Signal Advisory Flags (Voice/Camera)
  SIGNAL_ADVISORY_ENABLED: boolean;
  VOICE_ADVISORY_ENABLED: boolean;
  CAMERA_ADVISORY_ENABLED: boolean;

  // Sprint 7: Trust & Reputation Flags (Advisory Only)
  TRUST_REPUTATION_ENABLED: boolean;

  // Sprint 8: Dispute Intelligence Flags (NO AUTOMATION)
  DISPUTE_INTEL_ENABLED: boolean;

  // Legal Module Flags (Advisory Only - No Automation)
  LEGAL_ENFORCEMENT_ON: boolean;
  REQUIRE_RECONSENT_ON_VERSION_CHANGE: boolean;
  AUDIT_LOGGING_STRICT: boolean;
}

// Default: ALL OFF
const DEFAULT_FLAGS: FeatureFlags = {
  // Sprint 1
  AI_INTENT_CLASSIFICATION: false,
  AI_TRUST_SCORING: false,
  AI_RISK_ASSESSMENT: false,
  AI_DECISION_RECOMMENDATIONS: false,
  AI_AUDIT_LOGGING: false,
  AI_CORE_ENABLED: false,
  // Sprint 2
  CORRIDOR_AI_ADVISORY: false,
  TRUST_GATING: false,
  INTENT_CHIP_UI: false,
  HUMAN_CONFIRMATION_CHECKPOINTS: false,
  // Sprint 3
  RATE_LIMITING_ENABLED: false,
  ABUSE_GUARDS_ENABLED: false,
  CORRIDOR_CAPS_ENABLED: false,
  STRUCTURED_LOGGING_ENABLED: false,
  GRACEFUL_DEGRADATION_ENABLED: false,
  EMERGENCY_DISABLE_ALL: false,
  // Sprint 3 Live Ops
  OPS_VISIBILITY_ENABLED: false,
  // Sprint 4
  MARKET_1_ENABLED: false,
  // Payment Advisory (READ-ONLY)
  PAYMENT_ADVISORY_ENABLED: false,
  // Growth Experiments (Non-Regulated)
  EXPERIMENTS_ENABLED: false,
  // Sprint 5: Signal Advisory (Voice/Camera)
  SIGNAL_ADVISORY_ENABLED: false,
  VOICE_ADVISORY_ENABLED: false,
  CAMERA_ADVISORY_ENABLED: false,
  // Sprint 7: Trust & Reputation (Advisory Only)
  TRUST_REPUTATION_ENABLED: false,
  // Sprint 8: Dispute Intelligence (NO AUTOMATION)
  DISPUTE_INTEL_ENABLED: false,

  // Legal Module Flags (Advisory Only - No Automation)
  LEGAL_ENFORCEMENT_ON: false,
  REQUIRE_RECONSENT_ON_VERSION_CHANGE: false,
  AUDIT_LOGGING_STRICT: false,
};

/**
 * Load feature flags from environment
 * Format: FEATURE_FLAG_NAME=true|false
 */
export function loadFeatureFlags(): FeatureFlags {
  // Check emergency kill switch first
  const emergencyDisable = process.env.FF_EMERGENCY_DISABLE_ALL === 'true';

  // If emergency disabled, return all flags as false except the emergency flag
  if (emergencyDisable) {
    return {
      ...DEFAULT_FLAGS,
      EMERGENCY_DISABLE_ALL: true,
    };
  }

  return {
    // Sprint 1
    AI_INTENT_CLASSIFICATION: process.env.FF_AI_INTENT_CLASSIFICATION === 'true',
    AI_TRUST_SCORING: process.env.FF_AI_TRUST_SCORING === 'true',
    AI_RISK_ASSESSMENT: process.env.FF_AI_RISK_ASSESSMENT === 'true',
    AI_DECISION_RECOMMENDATIONS: process.env.FF_AI_DECISION_RECOMMENDATIONS === 'true',
    AI_AUDIT_LOGGING: process.env.FF_AI_AUDIT_LOGGING === 'true',
    AI_CORE_ENABLED: process.env.FF_AI_CORE_ENABLED === 'true',
    // Sprint 2
    CORRIDOR_AI_ADVISORY: process.env.FF_CORRIDOR_AI_ADVISORY === 'true',
    TRUST_GATING: process.env.FF_TRUST_GATING === 'true',
    INTENT_CHIP_UI: process.env.FF_INTENT_CHIP_UI === 'true',
    HUMAN_CONFIRMATION_CHECKPOINTS: process.env.FF_HUMAN_CONFIRMATION_CHECKPOINTS === 'true',
    // Sprint 3
    RATE_LIMITING_ENABLED: process.env.FF_RATE_LIMITING_ENABLED === 'true',
    ABUSE_GUARDS_ENABLED: process.env.FF_ABUSE_GUARDS_ENABLED === 'true',
    CORRIDOR_CAPS_ENABLED: process.env.FF_CORRIDOR_CAPS_ENABLED === 'true',
    STRUCTURED_LOGGING_ENABLED: process.env.FF_STRUCTURED_LOGGING_ENABLED === 'true',
    GRACEFUL_DEGRADATION_ENABLED: process.env.FF_GRACEFUL_DEGRADATION_ENABLED === 'true',
    EMERGENCY_DISABLE_ALL: false,
    // Sprint 3 Live Ops
    OPS_VISIBILITY_ENABLED: process.env.FF_OPS_VISIBILITY_ENABLED === 'true',
    // Sprint 4
    MARKET_1_ENABLED: process.env.FF_MARKET_1_ENABLED === 'true',
    // Payment Advisory (READ-ONLY)
    PAYMENT_ADVISORY_ENABLED: process.env.FF_PAYMENT_ADVISORY_ENABLED === 'true',
    // Growth Experiments (Non-Regulated)
    EXPERIMENTS_ENABLED: process.env.FF_EXPERIMENTS_ENABLED === 'true',
    // Sprint 5: Signal Advisory (Voice/Camera)
    SIGNAL_ADVISORY_ENABLED: process.env.FF_SIGNAL_ADVISORY_ENABLED === 'true',
    VOICE_ADVISORY_ENABLED: process.env.FF_VOICE_ADVISORY_ENABLED === 'true',
    CAMERA_ADVISORY_ENABLED: process.env.FF_CAMERA_ADVISORY_ENABLED === 'true',
    // Sprint 7: Trust & Reputation (Advisory Only)
    TRUST_REPUTATION_ENABLED: process.env.FF_TRUST_REPUTATION_ENABLED === 'true',
    // Sprint 8: Dispute Intelligence (NO AUTOMATION)
    DISPUTE_INTEL_ENABLED: process.env.FF_DISPUTE_INTEL_ENABLED === 'true',

    // Legal Module Flags (Advisory Only - No Automation)
    LEGAL_ENFORCEMENT_ON: process.env.FF_LEGAL_ENFORCEMENT_ON === 'true',
    REQUIRE_RECONSENT_ON_VERSION_CHANGE: process.env.FF_REQUIRE_RECONSENT_ON_VERSION_CHANGE === 'true',
    AUDIT_LOGGING_STRICT: process.env.FF_AUDIT_LOGGING_STRICT === 'true',
  };
}

/**
 * Check if a specific AI feature is enabled
 * Requires both master switch AND specific flag
 */
export function isAIFeatureEnabled(flags: FeatureFlags, feature: keyof Omit<FeatureFlags, 'AI_CORE_ENABLED'>): boolean {
  return flags.AI_CORE_ENABLED && flags[feature];
}

// Singleton instance
let _flags: FeatureFlags | null = null;

export function getFeatureFlags(): FeatureFlags {
  if (!_flags) {
    _flags = loadFeatureFlags();
  }
  return _flags;
}

export function resetFeatureFlags(): void {
  _flags = null;
}

// Export for testing
export { DEFAULT_FLAGS };
