import { describe, it, expect, beforeEach, vi } from 'vitest';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import * as adminExchangeApi from '../admin-exchange.api';
import { mockExchangeRequests, mockMatches } from '../../../__tests__/fixtures/mock-data';

describe('Admin Exchange API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fetch Exchanges', () => {
    it('should fetch all exchanges', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/exchanges', () => {
          return HttpResponse.json({
            data: mockExchangeRequests,
            total: mockExchangeRequests.length,
          });
        })
      );

      const result = await adminExchangeApi.fetchExchanges();

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should fetch exchanges with filters', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/exchanges', ({ request }) => {
          const url = new URL(request.url);
          const status = url.searchParams.get('status');

          if (status === 'ACTIVE') {
            return HttpResponse.json({
              data: mockExchangeRequests.filter(e => e.status === 'ACTIVE'),
            });
          }

          return HttpResponse.json({ data: mockExchangeRequests });
        })
      );

      const result = await adminExchangeApi.fetchExchanges({ status: 'ACTIVE' });

      expect(result.data).toBeDefined();
    });

    it('should handle fetch errors', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/exchanges', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      await expect(adminExchangeApi.fetchExchanges()).rejects.toThrow();
    });
  });

  describe('Get Exchange Details', () => {
    it('should get exchange by ID', async () => {
      const exchangeId = mockExchangeRequests[0].id;

      server.use(
        http.get(`/api/p2p-exchange/admin/exchanges/${exchangeId}`, () => {
          return HttpResponse.json({ data: mockExchangeRequests[0] });
        })
      );

      const result = await adminExchangeApi.getExchangeById(exchangeId);

      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(exchangeId);
    });

    it('should handle not found error', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/exchanges/invalid-id', () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      await expect(adminExchangeApi.getExchangeById('invalid-id')).rejects.toThrow();
    });
  });

  describe('Approve Exchange', () => {
    it('should approve exchange', async () => {
      const exchangeId = mockExchangeRequests[0].id;

      server.use(
        http.post(`/api/p2p-exchange/admin/exchanges/${exchangeId}/approve`, () => {
          return HttpResponse.json({
            data: { ...mockExchangeRequests[0], status: 'APPROVED' },
          });
        })
      );

      const result = await adminExchangeApi.approveExchange(exchangeId);

      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('APPROVED');
    });

    it('should handle approval errors', async () => {
      server.use(
        http.post('/api/p2p-exchange/admin/exchanges/invalid-id/approve', () => {
          return HttpResponse.json({ error: 'Cannot approve' }, { status: 400 });
        })
      );

      await expect(adminExchangeApi.approveExchange('invalid-id')).rejects.toThrow();
    });
  });

  describe('Reject Exchange', () => {
    it('should reject exchange', async () => {
      const exchangeId = mockExchangeRequests[0].id;

      server.use(
        http.post(`/api/p2p-exchange/admin/exchanges/${exchangeId}/reject`, () => {
          return HttpResponse.json({
            data: { ...mockExchangeRequests[0], status: 'REJECTED' },
          });
        })
      );

      const result = await adminExchangeApi.rejectExchange(exchangeId, 'Invalid proof');

      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('REJECTED');
    });

    it('should require rejection reason', async () => {
      const exchangeId = mockExchangeRequests[0].id;

      server.use(
        http.post(`/api/p2p-exchange/admin/exchanges/${exchangeId}/reject`, () => {
          return HttpResponse.json({ error: 'Reason required' }, { status: 400 });
        })
      );

      await expect(adminExchangeApi.rejectExchange(exchangeId, '')).rejects.toThrow();
    });
  });

  describe('Approve Proof', () => {
    it('should approve proof', async () => {
      const proofId = 'proof-1';

      server.use(
        http.post(`/api/p2p-exchange/admin/proofs/${proofId}/approve`, () => {
          return HttpResponse.json({
            data: { id: proofId, status: 'APPROVED' },
          });
        })
      );

      const result = await adminExchangeApi.approveProof(proofId);

      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('APPROVED');
    });
  });

  describe('Reject Proof', () => {
    it('should reject proof', async () => {
      const proofId = 'proof-1';

      server.use(
        http.post(`/api/p2p-exchange/admin/proofs/${proofId}/reject`, () => {
          return HttpResponse.json({
            data: { id: proofId, status: 'REJECTED' },
          });
        })
      );

      const result = await adminExchangeApi.rejectProof(proofId, 'Blurry image');

      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('REJECTED');
    });
  });

  describe('Get Pending Proofs', () => {
    it('should fetch pending proofs', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/proofs/pending', () => {
          return HttpResponse.json({
            data: [
              { id: 'proof-1', status: 'PENDING' },
              { id: 'proof-2', status: 'PENDING' },
            ],
          });
        })
      );

      const result = await adminExchangeApi.getPendingProofs();

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('Get Disputes', () => {
    it('should fetch disputes', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/disputes', () => {
          return HttpResponse.json({
            data: [
              { id: 'dispute-1', status: 'OPEN' },
              { id: 'dispute-2', status: 'OPEN' },
            ],
          });
        })
      );

      const result = await adminExchangeApi.getDisputes();

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('Resolve Dispute', () => {
    it('should resolve dispute', async () => {
      const disputeId = 'dispute-1';

      server.use(
        http.post(`/api/p2p-exchange/admin/disputes/${disputeId}/resolve`, () => {
          return HttpResponse.json({
            data: { id: disputeId, status: 'RESOLVED' },
          });
        })
      );

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
      server.use(
        http.get('/api/p2p-exchange/admin/stats/dashboard', () => {
          return HttpResponse.json({
            data: {
              totalExchanges: 100,
              activeExchanges: 25,
              pendingExchanges: 10,
              completedExchanges: 60,
              disputedExchanges: 5,
            },
          });
        })
      );

      const result = await adminExchangeApi.getDashboardStats();

      expect(result.data).toBeDefined();
      expect(result.data.totalExchanges).toBe(100);
    });
  });

  describe('Export Data', () => {
    it('should export exchanges to CSV', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/exchanges/export/csv', () => {
          return new HttpResponse('id,status,amount\n1,ACTIVE,100', {
            headers: {
              'Content-Type': 'text/csv',
            },
          });
        })
      );

      const result = await adminExchangeApi.exportExchanges('csv');

      expect(result).toBeDefined();
    });

    it('should export exchanges to JSON', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/exchanges/export/json', () => {
          return HttpResponse.json({
            data: mockExchangeRequests,
          });
        })
      );

      const result = await adminExchangeApi.exportExchanges('json');

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/exchanges', () => {
          return HttpResponse.error();
        })
      );

      await expect(adminExchangeApi.fetchExchanges()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/exchanges', async () => {
          await new Promise(resolve => setTimeout(resolve, 10000));
          return HttpResponse.json({ data: [] });
        })
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100)
      );

      await expect(
        Promise.race([adminExchangeApi.fetchExchanges(), timeoutPromise])
      ).rejects.toThrow();
    });
  });

  describe('Request Validation', () => {
    it('should validate required parameters', async () => {
      await expect(adminExchangeApi.rejectExchange('', 'reason')).rejects.toThrow();
    });

    it('should validate filter parameters', async () => {
      server.use(
        http.get('/api/p2p-exchange/admin/exchanges', () => {
          return HttpResponse.json({ data: [] });
        })
      );

      const result = await adminExchangeApi.fetchExchanges({
        status: 'ACTIVE',
        limit: 10,
        offset: 0,
      });

      expect(result.data).toBeDefined();
    });
  });
});
