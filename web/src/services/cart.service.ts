import { apiClient } from './api.service';
import type { Cart, CartItem, CartResponse } from '../types/cart.types';

export class CartService {
  private static CART_ENDPOINT = '/api/cart';

  static async getCart(): Promise<Cart> {
    const response = await apiClient.get<CartResponse>(this.CART_ENDPOINT);
    return response.data.cart;
  }

  static async addToCart(item: Omit<CartItem, 'quantity'>): Promise<Cart> {
    const response = await apiClient.post<CartResponse>(this.CART_ENDPOINT, {
      item: { ...item, quantity: 1 },
    });
    return response.data.cart;
  }

  static async updateCartItem(
    itemId: string,
    quantity: number
  ): Promise<Cart> {
    const response = await apiClient.patch<CartResponse>(
      `${this.CART_ENDPOINT}/${itemId}`,
      { quantity }
    );
    return response.data.cart;
  }

  static async removeFromCart(itemId: string): Promise<Cart> {
    const response = await apiClient.delete<CartResponse>(
      `${this.CART_ENDPOINT}/${itemId}`
    );
    return response.data.cart;
  }

  static async syncCart(localCart: Cart): Promise<Cart> {
    const response = await apiClient.post<CartResponse>(
      `${this.CART_ENDPOINT}/sync`,
      { cart: localCart }
    );
    return response.data.cart;
  }
}
