import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const paymentController = new PaymentController();

// Create payment intent (Stripe)
router.post('/create-intent', paymentController.createPaymentIntent);

// Process PayPal payment
router.post('/paypal/create-order', paymentController.createPayPalOrder);
router.post('/paypal/capture-order', paymentController.capturePayPalOrder);

// Webhooks
router.post('/webhook/stripe', paymentController.handleStripeWebhook);
router.post('/webhook/paypal', paymentController.handlePayPalWebhook);

export default router;
