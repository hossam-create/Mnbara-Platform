import {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Extend InternalAxiosRequestConfig to include retry metadata
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date;
      retryCount?: number;
    };
  }
}

// Interceptor configuration options
export interface InterceptorConfig {
  enableLogging?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  retryableStatusCodes?: number[];
  shouldRetry?: (error: AxiosError) => boolean;
  onTokenExpired?: () => Promise<string | null>;
  onUnauthorized?: () => void;
  onError?: (error: ApiError) => void;
}

// Default configuration
const defaultConfig: InterceptorConfig = {
  enableLogging: true,
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Request Interceptor - Adds authentication, logging, and metadata
 */
export const createRequestInterceptor = (config: InterceptorConfig = {}) => {
  const mergedConfig = { ...defaultConfig, ...config };

  return {
    onFulfilled: (requestConfig: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      // Add timestamp for performance tracking
      requestConfig.metadata = {
        startTime: new Date(),
        retryCount: requestConfig.metadata?.retryCount || 0,
      };

      // Log request if enabled
      if (mergedConfig.enableLogging) {
        console.log(`[API Request] ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
        if (requestConfig.data) {
          console.log('[API Request Data]', requestConfig.data);
        }
      }

      return requestConfig;
    },

    onRejected: (error: AxiosError): Promise<never> => {
      if (mergedConfig.enableLogging) {
        console.error('[API Request Error]', error.message);
      }
      return Promise.reject(error);
    },
  };
};

/**
 * Response Interceptor - Handles success responses, errors, and retries
 */
export const createResponseInterceptor = (config: InterceptorConfig = {}) => {
  const mergedConfig = { ...defaultConfig, ...config };

  return {
    onFulfilled: (response: AxiosResponse): AxiosResponse => {
      // Calculate request duration
      const requestConfig = response.config as InternalAxiosRequestConfig;
      if (requestConfig.metadata?.startTime) {
        const duration = new Date().getTime() - requestConfig.metadata.startTime.getTime();
        
        if (mergedConfig.enableLogging) {
          console.log(
            `[API Response] ${requestConfig.method?.toUpperCase()} ${requestConfig.url} - ${response.status} (${duration}ms)`
          );
        }
      }

      return response;
    },

    onRejected: async (error: AxiosError): Promise<never> => {
      const requestConfig = error.config as InternalAxiosRequestConfig;

      // Log error details
      if (mergedConfig.enableLogging) {
        if (error.response) {
          console.error(
            `[API Error] ${error.response.status} - ${requestConfig?.method?.toUpperCase()} ${requestConfig?.url}`,
            error.response.data
          );
        } else if (error.request) {
          console.error('[API Network Error]', error.message);
        } else {
          console.error('[API Request Setup Error]', error.message);
        }
      }

      // Determine if error should be retried
      const shouldRetry = (err: AxiosError): boolean => {
        // Use custom retry logic if provided
        if (mergedConfig.shouldRetry) {
          return mergedConfig.shouldRetry(err);
        }

        // Don't retry if retry is disabled
        if (!mergedConfig.enableRetry) {
          return false;
        }

        // Don't retry if no config (can't retry without request config)
        if (!requestConfig) {
          return false;
        }

        // Check retry count
        const retryCount = requestConfig.metadata?.retryCount || 0;
        if (retryCount >= (mergedConfig.maxRetries || 3)) {
          return false;
        }

        // Network errors should be retried
        if (!err.response) {
          return true;
        }

        // Check if status code is retryable
        const status = err.response.status;
        const retryableStatusCodes = mergedConfig.retryableStatusCodes || [408, 429, 500, 502, 503, 504];
        return retryableStatusCodes.includes(status);
      };

      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;

        // Handle 401 Unauthorized
        if (status === 401) {
          if (mergedConfig.onTokenExpired && requestConfig) {
            try {
              // Attempt to refresh token
              const newToken = await mergedConfig.onTokenExpired();
              
              if (newToken) {
                // Retry request with new token
                requestConfig.headers.Authorization = `Bearer ${newToken}`;
                const axios = (await import('axios')).default;
                return axios.request(requestConfig);
              }
            } catch (refreshError) {
              // Token refresh failed, trigger unauthorized callback
              if (mergedConfig.onUnauthorized) {
                mergedConfig.onUnauthorized();
              }
            }
          } else if (mergedConfig.onUnauthorized) {
            mergedConfig.onUnauthorized();
          }
        }

        // Handle 403 Forbidden
        if (status === 403) {
          console.error('[API Error] Access forbidden - insufficient permissions');
        }

        // Handle 404 Not Found
        if (status === 404) {
          console.error('[API Error] Resource not found');
        }

        // Handle 429 Too Many Requests
        if (status === 429) {
          console.error('[API Error] Rate limit exceeded');
          
          // Check for Retry-After header
          const retryAfter = error.response.headers['retry-after'];
          if (retryAfter && requestConfig) {
            const retryCount = requestConfig.metadata?.retryCount || 0;
            
            if (retryCount < (mergedConfig.maxRetries || 3)) {
              requestConfig.metadata = {
                ...requestConfig.metadata,
                startTime: new Date(),
                retryCount: retryCount + 1,
              };

              // Parse Retry-After header (can be seconds or HTTP date)
              const delay = isNaN(Number(retryAfter)) 
                ? new Date(retryAfter).getTime() - Date.now()
                : Number(retryAfter) * 1000;

              if (mergedConfig.enableLogging) {
                console.log(
                  `[API Retry] Rate limited. Retrying after ${delay}ms`
                );
              }

              await new Promise((resolve) => setTimeout(resolve, delay));
              const axios = (await import('axios')).default;
              return axios.request(requestConfig);
            }
          }
        }
      }

      // Retry logic for retryable errors
      if (shouldRetry(error) && requestConfig) {
        const retryCount = requestConfig.metadata?.retryCount || 0;

        // Increment retry count
        requestConfig.metadata = {
          ...requestConfig.metadata,
          startTime: new Date(),
          retryCount: retryCount + 1,
        };

        // Calculate exponential backoff delay with jitter
        const baseDelay = mergedConfig.retryDelay || 1000;
        const exponentialDelay = baseDelay * Math.pow(2, retryCount);
        const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
        const delay = exponentialDelay + jitter;

        if (mergedConfig.enableLogging) {
          const errorType = error.response ? `${error.response.status} error` : 'network error';
          console.log(
            `[API Retry] ${errorType} - Attempt ${retryCount + 1}/${mergedConfig.maxRetries} after ${Math.round(delay)}ms`
          );
        }

        // Wait and retry
        await new Promise((resolve) => setTimeout(resolve, delay));
        const axios = (await import('axios')).default;
        return axios.request(requestConfig);
      }

      // Transform error before rejecting
      const apiError: ApiError = {
        message: 'An unexpected error occurred',
      };

      if (error.response) {
        apiError.status = error.response.status;
        apiError.code = (error.response.data as { code?: string })?.code;
        apiError.message = 
          (error.response.data as { message?: string })?.message || 
          error.message;
        apiError.details = error.response.data;
      } else if (error.request) {
        apiError.message = 'Network error - please check your connection';
        apiError.code = 'NETWORK_ERROR';
      } else {
        apiError.message = error.message;
        apiError.code = 'REQUEST_SETUP_ERROR';
      }

      // Call error callback if provided
      if (mergedConfig.onError) {
        mergedConfig.onError(apiError);
      }

      return Promise.reject(apiError);
    },
  };
};

/**
 * Authentication Interceptor - Adds JWT token to requests
 */
export const createAuthInterceptor = (getToken: () => string | null) => {
  return {
    onFulfilled: (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      const token = getToken();
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },

    onRejected: (error: AxiosError): Promise<never> => {
      return Promise.reject(error);
    },
  };
};

/**
 * Content Type Interceptor - Ensures proper content type headers
 */
export const createContentTypeInterceptor = () => {
  return {
    onFulfilled: (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      // Handle FormData - let browser set content type (includes boundary)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        return config;
      }

      // Set default content type if not already set
      if (config.data && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      return config;
    },

    onRejected: (error: AxiosError): Promise<never> => {
      return Promise.reject(error);
    },
  };
};

/**
 * Response Transform Interceptor - Transforms API responses
 */
export const createResponseTransformInterceptor = <T = unknown>(
  transform?: (data: unknown) => T
) => {
  return {
    onFulfilled: (response: AxiosResponse): AxiosResponse => {
      if (transform && response.data) {
        response.data = transform(response.data);
      }

      return response;
    },

    onRejected: (error: AxiosError): Promise<never> => {
      return Promise.reject(error);
    },
  };
};

/**
 * Error Transform Interceptor - Transforms API errors into consistent format
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export const createErrorTransformInterceptor = () => {
  return {
    onFulfilled: (response: AxiosResponse): AxiosResponse => {
      return response;
    },

    onRejected: (error: AxiosError): Promise<never> => {
      const apiError: ApiError = {
        message: 'An unexpected error occurred',
      };

      if (error.response) {
        apiError.status = error.response.status;
        apiError.message = 
          (error.response.data as { message?: string })?.message || 
          error.message;
        apiError.details = error.response.data;
      } else if (error.request) {
        apiError.message = 'Network error - please check your connection';
      } else {
        apiError.message = error.message;
      }

      return Promise.reject(apiError);
    },
  };
};

// Export all interceptor creators
export default {
  createRequestInterceptor,
  createResponseInterceptor,
  createAuthInterceptor,
  createContentTypeInterceptor,
  createResponseTransformInterceptor,
  createErrorTransformInterceptor,
};
