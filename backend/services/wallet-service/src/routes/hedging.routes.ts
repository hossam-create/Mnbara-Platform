import { Router } from 'express';
import { hedgingController } from '../controllers/hedging.controller';

const router = Router();

// إنشاء أمر تحوط - Create hedging order
router.post('/', hedgingController.createOrder);

// الحصول على أمر تحوط - Get hedging order
router.get('/:orderId', hedgingController.getOrder);

// الحصول على أوامر المستخدم - Get user orders
router.get('/user/:userId', hedgingController.getUserOrders);

// تنفيذ أمر التحوط - Execute order
router.post('/:orderId/execute', hedgingController.executeOrder);

// إلغاء أمر التحوط - Cancel order
router.post('/:orderId/cancel', hedgingController.cancelOrder);

export default router;
