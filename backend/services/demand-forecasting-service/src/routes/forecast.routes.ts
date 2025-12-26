// Forecast Routes - مسارات التنبؤ

import { Router } from 'express';
import { forecastController } from '../controllers/forecast.controller';

const router = Router();

// Generate forecast
router.post('/generate', forecastController.generateForecast);

// Get forecasts
router.get('/:targetType/:targetId', forecastController.getForecasts);

// Trend analysis
router.get('/trend/:targetType/:targetId', forecastController.analyzeTrend);

// Record sales
router.post('/sales', forecastController.recordSales);

// Model performance
router.get('/model/performance', forecastController.getModelPerformance);

export { router as forecastRoutes };
