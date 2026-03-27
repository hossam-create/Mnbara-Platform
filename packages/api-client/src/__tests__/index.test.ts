/**
 * Unit Tests for Package Exports
 * 
 * Tests that all exports are properly exposed from the package
 */

import * as ApiClientModule from '../index';
import { ApiClient } from '../api-client';
import { API_ENDPOINTS } from '../endpoints';
import {
  createRequestInterceptor,
  createResponseInterceptor,
  createAuthInterceptor,
  createContentTypeInterceptor,
} from '../interceptors';

describe('Package Exports', () => {
  describe('Main Exports', () => {
    it('should export ApiClient class', () => {
      expect(ApiClientModule.ApiClient).toBeDefined();
      expect(ApiClientModule.ApiClient).toBe(ApiClient);
    });

    it('should export default ApiClient', () => {
      expect(ApiClientModule.default).toBeDefined();
      expect(ApiClientModule.default).toBe(ApiClient);
    });

    it('should export API_ENDPOINTS', () => {
      expect(ApiClientModule.API_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.API_ENDPOINTS).toBe(API_ENDPOINTS);
    });
  });

  describe('Endpoint Exports', () => {
    it('should export all endpoint groups', () => {
      expect(ApiClientModule.AUTH_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.USER_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.ORDER_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.PAYMENT_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.DELIVERY_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.PRODUCT_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.CART_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.NOTIFICATION_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.TRIP_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.CHAT_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.ADMIN_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.FILE_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.ANALYTICS_ENDPOINTS).toBeDefined();
      expect(ApiClientModule.HEALTH_ENDPOINTS).toBeDefined();
    });
  });

  describe('Interceptor Exports', () => {
    it('should export interceptor creators', () => {
      expect(ApiClientModule.createRequestInterceptor).toBeDefined();
      expect(ApiClientModule.createRequestInterceptor).toBe(createRequestInterceptor);
      
      expect(ApiClientModule.createResponseInterceptor).toBeDefined();
      expect(ApiClientModule.createResponseInterceptor).toBe(createResponseInterceptor);
      
      expect(ApiClientModule.createAuthInterceptor).toBeDefined();
      expect(ApiClientModule.createAuthInterceptor).toBe(createAuthInterceptor);
      
      expect(ApiClientModule.createContentTypeInterceptor).toBeDefined();
      expect(ApiClientModule.createContentTypeInterceptor).toBe(createContentTypeInterceptor);
    });
  });

  describe('Type Exports', () => {
    it('should export ApiClientOptions type', () => {
      // Type-only test - if this compiles, the type is exported
      const options: ApiClientModule.ApiClientOptions = {
        baseURL: 'https://api.example.com',
      };
      expect(options).toBeDefined();
    });

    it('should export InterceptorConfig type', () => {
      // Type-only test - if this compiles, the type is exported
      const config: ApiClientModule.InterceptorConfig = {
        enableLogging: true,
        enableRetry: true,
      };
      expect(config).toBeDefined();
    });

    it('should export ApiError type', () => {
      // Type-only test - if this compiles, the type is exported
      const error: ApiClientModule.ApiError = {
        message: 'Test error',
      };
      expect(error).toBeDefined();
    });
  });

  describe('Package Structure', () => {
    it('should not export internal implementation details', () => {
      // Ensure private/internal exports are not exposed
      const exports = Object.keys(ApiClientModule);
      
      // These should not be exported
      expect(exports).not.toContain('axios');
      expect(exports).not.toContain('AxiosInstance');
    });

    it('should have a clean public API', () => {
      const exports = Object.keys(ApiClientModule);
      
      // Verify expected exports exist
      const expectedExports = [
        'ApiClient',
        'default',
        'API_ENDPOINTS',
        'AUTH_ENDPOINTS',
        'USER_ENDPOINTS',
        'ORDER_ENDPOINTS',
        'PAYMENT_ENDPOINTS',
        'DELIVERY_ENDPOINTS',
        'PRODUCT_ENDPOINTS',
        'CART_ENDPOINTS',
        'NOTIFICATION_ENDPOINTS',
        'TRIP_ENDPOINTS',
        'CHAT_ENDPOINTS',
        'ADMIN_ENDPOINTS',
        'FILE_ENDPOINTS',
        'ANALYTICS_ENDPOINTS',
        'HEALTH_ENDPOINTS',
        'createRequestInterceptor',
        'createResponseInterceptor',
        'createAuthInterceptor',
        'createContentTypeInterceptor',
      ];

      expectedExports.forEach((exportName) => {
        expect(exports).toContain(exportName);
      });
    });
  });

  describe('Usage Examples', () => {
    it('should allow creating an ApiClient instance', () => {
      const client = new ApiClientModule.ApiClient({
        baseURL: 'https://api.example.com',
      });

      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should allow using endpoints', () => {
      const loginEndpoint = ApiClientModule.AUTH_ENDPOINTS.LOGIN;
      expect(loginEndpoint).toBe('/auth/login');

      const userEndpoint = ApiClientModule.USER_ENDPOINTS.GET_USER('123');
      expect(userEndpoint).toBe('/users/123');
    });

    it('should allow creating custom interceptors', () => {
      const requestInterceptor = ApiClientModule.createRequestInterceptor({
        enableLogging: false,
      });

      expect(requestInterceptor).toHaveProperty('onFulfilled');
      expect(requestInterceptor).toHaveProperty('onRejected');
    });

    it('should support full workflow', () => {
      // Create client
      const client = new ApiClientModule.ApiClient({
        baseURL: 'https://api.example.com',
        timeout: 5000,
      });

      // Use endpoints
      const endpoint = ApiClientModule.USER_ENDPOINTS.GET_CURRENT_USER;
      expect(endpoint).toBe('/users/me');

      // Add custom interceptor
      const interceptor = ApiClientModule.createAuthInterceptor(() => 'token-123');
      expect(interceptor).toBeDefined();

      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('Tree Shaking Support', () => {
    it('should support named imports', () => {
      // This test verifies that named imports work correctly
      // which is important for tree shaking
      expect(ApiClient).toBeDefined();
      expect(API_ENDPOINTS).toBeDefined();
      expect(createRequestInterceptor).toBeDefined();
    });

    it('should support default import', () => {
      expect(ApiClientModule.default).toBe(ApiClient);
    });
  });
});
