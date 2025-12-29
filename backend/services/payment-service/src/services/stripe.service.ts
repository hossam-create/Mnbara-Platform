import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

// Validate Stripe secret key is set
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('CRITICAL: STRIPE_SECRET_KEY environment variable is not set. Payment service cannot start.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
const prisma = new PrismaClient();

export class StripeService {
  async createPaymentIntent(amount: number, currency = 'usd', metadata: any = {}) {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ['card'],
      metadata,
    });
  }

  async confirmPayment(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createOrder(userId: string, items: any[], paymentIntentId: string) {
    const paymentIntent = await this.confirmPayment(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not confirmed');
    }

    const order = await prisma.order.create({
      data: {
        userId,
        items,
        totalAmount: paymentIntent.amount / 100,
        paymentIntentId,
        status: 'confirmed',
      },
    });

    return order;
  }

  async refundPayment(paymentIntentId: string, amount?: number) {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  }

  async getPaymentStatus(paymentIntentId: string) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency,
    };
  }
}
