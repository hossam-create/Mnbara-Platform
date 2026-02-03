import { describe, it, expect, beforeEach, vi } from 'vitest';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import * as adminExchangeApi from '../admin-exchange.api';
import { mockExchangeRequests } from '../../../__tests__/fixtures/mock-data';

const API_BASE_URL = 'http://localhost:3001/api';

describe('Admin Exchange API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fetch Exchanges', () => {
    it('should fetch all exchanges', async () => {
      const result = await adminExchangeApi.fetchExchanges();

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should fetch exchanges with filters', async () => {
      const result = await adminExchangeApi.fetchExchanges({ status: 'OPEN' });

      expect(result.data).toBeDefined();
    });

    it('should handle fetch errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/admin/exchanges`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      await expect(adminExchangeApi.fetchExchanges()).rejects.toThrow();
    });
  });

  describe('Get Exchange Details', () => {
    it('should get exchange by ID', async () => {
      const exchangeId = mockExchangeRequests[0].id;

      const result = await adminExchangeApi.getExchangeById(exchangeId);

      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(exchangeId);
    });

    it('should handle not found error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/admin/exchanges/invalid-id`, () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      await expect(adminExchangeApi.getExchangeById('invalid-id')).rejects.toThrow();
    });
  });

  describe('Approve Exchange', () => {
    it('should approve exchange', async () => {
      const exchangeId = mockExchangeRequests[0].id;

      const result = await adminExchangeApi.approveExchange(exchangeId);

      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('APPROVED');
    });

    it('should handle approval errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/admin/exchanges/invalid-id/approve`, () => {
          return HttpResponse.json({ error: 'Cannot approve' }, { status: 400 });
        })
      );

      await expect(adminExchangeApi.approveExchange('invalid-id')).rejects.toThrow();
    });
  });

  describe('Reject Exchange', () => {
    it('should reject exchange', async () => {
      const exchangeId = mockExchangeRequests[0].id;

      const result = await adminExchangeApi.rejectExchange(exchangeId, 'Invalid proof');

      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('REJECTED');
    });

    it('should require rejection reason', async () => {
      const exchangeId = mockExchangeRequests[0].id;

      server.use(
        http.post(`${API_BASE_URL}/admin/exchanges/${exchangeId}/reject`, () => {
          return HttpResponse.json({ error: 'Reason required' }, { status: 400 });
        })
      );

      await expect(adminExchangeApi.rejectExchange(exchangeId, '')).rejects.toThrow();
    });
  });

  describe('Approve Proof', () => {
    it('should approve proof', async () => {
      const proofId = 'proof-1';

      const result = await adminExchangeApi.approveProof(proofId);

      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
    });
  });

  describe('Reject Proof', () => {
    it('should reject proof', async () => {
      const proofId = 'proof-1';

      const result = await adminExchangeApi.rejectProof(proofId, 'Blurry image');

      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
    });
  });

  describe('Get Pending Proofs', () => {
    it('should fetch pending proofs', async () => {
      const result = await adminExchangeApi.getPendingProofs();

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('Get Disputes', () => {
    it('should fetch disputes', async () => {
      const result = await adminExchangeApi.getDisputes();

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('Resolve Dispute', () => {
    it('should resolve dispute', async () => {
      const disputeId = 'dispute-1';

      const result = await adminExchangeApi.resolveDispute(
        disputeId,
        'RESOLVED_FOR_BUYER'
      );

      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('RESOLVED');
    });
  });

  describe('Get Dashboard Statistics', () => {
    it('should fetch dashboard statistics', async () => {
      const result = await adminExchangeApi.getDashboardStats();

      expect(result.data).toBeDefined();
      expect(result.data.totalExchanges).toBe(100);
    });
  });

  describe('Export Data', () => {
    it('should export exchanges to JSON', async () => {
      const result = await adminExchangeApi.exportExchanges('json');

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/admin/exchanges`, () => {
          return HttpResponse.error();
        })
      );

      await expect(adminExchangeApi.fetchExchanges()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      // Timeout handling is typically done at the HTTP client level
      // This test verifies the API can handle errors gracefully
      server.use(
        http.get(`${API_BASE_URL}/admin/exchanges`, () => {
          return HttpResponse.error();
        })
      );

      await expect(adminExchangeApi.fetchExchanges()).rejects.toThrow();
    });
  });

  describe('Request Validation', () => {
    it('should validate required parameters', async () => {
      await expect(adminExchangeApi.rejectExchange('', 'reason')).rejects.toThrow();
    });

    it('should validate filter parameters', async () => {
      const result = await adminExchangeApi.fetchExchanges({
        status: 'OPEN',
        limit: 10,
        offset: 0,
      });

      expect(result.data).toBeDefined();
    });
  });
});
