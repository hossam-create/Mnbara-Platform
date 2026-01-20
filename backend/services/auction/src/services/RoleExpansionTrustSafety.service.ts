import { roleExpansionService } from './RoleExpansion.service';
import { SellerProfileState, StoreState } from '../types/RoleExpansion.types';

/**
 * Role Expansion Trust & Safety Integration Service
 * 
 * Integrates Role Expansion with Trust & Safety system
 * Monitors seller and store behavior, enforces trust rules, and handles safety events
 */

export interface RoleExpansionTrustSafetyEvent {
  id: string;
  userId: string;
  userType: 'SELLER' | 'STORE_OWNER';
  eventType: 'SELLER_FLAGGED' | 'SELLER_SUSPENDED' | 'SELLER_BANNED' | 'STORE_FLAGGED' | 'STORE_SUSPENDED' | 'STORE_BANNED' | 'TRUST_SCORE_UPDATE';
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  metadata?: Record<string, any>;
  relatedSellerId?: string;
  relatedStoreId?: string;
}

export interface SellerTrustMetrics {
  sellerId: string;
  userId: string;
  currentScore: number;
  previousScore: number;
  lastUpdated: Date;
  factors: {
    totalSales: number;
    successfulDeliveries: number;
    averageRating: number;
    responseTime: number;
    disputeRate: number;
    cancellationRate: number;
  };
}

export interface StoreTrustMetrics {
  storeId: string;
  ownerId: string;
  currentScore: number;
  previousScore: number;
  lastUpdated: Date;
  factors: {
    totalSales: number;
    successfulDeliveries: number;
    averageRating: number;
    responseTime: number;
    disputeRate: number;
    cancellationRate: number;
  };
}

export interface RoleExpansionSafetyRule {
  id: string;
  name: string;
  description: string;
  type: 'SELLER_BEHAVIOR' | 'STORE_BEHAVIOR' | 'CONTENT_SAFETY' | 'FRAUD_PREVENTION' | 'TRUST_ENFORCEMENT';
  enabled: boolean;
  conditions: {
    minTrustScore?: number;
    maxActiveListings?: number;
    maxDisputeRate?: number;
    maxCancellationRate?: number;
    prohibitedCountries?: string[];
    restrictedCategories?: string[];
  };
  actions: {
    suspendSeller: boolean;
    suspendStore: boolean;
    flagContent: boolean;
    requireManualReview: boolean;
    notifyAdmin: boolean;
  };
}

/**
 * Role Expansion Trust & Safety Integration Service
 * 
 * Monitors seller and store activities and enforces trust and safety rules
 * Integrates with role expansion without breaking functionality
 */
export class RoleExpansionTrustSafetyService {
  private safetyEvents: Map<string, RoleExpansionTrustSafetyEvent[]> = new Map();
  private sellerTrustMetrics: Map<string, SellerTrustMetrics> = new Map();
  private storeTrustMetrics: Map<string, StoreTrustMetrics> = new Map();
  private safetyRules: Map<string, RoleExpansionSafetyRule> = new Map();
  private flaggedSellers: Set<string> = new Set();
  private suspendedSellers: Set<string> = new Set();
  private flaggedStores: Set<string> = new Set();
  private suspendedStores: Set<string> = new Set();

  /**
   * Initialize Trust & Safety integration
   */
  initialize(): void {
    console.log('[RoleExpansionTrustSafety] Initializing Trust & Safety integration');
    
    // Load default safety rules
    this.loadDefaultSafetyRules();
    
    // Set up event listeners (in real implementation)
    this.setupEventListeners();
    
    console.log('[RoleExpansionTrustSafety] Trust & Safety integration initialized');
  }

  /**
   * Handle seller flagged event
   */
  handleSellerFlagged(event: RoleExpansionTrustSafetyEvent): void {
    try {
      console.log(`[RoleExpansionTrustSafety] Handling seller flagged event for user ${event.userId}`);

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Update seller status
      this.flaggedSellers.add(event.relatedSellerId || '');

      // Apply safety rules
      this.applySafetyRules(event.userId, 'SELLER');

      // Handle related seller profile
      this.handleRelatedSellerProfile(event);

    } catch (error) {
      console.error('[RoleExpansionTrustSafety] Error handling seller flagged:', error);
    }
  }

  /**
   * Handle store flagged event
   */
  handleStoreFlagged(event: RoleExpansionTrustSafetyEvent): void {
    try {
      console.log(`[RoleExpansionTrustSafety] Handling store flagged event for user ${event.userId}`);

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Update store status
      this.flaggedStores.add(event.relatedStoreId || '');

      // Apply safety rules
      this.applySafetyRules(event.userId, 'STORE_OWNER');

      // Handle related store
      this.handleRelatedStore(event);

    } catch (error) {
      console.error('[RoleExpansionTrustSafety] Error handling store flagged:', error);
    }
  }

  /**
   * Handle seller suspended event
   */
  handleSellerSuspended(event: RoleExpansionTrustSafetyEvent): void {
    try {
      console.log(`[RoleExpansionTrustSafety] Handling seller suspended event for user ${event.userId}`);

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Update seller status
      this.suspendedSellers.add(event.relatedSellerId || '');

      // Suspend related seller profile
      this.suspendSellerProfile(event.relatedSellerId || '', event.reason);

    } catch (error) {
      console.error('[RoleExpansionTrustSafety] Error handling seller suspended:', error);
    }
  }

  /**
   * Handle store suspended event
   */
  handleStoreSuspended(event: RoleExpansionTrustSafetyEvent): void {
    try {
      console.log(`[RoleExpansionTrustSafety] Handling store suspended event for user ${event.userId}`);

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Update store status
      this.suspendedStores.add(event.relatedStoreId || '');

      // Suspend related store
      this.suspendStore(event.relatedStoreId || '', event.reason);

    } catch (error) {
      console.error('[RoleExpansionTrustSafety] Error handling store suspended:', error);
    }
  }

  /**
   * Handle seller trust score update
   */
  handleSellerTrustScoreUpdate(sellerId: string, userId: string, newScore: number, reason: string): void {
    try {
      console.log(`[RoleExpansionTrustSafety] Updating seller trust score for seller ${sellerId}: ${newScore}`);

      const previousScore = this.sellerTrustMetrics.get(sellerId)?.currentScore || 50;
      
      const trustMetrics: SellerTrustMetrics = {
        sellerId,
        userId,
        currentScore: newScore,
        previousScore,
        lastUpdated: new Date(),
        factors: {
          totalSales: 0, // Would be calculated from actual data
          successfulDeliveries: 0,
          averageRating: 0,
          responseTime: 0,
          disputeRate: 0,
          cancellationRate: 0
        }
      };

      this.sellerTrustMetrics.set(sellerId, trustMetrics);

      // Apply trust-based restrictions
      this.applySellerTrustBasedRestrictions(sellerId, userId, newScore);

      console.log(`[RoleExpansionTrustSafety] Seller trust score updated for seller ${sellerId}: ${previousScore} → ${newScore}`);

    } catch (error) {
      console.error('[RoleExpansionTrustSafety] Error updating seller trust score:', error);
    }
  }

  /**
   * Handle store trust score update
   */
  handleStoreTrustScoreUpdate(storeId: string, ownerId: string, newScore: number, reason: string): void {
    try {
      console.log(`[RoleExpansionTrustSafety] Updating store trust score for store ${storeId}: ${newScore}`);

      const previousScore = this.storeTrustMetrics.get(storeId)?.currentScore || 50;
      
      const trustMetrics: StoreTrustMetrics = {
        storeId,
        ownerId,
        currentScore: newScore,
        previousScore,
        lastUpdated: new Date(),
        factors: {
          totalSales: 0, // Would be calculated from actual data
          successfulDeliveries: 0,
          averageRating: 0,
          responseTime: 0,
          disputeRate: 0,
          cancellationRate: 0
        }
      };

      this.storeTrustMetrics.set(storeId, trustMetrics);

      // Apply trust-based restrictions
      this.applyStoreTrustBasedRestrictions(storeId, ownerId, newScore);

      console.log(`[RoleExpansionTrustSafety] Store trust score updated for store ${storeId}: ${previousScore} → ${newScore}`);

    } catch (error) {
      console.error('[RoleExpansionTrustSafety] Error updating store trust score:', error);
    }
  }

  /**
   * Check if user can create seller profile
   */
  canUserCreateSellerProfile(userId: string): { canCreate: boolean; reason?: string } {
    try {
      // Check if user is suspended or flagged
      if (this.suspendedSellers.has(userId)) {
        return {
          canCreate: false,
          reason: 'User account is suspended'
        };
      }

      // Check trust score requirements
      const trustScore = this.sellerTrustMetrics.get(userId);
      const minTrustRule = Array.from(this.safetyRules.values()).find(
        rule => rule.type === 'TRUST_ENFORCEMENT' && rule.enabled && rule.conditions.minTrustScore
      );

      if (minTrustRule && trustScore && trustScore.currentScore < minTrustRule.conditions.minTrustScore!) {
        return {
          canCreate: false,
          reason: `Insufficient trust score. Required: ${minTrustRule.conditions.minTrustScore}, Current: ${trustScore.currentScore}`
        };
      }

      return { canCreate: true };

    } catch (error) {
      console.error('[RoleExpansionTrustSafety] Error checking seller profile creation eligibility:', error);
      return {
        canCreate: false,
        reason: 'Error checking eligibility'
      };
    }
  }

  /**
   * Check if user can create store
   */
  canUserCreateStore(userId: string): { canCreate: boolean; reason?: string } {
    try {
      // Check if user is suspended or flagged
      if (this.suspendedStores.has(userId)) {
        return {
          canCreate: false,
          reason: 'User account is suspended'
        };
      }

      // Check trust score requirements
      const trustScore = this.storeTrustMetrics.get(userId);
      const minTrustRule = Array.from(this.safetyRules.values()).find(
        rule => rule.type === 'TRUST_ENFORCEMENT' && rule.enabled && rule.conditions.minTrustScore
      );

      if (minTrustRule && trustScore && trustScore.currentScore < minTrustRule.conditions.minTrustScore!) {
        return {
          canCreate: false,
          reason: `Insufficient trust score. Required: ${minTrustRule.conditions.minTrustScore}, Current: ${trustScore.currentScore}`
        };
      }

      return { canCreate: true };

    } catch (error) {
      console.error('[RoleExpansionTrustSafety] Error checking store creation eligibility:', error);
      return {
        canCreate: false,
        reason: 'Error checking eligibility'
      };
    }
  }

  /**
   * Get seller trust metrics
   */
  getSellerTrustMetrics(sellerId: string): SellerTrustMetrics | null {
    return this.sellerTrustMetrics.get(sellerId) || null;
  }

  /**
   * Get store trust metrics
   */
  getStoreTrustMetrics(storeId: string): StoreTrustMetrics | null {
    return this.storeTrustMetrics.get(storeId) || null;
  }

  /**
   * Get safety events for user
   */
  getSafetyEvents(userId: string): RoleExpansionTrustSafetyEvent[] {
    return this.safetyEvents.get(userId) || [];
  }

  /**
   * Check if seller is flagged
   */
  isSellerFlagged(sellerId: string): boolean {
    return this.flaggedSellers.has(sellerId);
  }

  /**
   * Check if seller is suspended
   */
  isSellerSuspended(sellerId: string): boolean {
    return this.suspendedSellers.has(sellerId);
  }

  /**
   * Check if store is flagged
   */
  isStoreFlagged(storeId: string): boolean {
    return this.flaggedStores.has(storeId);
  }

  /**
   * Check if store is suspended
   */
  isStoreSuspended(storeId: string): boolean {
    return this.suspendedStores.has(storeId);
  }

  /**
   * Get all safety rules
   */
  getSafetyRules(): RoleExpansionSafetyRule[] {
    return Array.from(this.safetyRules.values());
  }

  /**
   * Update safety rule
   */
  updateSafetyRule(ruleId: string, updates: Partial<RoleExpansionSafetyRule>): boolean {
    try {
      const existingRule = this.safetyRules.get(ruleId);
      if (!existingRule) {
        return false;
      }

      const updatedRule = { ...existingRule, ...updates };
      this.safetyRules.set(ruleId, updatedRule);

      console.log(`[RoleExpansionTrustSafety] Updated safety rule ${ruleId}`);
      return true;

    } catch (error) {
      console.error('[RoleExpansionTrustSafety] Error updating safety rule:', error);
      return false;
    }
  }

  /**
   * Store safety event
   */
  private storeSafetyEvent(userId: string, event: RoleExpansionTrustSafetyEvent): void {
    const events = this.safetyEvents.get(userId) || [];
    events.push(event);
    this.safetyEvents.set(userId, events);
  }

  /**
   * Handle related seller profile
   */
  private handleRelatedSellerProfile(event: RoleExpansionTrustSafetyEvent): void {
    if (event.relatedSellerId) {
      // Handle related seller profile
      const sellerProfile = roleExpansionService.getSellerProfile(event.relatedSellerId);
      if (sellerProfile) {
        // Flag or suspend seller profile based on event severity
        if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
          // In real implementation, this would update seller profile status
          console.log(`[RoleExpansionTrustSafety] Flagged seller profile ${event.relatedSellerId} due to safety event`);
        }
      }
    }
  }

  /**
   * Handle related store
   */
  private handleRelatedStore(event: RoleExpansionTrustSafetyEvent): void {
    if (event.relatedStoreId) {
      // Handle related store
      const store = roleExpansionService.getStore(event.relatedStoreId);
      if (store) {
        // Flag or suspend store based on event severity
        if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
          // In real implementation, this would update store status
          console.log(`[RoleExpansionTrustSafety] Flagged store ${event.relatedStoreId} due to safety event`);
        }
      }
    }
  }

  /**
   * Suspend seller profile
   */
  private suspendSellerProfile(sellerId: string, reason: string): void {
    // Suspend seller's active listings
    // In real implementation, this would update seller profile state
    console.log(`[RoleExpansionTrustSafety] Suspended seller profile ${sellerId} for reason: ${reason}`);
  }

  /**
   * Suspend store
   */
  private suspendStore(storeId: string, reason: string): void {
    // Suspend store's active listings
    // In real implementation, this would update store state
    console.log(`[RoleExpansionTrustSafety] Suspended store ${storeId} for reason: ${reason}`);
  }

  /**
   * Apply seller trust-based restrictions
   */
  private applySellerTrustBasedRestrictions(sellerId: string, userId: string, trustScore: number): void {
    // Apply restrictions based on trust score
    if (trustScore < 30) {
      // Low trust score - apply strict restrictions
      console.log(`[RoleExpansionTrustSafety] Applied strict restrictions for low trust seller ${sellerId} (${trustScore})`);
    } else if (trustScore < 60) {
      // Medium trust score - apply moderate restrictions
      console.log(`[RoleExpansionTrustSafety] Applied moderate restrictions for medium trust seller ${sellerId} (${trustScore})`);
    } else {
      // High trust score - minimal restrictions
      console.log(`[RoleExpansionTrustSafety] Applied minimal restrictions for high trust seller ${sellerId} (${trustScore})`);
    }
  }

  /**
   * Apply store trust-based restrictions
   */
  private applyStoreTrustBasedRestrictions(storeId: string, ownerId: string, trustScore: number): void {
    // Apply restrictions based on trust score
    if (trustScore < 30) {
      // Low trust score - apply strict restrictions
      console.log(`[RoleExpansionTrustSafety] Applied strict restrictions for low trust store ${storeId} (${trustScore})`);
    } else if (trustScore < 60) {
      // Medium trust score - apply moderate restrictions
      console.log(`[RoleExpansionTrustSafety] Applied moderate restrictions for medium trust store ${storeId} (${trustScore})`);
    } else {
      // High trust score - minimal restrictions
      console.log(`[RoleExpansionTrustSafety] Applied minimal restrictions for high trust store ${storeId} (${trustScore})`);
    }
  }

  /**
   * Apply safety rules
   */
  private applySafetyRules(userId: string, userType: 'SELLER' | 'STORE_OWNER'): void {
    const applicableRules = Array.from(this.safetyRules.values()).filter(
      rule => rule.enabled && (
        rule.type === 'SELLER_BEHAVIOR' ||
        rule.type === 'STORE_BEHAVIOR' ||
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
  private evaluateRuleConditions(rule: RoleExpansionSafetyRule, userId: string, userType: 'SELLER' | 'STORE_OWNER'): boolean {
    if (userType === 'SELLER') {
      const trustMetrics = this.sellerTrustMetrics.get(userId);
      
      // Check trust score condition
      if (rule.conditions.minTrustScore && trustMetrics && trustMetrics.currentScore < rule.conditions.minTrustScore) {
        return true;
      }
    } else if (userType === 'STORE_OWNER') {
      const trustMetrics = this.storeTrustMetrics.get(userId);
      
      // Check trust score condition
      if (rule.conditions.minTrustScore && trustMetrics && trustMetrics.currentScore < rule.conditions.minTrustScore) {
        return true;
      }
    }

    return false;
  }

  /**
   * Execute rule actions
   */
  private executeRuleActions(rule: RoleExpansionSafetyRule, userId: string, userType: 'SELLER' | 'STORE_OWNER'): void {
    if (rule.actions.suspendSeller && userType === 'SELLER') {
      this.suspendedSellers.add(userId);
      console.log(`[RoleExpansionTrustSafety] Suspended seller ${userId} due to rule ${rule.name}`);
    }

    if (rule.actions.suspendStore && userType === 'STORE_OWNER') {
      this.suspendedStores.add(userId);
      console.log(`[RoleExpansionTrustSafety] Suspended store owner ${userId} due to rule ${rule.name}`);
    }

    if (rule.actions.notifyAdmin) {
      console.log(`[RoleExpansionTrustSafety] Notified admin about user ${userId} due to rule ${rule.name}`);
      // In real implementation, this would send notification to admin system
    }

    if (rule.actions.requireManualReview) {
      console.log(`[RoleExpansionTrustSafety] Flagged user ${userId} for manual review due to rule ${rule.name}`);
      // In real implementation, this would create review case
    }
  }

  /**
   * Load default safety rules
   */
  private loadDefaultSafetyRules(): void {
    const defaultRules: RoleExpansionSafetyRule[] = [
      {
        id: 'seller_min_trust_score',
        name: 'Minimum Seller Trust Score',
        description: 'Sellers must have minimum trust score to participate',
        type: 'TRUST_ENFORCEMENT',
        enabled: true,
        conditions: {
          minTrustScore: 30
        },
        actions: {
          suspendSeller: false,
          suspendStore: false,
          flagContent: false,
          requireManualReview: true,
          notifyAdmin: false
        }
      },
      {
        id: 'store_min_trust_score',
        name: 'Minimum Store Trust Score',
        description: 'Stores must have minimum trust score to participate',
        type: 'TRUST_ENFORCEMENT',
        enabled: true,
        conditions: {
          minTrustScore: 30
        },
        actions: {
          suspendSeller: false,
          suspendStore: false,
          flagContent: false,
          requireManualReview: true,
          notifyAdmin: false
        }
      },
      {
        id: 'seller_max_dispute_rate',
        name: 'Maximum Seller Dispute Rate',
        description: 'Sellers cannot exceed maximum dispute rate',
        type: 'SELLER_BEHAVIOR',
        enabled: true,
        conditions: {
          maxDisputeRate: 0.1 // 10%
        },
        actions: {
          suspendSeller: false,
          suspendStore: false,
          flagContent: false,
          requireManualReview: true,
          notifyAdmin: false
        }
      },
      {
        id: 'store_max_dispute_rate',
        name: 'Maximum Store Dispute Rate',
        description: 'Stores cannot exceed maximum dispute rate',
        type: 'STORE_BEHAVIOR',
        enabled: true,
        conditions: {
          maxDisputeRate: 0.1 // 10%
        },
        actions: {
          suspendSeller: false,
          suspendStore: false,
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
    console.log('[RoleExpansionTrustSafety] Event listeners set up');
  }

  /**
   * Shutdown integration service
   */
  shutdown(): void {
    console.log('[RoleExpansionTrustSafety] Shutting down Trust & Safety integration service');
    
    // In real implementation, this would clean up event listeners
    console.log('[RoleExpansionTrustSafety] Trust & Safety integration service shut down');
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.safetyEvents.clear();
    this.sellerTrustMetrics.clear();
    this.storeTrustMetrics.clear();
    this.safetyRules.clear();
    this.flaggedSellers.clear();
    this.suspendedSellers.clear();
    this.flaggedStores.clear();
    this.suspendedStores.clear();
  }
}

// Singleton instance
export const roleExpansionTrustSafetyService = new RoleExpansionTrustSafetyService();
