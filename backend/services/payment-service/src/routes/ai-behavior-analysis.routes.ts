import { Router } from 'express';
import { AIBehaviorAnalysisController } from '../controllers/ai-behavior-analysis.controller';

const router = Router();
const controller = new AIBehaviorAnalysisController();

/**
 * @route POST /api/ai/behavior/evaluate
 * @desc Evaluate seller behavior and detect fraud patterns
 * @access Internal (Trust & Safety team)
 */
router.post('/evaluate', controller.evaluateSellerBehavior.bind(controller));

/**
 * @route GET /api/ai/behavior/sellers/:sellerId/patterns
 * @desc Get detected behavior patterns for a specific seller
 * @access Internal (Trust & Safety team)
 */
router.get('/sellers/:sellerId/patterns', controller.getSellerPatterns.bind(controller));

/**
 * @route GET /api/ai/behavior/sellers/:sellerId/temporal
 * @desc Get temporal behavior metrics for a specific seller
 * @access Internal (Trust & Safety team)
 */
router.get('/sellers/:sellerId/temporal', controller.getSellerTemporalMetrics.bind(controller));

/**
 * @route GET /api/ai/behavior/config
 * @desc Get behavior analysis configuration
 * @access Internal (Trust & Safety team)
 */
router.get('/config', controller.getConfig.bind(controller));

/**
 * @route GET /api/ai/behavior/health
 * @desc Health check for behavior analysis service
 * @access Internal (Monitoring)
 */
router.get('/health', controller.healthCheck.bind(controller));

export default router;