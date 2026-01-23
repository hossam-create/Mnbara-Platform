import { Router } from 'express';
import { StripePaymentController } from '../controllers/stripe-payment.controller';
import { paymentRateLimiter, webhookRateLimiter } from '../middleware/rate-limiter';
import express from 'express';

const router = Router();
const stripePaymentController = new StripePaymentController();

/**
 * Stripe Payment Routes
 * Implements Stripe PaymentIntent flow with escrow integration
 */

// Create PaymentIntent
router.post(
  '/create-intent',
  paymentRateLimiter,
  stripePaymentController.createPaymentIntent.bind(stripePaymentController)
);

// Confirm Payment
router.post(
  '/confirm',
  paymentRateLimiter,
  stripePaymentController.confirmPayment.bind(stripePaymentController)
);

// Get Payment Status
router.get(
  '/status/:paymentIntentId',
  stripePaymentController.getPaymentStatus.bind(stripePaymentController)
);

// Webhook endpoint (raw body required for signature verification)
router.post(
  '/webhook',
  webhookRateLimiter,
  express.raw({ type: 'application/json' }),
  stripePaymentController.handleWebhook.bind(stripePaymentController)
);

export default router;
