import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';

const router = Router();
const controller = new RecommendationController();

// Get personalized recommendations for user
router.get('/users/:userId', (req, res) => controller.getPersonalizedRecommendations(req, res));

// Get similar products
router.get('/products/:productId/similar', (req, res) => controller.getSimilarProducts(req, res));

// Get trending products
router.get('/trending', (req, res) => controller.getTrendingProducts(req, res));

// Get frequently bought together
router.get('/products/:productId/bought-together', (req, res) => controller.getFrequentlyBoughtTogether(req, res));

// Track user interaction
router.post('/interactions', (req, res) => controller.trackInteraction(req, res));

// Get user profile
router.get('/users/:userId/profile', (req, res) => controller.getUserProfile(req, res));

// Rebuild recommendation models (admin)
router.post('/rebuild', (req, res) => controller.rebuildModels(req, res));

export default router;
