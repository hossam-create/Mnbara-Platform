import { Injectable, Logger } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

/**
 * Real-time User Matching Service for P2P Swaps
 * Provides instant matching capabilities with WebSocket integration
 */

export interface RealTimeMatchRequest {
  userId: string;
  swapType: 'buy' | 'sell';
  currencyPair: string; // e.g., 'USD/EUR', 'ETH/USDT'
  amount: number;
  preferredPrice?: number;
  timeoutMs?: number;
  matchPreferences?: {
    minTrustScore?: number;
    maxDistanceKm?: number;
    requiredVerifications?: string[];
    excludeUsers?: string[];
  };
}

export interface RealTimeMatch {
  matchId: string;
  userId: string;
  matchedUserId: string;
  swapType: 'buy' | 'sell';
  currencyPair: string;
  amount: number;
  agreedPrice: number;
  matchScore: number;
  trustScore: number;
  estimatedCompletionTime: number; // milliseconds
  createdAt: Date;
}

export interface MatchingPoolUser {
  userId: string;
  socketId: string;
  swapType: 'buy' | 'sell';
  currencyPair: string;
  amount: number;
  preferredPrice?: number;
  trustScore: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  verifications: string[];
  joinedAt: Date;
  lastActivity: Date;
}

@Injectable()
export class RealTimeMatcherService {
  private readonly logger = new Logger(RealTimeMatcherService.name);
  private redis: Redis;
  private matchingPool: Map<string, MatchingPoolUser> = new Map();
  private activeMatches: Map<string, RealTimeMatch> = new Map();

  @WebSocketServer()
  server: Server;

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection for distributed matching
   */
  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
      this.logger.log('Redis connection established for real-time matching');
    } else {
      this.logger.warn('REDIS_URL not configured, using in-memory matching only');
    }
  }

  /**
   * Add user to real-time matching pool
   */
  async joinMatchingPool(userData: MatchingPoolUser): Promise<void> {
    const userKey = this.getUserKey(userData.userId, userData.currencyPair, userData.swapType);
    
    // Store in local memory
    this.matchingPool.set(userKey, {
      ...userData,
      joinedAt: new Date(),
      lastActivity: new Date()
    });

    // Store in Redis for distributed access
    if (this.redis) {
      await this.redis.hset(
        `matching:pool:${userData.currencyPair}:${userData.swapType}`,
        userKey,
        JSON.stringify(userData)
      );
      await this.redis.expire(
        `matching:pool:${userData.currencyPair}:${userData.swapType}`,
        300 // 5 minutes expiration
      );
    }

    this.logger.log(`User ${userData.userId} joined matching pool for ${userData.currencyPair} ${userData.swapType}`);
    
    // Immediately attempt to find matches
    await this.findMatchesForUser(userData);
  }

  /**
   * Remove user from matching pool
   */
  async leaveMatchingPool(userId: string, currencyPair: string, swapType: 'buy' | 'sell'): Promise<void> {
    const userKey = this.getUserKey(userId, currencyPair, swapType);
    
    this.matchingPool.delete(userKey);
    
    if (this.redis) {
      await this.redis.hdel(
        `matching:pool:${currencyPair}:${swapType}`,
        userKey
      );
    }

    this.logger.log(`User ${userId} left matching pool for ${currencyPair} ${swapType}`);
  }

  /**
   * Find potential matches for a user
   */
  private async findMatchesForUser(user: MatchingPoolUser): Promise<void> {
    const oppositeType = user.swapType === 'buy' ? 'sell' : 'buy';
    
    // Get potential matches from both local and Redis pools
    const potentialMatches = await this.getPotentialMatches(
      user.currencyPair,
      oppositeType,
      user
    );

    if (potentialMatches.length === 0) {
      this.logger.debug(`No potential matches found for user ${user.userId}`);
      return;
    }

    // Score and rank matches
    const scoredMatches = potentialMatches
      .map(match => this.scoreMatch(user, match))
      .filter(match => match.matchScore >= 0.6) // Minimum match threshold
      .sort((a, b) => b.matchScore - a.matchScore);

    if (scoredMatches.length > 0) {
      const bestMatch = scoredMatches[0];
      await this.proposeMatch(user, bestMatch.matchedUser, bestMatch.matchScore);
    }
  }

  /**
   * Get potential matches from both local and distributed pools
   */
  private async getPotentialMatches(
    currencyPair: string,
    swapType: 'buy' | 'sell',
    requestingUser: MatchingPoolUser
  ): Promise<MatchingPoolUser[]> {
    const matches: MatchingPoolUser[] = [];

    // Get from local memory
    const localMatches = Array.from(this.matchingPool.values()).filter(
      user => user.currencyPair === currencyPair &&
              user.swapType === swapType &&
              user.userId !== requestingUser.userId
    );

    matches.push(...localMatches);

    // Get from Redis if available
    if (this.redis) {
      try {
        const redisMatches = await this.redis.hgetall(
          `matching:pool:${currencyPair}:${swapType}`
        );

        for (const [key, userData] of Object.entries(redisMatches)) {
          try {
            const user = JSON.parse(userData) as MatchingPoolUser;
            if (user.userId !== requestingUser.userId) {
              matches.push(user);
            }
          } catch (error) {
            this.logger.warn(`Failed to parse user data from Redis: ${error}`);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to get matches from Redis: ${error}`);
      }
    }

    return matches;
  }

  /**
   * Score a potential match based on multiple factors
   */
  private scoreMatch(requester: MatchingPoolUser, candidate: MatchingPoolUser): {
    matchedUser: MatchingPoolUser;
    matchScore: number;
    agreedPrice: number;
  } {
    // Price compatibility (30% weight)
    const priceScore = this.calculatePriceScore(requester, candidate);
    
    // Trust score compatibility (25% weight)
    const trustScore = this.calculateTrustScore(requester.trustScore, candidate.trustScore);
    
    // Amount compatibility (20% weight)
    const amountScore = this.calculateAmountScore(requester.amount, candidate.amount);
    
    // Location proximity (15% weight) if available
    const locationScore = requester.location && candidate.location 
      ? this.calculateLocationScore(requester.location, candidate.location)
      : 0.7; // Default score if location not available
    
    // Verification match (10% weight)
    const verificationScore = this.calculateVerificationScore(requester.verifications, candidate.verifications);

    // Calculate overall match score
    const matchScore = (
      (priceScore * 0.3) +
      (trustScore * 0.25) +
      (amountScore * 0.2) +
      (locationScore * 0.15) +
      (verificationScore * 0.1)
    );

    // Calculate agreed price (average or market-based)
    const agreedPrice = this.calculateAgreedPrice(requester, candidate);

    return {
      matchedUser: candidate,
      matchScore: Math.min(1, Math.max(0, matchScore)), // Clamp between 0-1
      agreedPrice
    };
  }

  /**
   * Calculate price compatibility score
   */
  private calculatePriceScore(requester: MatchingPoolUser, candidate: MatchingPoolUser): number {
    if (!requester.preferredPrice || !candidate.preferredPrice) {
      return 0.8; // Default score if no price preference
    }

    const priceDiff = Math.abs(requester.preferredPrice - candidate.preferredPrice);
    const priceRatio = priceDiff / Math.max(requester.preferredPrice, candidate.preferredPrice);
    
    // Higher score for smaller price differences
    return Math.max(0, 1 - (priceRatio * 2));
  }

  /**
   * Calculate trust score compatibility
   */
  private calculateTrustScore(requesterScore: number, candidateScore: number): number {
    const scoreDiff = Math.abs(requesterScore - candidateScore);
    // Higher score for similar trust levels
    return Math.max(0, 1 - (scoreDiff * 0.5));
  }

  /**
   * Calculate amount compatibility
   */
  private calculateAmountScore(requesterAmount: number, candidateAmount: number): number {
    const amountRatio = Math.min(requesterAmount, candidateAmount) / Math.max(requesterAmount, candidateAmount);
    return amountRatio; // Direct ratio (0-1)
  }

  /**
   * Calculate location proximity score
   */
  private calculateLocationScore(
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number }
  ): number {
    // Simple haversine distance calculation (simplified)
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(loc2.latitude - loc1.latitude);
    const dLon = this.deg2rad(loc2.longitude - loc1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(loc1.latitude)) * Math.cos(this.deg2rad(loc2.latitude)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Score based on distance (0-100km -> 1-0)
    return Math.max(0, 1 - (distance / 100));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Calculate verification compatibility
   */
  private calculateVerificationScore(
    reqVerifications: string[],
    candVerifications: string[]
  ): number {
    if (reqVerifications.length === 0 && candVerifications.length === 0) {
      return 0.5; // Neutral score if no verifications
    }

    const commonVerifications = reqVerifications.filter(v => candVerifications.includes(v));
    const score = commonVerifications.length / Math.max(reqVerifications.length, candVerifications.length);
    
    return Math.max(0.3, score); // Minimum 0.3 score
  }

  /**
   * Calculate agreed price for the match
   */
  private calculateAgreedPrice(requester: MatchingPoolUser, candidate: MatchingPoolUser): number {
    if (requester.preferredPrice && candidate.preferredPrice) {
      // Average of both preferences
      return (requester.preferredPrice + candidate.preferredPrice) / 2;
    } else if (requester.preferredPrice) {
      return requester.preferredPrice;
    } else if (candidate.preferredPrice) {
      return candidate.preferredPrice;
    }
    
    // Default to market price (would fetch from external API in real implementation)
    return this.getMarketPrice(requester.currencyPair);
  }

  /**
   * Get market price for currency pair (mock implementation)
   */
  private getMarketPrice(currencyPair: string): number {
    // Mock market prices - in real implementation, would fetch from exchange API
    const marketPrices: Record<string, number> = {
      'USD/EUR': 0.92,
      'EUR/USD': 1.09,
      'ETH/USDT': 2500,
      'USDT/ETH': 0.0004,
      'BTC/USD': 45000,
      'USD/BTC': 0.000022
    };

    return marketPrices[currencyPair] || 1.0;
  }

  /**
   * Propose a match to both users
   */
  private async proposeMatch(
    user1: MatchingPoolUser,
    user2: MatchingPoolUser,
    matchScore: number
  ): Promise<void> {
    const matchId = this.generateMatchId();
    const agreedPrice = this.calculateAgreedPrice(user1, user2);

    const match: RealTimeMatch = {
      matchId,
      userId: user1.userId,
      matchedUserId: user2.userId,
      swapType: user1.swapType,
      currencyPair: user1.currencyPair,
      amount: Math.min(user1.amount, user2.amount),
      agreedPrice,
      matchScore,
      trustScore: Math.min(user1.trustScore, user2.trustScore),
      estimatedCompletionTime: 30000, // 30 seconds estimate
      createdAt: new Date()
    };

    // Store the match
    this.activeMatches.set(matchId, match);

    // Notify both users via WebSocket
    this.notifyMatchProposal(user1.socketId, match, 'incoming');
    this.notifyMatchProposal(user2.socketId, {
      ...match,
      userId: user2.userId,
      matchedUserId: user1.userId,
      swapType: user2.swapType
    }, 'outgoing');

    this.logger.log(`Match proposed between ${user1.userId} and ${user2.userId} with score ${matchScore}`);
  }

  /**
   * Notify user about match proposal via WebSocket
   */
  private notifyMatchProposal(socketId: string, match: RealTimeMatch, type: 'incoming' | 'outgoing'): void {
    if (this.server) {
      this.server.to(socketId).emit('match:proposal', {
        type,
        match,
        expiresIn: 30000, // 30 seconds to respond
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Accept a match proposal
   */
  async acceptMatch(matchId: string, userId: string): Promise<RealTimeMatch> {
    const match = this.activeMatches.get(matchId);
    
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.userId !== userId && match.matchedUserId !== userId) {
      throw new Error('User not authorized to accept this match');
    }

    // Update match status
    const updatedMatch = { ...match };
    
    // Notify both users about match acceptance
    this.notifyMatchAcceptance(match);

    // Remove users from matching pools
    await this.leaveMatchingPool(match.userId, match.currencyPair, match.swapType);
    await this.leaveMatchingPool(match.matchedUserId, match.currencyPair, 
      match.swapType === 'buy' ? 'sell' : 'buy');

    this.logger.log(`Match ${matchId} accepted by user ${userId}`);
    
    return updatedMatch;
  }

  /**
   * Reject a match proposal
   */
  async rejectMatch(matchId: string, userId: string): Promise<void> {
    const match = this.activeMatches.get(matchId);
    
    if (!match) {
      throw new Error('Match not found');
    }

    this.activeMatches.delete(matchId);
    
    // Notify the other user about rejection
    this.notifyMatchRejection(match, userId);

    this.logger.log(`Match ${matchId} rejected by user ${userId}`);
  }

  /**
   * Notify users about match acceptance
   */
  private notifyMatchAcceptance(match: RealTimeMatch): void {
    if (this.server) {
      this.server.emit('match:accepted', {
        matchId: match.matchId,
        timestamp: new Date().toISOString(),
        message: 'Match accepted successfully'
      });
    }
  }

  /**
   * Notify users about match rejection
   */
  private notifyMatchRejection(match: RealTimeMatch, rejectedBy: string): void {
    if (this.server) {
      const otherUserId = match.userId === rejectedBy ? match.matchedUserId : match.userId;
      
      this.server.to(otherUserId).emit('match:rejected', {
        matchId: match.matchId,
        rejectedBy,
        timestamp: new Date().toISOString(),
        message: 'Match was rejected'
      });
    }
  }

  /**
   * Generate unique match ID
   */
  private generateMatchId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user key for storage
   */
  private getUserKey(userId: string, currencyPair: string, swapType: 'buy' | 'sell'): string {
    return `${userId}:${currencyPair}:${swapType}`;
  }

  /**
   * Get current matching pool statistics
   */
  getPoolStats(): {
    totalUsers: number;
    byCurrencyPair: Record<string, number>;
    byType: { buy: number; sell: number };
  } {
    const stats = {
      totalUsers: this.matchingPool.size,
      byCurrencyPair: {} as Record<string, number>,
      byType: { buy: 0, sell: 0 }
    };

    for (const user of this.matchingPool.values()) {
      stats.byCurrencyPair[user.currencyPair] = (stats.byCurrencyPair[user.currencyPair] || 0) + 1;
      stats.byType[user.swapType]++;
    }

    return stats;
  }

  /**
   * Clean up expired matches and inactive users
   */
  async cleanupExpiredMatches(): Promise<void> {
    const now = Date.now();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

    // Clean inactive users from matching pool
    for (const [key, user] of this.matchingPool.entries()) {
      if (user.lastActivity < fiveMinutesAgo) {
        await this.leaveMatchingPool(user.userId, user.currencyPair, user.swapType);
      }
    }

    // Clean expired matches (older than 10 minutes)
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000);
    for (const [matchId, match] of this.activeMatches.entries()) {
      if (match.createdAt < tenMinutesAgo) {
        this.activeMatches.delete(matchId);
      }
    }
  }
}