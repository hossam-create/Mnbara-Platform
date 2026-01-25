/**
 * Disputes & Refunds System - Type Definitions
 * 
 * This file contains all TypeScript types, interfaces, and enums
 * for the dispute resolution and refund management system.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Reason for opening a dispute
 */
export enum DisputeReason {
  NOT_DELIVERED = 'NOT_DELIVERED',
  WRONG_ITEM = 'WRONG_ITEM',
  DAMAGED = 'DAMAGED',
  OTHER = 'OTHER'
}

/**
 * Current status of the dispute
 */
export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

/**
 * Resolution type for the dispute
 */
export enum DisputeResolution {
  REFUND_BUYER = 'REFUND_BUYER',
  RELEASE_TO_SELLER = 'RELEASE_TO_SELLER',
  PARTIAL_REFUND = 'PARTIAL_REFUND'
}

/**
 * Party involved in the dispute
 */
export enum DisputeParty {
  BUYER = 'BUYER',
  SELLER = 'SELLER'
}

/**
 * Type of evidence file
 */
export enum EvidenceType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT'
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Main dispute interface
 */
export interface Dispute {
  id: string;
  requestId: string;
  openedBy: DisputeParty;
  reason: DisputeReason;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolutionPercentage?: number;
  adminNotes?: string;
  openedAt: Date;
  reviewedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  reviewedByAdminId?: string;
  resolvedByAdminId?: string;
  stripeRefundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dispute evidence interface
 */
export interface DisputeEvidence {
  id: number;
  disputeId: string;
  submittedBy: DisputeParty;
  fileUrl: string;
  fileType: EvidenceType;
  fileSize: number;
  originalFilename: string;
  submittedAt: Date;
}

/**
 * Dispute with related data
 */
export interface DisputeWithDetails extends Dispute {
  request: {
    id: string;
    title: string;
    amount: number;
    buyer: {
      id: string;
      name: string;
      email: string;
    };
    seller: {
      id: string;
      name: string;
      email: string;
    };
  };
  evidence: DisputeEvidence[];
}

/**
 * Dispute with full details for admin
 */
export interface DisputeWithFullDetails extends DisputeWithDetails {
  timeline: DisputeEvent[];
  buyerWalletHistory: WalletTransaction[];
  sellerWalletHistory: WalletTransaction[];
}

/**
 * Dispute event for timeline
 */
export interface DisputeEvent {
  id: string;
  disputeId: string;
  type: string;
  title: string;
  description: string;
  data?: any;
  createdBy: string;
  createdAt: Date;
}

/**
 * Wallet transaction interface
 */
export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  referenceId: string;
  referenceType: string;
  createdAt: Date;
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/**
 * Filters for user disputes
 */
export interface DisputeFilters {
  status?: DisputeStatus;
  limit?: number;
  offset?: number;
}

/**
 * Filters for admin disputes
 */
export interface AdminDisputeFilters extends DisputeFilters {
  reason?: DisputeReason;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ============================================================================
// REQUEST/RESPONSE INTERFACES
// ============================================================================

/**
 * Request to open a dispute
 */
export interface OpenDisputeRequest {
  reason: DisputeReason;
  description: string;
  evidence?: Express.Multer.File[];
}

/**
 * Request to add evidence
 */
export interface AddEvidenceRequest {
  evidence: Express.Multer.File[];
}

/**
 * Request to resolve a dispute
 */
export interface ResolveDisputeRequest {
  resolution: DisputeResolution;
  percentage?: number;
  notes?: string;
}

/**
 * Result of dispute resolution
 */
export interface ResolutionResult {
  dispute: Dispute;
  refund?: {
    amount: number;
    stripeRefundId: string;
  };
  escrowRelease?: {
    amount: number;
    transactionId: string;
  };
}

/**
 * Dispute statistics
 */
export interface DisputeStats {
  total: number;
  byStatus: {
    open: number;
    underReview: number;
    resolved: number;
    closed: number;
  };
  byReason: {
    notDelivered: number;
    wrongItem: number;
    damaged: number;
    other: number;
  };
  byResolution: {
    refundBuyer: number;
    releaseToSeller: number;
    partialRefund: number;
  };
  averageResolutionTime: number;
  refundRate: number;
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

/**
 * File validation configuration
 */
export interface FileValidationConfig {
  allowedMimeTypes: string[];
  maxFileSize: number;
  maxFilesPerUpload: number;
  maxTotalFiles: number;
}

/**
 * Dispute validation result
 */
export interface DisputeValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * File upload constants
 */
export const FILE_UPLOAD_CONSTANTS = {
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf'
  ],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES_PER_UPLOAD: 5,
  MAX_TOTAL_FILES: 10
};

/**
 * Dispute window constants
 */
export const DISPUTE_CONSTANTS = {
  WINDOW_HOURS: 48,
  AUTO_CLOSE_DAYS: 30
};

/**
 * Request status that allows disputes
 */
export const DISPUTABLE_REQUEST_STATUS = 'DELIVERED';

