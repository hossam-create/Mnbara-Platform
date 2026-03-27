export interface TemporalWindow {
  hours24: number;
  days7: number;
  days30: number;
  days90: number;
}

export interface SellerActivityMetrics {
  sellerId: number;
  timestamp: Date;
  
  // Order metrics
  ordersCount: TemporalWindow;
  orderVelocity: TemporalWindow; // orders per hour/day
  
  // Claim metrics
  claimsCount: TemporalWindow;
  claimRate: TemporalWindow; // claims per order
  
  // Refund metrics
  refundsCount: TemporalWindow;
  refundRate: TemporalWindow; // refunds per order
  
  // Dispute metrics
  escrowDisputesCount: TemporalWindow;
  disputeRate: TemporalWindow; // disputes per order
  
  // Trust score metrics
  trustScoreDeltas: TemporalWindow;
  trustScoreVolatility: number; // standard deviation of score changes
  
  // Offer metrics
  offersMadeCount: TemporalWindow;
  offersRejectedCount: TemporalWindow;
  offerRejectionRate: TemporalWindow;
}

export type PatternType = 
  | 'VOLUME_SPIKE'
  | 'REFUND_CLUSTERING'
  | 'DISPUTE_BURST'
  | 'TRUST_SCORE_VOLATILITY'
  | 'OFFER_ABUSE'
  | 'TEMPORAL_ANOMALY'
  | 'MULTI_ACCOUNT_SIGNALS';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DetectedPattern {
  patternType: PatternType;
  timeWindow: keyof TemporalWindow;
  severity: SeverityLevel;
  confidence: number; // 0.0 - 1.0
  riskContribution: number; // 0.0 - 1.0
  explanation: string;
  recommendations: string[];
  detectedAt: Date;
  metadata?: Record<string, any>;
}

export interface BehaviorRiskScore {
  sellerId: number;
  behaviorRiskScore: number; // 0.0 - 1.0
  behaviorRiskLevel: SeverityLevel;
  detectedPatterns: DetectedPattern[];
  evaluationTimestamp: Date;
  correlationMetadata?: {
    aiTrust001Score?: number;
    correlationCoefficient?: number;
    explanation?: string;
  };
}

export interface PatternDetectionConfig {
  volumeSpikeThreshold: number; // percentage increase
  refundClusteringWindow: number; // hours
  disputeBurstThreshold: number; // disputes per hour
  trustScoreVolatilityThreshold: number; // standard deviation
  offerRejectionRateThreshold: number; // percentage
  temporalAnomalyZScore: number; // z-score threshold
}

export interface BehaviorEvaluationRequest {
  sellerId: number;
  timeWindows?: Partial<TemporalWindow>;
  configOverrides?: Partial<PatternDetectionConfig>;
}

export interface BehaviorEvaluationResponse {
  success: boolean;
  data?: BehaviorRiskScore;
  error?: string;
  evaluationTimeMs: number;
}

export interface PatternEvaluationResult {
  patterns: DetectedPattern[];
  metrics: SellerActivityMetrics;
}