import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';

const router = Router();
const controller = new AgentController();

router.post('/', (req, res) => controller.createAgent(req, res));
router.get('/', (req, res) => controller.listAgents(req, res));
router.get('/:agentId', (req, res) => controller.getAgent(req, res));
router.put('/:agentId', (req, res) => controller.updateAgent(req, res));
router.delete('/:agentId', (req, res) => controller.deleteAgent(req, res));
router.post('/chat', (req, res) => controller.chat(req, res));

export default router;
