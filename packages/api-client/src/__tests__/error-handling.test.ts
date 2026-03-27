import axios, { AxiosError } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ApiClient } from '../api-client';
import { ApiError } from '../interceptors';

describe('ApiClient Error Handling', () => {
  let client: ApiClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new ApiClient({
      baseURL: 'https://api.example.com',
      interceptorConfig: {
        enableLogging: false, // Disable logging in tests
        enableRetry: true,
        maxRetries: 3,
        retryDelay: 100,
      },
    });
    mock = new MockAdapter(client.getAxiosInstance());
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Network Errors', () => {
    it('should retry on network error', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        if (attempts < 3) {
          return [0]; // Network error
        }
        return [200, { success: true }];
      });

      const result = await client.get('/test');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(3);
    });

    it('should fail after max retries on network error', async () => {
      mock.onGet('/test').networkError();

      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('Server Errors (5xx)', () => {
    it('should retry on 500 error', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        if (attempts < 2) {
          return [500, { error: 'Internal Server Error' }];
        }
        return [200, { success: true }];
      });

      const result = await client.get('/test');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should retry on 502 Bad Gateway', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        if (attempts < 2) {
          return [502, { error: 'Bad Gateway' }];
        }
        return [200, { success: true }];
      });

      const result = await client.get('/test');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should retry on 503 Service Unavailable', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        if (attempts < 2) {
          return [503, { error: 'Service Unavailable' }];
        }
        return [200, { success: true }];
      });

      const result = await client.get('/test');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should retry on 504 Gateway Timeout', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        if (attempts < 2) {
          return [504, { error: 'Gateway Timeout' }];
        }
        return [200, { success: true }];
      });

      const result = await client.get('/test');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should fail after max retries on 500 error', async () => {
      mock.onGet('/test').reply(500, { error: 'Internal Server Error' });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('Rate Limiting (429)', () => {
    it('should retry on 429 with Retry-After header (seconds)', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        if (attempts < 2) {
          return [429, { error: 'Too Many Requests' }, { 'retry-after': '1' }];
        }
        return [200, { success: true }];
      });

      const result = await client.get('/test');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should fail after max retries on 429', async () => {
      mock.onGet('/test').reply(429, { error: 'Too Many Requests' });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 429,
      });
    });
  });

  describe('Client Errors (4xx)', () => {
    it('should not retry on 400 Bad Request', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        return [400, { error: 'Bad Request' }];
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 400,
      });
      expect(attempts).toBe(1);
    });

    it('should not retry on 404 Not Found', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        return [404, { error: 'Not Found' }];
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 404,
      });
      expect(attempts).toBe(1);
    });

    it('should not retry on 403 Forbidden', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        return [403, { error: 'Forbidden' }];
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 403,
      });
      expect(attempts).toBe(1);
    });
  });

  describe('Request Timeout (408)', () => {
    it('should retry on 408 Request Timeout', async () => {
      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        if (attempts < 2) {
          return [408, { error: 'Request Timeout' }];
        }
        return [200, { success: true }];
      });

      const result = await client.get('/test');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });
  });

  describe('Custom Retry Logic', () => {
    it('should use custom shouldRetry function', async () => {
      const customClient = new ApiClient({
        baseURL: 'https://api.example.com',
        interceptorConfig: {
          enableLogging: false,
          enableRetry: true,
          maxRetries: 2,
          retryDelay: 100,
          shouldRetry: (error: AxiosError) => {
            // Only retry on 418 I'm a teapot (custom logic)
            return error.response?.status === 418;
          },
        },
      });

      const customMock = new MockAdapter(customClient.getAxiosInstance());

      let attempts = 0;
      customMock.onGet('/test').reply(() => {
        attempts++;
        if (attempts < 2) {
          return [418, { error: "I'm a teapot" }];
        }
        return [200, { success: true }];
      });

      const result = await customClient.get('/test');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);

      customMock.restore();
    });

    it('should not retry when custom shouldRetry returns false', async () => {
      const customClient = new ApiClient({
        baseURL: 'https://api.example.com',
        interceptorConfig: {
          enableLogging: false,
          enableRetry: true,
          maxRetries: 3,
          retryDelay: 100,
          shouldRetry: () => false, // Never retry
        },
      });

      const customMock = new MockAdapter(customClient.getAxiosInstance());

      let attempts = 0;
      customMock.onGet('/test').reply(() => {
        attempts++;
        return [500, { error: 'Internal Server Error' }];
      });

      await expect(customClient.get('/test')).rejects.toMatchObject({
        status: 500,
      });
      expect(attempts).toBe(1);

      customMock.restore();
    });
  });

  describe('Custom Retryable Status Codes', () => {
    it('should retry on custom status codes', async () => {
      const customClient = new ApiClient({
        baseURL: 'https://api.example.com',
        interceptorConfig: {
          enableLogging: false,
          enableRetry: true,
          maxRetries: 2,
          retryDelay: 100,
          retryableStatusCodes: [400, 404], // Retry on 400 and 404
        },
      });

      const customMock = new MockAdapter(customClient.getAxiosInstance());

      let attempts = 0;
      customMock.onGet('/test').reply(() => {
        attempts++;
        if (attempts < 2) {
          return [400, { error: 'Bad Request' }];
        }
        return [200, { success: true }];
      });

      const result = await customClient.get('/test');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);

      customMock.restore();
    });
  });

  describe('Error Transformation', () => {
    it('should transform error with message from response', async () => {
      mock.onGet('/test').reply(400, { message: 'Custom error message' });

      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Custom error message',
        status: 400,
      });
    });

    it('should transform error with code from response', async () => {
      mock.onGet('/test').reply(400, { 
        message: 'Validation failed',
        code: 'VALIDATION_ERROR' 
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Validation failed',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    });

    it('should include error details', async () => {
      const errorDetails = {
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' },
        ],
      };

      mock.onGet('/test').reply(400, errorDetails);

      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Validation failed',
        status: 400,
        details: errorDetails,
      });
    });
  });

  describe('Error Callback', () => {
    it('should call onError callback', async () => {
      const onError = jest.fn();
      const customClient = new ApiClient({
        baseURL: 'https://api.example.com',
        interceptorConfig: {
          enableLogging: false,
          enableRetry: false,
          onError,
        },
      });

      const customMock = new MockAdapter(customClient.getAxiosInstance());
      customMock.onGet('/test').reply(400, { message: 'Bad Request' });

      await expect(customClient.get('/test')).rejects.toThrow();
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Bad Request',
          status: 400,
        })
      );

      customMock.restore();
    });
  });

  describe('Exponential Backoff', () => {
    it('should use exponential backoff for retries', async () => {
      const delays: number[] = [];
      const startTime = Date.now();

      let attempts = 0;
      mock.onGet('/test').reply(() => {
        if (attempts > 0) {
          delays.push(Date.now() - startTime);
        }
        attempts++;
        if (attempts < 4) {
          return [500, { error: 'Internal Server Error' }];
        }
        return [200, { success: true }];
      });

      await client.get('/test');

      // Verify exponential backoff (with some tolerance for timing)
      expect(delays[0]).toBeGreaterThanOrEqual(90); // ~100ms
      expect(delays[1]).toBeGreaterThanOrEqual(180); // ~200ms
      expect(delays[2]).toBeGreaterThanOrEqual(360); // ~400ms
    });
  });

  describe('Retry Disabled', () => {
    it('should not retry when retry is disabled', async () => {
      const noRetryClient = new ApiClient({
        baseURL: 'https://api.example.com',
        interceptorConfig: {
          enableLogging: false,
          enableRetry: false,
        },
      });

      const noRetryMock = new MockAdapter(noRetryClient.getAxiosInstance());

      let attempts = 0;
      noRetryMock.onGet('/test').reply(() => {
        attempts++;
        return [500, { error: 'Internal Server Error' }];
      });

      await expect(noRetryClient.get('/test')).rejects.toMatchObject({
        status: 500,
      });
      expect(attempts).toBe(1);

      noRetryMock.restore();
    });
  });
});
