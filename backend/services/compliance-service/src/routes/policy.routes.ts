import { Router } from 'express';
import { PolicyController } from '../controllers/PolicyController';

const router = Router();
const policyController = new PolicyController();

router.post('/scan', (req, res) => policyController.scanContent(req, res));

export default router;
