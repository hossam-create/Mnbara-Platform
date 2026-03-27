// Recommendation Routes - Gen 10 AI
// مسارات التوصيات - الجيل العاشر

import { Router } from 'express';
import { recommendationController } from '../controllers/recommendation.controller';

const router = Router();

// Get personalized recommendations for user
router.get('/users/:userId/personalized', recommendationController.getPersonalized.bind(recommendationController));

// Get similar products
router.get('/products/:productId/similar', recommendationController.getSimilar.bind(recommendationController));

// Get complementary products (frequently bought together)
router.get('/products/:productId/complementary', recommendationController.getComplementary.bind(recommendationController));

// Get trending products
router.get('/trending', recommendationController.getTrending.bind(recommendationController));

// Get deals for user
router.get('/users/:userId/deals', recommendationController.getDeals.bind(recommendationController));

// Update user profile with behavior data
router.put('/users/:userId/profile', recommendationController.updateProfile.bind(recommendationController));

// Track recommendation interaction
router.post('/:recommendationId/track', recommendationController.trackInteraction.bind(recommendationController));

// Get recommendation analytics
router.get('/analytics', recommendationController.getAnalytics.bind(recommendationController));

export default router;
