import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';

const router = Router();
const paymentController = new PaymentController();

// Payment intent creation
router.post('/create-intent', paymentController.createPaymentIntent.bind(paymentController));

// Payment confirmation
router.post('/confirm', paymentController.confirmPayment.bind(paymentController));

// Payment status check
router.get('/:paymentIntentId/status', paymentController.getPaymentStatus.bind(paymentController));

// Stripe webhook handler
router.post('/webhook', paymentController.handleWebhook.bind(paymentController));

export default router;
