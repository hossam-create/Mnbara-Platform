import {
  AffiliateProfile,
  ReferralLink,
  ReferralAttribution,
  CommissionSignal,
  AffiliateEvent,
  AffiliateStatus,
  ReferralTargetType,
  ReferralActionType,
  AffiliateEventType,
  AffiliateDashboard,
  AffiliateStatistics,
  ReferralLinkRequest,
  ReferralLinkResult,
  AttributionRequest,
  AttributionResult,
  AffiliateCreationRequest,
  AffiliateCreationResult,
  AffiliateSuspensionRequest,
  AffiliateSuspensionResult,
  AffiliateActivationRequest,
  AffiliateActivationResult
} from '../types/Affiliate.types';
import {
  affiliateConfig,
  isAutoActivationEnabled,
  isTrustScoreRequired,
  isTrustScoreSufficient,
  isTargetTypeSupported,
  getCommissionRate,
  isCommissionEligible,
  getAttributionWindowMs,
  getMaxActiveReferralLinks,
  getSupportedTargetTypes,
  validateReferralLinkRequest,
  validateAttributionRequest,
  generateReferralCode,
  isValidReferralCodeFormat
} from '../config/affiliate.config';

/**
 * Affiliate & Referral Service
 * 
 * Core Affiliate & Referral system for marketplace platform
 * Tracking + attribution ONLY, NO money handling
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority
 * - Affiliate logic is BACKEND ONLY
 * - NO commission payout logic
 * - NO wallet mutations
 * - NO balance calculations
 * - Tracking + attribution ONLY
 * - Every action MUST be event-logged
 * - Read-only visibility for users and admin
 */
export class AffiliateService {
  private affiliateProfiles: Map<string, AffiliateProfile> = new Map();
  private referralLinks: Map<string, ReferralLink> = new Map();
  private referralAttributions: Map<string, ReferralAttribution> = new Map();
  private commissionSignals: Map<string, CommissionSignal> = new Map();
  private eventLog: AffiliateEvent[] = [];
  private statistics: AffiliateStatistics = {
    totalAffiliates: 0,
    activeAffiliates: 0,
    suspendedAffiliates: 0,
    totalReferralLinks: 0,
    activeReferralLinks: 0,
    totalAttributions: 0,
    totalClicks: 0,
    totalViews: 0,
    totalCommissionSignals: 0,
    eligibleCommissions: 0,
    topAffiliates: [],
    topTargetTypes: [],
    attributionBreakdown: {
      clicks: 0,
      views: 0,
      bidPlaced: 0,
      purchaseCompleted: 0
    }
  };

  /**
   * Create affiliate profile (PART 1 - AFFILIATE IDENTITY)
   * 
   * @param request Affiliate creation request
   * @returns Affiliate creation result
   */
  createAffiliateProfile(request: AffiliateCreationRequest): AffiliateCreationResult {
    try {
      // Check if user already has affiliate profile
      const existingProfile = Array.from(this.affiliateProfiles.values()).find(
        profile => profile.userId === request.userId
      );
      if (existingProfile) {
        return {
          success: false,
          error: 'User already has an affiliate profile'
        };
      }

      // Create affiliate profile
      const affiliateId = `affiliate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const affiliateProfile: AffiliateProfile = {
        id: `profile_${affiliateId}`,
        affiliateId,
        userId: request.userId,
        status: isAutoActivationEnabled() ? AffiliateStatus.ACTIVE : AffiliateStatus.SUSPENDED,
        trustFlags: {
          flagged: false,
          suspended: false
        },
        metadata: {
          createdAt: now,
          updatedAt: now,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent
        },
        capabilities: {
          canCreateReferralLinks: true,
          maxActiveReferralLinks: getMaxActiveReferralLinks(),
          supportedTargetTypes: getSupportedTargetTypes()
        }
      };

      // Store affiliate profile
      this.affiliateProfiles.set(affiliateId, affiliateProfile);

      // Update statistics
      this.statistics.totalAffiliates++;
      if (affiliateProfile.status === AffiliateStatus.ACTIVE) {
        this.statistics.activeAffiliates++;
      } else {
        this.statistics.suspendedAffiliates++;
      }

      // Log event
      this.logAffiliateEvent(AffiliateEventType.AFFILIATE_PROFILE_CREATED, {
        affiliateId,
        userId: request.userId,
        metadata: {
          autoActivated: isAutoActivationEnabled(),
          status: affiliateProfile.status
        }
      });

      console.log(`[Affiliate] Created affiliate profile ${affiliateId} for user ${request.userId}`);

      return {
        success: true,
        affiliateProfile
      };

    } catch (error) {
      console.error('[Affiliate] Error creating affiliate profile:', error);
      return {
        success: false,
        error: 'Internal server error during affiliate profile creation'
      };
    }
  }

  /**
   * Create referral link (PART 2 - REFERRAL LINKS)
   * 
   * @param request Referral link creation request
   * @param affiliateId Affiliate ID
   * @returns Referral link creation result
   */
  createReferralLink(request: ReferralLinkRequest, affiliateId: string): ReferralLinkResult {
    try {
      // Validate request
      const validation = validateReferralLinkRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check if affiliate exists and is active
      const affiliateProfile = this.affiliateProfiles.get(affiliateId);
      if (!affiliateProfile) {
        return {
          success: false,
          error: 'Affiliate profile not found'
        };
      }

      if (affiliateProfile.status !== AffiliateStatus.ACTIVE) {
        return {
          success: false,
          error: 'Affiliate profile is not active'
        };
      }

      // Check if target type is supported
      if (!isTargetTypeSupported(request.targetType)) {
        return {
          success: false,
          error: 'Target type not supported'
        };
      }

      // Check max active referral links
      const activeLinks = Array.from(this.referralLinks.values()).filter(
        link => link.affiliateId === affiliateId && link.status === 'ACTIVE'
      );
      if (activeLinks.length >= affiliateProfile.capabilities.maxActiveReferralLinks) {
        return {
          success: false,
          error: 'Maximum active referral links reached'
        };
      }

      // Generate referral code
      const referralCode = generateReferralCode();
      
      // Ensure uniqueness
      let attempts = 0;
      let uniqueCode = referralCode;
      while (Array.from(this.referralLinks.values()).some(link => link.referralCode === uniqueCode) && attempts < 10) {
        uniqueCode = generateReferralCode();
        attempts++;
      }
      if (attempts >= 10) {
        return {
          success: false,
          error: 'Failed to generate unique referral code'
        };
      }

      // Create referral link
      const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const referralLink: ReferralLink = {
        id: linkId,
        affiliateId,
        referralCode: uniqueCode,
        targetType: request.targetType,
        targetId: request.targetId,
        targetMetadata: request.targetMetadata,
        status: 'ACTIVE',
        metadata: {
          createdAt: now,
          updatedAt: now,
          expiresAt: request.expiresAt,
          ipAddress: '127.0.0.1', // Would come from request
          userAgent: 'Affiliate-Service' // Would come from request
        },
        statistics: {
          totalClicks: 0,
          totalViews: 0,
          totalAttributions: 0
        }
      };

      // Store referral link
      this.referralLinks.set(linkId, referralLink);

      // Update statistics
      this.statistics.totalReferralLinks++;
      this.statistics.activeReferralLinks++;

      // Update top target types
      this.updateTopTargetTypes();

      // Log event
      this.logAffiliateEvent(AffiliateEventType.REFERRAL_LINK_CREATED, {
        affiliateId,
        referralCode: uniqueCode,
        referralLinkId: linkId,
        metadata: {
          targetType: request.targetType,
          targetId: request.targetId,
          targetTitle: request.targetMetadata.targetTitle
        }
      });

      console.log(`[Affiliate] Created referral link ${linkId} with code ${uniqueCode} for affiliate ${affiliateId}`);

      return {
        success: true,
        referralLink
      };

    } catch (error) {
      console.error('[Affiliate] Error creating referral link:', error);
      return {
        success: false,
        error: 'Internal server error during referral link creation'
      };
    }
  }

  /**
   * Track attribution (PART 3 - ATTRIBUTION TRACKING)
   * 
   * @param request Attribution tracking request
   * @returns Attribution tracking result
   */
  trackAttribution(request: AttributionRequest): AttributionResult {
    try {
      // Validate request
      const validation = validateAttributionRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Find referral link by code
      const referralLink = Array.from(this.referralLinks.values()).find(
        link => link.referralCode === request.referralCode && link.status === 'ACTIVE'
      );
      if (!referralLink) {
        return {
          success: false,
          error: 'Invalid or inactive referral code'
        };
      }

      // Check if referral link is expired
      if (referralLink.metadata.expiresAt && referralLink.metadata.expiresAt < new Date()) {
        return {
          success: false,
          error: 'Referral link has expired'
        };
      }

      // Create attribution record
      const attributionId = `attribution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const attribution: ReferralAttribution = {
        id: attributionId,
        affiliateId: referralLink.affiliateId,
        referralCode: request.referralCode,
        target: {
          type: referralLink.targetType,
          id: referralLink.targetId,
          title: referralLink.targetMetadata.targetTitle
        },
        action: {
          type: request.actionType,
          timestamp: now,
          metadata: request.metadata
        },
        user: {
          id: request.user.id,
          ipAddress: request.user.ipAddress,
          userAgent: request.user.userAgent,
          sessionId: request.user.sessionId
        },
        attribution: {
          attributed: false,
          attributionWindow: affiliateConfig.attributionWindow,
          clickCount: 0
        },
        metadata: {
          createdAt: now,
          updatedAt: now,
          referralLinkId: referralLink.id
        }
      };

      // Store attribution
      this.referralAttributions.set(attributionId, attribution);

      // Update referral link statistics
      if (request.actionType === ReferralActionType.CLICK) {
        referralLink.statistics.totalClicks++;
        referralLink.statistics.lastClickAt = now;
        this.statistics.totalClicks++;
        this.statistics.attributionBreakdown.clicks++;
      } else if (request.actionType === ReferralActionType.VIEW) {
        referralLink.statistics.totalViews++;
        referralLink.statistics.lastViewAt = now;
        this.statistics.totalViews++;
        this.statistics.attributionBreakdown.views++;
      } else if (request.actionType === ReferralActionType.BID_PLACED) {
        this.statistics.attributionBreakdown.bidPlaced++;
      } else if (request.actionType === ReferralActionType.PURCHASE_COMPLETED) {
        this.statistics.attributionBreakdown.purchaseCompleted++;
      }

      // Update statistics
      this.statistics.totalAttributions++;

      // Check for commission eligibility
      let commissionSignal: CommissionSignal | undefined;
      if (isCommissionEligible(request.actionType)) {
        commissionSignal = this.createCommissionSignal(attribution, referralLink);
      }

      // Log events
      this.logAffiliateEvent(AffiliateEventType.REFERRAL_CLICKED, {
        affiliateId: referralLink.affiliateId,
        referralCode: request.referralCode,
        attributionId,
        metadata: {
          actionType: request.actionType,
          targetType: referralLink.targetType,
          targetId: referralLink.targetId
        }
      });

      console.log(`[Affiliate] Tracked attribution ${attributionId} for referral code ${request.referralCode}`);

      return {
        success: true,
        attribution,
        commissionSignal
      };

    } catch (error) {
      console.error('[Affiliate] Error tracking attribution:', error);
      return {
        success: false,
        error: 'Internal server error during attribution tracking'
      };
    }
  }

  /**
   * Create commission signal (PART 4 - COMMISSION SIGNALS)
   * 
   * @param attribution Attribution record
   * @param referralLink Referral link
   * @returns Commission signal
   */
  private createCommissionSignal(attribution: ReferralAttribution, referralLink: ReferralLink): CommissionSignal {
    const commissionId = `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const commissionRate = getCommissionRate(referralLink.targetType, attribution.action.type);
    const eligible = commissionRate > 0;

    const commissionSignal: CommissionSignal = {
      id: commissionId,
      affiliateId: attribution.affiliateId,
      referralCode: attribution.referralCode,
      target: attribution.target,
      action: attribution.action,
      commission: {
        percentage: commissionRate,
        eligible,
        reason: eligible ? `Commission eligible for ${attribution.action.type}` : 'No commission eligible for this action'
      },
      metadata: {
        createdAt: now,
        attributionId: attribution.id,
        referralLinkId: referralLink.id
      }
    };

    // Store commission signal
    this.commissionSignals.set(commissionId, commissionSignal);

    // Update statistics
    this.statistics.totalCommissionSignals++;
    if (eligible) {
      this.statistics.eligibleCommissions++;
    }

    // Update referral link statistics
    if (eligible) {
      referralLink.statistics.totalAttributions++;
      referralLink.statistics.lastAttributionAt = now;
    }

    // Log event
    this.logAffiliateEvent(AffiliateEventType.COMMISSION_ELIGIBLE, {
      affiliateId: attribution.affiliateId,
      referralCode: attribution.referralCode,
      commissionId,
      metadata: {
        actionType: attribution.action.type,
        targetType: referralLink.targetType,
        commissionRate,
        eligible
      }
    });

    console.log(`[Affiliate] Created commission signal ${commissionId} for affiliate ${attribution.affiliateId}`);

    return commissionSignal;
  }

  /**
   * Get affiliate dashboard (PART 5 - USER VISIBILITY)
   * 
   * @param affiliateId Affiliate ID
   * @returns Affiliate dashboard data
   */
  getAffiliateDashboard(affiliateId: string): AffiliateDashboard | null {
    try {
      const affiliateProfile = this.affiliateProfiles.get(affiliateId);
      if (!affiliateProfile) {
        return null;
      }

      // Get affiliate's referral links
      const referralLinks = Array.from(this.referralLinks.values()).filter(
        link => link.affiliateId === affiliateId
      );

      // Get recent attributions
      const recentAttributions = Array.from(this.referralAttributions.values())
        .filter(attribution => attribution.affiliateId === affiliateId)
        .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime())
        .slice(0, 10);

      // Get recent commission signals
      const recentCommissionSignals = Array.from(this.commissionSignals.values())
        .filter(signal => signal.affiliateId === affiliateId)
        .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime())
        .slice(0, 10);

      // Calculate performance metrics
      const totalClicks = referralLinks.reduce((sum, link) => sum + link.statistics.totalClicks, 0);
      const totalViews = referralLinks.reduce((sum, link) => sum + link.statistics.totalViews, 0);
      const totalAttributions = referralLinks.reduce((sum, link) => sum + link.statistics.totalAttributions, 0);
      const totalCommissionSignals = recentCommissionSignals.length;
      const eligibleCommissions = recentCommissionSignals.filter(signal => signal.commission.eligible).length;

      const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
      const attributionRate = totalClicks > 0 ? (totalAttributions / totalClicks) * 100 : 0;
      const commissionEligibilityRate = totalCommissionSignals > 0 ? (eligibleCommissions / totalCommissionSignals) * 100 : 0;

      const dashboard: AffiliateDashboard = {
        affiliateId,
        userId: affiliateProfile.userId,
        overview: {
          totalReferralLinks: referralLinks.length,
          activeReferralLinks: referralLinks.filter(link => link.status === 'ACTIVE').length,
          totalClicks,
          totalViews,
          totalAttributions,
          totalCommissionSignals,
          eligibleCommissions
        },
        referralLinks,
        recentAttributions,
        recentCommissionSignals,
        performance: {
          clickThroughRate,
          attributionRate,
          commissionEligibilityRate,
          averageClicksPerLink: referralLinks.length > 0 ? totalClicks / referralLinks.length : 0,
          averageAttributionsPerLink: referralLinks.length > 0 ? totalAttributions / referralLinks.length : 0
        },
        metadata: {
          lastViewedAt: new Date(),
          totalViews: 1,
          lastRefreshAt: new Date()
        }
      };

      return dashboard;

    } catch (error) {
      console.error('[Affiliate] Error getting affiliate dashboard:', error);
      return null;
    }
  }

  /**
   * Suspend affiliate profile
   * 
   * @param request Suspension request
   * @returns Suspension result
   */
  suspendAffiliate(request: AffiliateSuspensionRequest): AffiliateSuspensionResult {
    try {
      const affiliateProfile = this.affiliateProfiles.get(request.affiliateId);
      if (!affiliateProfile) {
        return {
          success: false,
          error: 'Affiliate profile not found'
        };
      }

      if (affiliateProfile.status === AffiliateStatus.SUSPENDED) {
        return {
          success: false,
          error: 'Affiliate profile is already suspended'
        };
      }

      // Update affiliate status
      const now = new Date();
      affiliateProfile.status = AffiliateStatus.SUSPENDED;
      affiliateProfile.trustFlags.suspended = true;
      affiliateProfile.trustFlags.suspendedAt = now;
      affiliateProfile.trustFlags.suspendedReason = request.reason;
      affiliateProfile.metadata.updatedAt = now;

      // Deactivate all referral links
      const affiliateLinks = Array.from(this.referralLinks.values()).filter(
        link => link.affiliateId === request.affiliateId && link.status === 'ACTIVE'
      );
      affiliateLinks.forEach(link => {
        link.status = 'INACTIVE';
        link.metadata.updatedAt = now;
        this.statistics.activeReferralLinks--;
      });

      // Update statistics
      this.statistics.activeAffiliates--;
      this.statistics.suspendedAffiliates++;

      // Log event
      this.logAffiliateEvent(AffiliateEventType.AFFILIATE_SUSPENDED, {
        affiliateId: request.affiliateId,
        userId: affiliateProfile.userId,
        reason: request.reason,
        metadata: {
          suspendedBy: request.suspendedBy,
          suspendedAt: now.toISOString()
        }
      });

      console.log(`[Affiliate] Suspended affiliate profile ${request.affiliateId} for reason: ${request.reason}`);

      return { success: true };

    } catch (error) {
      console.error('[Affiliate] Error suspending affiliate:', error);
      return {
        success: false,
        error: 'Internal server error during affiliate suspension'
      };
    }
  }

  /**
   * Activate affiliate profile
   * 
   * @param request Activation request
   * @returns Activation result
   */
  activateAffiliate(request: AffiliateActivationRequest): AffiliateActivationResult {
    try {
      const affiliateProfile = this.affiliateProfiles.get(request.affiliateId);
      if (!affiliateProfile) {
        return {
          success: false,
          error: 'Affiliate profile not found'
        };
      }

      if (affiliateProfile.status === AffiliateStatus.ACTIVE) {
        return {
          success: false,
          error: 'Affiliate profile is already active'
        };
      }

      // Update affiliate status
      const now = new Date();
      affiliateProfile.status = AffiliateStatus.ACTIVE;
      affiliateProfile.trustFlags.suspended = false;
      affiliateProfile.trustFlags.suspendedAt = undefined;
      affiliateProfile.trustFlags.suspendedReason = undefined;
      affiliateProfile.metadata.updatedAt = now;

      // Reactivate referral links
      const affiliateLinks = Array.from(this.referralLinks.values()).filter(
        link => link.affiliateId === request.affiliateId && link.status === 'INACTIVE'
      );
      affiliateLinks.forEach(link => {
        link.status = 'ACTIVE';
        link.metadata.updatedAt = now;
        this.statistics.activeReferralLinks++;
      });

      // Update statistics
      this.statistics.activeAffiliates++;
      this.statistics.suspendedAffiliates--;

      console.log(`[Affiliate] Activated affiliate profile ${request.affiliateId}`);

      return { success: true };

    } catch (error) {
      console.error('[Affiliate] Error activating affiliate:', error);
      return {
        success: false,
        error: 'Internal server error during affiliate activation'
      };
    }
  }

  /**
   * Get affiliate profile by ID
   */
  getAffiliateProfile(affiliateId: string): AffiliateProfile | null {
    return this.affiliateProfiles.get(affiliateId) || null;
  }

  /**
   * Get affiliate profile by user ID
   */
  getAffiliateProfileByUserId(userId: string): AffiliateProfile | null {
    return Array.from(this.affiliateProfiles.values()).find(
      profile => profile.userId === userId
    ) || null;
  }

  /**
   * Get referral link by ID
   */
  getReferralLink(linkId: string): ReferralLink | null {
    return this.referralLinks.get(linkId) || null;
  }

  /**
   * Get referral link by code
   */
  getReferralLinkByCode(referralCode: string): ReferralLink | null {
    return Array.from(this.referralLinks.values()).find(
      link => link.referralCode === referralCode
    ) || null;
  }

  /**
   * Get referral links by affiliate
   */
  getReferralLinksByAffiliate(affiliateId: string): ReferralLink[] {
    return Array.from(this.referralLinks.values()).filter(
      link => link.affiliateId === affiliateId
    );
  }

  /**
   * Get attributions by affiliate
   */
  getAttributionsByAffiliate(affiliateId: string): ReferralAttribution[] {
    return Array.from(this.referralAttributions.values()).filter(
      attribution => attribution.affiliateId === affiliateId
    );
  }

  /**
   * Get commission signals by affiliate
   */
  getCommissionSignalsByAffiliate(affiliateId: string): CommissionSignal[] {
    return Array.from(this.commissionSignals.values()).filter(
      signal => signal.affiliateId === affiliateId
    );
  }

  /**
   * Get affiliate statistics (PART 5 - ADMIN VISIBILITY)
   */
  getStatistics(): AffiliateStatistics {
    return { ...this.statistics };
  }

  /**
   * Get all affiliate profiles (admin only)
   */
  getAllAffiliateProfiles(): AffiliateProfile[] {
    return Array.from(this.affiliateProfiles.values());
  }

  /**
   * Get all referral links (admin only)
   */
  getAllReferralLinks(): ReferralLink[] {
    return Array.from(this.referralLinks.values());
  }

  /**
   * Get all attributions (admin only)
   */
  getAllAttributions(): ReferralAttribution[] {
    return Array.from(this.referralAttributions.values());
  }

  /**
   * Get all commission signals (admin only)
   */
  getAllCommissionSignals(): CommissionSignal[] {
    return Array.from(this.commissionSignals.values());
  }

  /**
   * Get event log
   */
  getEventLog(limit?: number): AffiliateEvent[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  /**
   * Update top target types statistics
   */
  private updateTopTargetTypes(): void {
    const targetTypeCounts = new Map<ReferralTargetType, number>();
    
    Array.from(this.referralLinks.values()).forEach(link => {
      const count = targetTypeCounts.get(link.targetType) || 0;
      targetTypeCounts.set(link.targetType, count + 1);
    });

    this.statistics.topTargetTypes = Array.from(targetTypeCounts.entries())
      .map(([targetType, count]) => ({ targetType, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Log affiliate event
   */
  private logAffiliateEvent(type: AffiliateEventType, data: any): void {
    const event: AffiliateEvent = {
      id: `affiliate_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: this.getEventCategory(type),
      type,
      timestamp: new Date(),
      data,
      severity: this.getEventSeverity(type)
    };

    this.eventLog.push(event);
    console.log(`[Affiliate] Event: ${type} for ${data.affiliateId || data.userId}`);
  }

  /**
   * Get event category based on type
   */
  private getEventCategory(type: AffiliateEventType): 'AFFILIATE' | 'REFERRAL_LINK' | 'ATTRIBUTION' | 'COMMISSION' {
    switch (type) {
      case AffiliateEventType.AFFILIATE_PROFILE_CREATED:
      case AffiliateEventType.AFFILIATE_SUSPENDED:
        return 'AFFILIATE';
      case AffiliateEventType.REFERRAL_LINK_CREATED:
        return 'REFERRAL_LINK';
      case AffiliateEventType.REFERRAL_CLICKED:
      case AffiliateEventType.REFERRAL_ATTRIBUTED:
        return 'ATTRIBUTION';
      case AffiliateEventType.COMMISSION_ELIGIBLE:
        return 'COMMISSION';
      default:
        return 'AFFILIATE';
    }
  }

  /**
   * Get event severity based on type
   */
  private getEventSeverity(type: AffiliateEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (type) {
      case AffiliateEventType.AFFILIATE_PROFILE_CREATED:
        return 'LOW';
      case AffiliateEventType.AFFILIATE_SUSPENDED:
        return 'HIGH';
      case AffiliateEventType.REFERRAL_LINK_CREATED:
        return 'LOW';
      case AffiliateEventType.REFERRAL_CLICKED:
        return 'LOW';
      case AffiliateEventType.REFERRAL_ATTRIBUTED:
        return 'MEDIUM';
      case AffiliateEventType.COMMISSION_ELIGIBLE:
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.affiliateProfiles.clear();
    this.referralLinks.clear();
    this.referralAttributions.clear();
    this.commissionSignals.clear();
    this.eventLog = [];
    this.statistics = {
      totalAffiliates: 0,
      activeAffiliates: 0,
      suspendedAffiliates: 0,
      totalReferralLinks: 0,
      activeReferralLinks: 0,
      totalAttributions: 0,
      totalClicks: 0,
      totalViews: 0,
      totalCommissionSignals: 0,
      eligibleCommissions: 0,
      topAffiliates: [],
      topTargetTypes: [],
      attributionBreakdown: {
        clicks: 0,
        views: 0,
        bidPlaced: 0,
        purchaseCompleted: 0
      }
    };
  }
}

// Singleton instance
export const affiliateService = new AffiliateService();
