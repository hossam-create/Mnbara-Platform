import { Request, Response } from 'express';
import { EnhancedStripeService } from '../services/enhanced-stripe.service';
import Stripe from 'stripe';

const stripeService = new EnhancedStripeService();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * Stripe Payment Controller
 * Handles Stripe PaymentIntent endpoints
 */
export class StripePaymentController {
  /**
   * POST /api/payments/stripe/create-intent
   * Create Stripe PaymentIntent with fee calculation
   */
  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { requestId, buyerId, sellerId, amount, currency, description, metadata } = req.body;

      // Validation
      if (!requestId || !buyerId || !sellerId || !amount) {
        res.status(400).json({
          error: 'Missing required fields: requestId, buyerId, sellerId, amount',
        });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({
          error: 'Amount must be greater than 0',
        });
        return;
      }

      // Create payment intent
      const result = await stripeService.createPaymentIntent({
        requestId,
        buyerId,
        sellerId,
        amount,
        currency,
        description,
        metadata,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[StripePaymentController] Create intent error:', error);
      res.status(500).json({
        error: 'Failed to create payment intent',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/payments/stripe/confirm
   * Confirm payment and lock funds in escrow
   */
  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentIntentId, requestId } = req.body;

      // Validation
      if (!paymentIntentId || !requestId) {
        res.status(400).json({
          error: 'Missing required fields: paymentIntentId, requestId',
        });
        return;
      }

      // Confirm payment
      const result = await stripeService.confirmPayment({
        paymentIntentId,
        requestId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[StripePaymentController] Confirm payment error:', error);
      res.status(500).json({
        error: 'Failed to confirm payment',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/payments/stripe/status/:paymentIntentId
   * Get payment status
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paymentIntentId } = req.params;

      if (!paymentIntentId) {
        res.status(400).json({
          error: 'Missing paymentIntentId parameter',
        });
        return;
      }

      const status = await stripeService.getPaymentStatus(paymentIntentId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      console.error('[StripePaymentController] Get status error:', error);
      res.status(500).json({
        error: 'Failed to get payment status',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/webhooks/stripe
   * Handle Stripe webhooks with signature verification
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[StripePaymentController] STRIPE_WEBHOOK_SECRET not configured');
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('[StripePaymentController] Webhook signature verification failed:', err.message);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          console.log(`[StripePaymentController] Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[StripePaymentController] Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  /**
   * Handle payment_intent.succeeded event
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log('[StripePaymentController] Payment succeeded:', paymentIntent.id);

    const requestId = paymentIntent.metadata.requestId;
    if (!requestId) {
      console.error('[StripePaymentController] No requestId in payment intent metadata');
      return;
    }

    // Update Request status to PAID
    // TODO: Call Request service to update status
    console.log(`[StripePaymentController] Updating request ${requestId} to PAID status`);

    // Lock funds in escrow (if not already done)
    try {
      await stripeService.confirmPayment({
        paymentIntentId: paymentIntent.id,
        requestId,
      });
    } catch (error: any) {
      console.error('[StripePaymentController] Failed to lock funds after webhook:', error.message);
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log('[StripePaymentController] Payment failed:', paymentIntent.id);

    const requestId = paymentIntent.metadata.requestId;
    if (!requestId) {
      console.error('[StripePaymentController] No requestId in payment intent metadata');
      return;
    }

    // Update Request status to PAYMENT_FAILED
    // TODO: Call Request service to update status
    console.log(`[StripePaymentController] Updating request ${requestId} to PAYMENT_FAILED status`);
  }

  /**
   * Handle charge.refunded event
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    console.log('[StripePaymentController] Charge refunded:', charge.id);

    const paymentIntentId = charge.payment_intent as string;
    if (!paymentIntentId) {
      console.error('[StripePaymentController] No payment intent in charge');
      return;
    }

    // Get payment intent to access metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const requestId = paymentIntent.metadata.requestId;

    if (!requestId) {
      console.error('[StripePaymentController] No requestId in payment intent metadata');
      return;
    }

    // Update Request status to REFUNDED
    // TODO: Call Request service to update status
    console.log(`[StripePaymentController] Updating request ${requestId} to REFUNDED status`);
  }
}
