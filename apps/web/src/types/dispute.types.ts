// ============================================
// Frontend Dispute Types
// ============================================

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
  openedAt: string;
  reviewedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeEvidence {
  id: number;
  disputeId: string;
  submittedBy: DisputeParty;
  fileUrl: string;
  fileType: EvidenceType;
  originalFilename: string;
  submittedAt: string;
}

export interface CreateDisputeInput {
  requestId: number;
  reason: DisputeReason;
  description: string;
  evidenceFiles?: File[];
}

export interface DisputeFilters {
  status?: DisputeStatus;
  reason?: DisputeReason;
  limit?: number;
  offset?: number;
}

export interface DisputeListResponse {
  disputes: Dispute[];
  total: number;
  limit: number;
  offset: number;
}

export interface DisputeStats {
  total: number;
  open: number;
  underReview: number;
  resolved: number;
  byReason: Record<DisputeReason, number>;
}

export interface ResolutionStats {
  totalResolved: number;
  refundBuyer: number;
  releaseToSeller: number;
  partialRefund: number;
  buyerWinRate: string;
  sellerWinRate: string;
  partialRate: string;
}

export interface AdminDisputeStats {
  disputes: DisputeStats;
  resolutions: ResolutionStats;
}
