import { describe, it, expect } from 'vitest';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import matchApi from '../match.api';
import { mockExchangeMatch } from '../../../__tests__/fixtures/mock-data';

const API_BASE_URL = 'http://localhost:3001/api';

describe('Match API', () => {
  describe('GET /matches', () => {
    it('should fetch all matches', async () => {
      const result = await matchApi.getAll();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle pagination', async () => {
      const result = await matchApi.getAll({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.pagination).toBeDefined();
    });
  });

  describe('GET /matches/:id', () => {
    it('should fetch single match', async () => {
      const result = await matchApi.getById(1);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
    });

    it('should handle not found error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/matches/:id`, () => {
          return HttpResponse.json(
            { success: false, error: 'Not found' },
            { status: 404 }
          );
        })
      );

      await expect(matchApi.getById(999)).rejects.toThrow();
    });
  });

  describe('POST /matches', () => {
    it('should create match', async () => {
      const result = await matchApi.create({
        requestId: 1,
        counterRequestId: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data.requestId).toBe(1);
    });
  });

  describe('POST /matches/:id/accept', () => {
    it('should accept match', async () => {
      const result = await matchApi.accept(1);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/matches`, () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        })
      );

      await expect(matchApi.getAll()).rejects.toThrow();
    });
  });
});
