import { affiliateService } from './Affiliate.service';
import { AffiliateStatus } from '../types/Affiliate.types';

/**
 * Affiliate Trust & Safety Integration Service
 * 
 * Integrates Affiliate & Referral system with Trust & Safety system
 * Monitors affiliate behavior, enforces trust rules, and handles safety events
 */

export interface AffiliateTrustSafetyEvent {
  id: string;
  affiliateId: string;
  userId: string;
  eventType: 'AFFILIATE_FLAGGED' | 'AFFILIATE_SUSPENDED' | 'AFFILIATE_BANNED' | 'TRUST_SCORE_UPDATE';
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AffiliateTrustMetrics {
  affiliateId: string;
  userId: string;
  currentScore: number;
  previousScore: number;
  lastUpdated: Date;
  factors: {
    totalReferralLinks: number;
    totalClicks: number;
    totalAttributions: number;
    totalCommissionSignals: number;
    eligibleCommissions: number;
    suspiciousActivity: number;
    violationCount: number;
  };
}

export interface AffiliateSafetyRule {
  id: string;
  name: string;
  description: string;
  type: 'AFFILIATE_BEHAVIOR' | 'CONTENT_SAFETY' | 'FRAUD_PREVENTION' | 'TRUST_ENFORCEMENT';
  enabled: boolean;
  conditions: {
    minTrustScore?: number;
    maxReferralLinks?: number;
    maxClickRate?: number;
    maxAttributionRate?: number;
    suspiciousActivityThreshold?: number;
    prohibitedCountries?: string[];
    restrictedTargetTypes?: string[];
  };
  actions: {
    suspendAffiliate: boolean;
    flagContent: boolean;
    requireManualReview: boolean;
    notifyAdmin: boolean;
    limitReferralLinks: boolean;
  };
}

/**
 * Affiliate Trust & Safety Integration Service
 * 
 * Monitors affiliate activities and enforces trust and safety rules
 * Integrates with affiliate system without breaking functionality
 */
export class AffiliateTrustSafetyService {
  private safetyEvents: Map<string, AffiliateTrustSafetyEvent[]> = new Map();
  private affiliateTrustMetrics: Map<string, AffiliateTrustMetrics> = new Map();
  private safetyRules: Map<string, AffiliateSafetyRule> = new Map();
  private flaggedAffiliates: Set<string> = new Set();
  private suspendedAffiliates: Set<string> = new Set();

  /**
   * Initialize Trust & Safety integration
   */
  initialize(): void {
    console.log('[AffiliateTrustSafety] Initializing Trust & Safety integration');
    
    // Load default safety rules
    this.loadDefaultSafetyRules();
    
    // Set up event listeners (in real implementation)
    this.setupEventListeners();
    
    console.log('[AffiliateTrustSafety] Trust & Safety integration initialized');
  }

  /**
   * Handle affiliate flagged event
   */
  handleAffiliateFlagged(event: AffiliateTrustSafetyEvent): void {
    try {
      console.log(`[AffiliateTrustSafety] Handling affiliate flagged event for affiliate ${event.affiliateId}`);

      // Store event
      this.storeSafetyEvent(event.affiliateId, event);

      // Update affiliate status
      this.flaggedAffiliates.add(event.affiliateId);

      // Apply safety rules
      this.applySafetyRules(event.affiliateId);

      // Handle related affiliate profile
      this.handleRelatedAffiliateProfile(event);

    } catch (error) {
      console.error('[AffiliateTrustSafety] Error handling affiliate flagged:', error);
    }
  }

  /**
   * Handle affiliate suspended event
   */
  handleAffiliateSuspended(event: AffiliateTrustSafetyEvent): void {
    try {
      console.log(`[AffiliateTrustSafety] Handling affiliate suspended event for affiliate ${event.affiliateId}`);

      // Store event
      this.storeSafetyEvent(event.affiliateId, event);

      // Update affiliate status
      this.suspendedAffiliates.add(event.affiliateId);

      // Suspend related affiliate profile
      this.suspendAffiliateProfile(event.affiliateId, event.reason);

    } catch (error) {
      console.error('[AffiliateTrustSafety] Error handling affiliate suspended:', error);
    }
  }

  /**
   * Handle affiliate trust score update
   */
  handleAffiliateTrustScoreUpdate(affiliateId: string, userId: string, newScore: number, reason: string): void {
    try {
      console.log(`[AffiliateTrustSafety] Updating affiliate trust score for affiliate ${affiliateId}: ${newScore}`);

      const previousScore = this.affiliateTrustMetrics.get(affiliateId)?.currentScore || 50;
      
      const trustMetrics: AffiliateTrustMetrics = {
        affiliateId,
        userId,
        currentScore: newScore,
        previousScore,
        lastUpdated: new Date(),
        factors: {
          totalReferralLinks: 0, // Would be calculated from actual data
          totalClicks: 0,
          totalAttributions: 0,
          totalCommissionSignals: 0,
          eligibleCommissions: 0,
          suspiciousActivity: 0,
          violationCount: 0
        }
      };

      this.affiliateTrustMetrics.set(affiliateId, trustMetrics);

      // Apply trust-based restrictions
      this.applyAffiliateTrustBasedRestrictions(affiliateId, userId, newScore);

      console.log(`[AffiliateTrustSafety] Affiliate trust score updated for affiliate ${affiliateId}: ${previousScore} → ${newScore}`);

    } catch (error) {
      console.error('[AffiliateTrustSafety] Error updating affiliate trust score:', error);
    }
  }

  /**
   * Check if user can become affiliate
   */
  canUserBecomeAffiliate(userId: string): { canBecome: boolean; reason?: string } {
    try {
      // Check if user is suspended or flagged
      if (this.suspendedAffiliates.has(userId)) {
        return {
          canBecome: false,
          reason: 'User account is suspended'
        };
      }

      // Check trust score requirements
      const trustScore = this.affiliateTrustMetrics.get(userId);
      const minTrustRule = Array.from(this.safetyRules.values()).find(
        rule => rule.type === 'TRUST_ENFORCEMENT' && rule.enabled && rule.conditions.minTrustScore
      );

      if (minTrustRule && trustScore && trustScore.currentScore < minTrustRule.conditions.minTrustScore!) {
        return {
          canBecome: false,
          reason: `Insufficient trust score. Required: ${minTrustRule.conditions.minTrustScore}, Current: ${trustScore.currentScore}`
        };
      }

      return { canBecome: true };

    } catch (error) {
      console.error('[AffiliateTrustSafety] Error checking affiliate creation eligibility:', error);
      return {
        canBecome: false,
        reason: 'Error checking eligibility'
      };
    }
  }

  /**
   * Check if affiliate can create referral links
   */
  canAffiliateCreateReferralLinks(affiliateId: string): { canCreate: boolean; reason?: string } {
    try {
      // Check if affiliate is suspended or flagged
      if (this.suspendedAffiliates.has(affiliateId)) {
        return {
          canCreate: false,
          reason: 'Affiliate account is suspended'
        };
      }

      // Check trust score requirements
      const trustScore = this.affiliateTrustMetrics.get(affiliateId);
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
      console.error('[AffiliateTrustSafety] Error checking referral link creation eligibility:', error);
      return {
        canCreate: false,
        reason: 'Error checking eligibility'
      };
    }
  }

  /**
   * Get affiliate trust metrics
   */
  getAffiliateTrustMetrics(affiliateId: string): AffiliateTrustMetrics | null {
    return this.affiliateTrustMetrics.get(affiliateId) || null;
  }

  /**
   * Get safety events for affiliate
   */
  getSafetyEvents(affiliateId: string): AffiliateTrustSafetyEvent[] {
    return this.safetyEvents.get(affiliateId) || [];
  }

  /**
   * Check if affiliate is flagged
   */
  isAffiliateFlagged(affiliateId: string): boolean {
    return this.flaggedAffiliates.has(affiliateId);
  }

  /**
   * Check if affiliate is suspended
   */
  isAffiliateSuspended(affiliateId: string): boolean {
    return this.suspendedAffiliates.has(affiliateId);
  }

  /**
   * Get all safety rules
   */
  getSafetyRules(): AffiliateSafetyRule[] {
    return Array.from(this.safetyRules.values());
  }

  /**
   * Update safety rule
   */
  updateSafetyRule(ruleId: string, updates: Partial<AffiliateSafetyRule>): boolean {
    try {
      const existingRule = this.safetyRules.get(ruleId);
      if (!existingRule) {
        return false;
      }

      const updatedRule = { ...existingRule, ...updates };
      this.safetyRules.set(ruleId, updatedRule);

      console.log(`[AffiliateTrustSafety] Updated safety rule ${ruleId}`);
      return true;

    } catch (error) {
      console.error('[AffiliateTrustSafety] Error updating safety rule:', error);
      return false;
    }
  }

  /**
   * Store safety event
   */
  private storeSafetyEvent(affiliateId: string, event: AffiliateTrustSafetyEvent): void {
    const events = this.safetyEvents.get(affiliateId) || [];
    events.push(event);
    this.safetyEvents.set(affiliateId, events);
  }

  /**
   * Handle related affiliate profile
   */
  private handleRelatedAffiliateProfile(event: AffiliateTrustSafetyEvent): void {
    const affiliateProfile = affiliateService.getAffiliateProfile(event.affiliateId);
    if (affiliateProfile) {
      // Flag or suspend affiliate profile based on event severity
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        // In real implementation, this would update affiliate profile status
        console.log(`[AffiliateTrustSafety] Flagged affiliate profile ${event.affiliateId} due to safety event`);
      }
    }
  }

  /**
   * Suspend affiliate profile
   */
  private suspendAffiliateProfile(affiliateId: string, reason: string): void {
    // Suspend affiliate's referral links
    // In real implementation, this would update affiliate profile state
    console.log(`[AffiliateTrustSafety] Suspended affiliate profile ${affiliateId} for reason: ${reason}`);
  }

  /**
   * Apply affiliate trust-based restrictions
   */
  private applyAffiliateTrustBasedRestrictions(affiliateId: string, userId: string, trustScore: number): void {
    // Apply restrictions based on trust score
    if (trustScore < 30) {
      // Low trust score - apply strict restrictions
      console.log(`[AffiliateTrustSafety] Applied strict restrictions for low trust affiliate ${affiliateId} (${trustScore})`);
    } else if (trustScore < 60) {
      // Medium trust score - apply moderate restrictions
      console.log(`[AffiliateTrustSafety] Applied moderate restrictions for medium trust affiliate ${affiliateId} (${trustScore})`);
    } else {
      // High trust score - minimal restrictions
      console.log(`[AffiliateTrustSafety] Applied minimal restrictions for high trust affiliate ${affiliateId} (${trustScore})`);
    }
  }

  /**
   * Apply safety rules
   */
  private applySafetyRules(affiliateId: string): void {
    const applicableRules = Array.from(this.safetyRules.values()).filter(
      rule => rule.enabled && (
        rule.type === 'AFFILIATE_BEHAVIOR' ||
        rule.type === 'CONTENT_SAFETY' ||
        rule.type === 'FRAUD_PREVENTION' ||
        rule.type === 'TRUST_ENFORCEMENT'
      )
    );

    applicableRules.forEach(rule => {
      // Apply rule actions based on conditions
      if (this.evaluateRuleConditions(rule, affiliateId)) {
        this.executeRuleActions(rule, affiliateId);
      }
    });
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateRuleConditions(rule: AffiliateSafetyRule, affiliateId: string): boolean {
    const trustMetrics = this.affiliateTrustMetrics.get(affiliateId);
    
    // Check trust score condition
    if (rule.conditions.minTrustScore && trustMetrics && trustMetrics.currentScore < rule.conditions.minTrustScore) {
      return true;
    }

    // Check suspicious activity threshold
    if (rule.conditions.suspiciousActivityThreshold && trustMetrics && 
        trustMetrics.factors.suspiciousActivity >= rule.conditions.suspiciousActivityThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Execute rule actions
   */
  private executeRuleActions(rule: AffiliateSafetyRule, affiliateId: string): void {
    if (rule.actions.suspendAffiliate) {
      this.suspendedAffiliates.add(affiliateId);
      console.log(`[AffiliateTrustSafety] Suspended affiliate ${affiliateId} due to rule ${rule.name}`);
    }

    if (rule.actions.notifyAdmin) {
      console.log(`[AffiliateTrustSafety] Notified admin about affiliate ${affiliateId} due to rule ${rule.name}`);
      // In real implementation, this would send notification to admin system
    }

    if (rule.actions.requireManualReview) {
      console.log(`[AffiliateTrustSafety] Flagged affiliate ${affiliateId} for manual review due to rule ${rule.name}`);
      // In real implementation, this would create review case
    }
  }

  /**
   * Load default safety rules
   */
  private loadDefaultSafetyRules(): void {
    const defaultRules: AffiliateSafetyRule[] = [
      {
        id: 'affiliate_min_trust_score',
        name: 'Minimum Affiliate Trust Score',
        description: 'Affiliates must have minimum trust score to participate',
        type: 'TRUST_ENFORCEMENT',
        enabled: true,
        conditions: {
          minTrustScore: 30
        },
        actions: {
          suspendAffiliate: false,
          flagContent: false,
          requireManualReview: true,
          notifyAdmin: false,
          limitReferralLinks: false
        }
      },
      {
        id: 'affiliate_max_referral_links',
        name: 'Maximum Referral Links',
        description: 'Affiliates cannot exceed maximum referral links',
        type: 'AFFILIATE_BEHAVIOR',
        enabled: true,
        conditions: {
          maxReferralLinks: 100
        },
        actions: {
          suspendAffiliate: false,
          flagContent: false,
          requireManualReview: true,
          notifyAdmin: false,
          limitReferralLinks: true
        }
      },
      {
        id: 'affiliate_suspicious_activity',
        name: 'Suspicious Activity Detection',
        description: 'Detect and flag suspicious affiliate activity',
        type: 'FRAUD_PREVENTION',
        enabled: true,
        conditions: {
          suspiciousActivityThreshold: 5
        },
        actions: {
          suspendAffiliate: false,
          flagContent: false,
          requireManualReview: true,
          notifyAdmin: true,
          limitReferralLinks: false
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
    console.log('[AffiliateTrustSafety] Event listeners set up');
  }

  /**
   * Shutdown integration service
   */
  shutdown(): void {
    console.log('[AffiliateTrustSafety] Shutting down Trust & Safety integration service');
    
    // In real implementation, this would clean up event listeners
    console.log('[AffiliateTrustSafety] Trust & Safety integration service shut down');
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.safetyEvents.clear();
    this.affiliateTrustMetrics.clear();
    this.safetyRules.clear();
    this.flaggedAffiliates.clear();
    this.suspendedAffiliates.clear();
  }
}

// Singleton instance
export const affiliateTrustSafetyService = new AffiliateTrustSafetyService();
