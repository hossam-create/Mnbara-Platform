// ============================================================
// PHASE 4.4.4 — RECONCILIATION ALERT DTOs
// Read-only data transfer objects for Control Center
// NO fix buttons, NO automation — information only
// ============================================================

import { MismatchClassification, MismatchSeverity, ReconciliationResolution } from '@prisma/client';

// ============================================================
// ALERT DTOs
// ============================================================

/**
 * Reconciliation Alert for Control Center display.
 * Read-only, informational view of a mismatch.
 */
export interface ReconciliationAlertDto {
  // Identification
  id: string;
  escrowId: string;
  gatewayPaymentId: string | null;
  
  // Classification
  classification: MismatchClassification;
  severity: MismatchSeverity;
  
  // Amounts (in minor units)
  expectedAmount: string; // bigint as string for JSON serialization
  gatewayAmount: string | null;
  currency: string;
  
  // Status
  gatewayStatus: string | null;
  resolution: ReconciliationResolution;
  
  // Context
  description: string; // Human-readable explanation
  recommendedAction: string; // What admin should do
  
  // Metadata
  detectedAt: string; // ISO timestamp
  resolvedAt: string | null;
  resolvedBy: string | null;
  notes: string | null;
  
  // Links (for navigation)
  escrowLink: string; // /control-center/finance/escrows/:id
  gatewayLink: string | null; // External gateway dashboard link
  
  // UI helpers
  severityColor: string; // Hex color for badge
  severityPriority: number; // For sorting (3=HIGH, 2=MEDIUM, 1=LOW)
  requiresImmediateAttention: boolean;
}

/**
 * Reconciliation Run Summary for Control Center dashboard.
 */
export interface ReconciliationRunSummaryDto {
  id: string;
  gateway: string;
  status: string;
  
  // Metrics
  totalChecked: number;
  matchCount: number;
  mismatchCount: number;
  errorCount: number;
  
  // Severity breakdown
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  
  // Timestamps
  startedAt: string;
  finishedAt: string | null;
  duration: number | null; // milliseconds
  
  // Trigger info
  triggeredBy: string;
  notes: string | null;
}

/**
 * Reconciliation Statistics for dashboard widgets.
 */
export interface ReconciliationStatsDto {
  // Overall health
  totalRuns: number;
  successRate: number; // percentage
  averageMatchRate: number; // percentage
  
  // Current state
  activeMismatches: number;
  highSeverityMismatches: number;
  unresolvedMismatches: number;
  
  // By classification
  byClassification: {
    [key in MismatchClassification]: number;
  };
  
  // By severity
  bySeverity: {
    [key in MismatchSeverity]: number;
  };
  
  // Trends
  last24Hours: {
    runs: number;
    mismatches: number;
    resolved: number;
  };
  
  // Last run info
  lastRun: {
    timestamp: string;
    status: string;
    mismatchCount: number;
  } | null;
}

/**
 * Filter options for reconciliation alerts.
 */
export interface ReconciliationAlertFilters {
  // Severity filter
  severity?: MismatchSeverity | MismatchSeverity[];
  
  // Classification filter
  classification?: MismatchClassification | MismatchClassification[];
  
  // Resolution status
  resolution?: ReconciliationResolution | ReconciliationResolution[];
  
  // Gateway filter
  gateway?: string;
  
  // Date range
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  
  // Pagination
  page?: number;
  pageSize?: number;
  
  // Sorting
  sortBy?: 'severity' | 'detectedAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response for reconciliation alerts.
 */
export interface ReconciliationAlertListDto {
  alerts: ReconciliationAlertDto[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  filters: ReconciliationAlertFilters;
  summary: {
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
  };
}

/**
 * Detailed alert view with full context.
 */
export interface ReconciliationAlertDetailDto extends ReconciliationAlertDto {
  // Additional escrow context
  escrow: {
    id: string;
    buyerWalletId: string;
    sellerWalletId: string;
    status: string;
    referenceType: string;
    referenceId: string;
    createdAt: string;
    fundedAt: string | null;
  };
  
  // Reconciliation run context
  run: {
    id: string;
    gateway: string;
    startedAt: string;
    triggeredBy: string;
  };
  
  // Related alerts (if any)
  relatedAlerts: ReconciliationAlertDto[];
  
  // Timeline
  timeline: {
    detectedAt: string;
    resolvedAt: string | null;
    events: Array<{
      timestamp: string;
      type: 'DETECTED' | 'REVIEWED' | 'RESOLVED' | 'IGNORED';
      actor: string;
      notes: string | null;
    }>;
  };
}

// ============================================================
// REQUEST DTOs
// ============================================================

/**
 * Request to mark alert as reviewed (admin viewed it).
 * Does NOT resolve the underlying issue.
 */
export interface MarkAlertReviewedDto {
  alertId: string;
  reviewedBy: string;
  notes?: string;
}

/**
 * Request to add notes to an alert.
 * Does NOT change resolution status.
 */
export interface AddAlertNotesDto {
  alertId: string;
  notes: string;
  addedBy: string;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Response when marking alert as reviewed.
 */
export interface AlertReviewedResponseDto {
  success: boolean;
  alertId: string;
  reviewedAt: string;
  message: string;
}

/**
 * Response when adding notes.
 */
export interface AlertNotesAddedResponseDto {
  success: boolean;
  alertId: string;
  updatedAt: string;
  message: string;
}

// ============================================================
// VALIDATION SCHEMAS (for reference)
// ============================================================

/**
 * Validation rules for alert filters.
 */
export const ReconciliationAlertFiltersValidation = {
  severity: {
    type: 'enum',
    values: ['LOW', 'MEDIUM', 'HIGH'],
    optional: true,
  },
  classification: {
    type: 'enum',
    values: [
      'MISSING_PAYMENT',
      'DELAYED_PAYMENT',
      'AMOUNT_MISMATCH',
      'DUPLICATE_GATEWAY_PAYMENT',
      'GATEWAY_SUCCESS_ESCROW_MISSING',
      'GATEWAY_QUERY_FAILED',
    ],
    optional: true,
  },
  resolution: {
    type: 'enum',
    values: ['NONE', 'FLAGGED', 'MANUAL_ACTION', 'IGNORED'],
    optional: true,
  },
  page: {
    type: 'number',
    min: 1,
    default: 1,
  },
  pageSize: {
    type: 'number',
    min: 1,
    max: 100,
    default: 20,
  },
};
