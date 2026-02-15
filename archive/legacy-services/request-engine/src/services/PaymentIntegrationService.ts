import axios from 'axios';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
const INTERNAL_LEDGER_SERVICE_URL = process.env.INTERNAL_LEDGER_SERVICE_URL || 'http://localhost:3010';

export interface CreatePaymentIntentRequest {
  requestId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  platformFee: number;
  totalAmount: number;
}

export interface LockFundsRequest {
  userId: string;
  amount: number;
  requestId: string;
  currency: string;
}

export interface ReleaseFundsRequest {
  requestId: string;
  toUserId: string;
}

export interface RefundFundsRequest {
  requestId: string;
}

/**
 * Payment Integration Service
 * Handles integration with payment-service and internal-ledger-service
 */
export class PaymentIntegrationService {
  /**
   * Create Stripe PaymentIntent
   */
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      console.log('[PaymentIntegrationService] Creating payment intent:', request);

      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/payments/stripe/create-intent`,
        request,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[PaymentIntegrationService] Payment intent created:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[PaymentIntegrationService] Failed to create payment intent:', error.message);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Cancel Stripe PaymentIntent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    try {
      console.log('[PaymentIntegrationService] Cancelling payment intent:', paymentIntentId);

      // Stripe automatically cancels uncaptured payment intents after 24 hours
      // We just log this for now - in production, you'd call Stripe API to cancel immediately
      console.log('[PaymentIntegrationService] Payment intent will be auto-cancelled by Stripe');
    } catch (error: any) {
      console.error('[PaymentIntegrationService] Failed to cancel payment intent:', error.message);
      // Don't throw - cancellation failure shouldn't block the request cancellation
    }
  }

  /**
   * Lock funds in internal wallet
   */
  async lockFunds(request: LockFundsRequest): Promise<boolean> {
    try {
      console.log('[PaymentIntegrationService] Locking funds:', request);

      const response = await axios.post(
        `${INTERNAL_LEDGER_SERVICE_URL}/api/wallet/lock-funds`,
        request,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[PaymentIntegrationService] Funds locked successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[PaymentIntegrationService] Failed to lock funds:', error.message);
      return false;
    }
  }

  /**
   * Release funds to seller
   */
  async releaseFunds(request: ReleaseFundsRequest): Promise<boolean> {
    try {
      console.log('[PaymentIntegrationService] Releasing funds:', request);

      const response = await axios.post(
        `${INTERNAL_LEDGER_SERVICE_URL}/api/wallet/release-funds`,
        request,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[PaymentIntegrationService] Funds released successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[PaymentIntegrationService] Failed to release funds:', error.message);
      return false;
    }
  }

  /**
   * Refund funds to buyer
   */
  async refundFunds(request: RefundFundsRequest): Promise<boolean> {
    try {
      console.log('[PaymentIntegrationService] Refunding funds:', request);

      const response = await axios.post(
        `${INTERNAL_LEDGER_SERVICE_URL}/api/wallet/refund-funds`,
        request,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[PaymentIntegrationService] Funds refunded successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[PaymentIntegrationService] Failed to refund funds:', error.message);
      return false;
    }
  }

  /**
   * Create Stripe refund
   */
  async createStripeRefund(paymentIntentId: string, amount?: number): Promise<boolean> {
    try {
      console.log('[PaymentIntegrationService] Creating Stripe refund:', { paymentIntentId, amount });

      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/payments/stripe/refund`,
        {
          paymentIntentId,
          amount,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[PaymentIntegrationService] Stripe refund created successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[PaymentIntegrationService] Failed to create Stripe refund:', error.message);
      return false;
    }
  }

  /**
   * Deduct platform fee
   */
  async deductPlatformFee(userId: string, amount: number, requestId: string): Promise<boolean> {
    try {
      console.log('[PaymentIntegrationService] Deducting platform fee:', { userId, amount, requestId });

      const response = await axios.post(
        `${INTERNAL_LEDGER_SERVICE_URL}/api/wallet/deduct-fee`,
        {
          userId,
          amount,
          requestId,
          currency: 'USD',
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[PaymentIntegrationService] Platform fee deducted successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[PaymentIntegrationService] Failed to deduct platform fee:', error.message);
      return false;
    }
  }
}
