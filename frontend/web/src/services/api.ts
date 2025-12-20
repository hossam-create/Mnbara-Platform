// ============================================
// 🌍 Mnbara Platform - API Service
// Requirements: 20.1, 20.2 - Performance monitoring and structured logging
// ============================================

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import * as Sentry from '@sentry/react';
import type {
  Product,
  Auction,
  Order,
  User,
  Trip,
  BuyerRequest,
  Review,
  RewardsAccount,
  ProductFilters,
  SearchResult,
  ApiResponse,
  Bid,
  Category,
  Notification,
} from '../types';
import {
  ApiError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  parseError,
} from '../utils/errors';
import { withRetry, RetryPresets } from '../utils/retry';

// Re-export error classes for convenience
export {
  ApiError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  parseError,
};

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token, request ID, and performance tracking
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add request ID for tracing
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  config.headers['X-Request-ID'] = requestId;
  
  // Add Sentry trace headers for distributed tracing
  const activeSpan = Sentry.getActiveSpan();
  if (activeSpan) {
    const traceData = Sentry.spanToTraceHeader(activeSpan);
    config.headers['sentry-trace'] = traceData;
  }
  
  // Store start time for performance tracking
  (config as InternalAxiosRequestConfig & { metadata?: { startTime: number } }).metadata = {
    startTime: performance.now(),
  };
  
  return config;
});

// Response interceptor for performance tracking
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } };
    if (config.metadata?.startTime) {
      const duration = performance.now() - config.metadata.startTime;
      const method = config.method?.toUpperCase() || 'GET';
      const url = config.url || 'unknown';
      
      // Add breadcrumb for successful API call
      Sentry.addBreadcrumb({
        category: 'http',
        message: `${method} ${url}`,
        data: {
          status_code: response.status,
          duration: `${duration.toFixed(2)}ms`,
        },
        level: 'info',
      });
      
      // Track slow requests
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
      const duration = performance.now() - config.metadata.startTime;
      const method = config.method?.toUpperCase() || 'GET';
      const url = config.url || 'unknown';
      
      // Add breadcrumb for failed API call
      Sentry.addBreadcrumb({
        category: 'http',
        message: `${method} ${url}`,
        data: {
          status_code: error.response?.status || 'network_error',
          duration: `${duration.toFixed(2)}ms`,
          error: error.message,
        },
        level: 'error',
      });
    }
    return Promise.reject(error);
  }
);

// Token refresh state to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - Handle errors with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const response = await authApi.refreshToken();
        const newToken = response.data.data?.token;

        if (newToken) {
          localStorage.setItem('auth_token', newToken);
          
          // Update the failed request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          // Process queued requests
          processQueue(null, newToken);
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed - clear session and redirect to login
        processQueue(refreshError, null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session_expired=true';
        }
        
        return Promise.reject(new AuthenticationError('Your session has expired. Please log in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    // Transform errors into custom error classes
    const transformedError = transformAxiosError(error);
    return Promise.reject(transformedError);
  }
);

/**
 * Transform Axios errors into custom error classes
 */
function transformAxiosError(error: AxiosError): Error {
  type ErrorResponseData = { code?: string; message?: string; details?: Record<string, string[]> };
  const responseData = error.response?.data as ErrorResponseData | undefined;
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new NetworkError('Request timed out. Please try again.');
    }
    return new NetworkError('Network error. Please check your internet connection.');
  }

  const { status, headers } = error.response;
  const serverCode = responseData?.code || `HTTP_${status}`;
  const serverMessage = responseData?.message;
  const details = responseData?.details;

  switch (status) {
    case 400:
      return new ApiError(
        serverMessage || 'Invalid request. Please check your input.',
        serverCode,
        status,
        details,
        false
      );

    case 401:
      return new AuthenticationError(serverMessage || 'Please log in to continue.');

    case 403:
      return new ForbiddenError(serverMessage || 'You do not have permission to perform this action.');

    case 404:
      return new NotFoundError(serverMessage || 'The requested resource was not found.');

    case 422:
      if (details) {
        return new ValidationError(details, serverMessage || 'Please check your input and try again.');
      }
      return new ApiError(
        serverMessage || 'Validation failed. Please check your input.',
        serverCode,
        status,
        details,
        false
      );

    case 429: {
      const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after'] as string, 10) : undefined;
      return new RateLimitError(retryAfter);
    }

    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(serverMessage || 'Something went wrong on our end. Please try again later.');

    default:
      return new ApiError(
        serverMessage || 'An unexpected error occurred.',
        serverCode,
        status,
        details,
        status >= 500
      );
  }
}

// ============ AUTH API ============
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/v1/auth/login', { email, password }),

  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/v1/auth/register', data),

  loginWithGoogle: (token: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/v1/auth/google', { token }),

  loginWithApple: (token: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/v1/auth/apple', { token }),

  logout: () => api.post('/v1/auth/logout'),

  refreshToken: () => api.post<ApiResponse<{ token: string }>>('/v1/auth/refresh'),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<void>>('/v1/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<void>>('/v1/auth/reset-password', { token, password }),

  getProfile: () => api.get<ApiResponse<User>>('/v1/auth/profile'),

  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<User>>('/v1/auth/profile', data),
};

// ============ PRODUCTS API ============
export const productApi = {
  list: (filters?: ProductFilters, page = 1, pageSize = 20) =>
    api.get<ApiResponse<SearchResult<Product>>>('/v1/products', {
      params: { ...filters, page, pageSize },
    }),

  search: (query: string, filters?: ProductFilters) =>
    api.get<ApiResponse<SearchResult<Product>>>('/v1/search', {
      params: { q: query, ...filters },
    }),

  get: (id: string) => api.get<ApiResponse<Product>>(`/v1/products/${id}`),
  
  // Listings endpoint (alias for products)
  getListing: (id: string) => api.get<ApiResponse<Product>>(`/v1/listings/${id}`),

  create: (data: Partial<Product>) =>
    api.post<ApiResponse<Product>>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.put<ApiResponse<Product>>(`/products/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/products/${id}`),

  uploadImages: (productId: string, files: FormData) =>
    api.post<ApiResponse<string[]>>(`/products/${productId}/images`, files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getByCategory: (categoryId: string, page = 1) =>
    api.get<ApiResponse<SearchResult<Product>>>(`/v1/products`, {
      params: { categoryId, page },
    }),

  getFeatured: () => api.get<ApiResponse<Product[]>>('/v1/products/featured'),

  getTrending: () => api.get<ApiResponse<Product[]>>('/v1/products/trending'),

  getRecommended: () => api.get<ApiResponse<Product[]>>('/v1/products/recommended'),
};

// ============ CATEGORIES API ============
export const categoryApi = {
  list: () => api.get<ApiResponse<Category[]>>('/v1/categories'),

  get: (id: string) => api.get<ApiResponse<Category>>(`/v1/categories/${id}`),

  getPopular: () => api.get<ApiResponse<Category[]>>('/v1/categories/popular'),
};

// ============ AUCTIONS API ============
export const auctionApi = {
  list: (status?: string, page = 1) =>
    api.get<ApiResponse<SearchResult<Auction>>>('/v1/auctions', {
      params: { status, page },
    }),

  get: (id: string) => api.get<ApiResponse<Auction>>(`/v1/auctions/${id}`),

  create: (data: Partial<Auction>) =>
    api.post<ApiResponse<Auction>>('/auctions', data),

  placeBid: (auctionId: string, amount: number) =>
    api.post<ApiResponse<Bid>>(`/auctions/${auctionId}/bid`, { amount }),

  getBids: (auctionId: string) =>
    api.get<ApiResponse<Bid[]>>(`/auctions/${auctionId}/bids`),

  watch: (auctionId: string) =>
    api.post<ApiResponse<void>>(`/auctions/${auctionId}/watch`),

  unwatch: (auctionId: string) =>
    api.delete<ApiResponse<void>>(`/auctions/${auctionId}/watch`),

  getMyBids: () => api.get<ApiResponse<Auction[]>>('/auctions/my-bids'),

  getEndingSoon: () => api.get<ApiResponse<Auction[]>>('/auctions/ending-soon'),

  getLive: () => api.get<ApiResponse<Auction[]>>('/auctions/live'),
};

// ============ ORDERS API ============
export const orderApi = {
  list: (status?: string, page = 1) =>
    api.get<ApiResponse<SearchResult<Order>>>('/orders', {
      params: { status, page },
    }),

  get: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),

  create: (data: { items: { productId: string; quantity: number }[]; addressId: string; deliveryMethod: string }) =>
    api.post<ApiResponse<Order>>('/orders', data),

  cancel: (id: string, reason: string) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/cancel`, { reason }),

  getTracking: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}/tracking`),

  requestReturn: (id: string, reason: string) =>
    api.post<ApiResponse<void>>(`/orders/${id}/return`, { reason }),

  // Seller endpoints
  getSellerOrders: (status?: string, page = 1) =>
    api.get<ApiResponse<SearchResult<Order>>>('/seller/orders', {
      params: { status, page },
    }),

  updateOrderStatus: (id: string, status: string) =>
    api.put<ApiResponse<Order>>(`/seller/orders/${id}/status`, { status }),
};

// ============ TRIPS API (Traveler) ============
export const tripApi = {
  list: (status?: string, page = 1) =>
    api.get<ApiResponse<SearchResult<Trip>>>('/trips', {
      params: { status, page },
    }),

  get: (id: string) => api.get<ApiResponse<Trip>>(`/trips/${id}`),

  create: (data: Partial<Trip>) =>
    api.post<ApiResponse<Trip>>('/trips', data),

  update: (id: string, data: Partial<Trip>) =>
    api.put<ApiResponse<Trip>>(`/trips/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/trips/${id}`),

  getMyTrips: () => api.get<ApiResponse<Trip[]>>('/trips/my-trips'),

  getMatchingRequests: (tripId: string) =>
    api.get<ApiResponse<BuyerRequest[]>>(`/trips/${tripId}/matching-requests`),
};

// ============ BUYER REQUESTS API ============
export const requestApi = {
  list: (page = 1) =>
    api.get<ApiResponse<SearchResult<BuyerRequest>>>('/requests', { params: { page } }),

  get: (id: string) => api.get<ApiResponse<BuyerRequest>>(`/requests/${id}`),

  create: (data: Partial<BuyerRequest>) =>
    api.post<ApiResponse<BuyerRequest>>('/requests', data),

  update: (id: string, data: Partial<BuyerRequest>) =>
    api.put<ApiResponse<BuyerRequest>>(`/requests/${id}`, data),

  cancel: (id: string) => api.delete<ApiResponse<void>>(`/requests/${id}`),

  getMyRequests: () => api.get<ApiResponse<BuyerRequest[]>>('/requests/my-requests'),

  getNearby: (lat: number, lon: number, radiusKm = 50) =>
    api.get<ApiResponse<BuyerRequest[]>>('/requests/nearby', {
      params: { lat, lon, radius_km: radiusKm },
    }),

  acceptRequest: (requestId: string, tripId: string) =>
    api.post<ApiResponse<void>>(`/requests/${requestId}/accept`, { tripId }),
};

// ============ REVIEWS API ============
export const reviewApi = {
  getForUser: (userId: string, page = 1) =>
    api.get<ApiResponse<SearchResult<Review>>>(`/reviews/user/${userId}`, {
      params: { page },
    }),

  getForProduct: (productId: string, page = 1) =>
    api.get<ApiResponse<SearchResult<Review>>>(`/reviews/product/${productId}`, {
      params: { page },
    }),

  create: (data: { orderId: string; rating: number; title: string; comment: string }) =>
    api.post<ApiResponse<Review>>('/reviews', data),

  respond: (reviewId: string, response: string) =>
    api.post<ApiResponse<Review>>(`/reviews/${reviewId}/respond`, { response }),

  markHelpful: (reviewId: string) =>
    api.post<ApiResponse<void>>(`/reviews/${reviewId}/helpful`),
};

// ============ REWARDS API ============
export const rewardsApi = {
  getAccount: () => api.get<ApiResponse<RewardsAccount>>('/rewards'),

  getHistory: (page = 1) =>
    api.get<ApiResponse<SearchResult<{ id: string; type: string; points: number; description: string; createdAt: string }>>>('/rewards/history', {
      params: { page },
    }),

  redeem: (points: number, type: 'discount' | 'wallet') =>
    api.post<ApiResponse<{ code?: string; amount?: number }>>('/rewards/redeem', { points, type }),
};

// ============ NOTIFICATIONS API ============
export const notificationApi = {
  list: (page = 1) =>
    api.get<ApiResponse<SearchResult<Notification>>>('/notifications', {
      params: { page },
    }),

  markAsRead: (id: string) =>
    api.put<ApiResponse<void>>(`/notifications/${id}/read`),

  markAllAsRead: () => api.put<ApiResponse<void>>('/notifications/read-all'),

  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
};

// ============ CART API ============
export const cartApi = {
  get: () => api.get<ApiResponse<{ items: { product: Product; quantity: number }[]; total: number }>>('/cart'),

  addItem: (productId: string, quantity = 1) =>
    api.post<ApiResponse<void>>('/cart/items', { productId, quantity }),

  updateItem: (productId: string, quantity: number) =>
    api.put<ApiResponse<void>>(`/cart/items/${productId}`, { quantity }),

  removeItem: (productId: string) =>
    api.delete<ApiResponse<void>>(`/cart/items/${productId}`),

  clear: () => api.delete<ApiResponse<void>>('/cart'),

  applyCoupon: (code: string) =>
    api.post<ApiResponse<{ discount: number }>>('/cart/coupon', { code }),
};

// ============ PAYMENT API ============
export const paymentApi = {
  // Create a payment intent for Stripe
  createPaymentIntent: (orderId: string, amount: number, currency = 'USD') =>
    api.post<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>('/payments/create-intent', {
      orderId,
      amount,
      currency,
    }),

  // Confirm a Stripe payment
  confirmStripePayment: (paymentIntentId: string, paymentMethodId: string) =>
    api.post<ApiResponse<{ success: boolean; orderId: string }>>('/payments/confirm-stripe', {
      paymentIntentId,
      paymentMethodId,
    }),

  // Create a PayPal order
  createPayPalOrder: (orderId: string, amount: number, currency = 'USD') =>
    api.post<ApiResponse<{ paypalOrderId: string; approvalUrl: string }>>('/payments/create-paypal-order', {
      orderId,
      amount,
      currency,
    }),

  // Capture a PayPal payment after approval
  capturePayPalPayment: (paypalOrderId: string) =>
    api.post<ApiResponse<{ success: boolean; orderId: string }>>('/payments/capture-paypal', {
      paypalOrderId,
    }),

  // Process wallet payment
  processWalletPayment: (orderId: string, amount: number) =>
    api.post<ApiResponse<{ success: boolean; newBalance: number }>>('/payments/wallet', {
      orderId,
      amount,
    }),

  // Get payment status
  getPaymentStatus: (orderId: string) =>
    api.get<ApiResponse<{ status: string; paidAt?: string; method?: string }>>(`/payments/status/${orderId}`),

  // Create escrow for crowdship orders
  createEscrow: (orderId: string, amount: number) =>
    api.post<ApiResponse<{ escrowId: string; status: string }>>('/payments/escrow/create', {
      orderId,
      amount,
    }),

  // Get escrow status
  getEscrowStatus: (escrowId: string) =>
    api.get<ApiResponse<{ status: 'held' | 'released' | 'refunded'; amount: number }>>(`/payments/escrow/${escrowId}`),

  // MNB Token / Blockchain payments
  logBlockchainPayment: (data: {
    orderId: string;
    transactionHash: string;
    blockNumber: number;
    from: string;
    to: string;
    mnbAmount: string;
    usdAmount: number;
  }) =>
    api.post<ApiResponse<{ success: boolean; paymentId: string }>>('/payments/blockchain/log', data),

  verifyBlockchainPayment: (transactionHash: string) =>
    api.get<ApiResponse<{ verified: boolean; confirmations: number; status: string }>>(`/payments/blockchain/verify/${transactionHash}`),

  getMNBPrice: () =>
    api.get<ApiResponse<{ price: number; currency: string; timestamp: string }>>('/payments/mnb/price'),
};

// ============ WISHLIST API ============
export const wishlistApi = {
  get: () => api.get<ApiResponse<Product[]>>('/wishlist'),

  add: (productId: string) =>
    api.post<ApiResponse<void>>('/wishlist', { productId }),

  remove: (productId: string) =>
    api.delete<ApiResponse<void>>(`/wishlist/${productId}`),

  check: (productId: string) =>
    api.get<ApiResponse<{ inWishlist: boolean }>>(`/wishlist/check/${productId}`),
};

// ============ LOCATION API ============
export const locationApi = {
  updateTravelerLocation: (lat: number, lon: number) =>
    api.post<ApiResponse<void>>('/location', { lat, lon }),

  getRecommendations: (lat: number, lon: number, radiusKm = 10) =>
    api.get<ApiResponse<Product[]>>('/recommendations', {
      params: { lat, lon, radius_km: radiusKm },
    }),
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
 * Execute a quick API call with minimal retry
 */
export async function apiWithQuickRetry<T>(apiCall: () => Promise<T>): Promise<T> {
  return withRetry(apiCall, RetryPresets.quick);
}

export default api;
