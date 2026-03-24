/**
 * Decision Authority Types
 * TypeScript types for decision status, sources, and records
 */

/**
 * Decision Status Enum
 * Represents the current state of a decision
 */
export enum DecisionStatus {
  PENDING = 'PENDING',      // Decision requested, awaiting response
  APPROVED = 'APPROVED',    // Decision approved, asset can proceed
  REJECTED = 'REJECTED',    // Decision rejected, asset blocked
  EXPIRED = 'EXPIRED'       // Decision expired, no longer valid
}

/**
 * Decision Source Enum
 * Represents who made the decision
 */
export enum DecisionSource {
  INTERNAL = 'INTERNAL',    // Internal system decision
  EXTERNAL = 'EXTERNAL',    // External authority (Custodii) decision
  OVERRIDE = 'OVERRIDE'     // Admin override decision
}

/**
 * Asset Type Enum
 * Represents the type of asset being decided upon
 */
export enum AssetType {
  LISTING = 'LISTING',
  AUCTION = 'AUCTION',
  ESCROW_RELEASE = 'ESCROW_RELEASE'
}

/**
 * Asset Decision Record
 * Complete decision record for an asset
 */
export interface AssetDecisionRecord {
  id: string;
  assetType: AssetType | string;
  assetId: string;
  status: DecisionStatus;
  source: DecisionSource;
  authority: string;
  decisionRef: string | null;
  reason: string | null;
  metadata: Record<string, any>;
  requestedAt: string;
  decidedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Decision Filter Options
 * Used for querying decisions
 */
export interface DecisionFilters {
  status?: DecisionStatus;
  source?: DecisionSource;
  assetType?: AssetType;
  assetId?: string;
  authority?: string;
  limit?: number;
  offset?: number;
}

/**
 * Decision List Response
 * Paginated list of decisions
 */
export interface DecisionListResponse {
  data: AssetDecisionRecord[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Decision Status Display
 * UI-friendly decision status information
 */
export interface DecisionStatusDisplay {
  status: DecisionStatus;
  label: string;
  color: 'success' | 'warning' | 'error' | 'info';
  icon: string;
  message: string;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  isExpired: boolean;
}

/**
 * Decision Audit Log Entry
 * Audit trail for decision changes
 */
export interface DecisionAuditLogEntry {
  id: string;
  decisionId: string;
  eventType: string;
  actor: string;
  oldStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * Decision Audit Log Response
 * List of audit log entries
 */
export interface DecisionAuditLogResponse {
  data: DecisionAuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Decision Override Request
 * Request to override a decision
 */
export interface DecisionOverrideRequest {
  status: DecisionStatus;
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Decision Override Response
 * Response from override request
 */
export interface DecisionOverrideResponse {
  id: string;
  status: DecisionStatus;
  source: DecisionSource;
  authority: string;
  decidedAt: string;
  reason: string;
}

/**
 * Decision Status Helper Functions
 */
export const getDecisionStatusDisplay = (status: DecisionStatus): DecisionStatusDisplay => {
  const displays: Record<DecisionStatus, DecisionStatusDisplay> = {
    [DecisionStatus.PENDING]: {
      status: DecisionStatus.PENDING,
      label: 'Pending',
      color: 'warning',
      icon: 'hourglass',
      message: 'Decision is pending. Please wait for approval.',
      isApproved: false,
      isPending: true,
      isRejected: false,
      isExpired: false
    },
    [DecisionStatus.APPROVED]: {
      status: DecisionStatus.APPROVED,
      label: 'Approved',
      color: 'success',
      icon: 'check-circle',
      message: 'Decision approved. You can proceed.',
      isApproved: true,
      isPending: false,
      isRejected: false,
      isExpired: false
    },
    [DecisionStatus.REJECTED]: {
      status: DecisionStatus.REJECTED,
      label: 'Rejected',
      color: 'error',
      icon: 'x-circle',
      message: 'Decision rejected. Please contact support.',
      isApproved: false,
      isPending: false,
      isRejected: true,
      isExpired: false
    },
    [DecisionStatus.EXPIRED]: {
      status: DecisionStatus.EXPIRED,
      label: 'Expired',
      color: 'info',
      icon: 'alert-circle',
      message: 'Decision expired. Please request a new decision.',
      isApproved: false,
      isPending: false,
      isRejected: false,
      isExpired: true
    }
  };

  return displays[status];
};

/**
 * Get decision status color for UI
 */
export const getDecisionStatusColor = (status: DecisionStatus): string => {
  const colors: Record<DecisionStatus, string> = {
    [DecisionStatus.PENDING]: '#FFA500',    // Orange
    [DecisionStatus.APPROVED]: '#4CAF50',   // Green
    [DecisionStatus.REJECTED]: '#F44336',   // Red
    [DecisionStatus.EXPIRED]: '#2196F3'     // Blue
  };
  return colors[status];
};

/**
 * Check if decision is final (not pending)
 */
export const isDecisionFinal = (status: DecisionStatus): boolean => {
  return status !== DecisionStatus.PENDING;
};

/**
 * Check if decision allows action
 */
export const canProceedWithDecision = (status: DecisionStatus): boolean => {
  return status === DecisionStatus.APPROVED;
};
