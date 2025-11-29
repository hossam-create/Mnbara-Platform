import { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import type { Cart, CartItem } from '../types/cart.types';
import { CartService } from '../services/cart.service';

const CART_STORAGE_KEY = 'mnbara_cart';

const getInitialCart = (): Cart => {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      return JSON.parse(storedCart);
    }
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to load cart from localStorage:', error);
  }
  return { items: [], totalItems: 0, totalPrice: 0 };
};

const calculateCartTotals = (items: CartItem[]): Cart => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return { items, totalItems, totalPrice };
};

export const useCart = () => {
  const [cart, setCart] = useState<Cart>(getInitialCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      Sentry.captureException(error);
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  // Sync with backend on mount
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        setLoading(true);
        setError(null);
        const localCart = getInitialCart();
        const backendCart = await CartService.syncCart(localCart);
        setCart(backendCart);
      } catch (error) {
        Sentry.captureException(error);
        setError('Failed to sync cart with server');
        console.error('Cart sync error:', error);
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      syncWithBackend();
    }
  }, []); // Only run on mount

  const addToCart = useCallback(
    async (item: Omit<CartItem, 'quantity'>) => {
      try {
        setLoading(true);
        setError(null);

        // Optimistic update
        const existingItem = cart.items.find((i) => i.id === item.id);
        const updatedItems = existingItem
          ? cart.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...cart.items, { ...item, quantity: 1 }];

        const newCart = calculateCartTotals(updatedItems);
        setCart(newCart);

        // Sync with backend
        const backendCart = await CartService.addToCart(item);
        setCart(backendCart);
      } catch (error) {
        Sentry.captureException(error);
        setError('Failed to add item to cart');
        console.error('Add to cart error:', error);
        // Revert optimistic update
        setCart(getInitialCart());
      } finally {
        setLoading(false);
      }
    },
    [cart.items]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        setLoading(true);
        setError(null);

        // Optimistic update
        const updatedItems =
          quantity === 0
            ? cart.items.filter((i) => i.id !== itemId)
            : cart.items.map((i) =>
                i.id === itemId ? { ...i, quantity } : i
              );

        const newCart = calculateCartTotals(updatedItems);
        setCart(newCart);

        // Sync with backend
        const backendCart = await CartService.updateCartItem(itemId, quantity);
        setCart(backendCart);
      } catch (error) {
        Sentry.captureException(error);
        setError('Failed to update cart item');
        console.error('Update quantity error:', error);
        // Revert optimistic update
        setCart(getInitialCart());
      } finally {
        setLoading(false);
      }
    },
    [cart.items]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      try {
        setLoading(true);
        setError(null);

        // Optimistic update
        const updatedItems = cart.items.filter((i) => i.id !== itemId);
        const newCart = calculateCartTotals(updatedItems);
        setCart(newCart);

        // Sync with backend
        const backendCart = await CartService.removeFromCart(itemId);
        setCart(backendCart);
      } catch (error) {
        Sentry.captureException(error);
        setError('Failed to remove item from cart');
        console.error('Remove from cart error:', error);
        // Revert optimistic update
        setCart(getInitialCart());
      } finally {
        setLoading(false);
      }
    },
    [cart.items]
  );

  const clearCart = useCallback(() => {
    setCart({ items: [], totalItems: 0, totalPrice: 0 });
  }, []);

  return {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
};
