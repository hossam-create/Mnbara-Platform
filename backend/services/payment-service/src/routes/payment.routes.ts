import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const paymentController = new PaymentController();

router.post('/payment/intent', paymentController.createPaymentIntent.bind(paymentController));
router.post('/payment/confirm', paymentController.confirmPayment.bind(paymentController));
router.post('/orders', paymentController.createOrder.bind(paymentController));
router.post('/payment/refund', paymentController.refundPayment.bind(paymentController));
router.get('/payment/status/:paymentIntentId', paymentController.getPaymentStatus.bind(paymentController));

export default router;
