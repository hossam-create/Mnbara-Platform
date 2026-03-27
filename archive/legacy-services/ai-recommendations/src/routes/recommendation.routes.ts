// AI Recommendation Routes

import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';

const router = Router();
const controller = new RecommendationController();

// Health check
router.get('/health', controller.healthCheck.bind(controller));

// Get recommendations for a user
router.post('/:userId', controller.getRecommendations.bind(controller));

// Batch recommendations
router.post('/batch', controller.getBatchRecommendations.bind(controller));

export default router;
