/**
 * Auction Types and Interfaces
 * Foundation for auction UI and state engine (client-side only)
 */

export enum AuctionStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  DELETED = 'DELETED'
}

export enum AuctionPhase {
  LIVE = 'LIVE',
  EXTENDED = 'EXTENDED',
  ENDED = 'ENDED'
}

export enum BidStatus {
  ACTIVE = 'ACTIVE',
  OUTBID = 'OUTBID',
  WINNING = 'WINNING',
  WON = 'WON',
  CANCELLED = 'CANCELLED'
}

export interface Auction {
  id: string | number;
  title: string;
  description: string;
  sellerId: string | number;
  sellerName?: string;
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  buyNowPrice?: number;
  auctionStartsAt: Date;
  auctionEndsAt: Date;
  currency: string;
  status: AuctionStatus;
  bids: Bid[];
  images: string[];
  category: string;
  minBidIncrement: number;
  autoExtendEnabled: boolean;
  autoExtendThresholdMs: number;
  autoExtendDurationMs: number;
  maxExtensions: number;
  extensionCount: number;
  winnerId?: string | number;
  winnerName?: string;
  finalPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bid {
  id: string | number;
  auctionId: string | number;
  bidderId: string | number;
  bidderName?: string;
  amount: number;
  status: BidStatus;
  isWinning: boolean;
  isOutbid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuctionState {
  auction: Auction;
  currentBid: number;
  highestBidder?: string | number;
  highestBidderName?: string;
  timeRemainingMs: number;
  isEnding: boolean;
  hasEnded: boolean;
  bidCount: number;
  recentBids: Bid[];
  extensionCount: number;
  autoExtendEnabled: boolean;
  canBid: boolean;
  userBidStatus?: BidStatus;
  userHighestBid?: number;
  phase?: AuctionPhase;
  extensions?: AuctionExtension[];
}

export interface BidHistory {
  bids: Bid[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuctionExtension {
  id: string | number;
  auctionId: string | number;
  previousEndTime: Date;
  newEndTime: Date;
  extensionMs: number;
  extensionNumber: number;
  triggeredByUserId: string | number;
  createdAt: Date;
}

export interface AuctionRules {
  minBidIncrement: number;
  autoExtendEnabled: boolean;
  autoExtendThresholdMs: number;
  autoExtendDurationMs: number;
  maxExtensions: number;
  reservePrice?: number;
  buyNowPrice?: number;
  auctionStartsAt: Date;
  auctionEndsAt: Date;
  currency: string;
  bidRetractionPeriodMs: number;
  winnerSelectionPeriodMs: number;
}

export interface AuctionCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isEnded: boolean;
  isEnding: boolean;
  formatted: string;
}

export interface AuctionEngine {
  currentAuction: Auction | null;
  auctionState: AuctionState | null;
  bidHistory: BidHistory | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
}

export interface PlaceBidRequest {
  auctionId: string | number;
  amount: number;
  userId: string | number;
}

export interface PlaceBidResult {
  success: boolean;
  bid?: Bid;
  auction?: Auction;
  error?: string;
  wasExtended?: boolean;
  extensionInfo?: {
    previousEndTime: Date;
    newEndTime: Date;
    extensionNumber: number;
  };
  outbidUsers?: (string | number)[];
}

export interface AuctionFilter {
  status?: AuctionStatus[];
  category?: string[];
  priceMin?: number;
  priceMax?: number;
  endingSoon?: boolean;
  hasBids?: boolean;
  sellerId?: string | number;
  search?: string;
  sortBy?: 'createdAt' | 'endingAt' | 'currentBid' | 'bidCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AuctionList {
  auctions: Auction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Helper functions for auction state management
export const getAuctionStatusColor = (status: AuctionStatus): string => {
  switch (status) {
    case AuctionStatus.ACTIVE:
      return '#10b981'; // Green
    case AuctionStatus.ENDED:
    case AuctionStatus.SOLD:
      return '#3b82f6'; // Blue
    case AuctionStatus.EXPIRED:
    case AuctionStatus.CANCELLED:
    case AuctionStatus.DELETED:
      return '#ef4444'; // Red
    case AuctionStatus.SCHEDULED:
      return '#f59e0b'; // Yellow
    default:
      return '#6b7280'; // Gray
  }
};

export const getAuctionStatusLabel = (status: AuctionStatus): string => {
  switch (status) {
    case AuctionStatus.ACTIVE:
      return 'Active';
    case AuctionStatus.ENDED:
      return 'Ended';
    case AuctionStatus.SOLD:
      return 'Sold';
    case AuctionStatus.EXPIRED:
      return 'Expired';
    case AuctionStatus.CANCELLED:
      return 'Cancelled';
    case AuctionStatus.DELETED:
      return 'Deleted';
    case AuctionStatus.SCHEDULED:
      return 'Scheduled';
    default:
      return 'Unknown';
  }
};

export const getBidStatusColor = (status: BidStatus): string => {
  switch (status) {
    case BidStatus.WINNING:
    case BidStatus.WON:
      return '#10b981'; // Green
    case BidStatus.ACTIVE:
      return '#3b82f6'; // Blue
    case BidStatus.OUTBID:
      return '#f59e0b'; // Yellow
    case BidStatus.CANCELLED:
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
};

export const getBidStatusLabel = (status: BidStatus): string => {
  switch (status) {
    case BidStatus.WINNING:
      return 'Winning';
    case BidStatus.WON:
      return 'Won';
    case BidStatus.ACTIVE:
      return 'Active';
    case BidStatus.OUTBID:
      return 'Outbid';
    case BidStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

export const formatCountdown = (timeRemainingMs: number): AuctionCountdown => {
  const totalMs = Math.max(0, timeRemainingMs);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
  
  const isEnded = totalMs === 0;
  const isEnding = totalMs > 0 && totalMs < 120000; // Less than 2 minutes
  
  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }
  
  if (isEnded) {
    formatted = 'Ended';
  }
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    isEnded,
    isEnding,
    formatted
  };
};

export const calculateNextBidAmount = (currentBid: number, minIncrement: number): number => {
  return currentBid + minIncrement;
};

export const isValidBidAmount = (amount: number, currentBid: number, minIncrement: number): boolean => {
  return amount >= currentBid + minIncrement;
};

export const isAuctionActive = (auction: Auction): boolean => {
  const now = new Date();
  return auction.status === AuctionStatus.ACTIVE && 
         auction.auctionStartsAt <= now && 
         auction.auctionEndsAt > now;
};

export const getAuctionTimeRemaining = (auction: Auction): number => {
  const now = new Date();
  if (auction.auctionEndsAt <= now) {
    return 0;
  }
  return auction.auctionEndsAt.getTime() - now.getTime();
};
