/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the user-service.
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
 * Example: Using shared types in user service
 */
export interface UserServiceRequest {
  userId: string;
  action: 'create' | 'update' | 'delete';
  data?: Partial<User>;
}

export interface UserServiceResponse {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Example: Using validation schemas
 */
export const validateUserData = (data: unknown) => {
  // Validate user data using shared schema
  return userSchema.parse(data);
};

/**
 * Example: Using utility functions
 */
export const formatUserInfo = (user: User): string => {
  const createdDate = formatDate(user.createdAt, 'YYYY-MM-DD');
  return `User ${user.email} created on ${createdDate}`;
};

/**
 * Example: Using API client for inter-service communication
 */
export const initializeServiceClient = (baseURL: string) => {
  return new ApiClient(baseURL);
};

/**
 * Example: Combining multiple shared packages
 */
export const createUserProfile = async (
  userData: unknown,
  apiClient: ApiClient
): Promise<User> => {
  // Validate using shared validation
  const validatedData = userSchema.parse(userData);

  // Create user object using shared types
  const user: User = {
    id: `user-${Date.now()}`,
    email: validatedData.email,
    roles: ['user'],
    profile: {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      avatar: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Format for logging
  const logMessage = formatUserInfo(user);
  console.log(logMessage);

  return user;
};

/**
 * Example: Using shared types for service responses
 */
export const buildUserResponse = (user: User): UserServiceResponse => {
  return {
    success: true,
    user,
  };
};

export default {
  validateUserData,
  formatUserInfo,
  initializeServiceClient,
  createUserProfile,
  buildUserResponse,
};
