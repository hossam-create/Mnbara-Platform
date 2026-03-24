// AI-TRUST-003: Trust Decision & Recommendation Engine Types

export interface AIRiskScoreInput {
  // From AI-TRUST-001: AI Risk Scoring
  riskScore: number; // 0.0 - 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors?: string[];
  confidence?: number; // 0.0 - 1.0
  evaluatedAt: Date;
}

export interface BehaviorRiskScoreInput {
  // From AI-TRUST-002: Behavior Analysis
  behaviorRiskScore: number; // 0.0 - 1.0
  behaviorRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedPatterns: Array<{
    patternType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    explanation: string;
  }>;
  evaluationTimestamp: Date;
}

export interface TrustScoreInput {
  // From TRS-002: Seller Trust Score
  score: number; // 0-100
  level: 'CRITICAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';
  trend: 'DECLINING' | 'STABLE' | 'IMPROVING';
  volatility: number; // 0-1
  calculatedAt: Date;
}

export interface TrustEventInput {
  // From TRUST-OPS-010: Trust Events
  id: string;
  type: string;
  impact: number; // -100 to +100
  description: string;
  occurredAt: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface OrderContextInput {
  // Optional order context
  orderValue?: number;
  orderVelocity?: number; // orders per hour/day
  buyerRiskScore?: number; // 0.0 - 1.0
  paymentMethodRisk?: number; // 0.0 - 1.0
  shippingRisk?: number; // 0.0 - 1.0
  isHighValue?: boolean;
  isFirstTimeBuyer?: boolean;
}

export interface DecisionEngineRequest {
  sellerId: number;
  aiRiskScore: AIRiskScoreInput;
  behaviorRiskScore: BehaviorRiskScoreInput;
  trustScore: TrustScoreInput;
  recentTrustEvents: TrustEventInput[];
  orderContext?: OrderContextInput;
  configOverrides?: Partial<DecisionEngineConfig>;
}

export interface DecisionEngineConfig {
  // Component weights (must sum to 1.0)
  weights: {
    aiRiskScore: number;      // 0.35
    behaviorRiskScore: number; // 0.30
    trustScore: number;       // 0.20 (inverse weight)
    trustEvents: number;      // 0.15
  };
  
  // Escalation thresholds
  escalationThresholds: {
    monitor: number;   // 0.3
    review: number;    // 0.6
    escalate: number;  // 0.8
  };
  
  // Order context modifiers
  orderContextModifiers: {
    highValueMultiplier: number;    // 1.5
    firstTimeBuyerMultiplier: number; // 1.3
    velocityPenalty: number;        // 0.1 per order/hour over threshold
  };
  
  // Time windows
  timeWindows: {
    trustEvents: number; // 30 days
    recentPatterns: number; // 7 days
  };
}

export type EscalationLevel = 'NONE' | 'MONITOR' | 'REVIEW' | 'ESCALATE';

export type RecommendationType =
  | 'ENHANCED_MONITORING'
  | 'MANUAL_REVIEW_SUGGESTED'
  | 'ESCROW_ENFORCEMENT_SUGGESTED'
  | 'TEMPORARY_GATING_SUGGESTED'
  | 'BUYER_WARNING_FLAG_SUGGESTED'
  | 'NO_ACTION_NEEDED';

export interface RiskContribution {
  component: string;
  contribution: number; // 0.0 - 1.0
  explanation: string;
}

export interface DecisionEngineResult {
  sellerId: number;
  decisionScore: number; // 0.0 - 1.0
  escalationLevel: EscalationLevel;
  confidence: number; // 0.0 - 1.0
  recommendations: RecommendationType[];
  riskContributions: RiskContribution[];
  triggeredRules: string[];
  explanation: string;
  humanReadableReasoning: string;
  inputSnapshot: {
    aiRiskScore: number;
    behaviorRiskScore: number;
    trustScore: number;
    trustEventsCount: number;
    orderContextPresent: boolean;
  };
  evaluatedAt: Date;
  validUntil: Date;
}

export interface BulkEvaluationRequest {
  evaluations: Array<{
    sellerId: number;
    aiRiskScore: AIRiskScoreInput;
    behaviorRiskScore: BehaviorRiskScoreInput;
    trustScore: TrustScoreInput;
    recentTrustEvents: TrustEventInput[];
    orderContext?: OrderContextInput;
  }>;
  configOverrides?: Partial<DecisionEngineConfig>;
}

export interface BulkEvaluationResult {
  results: DecisionEngineResult[];
  summary: {
    totalEvaluated: number;
    byEscalationLevel: Record<EscalationLevel, number>;
    averageConfidence: number;
    evaluationTimeMs: number;
  };
}

export interface DecisionRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: RecommendationType[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  weight: number;
}

export interface DecisionEngineHealth {
  status: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
  service: string;
  version: string;
  lastEvaluation: Date;
  totalEvaluations: number;
  averageEvaluationTimeMs: number;
  errorRate: number;
  ruleCount: number;
  dependencies: {
    aiRiskScoring: boolean;
    behaviorAnalysis: boolean;
    trustScoring: boolean;
    trustEvents: boolean;
  };
}