/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the notification-service.
 * All shared packages are imported from @mnbara/* namespace.
 */

// Import types from @mnbara/types
import type {
  User,
  Order,
  Payment,
} from '@mnbara/types';

// Import utilities from @mnbara/utils
import {
  formatCurrency,
  formatDate,
} from '@mnbara/utils';

// Import validation schemas from @mnbara/validation
import {
  userSchema,
  orderSchema,
  paymentSchema,
} from '@mnbara/validation';

// Import API client from @mnbara/api-client
import { ApiClient } from '@mnbara/api-client';

/**
 * Example: Using shared types in notification service
 */
export interface NotificationPayload {
  userId: string;
  type: 'email' | 'sms' | 'push';
  subject: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Example: Using validation schemas
 */
export const validateNotificationData = (data: unknown) => {
  // Validate user data using shared schema
  return userSchema.parse(data);
};

/**
 * Example: Using utility functions for formatting
 */
export const formatOrderNotification = (order: Order): string => {
  const total = formatCurrency(order.total, order.currency);
  const date = formatDate(order.createdAt, 'YYYY-MM-DD HH:mm:ss');
  return `Order #${order.id} for ${total} placed on ${date}`;
};

export const formatPaymentNotification = (payment: Payment): string => {
  const amount = formatCurrency(payment.amount, payment.currency);
  const date = formatDate(payment.createdAt, 'YYYY-MM-DD HH:mm:ss');
  return `Payment of ${amount} received on ${date}`;
};

/**
 * Example: Using API client for inter-service communication
 */
export const initializeNotificationClient = (baseURL: string) => {
  return new ApiClient(baseURL);
};

/**
 * Example: Building notification templates using shared data
 */
export const buildOrderConfirmationNotification = (
  user: User,
  order: Order
): NotificationPayload => {
  return {
    userId: user.id,
    type: 'email',
    subject: `Order Confirmation #${order.id}`,
    body: formatOrderNotification(order),
    data: {
      orderId: order.id,
      userEmail: user.email,
      orderTotal: order.total,
      orderCurrency: order.currency,
    },
  };
};

/**
 * Example: Building payment notification using shared types
 */
export const buildPaymentConfirmationNotification = (
  user: User,
  payment: Payment
): NotificationPayload => {
  return {
    userId: user.id,
    type: 'email',
    subject: `Payment Confirmation`,
    body: formatPaymentNotification(payment),
    data: {
      paymentId: payment.id,
      userEmail: user.email,
      paymentAmount: payment.amount,
      paymentCurrency: payment.currency,
    },
  };
};

/**
 * Example: Combining multiple shared packages
 */
export const processNotification = async (
  payload: NotificationPayload,
  apiClient: ApiClient
): Promise<NotificationResponse> => {
  try {
    // Validate user exists using API client
    const user = await apiClient.get(`/users/${payload.userId}`);

    // Validate user data
    const validatedUser = userSchema.parse(user);

    // Send notification (implementation would go here)
    const notificationId = `notif-${Date.now()}`;

    return {
      success: true,
      notificationId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export default {
  validateNotificationData,
  formatOrderNotification,
  formatPaymentNotification,
  initializeNotificationClient,
  buildOrderConfirmationNotification,
  buildPaymentConfirmationNotification,
  processNotification,
};
