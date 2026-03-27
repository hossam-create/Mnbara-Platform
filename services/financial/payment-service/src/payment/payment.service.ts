import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder',
      { apiVersion: '2023-10-16' as any },
    );
  }

  async createPaymentIntent(amount: number, currency: string, metadata?: any) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency || 'usd',
        metadata,
      });
      this.logger.log(`PaymentIntent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to confirm payment', error);
      throw error;
    }
  }

  async createOrder(userId: string, items: any[], paymentIntentId: string) {
    const order = await this.prisma.order.create({
      data: {
        buyerId: userId,
        status: 'PENDING',
        totalAmount: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        paymentIntentId,
      } as any,
    });
    this.logger.log(`Order created: ${order.id}`);
    return order;
  }

  async refundPayment(paymentIntentId: string, amount?: number) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        ...(amount && { amount: Math.round(amount * 100) }),
      });
      return refund;
    } catch (error) {
      this.logger.error('Failed to process refund', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      this.logger.error('Failed to get payment status', error);
      throw error;
    }
  }
}
