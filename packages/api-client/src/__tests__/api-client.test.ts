/**
 * Unit Tests for ApiClient
 * 
 * Tests all HTTP methods, interceptor management, and authentication handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ApiClient, ApiClientOptions } from '../api-client';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let mockAxios: MockAdapter;
  const baseURL = 'https://api.example.com';

  beforeEach(() => {
    apiClient = new ApiClient({ baseURL });
    mockAxios = new MockAdapter(apiClient.getAxiosInstance());
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('Constructor', () => {
    it('should create an instance with default options', () => {
      const client = new ApiClient({ baseURL });
      expect(client).toBeInstanceOf(ApiClient);
      expect(client.getAxiosInstance().defaults.baseURL).toBe(baseURL);
    });

    it('should create an instance with custom timeout', () => {
      const timeout = 5000;
      const client = new ApiClient({ baseURL, timeout });
      expect(client.getAxiosInstance().defaults.timeout).toBe(timeout);
    });

    it('should create an instance with custom headers', () => {
      const headers = { 'X-Custom-Header': 'test-value' };
      const client = new ApiClient({ baseURL, headers });
      expect(client.getAxiosInstance().defaults.headers['X-Custom-Header']).toBe('test-value');
    });

    it('should set default Content-Type header', () => {
      const client = new ApiClient({ baseURL });
      expect(client.getAxiosInstance().defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should setup interceptors on initialization', () => {
      const client = new ApiClient({ baseURL });
      const axiosInstance = client.getAxiosInstance();
      
      // Check that interceptors are registered
      expect(axiosInstance.interceptors.request['handlers'].length).toBeGreaterThan(0);
      expect(axiosInstance.interceptors.response['handlers'].length).toBeGreaterThan(0);
    });
  });

  describe('HTTP Methods', () => {
    describe('GET', () => {
      it('should make a GET request and return data', async () => {
        const responseData = { id: 1, name: 'Test' };
        mockAxios.onGet('/users/1').reply(200, responseData);

        const result = await apiClient.get('/users/1');
        expect(result).toEqual(responseData);
      });

      it('should pass query parameters', async () => {
        const responseData = { users: [] };
        mockAxios.onGet('/users', { params: { page: 1, limit: 10 } }).reply(200, responseData);

        const result = await apiClient.get('/users', { params: { page: 1, limit: 10 } });
        expect(result).toEqual(responseData);
      });

      it('should handle GET request errors', async () => {
        mockAxios.onGet('/users/999').reply(404, { message: 'User not found' });

        await expect(apiClient.get('/users/999')).rejects.toThrow();
      });
    });

    describe('POST', () => {
      it('should make a POST request with data', async () => {
        const requestData = { name: 'New User', email: 'user@example.com' };
        const responseData = { id: 1, ...requestData };
        mockAxios.onPost('/users', requestData).reply(201, responseData);

        const result = await apiClient.post('/users', requestData);
        expect(result).toEqual(responseData);
      });

      it('should make a POST request without data', async () => {
        const responseData = { success: true };
        mockAxios.onPost('/logout').reply(200, responseData);

        const result = await apiClient.post('/logout');
        expect(result).toEqual(responseData);
      });

      it('should handle POST request errors', async () => {
        const requestData = { email: 'invalid' };
        mockAxios.onPost('/users', requestData).reply(400, { message: 'Invalid email' });

        await expect(apiClient.post('/users', requestData)).rejects.toThrow();
      });
    });

    describe('PUT', () => {
      it('should make a PUT request with data', async () => {
        const requestData = { name: 'Updated User' };
        const responseData = { id: 1, ...requestData };
        mockAxios.onPut('/users/1', requestData).reply(200, responseData);

        const result = await apiClient.put('/users/1', requestData);
        expect(result).toEqual(responseData);
      });

      it('should handle PUT request errors', async () => {
        mockAxios.onPut('/users/999').reply(404, { message: 'User not found' });

        await expect(apiClient.put('/users/999', {})).rejects.toThrow();
      });
    });

    describe('PATCH', () => {
      it('should make a PATCH request with data', async () => {
        const requestData = { name: 'Patched User' };
        const responseData = { id: 1, name: 'Patched User', email: 'user@example.com' };
        mockAxios.onPatch('/users/1', requestData).reply(200, responseData);

        const result = await apiClient.patch('/users/1', requestData);
        expect(result).toEqual(responseData);
      });

      it('should handle PATCH request errors', async () => {
        mockAxios.onPatch('/users/999').reply(404, { message: 'User not found' });

        await expect(apiClient.patch('/users/999', {})).rejects.toThrow();
      });
    });

    describe('DELETE', () => {
      it('should make a DELETE request', async () => {
        const responseData = { success: true };
        mockAxios.onDelete('/users/1').reply(200, responseData);

        const result = await apiClient.delete('/users/1');
        expect(result).toEqual(responseData);
      });

      it('should handle DELETE request errors', async () => {
        mockAxios.onDelete('/users/999').reply(404, { message: 'User not found' });

        await expect(apiClient.delete('/users/999')).rejects.toThrow();
      });
    });
  });

  describe('Authentication', () => {
    describe('setAuthToken', () => {
      it('should set Authorization header', () => {
        const token = 'test-token-123';
        apiClient.setAuthToken(token);

        const headers = apiClient.getAxiosInstance().defaults.headers.common;
        expect(headers['Authorization']).toBe(`Bearer ${token}`);
      });

      it('should update Authorization header when called multiple times', () => {
        apiClient.setAuthToken('token-1');
        apiClient.setAuthToken('token-2');

        const headers = apiClient.getAxiosInstance().defaults.headers.common;
        expect(headers['Authorization']).toBe('Bearer token-2');
      });
    });

    describe('clearAuthToken', () => {
      it('should remove Authorization header', () => {
        apiClient.setAuthToken('test-token');
        apiClient.clearAuthToken();

        const headers = apiClient.getAxiosInstance().defaults.headers.common;
        expect(headers['Authorization']).toBeUndefined();
      });

      it('should not throw error when clearing non-existent token', () => {
        expect(() => apiClient.clearAuthToken()).not.toThrow();
      });
    });

    describe('getToken option', () => {
      it('should use getToken function to add auth header', async () => {
        const token = 'dynamic-token-123';
        const getToken = jest.fn(() => token);
        
        const client = new ApiClient({ baseURL, getToken });
        const mockAdapter = new MockAdapter(client.getAxiosInstance());
        
        mockAdapter.onGet('/protected').reply((config) => {
          expect(config.headers?.Authorization).toBe(`Bearer ${token}`);
          return [200, { success: true }];
        });

        await client.get('/protected');
        expect(getToken).toHaveBeenCalled();
      });

      it('should not add auth header when getToken returns null', async () => {
        const getToken = jest.fn(() => null);
        
        const client = new ApiClient({ baseURL, getToken });
        const mockAdapter = new MockAdapter(client.getAxiosInstance());
        
        mockAdapter.onGet('/public').reply((config) => {
          expect(config.headers?.Authorization).toBeUndefined();
          return [200, { success: true }];
        });

        await client.get('/public');
        expect(getToken).toHaveBeenCalled();
      });
    });
  });

  describe('Interceptor Management', () => {
    describe('addRequestInterceptor', () => {
      it('should add a custom request interceptor', async () => {
        const onFulfilled = jest.fn((config) => {
          config.headers['X-Custom'] = 'test';
          return config;
        });

        apiClient.addRequestInterceptor(onFulfilled);
        mockAxios.onGet('/test').reply(200, {});

        await apiClient.get('/test');
        expect(onFulfilled).toHaveBeenCalled();
      });

      it('should return interceptor ID', () => {
        const interceptorId = apiClient.addRequestInterceptor((config) => config);
        expect(typeof interceptorId).toBe('number');
      });

      it('should handle request interceptor errors', async () => {
        const onRejected = jest.fn((error) => Promise.reject(error));
        
        apiClient.addRequestInterceptor(undefined, onRejected);
        mockAxios.onGet('/test').networkError();

        await expect(apiClient.get('/test')).rejects.toThrow();
      });
    });

    describe('addResponseInterceptor', () => {
      it('should add a custom response interceptor', async () => {
        const onFulfilled = jest.fn((response) => {
          response.data.intercepted = true;
          return response;
        });

        apiClient.addResponseInterceptor(onFulfilled);
        mockAxios.onGet('/test').reply(200, { data: 'test' });

        const result = await apiClient.get('/test');
        expect(onFulfilled).toHaveBeenCalled();
        expect(result.intercepted).toBe(true);
      });

      it('should return interceptor ID', () => {
        const interceptorId = apiClient.addResponseInterceptor((response) => response);
        expect(typeof interceptorId).toBe('number');
      });

      it('should handle response interceptor errors', async () => {
        const onRejected = jest.fn((error) => Promise.reject(error));
        
        apiClient.addResponseInterceptor(undefined, onRejected);
        mockAxios.onGet('/test').reply(500);

        await expect(apiClient.get('/test')).rejects.toThrow();
        expect(onRejected).toHaveBeenCalled();
      });
    });

    describe('removeRequestInterceptor', () => {
      it('should remove a request interceptor', async () => {
        const onFulfilled = jest.fn((config) => config);
        const interceptorId = apiClient.addRequestInterceptor(onFulfilled);

        mockAxios.onGet('/test').reply(200, {});
        await apiClient.get('/test');
        expect(onFulfilled).toHaveBeenCalledTimes(1);

        apiClient.removeRequestInterceptor(interceptorId);
        await apiClient.get('/test');
        expect(onFulfilled).toHaveBeenCalledTimes(1); // Not called again
      });
    });

    describe('removeResponseInterceptor', () => {
      it('should remove a response interceptor', async () => {
        const onFulfilled = jest.fn((response) => response);
        const interceptorId = apiClient.addResponseInterceptor(onFulfilled);

        mockAxios.onGet('/test').reply(200, {});
        await apiClient.get('/test');
        expect(onFulfilled).toHaveBeenCalledTimes(1);

        apiClient.removeResponseInterceptor(interceptorId);
        await apiClient.get('/test');
        expect(onFulfilled).toHaveBeenCalledTimes(1); // Not called again
      });
    });
  });

  describe('getAxiosInstance', () => {
    it('should return the underlying Axios instance', () => {
      const instance = apiClient.getAxiosInstance();
      expect(instance).toBeDefined();
      expect(instance.defaults.baseURL).toBe(baseURL);
    });

    it('should allow direct access to Axios features', () => {
      const instance = apiClient.getAxiosInstance();
      expect(instance.interceptors).toBeDefined();
      expect(instance.defaults).toBeDefined();
    });
  });

  describe('Request Configuration', () => {
    it('should pass custom headers in request config', async () => {
      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.['X-Custom-Header']).toBe('custom-value');
        return [200, {}];
      });

      await apiClient.get('/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });
    });

    it('should pass custom timeout in request config', async () => {
      mockAxios.onGet('/test').reply((config) => {
        expect(config.timeout).toBe(5000);
        return [200, {}];
      });

      await apiClient.get('/test', { timeout: 5000 });
    });

    it('should handle request cancellation', async () => {
      const controller = new AbortController();
      
      mockAxios.onGet('/test').reply(() => {
        controller.abort();
        return [200, {}];
      });

      await expect(
        apiClient.get('/test', { signal: controller.signal })
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAxios.onGet('/test').networkError();

      await expect(apiClient.get('/test')).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mockAxios.onGet('/test').timeout();

      await expect(apiClient.get('/test')).rejects.toThrow();
    });

    it('should handle 4xx client errors', async () => {
      mockAxios.onGet('/test').reply(400, { message: 'Bad Request' });

      await expect(apiClient.get('/test')).rejects.toThrow();
    });

    it('should handle 5xx server errors', async () => {
      mockAxios.onGet('/test').reply(500, { message: 'Internal Server Error' });

      await expect(apiClient.get('/test')).rejects.toThrow();
    });
  });

  describe('TypeScript Generics', () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    it('should support typed GET requests', async () => {
      const user: User = { id: 1, name: 'Test', email: 'test@example.com' };
      mockAxios.onGet('/users/1').reply(200, user);

      const result = await apiClient.get<User>('/users/1');
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test');
      expect(result.email).toBe('test@example.com');
    });

    it('should support typed POST requests', async () => {
      const newUser = { name: 'New User', email: 'new@example.com' };
      const createdUser: User = { id: 2, ...newUser };
      mockAxios.onPost('/users').reply(201, createdUser);

      const result = await apiClient.post<User>('/users', newUser);
      expect(result.id).toBe(2);
      expect(result.name).toBe('New User');
    });
  });

  describe('Interceptor Configuration', () => {
    it('should accept interceptor config in constructor', () => {
      const interceptorConfig = {
        enableLogging: false,
        enableRetry: false,
      };

      const client = new ApiClient({
        baseURL,
        interceptorConfig,
      });

      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should use custom retry configuration', () => {
      const interceptorConfig = {
        enableRetry: true,
        maxRetries: 5,
        retryDelay: 2000,
      };

      const client = new ApiClient({
        baseURL,
        interceptorConfig,
      });

      expect(client).toBeInstanceOf(ApiClient);
    });
  });
});
