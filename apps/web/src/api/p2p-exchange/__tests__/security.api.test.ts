import { describe, it, expect } from 'vitest';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import securityApi from '../security.api';

const API_BASE_URL = 'http://localhost:3001/api';

describe('Security API', () => {
  describe('GET /deposits', () => {
    it('should fetch security deposits', async () => {
      const result = await securityApi.getDeposits();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('POST /deposits', () => {
    it('should add security deposit', async () => {
      const result = await securityApi.addDeposit({
        amount: 100,
        currency: 'USD',
        source: 'INITIAL_DEPOSIT',
      });

      expect(result.success).toBe(true);
      expect(result.data.amount).toBe('100');
    });
  });

  describe('GET /trust-levels', () => {
    it('should fetch trust level', async () => {
      const result = await securityApi.getTrustLevel();

      expect(result.success).toBe(true);
      expect(result.data.level).toBeDefined();
    });
  });

  describe('GET /external-escrow-providers', () => {
    it('should fetch escrow providers', async () => {
      const result = await securityApi.getEscrowProviders();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/deposits`, () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        })
      );

      await expect(securityApi.getDeposits()).rejects.toThrow();
    });
  });
});
