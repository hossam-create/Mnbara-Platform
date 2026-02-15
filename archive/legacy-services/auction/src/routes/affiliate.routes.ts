import { Router, Request, Response } from 'express';
import { affiliateService } from '../services/Affiliate.service';
import { ReferralLinkRequest, AttributionRequest, AffiliateSuspensionRequest, AffiliateActivationRequest } from '../types/Affiliate.types';

/**
 * Affiliate & Referral Routes - BACKEND ONLY
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

const router = Router();

// ===== PART 1 — AFFILIATE IDENTITY =====

/**
 * POST /api/v1/auction/affiliate/profiles
 * 
 * Create affiliate profile
 * Any USER can become an AFFILIATE
 * Backend creates AFFILIATE_PROFILE with affiliateId, linked userId, status, trust flags
 */
router.post('/profiles', async (req: Request, res: Response) => {
  try {
    const request = {
      userId: req.body.userId, // Would come from auth middleware
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    };

    // Validate required fields
    if (!request.userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: userId'
      });
    }

    // Create affiliate profile
    const result = affiliateService.createAffiliateProfile(request);

    if (result.success) {
      res.status(201).json({
        success: true,
        affiliateProfile: result.affiliateProfile
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Affiliate] Error creating affiliate profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create affiliate profile'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/profiles/:affiliateId
 * 
 * Get affiliate profile by ID
 */
router.get('/profiles/:affiliateId', async (req: Request, res: Response) => {
  try {
    const { affiliateId } = req.params;
    const affiliateProfile = affiliateService.getAffiliateProfile(affiliateId);

    if (!affiliateProfile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Affiliate profile not found'
      });
    }

    res.json({
      success: true,
      affiliateProfile
    });

  } catch (error) {
    console.error('[Affiliate] Error getting affiliate profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve affiliate profile'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/profiles/user/:userId
 * 
 * Get affiliate profile by user ID
 */
router.get('/profiles/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const affiliateProfile = affiliateService.getAffiliateProfileByUserId(userId);

    if (!affiliateProfile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Affiliate profile not found for this user'
      });
    }

    res.json({
      success: true,
      affiliateProfile
    });

  } catch (error) {
    console.error('[Affiliate] Error getting affiliate profile by user ID:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve affiliate profile'
    });
  }
});

// ===== PART 2 — REFERRAL LINKS =====

/**
 * POST /api/v1/auction/affiliate/referral-links
 * 
 * Create referral link
 * Affiliate can generate referral links for Product, Auction, Store, Category
 * Backend generates referralCode (immutable), targetType, targetId
 */
router.post('/referral-links', async (req: Request, res: Response) => {
  try {
    const request: ReferralLinkRequest = {
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      targetMetadata: {
        targetTitle: req.body.targetMetadata?.targetTitle,
        targetUrl: req.body.targetMetadata?.targetUrl,
        targetImageUrl: req.body.targetMetadata?.targetImageUrl,
        targetDescription: req.body.targetMetadata?.targetDescription
      },
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
    };

    const affiliateId = req.body.affiliateId; // Would come from auth middleware

    // Validate required fields
    if (!affiliateId || !request.targetType || !request.targetId || !request.targetMetadata.targetTitle || !request.targetMetadata.targetUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: affiliateId, targetType, targetId, targetMetadata.targetTitle, targetMetadata.targetUrl'
      });
    }

    // Create referral link
    const result = affiliateService.createReferralLink(request, affiliateId);

    if (result.success) {
      res.status(201).json({
        success: true,
        referralLink: result.referralLink
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Affiliate] Error creating referral link:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create referral link'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/referral-links/:linkId
 * 
 * Get referral link by ID
 */
router.get('/referral-links/:linkId', async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const referralLink = affiliateService.getReferralLink(linkId);

    if (!referralLink) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Referral link not found'
      });
    }

    res.json({
      success: true,
      referralLink
    });

  } catch (error) {
    console.error('[Affiliate] Error getting referral link:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve referral link'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/referral-links/code/:referralCode
 * 
 * Get referral link by code
 */
router.get('/referral-links/code/:referralCode', async (req: Request, res: Response) => {
  try {
    const { referralCode } = req.params;
    const referralLink = affiliateService.getReferralLinkByCode(referralCode);

    if (!referralLink) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Referral link not found'
      });
    }

    res.json({
      success: true,
      referralLink
    });

  } catch (error) {
    console.error('[Affiliate] Error getting referral link by code:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve referral link'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/referral-links/affiliate/:affiliateId
 * 
 * Get referral links by affiliate
 */
router.get('/referral-links/affiliate/:affiliateId', async (req: Request, res: Response) => {
  try {
    const { affiliateId } = req.params;
    const referralLinks = affiliateService.getReferralLinksByAffiliate(affiliateId);

    res.json({
      success: true,
      referralLinks,
      count: referralLinks.length
    });

  } catch (error) {
    console.error('[Affiliate] Error getting referral links by affiliate:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve referral links'
    });
  }
});

// ===== PART 3 — ATTRIBUTION TRACKING =====

/**
 * POST /api/v1/auction/affiliate/attribution
 * 
 * Track attribution
 * Track events: Click, View, Bid placed, Purchase completed
 * Attribution Rules: Last-click attribution, Attribution window configurable
 */
router.post('/attribution', async (req: Request, res: Response) => {
  try {
    const request: AttributionRequest = {
      referralCode: req.body.referralCode,
      actionType: req.body.actionType,
      user: {
        id: req.body.user?.id,
        ipAddress: req.body.user?.ipAddress || req.ip || '127.0.0.1',
        userAgent: req.body.user?.userAgent || req.get('User-Agent') || 'Unknown',
        sessionId: req.body.user?.sessionId
      },
      metadata: req.body.metadata
    };

    // Validate required fields
    if (!request.referralCode || !request.actionType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: referralCode, actionType'
      });
    }

    // Track attribution
    const result = affiliateService.trackAttribution(request);

    if (result.success) {
      res.status(201).json({
        success: true,
        attribution: result.attribution,
        commissionSignal: result.commissionSignal
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Affiliate] Error tracking attribution:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to track attribution'
    });
  }
});

// ===== PART 5 — USER & ADMIN VISIBILITY (READ ONLY) =====

/**
 * GET /api/v1/auction/affiliate/dashboard/:affiliateId
 * 
 * Get affiliate dashboard (USER VISIBILITY)
 * User can view own referral links, clicks & attribution counts, NO earnings shown
 */
router.get('/dashboard/:affiliateId', async (req: Request, res: Response) => {
  try {
    const { affiliateId } = req.params;
    const dashboard = affiliateService.getAffiliateDashboard(affiliateId);

    if (!dashboard) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Affiliate dashboard not found'
      });
    }

    res.json({
      success: true,
      dashboard
    });

  } catch (error) {
    console.error('[Affiliate] Error getting affiliate dashboard:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve affiliate dashboard'
    });
  }
});

// ===== ADMIN VISIBILITY (READ ONLY) =====

/**
 * GET /api/v1/auction/affiliate/admin/profiles
 * 
 * Get all affiliate profiles (ADMIN VISIBILITY)
 * View affiliates, NO editing, NO payout actions
 */
router.get('/admin/profiles', async (req: Request, res: Response) => {
  try {
    const { status, limit } = req.query;
    
    const profiles = affiliateService.getAllAffiliateProfiles();
    
    // Filter by status if provided
    let filteredProfiles = profiles;
    if (status) {
      filteredProfiles = profiles.filter(profile => profile.status === status);
    }
    
    // Apply limit if provided
    if (limit) {
      filteredProfiles = filteredProfiles.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      profiles: filteredProfiles,
      count: filteredProfiles.length
    });

  } catch (error) {
    console.error('[Affiliate] Error getting affiliate profiles:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve affiliate profiles'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/admin/referral-links
 * 
 * Get all referral links (ADMIN VISIBILITY)
 */
router.get('/admin/referral-links', async (req: Request, res: Response) => {
  try {
    const { status, affiliateId, limit } = req.query;
    
    const referralLinks = affiliateService.getAllReferralLinks();
    
    // Filter by status if provided
    let filteredLinks = referralLinks;
    if (status) {
      filteredLinks = filteredLinks.filter(link => link.status === status);
    }
    
    // Filter by affiliate if provided
    if (affiliateId) {
      filteredLinks = filteredLinks.filter(link => link.affiliateId === affiliateId);
    }
    
    // Apply limit if provided
    if (limit) {
      filteredLinks = filteredLinks.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      referralLinks: filteredLinks,
      count: filteredLinks.length
    });

  } catch (error) {
    console.error('[Affiliate] Error getting referral links:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve referral links'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/admin/attributions
 * 
 * Get all attributions (ADMIN VISIBILITY)
 */
router.get('/admin/attributions', async (req: Request, res: Response) => {
  try {
    const { affiliateId, actionType, limit } = req.query;
    
    const attributions = affiliateService.getAllAttributions();
    
    // Filter by affiliate if provided
    let filteredAttributions = attributions;
    if (affiliateId) {
      filteredAttributions = filteredAttributions.filter(attr => attr.affiliateId === affiliateId);
    }
    
    // Filter by action type if provided
    if (actionType) {
      filteredAttributions = filteredAttributions.filter(attr => attr.action.type === actionType);
    }
    
    // Apply limit if provided
    if (limit) {
      filteredAttributions = filteredAttributions.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      attributions: filteredAttributions,
      count: filteredAttributions.length
    });

  } catch (error) {
    console.error('[Affiliate] Error getting attributions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve attributions'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/admin/commission-signals
 * 
 * Get all commission signals (ADMIN VISIBILITY)
 */
router.get('/admin/commission-signals', async (req: Request, res: Response) => {
  try {
    const { affiliateId, eligible, limit } = req.query;
    
    const commissionSignals = affiliateService.getAllCommissionSignals();
    
    // Filter by affiliate if provided
    let filteredSignals = commissionSignals;
    if (affiliateId) {
      filteredSignals = filteredSignals.filter(signal => signal.affiliateId === affiliateId);
    }
    
    // Filter by eligibility if provided
    if (eligible !== undefined) {
      const isEligible = eligible === 'true';
      filteredSignals = filteredSignals.filter(signal => signal.commission.eligible === isEligible);
    }
    
    // Apply limit if provided
    if (limit) {
      filteredSignals = filteredSignals.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      commissionSignals: filteredSignals,
      count: filteredSignals.length
    });

  } catch (error) {
    console.error('[Affiliate] Error getting commission signals:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve commission signals'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/admin/statistics
 * 
 * Get affiliate statistics (ADMIN VISIBILITY)
 * View attribution stats, flagged affiliates, NO editing, NO payout actions
 */
router.get('/admin/statistics', async (_req: Request, res: Response) => {
  try {
    const statistics = affiliateService.getStatistics();
    
    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('[Affiliate] Error getting statistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve affiliate statistics'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/admin/events
 * 
 * Get affiliate event log (ADMIN VISIBILITY)
 */
router.get('/admin/events', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const events = affiliateService.getEventLog(limit);
    
    res.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('[Affiliate] Error getting events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve affiliate events'
    });
  }
});

/**
 * POST /api/v1/auction/affiliate/admin/profiles/:affiliateId/suspend
 * 
 * Suspend affiliate profile (ADMIN ACTION)
 */
router.post('/admin/profiles/:affiliateId/suspend', async (req: Request, res: Response) => {
  try {
    const { affiliateId } = req.params;
    const { reason, suspendedBy } = req.body;

    // Validate required fields
    if (!reason || !suspendedBy) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: reason, suspendedBy'
      });
    }

    const request: AffiliateSuspensionRequest = {
      affiliateId,
      reason,
      suspendedBy
    };

    // Suspend affiliate
    const result = affiliateService.suspendAffiliate(request);

    if (result.success) {
      res.json({
        success: true,
        message: 'Affiliate profile suspended successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Affiliate] Error suspending affiliate profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to suspend affiliate profile'
    });
  }
});

/**
 * POST /api/v1/auction/affiliate/admin/profiles/:affiliateId/activate
 * 
 * Activate affiliate profile (ADMIN ACTION)
 */
router.post('/admin/profiles/:affiliateId/activate', async (req: Request, res: Response) => {
  try {
    const { affiliateId } = req.params;
    const { activatedBy } = req.body;

    // Validate required fields
    if (!activatedBy) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: activatedBy'
      });
    }

    const request: AffiliateActivationRequest = {
      affiliateId,
      activatedBy
    };

    // Activate affiliate
    const result = affiliateService.activateAffiliate(request);

    if (result.success) {
      res.json({
        success: true,
        message: 'Affiliate profile activated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Affiliate] Error activating affiliate profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to activate affiliate profile'
    });
  }
});

/**
 * GET /api/v1/auction/affiliate/health
 * 
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const statistics = affiliateService.getStatistics();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      statistics: {
        totalAffiliates: statistics.totalAffiliates,
        activeAffiliates: statistics.activeAffiliates,
        totalReferralLinks: statistics.totalReferralLinks,
        activeReferralLinks: statistics.activeReferralLinks,
        totalAttributions: statistics.totalAttributions,
        totalCommissionSignals: statistics.totalCommissionSignals
      }
    });

  } catch (error) {
    console.error('[Affiliate] Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed'
    });
  }
});

export default router;
