import { Router } from 'express'
import { LoyaltyController } from '../controllers/loyalty.controller'
import { ReferralController } from '../controllers/referral.controller'
import { SegmentationController } from '../controllers/segmentation.controller'
import { OffersController } from '../controllers/offers.controller'
import { AnalyticsController } from '../controllers/analytics.controller'
import { NotificationsController } from '../controllers/notifications.controller'
import { SupportController } from '../controllers/support.controller'
import { RewardsController } from '../controllers/rewards.controller'
import { SecurityController } from '../controllers/security.controller'
import { CustomerSupportController } from '../controllers/customer-support.controller'

const router = Router()

// Initialize controllers
const loyaltyController = new LoyaltyController()
const referralController = new ReferralController()
const segmentationController = new SegmentationController()
const offersController = new OffersController()
const analyticsController = new AnalyticsController()
const notificationsController = new NotificationsController()
const supportController = new SupportController()
const rewardsController = new RewardsController()
const securityController = new SecurityController()
const customerSupportController = new CustomerSupportController()

// ============ LOYALTY ROUTES ============
router.get('/loyalty/:customerId', (req, res) => loyaltyController.getLoyaltyInfo(req, res))
router.get('/loyalty/tiers/all', (req, res) => loyaltyController.getTiers(req, res))
router.post('/loyalty/:customerId/points', (req, res) => loyaltyController.addPoints(req, res))
router.post('/loyalty/:customerId/redeem', (req, res) => loyaltyController.redeemPoints(req, res))
router.get('/loyalty/tier/:tier/benefits', (req, res) => loyaltyController.getTierBenefits(req, res))
router.get('/loyalty/earn/methods', (req, res) => loyaltyController.getHowToEarn(req, res))

// ============ REFERRAL ROUTES ============
router.post('/referral/:customerId/generate-link', (req, res) =>
  referralController.generateReferralLink(req, res)
)
router.get('/referral/:customerId/history', (req, res) =>
  referralController.getReferralHistory(req, res)
)
router.get('/referral/:customerId/rewards', (req, res) =>
  referralController.getReferralRewards(req, res)
)
router.post('/referral/:customerId/track', (req, res) =>
  referralController.trackReferral(req, res)
)
router.get('/referral/:customerId/stats', (req, res) =>
  referralController.getReferralStats(req, res)
)

// ============ SEGMENTATION ROUTES ============
router.get('/segmentation/:customerId', (req, res) =>
  segmentationController.getCustomerSegment(req, res)
)
router.get('/segmentation/all/segments', (req, res) =>
  segmentationController.getAllSegments(req, res)
)
router.get('/segmentation/:segment/benefits', (req, res) =>
  segmentationController.getSegmentBenefits(req, res)
)
router.get('/segmentation/:segment/stats', (req, res) =>
  segmentationController.getSegmentStats(req, res)
)
router.put('/segmentation/:customerId/update', (req, res) =>
  segmentationController.updateCustomerSegment(req, res)
)

// ============ OFFERS ROUTES ============
router.get('/offers/:customerId', (req, res) =>
  offersController.getPersonalizedOffers(req, res)
)
router.post('/offers/:customerId/apply', (req, res) =>
  offersController.applyOffer(req, res)
)
router.get('/offers/:customerId/history', (req, res) =>
  offersController.getOfferHistory(req, res)
)
router.get('/offers/:offerId/details', (req, res) =>
  offersController.getOfferDetails(req, res)
)

// ============ ANALYTICS ROUTES ============
router.get('/analytics/:customerId', (req, res) =>
  analyticsController.getCustomerAnalytics(req, res)
)
router.get('/analytics/:customerId/purchase-history', (req, res) =>
  analyticsController.getPurchaseHistory(req, res)
)
router.get('/analytics/:customerId/spending-trends', (req, res) =>
  analyticsController.getSpendingTrends(req, res)
)
router.get('/analytics/:customerId/category-breakdown', (req, res) =>
  analyticsController.getCategoryBreakdown(req, res)
)
router.get('/analytics/:customerId/engagement', (req, res) =>
  analyticsController.getEngagementMetrics(req, res)
)

// ============ NOTIFICATIONS ROUTES ============
router.get('/notifications/:customerId/preferences', (req, res) =>
  notificationsController.getNotificationPreferences(req, res)
)
router.put('/notifications/:customerId/preferences', (req, res) =>
  notificationsController.updateNotificationPreferences(req, res)
)
router.get('/notifications/:customerId/history', (req, res) =>
  notificationsController.getNotificationHistory(req, res)
)
router.post('/notifications/:customerId/send', (req, res) =>
  notificationsController.sendNotification(req, res)
)

// ============ SUPPORT TICKETS ROUTES ============
router.post('/support/:customerId/ticket', (req, res) =>
  supportController.createTicket(req, res)
)
router.get('/support/:customerId/tickets', (req, res) =>
  supportController.getTickets(req, res)
)
router.get('/support/ticket/:ticketId', (req, res) =>
  supportController.getTicketDetails(req, res)
)
router.post('/support/ticket/:ticketId/comment', (req, res) =>
  supportController.addComment(req, res)
)
router.put('/support/ticket/:ticketId/status', (req, res) =>
  supportController.updateTicketStatus(req, res)
)

// ============ REWARDS ROUTES ============
router.get('/rewards/:customerId/special-dates', (req, res) =>
  rewardsController.getSpecialDateRewards(req, res)
)
router.get('/rewards/:customerId/upcoming', (req, res) =>
  rewardsController.getUpcomingRewards(req, res)
)
router.post('/rewards/:customerId/claim', (req, res) =>
  rewardsController.claimReward(req, res)
)
router.get('/rewards/:customerId/history', (req, res) =>
  rewardsController.getRewardHistory(req, res)
)
router.get('/rewards/:rewardId/details', (req, res) =>
  rewardsController.getRewardDetails(req, res)
)
router.get('/rewards/all', (req, res) =>
  rewardsController.getAllRewards(req, res)
)

// ============ SECURITY ROUTES ============
router.get('/security/:customerId/status', (req, res) =>
  securityController.getSecurityStatus(req, res)
)
router.get('/security/:customerId/alerts', (req, res) =>
  securityController.getFraudAlerts(req, res)
)
router.post('/security/:customerId/report', (req, res) =>
  securityController.reportSuspiciousActivity(req, res)
)
router.get('/security/:customerId/recommendations', (req, res) =>
  securityController.getSecurityRecommendations(req, res)
)
router.post('/security/:customerId/2fa/enable', (req, res) =>
  securityController.enableTwoFactor(req, res)
)
router.get('/security/:customerId/history', (req, res) =>
  securityController.getSecurityHistory(req, res)
)

// ============ CUSTOMER SUPPORT ROUTES ============
router.get('/support-chat/:customerId/sessions', (req, res) =>
  customerSupportController.getLiveChatSessions(req, res)
)
router.post('/support-chat/:customerId/start', (req, res) =>
  customerSupportController.startLiveChat(req, res)
)
router.post('/support-chat/:sessionId/message', (req, res) =>
  customerSupportController.sendChatMessage(req, res)
)
router.get('/support-chat/:sessionId/history', (req, res) =>
  customerSupportController.getChatHistory(req, res)
)
router.get('/support-chat/faq', (req, res) =>
  customerSupportController.getFAQ(req, res)
)
router.get('/support-chat/faq/search', (req, res) =>
  customerSupportController.searchFAQ(req, res)
)
router.get('/support-chat/categories', (req, res) =>
  customerSupportController.getSupportCategories(req, res)
)
router.post('/support-chat/:sessionId/close', (req, res) =>
  customerSupportController.closeChatSession(req, res)
)

export default router
