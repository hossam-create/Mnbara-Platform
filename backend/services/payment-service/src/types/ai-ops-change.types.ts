// AI-OPS-006: Controlled AI Change & Rollback Framework Types

export interface AIChangeProposal {
  id: string;
  version: string; // Semantic version (e.g., "2.1.0")
  title: string;
  description: string;
  
  // Change metadata
  scope: 'RULE_UPDATE' | 'THRESHOLD_ADJUSTMENT' | 'MODEL_UPDATE' | 'CONFIGURATION' | 'OTHER';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // Technical details
  affectedComponents: string[];
  changeDetails: Record<string, any>;
  dependencies: string[];
  rollbackPlan: string;
  
  // Lifecycle
  status: 'DRAFT' | 'SUBMITTED' | 'SHADOW_EVALUATION' | 'APPROVAL_PENDING' | 'APPROVED' | 'REJECTED' | 'DEPLOYED' | 'ROLLED_BACK';
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  deployedAt?: Date;
  
  // Ownership
  authorId: string;
  authorRole: string;
  approvers: Approval[];
  
  // Evaluation results
  shadowEvaluation?: ShadowEvaluationResult;
  safetyAnalysis?: SafetyImpactAnalysis;
  auditTrail: AuditEntry[];
}

export interface Approval {
  approverId: string;
  approverRole: string;
  decision: 'APPROVED' | 'REJECTED' | 'PENDING';
  comments?: string;
  timestamp?: Date;
  required: boolean; // Whether this approval is mandatory
}

export interface ShadowEvaluationResult {
  id: string;
  proposalId: string;
  evaluationType: 'HISTORICAL' | 'LIVE';
  
  // Performance metrics
  riskDelta: number; // Overall risk score change
  escalationDelta: number; // Change in escalation rate
  recommendationShifts: Record<string, number>; // Recommendation type changes
  
  // Impact analysis
  falsePositiveImpact: number;
  falseNegativeImpact: number;
  truePositiveImpact: number;
  trueNegativeImpact: number;
  
  // Statistical significance
  sampleSize: number;
  confidence: number; // 0.0 - 1.0
  statisticalSignificance: boolean;
  
  // Detailed metrics
  metricsByRiskBand: Record<string, BandMetrics>;
  metricsBySellerSegment: Record<string, SegmentMetrics>;
  
  executedAt: Date;
  durationMs: number;
}

export interface BandMetrics {
  riskBand: string;
  riskDelta: number;
  escalationRateChange: number;
  sampleSize: number;
}

export interface SegmentMetrics {
  segment: string;
  riskDelta: number;
  impactScore: number;
  sampleSize: number;
}

export interface SafetyImpactAnalysis {
  riskInflationIndex: number; // 0-100, higher = more risk inflation
  stabilityIndex: number; // 0-100, higher = more stable
  cascadeEffect: number; // 0-100, measures downstream impact
  buyerProtectionVariance: number; // 0-100, measures buyer impact variance
  
  riskFlags: RiskFlag[];
  overallSafetyScore: number; // 0-100
  recommendation: 'SAFE' | 'WITH_CAUTION' | 'UNSAFE' | 'CRITICAL';
  
  analyzedAt: Date;
}

export interface RiskFlag {
  type: 'RISK_INFLATION' | 'STABILITY_ISSUE' | 'CASCADE_EFFECT' | 'BUYER_IMPACT' | 'PERFORMANCE_DEGRADATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  evidence: string[];
  mitigation: string;
}

export interface AIVersion {
  id: string;
  version: string; // Semantic version
  description: string;
  changeProposalId?: string;
  
  // Deployment info
  deployedAt: Date;
  deployedBy: string;
  status: 'ACTIVE' | 'ROLLED_BACK' | 'DEPRECATED';
  
  // Performance metrics
  performanceScore: number; // 0-100
  stabilityScore: number; // 0-100
  rollbackReady: boolean;
  
  // Audit trail
  auditTrail: AuditEntry[];
}

export interface VersionDiff {
  fromVersion: string;
  toVersion: string;
  changes: ChangeDetail[];
  impactSummary: string;
  riskAssessment: string;
}

export interface ChangeDetail {
  component: string;
  changeType: 'ADDED' | 'MODIFIED' | 'REMOVED';
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  actorId: string;
  actorRole: string;
  details?: any;
}

export interface ChangeProposalRequest {
  title: string;
  description: string;
  scope: string;
  riskLevel: string;
  priority: string;
  affectedComponents: string[];
  changeDetails: Record<string, any>;
  dependencies: string[];
  rollbackPlan: string;
  authorId: string;
  authorRole: string;
}

export interface ShadowEvaluationRequest {
  evaluationType: 'HISTORICAL' | 'LIVE';
  sampleSize?: number;
  timeWindow?: string; // e.g., "7d", "30d"
}

export interface ApprovalRequest {
  approverId: string;
  approverRole: string;
  decision: 'APPROVED' | 'REJECTED';
  comments?: string;
}

export interface RollbackRequest {
  reason: string;
  executedBy: string;
  emergency: boolean;
}

export interface QuorumRules {
  requiredApprovals: number;
  requiredRoles: string[];
  minSeniorityLevel?: number;
  authorCannotApprove: boolean;
  mandatoryReviewers?: string[];
}