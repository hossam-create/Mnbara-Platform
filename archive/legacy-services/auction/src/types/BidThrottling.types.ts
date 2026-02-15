/**
 * Anti-Fraud Bid Throttling Types
 * 
 * Prevents bid spamming, bot behavior, and artificial price inflation
 * WITHOUT blocking legitimate users
 */

export enum ThrottlingDecision {
  ALLOW = 'ALLOW',
  TEMP_BLOCK = 'TEMP_BLOCK',
  FLAG = 'FLAG'
}

export enum ThrottlingReason {
  USER_RATE_LIMIT_EXCEEDED = 'USER_RATE_LIMIT_EXCEEDED',
  AUCTION_RATE_LIMIT_EXCEEDED = 'AUCTION_RATE_LIMIT_EXCEEDED',
  IP_RATE_LIMIT_EXCEEDED = 'IP_RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
  RULES_ENGINE_FLAG = 'RULES_ENGINE_FLAG',
  RULES_ENGINE_DENY = 'RULES_ENGINE_DENY'
}

export interface BidThrottlingConfig {
  // Rate limits per user
  maxBidsPerMinutePerUser: number;
  maxBidsPerHourPerUser: number;
  maxBidsPerAuctionPerUser: number;
  
  // Rate limits per auction
  maxBidsPerMinutePerAuction: number;
  maxBidsPerHourPerAuction: number;
  
  // IP-based limits (secondary signal)
  maxBidsPerMinutePerIP: number;
  maxBidsPerHourPerIP: number;
  
  // Temporary block duration
  tempBlockDurationMinutes: number;
  
  // Flag thresholds
  flagThresholdConsecutiveBlocks: number;
  flagThresholdHighFrequency: number;
}

export interface BidThrottlingRequest {
  userId: string;
  auctionId: string;
  ipAddress: string;
  bidAmount: number;
  timestamp: Date;
  userAgent?: string;
  sessionId?: string;
}

export interface BidThrottlingResult {
  decision: ThrottlingDecision;
  reason: ThrottlingReason;
  message: string;
  metadata: {
    userId: string;
    auctionId: string;
    ipAddress: string;
    bidAmount: number;
    timestamp: Date;
    blockedUntil?: Date;
    currentRates?: {
      userBidsPerMinute: number;
      userBidsPerHour: number;
      userBidsPerAuction: number;
      auctionBidsPerMinute: number;
      auctionBidsPerHour: number;
      ipBidsPerMinute: number;
      ipBidsPerHour: number;
    };
    rulesEngineOutput?: any;
  };
}

export interface RateLimitTracker {
  userId: string;
  auctionId: string;
  ipAddress: string;
  bidTimestamps: Date[];
  auctionBidTimestamps: Date[];
  ipBidTimestamps: Date[];
  consecutiveBlocks: number;
  lastBlockTime?: Date;
  flaggedAt?: Date;
}

export interface ThrottlingEventLog {
  id: string;
  category: 'AUCTION_SECURITY';
  type: 'BID_THROTTLING_DECISION';
  timestamp: Date;
  data: {
    userId: string;
    auctionId: string;
    ipAddress: string;
    decision: ThrottlingDecision;
    reason: ThrottlingReason;
    bidAmount: number;
    metadata: any;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ThrottlingStatistics {
  totalRequests: number;
  allowedRequests: number;
  tempBlockedRequests: number;
  flaggedRequests: number;
  averageResponseTime: number;
  topFlaggedUsers: Array<{
    userId: string;
    flagCount: number;
    lastFlagTime: Date;
  }>;
  topBlockedIPs: Array<{
    ipAddress: string;
    blockCount: number;
    lastBlockTime: Date;
  }>;
}
