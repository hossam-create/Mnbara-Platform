/**
 * Post-Launch Playbook Types
 * 
 * POST-LAUNCH PLAYBOOK - Monitoring, Stability, Safety Proof
 * NO new features or logic - only observation and documentation
 */

export enum PostLaunchPhase {
  PL1_SOFT_LAUNCH_MONITORING = 'PL1_SOFT_LAUNCH_MONITORING',
  PL2_INCIDENT_READINESS = 'PL2_INCIDENT_READINESS',
  PL3_TRUST_SAFETY_LIVE_OPS = 'PL3_TRUST_SAFETY_LIVE_OPS',
  PL4_COMPLIANCE_EVIDENCE_PACK = 'PL4_COMPLIANCE_EVIDENCE_PACK',
  PL5_FREEZE_ENFORCEMENT_REVIEW = 'PL5_FREEZE_ENFORCEMENT_REVIEW'
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED'
}

export interface EventIntegrityCheck {
  flow: string;
  expectedEvents: string[];
  actualEvents: string[];
  missingEvents: string[];
  hasUpdateDelete: boolean;
  status: 'PASS' | 'FAIL';
  checkedAt: Date;
}

export interface AuthorityDriftDetection {
  component: 'frontend' | 'admin' | 'backend';
  violationType: string;
  description: string;
  severity: IncidentSeverity;
  detectedAt: Date;
  evidence: string[];
}

export interface FinancialSilenceVerification {
  component: 'wallet' | 'escrow' | 'payouts' | 'settlement';
  expectedState: 'READ_ONLY' | 'HELD' | 'DISABLED';
  actualState: string;
  movementsDetected: boolean;
  movementDetails: any[];
  status: 'PASS' | 'FAIL';
  verifiedAt: Date;
}

export interface IncidentClassification {
  severity: IncidentSeverity;
  responseTime: string;
  escalationOwner: string;
  requiredActions: string[];
  freezeRequired: boolean;
  auditRequired: boolean;
}

export interface KillSwitch {
  name: string;
  description: string;
  type: 'AUCTION_PAUSE' | 'BID_PAUSE' | 'USER_SUSPENSION';
  backendOnly: boolean;
  activated: boolean;
  lastTested?: Date;
}

export interface RuleHealthReview {
  ruleId: string;
  ruleName: string;
  triggerFrequency: number;
  falsePositiveRate: number;
  flagVsDenyRatio: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  reviewedAt: Date;
}

export interface ThrottlingPattern {
  patternType: 'BOT_LIKE' | 'REPEATED_BLOCKS' | 'IP_CONCENTRATION';
  description: string;
  ipAddresses: string[];
  userIds: string[];
  frequency: number;
  documented: boolean;
  detectedAt: Date;
}

export interface ComplianceEvidenceBundle {
  authorityMatrix: {
    documentPath: string;
    verified: boolean;
    verifiedAt: Date;
  };
  eventLoggingGuarantees: {
    documentPath: string;
    verified: boolean;
    verifiedAt: Date;
  };
  settlementFinalityProof: {
    documentPath: string;
    verified: boolean;
    verifiedAt: Date;
  };
  adminReadOnlyProof: {
    documentPath: string;
    verified: boolean;
    verifiedAt: Date;
  };
  bundleGeneratedAt: Date;
  bundleHash: string;
}

export interface FreezeViolation {
  type: 'NEW_ENDPOINT' | 'SCHEMA_CHANGE' | 'LOGIC_CHANGE';
  description: string;
  filePath: string;
  changeDetectedAt: Date;
  severity: IncidentSeverity;
  requiresRollback: boolean;
}

export interface PostLaunchTask {
  id: string;
  phase: PostLaunchPhase;
  title: string;
  description: string;
  prompt: string;
  acceptanceCriteria: string[];
  status: TaskStatus;
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  evidence?: any;
  notes?: string;
}

export interface PostLaunchPlaybook {
  currentPhase: PostLaunchPhase;
  tasks: PostLaunchTask[];
  overallStatus: 'ON_TRACK' | 'AT_RISK' | 'BLOCKED';
  startedAt: Date;
  estimatedCompletion: Date;
  progress: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    blockedTasks: number;
    percentage: number;
  };
}

export interface PostLaunchReport {
  phase: PostLaunchPhase;
  taskResults: {
    eventIntegrity: EventIntegrityCheck[];
    authorityDrift: AuthorityDriftDetection[];
    financialSilence: FinancialSilenceVerification[];
    incidentClassification: IncidentClassification[];
    killSwitches: KillSwitch[];
    ruleHealth: RuleHealthReview[];
    throttlingPatterns: ThrottlingPattern[];
    complianceBundle: ComplianceEvidenceBundle;
    freezeViolations: FreezeViolation[];
  };
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    criticalIssues: number;
    overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  };
  recommendations: string[];
  nextActions: string[];
  generatedAt: Date;
}

export interface PostLaunchConfig {
  monitoringInterval: number; // minutes
  alertThresholds: {
    criticalViolations: number;
    failedChecks: number;
    systemErrors: number;
  };
  retentionPeriod: number; // days
  autoGenerateReports: boolean;
  escalationRules: {
    severity: IncidentSeverity;
    notifyChannels: string[];
    autoEscalate: boolean;
  }[];
}

export interface PostLaunchValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  nextPhaseReady: boolean;
}

export interface PostLaunchRequest {
  phase: PostLaunchPhase;
  includeEvidence: boolean;
  generateReport: boolean;
  validateResults: boolean;
}

export interface PostLaunchResult {
  success: boolean;
  phase: PostLaunchPhase;
  tasks: PostLaunchTask[];
  report?: PostLaunchReport;
  validation?: PostLaunchValidation;
  error?: string;
}
