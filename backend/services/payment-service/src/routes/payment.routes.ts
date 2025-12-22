import { Router, raw } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const paymentController = new PaymentController();

// ==================== STRIPE ROUTES ====================

// Create payment intent (for card payments with escrow hold)
router.post('/stripe/create-intent', paymentController.createPaymentIntent);

// Capture payment (release held funds to seller)
router.post('/stripe/capture', paymentController.captureStripePayment);

// Refund payment
router.post('/stripe/refund', paymentController.refundStripePayment);

// Stripe webhook (needs raw body for signature verification)
router.post(
    '/webhook/stripe',
    raw({ type: 'application/json' }),
    paymentController.handleStripeWebhook
);

// ==================== PAYPAL ROUTES ====================

// Create PayPal order
router.post('/paypal/create-order', paymentController.createPayPalOrder);

// Capture PayPal order (complete payment)
router.post('/paypal/capture-order', paymentController.capturePayPalOrder);

// Get PayPal order details
router.get('/paypal/order/:orderId', paymentController.getPayPalOrder);

// Refund PayPal capture
router.post('/paypal/refund', paymentController.refundPayPalCapture);

// PayPal webhook
router.post('/webhook/paypal', paymentController.handlePayPalWebhook);

// ==================== PAYMOB ROUTES ====================

// Initiate Paymob card payment (returns iframe URL)
router.post('/paymob/initiate', paymentController.initiatePaymobPayment);

// Create Paymob mobile wallet payment
router.post('/paymob/wallet', paymentController.createPaymobWalletPayment);

// Get Paymob transaction details
router.get('/paymob/transaction/:transactionId', paymentController.getPaymobTransaction);

// Refund Paymob transaction
router.post('/paymob/refund', paymentController.refundPaymobTransaction);

// Paymob transaction callback (webhook)
router.post('/webhook/paymob', paymentController.handlePaymobWebhook);

// Paymob response callback (redirect after payment)
router.get('/paymob/callback', paymentController.handlePaymobResponse);

// ==================== LEGACY ROUTES (backward compatibility) ====================

// Keep old route for backward compatibility
router.post('/create-intent', paymentController.createPaymentIntent);

export default router;
