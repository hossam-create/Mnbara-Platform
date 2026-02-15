// AI Pricing Routes
// API route definitions

import { Router } from 'express';
import * as controller from '../controllers/ai-pricing.controller';

const router = Router();

// ==========================================
// PREDICTIVE BUYING ROUTES
// ==========================================

// User behavior profile
router.post('/predictive/profile', controller.buildUserProfile);

// User predictions
router.get('/predictive/predictions/:userId', controller.getUserPredictions);
router.post('/predictive/needs', controller.predictUserNeeds);
router.put('/predictive/predictions/:predictionId/acknowledge', controller.acknowledgePrediction);
router.put('/predictive/predictions/:predictionId/result', controller.recordPredictionResult);

// Proactive suggestions
router.get('/predictive/suggestions/:userId', controller.getProactiveSuggestions);

// Purchase timing optimization
router.post('/predictive/timing', controller.optimizePurchaseTiming);

// ==========================================
// DYNAMIC PRICING ROUTES
// ==========================================

// Price optimization
router.post('/pricing/optimize', controller.optimizePrice);
router.post('/pricing/batch-optimize', controller.batchOptimizePrices);

// Competitive suggestions
router.post('/pricing/competitive', controller.getCompetitiveSuggestion);

// Pricing rules
router.post('/pricing/rules/apply', controller.applyPricingRules);

// Optimization management
router.get('/pricing/optimizations/:productId', controller.getProductOptimizations);
router.put('/pricing/optimizations/:optimizationId/apply', controller.applyOptimization);

// ==========================================
// MARKET INTELLIGENCE ROUTES
// ==========================================

// Market overview
router.get('/market/overview', controller.getMarketOverview);
router.get('/market/direction', controller.getMarketDirection);

// Trends
router.get('/market/trends', controller.getTrends);

// Price index
router.get('/market/price-index', controller.getPriceIndexHistory);
router.get('/market/price-compare/:categoryId', controller.compareCategoryPrices);
router.get('/market/price-history/:productId', controller.getPriceHistory);
router.get('/market/price-stats/:productId', controller.getPriceStats);

// Demand forecasting
router.post('/market/forecast', controller.generateDemandForecast);
router.put('/market/forecast/:forecastId/validate', controller.validateForecast);

// Market insights
router.get('/market/insights', controller.getActiveInsights);
router.post('/market/insights/generate', controller.generateInsights);

// ==========================================
// HEALTH CHECK
// ==========================================

router.get('/health', controller.healthCheck);

export default router;
