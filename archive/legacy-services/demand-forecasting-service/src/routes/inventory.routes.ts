// Inventory Routes - مسارات المخزون

import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';

const router = Router();

// Generate recommendation
router.post('/recommend', inventoryController.generateRecommendation);

// Get recommendations
router.get('/recommendations', inventoryController.getRecommendations);
router.get('/recommendations/:productId', inventoryController.getProductRecommendation);

// Inventory health
router.get('/health', inventoryController.getInventoryHealth);

export { router as inventoryRoutes };
