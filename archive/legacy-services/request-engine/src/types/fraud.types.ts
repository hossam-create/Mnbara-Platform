/**
 * Fraud Detection Types
 * 
 * Type definitions for fraud detection system.
 */

// ============================================================================
// Enums
// ============================================================================

export enum FraudCheckType {
  USER_REGISTRATION = 'USER_REGISTRATION',
  PAYMENT_CREATION = 'PAYMENT_CREATION',
  PAYOUT_REQUEST = 'PAYOUT_REQUEST',
  DISPUTE_OPENING = 'DISPUTE_OPENING'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum FraudAction {
  ALLOW = 'ALLOW',
  REVIEW = 'REVIEW',
  BLOCK = 'BLOCK'
}

export enum FraudFlag {
  // Velocity flags
  HIGH_REQUEST_VELOCITY = 'HIGH_REQUEST_VELOCITY',
  HIGH_ACCOUNT_CREATION_VELOCITY = 'HIGH_ACCOUNT_CREATION_VELOCITY',
  
  // Amount flags
  HIGH_PAYMENT_AMOUNT = 'HIGH_PAYMENT_AMOUNT',
  PAYOUT_EXCEEDS_BALANCE = 'PAYOUT_EXCEEDS_BALANCE',
  
  // Pattern flags
  NEW_USER_IMMEDIATE_PAYOUT = 'NEW_USER_IMMEDIATE_PAYOUT',
  DUPLICATE_ACCOUNT_DETAILS = 'DUPLICATE_ACCOUNT_DETAILS',
  
  // Behavioral flags
  HIGH_CANCELLATION_RATE = 'HIGH_CANCELLATION_RATE',
  HIGH_DISPUTE_RATE = 'HIGH_DISPUTE_RATE',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN'
}

// ============================================================================
// Interfaces
// ============================================================================

export interface FraudCheckContext {
  userId?: number;
  ipAddress: string;
  userAgent?: string;
  amount?: number;
  accountDetails?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface FraudCheckResult {
  riskScore: number;          // 0-100
  riskLevel: RiskLevel;
  flags: FraudFlag[];
  action: FraudAction;
  reasons: string[];
  metadata?: Record<string, any>;
}

export interface FraudAlert {
  id?: number;
  userId?: number;
  ipAddress: string;
  checkType: FraudCheckType;
  riskScore: number;
  riskLevel: RiskLevel;
  flags: FraudFlag[];
  action: FraudAction;
  reasons: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface VelocityCheck {
  count: number;
  windowMs: number;
  threshold: number;
  exceeded: boolean;
}

export interface BehavioralMetrics {
  totalRequests: number;
  cancelledRequests: number;
  cancellationRate: number;
  totalDisputes: number;
  disputeRate: number;
}

// ============================================================================
// Configuration
// ============================================================================

export interface FraudDetectionConfig {
  // Velocity thresholds
  maxRequestsPerUser: number;
  requestVelocityWindowMs: number;
  maxAccountsPerIP: number;
  accountCreationWindowMs: number;
  
  // Amount thresholds
  highPaymentThreshold: number;
  
  // Pattern thresholds
  newUserPayoutWindowMs: number;
  
  // Behavioral thresholds
  highCancellationRateThreshold: number;
  highDisputeRateThreshold: number;
  
  // Risk scoring
  velocityRiskWeight: number;
  amountRiskWeight: number;
  patternRiskWeight: number;
  behavioralRiskWeight: number;
  
  // Actions
  reviewThreshold: number;
  blockThreshold: number;
  
  // Features
  enableWebhooks: boolean;
  enableAutoBlock: boolean;
}

export const DEFAULT_FRAUD_CONFIG: FraudDetectionConfig = {
  // Velocity
  maxRequestsPerUser: 5,
  requestVelocityWindowMs: 10 * 60 * 1000, // 10 minutes
  maxAccountsPerIP: 3,
  accountCreationWindowMs: 24 * 60 * 60 * 1000, // 24 hours
  
  // Amount
  highPaymentThreshold: 1000, // $1000
  
  // Pattern
  newUserPayoutWindowMs: 24 * 60 * 60 * 1000, // 24 hours
  
  // Behavioral
  highCancellationRateThreshold: 0.5, // 50%
  highDisputeRateThreshold: 0.3, // 30%
  
  // Risk scoring
  velocityRiskWeight: 0.3,
  amountRiskWeight: 0.25,
  patternRiskWeight: 0.25,
  behavioralRiskWeight: 0.2,
  
  // Actions
  reviewThreshold: 50,
  blockThreshold: 75,
  
  // Features
  enableWebhooks: true,
  enableAutoBlock: true
};
