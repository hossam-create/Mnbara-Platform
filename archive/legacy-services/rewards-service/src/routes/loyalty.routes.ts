import { Router } from 'express';
import { LoyaltyController } from '../controllers/loyalty.controller';

const router = Router();
const controller = new LoyaltyController();

// ============================================
// HEALTH & INFO
// ============================================

// GET /api/loyalty/health
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'loyalty-service',
    version: '1.0.0'
  });
});

// ============================================
// BALANCE & ACCOUNT
// ============================================

// GET /api/loyalty/balance/:userId
router.get('/balance/:userId', (req, res) => controller.getBalance(req, res));

// GET /api/loyalty/tier/:userId
router.get('/tier/:userId', (req, res) => controller.getTierProgress(req, res));

// GET /api/loyalty/expiring/:userId
router.get('/expiring/:userId', (req, res) => controller.getExpiringPoints(req, res));

// ============================================
// POINTS EARNING & REDEMPTION
// ============================================

// POST /api/loyalty/earn
router.post('/earn', (req, res) => controller.earnPoints(req, res));

// POST /api/loyalty/redeem
router.post('/redeem', (req, res) => controller.redeemPoints(req, res));

// POST /api/loyalty/transfer
router.post('/transfer', (req, res) => controller.transferPoints(req, res));

// GET /api/loyalty/history/:userId
router.get('/history/:userId', (req, res) => controller.getHistory(req, res));

// ============================================
// GAMIFICATION
// ============================================

// GET /api/loyalty/achievements/:userId
router.get('/achievements/:userId', (req, res) => controller.getAchievements(req, res));

// GET /api/loyalty/achievements/:userId/:achievementCode
router.get('/achievements/:userId/:achievementCode', (req, res) => controller.getAchievementProgress(req, res));

// GET /api/loyalty/leaderboard
router.get('/leaderboard', (req, res) => controller.getLeaderboard(req, res));

// GET /api/loyalty/rank/:userId
router.get('/rank/:userId', (req, res) => controller.getUserRank(req, res));

// ============================================
// PARTNERS
// ============================================

// GET /api/loyalty/partners
router.get('/partners', (req, res) => controller.listPartners(req, res));

// GET /api/loyalty/partners/:slug
router.get('/partners/:slug', (req, res) => controller.getPartner(req, res));

// GET /api/loyalty/partners/:partnerId/offers
router.get('/partners/:partnerId/offers', (req, res) => controller.getPartnerOffers(req, res));

// POST /api/loyalty/partners/:partnerId/redeem
router.post('/partners/:partnerId/redeem', (req, res) => controller.redeemPartnerOffer(req, res));

// POST /api/loyalty/partners/earn
router.post('/partners/earn', (req, res) => controller.earnFromPartner(req, res));

// ============================================
// SPECIAL OFFERS
// ============================================

// GET /api/loyalty/offers
router.get('/offers', (req, res) => controller.getActiveOffers(req, res));

// POST /api/loyalty/offers/validate
router.post('/offers/validate', (req, res) => controller.validateOffer(req, res));

// POST /api/loyalty/offers/use
router.post('/offers/use', (req, res) => controller.useOffer(req, res));

// GET /api/loyalty/offers/history/:userId
router.get('/offers/history/:userId', (req, res) => controller.getOfferHistory(req, res));

// ============================================
// ADMIN ENDPOINTS
// ============================================

// POST /api/loyalty/admin/process-expirations
router.post('/admin/process-expirations', (req, res) => controller.processExpirations(req, res));

// POST /api/loyalty/admin/init-achievements
router.post('/admin/init-achievements', (req, res) => controller.initializeAchievements(req, res));

// POST /api/loyalty/admin/init-tiers
router.post('/admin/init-tiers', (req, res) => controller.initializeTiers(req, res));

export default router;
