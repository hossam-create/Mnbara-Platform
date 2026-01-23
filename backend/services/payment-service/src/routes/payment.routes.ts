import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import escrowPaymentRoutes from './escrow-payment.routes';
import refundRoutes from './refund.routes';
import stripePaymentRoutes from './stripe-payment.routes';

const router = Router();
const paymentController = new PaymentController();

// Legacy payment routes (retail checkout - to be deprecated)
router.post('/payment/intent', paymentController.createPaymentIntent.bind(paymentController));
router.post('/payment/confirm', paymentController.confirmPayment.bind(paymentController));
router.post('/orders', paymentController.createOrder.bind(paymentController));
router.post('/payment/refund', paymentController.refundPayment.bind(paymentController));
router.get('/payment/status/:paymentIntentId', paymentController.getPaymentStatus.bind(paymentController));

// Enhanced Stripe PaymentIntent routes (with wallet integration)
router.use('/stripe', stripePaymentRoutes);

// Escrow-first payment routes (Phase 4.0)
router.use('/escrow', escrowPaymentRoutes);

// Refund & chargeback tracking routes (Phase 4.2)
router.use('/v1', refundRoutes);

export default router;
