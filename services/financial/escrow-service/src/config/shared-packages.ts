/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the escrow-service.
 * All shared packages are imported from @mnbara/* namespace.
 */

// Import types from @mnbara/types
import type {
  Payment,
  PaymentStatus,
  PaymentMetadata,
} from '@mnbara/types/payment';

import type {
  Order,
  OrderStatus,
  OrderItem,
} from '@mnbara/types/order';

import type {
  User,
  UserRole,
} from '@mnbara/types/user';

// Import utilities from @mnbara/utils
import {
  formatCurrency,
  formatDate,
  validateEmail,
} from '@mnbara/utils';

// Import validation schemas from @mnbara/validation
import {
  paymentSchema,
  orderSchema,
  userSchema,
} from '@mnbara/validation';

// Import API client from @mnbara/api-client
import { ApiClient } from '@mnbara/api-client';

/**
 * Example: Using shared types in escrow service
 */
export interface EscrowRequest {
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  description: string;
}

export interface EscrowResponse {
  id: string;
  order: Order;
  buyer: User;
  seller: User;
  amount: number;
  currency: string;
  status: PaymentStatus;
  formattedAmount: string;
  createdAt: Date;
  releasedAt?: Date;
}

/**
 * Example: Using validation schemas
 */
export const validateEscrowData = (data: unknown) => {
  // Validate escrow data using shared schema
  return paymentSchema.parse(data);
};

export const validateOrderData = (data: unknown) => {
  // Validate order data using shared schema
  return orderSchema.parse(data);
};

export const validateUserData = (data: unknown) => {
  // Validate user data using shared schema
  return userSchema.parse(data);
};

/**
 * Example: Using utility functions
 */
export const formatEscrowAmount = (amount: number, currency: string = 'USD'): string => {
  return formatCurrency(amount, currency);
};

export const formatEscrowDate = (date: Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
};

/**
 * Example: Using API client
 */
export const initializeApiClient = (baseURL: string) => {
  return new ApiClient(baseURL);
};

/**
 * Example: Creating escrow with shared packages
 */
export const createEscrow = async (
  escrowRequest: EscrowRequest,
  apiClient: ApiClient
): Promise<EscrowResponse> => {
  // Validate using shared validation
  const validatedEscrow = paymentSchema.parse(escrowRequest);

  // Format amount using shared utilities
  const formattedAmount = formatEscrowAmount(validatedEscrow.amount, validatedEscrow.currency);

  // Use types from shared types package
  const escrow: EscrowResponse = {
    id: `escrow-${Date.now()}`,
    order: {
      id: escrowRequest.orderId,
      status: 'pending' as OrderStatus,
      items: [] as OrderItem[],
      total: validatedEscrow.amount,
      currency: validatedEscrow.currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    buyer: {
      id: escrowRequest.buyerId,
      email: 'buyer@example.com',
      roles: ['user'] as UserRole[],
      profile: {
        firstName: 'Buyer',
        lastName: 'Name',
        avatar: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    seller: {
      id: escrowRequest.sellerId,
      email: 'seller@example.com',
      roles: ['seller'] as UserRole[],
      profile: {
        firstName: 'Seller',
        lastName: 'Name',
        avatar: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    amount: validatedEscrow.amount,
    currency: validatedEscrow.currency,
    status: 'pending' as PaymentStatus,
    formattedAmount,
    createdAt: new Date(),
  };

  return escrow;
};

/**
 * Example: Formatting escrow information
 */
export const formatEscrowInfo = (escrow: EscrowResponse): any => {
  return {
    id: escrow.id,
    order: escrow.order.id,
    buyer: `${escrow.buyer.profile.firstName} ${escrow.buyer.profile.lastName}`,
    seller: `${escrow.seller.profile.firstName} ${escrow.seller.profile.lastName}`,
    amount: escrow.formattedAmount,
    status: escrow.status,
    createdAt: formatEscrowDate(escrow.createdAt),
  };
};

/**
 * Example: Releasing escrow funds
 */
export const releaseEscrow = async (
  escrow: EscrowResponse,
  apiClient: ApiClient
): Promise<EscrowResponse> => {
  // Update escrow status
  const releasedEscrow: EscrowResponse = {
    ...escrow,
    status: 'completed' as PaymentStatus,
    releasedAt: new Date(),
  };

  // Format for logging
  const escrowInfo = formatEscrowInfo(releasedEscrow);
  console.log('Escrow released:', escrowInfo);

  return releasedEscrow;
};

/**
 * Example: Combining multiple shared packages
 */
export const processEscrowTransaction = async (
  escrowRequest: EscrowRequest,
  apiClient: ApiClient
): Promise<EscrowResponse> => {
  // Create escrow
  const escrow = await createEscrow(escrowRequest, apiClient);

  // Format for logging
  const escrowInfo = formatEscrowInfo(escrow);
  console.log('New escrow created:', escrowInfo);

  return escrow;
};

export default {
  validateEscrowData,
  validateOrderData,
  validateUserData,
  formatEscrowAmount,
  formatEscrowDate,
  initializeApiClient,
  createEscrow,
  formatEscrowInfo,
  releaseEscrow,
  processEscrowTransaction,
};
