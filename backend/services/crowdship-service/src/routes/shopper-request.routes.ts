import { Router } from 'express';
import { ShopperRequestController } from '../controllers/shopper-request.controller';

const router = Router();
const controller = new ShopperRequestController();

router.post('/', (req, res, next) => controller.create(req, res, next));
router.get('/available', (req, res, next) => controller.listForTraveler(req, res, next));

export default router;





