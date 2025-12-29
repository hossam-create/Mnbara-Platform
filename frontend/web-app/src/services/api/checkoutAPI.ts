import { client } from './client';

export const checkoutAPI = {
  createPaymentIntent: async (amount: number, currency = 'usd') => {
    const response = await client.post('/api/payment/intent', {
      amount,
      currency,
    });
    return response.data;
  },

  confirmPayment: async (paymentIntentId: string) => {
    const response = await client.post('/api/payment/confirm', {
      paymentIntentId,
    });
    return response.data;
  },

  createOrder: async (orderData: any) => {
    const response = await client.post('/api/orders', orderData);
    return response.data;
  },

  getPaymentStatus: async (paymentIntentId: string) => {
    const response = await client.get(`/api/payment/status/${paymentIntentId}`);
    return response.data;
  },
};
