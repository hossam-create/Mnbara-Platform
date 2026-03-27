import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();
const controller = new AnalyticsController();

// Tracking
router.post('/events', (req, res) => controller.trackEvent(req, res));
router.post('/pageviews', (req, res) => controller.trackPageView(req, res));
router.post('/identify', (req, res) => controller.identifyUser(req, res));

// Analytics
router.get('/events/:eventName', (req, res) => controller.getEventAnalytics(req, res));
router.get('/pageviews', (req, res) => controller.getPageViewAnalytics(req, res));
router.get('/dashboard', (req, res) => controller.getDashboardStats(req, res));

// Funnels
router.post('/funnels', (req, res) => controller.createFunnel(req, res));
router.get('/funnels/:funnelId/analyze', (req, res) => controller.analyzeFunnel(req, res));

// Cohorts
router.post('/cohorts', (req, res) => controller.createCohort(req, res));

export default router;
