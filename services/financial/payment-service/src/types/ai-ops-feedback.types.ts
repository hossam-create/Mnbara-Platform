// AI-OPS-005: Human Feedback Loop & Continuous Improvement Types

export interface HumanFeedback {
  id: string;
  decisionId: string;
  sellerId: number;
  timestamp: Date;
  
  // Human actor information
  actorId: string;
  actorRole: 'REVIEWER' | 'MANAGER' | 'ADMIN' | 'SYSTEM';
  processingTimeMs: number;
  
  // Feedback content
  overrideAction: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'MODIFY';
  overrideReason: string;
  confidenceAgreement: 'STRONGLY_AGREE' | 'AGREE' | 'NEUTRAL' | 'DISAGREE' | 'STRONGLY_DISAGREE';
  
  // Additional context
  comments?: string;
  evidenceReferences?: string[];
  riskAssessmentChange?: {
    previousScore: number;
    newScore: number;
    reason: string;
  };
  
  // System metadata
  createdAt: Date;
  updatedAt: Date;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  actorId: string;
  details?: any;
}

export interface AlignmentMetrics {
  period: {
    start: Date;
    end: Date;
  };
  
  // Agreement metrics
  agreementRate: number; // 0.0 - 1.0
  overrideFrequency: number; // 0.0 - 1.0
  averageProcessingTimeMs: number;
  
  // Mismatch analysis
  escalationMismatches: number;
  recommendationRejections: number;
  confidenceMisalignments: number;
  
  // Segmented metrics
  byRiskBand: Record<string, AlignmentBandMetrics>;
  byRule: Record<string, AlignmentRuleMetrics>;
  byRecommendationType: Record<string, AlignmentTypeMetrics>;
  bySellerSegment: Record<string, AlignmentSegmentMetrics>;
  byTimeWindow: Record<string, AlignmentTimeMetrics>;
  
  // Overall summary
  totalDecisions: number;
  totalFeedbacks: number;
  overallAlignmentScore: number; // 0-100
}

export interface AlignmentBandMetrics {
  band: string;
  agreementRate: number;
  overrideRate: number;
  escalationMismatches: number;
  sampleSize: number;
}

export interface AlignmentRuleMetrics {
  ruleId: string;
  agreementRate: number;
  overrideRate: number;
  frequentOverride: boolean;
  sampleSize: number;
}

export interface AlignmentTypeMetrics {
  type: string;
  agreementRate: number;
  rejectionRate: number;
  sampleSize: number;
}

export interface AlignmentSegmentMetrics {
  segment: string;
  agreementRate: number;
  processingTimeMs: number;
  sampleSize: number;
}

export interface AlignmentTimeMetrics {
  window: string;
  agreementRate: number;
  overrideTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  sampleSize: number;
}

export interface ImprovementSignal {
  id: string;
  signalType: 'OVERRIDDEN_RULE' | 'FALSE_NEGATIVE_CLUSTER' | 'OVER_CONSERVATIVE' | 'CONFIDENCE_CALIBRATION';
  
  // Impact assessment
  impactScore: number; // 0-100
  confidence: number; // 0.0 - 1.0
  affectedEntities: number;
  
  // Signal details
  description: string;
  evidence: string[];
  recommendations: string[];
  
  // Temporal context
  firstObserved: Date;
  lastObserved: Date;
  frequency: number; // occurrences per time period
  
  // Ranking
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rankedPosition: number;
}

export interface FeedbackTimeline {
  sellerId: number;
  timeline: FeedbackTimelineEntry[];
  summary: FeedbackTimelineSummary;
}

export interface FeedbackTimelineEntry {
  timestamp: Date;
  decisionId: string;
  aiDecision: {
    escalationLevel: string;
    decisionScore: number;
    confidence: number;
    recommendations: string[];
  };
  humanAction?: {
    actorId: string;
    action: string;
    processingTimeMs: number;
    overrideReason?: string;
  };
  outcome?: {
    type: string;
    timestamp: Date;
    success: boolean;
  };
  alignment: 'AGREEMENT' | 'DISAGREEMENT' | 'NO_FEEDBACK';
}

export interface FeedbackTimelineSummary {
  totalDecisions: number;
  totalFeedbacks: number;
  agreementRate: number;
  averageProcessingTimeMs: number;
  trend: 'IMPROVING' | 'DETERIORATING' | 'STABLE';
}

export interface FeedbackSubmissionRequest {
  decisionId: string;
  actorId: string;
  actorRole: string;
  overrideAction: string;
  overrideReason: string;
  confidenceAgreement: string;
  comments?: string;
  evidenceReferences?: string[];
}

export interface AlignmentAnalysisRequest {
  period?: string; // e.g., "7d", "30d"
  riskBand?: string;
  ruleId?: string;
  recommendationType?: string;
  sellerSegment?: string;
}

export interface FeedbackMetricsRequest {
  period?: string;
  granularity?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface ImprovementSignalsRequest {
  limit?: number;
  minConfidence?: number;
  priority?: string;
}

export interface FeedbackTimelineRequest {
  sellerId: number;
  period?: string;
  limit?: number;
  offset?: number;
}