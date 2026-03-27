/**
 * Property-based tests for API Client request/response consistency
 * Validates: Requirements 2.2.4 - API client request/response consistency
 * 
 * Uses external APIs from: https://github.com/public-apis/public-apis
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { fc, test } from 'fast-check';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ApiClient, ApiClientOptions } from '../api-client';
import { 
  EXTERNAL_APIS, 
  getRecommendedTestApis, 
  getTestEnvironment,
  TEST_DATA_APIS,
  WEATHER_APIS,
  CURRENCY_APIS,
  DEV_TOOLS_APIS
} from './external-apis.config';

// Helper to generate valid API endpoints
const endpointArb = fc.oneof(
  fc.constantFrom('/users', '/products', '/orders', '/payments', '/auth/login'),
  fc.record({
    path: fc.oneof(
      fc.constantFrom('/users', '/products', '/orders', '/payments'),
      fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 3 })
        .map(arr => '/' + arr.join('/'))
    ),
    query: fc.record({
      page: fc.nat({ max: 100 }),
      limit: fc.nat({ max: 50 }),
      sort: fc.oneof(fc.constant('asc'), fc.constant('desc')),
      filter: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    }, { withDeletedKeys: false }),
  }).map(r => {
    const params = new URLSearchParams();
    if (r.query.page !== undefined) params.set('page', String(r.query.page));
    if (r.query.limit !== undefined) params.set('limit', String(r.query.limit));
    if (r.query.sort !== undefined) params.set('sort', r.query.sort);
    if (r.query.filter !== undefined) params.set('filter', r.query.filter);
    return `${r.path}?${params.toString()}`;
  })
);

// Helper to generate valid request data
const userDataArb = fc.record({
  id: fc.uuidV4(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  roles: fc.array(fc.oneof(
    fc.constant('admin'),
    fc.constant('user'),
    fc.constant('seller'),
    fc.constant('buyer')
  ), { maxLength: 5 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  isActive: fc.boolean(),
  metadata: fc.option(fc.record({
    preferences: fc.record({
      language: fc.string({ minLength: 2, maxLength: 5 }),
      notifications: fc.boolean(),
    }),
    lastLogin: fc.option(fc.date()),
  })),
});

const orderDataArb = fc.record({
  id: fc.uuidV4(),
  userId: fc.uuidV4(),
  items: fc.array(fc.record({
    productId: fc.uuidV4(),
    name: fc.string({ minLength: 1, maxLength: 200 }),
    quantity: fc.nat({ max: 100 }),
    price: fc.float({ min: 0.01, max: 10000 }),
  }), { maxLength: 20 }),
  status: fc.oneof(
    fc.constant('pending'),
    fc.constant('confirmed'),
    fc.constant('shipped'),
    fc.constant('delivered'),
    fc.constant('cancelled')
  ),
  totalAmount: fc.float({ min: 0, max: 100000 }),
  currency: fc.oneof(fc.constant('USD'), fc.constant('EUR'), fc.constant('GBP')),
  createdAt: fc.date(),
});

const paymentDataArb = fc.record({
  id: fc.uuidV4(),
  orderId: fc.uuidV4(),
  amount: fc.float({ min: 0.01, max: 100000 }),
  currency: fc.oneof(fc.constant('USD'), fc.constant('EUR'), fc.constant('GBP')),
  status: fc.oneof(
    fc.constant('pending'),
    fc.constant('processing'),
    fc.constant('completed'),
    fc.constant('failed'),
    fc.constant('refunded')
  ),
  method: fc.oneof(
    fc.constant('credit_card'),
    fc.constant('debit_card'),
    fc.constant('bank_transfer'),
    fc.constant('wallet')
  ),
  metadata: fc.record({
    transactionId: fc.string({ minLength: 10, maxLength: 50 }),
    processedAt: fc.option(fc.date()),
    fee: fc.float({ min: 0, max: 100 }),
  }),
});

// Generate random HTTP methods
const httpMethodArb = fc.oneof(
  fc.constant('GET'),
  fc.constant('POST'),
  fc.constant('PUT'),
  fc.constant('PATCH'),
  fc.constant('DELETE')
);

// Helper to create API client with mock
const createMockedClient = (baseURL: string = 'https://api.example.com') => {
  const mock = new MockAdapter(axios);
  const client = new ApiClient({
    baseURL,
    timeout: 30000,
  });
  return { client, mock };
};

describe('API Client Request/Response Consistency', () => {
  describe('Property: Request data serialization consistency', () => {
    test('should maintain data integrity for user data through request/response cycle', () => {
      fc.assert(
        fc.property(userDataArb, async (originalData) => {
          const { client, mock } = createMockedClient();
          
          mock.onPost('/users').reply(200, originalData);
          
          const response = await client.post('/users', originalData);
          
          // Response should match original data structure
          expect(response).toHaveProperty('id', originalData.id);
          expect(response).toHaveProperty('email', originalData.email);
          expect(response).toHaveProperty('name', originalData.name);
          expect(response.roles).toHaveLength(originalData.roles.length);
          expect(response.isActive).toBe(originalData.isActive);
          
          // Nested objects should be preserved
          if (originalData.metadata) {
            expect(response.metadata).toBeDefined();
            expect(response.metadata?.preferences?.language).toBe(originalData.metadata.preferences.language);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('should maintain data integrity for order data through request/response cycle', () => {
      fc.assert(
        fc.property(orderDataArb, async (originalData) => {
          const { client, mock } = createMockedClient();
          
          mock.onPost('/orders').reply(200, originalData);
          
          const response = await client.post('/orders', originalData);
          
          // Response should match original data structure
          expect(response).toHaveProperty('id', originalData.id);
          expect(response).toHaveProperty('userId', originalData.userId);
          expect(response.status).toBe(originalData.status);
          expect(response.totalAmount).toBe(originalData.totalAmount);
          expect(response.currency).toBe(originalData.currency);
          
          // Items array should be preserved with correct count
          expect(response.items).toHaveLength(originalData.items.length);
          
          // Each item should maintain its properties
          originalData.items.forEach((item, index) => {
            expect(response.items[index]).toHaveProperty('productId', item.productId);
            expect(response.items[index]).toHaveProperty('name', item.name);
            expect(response.items[index]).toHaveProperty('quantity', item.quantity);
            expect(response.items[index]).toHaveProperty('price', item.price);
          });
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('should maintain data integrity for payment data through request/response cycle', () => {
      fc.assert(
        fc.property(paymentDataArb, async (originalData) => {
          const { client, mock } = createMockedClient();
          
          mock.onPost('/payments').reply(200, originalData);
          
          const response = await client.post('/payments', originalData);
          
          // Response should match original data structure
          expect(response).toHaveProperty('id', originalData.id);
          expect(response).toHaveProperty('orderId', originalData.orderId);
          expect(response.amount).toBe(originalData.amount);
          expect(response.currency).toBe(originalData.currency);
          expect(response.status).toBe(originalData.status);
          expect(response.method).toBe(originalData.method);
          
          // Metadata should be preserved
          expect(response.metadata).toHaveProperty('transactionId', originalData.metadata.transactionId);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Query parameter consistency', () => {
    test('should correctly serialize and deserialize query parameters', () => {
      fc.assert(
        fc.property(
          fc.record({
            page: fc.nat({ max: 100 }),
            limit: fc.nat({ max: 50 }),
            sort: fc.oneof(fc.constant('asc'), fc.constant('desc')),
            filter: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          }),
          async (queryParams) => {
            const { client, mock } = createMockedClient();
            
            mock.onGet('/users').reply(config => {
              const url = new URL(config.url || '', 'https://api.example.com');
              const receivedPage = url.searchParams.get('page');
              const receivedLimit = url.searchParams.get('limit');
              const receivedSort = url.searchParams.get('sort');
              const receivedFilter = url.searchParams.get('filter');
              
              return [200, {
                page: receivedPage,
                limit: receivedLimit,
                sort: receivedSort,
                filter: receivedFilter,
              }];
            });
            
            const params: Record<string, string | number | boolean | undefined> = {
              page: queryParams.page,
              limit: queryParams.limit,
              sort: queryParams.sort,
            };
            
            if (queryParams.filter !== undefined) {
              params.filter = queryParams.filter;
            }
            
            const response = await client.get('/users', { params });
            
            expect(response.page).toBe(String(queryParams.page));
            expect(response.limit).toBe(String(queryParams.limit));
            expect(response.sort).toBe(queryParams.sort);
            if (queryParams.filter !== undefined) {
              expect(response.filter).toBe(queryParams.filter);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Type safety through request/response cycle', () => {
    test('should maintain type safety for GET requests with path parameters', () => {
      fc.assert(
        fc.property(
          fc.uuidV4(),
          async (userId) => {
            const { client, mock } = createMockedClient();
            
            const expectedResponse = {
              id: userId,
              name: 'Test User',
              email: 'test@example.com',
              createdAt: new Date().toISOString(),
            };
            
            mock.onGet(`/users/${userId}`).reply(200, expectedResponse);
            
            const response = await client.get<typeof expectedResponse>(`/users/${userId}`);
            
            expect(response.id).toBe(userId);
            expect(response.name).toBe('Test User');
            expect(response.email).toBe('test@example.com');
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain type safety for nested object responses', () => {
      fc.assert(
        fc.property(
          fc.record({
            user: fc.record({
              id: fc.uuidV4(),
              profile: fc.record({
                name: fc.string({ minLength: 1, maxLength: 50 }),
                avatar: fc.option(fc.string({ url: true })),
                settings: fc.record({
                  theme: fc.oneof(fc.constant('light'), fc.constant('dark')),
                  language: fc.string({ minLength: 2, maxLength: 5 }),
                }),
              }),
            }),
            session: fc.record({
              token: fc.string({ minLength: 100, maxLength: 200 }),
              expiresAt: fc.date(),
            }),
          }),
          async (complexData) => {
            const { client, mock } = createMockedClient();
            
            mock.onGet('/session').reply(200, complexData);
            
            const response = await client.get('/session');
            
            expect(response.user).toBeDefined();
            expect(response.user.id).toBe(complexData.user.id);
            expect(response.user.profile).toBeDefined();
            expect(response.user.profile.settings.theme).toBe(complexData.user.profile.settings.theme);
            expect(response.session.token).toBe(complexData.session.token);
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property: Array response consistency', () => {
    test('should maintain array length and element types in responses', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuidV4(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              price: fc.float({ min: 0, max: 1000 }),
              inStock: fc.boolean(),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            const { client, mock } = createMockedClient();
            
            mock.onGet('/products').reply(200, { items, total: items.length });
            
            const response = await client.get<{ items: typeof items; total: number }>('/products');
            
            expect(response.items).toHaveLength(items.length);
            expect(response.total).toBe(items.length);
            
            // Each item should maintain its properties
            response.items.forEach((item, index) => {
              expect(item.id).toBe(items[index].id);
              expect(item.name).toBe(items[index].name);
              expect(item.price).toBe(items[index].price);
              expect(item.inStock).toBe(items[index].inStock);
            });
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property: Error response consistency', () => {
    test('should maintain error response structure', () => {
      fc.assert(
        fc.property(
          fc.record({
            status: fc.nat({ max: 599 }),
            message: fc.string({ minLength: 1, maxLength: 200 }),
            code: fc.string({ minLength: 1, maxLength: 50 }),
            details: fc.option(fc.record({
              field: fc.string(),
              reason: fc.string(),
            })),
          }),
          async (errorData) => {
            const { client, mock } = createMockedClient();
            
            mock.onGet('/users').reply(errorData.status, errorData);
            
            let caughtError: unknown;
            try {
              await client.get('/users');
            } catch (error) {
              caughtError = error;
            }
            
            expect(caughtError).toBeDefined();
            const axiosError = caughtError as AxiosError<typeof errorData>;
            expect(axiosError.response?.status).toBe(errorData.status);
            expect(axiosError.response?.data).toHaveProperty('message', errorData.message);
            expect(axiosError.response?.data).toHaveProperty('code', errorData.code);
            
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property: Request configuration consistency', () => {
    test('should preserve custom headers in requests', () => {
      fc.assert(
        fc.property(
          fc.record({
            'X-Request-Id': fc.string({ minLength: 10, maxLength: 50 }),
            'X-Custom-Header': fc.string({ minLength: 1, maxLength: 100 }),
            Authorization: fc.string({ prefix: 'Bearer ' }),
          }),
          async (customHeaders) => {
            const { client, mock } = createMockedClient();
            
            let receivedHeaders: Record<string, string> = {};
            
            mock.onGet('/users').reply(config => {
              receivedHeaders = config.headers as Record<string, string>;
              return [200, { success: true }];
            });
            
            await client.get('/users', {
              headers: customHeaders,
            });
            
            expect(receivedHeaders['X-Request-Id']).toBe(customHeaders['X-Request-Id']);
            expect(receivedHeaders['X-Custom-Header']).toBe(customHeaders['X-Custom-Header']);
            expect(receivedHeaders['Authorization']).toBe(customHeaders['Authorization']);
            
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should preserve timeout configuration', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 60000 }),
          async (timeout) => {
            const options: ApiClientOptions = {
              baseURL: 'https://api.example.com',
              timeout,
            };
            
            const client = new ApiClient(options);
            const axiosInstance = client.getAxiosInstance();
            
            expect(axiosInstance.defaults.timeout).toBe(timeout);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property: URL path consistency', () => {
    test('should correctly encode special characters in URLs', () => {
      fc.assert(
        fc.property(
          fc.record({
            path: fc.string({ minLength: 1, maxLength: 50 }),
            param: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          async (data) => {
            const { client, mock } = createMockedClient();
            
            const encodedPath = `/search/${encodeURIComponent(data.path)}`;
            const encodedParam = encodeURIComponent(data.param);
            
            mock.onGet(encodedPath).reply(config => {
              const url = new URL(config.url || '', 'https://api.example.com');
              return [200, { receivedParam: url.searchParams.get('q') }];
            });
            
            const response = await client.get(encodedPath, {
              params: { q: data.param },
            });
            
            expect(response.receivedParam).toBe(encodedParam);
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});

describe('API Client - Edge Cases', () => {
  it('should handle empty arrays consistently', async () => {
    const { client, mock } = createMockedClient();
    
    const emptyArrayData = { items: [], total: 0 };
    mock.onGet('/products').reply(200, emptyArrayData);
    
    const response = await client.get<typeof emptyArrayData>('/products');
    
    expect(response.items).toHaveLength(0);
    expect(response.total).toBe(0);
  });

  it('should handle special characters in strings consistently', async () => {
    const { client, mock } = createMockedClient();
    
    const specialCharData = {
      name: 'José García-Smith (CEO) "Special" & <Tags>',
      email: 'josé+test@example.com',
    };
    
    mock.onPost('/users').reply(200, specialCharData);
    
    const response = await client.post('/users', specialCharData);
    
    expect(response.name).toBe(specialCharData.name);
    expect(response.email).toBe(specialCharData.email);
  });

  it('should handle unicode characters consistently', async () => {
    const { client, mock } = createMockedClient();
    
    const unicodeData = {
      japanese: 'こんにちは',
      chinese: '你好',
      arabic: 'مرحبا',
      emoji: '🎉🚀✨',
    };
    
    mock.onPost('/translations').reply(200, unicodeData);
    
    const response = await client.post('/translations', unicodeData);
    
    expect(response.japanese).toBe(unicodeData.japanese);
    expect(response.chinese).toBe(unicodeData.chinese);
    expect(response.arabic).toBe(unicodeData.arabic);
    expect(response.emoji).toBe(unicodeData.emoji);
  });

  it('should handle large numbers without precision loss', async () => {
    const { client, mock } = createMockedClient();
    
    const largeNumberData = {
      price: 1234567890.123456789,
      quantity: 999999999,
      bigInt: '12345678901234567890',
    };
    
    mock.onPost('/orders').reply(200, largeNumberData);
    
    const response = await client.post('/orders', largeNumberData);
    
    // JSON serialization should handle these numbers
    expect(response.price).toBeCloseTo(largeNumberData.price, 6);
    expect(response.quantity).toBe(largeNumberData.quantity);
  });

  it('should handle boolean values correctly', async () => {
    const { client, mock } = createMockedClient();
    
    const booleanData = {
      isActive: true,
      isVerified: false,
      hasSubscription: true,
      optIn: false,
    };
    
    mock.onPost('/users').reply(200, booleanData);
    
    const response = await client.post('/users', booleanData);
    
    expect(response.isActive).toBe(true);
    expect(response.isVerified).toBe(false);
    expect(response.hasSubscription).toBe(true);
    expect(response.optIn).toBe(false);
  });
});

// ============================================================================
// EXTERNAL API INTEGRATION TESTS
// Uses real APIs from public-apis repository
// ============================================================================

describe('External API Integration Tests', () => {
  const envConfig = getTestEnvironment();
  
  // Skip real API tests in mock environment
  const describeExternal = envConfig.useRealApis ? describe : describe.skip;
  
  describeExternal('JSONPlaceholder Integration Tests', () => {
    const baseURL = TEST_DATA_APIS.apis[0].baseURL;
    
    it('should fetch users list', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/users');
      
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      if (response.length > 0) {
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('email');
      }
    });
    
    it('should fetch single user', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/users/1');
      
      expect(response).toBeDefined();
      expect(response).toHaveProperty('id', 1);
      expect(response).toHaveProperty('name');
      expect(response).toHaveProperty('email');
    });
    
    it('should create new post', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const newPost = {
        title: 'Test Post',
        body: 'This is a test post body',
        userId: 1,
      };
      
      const response = await client.post('/posts', newPost);
      
      expect(response).toBeDefined();
      expect(response.title).toBe(newPost.title);
      expect(response.body).toBe(newPost.body);
      expect(response.userId).toBe(newPost.userId);
      expect(response.id).toBeDefined();
    });
  });
  
  describeExternal('Open-Meteo Weather Integration Tests', () => {
    const baseURL = WEATHER_APIS.apis[0].baseURL;
    
    it('should fetch weather forecast', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get(
        '/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true'
      );
      
      expect(response).toBeDefined();
      expect(response).toHaveProperty('latitude');
      expect(response).toHaveProperty('longitude');
      expect(response).toHaveProperty('current_weather');
    });
    
    it('should handle different coordinates', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      
      const cities = [
        { lat: 51.5074, lon: -0.1278, name: 'London' },
        { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
        { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
      ];
      
      for (const city of cities) {
        const response = await client.get(
          `/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`
        );
        
        expect(response).toBeDefined();
        expect(response.latitude).toBeCloseTo(city.lat, 1);
        expect(response.longitude).toBeCloseTo(city.lon, 1);
      }
    });
  });
  
  describeExternal('Frankfurter Currency Integration Tests', () => {
    const baseURL = CURRENCY_APIS.apis[0].baseURL;
    
    it('should fetch latest exchange rates', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/latest?from=USD');
      
      expect(response).toBeDefined();
      expect(response).toHaveProperty('amount', '1.0');
      expect(response).toHaveProperty('base');
      expect(response).toHaveProperty('date');
      expect(response).toHaveProperty('rates');
    });
    
    it('should convert currencies', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/convert?from=USD&to=EUR&amount=100');
      
      expect(response).toBeDefined();
      expect(response).toHaveProperty('from');
      expect(response).toHaveProperty('to');
      expect(response).toHaveProperty('amount');
      expect(response).toHaveProperty('result');
    });
  });
  
  describeExternal('Httpbin Integration Tests', () => {
    const baseURL = DEV_TOOLS_APIS.apis[0].baseURL;
    
    it('should handle GET request', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/get');
      
      expect(response).toBeDefined();
      expect(response).toHaveProperty('args');
      expect(response).toHaveProperty('headers');
      expect(response).toHaveProperty('url');
    });
    
    it('should handle POST request with data', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const postData = { test: 'value', number: 42 };
      const response = await client.post('/post', postData);
      
      expect(response).toBeDefined();
      expect(response.json).toEqual(postData);
    });
    
    it('should handle status codes', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      
      const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500];
      
      for (const status of statusCodes) {
        let caughtError: unknown;
        try {
          await client.get(`/status/${status}`);
        } catch (error) {
          caughtError = error;
        }
        
        const axiosError = caughtError as AxiosError;
        expect(axiosError.response?.status).toBe(status);
      }
    });
    
    it('should handle delay', async () => {
      const client = new ApiClient({ baseURL, timeout: 10000 });
      const response = await client.get('/delay/1');
      
      expect(response).toBeDefined();
      expect(response).toHaveProperty('args');
    });
  });
  
  describeExternal('RandomUser Integration Tests', () => {
    const baseURL = TEST_DATA_APIS.apis[1].baseURL;
    
    it('should fetch random user', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/');
      
      expect(response).toBeDefined();
      expect(response).toHaveProperty('results');
      expect(Array.isArray(response.results)).toBe(true);
      expect(response.results.length).toBe(1);
      
      const user = response.results[0];
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('picture');
    });
    
    it('should fetch multiple users', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/?results=5');
      
      expect(response).toBeDefined();
      expect(response.results).toHaveLength(5);
    });
  });
  
  describeExternal('REST Countries Integration Tests', () => {
    const baseURL = 'https://restcountries.com/v3.1';
    
    it('should fetch all countries', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/all?fields=name,capital,population');
      
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
    });
    
    it('should fetch country by code', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/alpha/usa');
      
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response[0]).toHaveProperty('name');
      expect(response[0]).toHaveProperty('capital');
    });
    
    it('should search countries by name', async () => {
      const client = new ApiClient({ baseURL, timeout: envConfig.timeout });
      const response = await client.get('/name/germany');
      
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response[0].name.common).toBe('Germany');
    });
  });
});

// ============================================================================
// PROPERTY TESTS WITH EXTERNAL API DATA
// ============================================================================

describe('Property Tests with External API Data', () => {
  describe('Property: External API response structure consistency', () => {
    test('should maintain JSONPlaceholder user structure', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10 }),
          async (userId) => {
            const client = new ApiClient({
              baseURL: TEST_DATA_APIS.apis[0].baseURL,
              timeout: 10000,
            });
            
            const response = await client.get(`/users/${userId + 1}`);
            
            // Verify structure matches expected User type
            expect(response).toHaveProperty('id');
            expect(response).toHaveProperty('name');
            expect(response).toHaveProperty('email');
            expect(response).toHaveProperty('address');
            expect(response.address).toHaveProperty('street');
            expect(response.address).toHaveProperty('city');
            expect(response).toHaveProperty('company');
            expect(response.company).toHaveProperty('name');
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
    
    test('should maintain weather data structure', () => {
      fc.assert(
        fc.property(
          fc.record({
            lat: fc.float({ min: -90, max: 90 }),
            lon: fc.float({ min: -180, max: 180 }),
          }),
          async (coords) => {
            const client = new ApiClient({
              baseURL: WEATHER_APIS.apis[0].baseURL,
              timeout: 10000,
            });
            
            const response = await client.get(
              `/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`
            );
            
            // Verify structure
            expect(response).toHaveProperty('latitude');
            expect(response).toHaveProperty('longitude');
            expect(response).toHaveProperty('current_weather');
            expect(response.current_weather).toHaveProperty('temperature');
            expect(response.current_weather).toHaveProperty('windspeed');
            expect(response.current_weather).toHaveProperty('weathercode');
            
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
  
  describe('Property: Currency rate consistency', () => {
    test('should maintain currency structure across different base currencies', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('USD'),
            fc.constant('EUR'),
            fc.constant('GBP'),
            fc.constant('JPY')
          ),
          async (baseCurrency) => {
            const client = new ApiClient({
              baseURL: CURRENCY_APIS.apis[0].baseURL,
              timeout: 10000,
            });
            
            const response = await client.get(`/latest?from=${baseCurrency}`);
            
            // Verify structure
            expect(response).toHaveProperty('amount', '1.0');
            expect(response).toHaveProperty('base', baseCurrency);
            expect(response).toHaveProperty('date');
            expect(response).toHaveProperty('rates');
            
            // Verify rates is an object with currency codes as keys
            expect(typeof response.rates).toBe('object');
            expect(Object.keys(response.rates).length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 4 }
      );
    });
  });
});

// ============================================================================
// API CLIENT CONFIGURATION TESTS
// ============================================================================

describe('API Client Configuration Tests', () => {
  describe('Property: Configuration options consistency', () => {
    test('should apply all configuration options correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            baseURL: fc.oneof(
              fc.constant('https://api.example.com'),
              fc.constant('https://api.test.com/v2'),
              fc.constant('http://localhost:3000')
            ),
            timeout: fc.nat({ max: 60000 }),
            headers: fc.record({
              'Content-Type': fc.oneof(
                fc.constant('application/json'),
                fc.constant('application/x-www-form-urlencoded')
              ),
              'X-Custom-Header': fc.string({ minLength: 1, maxLength: 50 }),
            }, { withDeletedKeys: false }),
          }),
          (config) => {
            const client = new ApiClient({
              baseURL: config.baseURL,
              timeout: config.timeout,
              headers: config.headers,
            });
            
            const axiosInstance = client.getAxiosInstance();
            
            // Verify base URL
            expect(axiosInstance.defaults.baseURL).toBe(config.baseURL);
            
            // Verify timeout
            expect(axiosInstance.defaults.timeout).toBe(config.timeout);
            
            // Verify headers
            expect(axiosInstance.defaults.headers['Content-Type']).toBe(config.headers['Content-Type']);
            expect(axiosInstance.defaults.headers['X-Custom-Header']).toBe(config.headers['X-Custom-Header']);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

// ============================================================================
// SUMMARY
// ============================================================================

describe('Test Summary', () => {
  it('should have all external APIs documented', () => {
    const allApis = getRecommendedTestApis();
    
    // Log available APIs for reference
    console.log('\n=== Available External APIs for Testing ===');
    console.log(`Total APIs: ${allApis.length}`);
    console.log('\nCategories:');
    
    const categories = new Set(allApis.map(api => api.category));
    for (const category of categories) {
      const apisInCategory = allApis.filter(api => api.category === category);
      console.log(`  ${category}: ${apisInCategory.length} APIs`);
    }
    
    console.log('\nRecommended APIs (no auth, CORS enabled):');
    allApis.slice(0, 5).forEach(api => {
      console.log(`  - ${api.name}: ${api.baseURL}`);
    });
    
    expect(allApis.length).toBeGreaterThan(0);
  });
  
  it('should have test environment configuration', () => {
    const env = getTestEnvironment();
    
    expect(env).toHaveProperty('useRealApis');
    expect(env).toHaveProperty('timeout');
    expect(env).toHaveProperty('retryAttempts');
    expect(env).toHaveProperty('cacheResponses');
    
    console.log('\n=== Test Environment Configuration ===');
    console.log(`Environment: ${process.env.TEST_ENV || 'development'}`);
    console.log(`Use Real APIs: ${env.useRealApis}`);
    console.log(`Timeout: ${env.timeout}ms`);
    console.log(`Retry Attempts: ${env.retryAttempts}`);
    console.log(`Cache Responses: ${env.cacheResponses}`);
  });
});