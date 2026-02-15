import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';

const router = Router();

// إنشاء طلب دفع - Create payment
router.post('/', paymentController.createPayment);

// الحصول على حالة الدفع - Get payment status
router.get('/:paymentId', paymentController.getPaymentStatus);

// تأكيد الدفع (webhook) - Confirm payment
router.post('/:paymentId/confirm', paymentController.confirmPayment);

// استرداد الدفع - Refund payment
router.post('/:paymentId/refund', paymentController.refundPayment);

// دفع من المحفظة - Pay from wallet
router.post('/:paymentId/pay-from-wallet', paymentController.payFromWallet);

// الحصول على مدفوعات التاجر - Get merchant payments
router.get('/merchant/:merchantId', paymentController.getMerchantPayments);

export default router;
