/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the settlement-service.
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
  UserStatus,
} from '@mnbara/types/user';

import type {
  GeoLocation,
} from '@mnbara/types';

// Import utilities from @mnbara/utils
import {
  formatCurrency,
  formatDate,
  validateEmail,
  type CurrencyCode,
} from '@mnbara/utils';

// Import validation schemas from @mnbara/validation
import {
  paymentSchema,
  userSchema,
} from '@mnbara/validation';

// Import API client from @mnbara/api-client
import { ApiClient, type ApiClientOptions } from '@mnbara/api-client';

/**
 * Example: Using shared types in settlement service
 */
export interface SettlementRequest {
  senderId: string;
  receiverId: string;
  amount: number;
  currency: CurrencyCode;
  senderLocation: GeoLocation;
  receiverLocation: GeoLocation;
  description: string;
}

export interface SettlementResponse {
  id: string;
  sender: User;
  receiver: User;
  amount: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  formattedAmount: string;
  senderLocation: GeoLocation;
  receiverLocation: GeoLocation;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Example: Using validation schemas
 */
export const validateSettlementData = (data: unknown) => {
  // Validate settlement data using shared schema
  return paymentSchema.parse(data);
};

export const validateUserData = (data: unknown) => {
  // Validate user data using shared schema
  return userSchema.parse(data);
};

/**
 * Example: Using utility functions
 */
export const formatSettlementAmount = (amount: number, currency: CurrencyCode = 'USD'): string => {
  return formatCurrency(amount, currency);
};

export const formatSettlementDate = (date: Date): string => {
  return formatDate(date, 'medium');
};

/**
 * Example: Using API client
 */
export const initializeApiClient = (baseURL: string): ApiClient => {
  const options: ApiClientOptions = { baseURL };
  return new ApiClient(options);
};

/**
 * Example: Creating settlement with shared packages
 */
export const createSettlement = async (
  settlementRequest: SettlementRequest,
  apiClient: ApiClient
): Promise<SettlementResponse> => {
  // Validate using shared validation
  const validatedSettlement = paymentSchema.parse(settlementRequest);

  // Format amount using shared utilities
  const formattedAmount = formatSettlementAmount(validatedSettlement.amount, validatedSettlement.currency);

  // Use types from shared types package
  const settlement: SettlementResponse = {
    id: `settlement-${Date.now()}`,
    sender: {
      id: settlementRequest.senderId,
      email: 'sender@example.com',
      roles: ['user'] as any,
      status: 'active' as UserStatus,
      profile: {
        firstName: 'Sender',
        lastName: 'Name',
        avatar: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    receiver: {
      id: settlementRequest.receiverId,
      email: 'receiver@example.com',
      roles: ['user'] as any,
      status: 'active' as UserStatus,
      profile: {
        firstName: 'Receiver',
        lastName: 'Name',
        avatar: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    amount: validatedSettlement.amount,
    currency: validatedSettlement.currency,
    status: 'pending' as PaymentStatus,
    formattedAmount,
    senderLocation: settlementRequest.senderLocation,
    receiverLocation: settlementRequest.receiverLocation,
    createdAt: new Date(),
  };

  return settlement;
};

/**
 * Example: Formatting settlement information
 */
export const formatSettlementInfo = (settlement: SettlementResponse): any => {
  return {
    id: settlement.id,
    sender: `${settlement.sender.profile.firstName} ${settlement.sender.profile.lastName}`,
    receiver: `${settlement.receiver.profile.firstName} ${settlement.receiver.profile.lastName}`,
    amount: settlement.formattedAmount,
    status: settlement.status,
    senderLocation: `${settlement.senderLocation.latitude},${settlement.senderLocation.longitude}`,
    receiverLocation: `${settlement.receiverLocation.latitude},${settlement.receiverLocation.longitude}`,
    createdAt: formatSettlementDate(settlement.createdAt),
  };
};

/**
 * Example: Completing settlement
 */
export const completeSettlement = async (
  settlement: SettlementResponse,
  apiClient: ApiClient
): Promise<SettlementResponse> => {
  // Update settlement status
  const completedSettlement: SettlementResponse = {
    ...settlement,
    status: 'completed' as PaymentStatus,
    completedAt: new Date(),
  };

  // Format for logging
  const settlementInfo = formatSettlementInfo(completedSettlement);
  console.log('Settlement completed:', settlementInfo);

  return completedSettlement;
};

/**
 * Example: Calculating settlement distance
 */
export const calculateDistance = (from: GeoLocation, to: GeoLocation): number => {
  // Simplified distance calculation (Haversine formula would be more accurate)
  const lat1 = from.latitude;
  const lon1 = from.longitude;
  const lat2 = to.latitude;
  const lon2 = to.longitude;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Example: Combining multiple shared packages
 */
export const processSettlement = async (
  settlementRequest: SettlementRequest,
  apiClient: ApiClient
): Promise<SettlementResponse> => {
  // Create settlement
  const settlement = await createSettlement(settlementRequest, apiClient);

  // Calculate distance
  const distance = calculateDistance(
    settlementRequest.senderLocation,
    settlementRequest.receiverLocation
  );

  // Format for logging
  const settlementInfo = formatSettlementInfo(settlement);
  console.log('New settlement created:', settlementInfo);
  console.log(`Distance: ${distance.toFixed(2)} km`);

  return settlement;
};

export default {
  validateSettlementData,
  validateUserData,
  formatSettlementAmount,
  formatSettlementDate,
  initializeApiClient,
  createSettlement,
  formatSettlementInfo,
  completeSettlement,
  calculateDistance,
  processSettlement,
};
