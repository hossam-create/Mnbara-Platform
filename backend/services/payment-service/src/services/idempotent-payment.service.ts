/**
 * Enhanced Payment Service
 * Payment gateway integrations with idempotency, retry logic, and error handling
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { PayPalService } from './paypal.service';
import { PaymobService } from './paymob.service';
import { WebhookEventService } from './webhook-event.service';

const prisma = new PrismaClient();

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const IDEMPOTENCY_KEY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface PaymentIntent {
  id: string;
  provider: 'stripe' | 'paypal' | 'paymob';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'paypal' | 'paymob';
  description?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface RefundPaymentInput {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
  idempotencyKey?: string;
}

export interface RetryPaymentInput {
  paymentIntentId: string;
  idempotencyKey?: string;
}

export interface PaymentWithIdempotency {
  success: boolean;
  payment?: PaymentIntent;
  error?: string;
  retryable: boolean;
  attemptCount: number;
}

/**
 * Idempotency Key Manager
 * Ensures that duplicate requests are handled gracefully
 */
class IdempotencyManager {
  private cache: Map<string, { result: any; expiresAt: Date }> = new Map();

  async get(key: string): Promise<{ found: boolean; result: any }> {
    const entry = this.cache.get(key);
    if (entry && new Date() < entry.expiresAt) {
      return { found: true, result: entry.result };
    }
    return { found: false, result: null };
  }

  async set(key: string, result: any, ttlMs: number = IDEMPOTENCY_KEY_TTL_MS): Promise<void> {
    this.cache.set(key, {
      result,
      expiresAt: new Date(Date.now() + ttlMs),
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

const idempotencyManager = new IdempotencyManager();

/**
 * Retry Logic Manager
 * Handles exponential backoff for failed payment operations
 */
class RetryManager {
  private attemptCounts: Map<string, number> = new Map();

  async getAttemptCount(key: string): Promise<number> {
    return this.attemptCounts.get(key) || 0;
  }

  async incrementAttempt(key: string): Promise<number> {
    const count = (this.attemptCounts.get(key) || 0) + 1;
    this.attemptCounts.set(key, count);
    return count;
  }

  async resetAttempts(key: string): Promise<void> {
    this.attemptCounts.delete(key);
  }

  async shouldRetry(key: string): Promise<boolean> {
    return await this.getAttemptCount(key) < MAX_RETRY_ATTEMPTS;
  }

  calculateDelay(attempt: number): number {
    return RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
  }
}

const retryManager = new RetryManager();

/**
 * Enhanced Payment Service
 */
export class IdempotentPaymentService {
  private stripe: Stripe | null = null;
  private paypalService: PayPalService;
  private paymobService: PaymobService;
  private webhookEventService: WebhookEventService;

  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });
    }
    this.paypalService = new PayPalService();
    this.paymobService = new PaymobService();
    this.webhookEventService = new WebhookEventService();
  }

  /**
   * Create payment with idempotency support
   */
  async createPayment(input: CreatePaymentInput): Promise<PaymentWithIdempotency> {
    const { userId, orderId, amount, currency, provider, description, metadata, idempotencyKey } = input;
    
    // Use provided idempotency key or generate one
    const key = idempotencyKey || `${provider}_${orderId}_${Date.now()}`;

    // Check if this request was already processed
    const cached = await idempotencyManager.get(key);
    if (cached.found) {
      return {
        success: cached.result.success,
        payment: cached.result.payment,
        error: cached.result.error,
        retryable: false,
        attemptCount: 0,
      };
    }

    // Increment attempt count
    const attemptCount = await retryManager.incrementAttempt(key);
    const shouldRetry = await retryManager.shouldRetry(key);

    try {
      let payment: PaymentIntent | null = null;

      switch (provider) {
        case 'stripe':
          payment = await this.createStripePayment(userId, orderId, amount, currency, description, metadata);
          break;
        case 'paypal':
          payment = await this.createPayPalPayment(userId, orderId, amount, currency, description);
          break;
        case 'paymob':
          payment = await this.createPaymobPayment(userId, orderId, amount, currency, description, metadata);
          break;
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }

      // Store successful result
      await idempotencyManager.set(key, {
        success: true,
        payment,
      });

      // Reset retry attempts on success
      await retryManager.resetAttempts(key);

      return {
        success: true,
        payment,
        retryable: false,
        attemptCount,
      };
    } catch (error: any) {
      const errorResult = {
        success: false,
        error: error.message,
        retryable: shouldRetry && this.isRetryableError(error),
      };

      // Cache error result temporarily for idempotency
      await idempotencyManager.set(key, errorResult, 60000); // Cache for 1 minute

      return {
        ...errorResult,
        retryable: errorResult.retryable,
        attemptCount,
      };
    }
  }

  /**
   * Refund payment with idempotency
   */
  async refundPayment(input: RefundPaymentInput): Promise<PaymentWithIdempotency> {
    const { paymentIntentId, amount, reason, idempotencyKey } = input;
    
    const key = idempotencyKey || `refund_${paymentIntentId}_${amount || 'full'}`;

    // Check cache
    const cached = await idempotencyManager.get(key);
    if (cached.found) {
      return {
        success: cached.result.success,
        payment: cached.result.payment,
        error: cached.result.error,
        retryable: false,
        attemptCount: 0,
      };
    }

    const attemptCount = await retryManager.incrementAttempt(key);
    const shouldRetry = await retryManager.shouldRetry(key);

    try {
      // Get payment record to determine provider
      const prismaClient = prisma as any;
      const paymentRecord = await prismaClient.paymentRecord.findFirst({
        where: {
          OR: [
            { stripePaymentId: paymentIntentId },
            { paypalOrderId: paymentIntentId },
            { paymobTransactionId: paymentIntentId },
          ],
        },
      });

      if (!paymentRecord) {
        throw new Error('Payment record not found');
      }

      let refundResult: any;

      if (paymentRecord.provider === 'STRIPE' && this.stripe) {
        refundResult = await this.stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason: 'requested_by_customer',
        });
      } else if (paymentRecord.provider === 'PAYPAL') {
        const captureId = paymentRecord.paypalCaptureId || paymentIntentId;
        refundResult = await this.paypalService.refundCapture(captureId, amount, paymentRecord.currency, reason);
      } else if (paymentRecord.provider === 'PAYMOB') {
        const transactionId = parseInt(paymentIntentId);
        refundResult = await this.paymobService.refundTransaction(transactionId, Math.round((amount || Number(paymentRecord.amount)) * 100));
      }

      // Update payment record
      await prismaClient.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: amount,
          refundReason: reason,
        },
      });

      const payment: PaymentIntent = {
        id: paymentIntentId,
        provider: paymentRecord.provider.toLowerCase() as any,
        amount: amount || Number(paymentRecord.amount),
        currency: paymentRecord.currency,
        status: 'refunded',
        createdAt: paymentRecord.createdAt,
        updatedAt: new Date(),
      };

      await idempotencyManager.set(key, {
        success: true,
        payment,
      });

      await retryManager.resetAttempts(key);

      return {
        success: true,
        payment,
        retryable: false,
        attemptCount,
      };
    } catch (error: any) {
      const errorResult = {
        success: false,
        error: error.message,
        retryable: shouldRetry && this.isRetryableError(error),
      };

      await idempotencyManager.set(key, errorResult, 60000);

      return {
        ...errorResult,
        retryable: errorResult.retryable,
        attemptCount,
      };
    }
  }

  /**
   * Retry failed payment
   */
  async retryPayment(input: RetryPaymentInput): Promise<PaymentWithIdempotency> {
    const { paymentIntentId, idempotencyKey } = input;

    const key = idempotencyKey || `retry_${paymentIntentId}`;

    // Get original payment record
    const prismaClient = prisma as any;
    const paymentRecord = await prismaClient.paymentRecord.findFirst({
      where: {
        OR: [
          { stripePaymentId: paymentIntentId },
          { paypalOrderId: paymentIntentId },
          { paymobTransactionId: paymentIntentId },
        ],
      },
    });

    if (!paymentRecord) {
      return {
        success: false,
        error: 'Payment record not found',
        retryable: false,
        attemptCount: 0,
      };
    }

    // Attempt to create a new payment with the same parameters
    return await this.createPayment({
      userId: paymentRecord.userId,
      orderId: paymentRecord.orderId,
      amount: Number(paymentRecord.amount),
      currency: paymentRecord.currency,
      provider: paymentRecord.provider.toLowerCase() as any,
      description: paymentRecord.description || undefined,
      metadata: paymentRecord.metadata as Record<string, any>,
      idempotencyKey: key,
    });
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent | null> {
    const prismaClient = prisma as any;
    const paymentRecord = await prismaClient.paymentRecord.findFirst({
      where: {
        OR: [
          { stripePaymentId: paymentIntentId },
          { paypalOrderId: paymentIntentId },
          { paypalCaptureId: paymentIntentId },
          { paymobTransactionId: paymentIntentId },
        ],
      },
    });

    if (!paymentRecord) {
      return null;
    }

    return {
      id: paymentIntentId,
      provider: paymentRecord.provider.toLowerCase() as 'stripe' | 'paypal' | 'paymob',
      amount: Number(paymentRecord.amount),
      currency: paymentRecord.currency,
      status: paymentRecord.status.toLowerCase() as any,
      metadata: paymentRecord.metadata as Record<string, any>,
      createdAt: paymentRecord.createdAt,
      updatedAt: paymentRecord.updatedAt,
    };
  }

  /**
   * Process webhook event with idempotency
   */
  async processWebhookEvent(
    provider: 'stripe' | 'paypal' | 'paymob',
    eventId: string,
    payload: any
  ): Promise<{ success: boolean; action?: string; error?: string }> {
    const key = `webhook_${provider}_${eventId}`;

    // Check if webhook was already processed
    const cached = await idempotencyManager.get(key);
    if (cached.found) {
      return cached.result;
    }

    try {
      let result: { success: boolean; action?: string };

      switch (provider) {
        case 'stripe':
          result = await WebhookEventService.processStripeEvent(payload);
          break;
        case 'paypal':
          result = await WebhookEventService.processPayPalEvent(payload);
          break;
        case 'paymob':
          const hmacValid = this.paymobService.verifyWebhookSignature(payload, payload.hmac);
          result = await WebhookEventService.processPaymobEvent(payload, hmacValid);
          break;
      }

      await idempotencyManager.set(key, result);
      return result;
    } catch (error: any) {
      const errorResult = { success: false, error: error.message };
      await idempotencyManager.set(key, errorResult, 60000);
      return errorResult;
    }
  }

  /**
   * Create Stripe payment
   */
  private async createStripePayment(
    userId: string,
    orderId: string,
    amount: number,
    currency: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      description: description || `Order ${orderId}`,
      metadata: {
        orderId,
        userId,
        ...metadata,
      },
    });

    // Create payment record
    const prismaClient = prisma as any;
    await prismaClient.paymentRecord.create({
      data: {
        userId,
        orderId,
        provider: 'STRIPE',
        stripePaymentId: paymentIntent.id,
        amount,
        currency: currency.toUpperCase(),
        status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
        description,
        metadata: metadata || {},
      },
    });

    return {
      id: paymentIntent.id,
      provider: 'stripe',
      amount,
      currency,
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create PayPal payment
   */
  private async createPayPalPayment(
    userId: string,
    orderId: string,
    amount: number,
    currency: string,
    description?: string
  ): Promise<PaymentIntent> {
    const order = await this.paypalService.createOrder(amount, currency, description, { orderId, userId });

    // Create payment record
    const prismaClient = prisma as any;
    await prismaClient.paymentRecord.create({
      data: {
        userId,
        orderId,
        provider: 'PAYPAL',
        paypalOrderId: order.id,
        amount,
        currency: currency.toUpperCase(),
        status: 'PENDING',
        description,
        metadata: { orderId, userId },
      },
    });

    return {
      id: order.id,
      provider: 'paypal',
      amount,
      currency,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create Paymob payment
   */
  private async createPaymobPayment(
    userId: string,
    orderId: string,
    amount: number,
    currency: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    // Create order in Paymob
    const order = await this.paymobService.createOrder(
      Math.round(amount * 100),
      currency,
      orderId
    );

    // Create payment record
    const prismaClient = prisma as any;
    await prismaClient.paymentRecord.create({
      data: {
        userId,
        orderId,
        provider: 'PAYMOB',
        paymobTransactionId: order.id.toString(),
        amount,
        currency: currency.toUpperCase(),
        status: 'PENDING',
        description,
        metadata: { orderId, userId, ...metadata },
      },
    });

    return {
      id: order.id.toString(),
      provider: 'paymob',
      amount,
      currency,
      status: 'pending',
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors, timeout errors, rate limiting
    const retryablePatterns = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'rate limit',
      'too many requests',
      'temporarily unavailable',
      'service unavailable',
      'internal server error',
      'gateway timeout',
    ];

    return retryablePatterns.some(pattern => 
      error.message?.toLowerCase().includes(pattern.toLowerCase()) ||
      error.code?.includes(pattern)
    );
  }
}

export const idempotentPaymentService = new IdempotentPaymentService();
