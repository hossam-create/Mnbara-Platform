/**
 * Growth Experiments Types
 * Non-Regulated Experiments Only
 *
 * HARD RULES:
 * - Experiments MUST be isolated
 * - Feature flags OFF by default
 * - No shared state mutation
 * - No experiment can affect: payments, escrow, trust, risk, ranking, or enforcement
 */

// ===========================================
// Experiment Types (Non-Regulated Only)
// ===========================================

export type ExperimentType =
  | 'UI_COPY_VARIANT' // Text/copy changes
  | 'LAYOUT_TOGGLE' // Layout variations
  | 'INFO_PANEL' // Read-only informational panels
  | 'EDUCATION_FLOW'; // Optional education/onboarding flows

// BLOCKED experiment types (cannot be created)
export type BlockedExperimentType =
  | 'PAYMENT_FLOW'
  | 'ESCROW_LOGIC'
  | 'TRUST_SCORING'
  | 'RISK_ASSESSMENT'
  | 'RANKING_ALGORITHM'
  | 'ENFORCEMENT_RULE';

// ===========================================
// Experiment Configuration
// ===========================================

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  type: ExperimentType;
  enabled: boolean;
  killSwitch: boolean; // Per-experiment kill switch

  // Scoping
  markets: string[]; // e.g., ['MARKET_0', 'MARKET_1']
  corridors: string[]; // e.g., ['US_EG', 'UK_AE']

  // Exposure control
  exposurePercent: number; // Max 5% default, max 20% hard cap
  maxExposurePercent: number; // Hard cap

  // Cohort isolation
  cohortSeed: string; // For deterministic assignment
  excludeCohorts: string[]; // Cohorts to exclude

  // Timing
  startDate: string;
  endDate: string; // Automatic expiration
  autoDisableOnExpiry: boolean;

  // Variants
  variants: ExperimentVariant[];
  controlVariantId: string;

  // Safety
  errorThreshold: number; // Auto-disable if error rate exceeds this
  autoDisabledReason?: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // 0-100, must sum to 100 across variants
  isControl: boolean;
  config: Record<string, unknown>; // Variant-specific config
}

// ===========================================
// Experiment Assignment
// ===========================================

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  userId: string;
  cohort: string;
  assignedAt: string;
  expiresAt: string;
  isControl: boolean;
}

export interface ExperimentExposure {
  experimentId: string;
  variantId: string;
  userId: string;
  market: string;
  corridor?: string;
  exposedAt: string;
  context: ExposureContext;
}

export interface ExposureContext {
  page?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

// ===========================================
// Experiment Metrics (Aggregated Only)
// ===========================================

export interface ExperimentMetrics {
  experimentId: string;
  timestamp: string;
  period: '1h' | '24h' | '7d';
  variants: VariantMetrics[];
  totalExposures: number;
  errorRate: number;
  isHealthy: boolean;
}

export interface VariantMetrics {
  variantId: string;
  exposures: number;
  exposurePercent: number;
  // No conversion/outcome metrics - those would require tracking
}

// ===========================================
// Experiment Health
// ===========================================

export interface ExperimentHealth {
  status: 'healthy' | 'degraded' | 'disabled';
  timestamp: string;
  activeExperiments: number;
  disabledExperiments: number;
  totalExposures: number;
  errorRate: number;
  killSwitchActive: boolean;
  featureFlags: {
    experimentsEnabled: boolean;
    emergencyDisabled: boolean;
  };
}

// ===========================================
// API Response Types
// ===========================================

export interface ActiveExperimentsResponse {
  experiments: ExperimentConfig[];
  userAssignments: ExperimentAssignment[];
  timestamp: string;
  disclaimer: ExperimentDisclaimer;
}

export interface ExperimentDisclaimer {
  type: 'EXPERIMENT';
  text: string;
  noSideEffects: true;
  isolated: true;
  nonRegulated: true;
}

// ===========================================
// Audit Types
// ===========================================

export interface ExperimentAuditLog {
  id: string;
  experimentId: string;
  action: 'EXPOSURE' | 'ASSIGNMENT' | 'KILL_SWITCH' | 'AUTO_DISABLE' | 'EXPIRY';
  userId?: string;
  variantId?: string;
  reason?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
