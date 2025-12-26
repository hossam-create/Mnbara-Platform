import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';

const router = Router();
const controller = new TransferController();

// إنشاء طلب تحويل جديد
router.post('/', controller.createTransfer);

// الحصول على طلبات المستخدم
router.get('/user/:userId', controller.getUserTransfers);

// الحصول على تفاصيل طلب
router.get('/:transferId', controller.getTransferDetails);

// إلغاء طلب تحويل
router.post('/:transferId/cancel', controller.cancelTransfer);

// حساب تكلفة التحويل
router.post('/estimate', controller.estimateTransfer);

// الحصول على الممرات المتاحة
router.get('/corridors/available', controller.getAvailableCorridors);

export { router as transferRoutes };
