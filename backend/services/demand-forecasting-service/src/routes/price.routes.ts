// Price Routes - مسارات التسعير

import { Router } from 'express';
import { priceController } from '../controllers/price.controller';

const router = Router();

// Optimize price
router.post('/optimize', priceController.optimizePrice);

// Get optimizations
router.get('/optimizations', priceController.getOptimizations);
router.get('/optimizations/:productId', priceController.getProductOptimization);

// Apply/Reject
router.post('/optimizations/:id/apply', priceController.applyOptimization);
router.post('/optimizations/:id/reject', priceController.rejectOptimization);

export { router as priceRoutes };
