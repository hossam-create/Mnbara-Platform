'use client';

import { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { addItemLocal, removeItem, updateQuantity, clearCart } from '@/store/slices/cartSlice';
import { addToWatchlist, removeFromWatchlist } from '@/store/slices/userSlice';
import { useToast } from '@/hooks/useToast';

// Types for optimistic updates
interface OptimisticAction {
  id: string;
  type: 'cart_add' | 'cart_remove' | 'cart_update' | 'watchlist_add' | 'watchlist_remove' | 'wallet_transfer';
  timestamp: number;
  rollback: () => void;
  confirm: () => void;
}

interface OptimisticUpdateOptions {
  showToast?: boolean;
  rollbackOnError?: boolean;
  timeout?: number;
}

// Optimistic update manager
class OptimisticUpdateManager {
  private pendingActions = new Map<string, OptimisticAction>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  // Add optimistic action
  addAction(action: OptimisticAction, options: OptimisticUpdateOptions = {}) {
    const { timeout = 5000 } = options;

    this.pendingActions.set(action.id, action);

    // Set timeout for automatic rollback if no confirmation
    const timeoutId = setTimeout(() => {
      this.rollbackAction(action.id);
    }, timeout);

    this.timeouts.set(action.id, timeoutId);
  }

  // Confirm successful action
  confirmAction(actionId: string) {
    const action = this.pendingActions.get(actionId);
    if (action) {
      action.confirm();
      this.cleanupAction(actionId);
    }
  }

  // Rollback failed action
  rollbackAction(actionId: string) {
    const action = this.pendingActions.get(actionId);
    if (action) {
      action.rollback();
      this.cleanupAction(actionId);
    }
  }

  // Cleanup action
  private cleanupAction(actionId: string) {
    const timeout = this.timeouts.get(actionId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(actionId);
    }
    this.pendingActions.delete(actionId);
  }

  // Get pending actions count
  getPendingCount(): number {
    return this.pendingActions.size;
  }
}

// Global optimistic update manager instance
export const optimisticManager = new OptimisticUpdateManager();

// React hooks for optimistic updates
export function useOptimisticCart() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  // Optimistic add to cart
  const addToCartOptimistic = useCallback(async (
    product: any,
    quantity: number = 1,
    options: OptimisticUpdateOptions = {}
  ) => {
    const actionId = `cart-add-${product.id}-${Date.now()}`;
    const { showToast: shouldShowToast = true, rollbackOnError = true } = options;

    // Create cart item
    const cartItem = {
      id: `cart-${product.id}-${Date.now()}`,
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.image || product.images?.[0],
      quantity,
      seller: product.seller,
      shipping: product.shipping
    };

    // Optimistically add to cart
    dispatch(addItemLocal(cartItem));

    if (shouldShowToast) {
      showToast({
        title: 'Added to cart',
        description: `${product.title} has been added to your cart`,
        type: 'success'
      });
    }

    // Add optimistic action for potential rollback
    const optimisticAction: OptimisticAction = {
      id: actionId,
      type: 'cart_add',
      timestamp: Date.now(),
      rollback: () => {
        dispatch(removeItem(cartItem.id));
        if (shouldShowToast) {
          showToast({
            title: 'Failed to add to cart',
            description: 'Please try again',
            type: 'error'
          });
        }
      },
      confirm: () => {
        // Action confirmed - no additional action needed
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Cart add confirmed:', product.title);
        }
      }
    };

    optimisticManager.addAction(optimisticAction, options);

    try {
      // TODO: Call actual API to sync cart
      // await cartAPI.addToCart(product.id, quantity);

      // Confirm action on success
      optimisticManager.confirmAction(actionId);
    } catch (error) {
      if (rollbackOnError) {
        optimisticManager.rollbackAction(actionId);
      }
      throw error;
    }
  }, [dispatch, showToast]);

  // Optimistic remove from cart
  const removeFromCartOptimistic = useCallback(async (
    cartItemId: string,
    options: OptimisticUpdateOptions = {}
  ) => {
    const actionId = `cart-remove-${cartItemId}-${Date.now()}`;
    const { showToast: shouldShowToast = false, rollbackOnError = true } = options;

    // Find the item to potentially rollback
    const itemToRemove = cartItems.find(item => item.id === cartItemId);

    // Optimistically remove from cart
    dispatch(removeItem(cartItemId));

    // Add optimistic action for potential rollback
    const optimisticAction: OptimisticAction = {
      id: actionId,
      type: 'cart_remove',
      timestamp: Date.now(),
      rollback: () => {
        if (itemToRemove) {
          dispatch(addItemLocal(itemToRemove));
        }
        if (shouldShowToast) {
          showToast({
            title: 'Failed to remove item',
            description: 'Please try again',
            type: 'error'
          });
        }
      },
      confirm: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Cart remove confirmed:', cartItemId);
        }
      }
    };

    optimisticManager.addAction(optimisticAction, options);

    try {
      // TODO: Call actual API to sync cart removal
      // await cartAPI.removeFromCart(cartItemId);

      // Confirm action on success
      optimisticManager.confirmAction(actionId);
    } catch (error) {
      if (rollbackOnError) {
        optimisticManager.rollbackAction(actionId);
      }
      throw error;
    }
  }, [dispatch, cartItems, showToast]);

  // Optimistic quantity update
  const updateQuantityOptimistic = useCallback(async (
    cartItemId: string,
    newQuantity: number,
    options: OptimisticUpdateOptions = {}
  ) => {
    const actionId = `cart-update-${cartItemId}-${Date.now()}`;
    const { rollbackOnError = true } = options;

    // Find current item for rollback
    const currentItem = cartItems.find(item => item.id === cartItemId);
    const oldQuantity = currentItem?.quantity || 0;

    // Optimistically update quantity
    dispatch(updateQuantity({ id: cartItemId, quantity: newQuantity }));

    // Add optimistic action for potential rollback
    const optimisticAction: OptimisticAction = {
      id: actionId,
      type: 'cart_update',
      timestamp: Date.now(),
      rollback: () => {
        dispatch(updateQuantity({ id: cartItemId, quantity: oldQuantity }));
      },
      confirm: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Cart quantity update confirmed:', cartItemId, newQuantity);
        }
      }
    };

    optimisticManager.addAction(optimisticAction, options);

    try {
      // TODO: Call actual API to sync quantity
      // await cartAPI.updateQuantity(cartItemId, newQuantity);

      // Confirm action on success
      optimisticManager.confirmAction(actionId);
    } catch (error) {
      if (rollbackOnError) {
        optimisticManager.rollbackAction(actionId);
      }
      throw error;
    }
  }, [dispatch, cartItems]);

  return {
    addToCartOptimistic,
    removeFromCartOptimistic,
    updateQuantityOptimistic,
  };
}

export function useOptimisticWatchlist() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const watchlist = useSelector((state: RootState) => state.user.watchlist);

  // Optimistic add to watchlist
  const addToWatchlistOptimistic = useCallback(async (
    productId: string,
    options: OptimisticUpdateOptions = {}
  ) => {
    const actionId = `watchlist-add-${productId}-${Date.now()}`;
    const { showToast: shouldShowToast = true, rollbackOnError = true } = options;

    // Optimistically add to watchlist
    dispatch(addToWatchlist(productId));

    if (shouldShowToast) {
      showToast({
        title: 'Added to watchlist',
        description: 'Item saved to your watchlist',
        type: 'success'
      });
    }

    // Add optimistic action for potential rollback
    const optimisticAction: OptimisticAction = {
      id: actionId,
      type: 'watchlist_add',
      timestamp: Date.now(),
      rollback: () => {
        dispatch(removeFromWatchlist(productId));
        if (shouldShowToast) {
          showToast({
            title: 'Failed to add to watchlist',
            description: 'Please try again',
            type: 'error'
          });
        }
      },
      confirm: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Watchlist add confirmed:', productId);
        }
      }
    };

    optimisticManager.addAction(optimisticAction, options);

    try {
      // TODO: Call actual API to sync watchlist
      // await userAPI.addToWatchlist(productId);

      // Confirm action on success
      optimisticManager.confirmAction(actionId);
    } catch (error) {
      if (rollbackOnError) {
        optimisticManager.rollbackAction(actionId);
      }
      throw error;
    }
  }, [dispatch, showToast]);

  // Optimistic remove from watchlist
  const removeFromWatchlistOptimistic = useCallback(async (
    productId: string,
    options: OptimisticUpdateOptions = {}
  ) => {
    const actionId = `watchlist-remove-${productId}-${Date.now()}`;
    const { showToast: shouldShowToast = false, rollbackOnError = true } = options;

    // Optimistically remove from watchlist
    dispatch(removeFromWatchlist(productId));

    // Add optimistic action for potential rollback
    const optimisticAction: OptimisticAction = {
      id: actionId,
      type: 'watchlist_remove',
      timestamp: Date.now(),
      rollback: () => {
        dispatch(addToWatchlist(productId));
        if (shouldShowToast) {
          showToast({
            title: 'Failed to remove from watchlist',
            description: 'Please try again',
            type: 'error'
          });
        }
      },
      confirm: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Watchlist remove confirmed:', productId);
        }
      }
    };

    optimisticManager.addAction(optimisticAction, options);

    try {
      // TODO: Call actual API to sync watchlist removal
      // await userAPI.removeFromWatchlist(productId);

      // Confirm action on success
      optimisticManager.confirmAction(actionId);
    } catch (error) {
      if (rollbackOnError) {
        optimisticManager.rollbackAction(actionId);
      }
      throw error;
    }
  }, [dispatch, showToast]);

  return {
    addToWatchlistOptimistic,
    removeFromWatchlistOptimistic,
  };
}

// Hook to get current optimistic update status
export function useOptimisticStatus() {
  const [pendingCount, setPendingCount] = useState(0);

  // Update pending count periodically
  useState(() => {
    const interval = setInterval(() => {
      setPendingCount(optimisticManager.getPendingCount());
    }, 100);

    return () => clearInterval(interval);
  });

  return {
    hasPendingActions: pendingCount > 0,
    pendingCount,
  };
}
