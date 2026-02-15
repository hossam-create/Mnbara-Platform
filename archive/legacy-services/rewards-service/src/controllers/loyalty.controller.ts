import { Request, Response } from 'express';
import { LoyaltyService } from '../services/loyalty.service';
import { GamificationService } from '../services/gamification.service';
import { PartnerService } from '../services/partner.service';
import { SpecialOffersService } from '../services/special-offers.service';

const loyaltyService = new LoyaltyService();
const gamificationService = new GamificationService();
const partnerService = new PartnerService();
const specialOffersService = new SpecialOffersService();

// ============================================
// LOYALTY CONTROLLER
// ============================================

export class LoyaltyController {

  // ========================================
  // BALANCE & ACCOUNT
  // ========================================

  /**
   * Get user's loyalty balance
   * GET /api/loyalty/balance/:userId
   */
  async getBalance(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const balance = await loyaltyService.getBalance(userId);
      
      return res.json({
        success: true,
        data: balance
      });

    } catch (error: any) {
      console.error('Get balance error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get tier progress
   * GET /api/loyalty/tier/:userId
   */
  async getTierProgress(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const progress = await loyaltyService.getTierProgress(userId);
      
      return res.json({
        success: true,
        data: progress
      });

    } catch (error: any) {
      console.error('Get tier progress error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // POINTS EARNING
  // ========================================

  /**
   * Earn points for an action
   * POST /api/loyalty/earn
   */
  async earnPoints(req: Request, res: Response) {
    try {
      const { userId, action, amount, referenceType, referenceId, metadata } = req.body;
      
      if (!userId || !action) {
        return res.status(400).json({ 
          error: 'Missing required fields: userId, action' 
        });
      }

      const result = await loyaltyService.earnPoints({
        userId,
        action,
        amount,
        referenceType,
        referenceId,
        metadata
      });
      
      return res.json({
        success: true,
        message: `Earned ${result.pointsEarned} points for ${action}`,
        data: result
      });

    } catch (error: any) {
      console.error('Earn points error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get expiring points
   * GET /api/loyalty/expiring/:userId
   */
  async getExpiringPoints(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const expiringPoints = await loyaltyService.getExpiringPoints(userId);
      
      return res.json({
        success: true,
        data: expiringPoints
      });

    } catch (error: any) {
      console.error('Get expiring points error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // POINTS REDEMPTION
  // ========================================

  /**
   * Redeem points
   * POST /api/loyalty/redeem
   */
  async redeemPoints(req: Request, res: Response) {
    try {
      const { userId, points, redemptionType, partnerId, referenceType, referenceId } = req.body;
      
      if (!userId || !points || !redemptionType) {
        return res.status(400).json({ 
          error: 'Missing required fields: userId, points, redemptionType' 
        });
      }

      if (points <= 0) {
        return res.status(400).json({ error: 'Points must be greater than 0' });
      }

      const result = await loyaltyService.redeemPoints({
        userId,
        points,
        redemptionType,
        partnerId,
        referenceType,
        referenceId
      });
      
      return res.json({
        success: true,
        message: `Redeemed ${result.pointsRedeemed} points for ${result.cashValue} USD`,
        data: result
      });

    } catch (error: any) {
      console.error('Redeem points error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Transfer points to another user
   * POST /api/loyalty/transfer
   */
  async transferPoints(req: Request, res: Response) {
    try {
      const { fromUserId, toUserId, points } = req.body;
      
      if (!fromUserId || !toUserId || !points) {
        return res.status(400).json({ 
          error: 'Missing required fields: fromUserId, toUserId, points' 
        });
      }

      const result = await loyaltyService.transferPoints(fromUserId, toUserId, points);
      
      return res.json({
        success: true,
        message: `Transferred ${points} points from ${fromUserId} to ${toUserId}`,
        data: result
      });

    } catch (error: any) {
      console.error('Transfer points error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // HISTORY
  // ========================================

  /**
   * Get transaction history
   * GET /api/loyalty/history/:userId
   */
  async getHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const history = await loyaltyService.getHistory(userId, page, limit);
      
      return res.json({
        success: true,
        data: history
      });

    } catch (error: any) {
      console.error('Get history error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // GAMIFICATION
  // ========================================

  /**
   * Get user achievements
   * GET /api/loyalty/achievements/:userId
   */
  async getAchievements(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const achievements = await gamificationService.getUserAchievements(userId);
      
      return res.json({
        success: true,
        data: achievements
      });

    } catch (error: any) {
      console.error('Get achievements error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get achievement progress
   * GET /api/loyalty/achievements/:userId/:achievementCode
   */
  async getAchievementProgress(req: Request, res: Response) {
    try {
      const { userId, achievementCode } = req.params;
      
      if (!userId || !achievementCode) {
        return res.status(400).json({ error: 'User ID and achievement code are required' });
      }

      const progress = await gamificationService.getAchievementProgress(userId, achievementCode);
      
      return res.json({
        success: true,
        data: progress
      });

    } catch (error: any) {
      console.error('Get achievement progress error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get leaderboard
   * GET /api/loyalty/leaderboard
   */
  async getLeaderboard(req: Request, res: Response) {
    try {
      const type = (req.query.type as string) || 'LIFETIME_POINTS';
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const leaderboard = await gamificationService.getLeaderboard(
        type as any, 
        limit, 
        offset
      );
      
      return res.json({
        success: true,
        data: {
          type,
          entries: leaderboard
        }
      });

    } catch (error: any) {
      console.error('Get leaderboard error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user rank
   * GET /api/loyalty/rank/:userId
   */
  async getUserRank(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const type = (req.query.type as string) || 'LIFETIME_POINTS';
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const rank = await gamificationService.getUserRank(userId, type as any);
      
      return res.json({
        success: true,
        data: {
          userId,
          type,
          ...rank
        }
      });

    } catch (error: any) {
      console.error('Get user rank error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // PARTNERS
  // ========================================

  /**
   * List partners
   * GET /api/loyalty/partners
   */
  async listPartners(req: Request, res: Response) {
    try {
      const category = req.query.category as string;
      
      const partners = await partnerService.listPartners(category);
      
      return res.json({
        success: true,
        data: partners
      });

    } catch (error: any) {
      console.error('List partners error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get partner by slug
   * GET /api/loyalty/partners/:slug
   */
  async getPartner(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      
      const partner = await partnerService.getPartnerBySlug(slug);
      
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }
      
      return res.json({
        success: true,
        data: partner
      });

    } catch (error: any) {
      console.error('Get partner error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get partner offers
   * GET /api/loyalty/partners/:partnerId/offers
   */
  async getPartnerOffers(req: Request, res: Response) {
    try {
      const { partnerId } = req.params;
      const activeOnly = req.query.activeOnly !== 'false';
      
      const offers = await partnerService.getPartnerOffers(partnerId, activeOnly);
      
      return res.json({
        success: true,
        data: offers
      });

    } catch (error: any) {
      console.error('Get partner offers error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Redeem partner offer
   * POST /api/loyalty/partners/:partnerId/redeem
   */
  async redeemPartnerOffer(req: Request, res: Response) {
    try {
      const { partnerId } = req.params;
      const { offerId, userId, code } = req.body;
      
      if (!offerId || !userId) {
        return res.status(400).json({ error: 'Missing required fields: offerId, userId' });
      }

      const result = await partnerService.redeemOffer({
        offerId,
        partnerId,
        userId,
        code
      });
      
      return res.json({
        success: true,
        message: 'Offer redeemed successfully',
        data: result
      });

    } catch (error: any) {
      console.error('Redeem partner offer error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Earn points from partner purchase
   * POST /api/loyalty/partners/earn
   */
  async earnFromPartner(req: Request, res: Response) {
    try {
      const { partnerId, userId, amount, currency, referenceId, description } = req.body;
      
      if (!partnerId || !userId || !amount) {
        return res.status(400).json({ 
          error: 'Missing required fields: partnerId, userId, amount' 
        });
      }

      const result = await partnerService.earnFromPartner({
        partnerId,
        userId,
        amount,
        currency,
        referenceId,
        description
      });
      
      return res.json({
        success: true,
        message: `Earned ${result.pointsEarned} points`,
        data: result
      });

    } catch (error: any) {
      console.error('Earn from partner error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // SPECIAL OFFERS
  // ========================================

  /**
   * Get active offers
   * GET /api/loyalty/offers
   */
  async getActiveOffers(req: Request, res: Response) {
    try {
      const { userId } = req.query as { userId?: string };
      
      const offers = await specialOffersService.getActiveOffers(userId);
      
      return res.json({
        success: true,
        data: offers
      });

    } catch (error: any) {
      console.error('Get active offers error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Validate offer code
   * POST /api/loyalty/offers/validate
   */
  async validateOffer(req: Request, res: Response) {
    try {
      const { code, userId } = req.body;
      
      if (!code || !userId) {
        return res.status(400).json({ error: 'Missing required fields: code, userId' });
      }

      const validation = await specialOffersService.validateOffer(code, userId);
      
      return res.json({
        success: validation.valid,
        ...validation
      });

    } catch (error: any) {
      console.error('Validate offer error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Use special offer
   * POST /api/loyalty/offers/use
   */
  async useOffer(req: Request, res: Response) {
    try {
      const { code, userId, orderId } = req.body;
      
      if (!code || !userId) {
        return res.status(400).json({ error: 'Missing required fields: code, userId' });
      }

      const result = await specialOffersService.useOffer(code, userId, orderId);
      
      return res.json({
        success: true,
        message: `Offer applied! Earned ${result.pointsEarned} bonus points`,
        data: result
      });

    } catch (error: any) {
      console.error('Use offer error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user's offer history
   * GET /api/loyalty/offers/history/:userId
   */
  async getOfferHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const history = await specialOffersService.getUserOfferHistory(userId, page, limit);
      
      return res.json({
        success: true,
        data: history
      });

    } catch (error: any) {
      console.error('Get offer history error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // ADMIN ENDPOINTS
  // ========================================

  /**
   * Process expiration (admin only)
   * POST /api/loyalty/admin/process-expirations
   */
  async processExpirations(req: Request, res: Response) {
    try {
      const result = await loyaltyService.processExpirations();
      
      return res.json({
        success: true,
        message: `Processed ${result.processed} expirations`,
        data: result
      });

    } catch (error: any) {
      console.error('Process expirations error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Initialize achievements (admin only)
   * POST /api/loyalty/admin/init-achievements
   */
  async initializeAchievements(req: Request, res: Response) {
    try {
      const result = await gamificationService.initializeAchievements();
      
      return res.json({
        success: true,
        message: `Initialized ${result.created} achievements`,
        data: result
      });

    } catch (error: any) {
      console.error('Initialize achievements error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Initialize tiers (admin only)
   * POST /api/loyalty/admin/init-tiers
   */
  async initializeTiers(req: Request, res: Response) {
    try {
      const result = await gamificationService.initializeTiers();
      
      return res.json({
        success: true,
        message: `Initialized ${result.tiersCreated} tiers`,
        data: result
      });

    } catch (error: any) {
      console.error('Initialize tiers error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
