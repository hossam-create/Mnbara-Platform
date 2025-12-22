// AI-OPS-005: Human Feedback Loop & Continuous Improvement Routes

import { Router } from 'express';
import { AIOpsFeedbackController } from '../controllers/ai-ops-feedback.controller';

const router = Router();
const aiOpsFeedbackController = new AIOpsFeedbackController();

/**
 * POST /api/ai/ops/feedback
 * Capture human feedback for AI decisions
 */
router.post('/feedback', aiOpsFeedbackController.captureFeedback.bind(aiOpsFeedbackController));

/**
 * GET /api/ai/ops/feedback/alignment
 * Analyze AI vs Human alignment metrics
 */
router.get('/feedback/alignment', aiOpsFeedbackController.getAlignmentAnalysis.bind(aiOpsFeedbackController));

/**
 * GET /api/ai/ops/feedback/metrics
 * Get feedback metrics and statistics
 */
router.get('/feedback/metrics', aiOpsFeedbackController.getFeedbackMetrics.bind(aiOpsFeedbackController));

/**
 * GET /api/ai/ops/feedback/signals
 * Generate improvement signals from feedback data
 */
router.get('/feedback/signals', aiOpsFeedbackController.getImprovementSignals.bind(aiOpsFeedbackController));

/**
 * GET /api/ai/ops/sellers/:sellerId/feedback-timeline
 * Get feedback timeline for a specific seller
 */
router.get('/sellers/:sellerId/feedback-timeline', aiOpsFeedbackController.getSellerFeedbackTimeline.bind(aiOpsFeedbackController));

/**
 * GET /api/ai/ops/feedback/health
 * System health check for feedback module
 */
router.get('/feedback/health', aiOpsFeedbackController.getSystemHealth.bind(aiOpsFeedbackController));

export default router;