import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const CART_URL = 'http://localhost:3002';
const PAYMENT_URL = 'http://localhost:3003';

describe('MVP Integration Tests', () => {
  let productId: string;
  let userId = 'test-user-123';

  beforeAll(async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('Product Service', () => {
    it('should get list of products', async () => {
      const response = await axios.get(`${BASE_URL}/api/products`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Save first product ID for later tests
      productId = response.data[0].id;
    });

    it('should get single product by ID', async () => {
      const response = await axios.get(`${BASE_URL}/api/products/${productId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(productId);
      expect(response.data.title).toBeDefined();
      expect(response.data.price).toBeDefined();
    });

    it('should search products', async () => {
      const response = await axios.get(`${BASE_URL}/api/products/search`, {
        params: { q: 'iPhone' }
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await axios.get(`${BASE_URL}/api/products/category/Electronics`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Cart Service', () => {
    it('should get empty cart', async () => {
      const response = await axios.get(`${CART_URL}/api/cart/${userId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.items).toBeDefined();
    });

    it('should add item to cart', async () => {
      const response = await axios.post(`${CART_URL}/api/cart/${userId}/add`, {
        productId: productId,
        quantity: 2,
        price: 999.99
      });
      
      expect(response.status).toBe(200);
      expect(response.data.items.length).toBeGreaterThan(0);
    });

    it('should update cart item quantity', async () => {
      const response = await axios.put(`${CART_URL}/api/cart/${userId}/update`, {
        productId: productId,
        quantity: 3
      });
      
      expect(response.status).toBe(200);
    });

    it('should get cart with items', async () => {
      const response = await axios.get(`${CART_URL}/api/cart/${userId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.items.length).toBeGreaterThan(0);
      expect(response.data.total).toBeGreaterThan(0);
    });

    it('should remove item from cart', async () => {
      const response = await axios.delete(`${CART_URL}/api/cart/${userId}/remove/${productId}`);
      
      expect(response.status).toBe(200);
    });

    it('should clear cart', async () => {
      // Add item first
      await axios.post(`${CART_URL}/api/cart/${userId}/add`, {
        productId: productId,
        quantity: 1,
        price: 999.99
      });

      // Clear cart
      const response = await axios.delete(`${CART_URL}/api/cart/${userId}/clear`);
      
      expect(response.status).toBe(200);
      
      // Verify cart is empty
      const cartResponse = await axios.get(`${CART_URL}/api/cart/${userId}`);
      expect(cartResponse.data.items.length).toBe(0);
    });
  });

  describe('Payment Service', () => {
    it('should create payment intent', async () => {
      const response = await axios.post(`${PAYMENT_URL}/api/payments/create-intent`, {
        amount: 999.99,
        currency: 'usd',
        metadata: {
          userId: userId,
          productId: productId
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.clientSecret).toBeDefined();
      expect(response.data.paymentIntentId).toBeDefined();
    });

    it('should get payment status', async () => {
      // Create payment intent first
      const createResponse = await axios.post(`${PAYMENT_URL}/api/payments/create-intent`, {
        amount: 100.00,
        currency: 'usd'
      });

      const paymentIntentId = createResponse.data.paymentIntentId;

      // Get status
      const response = await axios.get(`${PAYMENT_URL}/api/payments/status/${paymentIntentId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBeDefined();
      expect(response.data.amount).toBe(100);
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete full purchase flow', async () => {
      // 1. Get products
      const productsResponse = await axios.get(`${BASE_URL}/api/products`);
      expect(productsResponse.status).toBe(200);
      const product = productsResponse.data[0];

      // 2. Add to cart
      const cartResponse = await axios.post(`${CART_URL}/api/cart/${userId}/add`, {
        productId: product.id,
        quantity: 1,
        price: product.price
      });
      expect(cartResponse.status).toBe(200);

      // 3. Get cart total
      const cartGetResponse = await axios.get(`${CART_URL}/api/cart/${userId}`);
      expect(cartGetResponse.status).toBe(200);
      const total = cartGetResponse.data.total;

      // 4. Create payment intent
      const paymentResponse = await axios.post(`${PAYMENT_URL}/api/payments/create-intent`, {
        amount: total,
        currency: 'usd',
        metadata: {
          userId: userId,
          cartId: cartGetResponse.data.id
        }
      });
      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.data.clientSecret).toBeDefined();

      // 5. Clear cart after successful payment
      const clearResponse = await axios.delete(`${CART_URL}/api/cart/${userId}/clear`);
      expect(clearResponse.status).toBe(200);
    });
  });
});
