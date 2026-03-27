/**
 * Launch Readiness Types
 * 
 * FINAL PRE-LAUNCH task for real-money marketplace platform
 * Analysis + Declaration ONLY - NO implementation
 */

export enum LaunchStatus {
  NOT_READY = 'NOT_READY',
  READY_FOR_SOFT_LAUNCH = 'READY_FOR_SOFT_LAUNCH',
  READY_FOR_FULL_LAUNCH = 'READY_FOR_FULL_LAUNCH',
  LAUNCHED = 'LAUNCHED'
}

export enum LaunchEventType {
  SYSTEM_FREEZE_APPLIED = 'SYSTEM_FREEZE_APPLIED',
  LAUNCH_SCOPE_LOCKED = 'LAUNCH_SCOPE_LOCKED',
  AUTHORITY_MODEL_FINALIZED = 'AUTHORITY_MODEL_FINALIZED',
  GO_LIVE_READY_CONFIRMED = 'GO_LIVE_READY_CONFIRMED'
}

export enum LaunchPhase {
  PHASE_1_AUCTION_CORE = 'PHASE_1_AUCTION_CORE',
  PHASE_2_BANK_PSP = 'PHASE_2_BANK_PSP',
  PHASE_3_PAYOUTS = 'PHASE_3_PAYOUTS',
  PHASE_4_COMMISSION_SETTLEMENT = 'PHASE_4_COMMISSION_SETTLEMENT',
  PHASE_5_AI_ML = 'PHASE_5_AI_ML'
}

export interface SystemFreezeDeclaration {
  version: string;
  tag: 'RELEASE_CANDIDATE_v1';
  appliedAt: Date;
  frozenComponents: {
    apis: boolean;
    roles: boolean;
    flows: boolean;
    schema: boolean;
  };
  restrictions: {
    noNewFeatures: boolean;
    noBusinessLogicChanges: boolean;
    noFinancialBehaviorChanges: boolean;
    analysisAndDeclarationOnly: boolean;
  };
}

export interface LaunchScopeLock {
  liveComponents: {
    auctions: {
      bidding: boolean;
      antiSniping: boolean;
      reserve: boolean;
      settlement: boolean;
    };
    wallet: {
      readOnly: boolean;
      mutations: boolean;
    };
    escrow: {
      backendControlled: boolean;
      autoRelease: boolean;
    };
    disputes: {
      guarantees: boolean;
      readOnlyUI: boolean;
    };
    trustAndSafety: {
      rules: boolean;
      throttling: boolean;
      logging: boolean;
    };
    affiliateAndReferral: {
      trackingOnly: boolean;
      payouts: boolean;
    };
    eventLogging: {
      appendOnly: boolean;
      mutable: boolean;
    };
  };
  lockedComponents: {
    realBankSettlement: boolean;
    payoutExecution: boolean;
    walletMutationsFromUI: boolean;
    autoEscrowRelease: boolean;
    commissionPayout: boolean;
    fxMultiCurrency: boolean;
  };
  lockedAt: Date;
}

export interface AuthorityMatrix {
  frontend: {
    capabilities: {
      viewOnly: boolean;
      intentOnly: boolean;
      zeroFinancialAuthority: boolean;
    };
    restrictions: {
      noDirectWalletAccess: boolean;
      noEscrowControl: boolean;
      noSettlementAuthority: boolean;
      noPayoutControl: boolean;
    };
  };
  backend: {
    capabilities: {
      allDecisions: boolean;
      allMoney: boolean;
      allStateTransitions: boolean;
      sourceOfTruth: boolean;
    };
    responsibilities: {
      financialControl: boolean;
      stateManagement: boolean;
      securityEnforcement: boolean;
      complianceMonitoring: boolean;
    };
  };
  admin: {
    capabilities: {
      visibilityOnly: boolean;
      noForceActions: boolean;
      noOverrides: boolean;
      readOnly: boolean;
    };
    restrictions: {
      noFinancialOperations: boolean;
      noStateModifications: boolean;
      noUserImpersonation: boolean;
      noSystemOverrides: boolean;
    };
  };
  finalizedAt: Date;
}

export interface GoLiveChecklist {
  items: {
    ledgerImmutable: boolean;
    escrowControlled: boolean;
    settlementFinal: boolean;
    appealsTimeBound: boolean;
    throttlingActive: boolean;
    eventLoggingVerified: boolean;
    noMockData: boolean;
    adminReadOnly: boolean;
    arabicUIOptional: boolean;
    affiliateTrackingActive: boolean;
  };
  totalChecks: number;
  passedChecks: number;
  allPassed: boolean;
  checkedAt: Date;
}

export interface LaunchReadinessReport {
  status: LaunchStatus;
  systemFreeze: SystemFreezeDeclaration;
  scopeLock: LaunchScopeLock;
  authorityMatrix: AuthorityMatrix;
  goLiveChecklist: GoLiveChecklist;
  postLaunchFlags: {
    currentPhase: LaunchPhase;
    futurePhases: LaunchPhase[];
    lockedForFuture: string[];
  };
  events: LaunchEvent[];
  generatedAt: Date;
  goLiveDecision: 'YES' | 'NO';
}

export interface LaunchEvent {
  id: string;
  type: LaunchEventType;
  timestamp: Date;
  data: {
    version?: string;
    status?: LaunchStatus;
    checklist?: GoLiveChecklist;
    authority?: AuthorityMatrix;
    scope?: LaunchScopeLock;
    decision?: 'YES' | 'NO';
    metadata?: Record<string, any>;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PostLaunchPhase {
  phase: LaunchPhase;
  description: string;
  capabilities: string[];
  dependencies: string[];
  estimatedTimeline?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface LaunchReadinessConfig {
  systemFreezeEnabled: boolean;
  scopeLockEnabled: boolean;
  authorityMatrixEnabled: boolean;
  goLiveChecklistEnabled: boolean;
  postLaunchPlanningEnabled: boolean;
  autoGenerateReport: boolean;
  requireAllChecksPass: boolean;
  launchDecisionThreshold: number; // percentage of checks required
}

export interface LaunchReadinessValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface LaunchReadinessRequest {
  includeSystemFreeze: boolean;
  includeScopeLock: boolean;
  includeAuthorityMatrix: boolean;
  includeGoLiveChecklist: boolean;
  includePostLaunchFlags: boolean;
  autoGenerateReport: boolean;
}

export interface LaunchReadinessResult {
  success: boolean;
  report?: LaunchReadinessReport;
  validation?: LaunchReadinessValidation;
  error?: string;
}
