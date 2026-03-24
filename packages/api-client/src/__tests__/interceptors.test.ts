import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  createRequestInterceptor,
  createResponseInterceptor,
  createAuthInterceptor,
  createContentTypeInterceptor,
  createResponseTransformInterceptor,
  createErrorTransformInterceptor,
  ApiError,
} from '../interceptors';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  jest.clearAllMocks();
});

describe('Request Interceptor', () => {
  it('should add metadata with start time to request config', () => {
    const interceptor = createRequestInterceptor({ enableLogging: false });
    const config: InternalAxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {} as any,
    } as InternalAxiosRequestConfig;

    const result = interceptor.onFulfilled(config);

    expect(result.metadata).toBeDefined();
    expect(result.metadata?.startTime).toBeInstanceOf(Date);
    expect(result.metadata?.retryCount).toBe(0);
  });

  it('should log request when logging is enabled', () => {
    const interceptor = createRequestInterceptor({ enableLogging: true });
    const config: InternalAxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {} as any,
      data: { test: 'data' },
    } as InternalAxiosRequestConfig;

    interceptor.onFulfilled(config);

    expect(console.log).toHaveBeenCalledWith('[API Request] GET /test');
    expect(console.log).toHaveBeenCalledWith('[API Request Data]', { test: 'data' });
  });

  it('should not log request when logging is disabled', () => {
    const interceptor = createRequestInterceptor({ enableLogging: false });
    const config: InternalAxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {} as any,
    } as InternalAxiosRequestConfig;

    interceptor.onFulfilled(config);

    expect(console.log).not.toHaveBeenCalled();
  });

  it('should handle request errors', async () => {
    const interceptor = createRequestInterceptor({ enableLogging: true });
    const error = new Error('Request setup error') as AxiosError;

    await expect(interceptor.onRejected(error)).rejects.toThrow('Request setup error');
    expect(console.error).toHaveBeenCalledWith('[API Request Error]', 'Request setup error');
  });
});

describe('Response Interceptor', () => {
  it('should log response time when logging is enabled', () => {
    const interceptor = createResponseInterceptor({ enableLogging: true });
    const startTime = new Date(Date.now() - 100); // 100ms ago
    
    const response: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        url: '/test',
        method: 'GET',
        headers: {} as any,
        metadata: { startTime },
      } as InternalAxiosRequestConfig,
    } as AxiosResponse;

    const result = interceptor.onFulfilled(response);

    expect(result).toBe(response);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[API Response] GET /test - 200')
    );
  });

  it('should handle 401 errors and call onUnauthorized', async () => {
    const onUnauthorized = jest.fn();
    const interceptor = createResponseInterceptor({
      enableLogging: false,
      onUnauthorized,
    });

    const error: AxiosError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
        statusText: 'Unauthorized',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      },
      config: {
        url: '/test',
        method: 'GET',
        headers: {} as any,
      } as InternalAxiosRequestConfig,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Request failed with status code 401',
    };

    await expect(interceptor.onRejected(error)).rejects.toBeDefined();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('should log different error types', async () => {
    const interceptor = createResponseInterceptor({ enableLogging: true });

    // Server error
    const serverError: AxiosError = {
      response: {
        status: 500,
        data: { message: 'Server error' },
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      },
      config: {
        url: '/test',
        method: 'GET',
        headers: {} as any,
      } as InternalAxiosRequestConfig,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Request failed with status code 500',
    };

    await expect(interceptor.onRejected(serverError)).rejects.toBeDefined();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[API Error] 500'),
      expect.anything()
    );
  });

  it('should handle network errors', async () => {
    const interceptor = createResponseInterceptor({
      enableLogging: true,
      enableRetry: false,
    });

    const networkError: AxiosError = {
      request: {},
      config: {
        url: '/test',
        method: 'GET',
        headers: {} as any,
      } as InternalAxiosRequestConfig,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Network Error',
    };

    await expect(interceptor.onRejected(networkError)).rejects.toBeDefined();
    expect(console.error).toHaveBeenCalledWith('[API Network Error]', 'Network Error');
  });
});

describe('Auth Interceptor', () => {
  it('should add authorization header when token is available', () => {
    const getToken = jest.fn(() => 'test-token-123');
    const interceptor = createAuthInterceptor(getToken);
    
    const config: InternalAxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {} as any,
    } as InternalAxiosRequestConfig;

    const result = interceptor.onFulfilled(config);

    expect(getToken).toHaveBeenCalled();
    expect(result.headers.Authorization).toBe('Bearer test-token-123');
  });

  it('should not add authorization header when token is null', () => {
    const getToken = jest.fn(() => null);
    const interceptor = createAuthInterceptor(getToken);
    
    const config: InternalAxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {} as any,
    } as InternalAxiosRequestConfig;

    const result = interceptor.onFulfilled(config);

    expect(getToken).toHaveBeenCalled();
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should handle errors', async () => {
    const getToken = jest.fn(() => 'test-token');
    const interceptor = createAuthInterceptor(getToken);
    const error = new Error('Auth error') as AxiosError;

    await expect(interceptor.onRejected(error)).rejects.toThrow('Auth error');
  });
});

describe('Content Type Interceptor', () => {
  it('should set default content type for JSON data', () => {
    const interceptor = createContentTypeInterceptor();
    const config: InternalAxiosRequestConfig = {
      url: '/test',
      method: 'POST',
      headers: {} as any,
      data: { test: 'data' },
    } as InternalAxiosRequestConfig;

    const result = interceptor.onFulfilled(config);

    expect(result.headers['Content-Type']).toBe('application/json');
  });

  it('should not override existing content type', () => {
    const interceptor = createContentTypeInterceptor();
    const config: InternalAxiosRequestConfig = {
      url: '/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      } as any,
      data: '<xml></xml>',
    } as InternalAxiosRequestConfig;

    const result = interceptor.onFulfilled(config);

    expect(result.headers['Content-Type']).toBe('application/xml');
  });

  it('should remove content type for FormData', () => {
    const interceptor = createContentTypeInterceptor();
    const formData = new FormData();
    formData.append('file', 'test');

    const config: InternalAxiosRequestConfig = {
      url: '/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      } as any,
      data: formData,
    } as InternalAxiosRequestConfig;

    const result = interceptor.onFulfilled(config);

    expect(result.headers['Content-Type']).toBeUndefined();
  });
});

describe('Response Transform Interceptor', () => {
  it('should transform response data', () => {
    const transform = jest.fn((data: any) => ({
      ...data,
      transformed: true,
    }));

    const interceptor = createResponseTransformInterceptor(transform);
    const response: AxiosResponse = {
      data: { original: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    } as AxiosResponse;

    const result = interceptor.onFulfilled(response);

    expect(transform).toHaveBeenCalledWith({ original: true });
    expect(result.data).toEqual({ original: true, transformed: true });
  });

  it('should not transform when no transformer provided', () => {
    const interceptor = createResponseTransformInterceptor();
    const response: AxiosResponse = {
      data: { original: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    } as AxiosResponse;

    const result = interceptor.onFulfilled(response);

    expect(result.data).toEqual({ original: true });
  });
});

describe('Error Transform Interceptor', () => {
  it('should transform server errors', async () => {
    const interceptor = createErrorTransformInterceptor();
    const error: AxiosError = {
      response: {
        status: 400,
        data: { message: 'Bad request' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      },
      config: {} as InternalAxiosRequestConfig,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Request failed',
    };

    try {
      await interceptor.onRejected(error);
    } catch (err) {
      const apiError = err as ApiError;
      expect(apiError.status).toBe(400);
      expect(apiError.message).toBe('Bad request');
      expect(apiError.details).toEqual({ message: 'Bad request' });
    }
  });

  it('should transform network errors', async () => {
    const interceptor = createErrorTransformInterceptor();
    const error: AxiosError = {
      request: {},
      config: {} as InternalAxiosRequestConfig,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Network Error',
    };

    try {
      await interceptor.onRejected(error);
    } catch (err) {
      const apiError = err as ApiError;
      expect(apiError.message).toBe('Network error - please check your connection');
      expect(apiError.status).toBeUndefined();
    }
  });

  it('should transform request setup errors', async () => {
    const interceptor = createErrorTransformInterceptor();
    const error: AxiosError = {
      config: {} as InternalAxiosRequestConfig,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Invalid config',
    };

    try {
      await interceptor.onRejected(error);
    } catch (err) {
      const apiError = err as ApiError;
      expect(apiError.message).toBe('Invalid config');
    }
  });

  it('should pass through successful responses', () => {
    const interceptor = createErrorTransformInterceptor();
    const response: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    } as AxiosResponse;

    const result = interceptor.onFulfilled(response);

    expect(result).toBe(response);
  });
});
