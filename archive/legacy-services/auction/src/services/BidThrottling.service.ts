import {
  BidThrottlingRequest,
  BidThrottlingResult,
  ThrottlingDecision,
  ThrottlingReason,
  RateLimitTracker,
  ThrottlingEventLog,
  ThrottlingStatistics
} from '../types/BidThrottling.types';
import { bidThrottlingConfig } from '../config/bidThrottling.config';

// Rules Engine types (will be available when integrated)
interface RuleContext {
  actor: {
    id: string;
    type: string;
    metadata?: Record<string, any>;
  };
  target: {
    id: string;
    type: string;
    metadata?: Record<string, any>;
  };
  action: {
    type: string;
    metadata?: Record<string, any>;
  };
  environment: {
    timestamp: Date;
  };
}

interface RulesIntegrationResult {
  shouldBlock: boolean;
  shouldReview: boolean;
  summary: string;
}

// Mock Rules Engine integration (to be replaced with actual integration)
class MockRulesIntegration {
  async checkBidPlacement(
    userId: string,
    auctionId: string,
    bidAmount: number,
    userMetadata?: Record<string, any>
  ): Promise<RulesIntegrationResult> {
    // For now, always allow - will be replaced with actual Rules Engine
    return {
      shouldBlock: false,
      shouldReview: false,
      summary: 'Rules Engine integration not yet implemented'
    };
  }
}

const rulesIntegration = new MockRulesIntegration();

/**
 * Anti-Fraud Bid Throttling Service
 * 
 * Prevents bid spamming, bot behavior, and artificial price inflation
 * WITHOUT blocking legitimate users
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority
 * - No bid is rejected client-side
 * - Throttling is enforced ONLY in backend
 * - Throttling does NOT mutate auction state
 * - Every throttling decision MUST be logged as an event
 */
export class BidThrottling {
  private rateLimitTrackers: Map<string, RateLimitTracker> = new Map();
  private eventLog: ThrottlingEventLog[] = [];
  private statistics: ThrottlingStatistics = {
    totalRequests: 0,
    allowedRequests: 0,
    tempBlockedRequests: 0,
    flaggedRequests: 0,
    averageResponseTime: 0,
    topFlaggedUsers: [],
    topBlockedIPs: []
  };

  /**
   * Evaluate bid request for throttling
   * 
   * @param request Bid throttling request
   * @returns Throttling decision with metadata
   */
  async evaluateBid(request: BidThrottlingRequest): Promise<BidThrottlingResult> {
    const startTime = Date.now();
    
    try {
      this.statistics.totalRequests++;
      
      // Get or create rate limit tracker
      const trackerKey = `${request.userId}:${request.auctionId}:${request.ipAddress}`;
      let tracker = this.rateLimitTrackers.get(trackerKey);
      
      if (!tracker) {
        tracker = {
          userId: request.userId,
          auctionId: request.auctionId,
          ipAddress: request.ipAddress,
          bidTimestamps: [],
          auctionBidTimestamps: [],
          ipBidTimestamps: [],
          consecutiveBlocks: 0
        };
        this.rateLimitTrackers.set(trackerKey, tracker);
      }

      // Check if user is temporarily blocked
      if (this.isTemporarilyBlocked(tracker)) {
        const result = this.createTempBlockResult(request, tracker, ThrottlingReason.USER_RATE_LIMIT_EXCEEDED);
        this.logThrottlingEvent(request, result);
        this.statistics.tempBlockedRequests++;
        return result;
      }

      // Check rate limits
      const rateLimitResult = this.checkRateLimits(request, tracker);
      if (rateLimitResult.decision !== ThrottlingDecision.ALLOW) {
        this.updateTrackerAfterBlock(tracker);
        this.logThrottlingEvent(request, rateLimitResult);
        
        if (rateLimitResult.decision === ThrottlingDecision.TEMP_BLOCK) {
          this.statistics.tempBlockedRequests++;
        } else {
          this.statistics.flaggedRequests++;
        }
        
        return rateLimitResult;
      }

      // Integrate with Rules Engine if available
      const rulesEngineResult = await this.checkRulesEngine(request);
      if (rulesEngineResult.decision !== ThrottlingDecision.ALLOW) {
        this.logThrottlingEvent(request, rulesEngineResult);
        
        if (rulesEngineResult.decision === ThrottlingDecision.TEMP_BLOCK) {
          this.statistics.tempBlockedRequests++;
        } else {
          this.statistics.flaggedRequests++;
        }
        
        return rulesEngineResult;
      }

      // Allow the bid
      this.updateTrackerAfterAllow(tracker);
      const allowResult = this.createAllowResult(request, tracker);
      this.logThrottlingEvent(request, allowResult);
      this.statistics.allowedRequests++;
      
      return allowResult;
      
    } finally {
      // Update response time statistics
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeStats(responseTime);
    }
  }

  /**
   * Check if user is temporarily blocked
   */
  private isTemporarilyBlocked(tracker: RateLimitTracker): boolean {
    if (!tracker.lastBlockTime) {
      return false;
    }
    
    const blockDuration = bidThrottlingConfig.tempBlockDurationMinutes * 60 * 1000;
    const timeSinceBlock = Date.now() - tracker.lastBlockTime.getTime();
    
    return timeSinceBlock < blockDuration;
  }

  /**
   * Check all rate limits
   */
  private checkRateLimits(request: BidThrottlingRequest, tracker: RateLimitTracker): BidThrottlingResult {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Clean old timestamps
    this.cleanOldTimestamps(tracker, oneHourAgo);

    // Calculate current rates
    const currentRates = this.calculateCurrentRates(tracker, oneMinuteAgo, oneHourAgo);

    // Check user rate limits
    if (currentRates.userBidsPerMinute > bidThrottlingConfig.maxBidsPerMinutePerUser) {
      return this.createTempBlockResult(request, tracker, ThrottlingReason.USER_RATE_LIMIT_EXCEEDED, currentRates);
    }

    if (currentRates.userBidsPerHour > bidThrottlingConfig.maxBidsPerHourPerUser) {
      return this.createTempBlockResult(request, tracker, ThrottlingReason.USER_RATE_LIMIT_EXCEEDED, currentRates);
    }

    if (currentRates.userBidsPerAuction > bidThrottlingConfig.maxBidsPerAuctionPerUser) {
      return this.createTempBlockResult(request, tracker, ThrottlingReason.USER_RATE_LIMIT_EXCEEDED, currentRates);
    }

    // Check auction rate limits
    if (currentRates.auctionBidsPerMinute > bidThrottlingConfig.maxBidsPerMinutePerAuction) {
      return this.createTempBlockResult(request, tracker, ThrottlingReason.AUCTION_RATE_LIMIT_EXCEEDED, currentRates);
    }

    if (currentRates.auctionBidsPerHour > bidThrottlingConfig.maxBidsPerHourPerAuction) {
      return this.createTempBlockResult(request, tracker, ThrottlingReason.AUCTION_RATE_LIMIT_EXCEEDED, currentRates);
    }

    // Check IP rate limits (secondary signal)
    if (currentRates.ipBidsPerMinute > bidThrottlingConfig.maxBidsPerMinutePerIP) {
      return this.createFlagResult(request, tracker, ThrottlingReason.IP_RATE_LIMIT_EXCEEDED, currentRates);
    }

    if (currentRates.ipBidsPerHour > bidThrottlingConfig.maxBidsPerHourPerIP) {
      return this.createFlagResult(request, tracker, ThrottlingReason.IP_RATE_LIMIT_EXCEEDED, currentRates);
    }

    // Check for suspicious patterns
    const suspiciousPatternResult = this.checkSuspiciousPatterns(request, tracker, currentRates);
    if (suspiciousPatternResult) {
      return suspiciousPatternResult;
    }

    // All checks passed
    return this.createAllowResult(request, tracker, currentRates);
  }

  /**
   * Clean old timestamps from tracker
   */
  private cleanOldTimestamps(tracker: RateLimitTracker, cutoffTime: Date): void {
    tracker.bidTimestamps = tracker.bidTimestamps.filter(ts => ts > cutoffTime);
    tracker.auctionBidTimestamps = tracker.auctionBidTimestamps.filter(ts => ts > cutoffTime);
    tracker.ipBidTimestamps = tracker.ipBidTimestamps.filter(ts => ts > cutoffTime);
  }

  /**
   * Calculate current rates
   */
  private calculateCurrentRates(tracker: RateLimitTracker, oneMinuteAgo: Date, oneHourAgo: Date) {
    const userBidsPerMinute = tracker.bidTimestamps.filter(ts => ts > oneMinuteAgo).length;
    const userBidsPerHour = tracker.bidTimestamps.filter(ts => ts > oneHourAgo).length;
    const userBidsPerAuction = tracker.auctionBidTimestamps.length;
    const auctionBidsPerMinute = tracker.auctionBidTimestamps.filter(ts => ts > oneMinuteAgo).length;
    const auctionBidsPerHour = tracker.auctionBidTimestamps.filter(ts => ts > oneHourAgo).length;
    const ipBidsPerMinute = tracker.ipBidTimestamps.filter(ts => ts > oneMinuteAgo).length;
    const ipBidsPerHour = tracker.ipBidTimestamps.filter(ts => ts > oneHourAgo).length;

    return {
      userBidsPerMinute,
      userBidsPerHour,
      userBidsPerAuction,
      auctionBidsPerMinute,
      auctionBidsPerHour,
      ipBidsPerMinute,
      ipBidsPerHour
    };
  }

  /**
   * Check for suspicious bidding patterns
   */
  private checkSuspiciousPatterns(
    request: BidThrottlingRequest,
    tracker: RateLimitTracker,
    currentRates: any
  ): BidThrottlingResult | null {
    // Check for consecutive blocks pattern
    if (tracker.consecutiveBlocks >= bidThrottlingConfig.flagThresholdConsecutiveBlocks) {
      return this.createFlagResult(request, tracker, ThrottlingReason.SUSPICIOUS_PATTERN, currentRates);
    }

    // Check for high frequency bidding
    if (currentRates.userBidsPerMinute >= bidThrottlingConfig.flagThresholdHighFrequency) {
      return this.createFlagResult(request, tracker, ThrottlingReason.SUSPICIOUS_PATTERN, currentRates);
    }

    return null;
  }

  /**
   * Check Rules Engine output if available
   */
  private async checkRulesEngine(request: BidThrottlingRequest): Promise<BidThrottlingResult> {
    try {
      // Create Rules Engine context
      const context: RuleContext = {
        actor: {
          id: request.userId,
          type: 'USER',
          metadata: {
            bidCount: this.getUserBidCount(request.userId),
            ipAddress: request.ipAddress,
            userAgent: request.userAgent,
            sessionId: request.sessionId
          }
        },
        target: {
          id: request.auctionId,
          type: 'AUCTION',
          metadata: {
            bidAmount: request.bidAmount
          }
        },
        action: {
          type: 'BID',
          metadata: {
            timestamp: request.timestamp
          }
        },
        environment: {
          timestamp: new Date()
        }
      };

      // Evaluate with Rules Engine
      const rulesResult = await rulesIntegration.checkBidPlacement(
        request.userId,
        request.auctionId,
        request.bidAmount,
        context.actor.metadata
      );

      // Convert Rules Engine decision to throttling decision
      if (rulesResult.shouldBlock) {
        return this.createTempBlockResult(request, this.getTracker(request), ThrottlingReason.RULES_ENGINE_DENY, undefined, rulesResult);
      }

      if (rulesResult.shouldReview) {
        return this.createFlagResult(request, this.getTracker(request), ThrottlingReason.RULES_ENGINE_FLAG, undefined, rulesResult);
      }

      // Rules Engine allows, continue with normal flow
      return this.createAllowResult(request, this.getTracker(request));
      
    } catch (error) {
      // Rules Engine failure - allow by default but log
      console.warn('[BidThrottling] Rules Engine unavailable, allowing by default:', error);
      return this.createAllowResult(request, this.getTracker(request));
    }
  }

  /**
   * Get tracker for request
   */
  private getTracker(request: BidThrottlingRequest): RateLimitTracker {
    const trackerKey = `${request.userId}:${request.auctionId}:${request.ipAddress}`;
    return this.rateLimitTrackers.get(trackerKey) || {
      userId: request.userId,
      auctionId: request.auctionId,
      ipAddress: request.ipAddress,
      bidTimestamps: [],
      auctionBidTimestamps: [],
      ipBidTimestamps: [],
      consecutiveBlocks: 0
    };
  }

  /**
   * Get user bid count
   */
  private getUserBidCount(userId: string): number {
    let count = 0;
    for (const tracker of this.rateLimitTrackers.values()) {
      if (tracker.userId === userId) {
        count += tracker.bidTimestamps.length;
      }
    }
    return count;
  }

  /**
   * Update tracker after block
   */
  private updateTrackerAfterBlock(tracker: RateLimitTracker): void {
    tracker.consecutiveBlocks++;
    tracker.lastBlockTime = new Date();
  }

  /**
   * Update tracker after allow
   */
  private updateTrackerAfterAllow(tracker: RateLimitTracker): void {
    tracker.consecutiveBlocks = 0; // Reset consecutive blocks
  }

  /**
   * Create TEMP_BLOCK result
   */
  private createTempBlockResult(
    request: BidThrottlingRequest,
    tracker: RateLimitTracker,
    reason: ThrottlingReason,
    currentRates?: any,
    rulesEngineOutput?: any
  ): BidThrottlingResult {
    const blockedUntil = new Date(Date.now() + bidThrottlingConfig.tempBlockDurationMinutes * 60 * 1000);
    
    return {
      decision: ThrottlingDecision.TEMP_BLOCK,
      reason,
      message: `Bid temporarily blocked due to ${reason}. Blocked until ${blockedUntil.toISOString()}`,
      metadata: {
        userId: request.userId,
        auctionId: request.auctionId,
        ipAddress: request.ipAddress,
        bidAmount: request.bidAmount,
        timestamp: request.timestamp,
        blockedUntil,
        currentRates,
        rulesEngineOutput
      }
    };
  }

  /**
   * Create FLAG result
   */
  private createFlagResult(
    request: BidThrottlingRequest,
    tracker: RateLimitTracker,
    reason: ThrottlingReason,
    currentRates?: any,
    rulesEngineOutput?: any
  ): BidThrottlingResult {
    tracker.flaggedAt = new Date();
    
    return {
      decision: ThrottlingDecision.FLAG,
      reason,
      message: `Bid flagged for review due to ${reason}`,
      metadata: {
        userId: request.userId,
        auctionId: request.auctionId,
        ipAddress: request.ipAddress,
        bidAmount: request.bidAmount,
        timestamp: request.timestamp,
        currentRates,
        rulesEngineOutput
      }
    };
  }

  /**
   * Create ALLOW result
   */
  private createAllowResult(
    request: BidThrottlingRequest,
    tracker: RateLimitTracker,
    currentRates?: any,
    rulesEngineOutput?: any
  ): BidThrottlingResult {
    // Add current timestamp to tracker
    const now = new Date();
    tracker.bidTimestamps.push(now);
    tracker.auctionBidTimestamps.push(now);
    tracker.ipBidTimestamps.push(now);
    
    return {
      decision: ThrottlingDecision.ALLOW,
      reason: ThrottlingReason.USER_RATE_LIMIT_EXCEEDED, // Default reason, will be overridden
      message: 'Bid allowed',
      metadata: {
        userId: request.userId,
        auctionId: request.auctionId,
        ipAddress: request.ipAddress,
        bidAmount: request.bidAmount,
        timestamp: request.timestamp,
        currentRates,
        rulesEngineOutput
      }
    };
  }

  /**
   * Log throttling event
   */
  private logThrottlingEvent(request: BidThrottlingRequest, result: BidThrottlingResult): void {
    const event: ThrottlingEventLog = {
      id: `throttling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: 'AUCTION_SECURITY',
      type: 'BID_THROTTLING_DECISION',
      timestamp: new Date(),
      data: {
        userId: request.userId,
        auctionId: request.auctionId,
        ipAddress: request.ipAddress,
        decision: result.decision,
        reason: result.reason,
        bidAmount: request.bidAmount,
        metadata: result.metadata
      },
      severity: this.getEventSeverity(result.decision)
    };

    this.eventLog.push(event);
    console.log(`[BidThrottling] ${result.decision}: ${result.reason} for user ${request.userId} on auction ${request.auctionId}`);
  }

  /**
   * Get event severity based on decision
   */
  private getEventSeverity(decision: ThrottlingDecision): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (decision) {
      case ThrottlingDecision.ALLOW:
        return 'LOW';
      case ThrottlingDecision.FLAG:
        return 'MEDIUM';
      case ThrottlingDecision.TEMP_BLOCK:
        return 'HIGH';
      default:
        return 'LOW';
    }
  }

  /**
   * Update response time statistics
   */
  private updateResponseTimeStats(responseTime: number): void {
    const currentAvg = this.statistics.averageResponseTime;
    const totalRequests = this.statistics.totalRequests;
    
    this.statistics.averageResponseTime = (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Get throttling statistics
   */
  getStatistics(): ThrottlingStatistics {
    return { ...this.statistics };
  }

  /**
   * Get event log
   */
  getEventLog(limit?: number): ThrottlingEventLog[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  /**
   * Clear old data (for cleanup)
   */
  clearOldData(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    // Clean old timestamps from all trackers
    for (const tracker of this.rateLimitTrackers.values()) {
      this.cleanOldTimestamps(tracker, cutoffTime);
    }
    
    // Clean old events
    this.eventLog = this.eventLog.filter(event => event.timestamp > cutoffTime);
    
    console.log(`[BidThrottling] Cleaned data older than ${olderThanHours} hours`);
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.rateLimitTrackers.clear();
    this.eventLog = [];
    this.statistics = {
      totalRequests: 0,
      allowedRequests: 0,
      tempBlockedRequests: 0,
      flaggedRequests: 0,
      averageResponseTime: 0,
      topFlaggedUsers: [],
      topBlockedIPs: []
    };
  }
}

// Singleton instance
export const bidThrottling = new BidThrottling();
