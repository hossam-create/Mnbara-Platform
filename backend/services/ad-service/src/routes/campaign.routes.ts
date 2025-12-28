import { Router } from 'express';
import { CampaignController } from '../controllers/CampaignController';

const router = Router();
const controller = new CampaignController();

router.post('/', (req, res) => controller.create(req, res));
router.get('/', (req, res) => controller.list(req, res));

export default router;
