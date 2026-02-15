// Analytics Routes - مسارات التحليلات

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

// Dashboard
router.get('/dashboard', analyticsController.getDashboard);

// Metrics
router.get('/metrics', analyticsController.getMetrics);

// Reports
router.get('/report/intents', analyticsController.getIntentReport);
router.get('/report/languages', analyticsController.getLanguageReport);

export { router as analyticsRoutes };
