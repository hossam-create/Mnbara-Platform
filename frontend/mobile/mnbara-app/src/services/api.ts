/**
 * API Service Layer for MNBARA Mobile App
 * Provides axios instance with interceptors, token refresh, error handling,
 * offline detection, request queuing, and performance monitoring
 * Requirements: 20.1, 20.2 - Performance monitoring and structured logging
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as Sentry from '@sentry/react-native';
import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearAllSecureStorage,
} from './secureStorage';
import { useAuthStore } from '../store/authStore';
import {
  ApiError,
  NetworkError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  OfflineError,
  parseError,
  getErrorMessage,
  getHttpStatusMessage,
} from '../utils/errors';
import { offlineQueue } from '../utils/offlineQueue';
import { withRetry, RetryPresets } from '../utils/retry';

// Re-export error classes and utilities
export {
  ApiError,
  NetworkError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  OfflineError,
  parseError,
  getErrorMessage,
  getHttpStatusMessage,
};

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api'
  : 'https://api.mnbara.com/api';

const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor - add auth token and performance tracking
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add request ID for tracing
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (config.headers) {
        config.headers['X-Request-ID'] = requestId;
      }
      
      // Store start time for performance tracking
      (config as InternalAxiosRequestConfig & { metadata?: { startTime: number } }).metadata = {
        startTime: Date.now(),
      };
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor for performance tracking
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const config = response.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } };
      if (config.metadata?.startTime) {
        const duration = Date.now() - config.metadata.startTime;
        const method = config.method?.toUpperCase() || 'GET';
        const url = config.url || 'unknown';
        
        // Add breadcrumb for successful API call
        Sentry.addBreadcrumb({
          category: 'http',
          message: `${method} ${url}`,
          data: {
            status_code: response.status,
            duration: `${duration}ms`,
          },
          level: 'info',
        });
        
        // Track slow requests (> 3 seconds)
        if (duration > 3000) {
          Sentry.captureMessage(`Slow API request: ${method} ${url}`, {
            level: 'warning',
            extra: {
              duration,
              status: response.status,
            },
          });
        }
      }
      return response;
    },
    (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } } | undefined;
      if (config?.metadata?.startTime) {
        const duration = Date.now() - config.metadata.startTime;
        const method = config.method?.toUpperCase() || 'GET';
        const url = config.url || 'unknown';
        
        // Add breadcrumb for failed API call
        Sentry.addBreadcrumb({
          category: 'http',
          message: `${method} ${url}`,
          data: {
            status_code: error.response?.status || 'network_error',
            duration: `${duration}ms`,
            error: error.message,
          },
          level: 'error',
        });
      }
      return Promise.reject(error);
    }
  );

  // Request interceptor - check offline status
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Check if offline and queue non-GET requests
      if (!offlineQueue.getIsOnline() && config.method?.toUpperCase() !== 'GET') {
        // Queue the request for later
        await offlineQueue.enqueue({
          method: config.method?.toUpperCase() as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
          url: config.url || '',
          data: config.data,
          headers: config.headers as Record<string, string>,
          priority: 'normal',
        });
        throw new OfflineError('Request queued. Will retry when online.');
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Handle network errors / offline
      if (!error.response) {
        if (!offlineQueue.getIsOnline()) {
          throw new OfflineError();
        }
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw new NetworkError('Request timed out. Please try again.');
        }
        throw new NetworkError();
      }

      type ErrorResponseData = { code?: string; message?: string; details?: Record<string, string[]> };
      const { status, headers } = error.response;
      const responseData = error.response.data as ErrorResponseData | undefined;

      // Handle 401 - attempt token refresh
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await getRefreshToken();
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { token, refreshToken: newRefreshToken } = response.data;
            await storeTokens(token, newRefreshToken);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - logout user
          await clearAllSecureStorage();
          useAuthStore.getState().logout();
          throw new AuthenticationError();
        }
      }

      // Transform to appropriate error type
      const transformedError = transformError(status, responseData, headers);
      throw transformedError;
    }
  );

  return client;
};

/**
 * Transform HTTP errors into appropriate error classes
 */
function transformError(
  status: number,
  data: { code?: string; message?: string; details?: Record<string, string[]> } | undefined,
  headers: Record<string, unknown>
): Error {
  const serverCode = data?.code || `HTTP_${status}`;
  const serverMessage = data?.message;
  const details = data?.details;

  switch (status) {
    case 400:
      return new ApiError(
        serverMessage || 'Invalid request.',
        serverCode,
        status,
        details,
        false
      );

    case 401:
      return new AuthenticationError(serverMessage || 'Please log in to continue.');

    case 403:
      return new ApiError(
        serverMessage || 'You do not have permission.',
        serverCode,
        status,
        details,
        false
      );

    case 404:
      return new ApiError(
        serverMessage || 'Not found.',
        serverCode,
        status,
        details,
        false
      );

    case 422:
      if (details) {
        return new ValidationError(details, serverMessage || 'Please check your input.');
      }
      return new ApiError(
        serverMessage || 'Validation failed.',
        serverCode,
        status,
        details,
        false
      );

    case 429: {
      const retryAfter = headers['retry-after']
        ? parseInt(headers['retry-after'] as string, 10)
        : undefined;
      return new RateLimitError(retryAfter);
    }

    case 500:
    case 502:
    case 503:
    case 504:
      return new ApiError(
        serverMessage || 'Server error. Please try again.',
        serverCode,
        status,
        details,
        true // Retryable
      );

    default:
      return new ApiError(
        serverMessage || getHttpStatusMessage(status),
        serverCode,
        status,
        details,
        status >= 500
      );
  }
}

// API client instance
export const apiClient = createApiClient();

// Auth Service
export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await clearAllSecureStorage();
      useAuthStore.getState().logout();
    }
  },

  refreshToken: async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  validateToken: async (token: string) => {
    const response = await apiClient.post('/auth/validate', { token });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  verifyMfa: async (email: string, code: string) => {
    const response = await apiClient.post('/auth/verify-mfa', { email, code });
    return response.data;
  },

  enableMfa: async () => {
    const response = await apiClient.post('/auth/enable-mfa');
    return response.data;
  },

  disableMfa: async (code: string) => {
    const response = await apiClient.post('/auth/disable-mfa', { code });
    return response.data;
  },
};

// Products Service
export const productsService = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    sortBy?: string;
  }) => {
    // Use search endpoint if search query is provided, otherwise use products endpoint
    const endpoint = params?.search ? '/v1/search' : '/v1/products';
    const response = await apiClient.get(endpoint, { 
      params: params?.search ? { q: params.search, ...params } : params 
    });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await apiClient.get(`/v1/products/${id}`);
    return response.data;
  },

  searchProducts: async (query: string, filters?: Record<string, any>) => {
    const response = await apiClient.get('/v1/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  },

  getRecommendations: async () => {
    const response = await apiClient.get('/v1/products/recommendations');
    return response.data;
  },
};

// Auctions Service
export const auctionsService = {
  getAuctions: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'ending_soon' | 'ended';
    category?: string;
  }) => {
    const response = await apiClient.get('/auctions', { params });
    return response.data;
  },

  getAuction: async (id: string) => {
    const response = await apiClient.get(`/auctions/${id}`);
    return response.data;
  },

  placeBid: async (auctionId: string, amount: number) => {
    const response = await apiClient.post(`/auctions/${auctionId}/bids`, { amount });
    return response.data;
  },

  setProxyBid: async (auctionId: string, maxAmount: number) => {
    const response = await apiClient.post(`/auctions/${auctionId}/proxy-bid`, { maxAmount });
    return response.data;
  },

  watchAuction: async (auctionId: string) => {
    const response = await apiClient.post(`/auctions/${auctionId}/watch`);
    return response.data;
  },

  unwatchAuction: async (auctionId: string) => {
    const response = await apiClient.delete(`/auctions/${auctionId}/watch`);
    return response.data;
  },
};

// Orders Service
export const ordersService = {
  getOrders: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getOrder: async (id: string) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: {
    listingId: string;
    shippingAddressId: string;
    paymentMethodId: string;
    useEscrow?: boolean;
  }) => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  cancelOrder: async (id: string, reason: string) => {
    const response = await apiClient.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  confirmDelivery: async (id: string) => {
    const response = await apiClient.post(`/orders/${id}/confirm-delivery`);
    return response.data;
  },
};

// Traveler Service
export const travelerService = {
  getTrips: async () => {
    const response = await apiClient.get('/traveler/trips');
    return response.data;
  },

  getTrip: async (id: string) => {
    const response = await apiClient.get(`/traveler/trips/${id}`);
    return response.data;
  },

  createTrip: async (data: {
    origin: string;
    destination: string;
    departAt: string;
    arriveAt: string;
    capacityKg: number;
  }) => {
    const response = await apiClient.post('/traveler/trips', data);
    return response.data;
  },

  updateTrip: async (id: string, data: Partial<{
    origin: string;
    destination: string;
    departAt: string;
    arriveAt: string;
    capacityKg: number;
    status: string;
  }>) => {
    const response = await apiClient.patch(`/traveler/trips/${id}`, data);
    return response.data;
  },

  getNearbyRequests: async (lat: number, lon: number, radiusKm: number = 50) => {
    const response = await apiClient.get('/traveler/nearby-requests', {
      params: { lat, lon, radius: radiusKm },
    });
    return response.data;
  },

  acceptRequest: async (requestId: string, tripId: string) => {
    const response = await apiClient.post('/traveler/matches', { requestId, tripId });
    return response.data;
  },

  getDeliveries: async () => {
    const response = await apiClient.get('/traveler/deliveries');
    return response.data;
  },

  updateDeliveryStatus: async (
    matchId: string,
    status: 'picked_up' | 'delivered',
    evidence?: { photoUrl: string; location?: { lat: number; lon: number } }
  ) => {
    const response = await apiClient.patch(`/traveler/deliveries/${matchId}`, {
      status,
      evidence,
    });
    return response.data;
  },

  getEarnings: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/traveler/earnings', { params });
    return response.data;
  },

  updateLocation: async (lat: number, lon: number) => {
    const response = await apiClient.post('/traveler/location', { lat, lon });
    return response.data;
  },
};

// Wallet Service
export const walletService = {
  getBalance: async () => {
    const response = await apiClient.get('/wallet/balance');
    return response.data;
  },

  getTransactions: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/wallet/transactions', { params });
    return response.data;
  },

  addFunds: async (amount: number, paymentMethodId: string) => {
    const response = await apiClient.post('/wallet/add-funds', { amount, paymentMethodId });
    return response.data;
  },

  withdraw: async (amount: number, bankAccountId: string) => {
    const response = await apiClient.post('/wallet/withdraw', { amount, bankAccountId });
    return response.data;
  },
};

// Rewards Service
export const rewardsService = {
  getBalance: async () => {
    const response = await apiClient.get('/rewards/balance');
    return response.data;
  },

  getHistory: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/rewards/history', { params });
    return response.data;
  },

  getRedemptionOptions: async () => {
    const response = await apiClient.get('/rewards/redemption-options');
    return response.data;
  },

  redeem: async (optionId: string, points: number) => {
    const response = await apiClient.post('/rewards/redeem', { optionId, points });
    return response.data;
  },

  getLeaderboard: async () => {
    const response = await apiClient.get('/rewards/leaderboard');
    return response.data;
  },
};

// Notifications Service
export const notificationsService = {
  getNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.post('/notifications/mark-all-read');
    return response.data;
  },

  registerDevice: async (token: string, platform: 'ios' | 'android') => {
    const response = await apiClient.post('/notifications/register-device', { token, platform });
    return response.data;
  },

  unregisterDevice: async (token: string) => {
    const response = await apiClient.delete('/notifications/unregister-device', {
      data: { token },
    });
    return response.data;
  },

  getPreferences: async () => {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (preferences: Record<string, boolean>) => {
    const response = await apiClient.patch('/notifications/preferences', preferences);
    return response.data;
  },
};

// User Service
export const userService = {
  getProfile: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
  }) => {
    const response = await apiClient.patch('/users/me', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/users/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  getAddresses: async () => {
    const response = await apiClient.get('/users/addresses');
    return response.data;
  },

  addAddress: async (address: {
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
  }) => {
    const response = await apiClient.post('/users/addresses', address);
    return response.data;
  },

  updateAddress: async (id: string, address: Partial<{
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>) => {
    const response = await apiClient.patch(`/users/addresses/${id}`, address);
    return response.data;
  },

  deleteAddress: async (id: string) => {
    const response = await apiClient.delete(`/users/addresses/${id}`);
    return response.data;
  },
};

// KYC Service
export const kycService = {
  getStatus: async () => {
    const response = await apiClient.get('/kyc/status');
    return response.data;
  },

  submitDocuments: async (data: {
    documentType: 'passport' | 'drivers_license' | 'national_id';
    frontImageUrl: string;
    backImageUrl?: string;
    selfieUrl: string;
  }) => {
    const response = await apiClient.post('/kyc/submit', data);
    return response.data;
  },

  uploadDocument: async (formData: FormData) => {
    const response = await apiClient.post('/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ============ RETRY-ENABLED API UTILITIES ============

/**
 * Execute an API call with automatic retry for transient failures
 */
export async function apiWithRetry<T>(
  apiCall: () => Promise<T>,
  options?: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  }
): Promise<T> {
  return withRetry(apiCall, {
    ...RetryPresets.standard,
    maxRetries: options?.maxRetries,
    onRetry: options?.onRetry
      ? (attempt, error) => options.onRetry!(attempt, error)
      : undefined,
  });
}

/**
 * Execute a critical API call with aggressive retry
 */
export async function apiWithAggressiveRetry<T>(
  apiCall: () => Promise<T>,
  onRetry?: (attempt: number, error: unknown) => void
): Promise<T> {
  return withRetry(apiCall, {
    ...RetryPresets.aggressive,
    onRetry: onRetry ? (attempt, error) => onRetry(attempt, error) : undefined,
  });
}

/**
 * Get offline queue instance for monitoring
 */
export function getOfflineQueue() {
  return offlineQueue;
}

/**
 * Check if device is currently online
 */
export function isOnline(): boolean {
  return offlineQueue.getIsOnline();
}

/**
 * Subscribe to online/offline status changes
 */
export function subscribeToNetworkStatus(listener: (isOnline: boolean) => void): () => void {
  return offlineQueue.subscribe(listener);
}

export default apiClient;
