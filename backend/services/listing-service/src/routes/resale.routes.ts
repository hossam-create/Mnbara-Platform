import { Router } from 'express';
import { ResaleController } from '../controllers/resale.controller';

const router = Router();
const controller = new ResaleController();

router.post('/', (req, res, next) => controller.create(req, res, next));

export default router;





