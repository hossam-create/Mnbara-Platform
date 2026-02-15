/**
 * AI Core Nucleus Types
 * Deterministic, read-only advisory system
 * NO execution, NO payments, NO auto-actions
 */

// Intent Classification
export enum IntentType {
  BUY = 'BUY',
  SELL = 'SELL',
  EXCHANGE = 'EXCHANGE',
  TRANSFER = 'TRANSFER',
  UNKNOWN = 'UNKNOWN',
}

export enum IntentConfidence {
  HIGH = 'HIGH',       // >= 0.8
  MEDIUM = 'MEDIUM',   // >= 0.5
  LOW = 'LOW',         // < 0.5
}

export interface IntentClassification {
  type: IntentType;
  confidence: number;
  confidenceLevel: IntentConfidence;
  signals: IntentSignal[];
  timestamp: string;
}

export interface IntentSignal {
  source: string;
  weight: number;
  value: string;
}

// Trust Scoring
export enum TrustLevel {
  VERIFIED = 'VERIFIED',     // >= 80
  TRUSTED = 'TRUSTED',       // >= 60
  STANDARD = 'STANDARD',     // >= 40
  NEW = 'NEW',               // >= 20
  RESTRICTED = 'RESTRICTED', // < 20
}

export interface TrustScore {
  userId: string;
  score: number;
  level: TrustLevel;
  factors: TrustFactor[];
  computedAt: string;
}

export interface TrustFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
}

// Risk Assessment
export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  MINIMAL = 'MINIMAL',
}

export interface RiskAssessment {
  transactionId: string;
  overallRisk: RiskLevel;
  riskScore: number;
  factors: RiskFactor[];
  flags: RiskFlag[];
  assessedAt: string;
}

export interface RiskFactor {
  category: string;
  score: number;
  weight: number;
  description: string;
}

export interface RiskFlag {
  code: string;
  severity: RiskLevel;
  message: string;
  recommendation: string;
}

// User Matching
export interface MatchCandidate {
  userId: string;
  matchScore: number;
  trustScore: number;
  compatibility: CompatibilityFactors;
  recommendation: MatchRecommendation;
}

export interface CompatibilityFactors {
  locationScore: number;
  historyScore: number;
  preferenceScore: number;
  availabilityScore: number;
}

export enum MatchRecommendation {
  HIGHLY_RECOMMENDED = 'HIGHLY_RECOMMENDED',
  RECOMMENDED = 'RECOMMENDED',
  ACCEPTABLE = 'ACCEPTABLE',
  CAUTION = 'CAUTION',
  NOT_RECOMMENDED = 'NOT_RECOMMENDED',
}

// Decision Recommendation
export interface DecisionRecommendation {
  requestId: string;
  action: RecommendedAction;
  confidence: number;
  reasoning: ReasoningStep[];
  alternatives: AlternativeAction[];
  warnings: string[];
  generatedAt: string;
}

export enum RecommendedAction {
  PROCEED = 'PROCEED',
  PROCEED_WITH_CAUTION = 'PROCEED_WITH_CAUTION',
  REQUIRE_VERIFICATION = 'REQUIRE_VERIFICATION',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  DECLINE = 'DECLINE',
}

export interface ReasoningStep {
  step: number;
  factor: string;
  evaluation: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export interface AlternativeAction {
  action: RecommendedAction;
  conditions: string[];
  tradeoffs: string[];
}

// Audit Trail
export interface AuditEntry {
  id: string;
  timestamp: string;
  operation: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  processingTimeMs: number;
  version: string;
}

// Request/Response Types
export interface ClassifyIntentRequest {
  userId: string;
  context: TransactionContext;
  signals: Record<string, string>;
}

export interface TransactionContext {
  itemId?: string;
  itemCategory?: string;
  amount?: number;
  currency?: string;
  counterpartyId?: string;
  metadata?: Record<string, unknown>;
}

export interface AssessRiskRequest {
  transactionId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  itemDetails: ItemDetails;
}

export interface ItemDetails {
  id: string;
  category: string;
  condition: string;
  price: number;
  description: string;
}

export interface MatchUsersRequest {
  requesterId: string;
  intent: IntentType;
  criteria: MatchCriteria;
  limit: number;
}

export interface MatchCriteria {
  location?: LocationCriteria;
  priceRange?: PriceRange;
  categories?: string[];
  minTrustScore?: number;
}

export interface LocationCriteria {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface GetRecommendationRequest {
  requestId: string;
  userId: string;
  intent: IntentType;
  transactionContext: TransactionContext;
  trustScores: { buyer: TrustScore; seller: TrustScore };
  riskAssessment: RiskAssessment;
}

// Health Check
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: HealthCheck[];
  timestamp: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  responseTimeMs: number;
  message?: string;
}
