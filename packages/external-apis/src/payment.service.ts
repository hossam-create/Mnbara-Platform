/**
 * Payment & Currency Service
 * Integrates Stripe, PayPal, Wise, Exchange Rate APIs
 */

import { BaseApiClient } from './base-client';
import { config } from './config';
import { ApiResponse, PaymentIntent, ExchangeRate } from './types';

export class PaymentService extends BaseApiClient {
  private provider: 'stripe' | 'paypal' | 'wise';

  constructor(provider: 'stripe' | 'paypal' | 'wise' = 'stripe') {
    const providerConfig = config.getServiceConfig(provider);
    
    if (!providerConfig) {
      throw new Error(`Payment provider ${provider} not configured`);
    }

    super(`payment-${provider}`, providerConfig);
    this.provider = provider;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<PaymentIntent>> {
    switch (this.provider) {
      case 'stripe':
        return this.createStripePaymentIntent(amount, currency, metadata);
      case 'paypal':
        return this.createPayPalOrder(amount, currency, metadata);
      default:
        throw new Error(`Payment intent not supported for ${this.provider}`);
    }
  }

  async capturePayment(paymentId: string): Promise<ApiResponse<PaymentIntent>> {
    switch (this.provider) {
      case 'stripe':
        return this.captureStripePayment(paymentId);
      case 'paypal':
        return this.capturePayPalOrder(paymentId);
      default:
        throw new Error(`Payment capture not supported for ${this.provider}`);
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<any>> {
    switch (this.provider) {
      case 'stripe':
        return this.refundStripePayment(paymentId, amount);
      case 'paypal':
        return this.refundPayPalPayment(paymentId, amount);
      default:
        throw new Error(`Refund not supported for ${this.provider}`);
    }
  }

  // Stripe implementations
  private async createStripePaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<PaymentIntent>> {
    const response = await this.post<any>('/payment_intents', {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata,
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          id: response.data.id,
          amount: response.data.amount / 100,
          currency: response.data.currency,
          status: response.data.status,
          clientSecret: response.data.client_secret,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<PaymentIntent>;
  }

  private async captureStripePayment(paymentId: string): Promise<ApiResponse<PaymentIntent>> {
    const response = await this.post<any>(`/payment_intents/${paymentId}/capture`);

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          id: response.data.id,
          amount: response.data.amount / 100,
          currency: response.data.currency,
          status: response.data.status,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<PaymentIntent>;
  }

  private async refundStripePayment(paymentId: string, amount?: number): Promise<ApiResponse<any>> {
    const data: any = { payment_intent: paymentId };
    if (amount) {
      data.amount = Math.round(amount * 100);
    }

    return this.post<any>('/refunds', data);
  }

  // PayPal implementations
  private async createPayPalOrder(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<PaymentIntent>> {
    const response = await this.post<any>('/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2),
        },
        custom_id: metadata?.orderId,
      }],
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          id: response.data.id,
          amount,
          currency,
          status: 'pending',
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<PaymentIntent>;
  }

  private async capturePayPalOrder(orderId: string): Promise<ApiResponse<PaymentIntent>> {
    const response = await this.post<any>(`/v2/checkout/orders/${orderId}/capture`);

    if (response.success && response.data) {
      const capture = response.data.purchase_units[0].payments.captures[0];
      return {
        success: true,
        data: {
          id: capture.id,
          amount: parseFloat(capture.amount.value),
          currency: capture.amount.currency_code,
          status: 'succeeded',
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<PaymentIntent>;
  }

  private async refundPayPalPayment(captureId: string, amount?: number): Promise<ApiResponse<any>> {
    const data: any = {};
    if (amount) {
      data.amount = { value: amount.toFixed(2) };
    }

    return this.post<any>(`/v2/payments/captures/${captureId}/refund`, data);
  }
}

export class CurrencyService extends BaseApiClient {
  constructor() {
    const currencyConfig = config.getServiceConfig('exchangeRate');
    
    if (!currencyConfig) {
      throw new Error('Currency service not configured');
    }

    super('currency', currencyConfig);
  }

  async getExchangeRate(from: string, to: string): Promise<ApiResponse<ExchangeRate>> {
    const cacheKey = `exchange:${from}:${to}`;
    
    const response = await this.get<any>(
      `/latest/${from.toUpperCase()}`,
      undefined,
      cacheKey
    );

    if (response.success && response.data?.rates) {
      const rate = response.data.rates[to.toUpperCase()];
      
      if (rate) {
        return {
          success: true,
          data: {
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            rate,
            timestamp: new Date(),
          },
          cached: response.cached,
          timestamp: new Date(),
        };
      }
    }

    return {
      success: false,
      error: {
        code: 'CURRENCY_NOT_FOUND',
        message: `Exchange rate not found for ${from} to ${to}`,
      },
      timestamp: new Date(),
    };
  }

  async convertAmount(amount: number, from: string, to: string): Promise<ApiResponse<number>> {
    const rateResponse = await this.getExchangeRate(from, to);
    
    if (rateResponse.success && rateResponse.data) {
      const converted = amount * rateResponse.data.rate;
      return {
        success: true,
        data: Math.round(converted * 100) / 100,
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      error: rateResponse.error,
      timestamp: new Date(),
    };
  }
}
