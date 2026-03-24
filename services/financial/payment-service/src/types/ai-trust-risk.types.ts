export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface RiskInput {
  sellerId: number;
  accountAgeDays: number;
  totalOrders: number;
  ordersLast30Days: number;
  totalDisputes: number;
  disputesLast30Days: number;
  totalRefunds: number;
  refundsLast30Days: number;
  escrowTransactions: number;
  escrowDisputes: number;
  escrollSuccessRate: number;
  lastUpdated?: Date;
}

export interface RiskFactor {
  weight: number;
  rawScore: number;
  normalizedScore: number;
  explanation: string;
}

export interface RiskComponentResult {
  accountAge: RiskFactor;
  orderVelocity: RiskFactor;
  disputeRate: RiskFactor;
  refundRatio: RiskFactor;
  escrowBehavior: RiskFactor;
}

export interface RiskScoreResult {
  sellerId: number;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  components: RiskComponentResult;
  explanation: string;
  timestamp: Date;
}

export interface RiskConfig {
  accountAgeWeight: number;
  orderVelocityWeight: number;
  disputeRateWeight: number;
  refundRatioWeight: number;
  escrowBehaviorWeight: number;
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  minOrdersForConfidence: number;
  minDaysForConfidence: number;
}

export interface RiskExplanation {
  sellerId: number;
  riskScore: number;
  riskLevel: RiskLevel;
  componentBreakdown: {
    accountAge: string;
    orderVelocity: string;
    disputeRate: string;
    refundRatio: string;
    escrowBehavior: string;
  };
  overallExplanation: string;
  recommendations?: string[];
}