import { Router } from 'express';
import { creditController } from '../controllers/credit.controller';

const router = Router();

router.get('/score/:userId', creditController.getUserCreditScore);
router.post('/check-eligibility', creditController.checkEligibility);

export default router;
