/**
 * Auction Settlement Finality & Appeals Window Types
 * 
 * Ensures auction outcomes are FINAL, auditable, and protected
 * while allowing LIMITED, time-bound appeals
 */

export enum AuctionSettlementState {
  PENDING_SETTLEMENT = 'PENDING_SETTLEMENT',
  SETTLED = 'SETTLED',
  SETTLEMENT_FINAL = 'SETTLEMENT_FINAL'
}

export enum AppealStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED'
}

export enum AppealReason {
  WINNING_BID_INVALID = 'WINNING_BID_INVALID',
  SELLER_MISCONDUCT = 'SELLER_MISCONDUCT',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  OTHER = 'OTHER'
}

export enum SettlementEventType {
  AUCTION_SETTLED = 'AUCTION_SETTLED',
  APPEAL_OPENED = 'APPEAL_OPENED',
  APPEAL_WINDOW_EXPIRED = 'APPEAL_WINDOW_EXPIRED',
  SETTLEMENT_FINALIZED = 'SETTLEMENT_FINALIZED'
}

export interface AuctionSettlement {
  id: string;
  auctionId: string;
  sellerId: string;
  winnerId?: string;
  winningBidId?: string;
  winningAmount?: number;
  settlementAmount?: number;
  state: AuctionSettlementState;
  settledAt?: Date;
  finalizedAt?: Date;
  appealWindowExpiresAt?: Date;
  metadata: {
    totalBids: number;
    finalBidAmount: number;
    reservePrice?: number;
    settlementMethod: string;
    processedBy: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Appeal {
  id: string;
  settlementId: string;
  auctionId: string;
  appellantId: string;
  appellantRole: 'BUYER' | 'SELLER' | 'OBSERVER';
  reason: AppealReason;
  description: string;
  evidence?: string[];
  status: AppealStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
}

export interface AppealWindow {
  settlementId: string;
  opensAt: Date;
  expiresAt: Date;
  isActive: boolean;
  appealsAllowed: boolean;
  totalAppeals: number;
  appealDeadline?: Date;
}

export interface SettlementEvent {
  id: string;
  category: 'AUCTION_SETTLEMENT';
  type: SettlementEventType;
  timestamp: Date;
  data: {
    settlementId: string;
    auctionId: string;
    sellerId: string;
    winnerId?: string;
    winningAmount?: number;
    appealId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SettlementRequest {
  auctionId: string;
  sellerId: string;
  winnerId?: string;
  winningBidId?: string;
  winningAmount: number;
  settlementMethod: string;
  metadata?: Record<string, any>;
}

export interface AppealRequest {
  settlementId: string;
  appellantId: string;
  appellantRole: 'BUYER' | 'SELLER' | 'OBSERVER';
  reason: AppealReason;
  description: string;
  evidence?: string[];
}

export interface SettlementResult {
  success: boolean;
  settlement?: AuctionSettlement;
  error?: string;
  appealWindow?: AppealWindow;
}

export interface AppealResult {
  success: boolean;
  appeal?: Appeal;
  error?: string;
  canAppeal: boolean;
  appealWindow?: AppealWindow;
}

export interface SettlementStatistics {
  totalSettlements: number;
  pendingSettlements: number;
  settledSettlements: number;
  finalizedSettlements: number;
  totalAppeals: number;
  pendingAppeals: number;
  resolvedAppeals: number;
  rejectedAppeals: number;
  averageAppealResolutionTime: number;
  topAppealReasons: Array<{
    reason: AppealReason;
    count: number;
  }>;
}

export interface SettlementConfig {
  appealWindowHours: number;
  autoFinalizeAfterAppealWindow: boolean;
  requireEvidenceForAppeal: boolean;
  maxAppealDescriptionLength: number;
  maxEvidenceFiles: number;
  allowedAppealRoles: ('BUYER' | 'SELLER' | 'OBSERVER')[];
}

export interface SettlementValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AppealEligibility {
  canAppeal: boolean;
  reason?: string;
  appealWindow?: AppealWindow;
  deadline?: Date;
}
