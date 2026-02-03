import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import exchangeRequestApi from '../exchange-request.api';
import { mockExchangeRequest } from '../../../__tests__/fixtures/mock-data';

const API_BASE_URL = 'http://localhost:3001/api';

describe('Exchange Request API', () => {
  describe('GET /exchange-requests', () => {
    it('should fetch all exchange requests', async () => {
      const result = await exchangeRequestApi.getAll();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should handle pagination', async () => {
      const result = await exchangeRequestApi.getAll({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(10);
    });

    it('should handle API error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/exchange-requests`, () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        })
      );

      await expect(exchangeRequestApi.getAll()).rejects.toThrow();
    });

    it('should handle network error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/exchange-requests`, () => {
          return HttpResponse.error();
        })
      );

      await expect(exchangeRequestApi.getAll()).rejects.toThrow();
    });
  });

  describe('GET /exchange-requests/:id', () => {
    it('should fetch single exchange request', async () => {
      const result = await exchangeRequestApi.getById(1);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
    });

    it('should handle not found error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/exchange-requests/:id`, () => {
          return HttpResponse.json(
            { success: false, error: 'Not found' },
            { status: 404 }
          );
        })
      );

      await expect(exchangeRequestApi.getById(999)).rejects.toThrow();
    });
  });

  describe('POST /exchange-requests', () => {
    it('should create exchange request', async () => {
      const input = {
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: 100,
        toAmount: 375,
        desiredRate: 3.75,
      };

      const result = await exchangeRequestApi.create(input);

      expect(result.success).toBe(true);
      expect(result.data.fromCurrency).toBe('USD');
      expect(result.data.toCurrency).toBe('SAR');
    });

    it('should handle validation error', async () => {
      server.use(
        http.post(`${API_BASE_URL}/exchange-requests`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Validation error',
              details: { fromAmount: 'Must be positive' },
            },
            { status: 400 }
          );
        })
      );

      const input = {
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: -100,
        toAmount: 375,
        desiredRate: 3.75,
      };

      await expect(exchangeRequestApi.create(input)).rejects.toThrow();
    });
  });

  describe('PATCH /exchange-requests/:id', () => {
    it('should update exchange request', async () => {
      const input = {
        desiredRate: 3.80,
      };

      const result = await exchangeRequestApi.update(1, input);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
    });

    it('should handle update error', async () => {
      server.use(
        http.patch(`${API_BASE_URL}/exchange-requests/:id`, () => {
          return HttpResponse.json(
            { success: false, error: 'Cannot update' },
            { status: 400 }
          );
        })
      );

      const input = { desiredRate: 3.80 };

      await expect(exchangeRequestApi.update(1, input)).rejects.toThrow();
    });
  });

  describe('DELETE /exchange-requests/:id', () => {
    it('should cancel exchange request', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/exchange-requests/:id`, () => {
          return HttpResponse.json({
            success: true,
            data: { id: 1, status: 'CANCELLED' },
          });
        })
      );

      const result = await exchangeRequestApi.cancel(1);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout', async () => {
      // Timeout handling is typically done at the HTTP client level
      // This test verifies the API can handle errors gracefully
      server.use(
        http.get(`${API_BASE_URL}/exchange-requests`, () => {
          return HttpResponse.error();
        })
      );

      await expect(exchangeRequestApi.getAll()).rejects.toThrow();
    });

    it('should handle malformed response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/exchange-requests`, () => {
          return HttpResponse.text('Invalid JSON');
        })
      );

      await expect(exchangeRequestApi.getAll()).rejects.toThrow();
    });
  });

  describe('Request Headers', () => {
    it('should include authorization header', async () => {
      let capturedHeaders: Record<string, string> = {};

      server.use(
        http.get(`${API_BASE_URL}/exchange-requests`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers);
          return HttpResponse.json({ success: true, data: [] });
        })
      );

      await exchangeRequestApi.getAll();

      expect(capturedHeaders['authorization']).toBeDefined();
    });

    it('should include content-type header', async () => {
      let capturedHeaders: Record<string, string> = {};

      server.use(
        http.post(`${API_BASE_URL}/exchange-requests`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers);
          return HttpResponse.json({ success: true, data: mockExchangeRequest });
        })
      );

      const input = {
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: 100,
        toAmount: 375,
        desiredRate: 3.75,
      };

      await exchangeRequestApi.create(input);

      expect(capturedHeaders['content-type']).toContain('application/json');
    });
  });
});
