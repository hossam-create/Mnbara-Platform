import express from 'express';
import { AITrustRiskController } from '../controllers/ai-trust-risk.controller';

const router = express.Router();
const riskController = new AITrustRiskController();

router.get('/:sellerId', riskController.getRiskScore);
router.get('/:sellerId/explain', riskController.getRiskExplanation);
router.get('/config', riskController.getConfig);
router.get('/health', riskController.healthCheck);

export default router;