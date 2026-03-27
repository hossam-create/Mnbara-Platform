// Price Optimization Routes - Gen 10 AI
// مسارات تحسين الأسعار - الجيل العاشر

import { Router } from 'express';
import { priceController } from '../controllers/price.controller';

const router = Router();

// Optimize price for a product
router.post('/optimize', priceController.optimizePrice.bind(priceController));

// Batch optimize multiple products
router.post('/batch', priceController.batchOptimize.bind(priceController));

// Get dynamic price based on real-time factors
router.post('/dynamic', priceController.getDynamicPrice.bind(priceController));

// Apply price optimization
router.post('/optimizations/:optimizationId/apply', priceController.applyOptimization.bind(priceController));

// Get price analytics for a product
router.get('/products/:productId/analytics', priceController.getPriceAnalytics.bind(priceController));

// Create A/B price test
router.post('/tests', priceController.createPriceTest.bind(priceController));

// Monitor competitor prices
router.post('/products/:productId/competitors', priceController.monitorCompetitors.bind(priceController));

export default router;
