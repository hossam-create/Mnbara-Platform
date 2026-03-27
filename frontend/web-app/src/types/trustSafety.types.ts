/**
 * Trust, Safety & Moderation Types
 * Platform safety layer types (NOT retail ratings only)
 */

export enum ReportType {
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  FRAUDULENT_LISTING = 'FRAUDULENT_LISTING',
  HARASSMENT = 'HARASSMENT',
  SCAM = 'SCAM',
  VIOLATION_OF_TERMS = 'VIOLATION_OF_TERMS',
  SPAM = 'SPAM',
  IMPERSONATION = 'IMPERSONATION',
  DANGEROUS_GOODS = 'DANGEROUS_GOODS',
  COUNTERFEIT_GOODS = 'COUNTERFEIT_GOODS'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
  ESCALATED = 'ESCALATED'
}

export enum ModerationAction {
  NO_ACTION = 'NO_ACTION',
  WARNING_ISSUED = 'WARNING_ISSUED',
  CONTENT_REMOVED = 'CONTENT_REMOVED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED = 'ACCOUNT_BANNED',
  LEGAL_ESCALATION = 'LEGAL_ESCALATION'
}

export enum TrustLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  WARNING = 'WARNING',
  SUSPENDED = 'SUSPENDED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  BANNED = 'BANNED'
}

export enum VerificationStatus {
  NOT_VERIFIED = 'NOT_VERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum FlagType {
  CONTENT_FLAG = 'CONTENT_FLAG',
  USER_FLAG = 'USER_FLAG',
  LISTING_FLAG = 'LISTING_FLAG',
  MESSAGE_FLAG = 'MESSAGE_FLAG'
}

export enum FlagSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedContentId?: string;
  reportedListingId?: string;
  type: ReportType;
  description: string;
  evidence: string[];
  status: ReportStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
  escalatedToDispute?: boolean;
}

export interface ModerationCase {
  id: string;
  reportId: string;
  type: ReportType;
  status: ReportStatus;
  assignedTo?: string;
  actions: ModerationAction[];
  notes: ModerationNote[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ModerationNote {
  id: string;
  caseId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ContentFlag {
  id: string;
  contentId: string;
  contentType: 'LISTING' | 'MESSAGE' | 'PROFILE' | 'REVIEW';
  flagType: FlagType;
  severity: FlagSeverity;
  reason: string;
  reportedBy: string;
  reviewedBy?: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt?: string;
  action?: ModerationAction;
}

export interface TrustScore {
  userId: string;
  overallScore: number;
  breakdown: {
    verificationScore: number;
    transactionScore: number;
    behaviorScore: number;
    communityScore: number;
  };
  level: TrustLevel;
  lastUpdated: string;
  factors: TrustFactor[];
}

export interface TrustFactor {
  type: 'VERIFICATION' | 'TRANSACTION' | 'BEHAVIOR' | 'COMMUNITY';
  weight: number;
  score: number;
  description: string;
  positive: boolean;
}

export interface AccountBadge {
  id: string;
  userId: string;
  type: 'VERIFIED' | 'TRUSTED' | 'PREMIUM' | 'WARNING' | 'SUSPENDED';
  label: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  expiresAt?: string;
  issuedAt: string;
}

export interface UserWarning {
  id: string;
  userId: string;
  type: 'COMMUNITY_GUIDELINES' | 'TERMS_OF_SERVICE' | 'SAFETY' | 'FRAUD';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  issuedBy: string;
  issuedAt: string;
  acknowledgedAt?: string;
  expiresAt?: string;
}

export interface SafetyMetrics {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  escalatedReports: number;
  averageResolutionTime: number;
  topReportTypes: {
    type: ReportType;
    count: number;
  }[];
  trustScoreDistribution: {
    level: TrustLevel;
    count: number;
  }[];
}

export interface ModerationQueue {
  id: string;
  type: 'REPORT' | 'FLAG' | 'AUTOMATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  itemCount: number;
  oldestItem: string;
  assignedModerators: string[];
}

export interface VerificationChecklist {
  userId: string;
  items: VerificationItem[];
  overallStatus: VerificationStatus;
  completedAt?: string;
  lastUpdated: string;
}

export interface VerificationItem {
  id: string;
  type: 'ID_VERIFICATION' | 'ADDRESS_VERIFICATION' | 'PHONE_VERIFICATION' | 'EMAIL_VERIFICATION' | 'BACKGROUND_CHECK';
  label: string;
  description: string;
  required: boolean;
  status: VerificationStatus;
  evidence?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

export interface EscalationLink {
  id: string;
  reportId: string;
  disputeId?: string;
  reason: string;
  escalatedBy: string;
  escalatedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
}

// Helper functions
export const getReportTypeColor = (type: ReportType): string => {
  switch (type) {
    case ReportType.INAPPROPRIATE_CONTENT:
      return '#f59e0b'; // Yellow
    case ReportType.FRAUDULENT_LISTING:
    case ReportType.SCAM:
    case ReportType.COUNTERFEIT_GOODS:
      return '#ef4444'; // Red
    case ReportType.HARASSMENT:
    case ReportType.IMPERSONATION:
      return '#dc2626'; // Dark Red
    case ReportType.VIOLATION_OF_TERMS:
      return '#f97316'; // Orange
    case ReportType.SPAM:
      return '#6b7280'; // Gray
    case ReportType.DANGEROUS_GOODS:
      return '#991b1b'; // Dark Red
    default:
      return '#6b7280'; // Gray
  }
};

export const getReportTypeLabel = (type: ReportType): string => {
  switch (type) {
    case ReportType.INAPPROPRIATE_CONTENT:
      return 'Inappropriate Content';
    case ReportType.FRAUDULENT_LISTING:
      return 'Fraudulent Listing';
    case ReportType.HARASSMENT:
      return 'Harassment';
    case ReportType.SCAM:
      return 'Scam';
    case ReportType.VIOLATION_OF_TERMS:
      return 'Terms Violation';
    case ReportType.SPAM:
      return 'Spam';
    case ReportType.IMPERSONATION:
      return 'Impersonation';
    case ReportType.DANGEROUS_GOODS:
      return 'Dangerous Goods';
    case ReportType.COUNTERFEIT_GOODS:
      return 'Counterfeit Goods';
    default:
      return 'Unknown';
  }
};

export const getReportStatusColor = (status: ReportStatus): string => {
  switch (status) {
    case ReportStatus.PENDING:
      return '#f59e0b'; // Yellow
    case ReportStatus.UNDER_REVIEW:
      return '#3b82f6'; // Blue
    case ReportStatus.RESOLVED:
      return '#10b981'; // Green
    case ReportStatus.DISMISSED:
      return '#6b7280'; // Gray
    case ReportStatus.ESCALATED:
      return '#dc2626'; // Red
    default:
      return '#6b7280'; // Gray
  }
};

export const getReportStatusLabel = (status: ReportStatus): string => {
  switch (status) {
    case ReportStatus.PENDING:
      return 'Pending';
    case ReportStatus.UNDER_REVIEW:
      return 'Under Review';
    case ReportStatus.RESOLVED:
      return 'Resolved';
    case ReportStatus.DISMISSED:
      return 'Dismissed';
    case ReportStatus.ESCALATED:
      return 'Escalated';
    default:
      return 'Unknown';
  }
};

export const getTrustLevelColor = (level: TrustLevel): string => {
  switch (level) {
    case TrustLevel.VERY_HIGH:
      return '#059669'; // Green
    case TrustLevel.HIGH:
      return '#10b981'; // Light Green
    case TrustLevel.MEDIUM:
      return '#f59e0b'; // Yellow
    case TrustLevel.LOW:
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
};

export const getTrustLevelLabel = (level: TrustLevel): string => {
  switch (level) {
    case TrustLevel.VERY_HIGH:
      return 'Very High';
    case TrustLevel.HIGH:
      return 'High';
    case TrustLevel.MEDIUM:
      return 'Medium';
    case TrustLevel.LOW:
      return 'Low';
    default:
      return 'Unknown';
  }
};

export const getAccountStatusColor = (status: AccountStatus): string => {
  switch (status) {
    case AccountStatus.ACTIVE:
      return '#10b981'; // Green
    case AccountStatus.WARNING:
      return '#f59e0b'; // Yellow
    case AccountStatus.SUSPENDED:
      return '#f97316'; // Orange
    case AccountStatus.UNDER_REVIEW:
      return '#3b82f6'; // Blue
    case AccountStatus.BANNED:
      return '#dc2626'; // Red
    default:
      return '#6b7280'; // Gray
  }
};

export const getAccountStatusLabel = (status: AccountStatus): string => {
  switch (status) {
    case AccountStatus.ACTIVE:
      return 'Active';
    case AccountStatus.WARNING:
      return 'Warning';
    case AccountStatus.SUSPENDED:
      return 'Suspended';
    case AccountStatus.UNDER_REVIEW:
      return 'Under Review';
    case AccountStatus.BANNED:
      return 'Banned';
    default:
      return 'Unknown';
  }
};

export const getFlagSeverityColor = (severity: FlagSeverity): string => {
  switch (severity) {
    case FlagSeverity.LOW:
      return '#f59e0b'; // Yellow
    case FlagSeverity.MEDIUM:
      return '#f97316'; // Orange
    case FlagSeverity.HIGH:
      return '#ef4444'; // Red
    case FlagSeverity.CRITICAL:
      return '#dc2626'; // Dark Red
    default:
      return '#6b7280'; // Gray
  }
};

export const formatTrustScore = (score: number): string => {
  return score.toFixed(1);
};

export const getTrustScoreColor = (score: number): string => {
  if (score >= 90) return '#059669'; // Green
  if (score >= 75) return '#10b981'; // Light Green
  if (score >= 60) return '#f59e0b'; // Yellow
  if (score >= 40) return '#f97316'; // Orange
  return '#ef4444'; // Red
};
