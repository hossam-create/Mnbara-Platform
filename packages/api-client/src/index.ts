export { ApiClient } from './api-client';
export type { ApiClientOptions } from './api-client';

// Export all endpoint definitions
export {
  API_ENDPOINTS,
  AUTH_ENDPOINTS,
  USER_ENDPOINTS,
  ORDER_ENDPOINTS,
  PAYMENT_ENDPOINTS,
  DELIVERY_ENDPOINTS,
  PRODUCT_ENDPOINTS,
  CART_ENDPOINTS,
  NOTIFICATION_ENDPOINTS,
  TRIP_ENDPOINTS,
  CHAT_ENDPOINTS,
  ADMIN_ENDPOINTS,
  FILE_ENDPOINTS,
  ANALYTICS_ENDPOINTS,
  HEALTH_ENDPOINTS,
} from './endpoints';

// Default export
export { default as endpoints } from './endpoints';

// Export interceptor utilities
export {
  createRequestInterceptor,
  createResponseInterceptor,
  createAuthInterceptor,
  createContentTypeInterceptor,
  createResponseTransformInterceptor,
  createErrorTransformInterceptor,
} from './interceptors';

export type {
  InterceptorConfig,
  ApiError,
} from './interceptors';

// Export all type definitions
export type * from './types';
