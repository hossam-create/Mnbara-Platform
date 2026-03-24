import { Router } from 'express';
import { transferController } from '../controllers/transfer.controller';

const router = Router();

// إنشاء تحويل - Create transfer
router.post('/', transferController.createTransfer);

// حساب رسوم التحويل - Calculate transfer fee
router.get('/calculate-fee', transferController.calculateFee);

// الحصول على تحويل - Get transfer
router.get('/:transferId', transferController.getTransfer);

// الحصول على تحويلات المستخدم - Get user transfers
router.get('/user/:userId', transferController.getUserTransfers);

export default router;
