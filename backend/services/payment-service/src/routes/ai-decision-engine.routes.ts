// AI-TRUST-003: Trust Decision & Recommendation Engine Routes

import { Router } from 'express';
import { AIDecisionEngineController } from '../controllers/ai-decision-engine.controller';

const router = Router();
const aiDecisionEngineController = new AIDecisionEngineController();

// POST /api/ai/decisions/evaluate - Evaluate a single trust decision
router.post('/evaluate', aiDecisionEngineController.evaluateDecision);

// POST /api/ai/decisions/evaluate/bulk - Evaluate multiple trust decisions in bulk
router.post('/evaluate/bulk', aiDecisionEngineController.evaluateBulk);

// GET /api/ai/decisions/rules - Get all decision rules
router.get('/rules', aiDecisionEngineController.getDecisionRules);

// GET /api/ai/decisions/config - Get engine configuration
router.get('/config', aiDecisionEngineController.getConfiguration);

// GET /api/ai/decisions/health - Health check endpoint
router.get('/health', aiDecisionEngineController.healthCheck);

export default router;