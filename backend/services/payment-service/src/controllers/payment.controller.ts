import { Request, Response } from 'express';
import { StripeService } from '../services/stripe.service';

const stripeService = new StripeService();

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const { amount, currency, metadata } = req.body;
      const paymentIntent = await stripeService.createPaymentIntent(amount, currency, metadata);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }

  async confirmPayment(req: Request, res: Response) {
    try {
      const { paymentIntentId } = req.body;
      const payment = await stripeService.confirmPayment(paymentIntentId);
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to confirm payment' });
    }
  }

  async createOrder(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { items, paymentIntentId } = req.body;
      
      const order = await stripeService.createOrder(userId, items, paymentIntentId);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create order' });
    }
  }

  async refundPayment(req: Request, res: Response) {
    try {
      const { paymentIntentId, amount } = req.body;
      const refund = await stripeService.refundPayment(paymentIntentId, amount);
      res.json(refund);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process refund' });
    }
  }

  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentIntentId } = req.params;
      const status = await stripeService.getPaymentStatus(paymentIntentId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get payment status' });
    }
  }
}
