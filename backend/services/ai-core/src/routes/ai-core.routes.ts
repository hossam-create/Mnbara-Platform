/**
 * AI Core Routes
 * All endpoints are read-only advisory
 * NO execution, NO payments, NO auto-actions
 */

import { Router } from 'express';
import { aiCoreController } from '../controllers/ai-core.controller';
import { healthController } from '../controllers/health.controller';

const router = Router();

// Health check endpoints
router.get('/health', healthController.check.bind(healthController));
router.get('/health/ready', healthController.ready.bind(healthController));
router.get('/health/live', healthController.live.bind(healthController));

// Intent classification
router.post('/intent/classify', aiCoreController.classifyIntent.bind(aiCoreController));

// Trust scoring
router.post('/trust/compute', aiCoreController.computeTrustScore.bind(aiCoreController));

// Risk assessment
router.post('/risk/assess', aiCoreController.assessRisk.bind(aiCoreController));

// User matching
router.post('/match/users', aiCoreController.matchUsers.bind(aiCoreController));

// Decision recommendation
router.post('/recommend', aiCoreController.getRecommendation.bind(aiCoreController));

// Audit logs
router.get('/audit', aiCoreController.getAuditLogs.bind(aiCoreController));

export default router;
