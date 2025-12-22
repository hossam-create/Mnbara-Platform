// AI-OPS-004: Monitoring, Drift & Explainability Governance Layer Types

export interface DriftSeverity {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number; // 0.0 - 1.0
  explanation: string;
  affectedComponents: string[];
}

export interface ScoreDistributionDrift {
  component: 'AI_RISK_SCORE' | 'BEHAVIOR_RISK_SCORE' | 'TRUST_SCORE';
  period1: {
    start: Date;
    end: Date;
    mean: number;
    median: number;
    stdDev: number;
    sampleSize: number;
  };
  period2: {
    start: Date;
    end: Date;
    mean: number;
    median: number;
    stdDev: number;
    sampleSize: number;
  };
  driftMetrics: {
    meanDifference: number;
    stdDevRatio: number;
    ksStatistic: number; // Kolmogorov-Smirnov test statistic
    pValue: number;
    effectSize: number; // Cohen's d
  };
  severity: DriftSeverity;
}

export interface RiskLevelDrift {
  component: 'AI_RISK_LEVEL' | 'BEHAVIOR_RISK_LEVEL' | 'TRUST_LEVEL';
  period1: {
    start: Date;
    end: Date;
    distribution: Record<string, number>; // Level -> count
    total: number;
  };
  period2: {
    start: Date;
    end: Date;
    distribution: Record<string, number>;
    total: number;
  };
  driftMetrics: {
    chiSquare: number;
    pValue: number;
    cramersV: number; // Effect size for categorical data
    significantShifts: Array<{
      level: string;
      change: number; // percentage change
      direction: 'INCREASE' | 'DECREASE';
    }>;
  };
  severity: DriftSeverity;
}

export interface DecisionAggressivenessDrift {
  period1: {
    start: Date;
    end: Date;
    escalationDistribution: Record<string, number>;
    recommendationDistribution: Record<string, number>;
    totalDecisions: number;
  };
  period2: {
    start: Date;
    end: Date;
    escalationDistribution: Record<string, number>;
    recommendationDistribution: Record<string, number>;
    totalDecisions: number;
  };
  driftMetrics: {
    escalationChiSquare: number;
    recommendationChiSquare: number;
    escalationPValue: number;
    recommendationPValue: number;
    significantEscalationShifts: Array<{
      level: string;
      change: number;
      direction: 'INCREASE' | 'DECREASE';
    }>;
  };
  severity: DriftSeverity;
}

export interface PatternFrequencyDrift {
  patternType: string;
  period1: {
    start: Date;
    end: Date;
    frequency: number;
    totalEvaluations: number;
  };
  period2: {
    start: Date;
    end: Date;
    frequency: number;
    totalEvaluations: number;
  };
  driftMetrics: {
    frequencyChange: number;
    relativeChange: number; // percentage
    zScore: number;
    pValue: number;
  };
  severity: DriftSeverity;
}

export interface DriftDetectionResult {
  timestamp: Date;
  timeComparison: {
    period1: { start: Date; end: Date; };
    period2: { start: Date; end: Date; };
  };
  scoreDistributionDrifts: ScoreDistributionDrift[];
  riskLevelDrifts: RiskLevelDrift[];
  decisionAggressivenessDrifts: DecisionAggressivenessDrift[];
  patternFrequencyDrifts: PatternFrequencyDrift[];
  overallSeverity: DriftSeverity;
  summary: {
    totalDriftsDetected: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    mostAffectedComponent: string;
  };
}

export interface AccuracyClassification {
  type: 'FALSE_POSITIVE' | 'FALSE_NEGATIVE' | 'CORRECT_POSITIVE' | 'CORRECT_NEGATIVE';
  decisionId: string;
  sellerId: number;
  originalDecision: {
    escalationLevel: string;
    decisionScore: number;
    evaluatedAt: Date;
  };
  outcome: {
    type: 'CLAIM' | 'CLEAN' | 'MANUAL_OVERRIDE';
    occurredAt: Date;
    details?: any;
  };
  timeToOutcome: number; // hours
  confidence: number; // 0.0 - 1.0
}

export interface AccuracyMetrics {
  period: { start: Date; end: Date; };
  byRiskBand: Array<{
    band: string; // e.g., "0.0-0.3", "0.3-0.6", "0.6-0.8", "0.8-1.0"
    falsePositives: number;
    falseNegatives: number;
    correctPositives: number;
    correctNegatives: number;
    total: number;
    precision: number;
    recall: number;
    f1Score: number;
  }>;
  byRecommendationType: Record<string, {
    falsePositives: number;
    falseNegatives: number;
    correctPositives: number;
    correctNegatives: number;
    total: number;
  }>;
  byDecisionRule: Record<string, {
    falsePositives: number;
    falseNegatives: number;
    correctPositives: number;
    correctNegatives: number;
    total: number;
    precision: number;
    recall: number;
  }>;
  overall: {
    falsePositives: number;
    falseNegatives: number;
    correctPositives: number;
    correctNegatives: number;
    total: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

export interface DecisionTimelineEntry {
  decisionId: string;
  evaluatedAt: Date;
  decisionScore: number;
  escalationLevel: string;
  recommendations: string[];
  triggeredRules: string[];
  inputSnapshot: {
    aiRiskScore: number;
    behaviorRiskScore: number;
    trustScore: number;
    trustEventsCount: number;
  };
  riskContributions: Array<{
    component: string;
    contribution: number;
  }>;
  explanation: string;
  humanReadableReasoning: string;
  confidence: number;
}

export interface SellerDecisionTimeline {
  sellerId: number;
  timeline: DecisionTimelineEntry[];
  summary: {
    totalDecisions: number;
    currentEscalationLevel: string;
    lastDecisionScore: number;
    decisionTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
    volatility: number;
  };
}

export interface DecisionComparison {
  sellerId: number;
  comparisonDate1: Date;
  comparisonDate2: Date;
  decision1: DecisionTimelineEntry;
  decision2: DecisionTimelineEntry;
  differences: {
    scoreDifference: number;
    escalationChange: string | null;
    inputChanges: Array<{
      component: string;
      change: number;
      direction: 'INCREASE' | 'DECREASE';
    }>;
    ruleChanges: Array<{
      rule: string;
      wasTriggered: boolean;
      nowTriggered: boolean;
    }>;
    explanation: string;
  };
}

export interface AIHealthMetrics {
  date: Date;
  stabilityScore: number; // 0-100
  driftSeverityIndex: number; // 0-100
  confidenceDecay: number; // 0-1
  recommendationEntropy: number; // 0-1
  manualOverrideRate: number; // 0-1
  evaluationVolume: number;
  errorRate: number;
  averageEvaluationTimeMs: number;
}

export interface AIHealthScore {
  timestamp: Date;
  score: number; // 0-100
  level: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  metrics: AIHealthMetrics;
  contributingFactors: Array<{
    factor: string;
    impact: number; // -100 to +100
    explanation: string;
  }>;
  recommendations: string[];
}

export interface MonitoringHealth {
  status: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
  services: {
    driftDetection: boolean;
    accuracyTracking: boolean;
    explainability: boolean;
    healthScoring: boolean;
  };
  dataAvailability: {
    decisionData: number; // percentage 0-100
    outcomeData: number;
    trustEventData: number;
  };
  lastSuccessfulRun: Date;
  errorRate: number;
  processingLatencyMs: number;
}

export interface DriftDetectionRequest {
  timeComparison: {
    period1: { start: Date; end: Date; };
    period2: { start: Date; end: Date; };
  };
  components?: string[];
  severityThreshold?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AccuracyAnalysisRequest {
  period: { start: Date; end: Date; };
  riskBands?: string[];
  minConfidence?: number;
}

export interface TimelineRequest {
  sellerId: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface ComparisonRequest {
  sellerId: number;
  date1: Date;
  date2: Date;
}