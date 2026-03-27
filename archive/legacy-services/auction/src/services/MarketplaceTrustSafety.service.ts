import { marketplaceService } from './Marketplace.service';
import { BuyerRequestState, OfferState, MatchState } from '../types/Marketplace.types';

/**
 * Marketplace Trust & Safety Integration Service
 * 
 * Integrates Marketplace Core Journeys with Trust & Safety system
 * Monitors user behavior, enforces trust rules, and handles safety events
 */

export interface TrustSafetyMarketplaceEvent {
  id: string;
  userId: string;
  userType: 'BUYER' | 'TRAVELER';
  eventType: 'USER_FLAGGED' | 'USER_SUSPENDED' | 'USER_BANNED' | 'CONTENT_VIOLATION' | 'FRAUD_REPORT' | 'TRUST_SCORE_UPDATE';
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  metadata?: Record<string, any>;
  relatedRequestId?: string;
  relatedOfferId?: string;
  relatedMatchId?: string;
}

export interface UserTrustScore {
  userId: string;
  userType: 'BUYER' | 'TRAVELER';
  currentScore: number;
  previousScore: number;
  lastUpdated: Date;
  factors: {
    completedTransactions: number;
    successfulMatches: number;
    cancelledMatches: number;
    reportsReceived: number;
    responseTime: number;
    reliability: number;
  };
}

export interface SafetyRule {
  id: string;
  name: string;
  description: string;
  type: 'USER_BEHAVIOR' | 'CONTENT_SAFETY' | 'FRAUD_PREVENTION' | 'TRUST_ENFORCEMENT';
  enabled: boolean;
  conditions: {
    minTrustScore?: number;
    maxActiveRequests?: number;
    maxActiveOffers?: number;
    prohibitedCountries?: string[];
    restrictedCategories?: string[];
  };
  actions: {
    blockUser: boolean;
    suspendUser: boolean;
    flagContent: boolean;
    requireManualReview: boolean;
    notifyAdmin: boolean;
  };
}

/**
 * Marketplace Trust & Safety Integration Service
 * 
 * Monitors marketplace activities and enforces trust and safety rules
 * Integrates with core marketplace journeys without breaking functionality
 */
export class MarketplaceTrustSafetyService {
  private safetyEvents: Map<string, TrustSafetyMarketplaceEvent[]> = new Map();
  private userTrustScores: Map<string, UserTrustScore> = new Map();
  private safetyRules: Map<string, SafetyRule> = new Map();
  private flaggedUsers: Set<string> = new Set();
  private suspendedUsers: Set<string> = new Set();

  /**
   * Initialize Trust & Safety integration
   */
  initialize(): void {
    console.log('[MarketplaceTrustSafety] Initializing Trust & Safety integration');
    
    // Load default safety rules
    this.loadDefaultSafetyRules();
    
    // Set up event listeners (in real implementation)
    this.setupEventListeners();
    
    console.log('[MarketplaceTrustSafety] Trust & Safety integration initialized');
  }

  /**
   * Handle user flagged event
   */
  handleUserFlagged(event: TrustSafetyMarketplaceEvent): void {
    try {
      console.log(`[MarketplaceTrustSafety] Handling user flagged event for user ${event.userId}`);

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Update user status
      this.flaggedUsers.add(event.userId);

      // Apply safety rules
      this.applySafetyRules(event.userId, event.userType);

      // Handle related marketplace items
      this.handleRelatedMarketplaceItems(event);

    } catch (error) {
      console.error('[MarketplaceTrustSafety] Error handling user flagged:', error);
    }
  }

  /**
   * Handle user suspended event
   */
  handleUserSuspended(event: TrustSafetyMarketplaceEvent): void {
    try {
      console.log(`[MarketplaceTrustSafety] Handling user suspended event for user ${event.userId}`);

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Update user status
      this.suspendedUsers.add(event.userId);

      // Suspend related marketplace items
      this.suspendUserMarketplaceItems(event.userId, event.userType);

    } catch (error) {
      console.error('[MarketplaceTrustSafety] Error handling user suspended:', error);
    }
  }

  /**
   * Handle user banned event
   */
  handleUserBanned(event: TrustSafetyMarketplaceEvent): void {
    try {
      console.log(`[MarketplaceTrustSafety] Handling user banned event for user ${event.userId}`);

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Update user status
      this.suspendedUsers.add(event.userId);

      // Ban related marketplace items
      this.banUserMarketplaceItems(event.userId, event.userType);

    } catch (error) {
      console.error('[MarketplaceTrustSafety] Error handling user banned:', error);
    }
  }

  /**
   * Handle trust score update
   */
  handleTrustScoreUpdate(userId: string, userType: 'BUYER' | 'TRAVELER', newScore: number, reason: string): void {
    try {
      console.log(`[MarketplaceTrustSafety] Updating trust score for user ${userId}: ${newScore}`);

      const previousScore = this.userTrustScores.get(userId)?.currentScore || 50;
      
      const trustScore: UserTrustScore = {
        userId,
        userType,
        currentScore: newScore,
        previousScore,
        lastUpdated: new Date(),
        factors: {
          completedTransactions: 0, // Would be calculated from actual data
          successfulMatches: 0,
          cancelledMatches: 0,
          reportsReceived: 0,
          responseTime: 0,
          reliability: newScore
        }
      };

      this.userTrustScores.set(userId, trustScore);

      // Apply trust-based restrictions
      this.applyTrustBasedRestrictions(userId, userType, newScore);

      console.log(`[MarketplaceTrustSafety] Trust score updated for user ${userId}: ${previousScore} → ${newScore}`);

    } catch (error) {
      console.error('[MarketplaceTrustSafety] Error updating trust score:', error);
    }
  }

  /**
   * Check if user can create request
   */
  canUserCreateRequest(userId: string, userType: 'BUYER'): { canCreate: boolean; reason?: string } {
    try {
      // Check if user is suspended or banned
      if (this.suspendedUsers.has(userId)) {
        return {
          canCreate: false,
          reason: 'User account is suspended'
        };
      }

      // Check trust score requirements
      const trustScore = this.userTrustScores.get(userId);
      const minTrustRule = Array.from(this.safetyRules.values()).find(
        rule => rule.type === 'TRUST_ENFORCEMENT' && rule.enabled && rule.conditions.minTrustScore
      );

      if (minTrustRule && trustScore && trustScore.currentScore < minTrustRule.conditions.minTrustScore!) {
        return {
          canCreate: false,
          reason: `Insufficient trust score. Required: ${minTrustRule.conditions.minTrustScore}, Current: ${trustScore.currentScore}`
        };
      }

      // Check active request limits
      const maxRequestsRule = Array.from(this.safetyRules.values()).find(
        rule => rule.type === 'USER_BEHAVIOR' && rule.enabled && rule.conditions.maxActiveRequests
      );

      if (maxRequestsRule) {
        const activeRequests = marketplaceService.getRequestsForBuyer(userId).filter(
          req => req.state === BuyerRequestState.PENDING_TRAVELER || req.state === BuyerRequestState.OFFERED || req.state === BuyerRequestState.MATCHED
        );

        if (activeRequests.length >= maxRequestsRule.conditions.maxActiveRequests!) {
          return {
            canCreate: false,
            reason: `Maximum active requests limit reached: ${maxRequestsRule.conditions.maxActiveRequests}`
          };
        }
      }

      return { canCreate: true };

    } catch (error) {
      console.error('[MarketplaceTrustSafety] Error checking request creation eligibility:', error);
      return {
        canCreate: false,
        reason: 'Error checking eligibility'
      };
    }
  }

  /**
   * Check if user can submit offer
   */
  canUserSubmitOffer(userId: string, userType: 'TRAVELER'): { canSubmit: boolean; reason?: string } {
    try {
      // Check if user is suspended or banned
      if (this.suspendedUsers.has(userId)) {
        return {
          canSubmit: false,
          reason: 'User account is suspended'
        };
      }

      // Check trust score requirements
      const trustScore = this.userTrustScores.get(userId);
      const minTrustRule = Array.from(this.safetyRules.values()).find(
        rule => rule.type === 'TRUST_ENFORCEMENT' && rule.enabled && rule.conditions.minTrustScore
      );

      if (minTrustRule && trustScore && trustScore.currentScore < minTrustRule.conditions.minTrustScore!) {
        return {
          canSubmit: false,
          reason: `Insufficient trust score. Required: ${minTrustRule.conditions.minTrustScore}, Current: ${trustScore.currentScore}`
        };
      }

      // Check active offer limits
      const maxOffersRule = Array.from(this.safetyRules.values()).find(
        rule => rule.type === 'USER_BEHAVIOR' && rule.enabled && rule.conditions.maxActiveOffers
      );

      if (maxOffersRule) {
        const activeOffers = marketplaceService.getOffersForTraveler(userId).filter(
          offer => offer.state === OfferState.PENDING || offer.state === OfferState.ACCEPTED
        );

        if (activeOffers.length >= maxOffersRule.conditions.maxActiveOffers!) {
          return {
            canSubmit: false,
            reason: `Maximum active offers limit reached: ${maxOffersRule.conditions.maxActiveOffers}`
          };
        }
      }

      return { canSubmit: true };

    } catch (error) {
      console.error('[MarketplaceTrustSafety] Error checking offer submission eligibility:', error);
      return {
        canSubmit: false,
        reason: 'Error checking eligibility'
      };
    }
  }

  /**
   * Get user trust score
   */
  getUserTrustScore(userId: string): UserTrustScore | null {
    return this.userTrustScores.get(userId) || null;
  }

  /**
   * Get safety events for user
   */
  getSafetyEvents(userId: string): TrustSafetyMarketplaceEvent[] {
    return this.safetyEvents.get(userId) || [];
  }

  /**
   * Check if user is flagged
   */
  isUserFlagged(userId: string): boolean {
    return this.flaggedUsers.has(userId);
  }

  /**
   * Check if user is suspended
   */
  isUserSuspended(userId: string): boolean {
    return this.suspendedUsers.has(userId);
  }

  /**
   * Get all safety rules
   */
  getSafetyRules(): SafetyRule[] {
    return Array.from(this.safetyRules.values());
  }

  /**
   * Update safety rule
   */
  updateSafetyRule(ruleId: string, updates: Partial<SafetyRule>): boolean {
    try {
      const existingRule = this.safetyRules.get(ruleId);
      if (!existingRule) {
        return false;
      }

      const updatedRule = { ...existingRule, ...updates };
      this.safetyRules.set(ruleId, updatedRule);

      console.log(`[MarketplaceTrustSafety] Updated safety rule ${ruleId}`);
      return true;

    } catch (error) {
      console.error('[MarketplaceTrustSafety] Error updating safety rule:', error);
      return false;
    }
  }

  /**
   * Store safety event
   */
  private storeSafetyEvent(userId: string, event: TrustSafetyMarketplaceEvent): void {
    const events = this.safetyEvents.get(userId) || [];
    events.push(event);
    this.safetyEvents.set(userId, events);
  }

  /**
   * Handle related marketplace items
   */
  private handleRelatedMarketplaceItems(event: TrustSafetyMarketplaceEvent): void {
    if (event.relatedRequestId) {
      // Handle related buyer request
      const request = marketplaceService.getBuyerRequest(event.relatedRequestId);
      if (request) {
        // Flag or suspend request based on event severity
        if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
          // In real implementation, this would update request status
          console.log(`[MarketplaceTrustSafety] Flagged request ${event.relatedRequestId} due to user safety event`);
        }
      }
    }

    if (event.relatedOfferId) {
      // Handle related offer
      const offer = marketplaceService.getOffersForRequest('').find(o => o.id === event.relatedOfferId);
      if (offer) {
        // Flag or withdraw offer based on event severity
        if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
          // In real implementation, this would update offer status
          console.log(`[MarketplaceTrustSafety] Flagged offer ${event.relatedOfferId} due to user safety event`);
        }
      }
    }

    if (event.relatedMatchId) {
      // Handle related match
      const match = marketplaceService.getMatchesForBuyer('').find(m => m.id === event.relatedMatchId);
      if (match) {
        // Flag or cancel match based on event severity
        if (event.severity === 'CRITICAL') {
          // In real implementation, this would update match status
          console.log(`[MarketplaceTrustSafety] Flagged match ${event.relatedMatchId} due to user safety event`);
        }
      }
    }
  }

  /**
   * Suspend user marketplace items
   */
  private suspendUserMarketplaceItems(userId: string, userType: 'BUYER' | 'TRAVELER'): void {
    if (userType === 'BUYER') {
      // Suspend buyer's active requests
      const requests = marketplaceService.getRequestsForBuyer(userId);
      requests.forEach(request => {
        if (request.state === BuyerRequestState.PENDING_TRAVELER || request.state === BuyerRequestState.OFFERED) {
          // In real implementation, this would update request state to SUSPENDED
          console.log(`[MarketplaceTrustSafety] Suspended buyer request ${request.id} for user ${userId}`);
        }
      });
    } else if (userType === 'TRAVELER') {
      // Suspend traveler's active offers and availabilities
      const offers = marketplaceService.getOffersForTraveler(userId);
      offers.forEach(offer => {
        if (offer.state === OfferState.PENDING) {
          // In real implementation, this would update offer state to SUSPENDED
          console.log(`[MarketplaceTrustSafety] Suspended traveler offer ${offer.id} for user ${userId}`);
        }
      });

      const availabilities = marketplaceService.getAvailabilitiesForTraveler(userId);
      availabilities.forEach(availability => {
        // In real implementation, this would update availability state to SUSPENDED
        console.log(`[MarketplaceTrustSafety] Suspended traveler availability ${availability.id} for user ${userId}`);
      });
    }
  }

  /**
   * Ban user marketplace items
   */
  private banUserMarketplaceItems(userId: string, userType: 'BUYER' | 'TRAVELER'): void {
    if (userType === 'BUYER') {
      // Cancel buyer's active requests
      const requests = marketplaceService.getRequestsForBuyer(userId);
      requests.forEach(request => {
        if (request.state === BuyerRequestState.PENDING_TRAVELER || request.state === BuyerRequestState.OFFERED || request.state === BuyerRequestState.MATCHED) {
          // In real implementation, this would update request state to CANCELLED
          console.log(`[MarketplaceTrustSafety] Cancelled buyer request ${request.id} for banned user ${userId}`);
        }
      });
    } else if (userType === 'TRAVELER') {
      // Cancel traveler's active offers and availabilities
      const offers = marketplaceService.getOffersForTraveler(userId);
      offers.forEach(offer => {
        if (offer.state === OfferState.PENDING || offer.state === OfferState.ACCEPTED) {
          // In real implementation, this would update offer state to CANCELLED
          console.log(`[MarketplaceTrustSafety] Cancelled traveler offer ${offer.id} for banned user ${userId}`);
        }
      });

      const availabilities = marketplaceService.getAvailabilitiesForTraveler(userId);
      availabilities.forEach(availability => {
        // In real implementation, this would update availability state to INACTIVE
        console.log(`[MarketplaceTrustSafety] Deactivated traveler availability ${availability.id} for banned user ${userId}`);
      });
    }
  }

  /**
   * Apply trust-based restrictions
   */
  private applyTrustBasedRestrictions(userId: string, userType: 'BUYER' | 'TRAVELER', trustScore: number): void {
    // Apply restrictions based on trust score
    if (trustScore < 30) {
      // Low trust score - apply strict restrictions
      console.log(`[MarketplaceTrustSafety] Applied strict restrictions for low trust user ${userId} (${trustScore})`);
    } else if (trustScore < 60) {
      // Medium trust score - apply moderate restrictions
      console.log(`[MarketplaceTrustSafety] Applied moderate restrictions for medium trust user ${userId} (${trustScore})`);
    } else {
      // High trust score - minimal restrictions
      console.log(`[MarketplaceTrustSafety] Applied minimal restrictions for high trust user ${userId} (${trustScore})`);
    }
  }

  /**
   * Apply safety rules
   */
  private applySafetyRules(userId: string, userType: 'BUYER' | 'TRAVELER'): void {
    const applicableRules = Array.from(this.safetyRules.values()).filter(
      rule => rule.enabled && (
        rule.type === 'USER_BEHAVIOR' ||
        rule.type === 'CONTENT_SAFETY' ||
        rule.type === 'FRAUD_PREVENTION' ||
        rule.type === 'TRUST_ENFORCEMENT'
      )
    );

    applicableRules.forEach(rule => {
      // Apply rule actions based on conditions
      if (this.evaluateRuleConditions(rule, userId, userType)) {
        this.executeRuleActions(rule, userId, userType);
      }
    });
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateRuleConditions(rule: SafetyRule, userId: string, userType: 'BUYER' | 'TRAVELER'): boolean {
    const trustScore = this.userTrustScores.get(userId);

    // Check trust score condition
    if (rule.conditions.minTrustScore && trustScore && trustScore.currentScore < rule.conditions.minTrustScore) {
      return true;
    }

    // Check active requests condition (for buyers)
    if (rule.conditions.maxActiveRequests && userType === 'BUYER') {
      const activeRequests = marketplaceService.getRequestsForBuyer(userId).filter(
        req => req.state === BuyerRequestState.PENDING_TRAVELER || req.state === BuyerRequestState.OFFERED || req.state === BuyerRequestState.MATCHED
      );
      if (activeRequests.length >= rule.conditions.maxActiveRequests) {
        return true;
      }
    }

    // Check active offers condition (for travelers)
    if (rule.conditions.maxActiveOffers && userType === 'TRAVELER') {
      const activeOffers = marketplaceService.getOffersForTraveler(userId).filter(
        offer => offer.state === OfferState.PENDING || offer.state === OfferState.ACCEPTED
      );
      if (activeOffers.length >= rule.conditions.maxActiveOffers) {
        return true;
      }
    }

    return false;
  }

  /**
   * Execute rule actions
   */
  private executeRuleActions(rule: SafetyRule, userId: string, userType: 'BUYER' | 'TRAVELER'): void {
    if (rule.actions.blockUser) {
      this.suspendedUsers.add(userId);
      console.log(`[MarketplaceTrustSafety] Blocked user ${userId} due to rule ${rule.name}`);
    }

    if (rule.actions.suspendUser) {
      this.suspendedUsers.add(userId);
      console.log(`[MarketplaceTrustSafety] Suspended user ${userId} due to rule ${rule.name}`);
    }

    if (rule.actions.notifyAdmin) {
      console.log(`[MarketplaceTrustSafety] Notified admin about user ${userId} due to rule ${rule.name}`);
      // In real implementation, this would send notification to admin system
    }

    if (rule.actions.requireManualReview) {
      console.log(`[MarketplaceTrustSafety] Flagged user ${userId} for manual review due to rule ${rule.name}`);
      // In real implementation, this would create review case
    }
  }

  /**
   * Load default safety rules
   */
  private loadDefaultSafetyRules(): void {
    const defaultRules: SafetyRule[] = [
      {
        id: 'min_trust_score',
        name: 'Minimum Trust Score',
        description: 'Users must have minimum trust score to participate',
        type: 'TRUST_ENFORCEMENT',
        enabled: true,
        conditions: {
          minTrustScore: 30
        },
        actions: {
          blockUser: false,
          suspendUser: false,
          flagContent: false,
          requireManualReview: true,
          notifyAdmin: false
        }
      },
      {
        id: 'max_buyer_requests',
        name: 'Maximum Buyer Requests',
        description: 'Limit active requests per buyer',
        type: 'USER_BEHAVIOR',
        enabled: true,
        conditions: {
          maxActiveRequests: 5
        },
        actions: {
          blockUser: false,
          suspendUser: false,
          flagContent: false,
          requireManualReview: true,
          notifyAdmin: false
        }
      },
      {
        id: 'max_traveler_offers',
        name: 'Maximum Traveler Offers',
        description: 'Limit active offers per traveler',
        type: 'USER_BEHAVIOR',
        enabled: true,
        conditions: {
          maxActiveOffers: 10
        },
        actions: {
          blockUser: false,
          suspendUser: false,
          flagContent: false,
          requireManualReview: true,
          notifyAdmin: false
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.safetyRules.set(rule.id, rule);
    });
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // In real implementation, this would set up event listeners
    // For now, we'll just log that listeners were set up
    console.log('[MarketplaceTrustSafety] Event listeners set up');
  }

  /**
   * Shutdown integration service
   */
  shutdown(): void {
    console.log('[MarketplaceTrustSafety] Shutting down Trust & Safety integration service');
    
    // In real implementation, this would clean up event listeners
    console.log('[MarketplaceTrustSafety] Trust & Safety integration service shut down');
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.safetyEvents.clear();
    this.userTrustScores.clear();
    this.safetyRules.clear();
    this.flaggedUsers.clear();
    this.suspendedUsers.clear();
  }
}

// Singleton instance
export const marketplaceTrustSafetyService = new MarketplaceTrustSafetyService();
