// Forecast Routes - Gen 10 AI (95% Accuracy)
// مسارات التوقعات - الجيل العاشر

import { Router } from 'express';
import { forecastController } from '../controllers/forecast.controller';

const router = Router();

// Get product demand forecast
router.get('/products/:productId', forecastController.getProductForecast.bind(forecastController));

// Get category demand forecast
router.get('/categories/:categoryId', forecastController.getCategoryForecast.bind(forecastController));

// Get AI-enhanced forecast with external factors
router.post('/ai-enhanced', forecastController.getAIEnhancedForecast.bind(forecastController));

// Update forecast with actual data
router.put('/:forecastId/actual', forecastController.updateWithActual.bind(forecastController));

// Get accuracy metrics
router.get('/accuracy', forecastController.getAccuracyMetrics.bind(forecastController));

// Get inventory recommendations based on forecast
router.get('/products/:productId/inventory', forecastController.getInventoryRecommendations.bind(forecastController));

export default router;
