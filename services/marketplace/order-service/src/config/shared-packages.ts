/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the order-service.
 * All shared packages are imported from @mnbara/* namespace.
 */

// Import types from @mnbara/types
import type {
  Order,
  OrderItem,
  OrderStatus,
} from '@mnbara/types/order';

import type {
  Payment,
  PaymentStatus,
} from '@mnbara/types/payment';

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
 * Example: Using shared types in order service
 */
export interface OrderRequest {
  userId: string;
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: string;
}

export interface OrderResponse {
  order: Order;
  payment: Payment;
  createdAt: Date;
}

/**
 * Example: Using validation schemas
 */
export const validateOrderRequest = (data: unknown) => {
  // Validate order data using shared schema
  return orderSchema.parse(data);
};

export const validatePaymentData = (data: unknown) => {
  // Validate payment data using shared schema
  return paymentSchema.parse(data);
};

/**
 * Example: Using utility functions
 */
export const calculateOrderTotal = (items: OrderItem[]): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const formatOrderTotal = (total: number, currency: string = 'USD'): string => {
  return formatCurrency(total, currency);
};

export const formatOrderDate = (date: Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
};

/**
 * Example: Using API client
 */
export const initializeApiClient = (baseURL: string) => {
  return new ApiClient(baseURL);
};

/**
 * Example: Creating an order with shared packages
 */
export const createOrder = async (
  orderRequest: OrderRequest,
  apiClient: ApiClient
): Promise<OrderResponse> => {
  // Validate using shared validation
  const validatedOrder = validateOrderRequest({
    items: orderRequest.items,
    total: calculateOrderTotal(orderRequest.items),
    currency: 'USD',
  });

  // Create order object
  const order: Order = {
    id: `order-${Date.now()}`,
    status: 'pending' as OrderStatus,
    items: orderRequest.items,
    total: calculateOrderTotal(orderRequest.items),
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create payment object
  const payment: Payment = {
    id: `payment-${Date.now()}`,
    orderId: order.id,
    amount: order.total,
    currency: order.currency,
    status: 'pending' as PaymentStatus,
    metadata: {
      method: orderRequest.paymentMethod,
      userId: orderRequest.userId,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    order,
    payment,
    createdAt: new Date(),
  };
};

/**
 * Example: Formatting order information
 */
export const formatOrderInfo = (order: Order): any => {
  return {
    id: order.id,
    status: order.status,
    itemCount: order.items.length,
    total: order.total,
    formattedTotal: formatOrderTotal(order.total, order.currency),
    currency: order.currency,
    createdAt: formatOrderDate(order.createdAt),
    updatedAt: formatOrderDate(order.updatedAt),
  };
};

/**
 * Example: Processing order with payment
 */
export const processOrderWithPayment = async (
  orderRequest: OrderRequest,
  apiClient: ApiClient
): Promise<OrderResponse> => {
  // Create order
  const orderResponse = await createOrder(orderRequest, apiClient);

  // Validate payment data
  const validatedPayment = validatePaymentData({
    amount: orderResponse.order.total,
    currency: orderResponse.order.currency,
    method: orderRequest.paymentMethod,
  });

  return orderResponse;
};

export default {
  validateOrderRequest,
  validatePaymentData,
  calculateOrderTotal,
  formatOrderTotal,
  formatOrderDate,
  initializeApiClient,
  createOrder,
  formatOrderInfo,
  processOrderWithPayment,
};
