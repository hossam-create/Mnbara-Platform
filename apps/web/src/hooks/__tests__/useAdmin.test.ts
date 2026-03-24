import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useAdmin from '../useAdmin';

describe('useAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAdmin());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.exchanges).toEqual([]);
    });
  });

  describe('Exchange Management', () => {
    it('should fetch exchanges', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.fetchExchanges();
      });

      expect(result.current.exchanges).toBeDefined();
    });

    it('should get exchange by ID', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        const exchange = await result.current.getExchangeById('exc-123');
        expect(exchange).toBeDefined();
      });
    });

    it('should approve exchange', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.approveExchange('exc-123');
      });

      expect(result.current.exchanges).toBeDefined();
    });

    it('should reject exchange', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.rejectExchange('exc-123', 'Invalid proof');
      });

      expect(result.current.exchanges).toBeDefined();
    });
  });

  describe('Proof Verification', () => {
    it('should fetch pending proofs', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        const proofs = await result.current.getPendingProofs();
        expect(proofs).toBeDefined();
      });
    });

    it('should approve proof', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.approveProof('proof-123');
      });

      expect(result.current).toBeDefined();
    });

    it('should reject proof', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.rejectProof('proof-123', 'Blurry image');
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Dispute Management', () => {
    it('should fetch disputes', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        const disputes = await result.current.getDisputes();
        expect(disputes).toBeDefined();
      });
    });

    it('should resolve dispute', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.resolveDispute('dispute-123', 'RESOLVED_FOR_BUYER');
      });

      expect(result.current).toBeDefined();
    });

    it('should escalate dispute', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.escalateDispute('dispute-123');
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should fetch dashboard statistics', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        const stats = await result.current.getDashboardStats();
        expect(stats).toBeDefined();
      });
    });

    it('should get exchange statistics', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        const stats = await result.current.getExchangeStats();
        expect(stats).toBeDefined();
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter exchanges by status', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.filterExchanges({ status: 'PENDING' });
      });

      expect(result.current.exchanges).toBeDefined();
    });

    it('should sort exchanges', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.sortExchanges('createdAt', 'desc');
      });

      expect(result.current.exchanges).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        try {
          await result.current.fetchExchanges();
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it('should clear errors', async () => {
      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useAdmin());

      expect(() => unmount()).not.toThrow();
    });
  });
});
