import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();
const controller = new AnalyticsController();

router.get('/:sellerId/analytics/sales', controller.getSalesAnalytics);
router.get('/:sellerId/analytics/products/:productId', controller.getProductPerformance);
router.get('/:sellerId/analytics/dashboard', controller.getDashboard);

export default router;
