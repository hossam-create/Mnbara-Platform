import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller';

const router = Router();

// الحصول على الرصيد الإجمالي - Get total balance
router.get('/:userId', walletController.getTotalBalance);

export default router;
