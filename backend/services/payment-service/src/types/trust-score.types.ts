export interface TrustScoreConfig {
  // Component weights (must sum to 100)
  weights: {
    accountMaturity: number;
    transactionHistory: number;
    disputeHistory: number;
    behavioralStability: number;
    trustEvents: number;
  };
  
  // Decay configuration
  decay: {
    penaltyHalfLifeDays: number; // Days for penalty to decay by 50%
    recoveryRatePerDay: number; // Daily recovery percentage
    maxDailyRecovery: number; // Maximum points recoverable per day
  };
  
  // Thresholds
  thresholds: {
    highTrust: number; // Score >= this is considered high trust
    mediumTrust: number; // Score >= this is considered medium trust
    criticalPenalty: number; // Penalty amount that triggers critical status
  };
  
  // Time windows for analysis (days)
  timeWindows: {
    shortTerm: number; // 7 days
    mediumTerm: number; // 30 days
    longTerm: number; // 90 days
    historical: number; // 365 days
  };
}

export interface TrustScoreComponents {
  // Raw component scores (0-100 scale)
  accountMaturity: number;
  transactionHistory: number;
  disputeHistory: number;
  behavioralStability: number;
  trustEvents: number;
  
  // Weighted contributions to final score
  contributions: {
    accountMaturity: number;
    transactionHistory: number;
    disputeHistory: number;
    behavioralStability: number;
    trustEvents: number;
  };
}

export interface TrustScoreResult {
  sellerId: number;
  score: number; // 0-100
  level: TrustScoreLevel;
  components: TrustScoreComponents;
  trend: TrustScoreTrend;
  volatility: number; // 0-1 scale, higher = more volatile
  explanation: string;
  eventReferences: string[]; // IDs of events that influenced this score
  calculatedAt: Date;
  validUntil: Date; // When this score should be recalculated
}

export type TrustScoreLevel = 'CRITICAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';
export type TrustScoreTrend = 'DECLINING' | 'STABLE' | 'IMPROVING';

export interface TrustScoreHistory {
  sellerId: number;
  snapshots: TrustScoreSnapshot[];
  summary: TrustScoreHistorySummary;
}

export interface TrustScoreSnapshot {
  score: number;
  level: TrustScoreLevel;
  calculatedAt: Date;
  reason?: string; // Reason for score change
  eventReferences?: string[]; // Events that caused change
}

export interface TrustScoreHistorySummary {
  currentScore: number;
  score7dAgo: number;
  score30dAgo: number;
  score90dAgo: number;
  delta7d: number;
  delta30d: number;
  delta90d: number;
  trend: TrustScoreTrend;
  volatilityIndex: number; // 0-1 scale
  totalEvents: number;
  positiveEvents: number;
  negativeEvents: number;
}

export interface TrustScoreRequest {
  sellerId: number;
  forceRecalculate?: boolean;
  configOverrides?: Partial<TrustScoreConfig>;
}

export interface TrustScoreMetrics {
  sellerId: number;
  
  // Account metrics
  accountAgeDays: number;
  verificationLevel: number; // 0-3 scale
  
  // Transaction metrics
  totalOrders: number;
  completedOrders: number;
  successRate: number; // 0-1
  
  // Protection metrics
  claimsCount: number;
  claimsRate: number; // claims per order
  refundsCount: number;
  refundRate: number; // refunds per order
  
  // Dispute metrics
  disputesInitiated: number;
  disputesReceived: number;
  disputeResolutionRate: number; // 0-1
  
  // Trust events
  positiveEvents: number;
  negativeEvents: number;
  manualFlags: number;
  
  // Temporal metrics (last 30 days)
  recentOrders: number;
  recentSuccessRate: number;
  recentClaims: number;
  recentDisputes: number;
  
  // Calculated at
  calculatedAt: Date;
}

export interface TrustEvent {
  id: string;
  type: TrustEventType;
  impact: number; // -100 to +100
  description: string;
  occurredAt: Date;
  expiresAt?: Date; // When this event stops affecting score
  metadata?: Record<string, any>;
}

export type TrustEventType = 
  | 'ORDER_COMPLETED'
  | 'ORDER_FAILED'
  | 'CLAIM_FILED'
  | 'CLAIM_RESOLVED'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_RESOLVED'
  | 'REFUND_ISSUED'
  | 'POSITIVE_RATING'
  | 'NEGATIVE_RATING'
  | 'MANUAL_ADJUSTMENT'
  | 'ACCOUNT_VERIFICATION'
  | 'SUSPICIOUS_ACTIVITY'
  | 'PLATFORM_VIOLATION';

export interface TrustScoreHealth {
  status: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
  service: string;
  version: string;
  lastCalculation: Date;
  totalSellersScored: number;
  averageCalculationTimeMs: number;
  errorRate: number;
  dependencies: {
    database: boolean;
    eventService: boolean;
    metricsService: boolean;
  };
}