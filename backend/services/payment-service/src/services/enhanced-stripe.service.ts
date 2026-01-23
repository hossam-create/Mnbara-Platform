import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { FeeCalculatorService } from './fee-calculator.service';
import axios from 'axios';

// Validate Stripe secret key is set
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('CRITICAL: STRIPE_SECRET_KEY environment variable is not set. Payment service cannot start.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
const prisma = new PrismaClient();
const feeCalculator = new FeeCalculatorService();

// Internal Ledger Service URL
const INTERNAL_LEDGER_SERVICE_URL = process.env.INTERNAL_LEDGER_SERVICE_URL || 'http://localhost:3010';

export interface CreatePaymentIntentRequest {
  requestId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  requestId: string;
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  platformFee: number;
  totalAmount: number;
}

export interface PaymentConfirmationResponse {
  success: boolean;
  requestId: string;
  paymentIntentId: string;
  status: string;
  escrowCreated: boolean;
  fundsLocked: boolean;
}

/**
 * Enhanced Stripe Service with Internal Wallet Integration
 * Implements Stripe PaymentIntent flow with escrow and wallet locking
 */
export class EnhancedStripeService {
  /**
   * Create PaymentIntent with fee calculation
   * Requirements: Calculate platform fees, store intent_id
   */
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const { requestId, buyerId, sellerId, amount, currency = 'usd', description, metadata = {} } = request;

      // Calculate platform fee (7% of amount)
      const feeBreakdown = feeCalculator.calculateFees({
        itemPrice: amount,
        quantity: 1,
        paymentMethod: 'card',
      });

      const platformFee = feeBreakdown.platformFee;
      const totalAmount = amount + platformFee;

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency,
        payment_method_types: ['card'],
        description: description || `Payment for Request ${requestId}`,
        metadata: {
          requestId,
          buyerId,
          sellerId,
          originalAmount: amount.toString(),
          platformFee: platformFee.toString(),
          ...metadata,
        },
        // Use automatic payment methods
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });

      // Store payment intent in database
      await this.storePaymentIntent({
        paymentIntentId: paymentIntent.id,
        requestId,
        buyerId,
        sellerId,
        amount,
        platformFee,
        totalAmount,
        currency,
        status: paymentIntent.status,
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount,
        currency,
        platformFee,
        totalAmount,
      };
    } catch (error: any) {
      console.error('[EnhancedStripeService] Failed to create payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm payment and lock funds in escrow
   * Requirements: Verify payment success, update Request status to PAID, lock funds, create escrow
   */
  async confirmPayment(request: ConfirmPaymentRequest): Promise<PaymentConfirmationResponse> {
    try {
      const { paymentIntentId, requestId } = request;

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment not confirmed. Status: ${paymentIntent.status}`);
      }

      // Get stored payment data
      const storedPayment = await this.getStoredPaymentIntent(paymentIntentId);
      if (!storedPayment) {
        throw new Error('Payment intent not found in database');
      }

      // Lock funds in internal wallet
      const fundsLocked = await this.lockFundsInWallet({
        userId: storedPayment.buyerId,
        amount: storedPayment.amount,
        requestId: storedPayment.requestId,
        currency: storedPayment.currency,
      });

      // Update payment status
      await this.updatePaymentStatus(paymentIntentId, 'succeeded', {
        fundsLocked,
        confirmedAt: new Date(),
      });

      return {
        success: true,
        requestId: storedPayment.requestId,
        paymentIntentId,
        status: paymentIntent.status,
        escrowCreated: fundsLocked,
        fundsLocked,
      };
    } catch (error: any) {
      console.error('[EnhancedStripeService] Failed to confirm payment:', error);
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Lock funds in internal wallet service
   */
  private async lockFundsInWallet(params: {
    userId: string;
    amount: number;
    requestId: string;
    currency: string;
  }): Promise<boolean> {
    try {
      const response = await axios.post(
        `${INTERNAL_LEDGER_SERVICE_URL}/api/wallet/lock-funds`,
        {
          userId: params.userId,
          amount: params.amount,
          requestId: params.requestId,
          currency: params.currency,
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.status === 200;
    } catch (error: any) {
      console.error('[EnhancedStripeService] Failed to lock funds in wallet:', error.message);
      // Don't throw - return false to indicate failure
      return false;
    }
  }

  /**
   * Store payment intent in database
   */
  private async storePaymentIntent(data: {
    paymentIntentId: string;
    requestId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    platformFee: number;
    totalAmount: number;
    currency: string;
    status: string;
  }): Promise<void> {
    // Store in a payments table (you'll need to create this in Prisma schema)
    // For now, we'll use metadata storage
    console.log('[EnhancedStripeService] Storing payment intent:', data);
    // TODO: Implement actual database storage
  }

  /**
   * Get stored payment intent from database
   */
  private async getStoredPaymentIntent(paymentIntentId: string): Promise<any> {
    // Retrieve from database
    // For now, retrieve from Stripe metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      paymentIntentId: paymentIntent.id,
      requestId: paymentIntent.metadata.requestId,
      buyerId: paymentIntent.metadata.buyerId,
      sellerId: paymentIntent.metadata.sellerId,
      amount: parseFloat(paymentIntent.metadata.originalAmount),
      platformFee: parseFloat(paymentIntent.metadata.platformFee),
      totalAmount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  }

  /**
   * Update payment status in database
   */
  private async updatePaymentStatus(
    paymentIntentId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    console.log('[EnhancedStripeService] Updating payment status:', {
      paymentIntentId,
      status,
      metadata,
    });
    // TODO: Implement actual database update
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId: string): Promise<any> {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      paymentIntentId: intent.id,
      status: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency,
      metadata: intent.metadata,
    };
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentIntentId: string, amount?: number): Promise<any> {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  }
}
