/**
 * Trust & Reputation Types
 * ADVISORY ONLY - No Score Mutation
 *
 * HARD RULES:
 * - No enforcement
 * - No auto-ranking
 * - No hidden penalties
 * - Deterministic only
 * - Read-only snapshots
 */

// ===========================================
// Trust Level Types
// ===========================================

export type TrustLevel = 'NEW' | 'BASIC' | 'VERIFIED' | 'TRUSTED' | 'ELITE';

export type TrustSignalType =
  | 'TRANSACTION_COMPLETED'
  | 'POSITIVE_REVIEW'
  | 'NEGATIVE_REVIEW'
  | 'DISPUTE_RESOLVED'
  | 'DISPUTE_LOST'
  | 'VERIFICATION_COMPLETED'
  | 'ACCOUNT_AGE'
  | 'RESPONSE_TIME'
  | 'CANCELLATION';

// ===========================================
// Reputation Snapshot
// ===========================================

export interface ReputationSnapshot {
  snapshotId: string;
  userId: string;
  timestamp: string;
  trustLevel: TrustLevel;
  trustScore: number; // 0-100, READ-ONLY
  signals: TrustSignal[];
  marketScores: MarketTrustScore[];
  decayIndicators: TrustDecayIndicator[];
  portabilityStatus: CrossMarketPortability;
  explanation: TrustExplanation;
  disclaimer: TrustDisclaimer;
}

export interface TrustSignal {
  id: string;
  type: TrustSignalType;
  timestamp: string;
  market: string;
  corridor?: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  weight: number; // 0-10
  description: string;
  isVisible: true; // Always visible - no hidden signals
}

// ===========================================
// Market-Specific Trust
// ===========================================

export interface MarketTrustScore {
  market: string;
  trustLevel: TrustLevel;
  trustScore: number;
  transactionCount: number;
  positiveRate: number;
  lastActivity: string;
  isPortable: boolean;
  portabilityReason?: string;
}

// ===========================================
// Trust Decay Indicators
// ===========================================

export interface TrustDecayIndicator {
  id: string;
  type: DecayType;
  currentValue: number;
  thresholdValue: number;
  decayRate: number; // Per day
  daysUntilDecay: number;
  explanation: string;
  preventionTip: string;
}

export type DecayType =
  | 'INACTIVITY'
  | 'RESPONSE_TIME_DEGRADATION'
  | 'CANCELLATION_RATE_INCREASE'
  | 'REVIEW_SCORE_DECLINE';

// ===========================================
// Cross-Market Portability
// ===========================================

export interface CrossMarketPortability {
  sourceMarket: string;
  targetMarkets: MarketPortabilityStatus[];
  overallPortable: boolean;
  portabilityScore: number; // 0-100
  explanation: string;
}

export interface MarketPortabilityStatus {
  market: string;
  isPortable: boolean;
  portabilityPercent: number; // How much trust transfers
  requirements: string[];
  blockers: string[];
}

// ===========================================
// Trust History
// ===========================================

export interface TrustHistoryEntry {
  snapshotId: string;
  timestamp: string;
  trustLevel: TrustLevel;
  trustScore: number;
  changeFromPrevious: number;
  changeReason: string;
  signals: TrustSignal[];
}

export interface TrustHistoryResult {
  userId: string;
  requestId: string;
  timestamp: string;
  history: TrustHistoryEntry[];
  trend: TrustTrend;
  disclaimer: TrustDisclaimer;
}

export interface TrustTrend {
  direction: 'IMPROVING' | 'STABLE' | 'DECLINING';
  changePercent: number;
  periodDays: number;
  explanation: string;
}

// ===========================================
// Trust Explanation
// ===========================================

export interface TrustExplanation {
  summary: string;
  positiveFactors: ExplanationFactor[];
  negativeFactors: ExplanationFactor[];
  improvementTips: string[];
  nextLevelRequirements?: NextLevelRequirement[];
}

export interface ExplanationFactor {
  factor: string;
  impact: string;
  weight: number;
}

export interface NextLevelRequirement {
  requirement: string;
  currentProgress: number;
  targetValue: number;
  progressPercent: number;
}

// ===========================================
// Disclaimer
// ===========================================

export interface TrustDisclaimer {
  type: 'TRUST_ADVISORY';
  text: string;
  isAdvisoryOnly: true;
  noEnforcement: true;
  noAutoRanking: true;
  noHiddenPenalties: true;
  allSignalsVisible: true;
  timestamp: string;
}

// ===========================================
// Audit Types
// ===========================================

export interface TrustAuditEntry {
  id: string;
  snapshotId: string;
  userId: string;
  action: 'SNAPSHOT_CREATED' | 'HISTORY_QUERIED' | 'PORTABILITY_CHECKED';
  timestamp: string;
  requestedBy?: string;
  metadata?: Record<string, unknown>;
}

// ===========================================
// Health Types
// ===========================================

export interface TrustReputationHealth {
  status: 'healthy' | 'degraded' | 'disabled';
  timestamp: string;
  featureFlags: {
    trustReputationEnabled: boolean;
    emergencyDisabled: boolean;
  };
  snapshotCount: number;
  version: string;
}
