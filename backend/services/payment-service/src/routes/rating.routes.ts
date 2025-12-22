import { Router } from 'express';
import { RatingController } from '../controllers/rating.controller';

const router = Router();
const controller = new RatingController();

router.post('/', (req, res) => controller.create(req, res));

export default router;





