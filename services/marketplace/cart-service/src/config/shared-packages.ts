/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the cart-service.
 * All shared packages are imported from @mnbara/* namespace.
 */

// Import types from @mnbara/types
import type {
  Order,
  OrderItem,
  OrderStatus,
} from '@mnbara/types/order';

// Import utilities from @mnbara/utils
import {
  formatCurrency,
  formatDate,
  validateEmail,
} from '@mnbara/utils';

// Import validation schemas from @mnbara/validation
import {
  orderSchema,
  paymentSchema,
} from '@mnbara/validation';

// Import API client from @mnbara/api-client
import { ApiClient } from '@mnbara/api-client';

/**
 * Example: Using shared types in cart service
 */
export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Example: Using validation schemas
 */
export const validateCartOrder = (data: unknown) => {
  // Validate order data using shared schema
  return orderSchema.parse(data);
};

/**
 * Example: Using utility functions
 */
export const calculateCartTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const formatCartTotal = (total: number, currency: string = 'USD'): string => {
  return formatCurrency(total, currency);
};

export const formatCartDate = (date: Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
};

/**
 * Example: Using API client
 */
export const initializeApiClient = (baseURL: string) => {
  return new ApiClient(baseURL);
};

/**
 * Example: Processing cart checkout with shared packages
 */
export const processCartCheckout = async (
  cart: Cart,
  apiClient: ApiClient
): Promise<Order> => {
  // Calculate total using shared utilities
  const total = calculateCartTotal(cart.items);
  const formattedTotal = formatCartTotal(total, cart.currency);

  // Create order from cart items
  const orderData = {
    items: cart.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
    total,
    currency: cart.currency,
  };

  // Validate using shared validation
  const validatedOrder = orderSchema.parse(orderData);

  // Use types from shared types package
  const order: Order = {
    id: `order-${Date.now()}`,
    status: 'pending' as OrderStatus,
    items: validatedOrder.items as OrderItem[],
    total: validatedOrder.total,
    currency: validatedOrder.currency,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return order;
};

/**
 * Example: Formatting cart information
 */
export const formatCartInfo = (cart: Cart): any => {
  const total = calculateCartTotal(cart.items);
  return {
    id: cart.id,
    userId: cart.userId,
    itemCount: cart.items.length,
    total,
    formattedTotal: formatCartTotal(total, cart.currency),
    currency: cart.currency,
    createdAt: formatCartDate(cart.createdAt),
    updatedAt: formatCartDate(cart.updatedAt),
  };
};

export default {
  calculateCartTotal,
  formatCartTotal,
  formatCartDate,
  validateCartOrder,
  initializeApiClient,
  processCartCheckout,
  formatCartInfo,
};
