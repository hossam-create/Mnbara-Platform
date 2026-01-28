import { describe, it, expect } from 'vitest';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import marketplaceApi from '../marketplace.api';
import { mockExchangeRequests } from '../../../__tests__/fixtures/mock-data';

const API_BASE_URL = 'http://localhost:3001/api';

describe('Marketplace API', () => {
  describe('GET /marketplace', () => {
    it('should fetch marketplace requests', async () => {
      const result = await marketplaceApi.getMarketplace();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should handle pagination', async () => {
      const result = await marketplaceApi.getMarketplace({
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(10);
    });

    it('should filter by currency pair', async () => {
      const result = await marketplaceApi.getMarketplace({
        fromCurrency: 'USD',
        toCurrency: 'SAR',
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by amount range', async () => {
      const result = await marketplaceApi.getMarketplace({
        minAmount: 100,
        maxAmount: 1000,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by rate range', async () => {
      const result = await marketplaceApi.getMarketplace({
        minRate: 3.5,
        maxRate: 4.0,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by trust level', async () => {
      const result = await marketplaceApi.getMarketplace({
        minTrustLevel: 3,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should sort by rate', async () => {
      const result = await marketplaceApi.getMarketplace({
        sortBy: 'rate',
        sortOrder: 'asc',
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should sort by amount', async () => {
      const result = await marketplaceApi.getMarketplace({
        sortBy: 'amount',
        sortOrder: 'desc',
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should sort by reputation', async () => {
      const result = await marketplaceApi.getMarketplace({
        sortBy: 'reputation',
        sortOrder: 'desc',
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should sort by time', async () => {
      const result = await marketplaceApi.getMarketplace({
        sortBy: 'time',
        sortOrder: 'desc',
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle API error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/marketplace`, () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        })
      );

      await expect(marketplaceApi.getMarketplace()).rejects.toThrow();
    });

    it('should handle network error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/marketplace`, () => {
          return HttpResponse.error();
        })
      );

      await expect(marketplaceApi.getMarketplace()).rejects.toThrow();
    });

    it('should handle timeout', async () => {
      server.use(
        http.get(`${API_BASE_URL}/marketplace`, async () => {
          await new Promise(resolve => setTimeout(resolve, 10000));
          return HttpResponse.json({ success: true, data: [] });
        })
      );

      const promise = marketplaceApi.getMarketplace();
      await expect(promise).rejects.toThrow();
    });
  });

  describe('POST /marketplace/accept', () => {
    it('should accept a marketplace request', async () => {
      server.use(
        http.post(`${API_BASE_URL}/marketplace/accept`, () => {
          return HttpResponse.json({
            success: true,
            data: { id: 1, status: 'MATCHED' },
          });
        })
      );

      const result = await marketplaceApi.acceptRequest(1);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('MATCHED');
    });

    it('should handle accept error', async () => {
      server.use(
        http.post(`${API_BASE_URL}/marketplace/accept`, () => {
          return HttpResponse.json(
            { success: false, error: 'Cannot accept' },
            { status: 400 }
          );
        })
      );

      await expect(marketplaceApi.acceptRequest(1)).rejects.toThrow();
    });

    it('should handle not found error', async () => {
      server.use(
        http.post(`${API_BASE_URL}/marketplace/accept`, () => {
          return HttpResponse.json(
            { success: false, error: 'Request not found' },
            { status: 404 }
          );
        })
      );

      await expect(marketplaceApi.acceptRequest(999)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/marketplace`, () => {
          return HttpResponse.text('Invalid JSON');
        })
      );

      await expect(marketplaceApi.getMarketplace()).rejects.toThrow();
    });

    it('should handle empty response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/marketplace`, () => {
          return HttpResponse.json({
            success: true,
            data: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
            },
          });
        })
      );

      const result = await marketplaceApi.getMarketplace();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('Request Headers', () => {
    it('should include authorization header', async () => {
      let capturedHeaders: Record<string, string> = {};

      server.use(
        http.get(`${API_BASE_URL}/marketplace`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers);
          return HttpResponse.json({ success: true, data: [] });
        })
      );

      await marketplaceApi.getMarketplace();

      expect(capturedHeaders['authorization']).toBeDefined();
    });

    it('should include content-type header on POST', async () => {
      let capturedHeaders: Record<string, string> = {};

      server.use(
        http.post(`${API_BASE_URL}/marketplace/accept`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers);
          return HttpResponse.json({
            success: true,
            data: { id: 1, status: 'MATCHED' },
          });
        })
      );

      await marketplaceApi.acceptRequest(1);

      expect(capturedHeaders['content-type']).toContain('application/json');
    });
  });

  describe('Query Parameters', () => {
    it('should include all filter parameters in query string', async () => {
      let capturedUrl = '';

      server.use(
        http.get(`${API_BASE_URL}/marketplace`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ success: true, data: [] });
        })
      );

      await marketplaceApi.getMarketplace({
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        minAmount: 100,
        maxAmount: 1000,
        page: 1,
        limit: 10,
      });

      expect(capturedUrl).toContain('fromCurrency=USD');
      expect(capturedUrl).toContain('toCurrency=SAR');
      expect(capturedUrl).toContain('minAmount=100');
      expect(capturedUrl).toContain('maxAmount=1000');
      expect(capturedUrl).toContain('page=1');
      expect(capturedUrl).toContain('limit=10');
    });
  });

  describe('Response Validation', () => {
    it('should validate response structure', async () => {
      const result = await marketplaceApi.getMarketplace();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });

    it('should validate pagination structure', async () => {
      const result = await marketplaceApi.getMarketplace();

      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('totalPages');
    });
  });
});
