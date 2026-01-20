/**
 * Seller Protections & Auto-Relist Types
 * 
 * Protects sellers from buyer abuse, failed settlements, and no-shows
 * WITHOUT breaking settlement finality or escrow safety
 */

export enum SellerProtectionTrigger {
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',
  SETTLEMENT_EXPIRED = 'SETTLEMENT_EXPIRED',
  BUYER_BLOCKED = 'BUYER_BLOCKED',
  APPEAL_AGAINST_BUYER = 'APPEAL_AGAINST_BUYER'
}

export enum SellerProtectionStatus {
  NONE = 'NONE',
  PROTECTED = 'PROTECTED',
  AUTO_RELIST_ELIGIBLE = 'AUTO_RELIST_ELIGIBLE',
  AUTO_RELISTED = 'AUTO_RELISTED'
}

export enum AutoRelistStatus {
  ELIGIBLE = 'ELIGIBLE',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  RELISTED = 'RELISTED',
  CANCELLED = 'CANCELLED'
}

export enum SellerProtectionEventType {
  SELLER_PROTECTED = 'SELLER_PROTECTED',
  AUTO_RELIST_ELIGIBLE = 'AUTO_RELIST_ELIGIBLE',
  AUCTION_AUTO_RELISTED = 'AUCTION_AUTO_RELISTED',
  AUTO_RELIST_CANCELLED = 'AUTO_RELIST_CANCELLED'
}

export interface SellerProtection {
  id: string;
  originalAuctionId: string;
  sellerId: string;
  buyerId?: string;
  trigger: SellerProtectionTrigger;
  status: SellerProtectionStatus;
  autoRelistStatus?: AutoRelistStatus;
  protectionData: {
    originalAuctionData: {
      title: string;
      description: string;
      images: string[];
      reservePrice?: number;
      category: string;
      condition: string;
      shippingInfo?: any;
    };
    settlementId?: string;
    appealId?: string;
    paymentFailureReason?: string;
    settlementExpiryReason?: string;
    buyerBlockReason?: string;
    appealResolutionDetails?: any;
  };
  metadata: {
    triggeredAt: Date;
    processedAt?: Date;
    autoRelistEligibleAt?: Date;
    autoRelistedAt?: Date;
    cancelledAt?: Date;
    processedBy: string;
    trustScoreImpact: 'NONE' | 'POSITIVE' | 'NEGATIVE';
    escrowStatus: 'HELD' | 'RELEASED' | 'REFUNDED';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoRelistRequest {
  sellerProtectionId: string;
  requireConfirmation: boolean;
  startStatus: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE';
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface AutoRelistResult {
  success: boolean;
  sellerProtection?: SellerProtection;
  newAuctionId?: string;
  newAuctionData?: any;
  error?: string;
  requiresConfirmation?: boolean;
  confirmationDeadline?: Date;
}

export interface SellerProtectionEvent {
  id: string;
  category: 'SELLER_PROTECTION';
  type: SellerProtectionEventType;
  timestamp: Date;
  data: {
    sellerProtectionId: string;
    originalAuctionId: string;
    sellerId: string;
    buyerId?: string;
    trigger?: SellerProtectionTrigger;
    newAuctionId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SellerProtectionConfig {
  autoRelistEnabled: boolean;
  requireSellerConfirmation: boolean;
  autoRelistStartStatus: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE';
  confirmationDeadlineHours: number;
  maxAutoRelistPerSeller: number;
  autoRelistCooldownHours: number;
  protectedSellerTrustScoreImpact: 'NONE' | 'POSITIVE' | 'NEGATIVE';
  allowAutoRelistAfterAppeal: boolean;
  copyReservePrice: boolean;
  copyShippingInfo: boolean;
}

export interface SellerProtectionStatistics {
  totalProtections: number;
  activeProtections: number;
  autoRelistEligible: number;
  autoRelisted: number;
  cancelled: number;
  triggerBreakdown: Record<SellerProtectionTrigger, number>;
  averageProcessingTime: number;
  topProtectedSellers: Array<{
    sellerId: string;
    protectionCount: number;
  }>;
  autoRelistSuccessRate: number;
}

export interface SellerProtectionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SellerProtectionEligibility {
  eligible: boolean;
  reason?: string;
  trigger?: SellerProtectionTrigger;
  autoRelistEligible?: boolean;
  autoRelistReason?: string;
}

export interface AutoRelistEligibility {
  eligible: boolean;
  reason?: string;
  requiresConfirmation: boolean;
  confirmationDeadline?: Date;
  cooldownActive: boolean;
  cooldownEndsAt?: Date;
  remainingAutoRelists: number;
}

export interface SellerProtectionRequest {
  originalAuctionId: string;
  sellerId: string;
  buyerId?: string;
  trigger: SellerProtectionTrigger;
  triggerData: {
    settlementId?: string;
    appealId?: string;
    paymentFailureReason?: string;
    settlementExpiryReason?: string;
    buyerBlockReason?: string;
    appealResolutionDetails?: any;
  };
  originalAuctionData: {
    title: string;
    description: string;
    images: string[];
    reservePrice?: number;
    category: string;
    condition: string;
    shippingInfo?: any;
  };
}

export interface SellerProtectionResult {
  success: boolean;
  sellerProtection?: SellerProtection;
  error?: string;
  autoRelistEligible?: boolean;
  autoRelistEligibility?: AutoRelistEligibility;
}
