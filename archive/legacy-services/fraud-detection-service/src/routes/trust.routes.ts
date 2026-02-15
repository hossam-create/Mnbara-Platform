import { Router } from 'express';
import { TrustController } from '../controllers/TrustController';

const router = Router();
const trustController = new TrustController();

router.get('/score/:userId', (req, res) => trustController.getUserTrustScore(req, res));
router.post('/report', (req, res) => trustController.reportUser(req, res));

export default router;
