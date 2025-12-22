// ============================================
// 💳 Payment Gateway Service
// ============================================

import api from './api';
import type { ApiResponse } from '../types';

interface StripePaymentResult {
  error?: { message?: string };
}

interface StripeClient {
  confirmCardPayment(
    clientSecret: string,
    data: { payment_method: unknown }
  ): Promise<StripePaymentResult>;
}

const ensureApiResponse = <T>(response: ApiResponse<T>, context: string): T => {
  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error(response.message || `Failed to ${context}`);
  }
  return response.data;
};

// Payment Provider Types
export type PaymentProvider = 'stripe' | 'paypal' | 'paymob' | 'fawry' | 'vodafone_cash';

export interface PaymentIntent {
  id: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  metadata?: Record<string, unknown>;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentMethodData {
  type: 'card' | 'bank_transfer' | 'mobile_wallet';
  card?: {
    number: string;
    expMonth: number;
    expYear: number;
    cvc: string;
    name: string;
  };
  mobileWallet?: {
    provider: 'vodafone_cash' | 'orange_money' | 'etisalat_cash';
    phoneNumber: string;
  };
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund
  reason?: string;
}

// ============================================
// 💳 Stripe Integration
// ============================================

class StripeService {
  private stripe: StripeClient | null = null;

  async init(publishableKey: string): Promise<void> {
    if (typeof window !== 'undefined' && !this.stripe) {
      const stripeFactory = (window as typeof window & {
        Stripe?: (publishableKey: string) => unknown;
      }).Stripe;
      if (stripeFactory) {
        const instance = stripeFactory(publishableKey);
        this.stripe = {
          confirmCardPayment: (clientSecret: string, data: { payment_method: unknown }) =>
            (instance as StripeClient).confirmCardPayment(clientSecret, data),
        };
      }
    }
  }

  async createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent> {
    const response = await api.post<ApiResponse<PaymentIntent>>('/payments/stripe/intent', {
      amount,
      currency,
    });
    return ensureApiResponse(response.data, 'create Stripe payment intent');
  }

  async confirmPayment(clientSecret: string, paymentMethod: unknown): Promise<{ success: boolean; error?: string }> {
    if (!this.stripe) {
      return { success: false, error: 'Stripe not initialized' };
    }
    
    const result = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true };
  }

  getStripe(): unknown {
    return this.stripe;
  }
}

export const stripeService = new StripeService();

// ============================================
// 🅿️ PayPal Integration
// ============================================

class PayPalService {
  private paypal: unknown = null;

  async init(clientId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      // Load PayPal SDK
      await this.loadScript(clientId);
    }
  }

  private loadScript(clientId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('#paypal-sdk')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.onload = () => {
        const win = window as typeof window & { paypal?: unknown };
        this.paypal = win.paypal;
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async createOrder(amount: number): Promise<string> {
    const response = await api.post<ApiResponse<{ orderId: string }>>('/payments/paypal/order', {
      amount,
    });
    return ensureApiResponse(response.data, 'create PayPal order').orderId;
  }

  async captureOrder(orderId: string): Promise<{ success: boolean; transactionId?: string }> {
    const response = await api.post<ApiResponse<{ transactionId: string }>>('/payments/paypal/capture', {
      orderId,
    });
    const data = ensureApiResponse(response.data, 'capture PayPal order');
    return { success: true, transactionId: data.transactionId };
  }

  getPayPal(): unknown {
    return this.paypal;
  }
}

export const paypalService = new PayPalService();

// ============================================
// 📱 Paymob Integration (Egypt)
// ============================================

class PaymobService {
  async createPaymentIntent(
    amount: number,
    integrationId: string,
    billingData: Record<string, string>
  ): Promise<{ iframeUrl: string; orderId: string }> {
    const response = await api.post<ApiResponse<{ iframeUrl: string; orderId: string }>>('/payments/paymob/intent', {
      amount,
      integrationId,
      billingData,
    });
    return response.data.data!;
  }

  async verifyCallback(hmac: string, data: Record<string, unknown>): Promise<boolean> {
    const response = await api.post<ApiResponse<{ valid: boolean }>>('/payments/paymob/verify', {
      hmac,
      data,
    });
    return response.data.data?.valid || false;
  }
}

export const paymobService = new PaymobService();

// ============================================
// 📲 Mobile Wallet Integration
// ============================================

class MobileWalletService {
  async initiatePayment(
    provider: 'vodafone_cash' | 'orange_money' | 'etisalat_cash',
    phoneNumber: string,
    amount: number
  ): Promise<{ reference: string; status: string }> {
    const response = await api.post<ApiResponse<{ reference: string; status: string }>>('/payments/mobile-wallet/initiate', {
      provider,
      phoneNumber,
      amount,
    });
    return response.data.data!;
  }

  async checkStatus(reference: string): Promise<PaymentStatus> {
    const response = await api.get<ApiResponse<{ status: PaymentStatus }>>(`/payments/mobile-wallet/status/${reference}`);
    return response.data.data?.status || 'pending';
  }
}

export const mobileWalletService = new MobileWalletService();

// ============================================
// 🏦 Unified Payment API
// ============================================

export const paymentApi = {
  // Create payment
  createPayment: (
    amount: number,
    currency: string,
    provider: PaymentProvider,
    orderId?: string
  ) => api.post<ApiResponse<PaymentIntent>>('/payments/create', {
    amount,
    currency,
    provider,
    orderId,
  }),

  // Get payment status
  getPayment: (paymentId: string) =>
    api.get<ApiResponse<PaymentIntent>>(`/payments/${paymentId}`),

  // Refund payment
  refundPayment: (data: RefundRequest) =>
    api.post<ApiResponse<{ refundId: string }>>('/payments/refund', data),

  // Get payment history
  getPaymentHistory: (page = 1, limit = 20) =>
    api.get<ApiResponse<{ payments: PaymentIntent[]; total: number }>>('/payments/history', {
      params: { page, limit },
    }),

  // Webhook verification
  verifyWebhook: (provider: PaymentProvider, data: unknown) =>
    api.post<ApiResponse<{ valid: boolean }>>(`/payments/webhook/${provider}/verify`, data),
};

export default paymentApi;
