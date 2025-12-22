import { Router } from 'express';
import * as TokenController from './controllers/tokenController';

const router = Router();

router.get('/balance/:address', TokenController.getBalance);
router.get('/kyc/:address', TokenController.getKYC);
router.post('/kyc', TokenController.updateKYC);
router.post('/mint', TokenController.mintTokens);

export default router;
