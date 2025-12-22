// AI-OPS-006: Controlled AI Change & Rollback Framework Routes

import { Router } from 'express';
import { AIOpsChangeController } from '../controllers/ai-ops-change.controller';

const router = Router();
const aiOpsChangeController = new AIOpsChangeController();

// Required API endpoints
router.post('/changes/propose', aiOpsChangeController.proposeChange.bind(aiOpsChangeController));
router.post('/changes/:id/run-shadow', aiOpsChangeController.runShadowEvaluation.bind(aiOpsChangeController));
router.post('/changes/:id/approve', aiOpsChangeController.processApproval.bind(aiOpsChangeController));
router.post('/versions/:id/rollback', aiOpsChangeController.rollbackVersion.bind(aiOpsChangeController));
router.get('/versions', aiOpsChangeController.getAIVersions.bind(aiOpsChangeController));

// Additional endpoints for complete functionality
router.post('/changes/:id/submit', aiOpsChangeController.submitProposal.bind(aiOpsChangeController));
router.post('/changes/:id/safety-analysis', aiOpsChangeController.performSafetyAnalysis.bind(aiOpsChangeController));
router.get('/changes/health', aiOpsChangeController.healthCheck.bind(aiOpsChangeController));

export default router;