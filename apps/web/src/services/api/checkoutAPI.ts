import { apiService } from '../api.service';

export const checkoutAPI = {
  /**
   * Create escrow payment intent via backend only
   * Backend creates the payment intent and returns client secret
   */
  createPaymentIntent: async (data: {
    amount: number
    currency?: string
    orderId: string
    buyerId: string
    sellerId: string
    provider?: 'stripe' | 'paymob'
    paymentMethod?: 'card' | 'bank_transfer' | 'wallet'
    metadata?: Record<string, any>
  }) => {
    const response = await apiService.payment.createIntent(data);
    return response.data;
  },

  /**
   * Get payment status with backend confirmation
   * Never trust frontend redirect success alone
   */
  getPaymentStatus: async (orderId: string) => {
    const response = await apiService.payment.getStatus(orderId);
    return response.data;
  },

  /**
   * Poll payment status until final state (success/failed/cancelled)
   * This ensures we always get the authoritative backend status
   */
  pollPaymentStatus: async (orderId: string, maxAttempts = 30, intervalMs = 2000) => {
    return apiService.payment.pollStatus(orderId, maxAttempts, intervalMs);
  },

  /**
   * Confirm payment capture to escrow
   * Backend handles the actual payment confirmation
   */
  confirmPayment: async (data: {
    orderId: string
    paymentIntentId: string
    provider: string
  }) => {
    const response = await apiService.payment.confirmPayment(data);
    return response.data;
  },

  /**
   * Get available payment providers
   */
  getPaymentProviders: async (currency?: string) => {
    const response = await apiService.payment.getProviders(currency);
    return response.data;
  },

  /**
   * Create order after successful payment
   * @deprecated Use escrow payment flow instead
   */
  createOrder: async (orderData: any) => {
    // This is legacy - should be replaced with escrow payment flow
    const response = await apiService.post('/api/orders', orderData);
    return response.data;
  },
};
