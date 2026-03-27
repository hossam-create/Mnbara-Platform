/**
 * Dispute & Claims Intelligence Types
 * NO AUTOMATION - Advisory Only
 *
 * HARD RULES:
 * - No auto-resolution
 * - No outcome enforcement
 * - Human decides everything
 * - Read-only classification
 * - Evidence checklist only (no collection)
 */

// ===========================================
// Dispute Classification Types
// ===========================================

export type DisputeCategory =
  | 'ITEM_NOT_RECEIVED'
  | 'ITEM_NOT_AS_DESCRIBED'
  | 'DAMAGED_ITEM'
  | 'WRONG_ITEM'
  | 'PARTIAL_DELIVERY'
  | 'DELIVERY_DELAY'
  | 'PAYMENT_ISSUE'
  | 'COMMUNICATION_ISSUE'
  | 'CANCELLATION_DISPUTE'
  | 'REFUND_REQUEST'
  | 'OTHER';

export type DisputeSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DisputeComplexity = 'SIMPLE' | 'MODERATE' | 'COMPLEX';

// ===========================================
// Claim Classification (Read-Only)
// ===========================================

export interface ClaimClassification {
  classificationId: string;
  disputeId: string;
  timestamp: string;
  category: DisputeCategory;
  subcategory?: string;
  severity: DisputeSeverity;
  complexity: DisputeComplexity;
  confidence: number; // 0-100
  reasoning: ClassificationReasoning;
  suggestedActions: SuggestedAction[];
  disclaimer: DisputeDisclaimer;
}

export interface ClassificationReasoning {
  primaryFactors: string[];
  supportingEvidence: string[];
  uncertainties: string[];
  alternativeCategories: AlternativeCategory[];
}

export interface AlternativeCategory {
  category: DisputeCategory;
  confidence: number;
  reason: string;
}

export interface SuggestedAction {
  id: string;
  action: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  requiresHumanApproval: true; // Always true
  estimatedTimeMinutes?: number;
}

// ===========================================
// Evidence Checklist (Generator Only)
// ===========================================

export interface EvidenceChecklist {
  checklistId: string;
  disputeId: string;
  category: DisputeCategory;
  timestamp: string;
  requiredEvidence: EvidenceItem[];
  optionalEvidence: EvidenceItem[];
  partyResponsibilities: PartyResponsibility[];
  timelineGuidance: TimelineGuidance;
  disclaimer: DisputeDisclaimer;
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  description: string;
  importance: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
  fromParty: 'BUYER' | 'SELLER' | 'TRAVELER' | 'PLATFORM';
  examples: string[];
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

export type EvidenceType =
  | 'PHOTO'
  | 'VIDEO'
  | 'RECEIPT'
  | 'TRACKING_INFO'
  | 'COMMUNICATION_LOG'
  | 'SCREENSHOT'
  | 'DOCUMENT'
  | 'TIMESTAMP_PROOF'
  | 'DELIVERY_CONFIRMATION'
  | 'CONDITION_REPORT';

export interface PartyResponsibility {
  party: 'BUYER' | 'SELLER' | 'TRAVELER' | 'PLATFORM';
  responsibilities: string[];
  deadline?: string;
}

export interface TimelineGuidance {
  recommendedResponseDays: number;
  escalationThresholdDays: number;
  maxResolutionDays: number;
  milestones: TimelineMilestone[];
}

export interface TimelineMilestone {
  name: string;
  targetDays: number;
  description: string;
}

// ===========================================
// Dispute Advisory Response
// ===========================================

export interface DisputeAdvisory {
  advisoryId: string;
  disputeId: string;
  timestamp: string;
  classification: ClaimClassification;
  evidenceChecklist: EvidenceChecklist;
  resolutionGuidance: ResolutionGuidance;
  riskAssessment: DisputeRiskAssessment;
  disclaimer: DisputeDisclaimer;
}

export interface ResolutionGuidance {
  recommendedApproach: string;
  possibleOutcomes: PossibleOutcome[];
  precedentSummary?: string;
  escalationCriteria: string[];
  humanDecisionRequired: true; // Always true
}

export interface PossibleOutcome {
  outcome: string;
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  conditions: string[];
  implications: string[];
}

export interface DisputeRiskAssessment {
  overallRisk: DisputeSeverity;
  financialExposure: FinancialExposure;
  reputationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  escalationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: RiskFactor[];
}

export interface FinancialExposure {
  estimatedMin: number;
  estimatedMax: number;
  currency: string;
  breakdown: string[];
}

export interface RiskFactor {
  factor: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  weight: number;
  description: string;
}

// ===========================================
// Disclaimer (Always Present)
// ===========================================

export interface DisputeDisclaimer {
  type: 'DISPUTE_ADVISORY';
  text: string;
  isAdvisoryOnly: true;
  noAutoResolution: true;
  noOutcomeEnforcement: true;
  humanDecidesEverything: true;
  timestamp: string;
}

// ===========================================
// Input Types
// ===========================================

export interface DisputeContext {
  disputeId: string;
  transactionId?: string;
  buyerId: string;
  sellerId: string;
  travelerId?: string;
  amount: number;
  currency: string;
  itemDescription: string;
  claimDescription: string;
  claimDate: string;
  transactionDate?: string;
  deliveryDate?: string;
  existingEvidence?: string[];
}

// ===========================================
// Audit Types
// ===========================================

export interface DisputeIntelAuditEntry {
  id: string;
  advisoryId: string;
  disputeId: string;
  action: 'CLASSIFICATION_GENERATED' | 'CHECKLIST_GENERATED' | 'ADVISORY_REQUESTED';
  timestamp: string;
  requestedBy?: string;
  metadata?: Record<string, unknown>;
}

// ===========================================
// Health Types
// ===========================================

export interface DisputeIntelHealth {
  status: 'healthy' | 'degraded' | 'disabled';
  timestamp: string;
  featureFlags: {
    disputeIntelEnabled: boolean;
    emergencyDisabled: boolean;
  };
  advisoryCount: number;
  version: string;
}
