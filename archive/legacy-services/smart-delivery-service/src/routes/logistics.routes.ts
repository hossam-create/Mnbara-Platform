import { Router } from 'express';
import { LogisticsController } from '../controllers/LogisticsController';

const router = Router();
const logisticsController = new LogisticsController();

router.post('/rates', (req, res) => logisticsController.getRates(req, res));
router.post('/label', (req, res) => logisticsController.generateLabel(req, res));

export default router;
