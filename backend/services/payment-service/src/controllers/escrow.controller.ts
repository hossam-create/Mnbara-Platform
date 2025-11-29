import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class EscrowController {
  // Create escrow for an order
  async createEscrow(req: Request, res: Response) {
    try {
      const { orderId } = req.body;

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { buyer: true, traveler: true },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'MATCHED') {
        return res.status(400).json({ error: 'Order must be in MATCHED status' });
      }

      // Check if escrow already exists
      const existingEscrow = await prisma.escrow.findUnique({
        where: { orderId },
      });

      if (existingEscrow) {
        return res.status(400).json({ error: 'Escrow already exists for this order' });
      }

      // Create Stripe PaymentIntent (hold, don't capture)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(order.totalAmount) * 100), // Convert to cents
        currency: order.currency.toLowerCase(),
        capture_method: 'manual', // Hold payment
        metadata: {
          orderId: order.id.toString(),
          orderNumber: order.orderNumber,
        },
      });

      // Create escrow record
      const escrow = await prisma.escrow.create({
        data: {
          orderId,
          amount: order.totalAmount,
          currency: order.currency,
          stripePaymentId: paymentIntent.id,
          status: 'PENDING',
          autoReleaseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      res.status(201).json({
        message: 'Escrow created successfully',
        escrow,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error('Create escrow error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Hold payment (buyer pays)
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

      if (escrow.status !== 'PENDING') {
        return res.status(400).json({ error: 'Escrow is not in PENDING status' });
      }

      // Confirm PaymentIntent (hold the money)
      if (escrow.stripePaymentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(escrow.stripePaymentId);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ error: 'Payment not completed by buyer' });
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

      res.json({
        message: 'Payment held in escrow',
        escrow: updated,
      });
    } catch (error: any) {
      console.error('Hold payment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Release payment to traveler
  async releasePayment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
        include: { order: true },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      if (escrow.status !== 'HELD') {
        return res.status(400).json({ error: 'Escrow is not in HELD status' });
      }

      // Capture the payment (release to traveler)
      if (escrow.stripePaymentId) {
        await stripe.paymentIntents.capture(escrow.stripePaymentId);
      }

      // Update escrow status
      const updated = await prisma.escrow.update({
        where: { id: parseInt(id) },
        data: {
          status: 'RELEASED_TO_TRAVELER',
          releasedAt: new Date(),
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: escrow.orderId },
        data: { status: 'COMPLETED' },
      });

      res.json({
        message: 'Payment released to traveler',
        escrow: updated,
      });
    } catch (error: any) {
      console.error('Release payment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Refund payment to buyer
  async refundPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
        include: { order: true },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      if (escrow.status !== 'HELD' && escrow.status !== 'DISPUTED') {
        return res.status(400).json({ error: 'Cannot refund escrow in current status' });
      }

      // Cancel PaymentIntent (refund to buyer)
      if (escrow.stripePaymentId) {
        await stripe.paymentIntents.cancel(escrow.stripePaymentId);
      }

      // Update escrow status
      const updated = await prisma.escrow.update({
        where: { id: parseInt(id) },
        data: {
          status: 'REFUNDED_TO_BUYER',
          releasedAt: new Date(),
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: escrow.orderId },
        data: { status: 'CANCELLED' },
      });

      res.json({
        message: 'Payment refunded to buyer',
        escrow: updated,
        reason,
      });
    } catch (error: any) {
      console.error('Refund payment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Raise dispute
  async raiseDispute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { raisedBy, reason, evidence } = req.body;

      const escrow = await prisma.escrow.findUnique({
        where: { id: parseInt(id) },
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      if (escrow.status !== 'HELD') {
        return res.status(400).json({ error: 'Can only dispute HELD escrow' });
      }

      // Create dispute
      const dispute = await prisma.dispute.create({
        data: {
          escrowId: escrow.id,
          raisedBy,
          reason,
          evidence: evidence || [],
          status: 'OPEN',
        },
      });

      // Update escrow status
      await prisma.escrow.update({
        where: { id: parseInt(id) },
        data: {
          status: 'DISPUTED',
          disputeId: dispute.id,
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: escrow.orderId },
        data: { status: 'DISPUTED' },
      });

      res.status(201).json({
        message: 'Dispute raised successfully',
        dispute,
      });
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
}
