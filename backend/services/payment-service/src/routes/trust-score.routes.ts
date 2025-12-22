import { Router } from 'express';
import { TrustScoreController } from '../controllers/trust-score.controller';

const router = Router();
const trustScoreController = new TrustScoreController();

// GET /api/trust-score/:sellerId - Get current trust score for a seller
router.get('/:sellerId', trustScoreController.getSellerScore);

// GET /api/trust-score/:sellerId/history - Get trust score history for a seller
router.get('/:sellerId/history', trustScoreController.getSellerHistory);

// GET /api/trust-score/:sellerId/trend - Get trust score trend analysis for a seller
router.get('/:sellerId/trend', trustScoreController.getSellerTrend);

// GET /api/trust-score/config - Get default trust score configuration
router.get('/config', trustScoreController.getConfig);

// GET /api/trust-score/health - Health check endpoint
router.get('/health', trustScoreController.healthCheck);

export default router;