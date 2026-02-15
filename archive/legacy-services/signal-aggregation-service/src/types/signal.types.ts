export interface SignalMetrics {
  timestamp: Date;
  timeBucket: 'hour' | 'day';
  corridor: string;
  
  // Intent volume
  requestCount: number;
  requestGrowthRate: number;
  
  // Drop-off points
  requestCreationStarted: number;
  requestCreationCompleted: number;
  requestAbandonmentRate: number;
  
  offerReviewCount: number;
  offerResponseRate: number;
  
  negotiationStarted: number;
  negotiationCompleted: number;
  negotiationAbandonmentRate: number;
  
  travelApprovalSubmitted: number;
  travelApprovalApproved: number;
  travelApprovalRejectionRate: number;
  
  // Trust friction indicators
  kycStarted: number;
  kycCompleted: number;
  kycAbandonmentRate: number;
  
  verifiedTravelers: number;
  credibilityQuestions: number;
  
  paymentIntentCreated: number;
  paymentCompleted: number;
  paymentAbandonmentRate: number;
  
  // Confirmation abandonment
  offerAccepted: number;
  finalAbandonmentRate: number;
  
  abandonmentReasons: {
    priceChanges: number;
    timingIssues: number;
    trustConcerns: number;
    technicalIssues: number;
    unknown: number;
  };
  
  // Manual override frequency
  manualOverrides: number;
  humanArbitrationCases: number;
  
  // Threshold status
  status: 'GREEN' | 'YELLOW' | 'RED';
  statusExplanation: string;
}

export interface TimeBucket {
  start: Date;
  end: Date;
  bucketType: 'hour' | 'day';
}

export interface CorridorMetrics {
  corridor: string;
  metrics: SignalMetrics[];
  summary: {
    totalRequests: number;
    completionRate: number;
    averageAbandonment: number;
    overallStatus: 'GREEN' | 'YELLOW' | 'RED';
  };
}

export interface SignalThresholds {
  // Green thresholds
  greenMaxAbandonment: number; // < 40%
  greenMinKycCompletion: number; // > 60%
  greenMinConversion: number; // > 30%
  greenMaxErrorRate: number; // < 0.1%
  
  // Yellow thresholds
  yellowMaxAbandonment: number; // 40-60%
  yellowMinKycCompletion: number; // 40-60%
  yellowMinConversion: number; // 20-30%
  yellowMaxErrorRate: number; // 0.1-1%
  
  // Red thresholds
  redMinAbandonment: number; // > 60%
  redMaxKycCompletion: number; // < 20%
  redMaxConversion: number; // < 20%
  redMinErrorRate: number; // > 1%
}

export const DEFAULT_THRESHOLDS: SignalThresholds = {
  greenMaxAbandonment: 0.4,
  greenMinKycCompletion: 0.6,
  greenMinConversion: 0.3,
  greenMaxErrorRate: 0.001,
  
  yellowMaxAbandonment: 0.6,
  yellowMinKycCompletion: 0.4,
  yellowMinConversion: 0.2,
  yellowMaxErrorRate: 0.01,
  
  redMinAbandonment: 0.6,
  redMaxKycCompletion: 0.2,
  redMaxConversion: 0.2,
  redMinErrorRate: 0.01,
};