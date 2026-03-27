// Analytics Routes - مسارات التحليلات

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/dashboard', analyticsController.getDashboard);
router.get('/metrics', analyticsController.getMetrics);
router.get('/products/top', analyticsController.getTopProducts);

export { router as analyticsRoutes };
