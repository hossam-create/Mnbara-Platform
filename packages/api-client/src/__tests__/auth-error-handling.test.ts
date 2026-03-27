import MockAdapter from 'axios-mock-adapter';
import { ApiClient } from '../api-client';

describe('ApiClient Authentication Error Handling', () => {
  let client: ApiClient;
  let mock: MockAdapter;
  let onTokenExpired: jest.Mock;
  let onUnauthorized: jest.Mock;

  beforeEach(() => {
    onTokenExpired = jest.fn();
    onUnauthorized = jest.fn();

    client = new ApiClient({
      baseURL: 'https://api.example.com',
      interceptorConfig: {
        enableLogging: false,
        enableRetry: true,
        maxRetries: 3,
        retryDelay: 100,
        onTokenExpired,
        onUnauthorized,
      },
      getToken: () => 'old-token',
    });

    mock = new MockAdapter(client.getAxiosInstance());
  });

  afterEach(() => {
    mock.restore();
  });

  describe('401 Unauthorized', () => {
    it('should call onTokenExpired and retry with new token', async () => {
      onTokenExpired.mockResolvedValue('new-token');

      let attempts = 0;
      mock.onGet('/test').reply((config) => {
        attempts++;
        const authHeader = config.headers?.Authorization;

        if (authHeader === 'Bearer old-token') {
          return [401, { error: 'Unauthorized' }];
        }

        if (authHeader === 'Bearer new-token') {
          return [200, { success: true }];
        }

        return [401, { error: 'Unauthorized' }];
      });

      const result = await client.get('/test');

      expect(result).toEqual({ success: true });
      expect(onTokenExpired).toHaveBeenCalledTimes(1);
      expect(onUnauthorized).not.toHaveBeenCalled();
      expect(attempts).toBe(2);
    });

    it('should call onUnauthorized when token refresh fails', async () => {
      onTokenExpired.mockRejectedValue(new Error('Token refresh failed'));

      mock.onGet('/test').reply(401, { error: 'Unauthorized' });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 401,
      });

      expect(onTokenExpired).toHaveBeenCalledTimes(1);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('should call onUnauthorized when token refresh returns null', async () => {
      onTokenExpired.mockResolvedValue(null);

      mock.onGet('/test').reply(401, { error: 'Unauthorized' });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 401,
      });

      expect(onTokenExpired).toHaveBeenCalledTimes(1);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('should call onUnauthorized when no onTokenExpired is provided', async () => {
      const simpleClient = new ApiClient({
        baseURL: 'https://api.example.com',
        interceptorConfig: {
          enableLogging: false,
          onUnauthorized,
        },
      });

      const simpleMock = new MockAdapter(simpleClient.getAxiosInstance());
      simpleMock.onGet('/test').reply(401, { error: 'Unauthorized' });

      await expect(simpleClient.get('/test')).rejects.toMatchObject({
        status: 401,
      });

      expect(onUnauthorized).toHaveBeenCalledTimes(1);

      simpleMock.restore();
    });

    it('should not retry indefinitely on 401', async () => {
      onTokenExpired.mockResolvedValue('new-token');

      let attempts = 0;
      mock.onGet('/test').reply(() => {
        attempts++;
        return [401, { error: 'Unauthorized' }];
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 401,
      });

      // Should only try once with token refresh
      expect(attempts).toBe(2);
      expect(onTokenExpired).toHaveBeenCalledTimes(1);
    });
  });

  describe('Token Management', () => {
    it('should set auth token', () => {
      client.setAuthToken('test-token');
      
      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer test-token');
        return [200, { success: true }];
      });

      return client.get('/test');
    });

    it('should clear auth token', async () => {
      client.setAuthToken('test-token');
      client.clearAuthToken();

      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { success: true }];
      });

      await client.get('/test');
    });

    it('should use getToken function for auth', async () => {
      const getToken = jest.fn(() => 'dynamic-token');
      
      const tokenClient = new ApiClient({
        baseURL: 'https://api.example.com',
        getToken,
      });

      const tokenMock = new MockAdapter(tokenClient.getAxiosInstance());

      tokenMock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer dynamic-token');
        return [200, { success: true }];
      });

      await tokenClient.get('/test');
      expect(getToken).toHaveBeenCalled();

      tokenMock.restore();
    });
  });

  describe('Multiple 401 Scenarios', () => {
    it('should handle 401 on POST request', async () => {
      onTokenExpired.mockResolvedValue('new-token');

      let attempts = 0;
      mock.onPost('/test').reply((config) => {
        attempts++;
        const authHeader = config.headers?.Authorization;

        if (authHeader === 'Bearer old-token') {
          return [401, { error: 'Unauthorized' }];
        }

        if (authHeader === 'Bearer new-token') {
          return [200, { success: true }];
        }

        return [401, { error: 'Unauthorized' }];
      });

      const result = await client.post('/test', { data: 'test' });

      expect(result).toEqual({ success: true });
      expect(onTokenExpired).toHaveBeenCalledTimes(1);
      expect(attempts).toBe(2);
    });

    it('should handle 401 on PUT request', async () => {
      onTokenExpired.mockResolvedValue('new-token');

      let attempts = 0;
      mock.onPut('/test').reply((config) => {
        attempts++;
        const authHeader = config.headers?.Authorization;

        if (authHeader === 'Bearer old-token') {
          return [401, { error: 'Unauthorized' }];
        }

        if (authHeader === 'Bearer new-token') {
          return [200, { success: true }];
        }

        return [401, { error: 'Unauthorized' }];
      });

      const result = await client.put('/test', { data: 'test' });

      expect(result).toEqual({ success: true });
      expect(onTokenExpired).toHaveBeenCalledTimes(1);
      expect(attempts).toBe(2);
    });

    it('should handle 401 on DELETE request', async () => {
      onTokenExpired.mockResolvedValue('new-token');

      let attempts = 0;
      mock.onDelete('/test').reply((config) => {
        attempts++;
        const authHeader = config.headers?.Authorization;

        if (authHeader === 'Bearer old-token') {
          return [401, { error: 'Unauthorized' }];
        }

        if (authHeader === 'Bearer new-token') {
          return [200, { success: true }];
        }

        return [401, { error: 'Unauthorized' }];
      });

      const result = await client.delete('/test');

      expect(result).toEqual({ success: true });
      expect(onTokenExpired).toHaveBeenCalledTimes(1);
      expect(attempts).toBe(2);
    });
  });
});
