/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the product-service.
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
 * Example: Using shared types in product service
 */
export interface ProductPrice {
  amount: number;
  currency: string;
  formattedPrice: string;
}

export interface ProductWithPrice {
  id: string;
  name: string;
  price: ProductPrice;
  createdAt: Date;
}

/**
 * Example: Using validation schemas
 */
export const validateOrderData = (data: unknown) => {
  // Validate order data using shared schema
  return orderSchema.parse(data);
};

/**
 * Example: Using utility functions
 */
export const formatProductPrice = (amount: number, currency: string = 'USD'): string => {
  return formatCurrency(amount, currency);
};

export const formatProductDate = (date: Date): string => {
  return formatDate(date, 'YYYY-MM-DD');
};

/**
 * Example: Using API client
 */
export const initializeApiClient = (baseURL: string) => {
  return new ApiClient(baseURL);
};

/**
 * Example: Processing product orders with shared packages
 */
export const processProductOrder = async (
  orderData: unknown,
  apiClient: ApiClient
): Promise<Order> => {
  // Validate using shared validation
  const validatedOrder = orderSchema.parse(orderData);

  // Format prices using shared utilities
  const formattedTotal = formatProductPrice(validatedOrder.total);

  // Use types from shared types package
  const order: Order = {
    id: 'order-123',
    status: 'pending' as OrderStatus,
    items: validatedOrder.items as OrderItem[],
    total: validatedOrder.total,
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return order;
};

/**
 * Example: Formatting product information
 */
export const formatProductInfo = (product: any): ProductWithPrice => {
  return {
    id: product.id,
    name: product.name,
    price: {
      amount: product.price,
      currency: 'USD',
      formattedPrice: formatProductPrice(product.price, 'USD'),
    },
    createdAt: product.createdAt,
  };
};

export default {
  validateOrderData,
  formatProductPrice,
  formatProductDate,
  initializeApiClient,
  processProductOrder,
  formatProductInfo,
};
