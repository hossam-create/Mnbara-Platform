/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the payment-service.
 * All shared packages are imported from @mnbara/* namespace.
 */

// Import types from @mnbara/types
import type {
  Payment,
  PaymentStatus,
  PaymentMetadata,
} from '@mnbara/types/payment';

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
  userSchema,
} from '@mnbara/validation';

// Import API client from @mnbara/api-client
import { ApiClient } from '@mnbara/api-client';

/**
 * Example: Using shared types in payment service
 */
export interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: PaymentMetadata;
}

export interface PaymentResponse {
  id: string;
  user: User;
  amount: number;
  currency: string;
  status: PaymentStatus;
  formattedAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Example: Using validation schemas
 */
export const validatePaymentData = (data: unknown) => {
  // Validate payment data using shared schema
  return paymentSchema.parse(data);
};

export const validateUserData = (data: unknown) => {
  // Validate user data using shared schema
  return userSchema.parse(data);
};

/**
 * Example: Using utility functions
 */
export const formatPaymentAmount = (amount: number, currency: string = 'USD'): string => {
  return formatCurrency(amount, currency);
};

export const formatPaymentDate = (date: Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
};

/**
 * Example: Using API client
 */
export const initializeApiClient = (baseURL: string) => {
  return new ApiClient(baseURL);
};

/**
 * Example: Processing payment with shared packages
 */
export const processPayment = async (
  paymentRequest: PaymentRequest,
  apiClient: ApiClient
): Promise<PaymentResponse> => {
  // Validate using shared validation
  const validatedPayment = paymentSchema.parse(paymentRequest);

  // Format amount using shared utilities
  const formattedAmount = formatPaymentAmount(validatedPayment.amount, validatedPayment.currency);

  // Use types from shared types package
  const payment: PaymentResponse = {
    id: `payment-${Date.now()}`,
    user: {
      id: paymentRequest.userId,
      email: 'user@example.com',
      roles: ['user'] as UserRole[],
      profile: {
        firstName: 'User',
        lastName: 'Name',
        avatar: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    amount: validatedPayment.amount,
    currency: validatedPayment.currency,
    status: 'pending' as PaymentStatus,
    formattedAmount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return payment;
};

/**
 * Example: Formatting payment information
 */
export const formatPaymentInfo = (payment: PaymentResponse): any => {
  return {
    id: payment.id,
    user: `${payment.user.profile.firstName} ${payment.user.profile.lastName}`,
    amount: payment.formattedAmount,
    status: payment.status,
    createdAt: formatPaymentDate(payment.createdAt),
  };
};

/**
 * Example: Combining multiple shared packages
 */
export const processNewPayment = async (
  paymentRequest: PaymentRequest,
  apiClient: ApiClient
): Promise<PaymentResponse> => {
  // Process payment
  const payment = await processPayment(paymentRequest, apiClient);

  // Format for logging
  const paymentInfo = formatPaymentInfo(payment);
  console.log('New payment processed:', paymentInfo);

  return payment;
};

export default {
  validatePaymentData,
  validateUserData,
  formatPaymentAmount,
  formatPaymentDate,
  initializeApiClient,
  processPayment,
  formatPaymentInfo,
  processNewPayment,
};
