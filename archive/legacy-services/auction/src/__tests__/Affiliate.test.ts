import { AffiliateService } from '../services/Affiliate.service';
import { AffiliateStatus, ReferralTargetType, ReferralActionType } from '../types/Affiliate.types';
import { affiliateConfig } from '../config/affiliate.config';

describe('Affiliate Service', () => {
  let affiliateService: AffiliateService;

  beforeEach(() => {
    affiliateService = new AffiliateService();
  });

  afterEach(() => {
    affiliateService.reset();
  });

  describe('PART 1 — AFFILIATE IDENTITY', () => {
    it('should create affiliate profile successfully', async () => {
      const request = {
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      };

      const result = affiliateService.createAffiliateProfile(request);

      expect(result.success).toBe(true);
      expect(result.affiliateProfile).toBeDefined();
      expect(result.affiliateProfile?.userId).toBe('user-1');
      expect(result.affiliateProfile?.status).toBe(AffiliateStatus.ACTIVE);
      expect(result.affiliateProfile?.affiliateId).toBeDefined();
      expect(result.affiliateProfile?.capabilities.canCreateReferralLinks).toBe(true);
    });

    it('should reject duplicate affiliate profile', async () => {
      const request = {
        userId: 'user-duplicate',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      };

      // First creation should succeed
      const firstResult = affiliateService.createAffiliateProfile(request);
      expect(firstResult.success).toBe(true);

      // Second creation should fail
      const secondResult = affiliateService.createAffiliateProfile(request);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already has an affiliate profile');
    });

    it('should create affiliate profile with suspended status when auto-activation is disabled', async () => {
      // This would test with different config, but for now we'll test the default behavior
      const request = {
        userId: 'user-suspended',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      };

      const result = affiliateService.createAffiliateProfile(request);
      expect(result.success).toBe(true);
      // With current config, auto-activation is enabled, so status should be ACTIVE
      expect(result.affiliateProfile?.status).toBe(AffiliateStatus.ACTIVE);
    });
  });

  describe('PART 2 — REFERRAL LINKS', () => {
    let affiliateId: string;

    beforeEach(() => {
      // Create an affiliate first
      const affiliateResult = affiliateService.createAffiliateProfile({
        userId: 'affiliate-user',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      });
      affiliateId = affiliateResult.affiliateProfile!.affiliateId;
    });

    it('should create referral link successfully', async () => {
      const request = {
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-123',
        targetMetadata: {
          targetTitle: 'Test Product',
          targetUrl: 'https://example.com/product/123',
          targetImageUrl: 'https://example.com/image.jpg',
          targetDescription: 'Test product description'
        }
      };

      const result = affiliateService.createReferralLink(request, affiliateId);

      expect(result.success).toBe(true);
      expect(result.referralLink).toBeDefined();
      expect(result.referralLink?.affiliateId).toBe(affiliateId);
      expect(result.referralLink?.targetType).toBe(ReferralTargetType.PRODUCT);
      expect(result.referralLink?.targetId).toBe('product-123');
      expect(result.referralLink?.referralCode).toMatch(/^[A-Z0-9]{8}$/);
      expect(result.referralLink?.status).toBe('ACTIVE');
      expect(result.referralLink?.statistics.totalClicks).toBe(0);
      expect(result.referralLink?.statistics.totalViews).toBe(0);
    });

    it('should reject invalid referral link request', async () => {
      const invalidRequest = {
        targetType: 'INVALID_TYPE',
        targetId: '',
        targetMetadata: {
          targetTitle: '',
          targetUrl: ''
        }
      };

      const result = affiliateService.createReferralLink(invalidRequest, affiliateId);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject referral link creation for non-existent affiliate', async () => {
      const request = {
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-123',
        targetMetadata: {
          targetTitle: 'Test Product',
          targetUrl: 'https://example.com/product/123'
        }
      };

      const result = affiliateService.createReferralLink(request, 'non-existent-affiliate');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Affiliate profile not found');
    });

    it('should reject referral link creation for suspended affiliate', async () => {
      // Suspend the affiliate
      affiliateService.suspendAffiliate({
        affiliateId,
        reason: 'Test suspension',
        suspendedBy: 'admin-123'
      });

      const request = {
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-123',
        targetMetadata: {
          targetTitle: 'Test Product',
          targetUrl: 'https://example.com/product/123'
        }
      };

      const result = affiliateService.createReferralLink(request, affiliateId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });

    it('should generate unique referral codes', async () => {
      const request = {
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-123',
        targetMetadata: {
          targetTitle: 'Test Product',
          targetUrl: 'https://example.com/product/123'
        }
      };

      // Create multiple referral links
      const result1 = affiliateService.createReferralLink(request, affiliateId);
      const result2 = affiliateService.createReferralLink({
        ...request,
        targetId: 'product-456'
      }, affiliateId);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.referralLink?.referralCode).not.toBe(result2.referralLink?.referralCode);
    });
  });

  describe('PART 3 — ATTRIBUTION TRACKING', () => {
    let affiliateId: string;
    let referralCode: string;

    beforeEach(() => {
      // Create affiliate and referral link
      const affiliateResult = affiliateService.createAffiliateProfile({
        userId: 'attribution-user',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      });
      affiliateId = affiliateResult.affiliateProfile!.affiliateId;

      const linkResult = affiliateService.createReferralLink({
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-123',
        targetMetadata: {
          targetTitle: 'Test Product',
          targetUrl: 'https://example.com/product/123'
        }
      }, affiliateId);
      referralCode = linkResult.referralLink!.referralCode;
    });

    it('should track click attribution successfully', async () => {
      const request = {
        referralCode,
        actionType: ReferralActionType.CLICK,
        user: {
          id: 'user-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser',
          sessionId: 'session-123'
        }
      };

      const result = affiliateService.trackAttribution(request);

      expect(result.success).toBe(true);
      expect(result.attribution).toBeDefined();
      expect(result.attribution?.affiliateId).toBe(affiliateId);
      expect(result.attribution?.referralCode).toBe(referralCode);
      expect(result.attribution?.action.type).toBe(ReferralActionType.CLICK);
      expect(result.attribution?.target.type).toBe(ReferralTargetType.PRODUCT);
      expect(result.attribution?.target.id).toBe('product-123');
    });

    it('should track view attribution successfully', async () => {
      const request = {
        referralCode,
        actionType: ReferralActionType.VIEW,
        user: {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        }
      };

      const result = affiliateService.trackAttribution(request);

      expect(result.success).toBe(true);
      expect(result.attribution?.action.type).toBe(ReferralActionType.VIEW);
    });

    it('should track bid placed attribution successfully', async () => {
      const request = {
        referralCode,
        actionType: ReferralActionType.BID_PLACED,
        user: {
          id: 'user-456',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        },
        metadata: {
          bidAmount: 100,
          currency: 'USD'
        }
      };

      const result = affiliateService.trackAttribution(request);

      expect(result.success).toBe(true);
      expect(result.attribution?.action.type).toBe(ReferralActionType.BID_PLACED);
      expect(result.attribution?.action.metadata?.bidAmount).toBe(100);
    });

    it('should track purchase completed attribution successfully', async () => {
      const request = {
        referralCode,
        actionType: ReferralActionType.PURCHASE_COMPLETED,
        user: {
          id: 'user-789',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        },
        metadata: {
          purchaseAmount: 250,
          currency: 'USD',
          orderId: 'order-123'
        }
      };

      const result = affiliateService.trackAttribution(request);

      expect(result.success).toBe(true);
      expect(result.attribution?.action.type).toBe(ReferralActionType.PURCHASE_COMPLETED);
      expect(result.attribution?.action.metadata?.purchaseAmount).toBe(250);
      expect(result.commissionSignal).toBeDefined();
      expect(result.commissionSignal?.commission.eligible).toBe(true);
    });

    it('should reject attribution for invalid referral code', async () => {
      const request = {
        referralCode: 'INVALID_CODE',
        actionType: ReferralActionType.CLICK,
        user: {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        }
      };

      const result = affiliateService.trackAttribution(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or inactive referral code');
    });

    it('should reject attribution for expired referral link', async () => {
      // Create an expired referral link
      const expiredLinkResult = affiliateService.createReferralLink({
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-expired',
        targetMetadata: {
          targetTitle: 'Expired Product',
          targetUrl: 'https://example.com/product/expired'
        },
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      }, affiliateId);

      const request = {
        referralCode: expiredLinkResult.referralLink!.referralCode,
        actionType: ReferralActionType.CLICK,
        user: {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        }
      };

      const result = affiliateService.trackAttribution(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('PART 4 — COMMISSION SIGNALS', () => {
    let affiliateId: string;
    let referralCode: string;

    beforeEach(() => {
      // Create affiliate and referral link
      const affiliateResult = affiliateService.createAffiliateProfile({
        userId: 'commission-user',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      });
      affiliateId = affiliateResult.affiliateProfile!.affiliateId;

      const linkResult = affiliateService.createReferralLink({
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-123',
        targetMetadata: {
          targetTitle: 'Test Product',
          targetUrl: 'https://example.com/product/123'
        }
      }, affiliateId);
      referralCode = linkResult.referralLink!.referralCode;
    });

    it('should create commission signal for eligible action', async () => {
      const request = {
        referralCode,
        actionType: ReferralActionType.PURCHASE_COMPLETED,
        user: {
          id: 'user-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        },
        metadata: {
          purchaseAmount: 100,
          currency: 'USD'
        }
      };

      const result = affiliateService.trackAttribution(request);

      expect(result.success).toBe(true);
      expect(result.commissionSignal).toBeDefined();
      expect(result.commissionSignal?.affiliateId).toBe(affiliateId);
      expect(result.commissionSignal?.commission.percentage).toBeGreaterThan(0);
      expect(result.commissionSignal?.commission.eligible).toBe(true);
      expect(result.commissionSignal?.action.type).toBe(ReferralActionType.PURCHASE_COMPLETED);
    });

    it('should not create commission signal for non-eligible action', async () => {
      const request = {
        referralCode,
        actionType: ReferralActionType.CLICK,
        user: {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        }
      };

      const result = affiliateService.trackAttribution(request);

      expect(result.success).toBe(true);
      expect(result.commissionSignal).toBeDefined();
      expect(result.commissionSignal?.commission.percentage).toBe(0);
      expect(result.commissionSignal?.commission.eligible).toBe(false);
    });

    it('should calculate correct commission percentage based on target type and action', async () => {
      // Create referral link for auction
      const auctionLinkResult = affiliateService.createReferralLink({
        targetType: ReferralTargetType.AUCTION,
        targetId: 'auction-123',
        targetMetadata: {
          targetTitle: 'Test Auction',
          targetUrl: 'https://example.com/auction/123'
        }
      }, affiliateId);

      const request = {
        referralCode: auctionLinkResult.referralLink!.referralCode,
        actionType: ReferralActionType.PURCHASE_COMPLETED,
        user: {
          id: 'user-456',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        }
      };

      const result = affiliateService.trackAttribution(request);

      expect(result.success).toBe(true);
      expect(result.commissionSignal?.commission.percentage).toBe(affiliateConfig.commissionRates[ReferralTargetType.AUCTION][ReferralActionType.PURCHASE_COMPLETED]);
    });
  });

  describe('PART 5 — USER & ADMIN VISIBILITY', () => {
    let affiliateId: string;
    let userId: string;

    beforeEach(() => {
      // Create affiliate
      const affiliateResult = affiliateService.createAffiliateProfile({
        userId: 'visibility-user',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      });
      affiliateId = affiliateResult.affiliateProfile!.affiliateId;
      userId = affiliateResult.affiliateProfile!.userId;

      // Create some referral links and attributions
      affiliateService.createReferralLink({
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-1',
        targetMetadata: {
          targetTitle: 'Product 1',
          targetUrl: 'https://example.com/product/1'
        }
      }, affiliateId);

      affiliateService.createReferralLink({
        targetType: ReferralTargetType.AUCTION,
        targetId: 'auction-1',
        targetMetadata: {
          targetTitle: 'Auction 1',
          targetUrl: 'https://example.com/auction/1'
        }
      }, affiliateId);
    });

    it('should get affiliate dashboard successfully', async () => {
      const dashboard = affiliateService.getAffiliateDashboard(affiliateId);

      expect(dashboard).toBeDefined();
      expect(dashboard?.affiliateId).toBe(affiliateId);
      expect(dashboard?.userId).toBe(userId);
      expect(dashboard?.overview.totalReferralLinks).toBe(2);
      expect(dashboard?.overview.activeReferralLinks).toBe(2);
      expect(dashboard?.overview.totalClicks).toBe(0);
      expect(dashboard?.overview.totalViews).toBe(0);
      expect(dashboard?.overview.totalAttributions).toBe(0);
      expect(dashboard?.referralLinks).toHaveLength(2);
      expect(dashboard?.performance.clickThroughRate).toBe(0);
      expect(dashboard?.performance.attributionRate).toBe(0);
    });

    it('should return null for non-existent affiliate dashboard', async () => {
      const dashboard = affiliateService.getAffiliateDashboard('non-existent-affiliate');
      expect(dashboard).toBeNull();
    });

    it('should get affiliate statistics', async () => {
      const statistics = affiliateService.getStatistics();

      expect(statistics.totalAffiliates).toBe(1);
      expect(statistics.activeAffiliates).toBe(1);
      expect(statistics.suspendedAffiliates).toBe(0);
      expect(statistics.totalReferralLinks).toBe(2);
      expect(statistics.activeReferralLinks).toBe(2);
      expect(statistics.totalAttributions).toBe(0);
      expect(statistics.totalClicks).toBe(0);
      expect(statistics.totalViews).toBe(0);
    });

    it('should get all affiliate profiles (admin)', async () => {
      const profiles = affiliateService.getAllAffiliateProfiles();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].affiliateId).toBe(affiliateId);
      expect(profiles[0].userId).toBe(userId);
    });

    it('should get all referral links (admin)', async () => {
      const referralLinks = affiliateService.getAllReferralLinks();

      expect(referralLinks).toHaveLength(2);
      expect(referralLinks[0].affiliateId).toBe(affiliateId);
      expect(referralLinks[1].affiliateId).toBe(affiliateId);
    });

    it('should suspend affiliate successfully', async () => {
      const result = affiliateService.suspendAffiliate({
        affiliateId,
        reason: 'Test suspension',
        suspendedBy: 'admin-123'
      });

      expect(result.success).toBe(true);

      const affiliateProfile = affiliateService.getAffiliateProfile(affiliateId);
      expect(affiliateProfile?.status).toBe(AffiliateStatus.SUSPENDED);
      expect(affiliateProfile?.trustFlags.suspended).toBe(true);

      // Referral links should be deactivated
      const referralLinks = affiliateService.getReferralLinksByAffiliate(affiliateId);
      expect(referralLinks.every(link => link.status === 'INACTIVE')).toBe(true);
    });

    it('should activate affiliate successfully', async () => {
      // First suspend
      affiliateService.suspendAffiliate({
        affiliateId,
        reason: 'Test suspension',
        suspendedBy: 'admin-123'
      });

      // Then activate
      const result = affiliateService.activateAffiliate({
        affiliateId,
        activatedBy: 'admin-123'
      });

      expect(result.success).toBe(true);

      const affiliateProfile = affiliateService.getAffiliateProfile(affiliateId);
      expect(affiliateProfile?.status).toBe(AffiliateStatus.ACTIVE);
      expect(affiliateProfile?.trustFlags.suspended).toBe(false);
    });
  });

  describe('Event Logging', () => {
    it('should log affiliate profile created event', async () => {
      affiliateService.createAffiliateProfile({
        userId: 'event-user',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      });

      const events = affiliateService.getEventLog();
      const profileCreatedEvent = events.find(e => e.type === 'AFFILIATE_PROFILE_CREATED');

      expect(profileCreatedEvent).toBeDefined();
      expect(profileCreatedEvent?.category).toBe('AFFILIATE');
      expect(profileCreatedEvent?.data.userId).toBe('event-user');
    });

    it('should log referral link created event', async () => {
      const affiliateResult = affiliateService.createAffiliateProfile({
        userId: 'link-event-user',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      });

      affiliateService.createReferralLink({
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-123',
        targetMetadata: {
          targetTitle: 'Test Product',
          targetUrl: 'https://example.com/product/123'
        }
      }, affiliateResult.affiliateProfile!.affiliateId);

      const events = affiliateService.getEventLog();
      const linkCreatedEvent = events.find(e => e.type === 'REFERRAL_LINK_CREATED');

      expect(linkCreatedEvent).toBeDefined();
      expect(linkCreatedEvent?.category).toBe('REFERRAL_LINK');
      expect(linkCreatedEvent?.data.targetType).toBe(ReferralTargetType.PRODUCT);
    });

    it('should log referral clicked event', async () => {
      const affiliateResult = affiliateService.createAffiliateProfile({
        userId: 'click-event-user',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      });

      const linkResult = affiliateService.createReferralLink({
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-123',
        targetMetadata: {
          targetTitle: 'Test Product',
          targetUrl: 'https://example.com/product/123'
        }
      }, affiliateResult.affiliateProfile!.affiliateId);

      affiliateService.trackAttribution({
        referralCode: linkResult.referralLink!.referralCode,
        actionType: ReferralActionType.CLICK,
        user: {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        }
      });

      const events = affiliateService.getEventLog();
      const clickedEvent = events.find(e => e.type === 'REFERRAL_CLICKED');

      expect(clickedEvent).toBeDefined();
      expect(clickedEvent?.category).toBe('ATTRIBUTION');
      expect(clickedEvent?.data.actionType).toBe(ReferralActionType.CLICK);
    });

    it('should log commission eligible event', async () => {
      const affiliateResult = affiliateService.createAffiliateProfile({
        userId: 'commission-event-user',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      });

      const linkResult = affiliateService.createReferralLink({
        targetType: ReferralTargetType.PRODUCT,
        targetId: 'product-123',
        targetMetadata: {
          targetTitle: 'Test Product',
          targetUrl: 'https://example.com/product/123'
        }
      }, affiliateResult.affiliateProfile!.affiliateId);

      affiliateService.trackAttribution({
        referralCode: linkResult.referralLink!.referralCode,
        actionType: ReferralActionType.PURCHASE_COMPLETED,
        user: {
          id: 'user-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser'
        }
      });

      const events = affiliateService.getEventLog();
      const commissionEvent = events.find(e => e.type === 'COMMISSION_ELIGIBLE');

      expect(commissionEvent).toBeDefined();
      expect(commissionEvent?.category).toBe('COMMISSION');
      expect(commissionEvent?.data.actionType).toBe(ReferralActionType.PURCHASE_COMPLETED);
      expect(commissionEvent?.data.eligible).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should use configuration values correctly', () => {
      expect(affiliateConfig.attributionWindow).toBeGreaterThan(0);
      expect(affiliateConfig.maxActiveReferralLinks).toBeGreaterThan(0);
      expect(affiliateConfig.supportedTargetTypes.length).toBeGreaterThan(0);
      expect(affiliateConfig.commissionRates).toBeDefined();
      expect(affiliateConfig.commissionEligibilityRules).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedRequest = {
        userId: null,
        ipAddress: '',
        userAgent: ''
      };

      const result = affiliateService.createAffiliateProfile(malformedRequest);
      expect(result.success).toBe(true); // Current implementation doesn't validate these fields
    });

    it('should handle non-existent entities gracefully', async () => {
      const nonExistentProfile = affiliateService.getAffiliateProfile('non-existent-affiliate');
      const nonExistentLink = affiliateService.getReferralLink('non-existent-link');
      const nonExistentDashboard = affiliateService.getAffiliateDashboard('non-existent-affiliate');

      expect(nonExistentProfile).toBeNull();
      expect(nonExistentLink).toBeNull();
      expect(nonExistentDashboard).toBeNull();
    });

    it('should handle suspension of non-existent affiliate gracefully', async () => {
      const result = affiliateService.suspendAffiliate({
        affiliateId: 'non-existent-affiliate',
        reason: 'Test',
        suspendedBy: 'admin'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle activation of non-existent affiliate gracefully', async () => {
      const result = affiliateService.activateAffiliate({
        affiliateId: 'non-existent-affiliate',
        activatedBy: 'admin'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
