import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PaymentService } from '../services/PaymentService';
import { EmailService } from '../services/EmailService';

export class PaymentController {
  private stripe: Stripe;
  private paymentService: PaymentService;
  private emailService: EmailService;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
    this.paymentService = new PaymentService();
    this.emailService = new EmailService();
  }

  /**
   * Create a payment intent for marketplace purchase
   */
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const { listingId, quantity, buyerId, shippingAddress } = req.body;

      // Validate input
      if (!listingId || !quantity || !buyerId || !shippingAddress) {
        return res.status(400).json({
          error: 'Missing required fields: listingId, quantity, buyerId, shippingAddress'
        });
      }

      // Get listing details
      const listing = await this.paymentService.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      if (listing.status !== 'active') {
        return res.status(400).json({ error: 'Listing is not available' });
      }

      // Calculate amounts
      const itemTotal = listing.price_cents * quantity;
      const marketplaceFee = Math.ceil(itemTotal * 0.05); // 5% fee
      const totalAmount = itemTotal + marketplaceFee;

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'usd',
        metadata: {
          listingId,
          buyerId,
          quantity: quantity.toString(),
          marketplaceFee: marketplaceFee.toString(),
          itemTotal: itemTotal.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Store payment record
      await this.paymentService.createPaymentRecord({
        stripePaymentIntentId: paymentIntent.id,
        buyerId,
        sellerId: listing.seller_id,
        listingId,
        amountCents: itemTotal,
        marketplaceFeeCents: marketplaceFee,
        sellerAmountCents: itemTotal - marketplaceFee,
        status: 'pending',
        currency: 'usd',
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: itemTotal / 100,
        fee: marketplaceFee / 100,
        total: totalAmount / 100,
      });

    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }

  /**
   * Confirm payment and create order
   */
  async confirmPayment(req: Request, res: Response) {
    try {
      const { paymentIntentId, listingId, buyerId } = req.body;

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          error: 'Payment not successful',
          status: paymentIntent.status
        });
      }

      // Create order
      const order = await this.paymentService.createOrder({
        paymentIntentId,
        listingId,
        buyerId,
        quantity: parseInt(paymentIntent.metadata.quantity),
        unitPriceCents: parseInt(paymentIntent.metadata.itemTotal),
        totalAmountCents: paymentIntent.amount,
        shippingAddress: req.body.shippingAddress,
      });

      // Update payment record
      await this.paymentService.updatePaymentStatus(paymentIntentId, 'succeeded', {
        orderId: order.id,
        stripeFeeCents: paymentIntent.application_fee_amount || 0,
        netAmountCents: paymentIntent.amount - (paymentIntent.application_fee_amount || 0),
      });

      // Send receipt email
      await this.emailService.sendPaymentReceipt({
        buyerEmail: req.body.buyerEmail,
        orderId: order.id,
        amount: paymentIntent.amount / 100,
        listingTitle: req.body.listingTitle,
      });

      res.json({
        success: true,
        orderId: order.id,
        redirectUrl: `/payment/success?payment_intent=${paymentIntentId}`,
      });

    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({ error: 'Failed to confirm payment' });
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentIntentId } = req.params;

      const payment = await this.paymentService.getPaymentByIntentId(paymentIntentId);
      
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json({
        status: payment.status,
        orderId: payment.order_id,
        error: payment.error_message,
      });

    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ error: 'Failed to get payment status' });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send('Webhook signature verification failed');
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle successful payment webhook
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      // Update payment status
      await this.paymentService.updatePaymentStatus(paymentIntent.id, 'succeeded', {
        completedAt: new Date(),
      });

      // Create transaction records
      await this.paymentService.createTransactions({
        paymentIntentId: paymentIntent.id,
        itemTotal: parseInt(paymentIntent.metadata.itemTotal),
        marketplaceFee: parseInt(paymentIntent.metadata.marketplaceFee),
        buyerId: paymentIntent.metadata.buyerId,
        sellerId: paymentIntent.metadata.sellerId,
      });

      console.log(`Payment succeeded: ${paymentIntent.id}`);

    } catch (error) {
      console.error('Handle payment succeeded error:', error);
    }
  }

  /**
   * Handle failed payment webhook
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      await this.paymentService.updatePaymentStatus(paymentIntent.id, 'failed', {
        errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
      });

      console.log(`Payment failed: ${paymentIntent.id}`);

    } catch (error) {
      console.error('Handle payment failed error:', error);
    }
  }

  /**
   * Handle canceled payment webhook
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    try {
      await this.paymentService.updatePaymentStatus(paymentIntent.id, 'canceled');

      console.log(`Payment canceled: ${paymentIntent.id}`);

    } catch (error) {
      console.error('Handle payment canceled error:', error);
    }
  }
}
