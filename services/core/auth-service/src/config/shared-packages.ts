/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the auth-service.
 * All shared packages are imported from @mnbara/* namespace.
 */

// Import types from @mnbara/types
import type {
  User,
  UserRole,
  UserProfile,
} from '@mnbara/types/user';

// Import utilities from @mnbara/utils
import {
  formatCurrency,
  formatDate,
  validateEmail,
  validatePassword,
} from '@mnbara/utils';

// Import validation schemas from @mnbara/validation
import {
  userSchema,
} from '@mnbara/validation';

// Import API client from @mnbara/api-client
import { ApiClient } from '@mnbara/api-client';

/**
 * Example: Using shared types in auth service
 */
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

/**
 * Example: Using validation schemas
 */
export const validateAuthRequest = (data: unknown) => {
  // Validate user data using shared schema
  return userSchema.parse(data);
};

/**
 * Example: Using utility functions
 */
export const formatUserCreatedDate = (date: Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
};

/**
 * Example: Using API client
 */
export const initializeApiClient = (baseURL: string) => {
  return new ApiClient(baseURL);
};

/**
 * Example: Combining multiple shared packages
 */
export const processUserRegistration = async (
  userData: unknown,
  apiClient: ApiClient
) => {
  // Validate using shared validation
  const validatedUser = userSchema.parse(userData);

  // Format dates using shared utilities
  const createdAt = formatUserCreatedDate(new Date());

  // Use types from shared types package
  const user: User = {
    id: 'user-123',
    email: validatedUser.email,
    roles: ['user'],
    profile: {
      firstName: validatedUser.firstName,
      lastName: validatedUser.lastName,
      avatar: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return user;
};

export default {
  validateAuthRequest,
  formatUserCreatedDate,
  initializeApiClient,
  processUserRegistration,
};
