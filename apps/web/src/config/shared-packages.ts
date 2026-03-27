/**
 * Shared Packages Configuration
 * This file demonstrates how to use shared packages from @mnbara/*
 */

// Import types from shared packages
import type {
  UserRole,
  UserStatus,
  OrderStatus,
  PaymentStatus,
  DeliveryStatus,
} from '@mnbara/types';

// Import utilities from shared packages
import {
  formatCurrency,
  formatDate,
  isValidEmail,
  validatePassword,
} from '@mnbara/utils';

// Import API client from shared packages
import { ApiClient } from '@mnbara/api-client';

// Example: Create API client instance
export const createSharedApiClient = (baseURL: string) => {
  return new ApiClient({
    baseURL,
    timeout: 30000,
  });
};

// Example: Use shared utilities
export const formatOrderAmount = (amount: number, currency: 'USD' | 'EUR' | 'GBP' = 'USD') => {
  return formatCurrency(amount, currency);
};

export const formatOrderDate = (date: Date | string) => {
  return formatDate(date, 'medium');
};

// Example: Validate user input
export const validateUserEmail = (email: string): boolean => {
  return isValidEmail(email);
};

export const validateUserPassword = (password: string) => {
  return validatePassword(password);
};

// Re-export types for convenience
export type {
  UserRole,
  UserStatus,
  OrderStatus,
  PaymentStatus,
  DeliveryStatus,
};
