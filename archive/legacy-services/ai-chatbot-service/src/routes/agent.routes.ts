// Agent Routes - مسارات الموظفين

import { Router } from 'express';
import { agentController } from '../controllers/agent.controller';

const router = Router();

router.get('/', agentController.getAgents);
router.get('/:agentId', agentController.getAgent);
router.post('/', agentController.createAgent);
router.put('/:agentId', agentController.updateAgent);
router.patch('/:agentId/status', agentController.updateStatus);
router.get('/:agentId/stats', agentController.getAgentStats);

export { router as agentRoutes };
