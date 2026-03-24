import { client } from './client';

export const cartAPI = {
  getCart: async () => {
    const response = await client.get('/api/cart');
    return response.data;
  },

  addToCart: async (productId: string, quantity: number) => {
    const response = await client.post('/api/cart/items', {
      productId,
      quantity,
    });
    return response.data;
  },

  removeFromCart: async (productId: string) => {
    const response = await client.delete(`/api/cart/items/${productId}`);
    return response.data;
  },

  updateQuantity: async (productId: string, quantity: number) => {
    const response = await client.put(`/api/cart/items/${productId}`, {
      quantity,
    });
    return response.data;
  },

  clearCart: async () => {
    await client.delete('/api/cart');
  },
};
