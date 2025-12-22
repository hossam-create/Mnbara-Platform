import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { DisputeService } from '../services/dispute.service';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

async function logEscrowAction(params: {
  escrowId: number;
  action: string;
  performedBy?: number;
  performedByRole?: string;
  reason?: string;
  metadata?: Record<string, any>;
}) {
  const { escrowId, action, performedBy, performedByRole, reason, metadata } = params;
  try {
    await prisma.escrowActionLog.create({
      data: {
        escrowId,
        action,
        performedBy: performedBy ?? null,
        performedByRole: performedByRole ?? null,
        reason: reason ?? null,
        metadata: metadata ?? null,
      },
    });
  } catch (err) {
    console.error('[Escrow] Failed to log action', action, err);
  }
}

export class EscrowController {
  // Create escrow for an order (only after payment succeeds - PAY-001)
  async createEscrow(req: Request, res: Response) {
    try {
      const { orderId, orderType, paymentIntentId } = req.body;

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { buyer: true, traveler: true },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Allow escrow creation as soon as checkout completes (PENDING/PAID/MATCHED)
      if (!['PENDING', 'PAID', 'MATCHED'].includes(order.status)) {
        return res.status(400).json({ error: 'Order must be in PENDING, PAID, or MATCHED status' });
      }

      // Check if escrow already exists
      const existingEscrow = await prisma.escrow.findUnique({
        where: { orderId },
      });

      if (existingEscrow) {
        return res.status(400).json({ error: 'Escrow already exists for this order' });
      }

      // PAY-001: Only create escrow if payment has succeeded
      let paymentIntent: Stripe.PaymentIntent;
      if (paymentIntentId) {
        // Verify payment intent exists and succeeded
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        // PAY-001: Failed payments must not create escrow records
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ 
            error: 'Payment must be successful before creating escrow',
            paymentStatus: paymentIntent.status 
          });
        }
      } else {
        // Create new PaymentIntent (hold, don't capture)
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(Number(order.totalAmount) * 100), // Convert to cents
          currency: order.currency.toLowerCase(),
          capture_method: 'manual', // Hold payment
          metadata: {
            orderId: order.id.toString(),
            orderNumber: order.orderNumber,
          },
        });
        
        // Return client secret for frontend payment confirmation
        // Escrow will be created via webhook when payment succeeds
        return res.status(200).json({
          message: 'Payment intent created. Escrow will be created after payment succeeds.',
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
        });
      }

      // Determine order type (default BUY_NOW, can be AUCTION)
      const escrowOrderType = orderType === 'AUCTION' ? 'AUCTION' : 'BUY_NOW';

      // Create escrow record only after payment succeeds
      const escrow = await prisma.escrow.create({
        data: {
          orderId,
          buyerId: order.buyerId || 0, // Handle guest orders
          sellerId: order.travelerId || 0, // Or sellerId from order
          travelerId: order.travelerId || null,
          amount: order.totalAmount,
          currency: order.currency,
          stripePaymentId: paymentIntent.id,
          orderType: escrowOrderType, // PAY-001: Support auction and buy-now
          status: 'HELD', // Payment succeeded, so funds are held
          heldAt: new Date(),
          autoReleaseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      await logEscrowAction({
        escrowId: escrow.id,
        action: 'CREATED',
        performedBy: order.buyerId || undefined,
        performedByRole: 'buyer',
        metadata: { 
          orderStatus: order.status,
          orderType: escrowOrderType,
          paymentIntentId: paymentIntent.id,
        },
      });

      res.status(201).json({
        message: 'Escrow created successfully',
        escrow,
      });
    } catch (error: any) {
      console.error('Create escrow error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Hold payment (buyer pays) - PAY-001: Only works if escrow already exists (created via webhook)
  async holdPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
        include: { order: true },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      // PAY-001: Escrow should already be HELD if created via webhook
      // This endpoint is for manual confirmation or legacy flow
      if (escrow.status === 'HELD') {
        return res.json({
          message: 'Payment already held in escrow',
          escrow,
        });
      }

      if (escrow.status !== 'PENDING') {
        return res.status(400).json({ error: 'Escrow is not in PENDING status' });
      }

      // Confirm PaymentIntent (hold the money)
      if (escrow.stripePaymentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(escrow.stripePaymentId);
        
        // PAY-001: Failed payments must not create escrow - verify payment succeeded
        if (paymentIntent.status !== 'succeeded') {
          // If payment failed, cancel escrow
          await prisma.escrow.update({
            where: { id: parseInt(id) },
            data: { status: 'CANCELLED' },
          });
          return res.status(400).json({ 
            error: 'Payment not completed by buyer',
            paymentStatus: paymentIntent.status 
          });
        }
      }

      // Update escrow status
      const updated = await prisma.escrow.update({
        where: { id: parseInt(id) },
        data: {
          status: 'HELD',
          heldAt: new Date(),
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: escrow.orderId },
        data: { status: 'PAID' },
      });

      await logEscrowAction({
        escrowId: updated.id,
        action: 'HELD',
        performedBy: escrow.buyerId ?? undefined,
        performedByRole: 'buyer',
      });

      res.json({
        message: 'Payment held in escrow',
        escrow: updated,
      });
    } catch (error: any) {
      console.error('Hold payment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Release payment after delivery confirmation (DEL-001: Controlled escrow release)
  async releasePayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const performedBy = req.body.performedBy || req.headers['x-user-id'] || undefined; // DEL-001: Actor tracking

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
        include: { order: true },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      // DEL-001: Only escrows with status HELD can be released
      if (escrow.status !== 'HELD') {
        return res.status(400).json({ 
          error: 'Escrow can only be released when status is HELD',
          currentStatus: escrow.status,
          allowedStatus: 'HELD'
        });
      }

      // DEL-001: Duplicate release attempts must be prevented
      if (escrow.status === 'RELEASED') {
        return res.status(400).json({ 
          error: 'Escrow has already been released',
          releasedAt: escrow.releasedAt,
        });
      }

      // Prevent release if there is an open protection request
      const protectionOpen = await prisma.protectionRequest.findFirst({
        where: {
          escrowId: escrow.id,
          status: { in: ['OPEN', 'UNDER_REVIEW'] },
        },
      });
      if (protectionOpen) {
        return res.status(400).json({ error: 'Escrow is under protection review' });
      }

      // Prevent release if buyer hasn't confirmed delivery / receipt not uploaded
      if (!escrow.buyerConfirmedDelivery || !escrow.receiptUploaded) {
        return res.status(400).json({ error: 'Delivery not confirmed or receipt missing' });
      }

      // DEL-001: Release must work for both BUY_NOW and AUCTION orders
      // No order-type-specific logic needed - both use same release flow

      let releaseResult: any = null;
      let releaseError: string | null = null;

      try {
        // Capture the payment (release to seller/traveler)
        if (escrow.stripePaymentId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(escrow.stripePaymentId);
            
            if (paymentIntent.status === 'requires_capture') {
              releaseResult = await stripe.paymentIntents.capture(escrow.stripePaymentId);
            } else if (paymentIntent.status === 'succeeded') {
              // Already captured, proceed with release
              releaseResult = { id: paymentIntent.id, status: 'succeeded' };
            } else {
              throw new Error(`PaymentIntent status ${paymentIntent.status} cannot be released`);
            }
          } catch (stripeError: any) {
            releaseError = `Stripe release failed: ${stripeError.message}`;
            throw stripeError;
          }
        }

        // DEL-001: Release must update escrow status to RELEASED
        const updated = await prisma.escrow.update({
          where: { id: parseInt(id) },
          data: {
            status: 'RELEASED', // DEL-001: Standard status (not RELEASED_TO_TRAVELER)
            releasedAt: new Date(),
            metadata: {
              ...(escrow.metadata as object || {}),
              releasedBy: performedBy || null,
              releasedAt: new Date().toISOString(),
              orderType: escrow.orderType,
              releaseProviderId: releaseResult?.id || null,
            },
          },
        });

        // Update order status
        await prisma.order.update({
          where: { id: escrow.orderId },
          data: { status: 'COMPLETED' },
        });

        // DEL-001: Release action must be auditable with timestamp and actor
        await logEscrowAction({
          escrowId: updated.id,
          action: 'RELEASED',
          performedBy: performedBy ? parseInt(performedBy.toString()) : (escrow.travelerId ?? escrow.sellerId ?? undefined),
          performedByRole: 'buyer_confirmation',
          metadata: {
            orderType: escrow.orderType,
            releaseAmount: Number(escrow.amount),
            releaseProviderId: releaseResult?.id || null,
            releasedAt: updated.releasedAt?.toISOString(),
            deliveryConfirmed: escrow.buyerConfirmedDelivery,
            receiptUploaded: escrow.receiptUploaded,
          },
        });

        res.json({
          message: 'Payment released successfully',
          escrow: updated,
          releaseDetails: {
            amount: Number(escrow.amount),
            currency: escrow.currency,
            releasedAt: updated.releasedAt,
            releasedTo: escrow.travelerId || escrow.sellerId,
            providerReleaseId: releaseResult?.id || null,
          },
        });
      } catch (releaseProcessingError: any) {
        // DEL-001: Failed release attempts must be logged clearly
        const errorMessage = releaseError || releaseProcessingError.message;
        
        await logEscrowAction({
          escrowId: escrow.id,
          action: 'RELEASE_FAILED',
          performedBy: performedBy ? parseInt(performedBy.toString()) : undefined,
          performedByRole: 'system',
          reason: `Release failed: ${errorMessage}`,
          metadata: {
            error: errorMessage,
            errorType: releaseProcessingError.type || 'UNKNOWN',
            attemptedAt: new Date().toISOString(),
            orderType: escrow.orderType,
            escrowStatus: escrow.status,
          },
        });

        console.error('[Escrow Release] Release processing failed:', {
          escrowId: escrow.id,
          orderId: escrow.orderId,
          error: errorMessage,
          stack: releaseProcessingError.stack,
        });

        return res.status(500).json({ 
          error: 'Release processing failed',
          details: errorMessage,
          escrowId: escrow.id,
          orderId: escrow.orderId,
        });
      }
    } catch (error: any) {
      console.error('[Escrow Release] Unexpected error:', error);
      res.status(500).json({ 
        error: 'Unexpected error during release',
        message: error.message,
      });
    }
  }

  // Refund payment to buyer (PAY-002: Controlled escrow refunds)
  async refundPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason, amount } = req.body; // amount parameter for validation (must be full amount)

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Refund reason is required' });
      }

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
        include: { order: true },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      // PAY-002: Refunds can only be initiated if escrow status is HELD
      if (escrow.status !== 'HELD') {
        return res.status(400).json({ 
          error: 'Refund can only be initiated when escrow status is HELD',
          currentStatus: escrow.status,
          allowedStatus: 'HELD'
        });
      }

      // PAY-002: Duplicate refund attempts must be prevented
      if (escrow.status === 'REFUNDED') {
        return res.status(400).json({ 
          error: 'Escrow has already been refunded',
          refundedAt: escrow.releasedAt,
        });
      }

      // PAY-002: Partial refunds are NOT supported (full amount only)
      if (amount !== undefined) {
        const requestedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
        const escrowAmount = Number(escrow.amount);
        
        if (Math.abs(requestedAmount - escrowAmount) > 0.01) { // Allow small floating point differences
          return res.status(400).json({ 
            error: 'Partial refunds are not supported. Only full amount refunds are allowed.',
            requestedAmount,
            escrowAmount,
          });
        }
      }

      // PAY-002: Refund action must update escrow status to REFUNDED
      let refundResult: any = null;
      let refundError: string | null = null;

      try {
        // Process refund via Stripe (cancel PaymentIntent or create refund)
        if (escrow.stripePaymentId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(escrow.stripePaymentId);
            
            if (paymentIntent.status === 'succeeded') {
              // Payment was captured, need to create a refund
              const refund = await stripe.refunds.create({
                payment_intent: escrow.stripePaymentId,
                amount: Math.round(Number(escrow.amount) * 100), // Full amount in cents
                reason: 'requested_by_customer',
                metadata: {
                  orderId: escrow.orderId.toString(),
                  escrowId: escrow.id.toString(),
                  refundReason: reason,
                },
              });
              refundResult = refund;
            } else if (paymentIntent.status === 'requires_capture') {
              // Payment not yet captured, cancel the PaymentIntent
              await stripe.paymentIntents.cancel(escrow.stripePaymentId);
              refundResult = { id: 'cancelled', status: 'cancelled' };
            } else {
              throw new Error(`PaymentIntent status ${paymentIntent.status} cannot be refunded`);
            }
          } catch (stripeError: any) {
            refundError = `Stripe refund failed: ${stripeError.message}`;
            throw stripeError;
          }
        }

        // Update escrow status to REFUNDED
        const updated = await prisma.escrow.update({
          where: { id: parseInt(id) },
          data: {
            status: 'REFUNDED',
            releasedAt: new Date(),
            metadata: {
              ...(escrow.metadata as object || {}),
              refundReason: reason,
              refundedAt: new Date().toISOString(),
              refundProviderId: refundResult?.id || null,
            },
          },
        });

        // Update order status
        await prisma.order.update({
          where: { id: escrow.orderId },
          data: { status: 'CANCELLED' },
        });

        // PAY-002: Refunds must be auditable with reason and timestamp
        await logEscrowAction({
          escrowId: updated.id,
          action: 'REFUNDED',
          performedBy: escrow.buyerId ?? undefined,
          performedByRole: 'system_or_admin',
          reason,
          metadata: {
            orderType: escrow.orderType,
            refundAmount: Number(escrow.amount),
            refundProviderId: refundResult?.id || null,
            refundTimestamp: new Date().toISOString(),
          },
        });

        res.json({
          message: 'Payment refunded to buyer successfully',
          escrow: updated,
          reason,
          refundDetails: {
            amount: Number(escrow.amount),
            currency: escrow.currency,
            refundedAt: updated.releasedAt,
            providerRefundId: refundResult?.id || null,
          },
        });
      } catch (refundProcessingError: any) {
        // PAY-002: Refund failures must be logged and surfaced clearly
        const errorMessage = refundError || refundProcessingError.message;
        
        await logEscrowAction({
          escrowId: escrow.id,
          action: 'REFUND_FAILED',
          performedBy: escrow.buyerId ?? undefined,
          performedByRole: 'system',
          reason: `Refund failed: ${errorMessage}`,
          metadata: {
            error: errorMessage,
            errorType: refundProcessingError.type || 'UNKNOWN',
            attemptedAt: new Date().toISOString(),
            orderType: escrow.orderType,
          },
        });

        console.error('[Escrow Refund] Refund processing failed:', {
          escrowId: escrow.id,
          orderId: escrow.orderId,
          error: errorMessage,
          stack: refundProcessingError.stack,
        });

        return res.status(500).json({ 
          error: 'Refund processing failed',
          details: errorMessage,
          escrowId: escrow.id,
          orderId: escrow.orderId,
        });
      }
    } catch (error: any) {
      console.error('[Escrow Refund] Unexpected error:', error);
      res.status(500).json({ 
        error: 'Unexpected error during refund',
        message: error.message,
      });
    }
  }

  /**
   * Upload delivery proof (photo/video)
   */
  async uploadProof(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { mediaUrl, mediaType, orderId } = req.body;
      if (!mediaUrl || !mediaType) {
        return res.status(400).json({ error: 'mediaUrl and mediaType are required' });
      }
      const escrow = await prisma.escrow.findUnique({ where: { id: parseInt(id) } });
      if (!escrow) return res.status(404).json({ error: 'Escrow not found' });

      const orderIdResolved = orderId ? Number(orderId) : escrow.orderId;
      const proof = await prisma.deliveryProof.create({
        data: {
          escrowId: escrow.id,
          orderId: orderIdResolved,
          mediaUrl,
          mediaType,
        },
      });
      await logEscrowAction({ escrowId: escrow.id, action: 'PROOF_UPLOADED' });
      return res.status(201).json({ data: proof });
    } catch (error: any) {
      console.error('Upload proof error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Upload purchase receipt (required before release)
   */
  async uploadReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { receiptUrl, provider, orderId } = req.body;
      if (!receiptUrl) {
        return res.status(400).json({ error: 'receiptUrl is required' });
      }
      const escrow = await prisma.escrow.findUnique({ where: { id: parseInt(id) } });
      if (!escrow) return res.status(404).json({ error: 'Escrow not found' });

      const orderIdResolved = orderId ? Number(orderId) : escrow.orderId;
      const receipt = await prisma.purchaseReceipt.create({
        data: {
          escrowId: escrow.id,
          orderId: orderIdResolved,
          receiptUrl,
          provider: provider ?? null,
        },
      });
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: { receiptUploaded: true },
      });
      await logEscrowAction({ escrowId: escrow.id, action: 'RECEIPT_UPLOADED' });
      return res.status(201).json({ data: receipt });
    } catch (error: any) {
      console.error('Upload receipt error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DEL-001: Buyer confirms delivery -> release escrow (requires proof + receipt)
   * This method triggers escrow release after delivery confirmation
   */
  async confirmDelivery(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const performedBy = req.body.performedBy || req.headers['x-user-id'] || undefined;

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
        include: { order: true },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      // DEL-001: Only escrows with status HELD can be released
      if (escrow.status !== 'HELD') {
        return res.status(400).json({ 
          error: 'Escrow can only be released when status is HELD',
          currentStatus: escrow.status,
        });
      }

      // DEL-001: Duplicate release attempts must be prevented
      if (escrow.status === 'RELEASED') {
        return res.status(400).json({ 
          error: 'Escrow has already been released',
          releasedAt: escrow.releasedAt,
        });
      }

      // Validate delivery proof and receipt
      const proofCount = await prisma.deliveryProof.count({ where: { escrowId: escrow.id } });
      if (proofCount < 1) {
        return res.status(400).json({ error: 'At least one delivery proof is required' });
      }
      const receiptCount = await prisma.purchaseReceipt.count({ where: { escrowId: escrow.id } });
      if (receiptCount < 1) {
        return res.status(400).json({ error: 'Purchase receipt is required before confirmation' });
      }

      // DEL-001: Delivery confirmation must trigger escrow release
      // Call the releasePayment method logic (or reuse it)
      try {
        // Capture the payment (release to seller/traveler)
        let releaseResult: any = null;
        if (escrow.stripePaymentId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(escrow.stripePaymentId);
            
            if (paymentIntent.status === 'requires_capture') {
              releaseResult = await stripe.paymentIntents.capture(escrow.stripePaymentId);
            } else if (paymentIntent.status === 'succeeded') {
              releaseResult = { id: paymentIntent.id, status: 'succeeded' };
            }
          } catch (stripeError: any) {
            throw new Error(`Stripe release failed: ${stripeError.message}`);
          }
        }

        // DEL-001: Release must update escrow status to RELEASED
        const updated = await prisma.escrow.update({
          where: { id: escrow.id },
          data: {
            status: 'RELEASED',
            releasedAt: new Date(),
            buyerConfirmedDelivery: true,
            receiptUploaded: true,
            metadata: {
              ...(escrow.metadata as object || {}),
              releasedBy: performedBy ? parseInt(performedBy.toString()) : null,
              releasedAt: new Date().toISOString(),
              orderType: escrow.orderType,
              releaseProviderId: releaseResult?.id || null,
            },
          },
        });

        // Update order status
        await prisma.order.update({
          where: { id: escrow.orderId },
          data: { status: 'COMPLETED' },
        });

        // DEL-001: Release action must be auditable with timestamp and actor
        await logEscrowAction({
          escrowId: updated.id,
          action: 'DELIVERY_CONFIRMED_AND_RELEASED',
          performedBy: performedBy ? parseInt(performedBy.toString()) : (escrow.buyerId ?? undefined),
          performedByRole: 'buyer',
          metadata: {
            orderType: escrow.orderType,
            releaseAmount: Number(escrow.amount),
            releaseProviderId: releaseResult?.id || null,
            releasedAt: updated.releasedAt?.toISOString(),
            deliveryConfirmed: true,
            receiptUploaded: true,
          },
        });

        return res.json({ 
          message: 'Delivery confirmed, escrow released',
          escrow: updated,
          releaseDetails: {
            amount: Number(escrow.amount),
            currency: escrow.currency,
            releasedAt: updated.releasedAt,
            releasedTo: escrow.travelerId || escrow.sellerId,
          },
        });
      } catch (releaseError: any) {
        // DEL-001: Failed release attempts must be logged clearly
        await logEscrowAction({
          escrowId: escrow.id,
          action: 'RELEASE_FAILED',
          performedBy: performedBy ? parseInt(performedBy.toString()) : undefined,
          performedByRole: 'buyer',
          reason: `Release failed during delivery confirmation: ${releaseError.message}`,
          metadata: {
            error: releaseError.message,
            errorType: releaseError.type || 'UNKNOWN',
            attemptedAt: new Date().toISOString(),
            orderType: escrow.orderType,
          },
        });

        console.error('[Escrow Release] Release failed during delivery confirmation:', {
          escrowId: escrow.id,
          orderId: escrow.orderId,
          error: releaseError.message,
        });

        return res.status(500).json({ 
          error: 'Release processing failed',
          details: releaseError.message,
          escrowId: escrow.id,
          orderId: escrow.orderId,
        });
      }
    } catch (error: any) {
      console.error('[Escrow Release] Confirm delivery error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Buyer rejects delivery -> move to protection flow
   */
  async rejectDelivery(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { performedBy, reason } = req.body;
      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
      });
      if (!escrow) return res.status(404).json({ error: 'Escrow not found' });

      await prisma.escrow.update({
        where: { id: escrow.id },
        data: { status: 'DISPUTED' },
      });
      await prisma.order.update({
        where: { id: escrow.orderId },
        data: { status: 'DISPUTED' },
      });
      await prisma.protectionRequest.create({
        data: {
          orderId: escrow.orderId,
          escrowId: escrow.id,
          buyerId: escrow.buyerId,
          reason: 'NOT_DELIVERED',
          description: reason ?? null,
        },
      });
      await logEscrowAction({
        escrowId: escrow.id,
        action: 'DELIVERY_REJECTED',
        performedBy,
        performedByRole: 'buyer',
        reason,
      });
      return res.json({ message: 'Delivery rejected, protection flow initiated' });
    } catch (error: any) {
      console.error('Reject delivery error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Raise dispute (buyer)
  async raiseDispute(req: Request, res: Response) {
    try {
      const { id } = req.params; // escrow id
      const { buyerId, reason, message, evidenceUrls } = req.body;
      const escrow = await prisma.escrow.findUnique({ where: { id: parseInt(id) } });
      if (!escrow) return res.status(404).json({ error: 'Escrow not found' });

      const dispute = await DisputeService.openDispute({
        orderId: escrow.orderId,
        escrowId: escrow.id,
        buyerId: buyerId || escrow.buyerId,
        travelerId: escrow.travelerId || undefined,
        reason,
        message,
        evidenceUrls,
      });

      await logEscrowAction({
        escrowId: escrow.id,
        action: 'DISPUTE_OPENED',
        performedBy: buyerId || escrow.buyerId,
        performedByRole: 'buyer',
        reason,
      });

      res.status(201).json({ message: 'Dispute raised successfully', dispute });
    } catch (error: any) {
      console.error('Raise dispute error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get escrow status
  async getStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
            },
          },
          dispute: true,
        },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      res.json({ escrow });
    } catch (error: any) {
      console.error('Get escrow status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get escrow by orderId
  async getByOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const escrow = await prisma.escrow.findUnique({
        where: { orderId: parseInt(orderId) },
        include: {
          order: { select: { id: true, orderNumber: true, status: true, totalAmount: true } },
        },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found for order' });
      }

      return res.json({ escrow });
    } catch (error: any) {
      console.error('Get escrow by order error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get receipt by orderId
  async getReceiptByOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const receipt = await prisma.purchaseReceipt.findFirst({
        where: { orderId: parseInt(orderId) },
        orderBy: { createdAt: 'desc' },
      });
      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }
      return res.json({ receipt });
    } catch (error: any) {
      console.error('Get receipt by order error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Force release (admin/system override)
   */
  async forceRelease(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { performedBy, reason } = req.body;

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      if (!['HELD', 'DISPUTED'].includes(escrow.status)) {
        return res.status(400).json({ error: 'Escrow is not in releasable status' });
      }

      if (escrow.stripePaymentId) {
        await stripe.paymentIntents.capture(escrow.stripePaymentId);
      }

      const updated = await prisma.escrow.update({
        where: { id: parseInt(id) },
        data: {
          status: 'RELEASED_TO_TRAVELER',
          releasedAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: escrow.orderId },
        data: { status: 'COMPLETED' },
      });

      await logEscrowAction({
        escrowId: updated.id,
        action: 'FORCE_RELEASE',
        performedBy,
        performedByRole: 'admin',
        reason,
      });

      return res.json({ message: 'Escrow forcibly released', escrow: updated });
    } catch (error: any) {
      console.error('Force release error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Force refund (admin/system override)
   */
  async forceRefund(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { performedBy, reason } = req.body;

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      if (!['HELD', 'DISPUTED', 'PENDING'].includes(escrow.status)) {
        return res.status(400).json({ error: 'Escrow is not in refundable status' });
      }

      if (escrow.stripePaymentId) {
        await stripe.paymentIntents.cancel(escrow.stripePaymentId);
      }

      const updated = await prisma.escrow.update({
        where: { id: parseInt(id) },
        data: {
          status: 'REFUNDED_TO_BUYER',
          releasedAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: escrow.orderId },
        data: { status: 'CANCELLED' },
      });

      await logEscrowAction({
        escrowId: updated.id,
        action: 'FORCE_REFUND',
        performedBy,
        performedByRole: 'admin',
        reason,
      });

      return res.json({ message: 'Escrow forcibly refunded', escrow: updated });
    } catch (error: any) {
      console.error('Force refund error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Auto-release check (cron job endpoint)
  async checkAutoRelease(req: Request, res: Response) {
    try {
      const now = new Date();

      // Find escrows ready for auto-release
      const escrows = await prisma.escrow.findMany({
        where: {
          status: 'HELD',
          autoReleaseAt: {
            lte: now,
          },
        },
        include: { order: true },
      });

      const released = [];

      for (const escrow of escrows) {
        // Capture payment
        if (escrow.stripePaymentId) {
          await stripe.paymentIntents.capture(escrow.stripePaymentId);
        }

        // Update escrow
        await prisma.escrow.update({
          where: { id: escrow.id },
          data: {
            status: 'RELEASED_TO_TRAVELER',
            releasedAt: new Date(),
          },
        });

        // Update order
        await prisma.order.update({
          where: { id: escrow.orderId },
          data: { status: 'COMPLETED' },
        });

        released.push(escrow.id);
      }

      res.json({
        message: `Auto-released ${released.length} escrows`,
        escrowIds: released,
      });
    } catch (error: any) {
      console.error('Auto-release error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Open buyer protection request (pauses release)
   */
  async openProtection(req: Request, res: Response) {
    try {
      const { orderId, reason, description } = req.body;
      const buyerId = req.body.buyerId;

      if (!orderId || !reason) {
        return res.status(400).json({ error: 'orderId and reason are required' });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { escrow: true },
      });

      if (!order || !order.escrow) {
        return res.status(404).json({ error: 'Order or escrow not found' });
      }

      if (!['DELIVERED', 'NOT_DELIVERED', 'PAID', 'IN_TRANSIT'].includes(order.status)) {
        return res.status(400).json({ error: 'Protection can only be opened for delivered or undelivered orders' });
      }

      // Create protection request
      const protection = await prisma.protectionRequest.create({
        data: {
          orderId,
          escrowId: order.escrow.id,
          buyerId: buyerId || order.buyerId,
          reason,
          description: description || null,
        },
      });

      // Mark escrow as DISPUTED to pause release
      await prisma.escrow.update({
        where: { id: order.escrow.id },
        data: { status: 'DISPUTED' },
      });

      await logEscrowAction({
        escrowId: order.escrow.id,
        action: 'PROTECTION_OPEN',
        performedBy: buyerId || order.buyerId,
        performedByRole: 'buyer',
        reason,
      });

      return res.status(201).json({ protection });
    } catch (error: any) {
      console.error('Open protection error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Admin approves refund -> refund escrow and resolve request
   */
  async approveProtectionRefund(req: Request, res: Response) {
    try {
      const { id } = req.params; // protection id
      const { performedBy, reason } = req.body;

      const protection = await prisma.protectionRequest.findUnique({
        where: { id: parseInt(id) },
        include: { escrow: true },
      });
      if (!protection) {
        return res.status(404).json({ error: 'Protection request not found' });
      }

      // Refund escrow
      if (protection.escrow.stripePaymentId) {
        await stripe.paymentIntents.cancel(protection.escrow.stripePaymentId);
      }

      await prisma.escrow.update({
        where: { id: protection.escrowId },
        data: { status: 'REFUNDED_TO_BUYER', releasedAt: new Date() },
      });

      await prisma.order.update({
        where: { id: protection.orderId },
        data: { status: 'CANCELLED' },
      });

      await prisma.protectionRequest.update({
        where: { id: protection.id },
        data: { status: 'RESOLVED', updatedAt: new Date() },
      });

      await logEscrowAction({
        escrowId: protection.escrowId,
        action: 'PROTECTION_REFUND',
        performedBy,
        performedByRole: 'admin',
        reason,
      });

      return res.json({ message: 'Refund approved', protectionId: protection.id });
    } catch (error: any) {
      console.error('Approve protection refund error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Admin approves release -> release escrow and resolve request
   */
  async approveProtectionRelease(req: Request, res: Response) {
    try {
      const { id } = req.params; // protection id
      const { performedBy, reason } = req.body;

      const protection = await prisma.protectionRequest.findUnique({
        where: { id: parseInt(id) },
        include: { escrow: true },
      });
      if (!protection) {
        return res.status(404).json({ error: 'Protection request not found' });
      }

      // Capture payment if manual
      if (protection.escrow.stripePaymentId) {
        await stripe.paymentIntents.capture(protection.escrow.stripePaymentId);
      }

      await prisma.escrow.update({
        where: { id: protection.escrowId },
        data: { status: 'RELEASED_TO_TRAVELER', releasedAt: new Date() },
      });

      await prisma.order.update({
        where: { id: protection.orderId },
        data: { status: 'COMPLETED' },
      });

      await prisma.protectionRequest.update({
        where: { id: protection.id },
        data: { status: 'RESOLVED', updatedAt: new Date() },
      });

      await logEscrowAction({
        escrowId: protection.escrowId,
        action: 'PROTECTION_RELEASE',
        performedBy,
        performedByRole: 'admin',
        reason,
      });

      return res.json({ message: 'Release approved', protectionId: protection.id });
    } catch (error: any) {
      console.error('Approve protection release error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Admin rejects protection request (no refund/release)
   */
  async rejectProtection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { performedBy, reason } = req.body;

      const protection = await prisma.protectionRequest.findUnique({
        where: { id: parseInt(id) },
      });
      if (!protection) {
        return res.status(404).json({ error: 'Protection request not found' });
      }

      await prisma.protectionRequest.update({
        where: { id: protection.id },
        data: { status: 'REJECTED', updatedAt: new Date() },
      });

      await logEscrowAction({
        escrowId: protection.escrowId,
        action: 'PROTECTION_REJECT',
        performedBy,
        performedByRole: 'admin',
        reason,
      });

      return res.json({ message: 'Protection request rejected', protectionId: protection.id });
    } catch (error: any) {
      console.error('Reject protection error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
