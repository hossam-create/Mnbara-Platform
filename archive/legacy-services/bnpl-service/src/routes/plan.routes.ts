import { Router } from 'express';
import { planController } from '../controllers/plan.controller';

const router = Router();

router.get('/', planController.getAllPlans);
router.get('/:id', planController.getPlanById);
router.post('/', planController.createPlan);

export default router;
