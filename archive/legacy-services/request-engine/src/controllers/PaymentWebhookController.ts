import { Request, Response } from 'express';
import { StateTransitionService } from '../services/StateTransitionService';
import { RequestService } from '../services/RequestService';
import { NotificationService } from '../services/NotificationService';

/**
 * Payment Webhook Controller
 * Handles webhook events from payment-service (Stripe)
 */
export class PaymentWebhookController {
  private notificationService: NotificationService;

  constructor(
    private stateTransitionService: StateTransitionService,
    private requestService: RequestService
  ) {
    this.notificationService = new NotificationService();
  }

  /**
   * Handle payment webhook events
   * POST /api/webhooks/payment
   */
  async handlePaymentWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event = req.body;

      console.log('[PaymentWebhookController] Received webhook event:', {
        type: event.type,
        id: event.id,
      });

      // Validate webhook event
      if (!event.type || !event.data) {
        console.error('[PaymentWebhookController] Invalid webhook event structure');
        res.status(400).json({
          success: false,
          error: 'Invalid webhook event structure',
        });
        return;
      }

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event);
          break;

        default:
          console.log(`[PaymentWebhookController] Unhandled event type: ${event.type}`);
      }

      // Always return 200 to acknowledge receipt
      res.status(200).json({
        success: true,
        message: 'Webhook received',
      });
    } catch (error: any) {
      console.error('[PaymentWebhookController] Error processing webhook:', error.message);
      
      // Return 200 even on error to prevent retries for unrecoverable errors
      // Log the error for manual investigation
      res.status(200).json({
        success: false,
        error: 'Webhook processing failed',
        message: error.message,
      });
    }
  }

  /**
   * Handle payment_intent.succeeded event
   */
  private async handlePaymentSuccess(event: any): Promise<void> {
    try {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const requestId = paymentIntent.metadata?.requestId;

      console.log('[PaymentWebhookController] Processing payment success:', {
        paymentIntentId,
        requestId,
      });

      if (!requestId) {
        console.error('[PaymentWebhookController] No requestId in payment intent metadata');
        throw new Error('Missing requestId in payment intent metadata');
      }

      // Get request data
      const request = await this.requestService.getRequestById(requestId, 'system', 'ADMIN');
      
      if (!request) {
        console.error(`[PaymentWebhookController] Request not found: ${requestId}`);
        throw new Error(`Request not found: ${requestId}`);
      }

      // Verify request is in AWAITING_PAYMENT status
      if (request.status !== 'AWAITING_PAYMENT') {
        console.warn(`[PaymentWebhookController] Request ${requestId} is not in AWAITING_PAYMENT status: ${request.status}`);
        // Don't throw - this might be a duplicate webhook
        return;
      }

      // Handle payment success
      await this.stateTransitionService.handlePaymentSuccess(
        requestId,
        paymentIntentId,
        request
      );

      console.log(`[PaymentWebhookController] Payment success handled for request ${requestId}`);
    } catch (error: any) {
      console.error('[PaymentWebhookController] Error handling payment success:', error.message);
      throw error;
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  private async handlePaymentFailed(event: any): Promise<void> {
    try {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const requestId = paymentIntent.metadata?.requestId;

      console.log('[PaymentWebhookController] Processing payment failure:', {
        paymentIntentId,
        requestId,
        error: paymentIntent.last_payment_error?.message,
      });

      if (!requestId) {
        console.error('[PaymentWebhookController] No requestId in payment intent metadata');
        return;
      }

      // Update payment status to FAILED
      await this.requestService.updateRequestPaymentInfo(requestId, {
        paymentStatus: 'FAILED',
      });

      // Get request data for notification
      const request = await this.requestService.getRequestById(requestId, 'system', 'ADMIN');
      
      if (request) {
        // Send notification to buyer about payment failure
        await this.notificationService.sendPaymentFailed({
          userId: request.requesterId,
          requestId,
          productTitle: request.product.title,
          errorMessage: paymentIntent.last_payment_error?.message,
        });
      }

      console.log(`[PaymentWebhookController] Payment failure handled for request ${requestId}`);
    } catch (error: any) {
      console.error('[PaymentWebhookController] Error handling payment failure:', error.message);
      throw error;
    }
  }

  /**
   * Handle payment_intent.canceled event
   */
  private async handlePaymentCanceled(event: any): Promise<void> {
    try {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const requestId = paymentIntent.metadata?.requestId;

      console.log('[PaymentWebhookController] Processing payment cancellation:', {
        paymentIntentId,
        requestId,
      });

      if (!requestId) {
        console.error('[PaymentWebhookController] No requestId in payment intent metadata');
        return;
      }

      // Update payment status to CANCELLED
      await this.requestService.updateRequestPaymentInfo(requestId, {
        paymentStatus: 'CANCELLED',
      });

      console.log(`[PaymentWebhookController] Payment cancellation handled for request ${requestId}`);
    } catch (error: any) {
      console.error('[PaymentWebhookController] Error handling payment cancellation:', error.message);
      throw error;
    }
  }
}
