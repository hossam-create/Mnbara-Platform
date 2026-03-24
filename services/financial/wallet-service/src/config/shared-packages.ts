/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the wallet-service.
 * All shared packages are imported from @mnbara/* namespace.
 */

// Import types from @mnbara/types
import type {
  Payment,
  PaymentStatus,
} from '@mnbara/types/payment';

import type {
  User,
  UserStatus,
} from '@mnbara/types/user';

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
 * Example: Using shared types in wallet service
 */
export interface WalletRequest {
  userId: string;
  amount: number;
  currency: CurrencyCode;
  transactionType: 'deposit' | 'withdrawal' | 'transfer';
}

export interface WalletResponse {
  id: string;
  user: User;
  balance: number;
  currency: CurrencyCode;
  formattedBalance: string;
  lastTransaction: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Example: Using validation schemas
 */
export const validateWalletData = (data: unknown) => {
  // Validate wallet data using shared schema
  return paymentSchema.parse(data);
};

export const validateUserData = (data: unknown) => {
  // Validate user data using shared schema
  return userSchema.parse(data);
};

/**
 * Example: Using utility functions
 */
export const formatWalletBalance = (amount: number, currency: CurrencyCode = 'USD'): string => {
  return formatCurrency(amount, currency);
};

export const formatWalletDate = (date: Date): string => {
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
 * Example: Creating a wallet with shared packages
 */
export const createWallet = async (
  walletRequest: WalletRequest,
  apiClient: ApiClient
): Promise<WalletResponse> => {
  // Validate using shared validation
  const validatedWallet = paymentSchema.parse(walletRequest);

  // Create wallet object using shared types
  const wallet: WalletResponse = {
    id: `wallet-${Date.now()}`,
    user: {
      id: walletRequest.userId,
      email: 'user@example.com',
      roles: ['user'] as any,
      status: 'active' as UserStatus,
      profile: {
        firstName: 'User',
        lastName: 'Name',
        avatar: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    balance: walletRequest.amount,
    currency: walletRequest.currency,
    formattedBalance: formatWalletBalance(walletRequest.amount, walletRequest.currency),
    lastTransaction: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return wallet;
};

/**
 * Example: Formatting wallet information
 */
export const formatWalletInfo = (wallet: WalletResponse): any => {
  return {
    id: wallet.id,
    user: `${wallet.user.profile.firstName} ${wallet.user.profile.lastName}`,
    balance: wallet.formattedBalance,
    currency: wallet.currency,
    lastTransaction: formatWalletDate(wallet.lastTransaction),
    createdAt: formatWalletDate(wallet.createdAt),
  };
};

/**
 * Example: Processing wallet transaction
 */
export const processWalletTransaction = async (
  walletRequest: WalletRequest,
  apiClient: ApiClient
): Promise<WalletResponse> => {
  // Create wallet
  const wallet = await createWallet(walletRequest, apiClient);

  // Format for logging
  const walletInfo = formatWalletInfo(wallet);
  console.log('Wallet transaction processed:', walletInfo);

  return wallet;
};

/**
 * Example: Calculating wallet fees
 */
export const calculateWalletFee = (amount: number, feePercentage: number = 0.02): number => {
  return amount * feePercentage;
};

/**
 * Example: Combining multiple shared packages
 */
export const processNewWalletTransaction = async (
  walletRequest: WalletRequest,
  apiClient: ApiClient
): Promise<WalletResponse> => {
  // Process transaction
  const wallet = await processWalletTransaction(walletRequest, apiClient);

  // Calculate and log fee
  const fee = calculateWalletFee(walletRequest.amount);
  console.log(`Transaction fee: ${formatWalletBalance(fee, walletRequest.currency)}`);

  return wallet;
};

export default {
  validateWalletData,
  validateUserData,
  formatWalletBalance,
  formatWalletDate,
  initializeApiClient,
  createWallet,
  formatWalletInfo,
  processWalletTransaction,
  calculateWalletFee,
  processNewWalletTransaction,
};
