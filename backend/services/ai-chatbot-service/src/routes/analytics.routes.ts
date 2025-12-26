// Analytics Routes - مسارات التحليلات

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/dashboard', analyticsController.getDashboard);
router.get('/metrics', analyticsController.getMetrics);
router.get('/intents', analyticsController.getIntentStats);
router.get('/sentiment', analyticsController.getSentimentStats);

export { router as analyticsRoutes };
