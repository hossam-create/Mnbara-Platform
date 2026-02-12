// ============================================
// Dispute System Type Definitions
// ============================================

// Enums
export enum DisputeReason {
  NOT_DELIVERED = 'NOT_DELIVERED',
  WRONG_ITEM = 'WRONG_ITEM',
  DAMAGED = 'DAMAGED',
  OTHER = 'OTHER'
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum DisputeResolution {
  REFUND_BUYER = 'REFUND_BUYER',
  RELEASE_TO_SELLER = 'RELEASE_TO_SELLER',
  PARTIAL_REFUND = 'PARTIAL_REFUND'
}

export enum DisputeParty {
  BUYER = 'BUYER',
  SELLER = 'SELLER'
}

export enum EvidenceType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT'
}

// Interfaces
export interface Dispute {
  id: string;
  requestId: number;
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
  reviewedByAdminId?: number;
  resolvedByAdminId?: number;
  stripeRefundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface CreateDisputeInput {
  requestId: number;
  reason: DisputeReason;
  description: string;
  evidenceFiles?: MulterFile[];
}

export interface UpdateDisputeInput {
  description?: string;
  reason?: DisputeReason;
}

export interface DisputeFilters {
  status?: DisputeStatus;
  reason?: DisputeReason;
  openedBy?: DisputeParty;
  requestId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ResolutionInput {
  resolution: DisputeResolution;
  resolutionPercentage?: number;
  adminNotes?: string;
}

export interface ResolutionResult {
  success: boolean;
  dispute?: Dispute;
  error?: string;
  stripeRefundId?: string;
}

export interface SubmitEvidenceInput {
  disputeId: string;
  submittedBy: DisputeParty;
  files: MulterFile[];
}

export interface EvidenceResult {
  success: boolean;
  evidence?: DisputeEvidence[];
  error?: string;
}

// API Response Types
export interface DisputeResponse {
  id: string;
  requestId: number;
  openedBy: DisputeParty;
  reason: DisputeReason;
  description: string;
  evidence: DisputeEvidenceResponse[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolutionPercentage?: number;
  adminNotes?: string;
  openedAt: Date;
  reviewedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeEvidenceResponse {
  id: number;
  disputeId: string;
  submittedBy: DisputeParty;
  fileUrl: string;
  fileType: EvidenceType;
  originalFilename: string;
  submittedAt: Date;
}

export interface DisputeListResponse {
  disputes: DisputeResponse[];
  total: number;
  limit: number;
  offset: number;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Sort options
export interface SortParams {
  sortBy?: 'openedAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Multer File interface (simplified)
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
