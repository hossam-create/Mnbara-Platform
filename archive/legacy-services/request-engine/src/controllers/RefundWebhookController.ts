// ============================================
// Refund Webhook Controller
// Handles Stripe refund webhooks
// ============================================

import { Request, Response, NextFunction } from 'express';
import { stripeRefundService } from '../services/StripeRefundService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/webhooks/stripe/refund
 * Handle Stripe refund webhooks
 */
export async function handleRefundWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const event = stripeRefundService.verifyWebhookSignature(payload, signature);

    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    // Process the event
    const result = await stripeRefundService.handleWebhook(event);

    if (result.processed) {
      // Update dispute record if needed
      if (event.type === 'charge.refund.succeeded') {
        await handleRefundSucceeded(event);
      } else if (event.type === 'charge.refund.failed') {
        await handleRefundFailed(event);
      }

      return res.json({
        success: true,
        message: result.message
      });
    }

    // Event not processed (unknown type)
    return res.json({
      success: false,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error processing refund webhook:', error);
    next(error);
  }
}

/**
 * Handle refund succeeded event
 */
async function handleRefundSucceeded(event: any): Promise<void> {
  const refund = event.data.object;
  
  console.log(`[Webhook] Refund succeeded: ${refund.id}`);

  // Find and update the dispute with Stripe refund ID
  // This would typically be done by looking up the dispute using metadata
  try {
    // Find dispute by stripe refund ID or payment intent
    // await prisma.dispute.updateMany({
    //   where: { stripeRefundId: refund.id },
    //   data: { status: 'RESOLVED' }
    // });
    console.log(`[Webhook] Dispute record would be updated for refund ${refund.id}`);
  } catch (error) {
    console.error('[Webhook] Error updating dispute record:', error);
  }
}

/**
 * Handle refund failed event
 */
async function handleRefundFailed(event: any): Promise<void> {
  const refund = event.data.object;
  
  console.log(`[Webhook] Refund failed: ${refund.id}, reason: ${refund.failure_reason}`);

  // This would typically trigger an alert or manual review
  console.log(`[Webhook] Refund ${refund.id} failed - requires manual intervention`);
}

/**
 * GET /api/webhooks/stripe/health
 * Health check endpoint for webhook receiver
 */
export function healthCheck(req: Request, res: Response) {
  res.json({
    success: true,
    service: 'refund-webhook',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
