import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart } from './useCart';
import { CartService } from '../services/cart.service';
import * as Sentry from '@sentry/react';

// Mock dependencies
vi.mock('../services/cart.service');
vi.mock('@sentry/react');

describe('useCart Hook', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty cart', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.cart.items).toEqual([]);
      expect(result.current.cart.totalItems).toBe(0);
      expect(result.current.cart.totalPrice).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load cart from localStorage if available', () => {
      const savedCart = {
        items: [
          {
            id: '1',
            title: 'Test Product',
            price: 10,
            imageUrl: 'test.jpg',
            quantity: 2,
          },
        ],
        totalItems: 2,
        totalPrice: 20,
      };
      localStorage.setItem('mnbara_cart', JSON.stringify(savedCart));

      const { result } = renderHook(() => useCart());

      expect(result.current.cart.items).toHaveLength(1);
      expect(result.current.cart.totalItems).toBe(2);
      expect(result.current.cart.totalPrice).toBe(20);
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem('mnbara_cart', 'invalid json');

      const { result } = renderHook(() => useCart());

      expect(result.current.cart.items).toEqual([]);
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const newItem = {
        id: '1',
        title: 'Test Product',
        price: 10,
        imageUrl: 'test.jpg',
      };

      const mockBackendCart = {
        items: [{ ...newItem, quantity: 1 }],
        totalItems: 1,
        totalPrice: 10,
      };

      vi.mocked(CartService.addToCart).mockResolvedValue(mockBackendCart);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.addToCart(newItem);
      });

      await waitFor(() => {
        expect(result.current.cart.items).toHaveLength(1);
        expect(result.current.cart.items[0].title).toBe('Test Product');
        expect(result.current.loading).toBe(false);
      });
    });

    it('should increase quantity for existing item', async () => {
      const existingItem = {
        id: '1',
        title: 'Test Product',
        price: 10,
        imageUrl: 'test.jpg',
      };

      const initialCart = {
        items: [{ ...existingItem, quantity: 1 }],
        totalItems: 1,
        totalPrice: 10,
      };

      localStorage.setItem('mnbara_cart', JSON.stringify(initialCart));

      const mockBackendCart = {
        items: [{ ...existingItem, quantity: 2 }],
        totalItems: 2,
        totalPrice: 20,
      };

      vi.mocked(CartService.addToCart).mockResolvedValue(mockBackendCart);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.addToCart(existingItem);
      });

      await waitFor(() => {
        expect(result.current.cart.items[0].quantity).toBe(2);
      });
    });

    it('should handle errors and capture with Sentry', async () => {
      const error = new Error('Network error');
      vi.mocked(CartService.addToCart).mockRejectedValue(error);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.addToCart({
          id: '1',
          title: 'Test',
          price: 10,
          imageUrl: 'test.jpg',
        });
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to add item to cart');
        expect(Sentry.captureException).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      const initialCart = {
        items: [
          {
            id: '1',
            title: 'Test Product',
            price: 10,
            imageUrl: 'test.jpg',
            quantity: 1,
          },
        ],
        totalItems: 1,
        totalPrice: 10,
      };

      localStorage.setItem('mnbara_cart', JSON.stringify(initialCart));

      const mockBackendCart = {
        items: [{ ...initialCart.items[0], quantity: 3 }],
        totalItems: 3,
        totalPrice: 30,
      };

      vi.mocked(CartService.updateCartItem).mockResolvedValue(mockBackendCart);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.updateQuantity('1', 3);
      });

      await waitFor(() => {
        expect(result.current.cart.items[0].quantity).toBe(3);
        expect(result.current.cart.totalPrice).toBe(30);
      });
    });

    it('should remove item when quantity is 0', async () => {
      const initialCart = {
        items: [
          {
            id: '1',
            title: 'Test Product',
            price: 10,
            imageUrl: 'test.jpg',
            quantity: 1,
          },
        ],
        totalItems: 1,
        totalPrice: 10,
      };

      localStorage.setItem('mnbara_cart', JSON.stringify(initialCart));

      const mockBackendCart = {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };

      vi.mocked(CartService.updateCartItem).mockResolvedValue(mockBackendCart);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.updateQuantity('1', 0);
      });

      await waitFor(() => {
        expect(result.current.cart.items).toHaveLength(0);
      });
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const initialCart = {
        items: [
          {
            id: '1',
            title: 'Test Product',
            price: 10,
            imageUrl: 'test.jpg',
            quantity: 1,
          },
        ],
        totalItems: 1,
        totalPrice: 10,
      };

      localStorage.setItem('mnbara_cart', JSON.stringify(initialCart));

      const mockBackendCart = {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };

      vi.mocked(CartService.removeFromCart).mockResolvedValue(mockBackendCart);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.removeFromCart('1');
      });

      await waitFor(() => {
        expect(result.current.cart.items).toHaveLength(0);
      });
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', () => {
      const initialCart = {
        items: [
          {
            id: '1',
            title: 'Test Product',
            price: 10,
            imageUrl: 'test.jpg',
            quantity: 2,
          },
        ],
        totalItems: 2,
        totalPrice: 20,
      };

      localStorage.setItem('mnbara_cart', JSON.stringify(initialCart));

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart.items).toHaveLength(0);
      expect(result.current.cart.totalItems).toBe(0);
      expect(result.current.cart.totalPrice).toBe(0);
    });
  });

  describe('localStorage persistence', () => {
    it('should save cart to localStorage on changes', async () => {
      const newItem = {
        id: '1',
        title: 'Test Product',
        price: 10,
        imageUrl: 'test.jpg',
      };

      const mockBackendCart = {
        items: [{ ...newItem, quantity: 1 }],
        totalItems: 1,
        totalPrice: 10,
      };

      vi.mocked(CartService.addToCart).mockResolvedValue(mockBackendCart);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.addToCart(newItem);
      });

      await waitFor(() => {
        const savedCart = localStorage.getItem('mnbara_cart');
        expect(savedCart).toBeTruthy();
        const parsedCart = JSON.parse(savedCart!);
        expect(parsedCart.items).toHaveLength(1);
      });
    });
  });
});
