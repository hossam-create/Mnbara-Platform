// ============================================================
// P2P Exchange API Client - Base Configuration
// Centralized API client with error handling and interceptors
// ============================================================

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError } from '../../types/p2p-exchange.types';

// ============================================================
// API CLIENT CONFIGURATION
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_P2P_EXCHANGE_API_URL || 'http://localhost:3000/api/v1/exchange';

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle errors
    const apiError = handleApiError(error);

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Response Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        error: apiError,
      });
    }

    return Promise.reject(apiError);
  }
);

// ============================================================
// ERROR HANDLING
// ============================================================

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

function handleApiError(error: AxiosError<ApiError>): ApiErrorResponse {
  // Network error
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection.',
      statusCode: 0,
      error: 'NETWORK_ERROR',
    };
  }

  // Server error response
  const { status, data } = error.response;

  // Handle specific status codes
  switch (status) {
    case 400:
      return {
        message: data?.message || 'Invalid request. Please check your input.',
        statusCode: 400,
        error: 'BAD_REQUEST',
        details: data,
      };

    case 401:
      // Clear auth token and redirect to login
      clearAuthToken();
      return {
        message: 'Authentication required. Please log in.',
        statusCode: 401,
        error: 'UNAUTHORIZED',
      };

    case 403:
      return {
        message: 'You do not have permission to perform this action.',
        statusCode: 403,
        error: 'FORBIDDEN',
      };

    case 404:
      return {
        message: data?.message || 'Resource not found.',
        statusCode: 404,
        error: 'NOT_FOUND',
      };

    case 409:
      return {
        message: data?.message || 'Conflict. Resource already exists.',
        statusCode: 409,
        error: 'CONFLICT',
      };

    case 422:
      return {
        message: data?.message || 'Validation error. Please check your input.',
        statusCode: 422,
        error: 'VALIDATION_ERROR',
        details: data,
      };

    case 429:
      return {
        message: 'Too many requests. Please try again later.',
        statusCode: 429,
        error: 'RATE_LIMIT_EXCEEDED',
      };

    case 500:
      return {
        message: 'Server error. Please try again later.',
        statusCode: 500,
        error: 'INTERNAL_SERVER_ERROR',
      };

    case 503:
      return {
        message: 'Service temporarily unavailable. Please try again later.',
        statusCode: 503,
        error: 'SERVICE_UNAVAILABLE',
      };

    default:
      return {
        message: data?.message || 'An unexpected error occurred.',
        statusCode: status,
        error: 'UNKNOWN_ERROR',
        details: data,
      };
  }
}

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

function getAuthToken(): string | null {
  // Get token from localStorage or cookie
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

function clearAuthToken(): void {
  // Clear token from localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    // Optionally redirect to login
    // window.location.href = '/login';
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Create FormData from object (for file uploads)
 */
export function createFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return formData;
}

/**
 * Type-safe API response wrapper
 */
export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.request<ApiResponse<T>>(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default apiClient;
