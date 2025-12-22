import { Decimal } from '@prisma/client/runtime/library';

// Swap Status enum
export enum SwapStatus {
  PENDING = 'PENDING',
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_ESCROW = 'IN_ESCROW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  DISPUTED = 'DISPUTED'
}

// Swap Item Type enum
export enum SwapItemType {
  LISTING = 'LISTING',
  PRODUCT = 'PRODUCT',
  CASH_ADDITION = 'CASH_ADDITION'
}

// Swap matching criteria weights
export interface MatchingWeights {
  categoryWeight: number;
  priceWeight: number;
  locationWeight: number;
  conditionWeight: number;
}

// Default matching weights
export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  categoryWeight: 0.3,
  priceWeight: 0.35,
  locationWeight: 0.2,
  conditionWeight: 0.15
};

// Swap proposal input
export interface CreateSwapProposalInput {
  initiatorId: number;
  receiverId: number;
  initiatorItems: SwapItemInput[];
  receiverItems?: SwapItemInput[];
  message?: string;
  expiresInHours?: number;
}

// Swap item input
export interface SwapItemInput {
  itemType: SwapItemType;
  listingId?: number;
  productName?: string;
  productDescription?: string;
  estimatedValue: number;
  currency?: string;
  quantity?: number;
  condition?: string;
  images?: string[];
  cashAmount?: number;
}

// Swap match result
export interface SwapMatchResult {
  initiatorListingId: number;
  matchedListingId: number;
  matchScore: number;
  categoryMatch: boolean;
  priceRangeMatch: boolean;
  locationMatch: boolean;
  conditionMatch: boolean;
  valueDifference: number;
  valueDifferencePercent: number;
}

// Listing data for matching
export interface ListingForMatching {
  id: number;
  sellerId: number;
  title: string;
  price: Decimal | number;
  currency: string;
  categoryId: number;
  condition: string;
  city: string;
  country: string;
  status: string;
  isActive: boolean;
}

// Swap response
export interface SwapResponse {
  id: number;
  swapNumber: string;
  status: SwapStatus;
  initiatorId: number;
  receiverId: number;
  items: SwapItemResponse[];
  matchScore?: number;
  message?: string;
  expiresAt?: Date;
  createdAt: Date;
}

// Swap item response
export interface SwapItemResponse {
  id: number;
  ownerId: number;
  itemType: SwapItemType;
  listingId?: number;
  productName?: string;
  estimatedValue: number;
  currency: string;
  quantity: number;
  cashAmount?: number;
}

// Swap action result
export interface SwapActionResult {
  success: boolean;
  swap: SwapResponse;
  message: string;
  escrowCreated?: boolean;
}
