/**
 * Crowdship AI Service
 * Sprint 1: Frontend service for AI Core integration
 * Sprint 2: Trust-First Market Activation (US → MENA)
 * 
 * CONSTRAINTS:
 * - Read-only API calls
 * - Advisory data only
 * - Feature-flagged
 * - Human confirmation required
 */

import api from './api';

// Sprint 2: Market Intent Types
export type MarketIntent = 'BUY_FROM_ABROAD' | 'TRAVEL_MATCH' | 'PRICE_VERIFY' | 'BROWSE' | 'UNKNOWN';

export interface MarketIntentResult {
  intent: MarketIntent;
  confidence: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: Array<{ source: string; value: string; weight: number }>;
  reasoning: string;
  editable: boolean;
  timestamp: string;
}

// Sprint 2: Corridor Assessment
export interface CorridorAssessment {
  corridorId: string;
  corridorName: string;
  origin: string;
  destination: string;
  isSupported: boolean;
  riskMultiplier: number;
  valueBand: { label: string; multiplier: number };
  trustGating: TrustGatingResult;
  escrowRecommendation: EscrowRecommendation;
  restrictions: string[];
  warnings: string[];
  timestamp: string;
}

export interface TrustGatingResult {
  passed: boolean;
  buyerMeetsRequirement: boolean;
  travelerMeetsRequirement: boolean;
  requiredBuyerTrust: string;
  requiredTravelerTrust: string;
  actualBuyerTrust: string;
  actualTravelerTrust: string;
  downgradeReason?: string;
  isHighValue: boolean;
}

export interface EscrowRecommendation {
  recommended: boolean;
  required: boolean;
  reason: string;
  policy: string;
}

// Sprint 2: Recommendation Lanes
export interface RecommendationLanes {
  recommended: LaneOption[];
  saferAlternatives: LaneOption[];
  higherRiskAllowed: LaneOption[];
  whyRecommended: string[];
}

export interface LaneOption {
  action: string;
  label: string;
  description: string;
  riskLevel: string;
  conditions: string[];
  userChoiceAllowed: boolean;
}

// Sprint 2: Human Confirmation Checkpoints
export interface HumanConfirmationCheckpoint {
  checkpointId: string;
  type: 'CONTACT_TRAVELER' | 'SELECT_PAYMENT' | 'PROCEED_CROSS_BORDER';
  title: string;
  description: string;
  requiredConfirmation: boolean;
  confirmationText: string;
  warnings: string[];
}

// Sprint 2: Corridor Snapshot for Audit
export interface CorridorSnapshot {
  requestId: string;
  correlationId: string;
  timestamp: string;
  intentSnapshot: MarketIntentResult | null;
  trustSnapshot: { buyer: TrustScoreResult | null; traveler: TrustScoreResult | null };
  riskSnapshot: RiskAssessmentResult | null;
  recommendationSnapshot: RecommendationLanes | null;
  corridorAssessment: CorridorAssessment | null;
}

export interface AIRecommendationResponse {
  data: {
    offerId: number;
    buyerTrust: TrustScoreResult | null;
    travelerTrust: TrustScoreResult | null;
    riskAssessment: RiskAssessmentResult | null;
    recommendation: DecisionRecommendationResult | null;
    // Sprint 2 additions
    marketIntent?: MarketIntentResult | null;
    corridorAssessment?: CorridorAssessment | null;
    recommendationLanes?: RecommendationLanes | null;
    confirmationCheckpoints?: HumanConfirmationCheckpoint[];
  } | null;
  meta?: {
    advisory: boolean;
    disclaimer: string;
    correlationId?: string;
  };
  message?: string;
}

export interface TrustScoreResult {
  userId: string;
  role: 'BUYER' | 'TRAVELER';
  score: number;
  level: 'VERIFIED' | 'TRUSTED' | 'STANDARD' | 'NEW' | 'RESTRICTED';
  factors: Array<{ name: string; weight: number; value: number; contribution: number; explanation: string }>;
  computedAt: string;
}

export interface RiskAssessmentResult {
  requestId: string;
  overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
  riskScore: number;
  factors: Array<{ category: string; score: number; weight: number; description: string }>;
  flags: Array<{ code: string; severity: string; message: string; recommendation: string }>;
  recommendations: string[];
  assessedAt: string;
}

export interface DecisionRecommendationResult {
  requestId: string;
  travelerId: string;
  action: 'PROCEED' | 'PROCEED_WITH_ESCROW' | 'REQUIRE_VERIFICATION' | 'MANUAL_REVIEW' | 'DECLINE';
  confidence: number;
  reasoning: Array<{ step: number; factor: string; evaluation: string; impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' }>;
  warnings: string[];
  disclaimer: string;
  generatedAt: string;
}


export interface AuditEntry {
  id: string;
  timestamp: string;
  operation: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  processingTimeMs: number;
  version: string;
  correlationId: string;
}

const CROWDSHIP_API_BASE = import.meta.env.VITE_CROWDSHIP_API_URL || '/api/v1/crowdship';

/**
 * Get AI recommendation for an offer
 * Advisory only - no actions executed
 */
export async function getAIRecommendation(offerId: number, buyerId?: number): Promise<AIRecommendationResponse> {
  try {
    const params = new URLSearchParams();
    if (buyerId) params.append('buyerId', String(buyerId));
    
    const response = await api.get(`${CROWDSHIP_API_BASE}/offers/${offerId}/ai/recommendation?${params}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch AI recommendation:', error);
    return { data: null, message: 'AI features unavailable' };
  }
}

/**
 * Get AI audit logs
 * For debugging and compliance
 */
export async function getAIAuditLogs(options?: { operation?: string; limit?: number }): Promise<{ data: AuditEntry[] }> {
  try {
    const params = new URLSearchParams();
    if (options?.operation) params.append('operation', options.operation);
    if (options?.limit) params.append('limit', String(options.limit));
    
    const response = await api.get(`${CROWDSHIP_API_BASE}/offers/ai/audit?${params}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch AI audit logs:', error);
    return { data: [] };
  }
}

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return import.meta.env.VITE_AI_CORE_ENABLED === 'true';
}

/**
 * Sprint 2: Get corridor advisory for cross-border transaction
 */
export async function getCorridorAdvisory(input: {
  origin: string;
  destination: string;
  itemValueUSD: number;
  deliveryDays: number;
  buyerId: number;
  travelerId: number;
}): Promise<{ data: CorridorAssessment | null; message?: string }> {
  try {
    const response = await api.post(`${CROWDSHIP_API_BASE}/corridor/advisory`, input);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch corridor advisory:', error);
    return { data: null, message: 'Corridor advisory unavailable' };
  }
}

/**
 * Sprint 2: Classify market intent
 */
export async function classifyMarketIntent(signals: {
  pageContext?: string;
  action?: string;
  userRole?: 'buyer' | 'traveler';
  productUrl?: string;
  hasPrice?: boolean;
  isCrossBorder?: boolean;
}): Promise<{ data: MarketIntentResult | null; message?: string }> {
  try {
    const response = await api.post(`${CROWDSHIP_API_BASE}/intent/classify`, signals);
    return response.data;
  } catch (error) {
    console.error('Failed to classify market intent:', error);
    return { data: null, message: 'Intent classification unavailable' };
  }
}

/**
 * Sprint 2: Get confirmation checkpoints
 */
export async function getConfirmationCheckpoints(input: {
  isCrossBorder: boolean;
  isContactingTraveler: boolean;
  isSelectingPayment: boolean;
}): Promise<{ data: HumanConfirmationCheckpoint[] }> {
  try {
    const response = await api.post(`${CROWDSHIP_API_BASE}/checkpoints`, input);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch confirmation checkpoints:', error);
    return { data: [] };
  }
}

/**
 * Sprint 2: Record user confirmation
 */
export async function recordConfirmation(checkpointId: string, confirmed: boolean): Promise<{ success: boolean }> {
  try {
    const response = await api.post(`${CROWDSHIP_API_BASE}/checkpoints/${checkpointId}/confirm`, { confirmed });
    return response.data;
  } catch (error) {
    console.error('Failed to record confirmation:', error);
    return { success: false };
  }
}

/**
 * Sprint 2: Get corridor snapshot for audit
 */
export async function getCorridorSnapshot(requestId: string): Promise<{ data: CorridorSnapshot | null }> {
  try {
    const response = await api.get(`${CROWDSHIP_API_BASE}/corridor/snapshot/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch corridor snapshot:', error);
    return { data: null };
  }
}

/**
 * Sprint 2: Check feature flags
 */
export function getFeatureFlags(): {
  corridorAiAdvisory: boolean;
  trustGating: boolean;
  intentChipUi: boolean;
  humanConfirmationCheckpoints: boolean;
  // Sprint 3
  rateLimitingEnabled: boolean;
  emergencyDisabled: boolean;
} {
  return {
    corridorAiAdvisory: import.meta.env.VITE_FF_CORRIDOR_AI_ADVISORY === 'true',
    trustGating: import.meta.env.VITE_FF_TRUST_GATING === 'true',
    intentChipUi: import.meta.env.VITE_FF_INTENT_CHIP_UI === 'true',
    humanConfirmationCheckpoints: import.meta.env.VITE_FF_HUMAN_CONFIRMATION_CHECKPOINTS === 'true',
    // Sprint 3
    rateLimitingEnabled: import.meta.env.VITE_FF_RATE_LIMITING_ENABLED === 'true',
    emergencyDisabled: import.meta.env.VITE_FF_EMERGENCY_DISABLE_ALL === 'true',
  };
}

// ===========================================
// Sprint 3: Health Check & Status APIs
// ===========================================

export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  status: ServiceStatus;
  version: string;
  uptime: number;
  timestamp: string;
  components: Array<{
    name: string;
    status: ServiceStatus;
    responseTimeMs?: number;
    message?: string;
    lastChecked: string;
  }>;
  flags: {
    aiCoreEnabled: boolean;
    corridorAdvisoryEnabled: boolean;
    emergencyDisabled: boolean;
  };
}

export interface RateLimitStatus {
  endpoint: string;
  count: number;
  limit: number;
  remaining: number;
  resetTime: number;
}

export interface CorridorVolumeStatus {
  corridorId: string;
  volumeUSD: number;
  transactionCount: number;
  remainingVolumeUSD: number;
  remainingTransactions: number;
  percentUsed: number;
}

/**
 * Sprint 3: Check service health
 */
export async function checkServiceHealth(): Promise<HealthCheckResult | null> {
  try {
    const response = await api.get(`${CROWDSHIP_API_BASE}/health/ready`);
    return response.data;
  } catch (error) {
    console.error('Failed to check service health:', error);
    return null;
  }
}

/**
 * Sprint 3: Get rate limit status
 */
export async function getRateLimitStatus(): Promise<{ endpoints: RateLimitStatus[] } | null> {
  try {
    const response = await api.get(`${CROWDSHIP_API_BASE}/health/rate-limit`);
    return response.data;
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return null;
  }
}

/**
 * Sprint 3: Get corridor volume status
 */
export async function getCorridorVolumeStatus(): Promise<{ corridors: CorridorVolumeStatus[] } | null> {
  try {
    const response = await api.get(`${CROWDSHIP_API_BASE}/health/corridors`);
    return response.data;
  } catch (error) {
    console.error('Failed to get corridor volume status:', error);
    return null;
  }
}

/**
 * Sprint 3: Check if service is in emergency mode
 */
export async function isEmergencyMode(): Promise<boolean> {
  try {
    const response = await api.get(`${CROWDSHIP_API_BASE}/health/flags`);
    return response.data?.emergencyDisabled === true;
  } catch (error) {
    // If we can't reach the service, assume emergency mode for safety
    return true;
  }
}

/**
 * Sprint 3: Get no-regression constraints verification
 */
export async function verifyConstraints(): Promise<{
  constraints: Record<string, { enforced: boolean; description: string }>;
  verified: boolean;
} | null> {
  try {
    const response = await api.get(`${CROWDSHIP_API_BASE}/health/constraints`);
    return response.data;
  } catch (error) {
    console.error('Failed to verify constraints:', error);
    return null;
  }
}

export default {
  getAIRecommendation,
  getAIAuditLogs,
  isAIEnabled,
  // Sprint 2
  getCorridorAdvisory,
  classifyMarketIntent,
  getConfirmationCheckpoints,
  recordConfirmation,
  getCorridorSnapshot,
  getFeatureFlags,
  // Sprint 3
  checkServiceHealth,
  getRateLimitStatus,
  getCorridorVolumeStatus,
  isEmergencyMode,
  verifyConstraints,
};
