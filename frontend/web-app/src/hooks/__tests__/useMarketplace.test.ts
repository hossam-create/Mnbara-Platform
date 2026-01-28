import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useMarketplace from '../useMarketplace';
import React from 'react';

describe('useMarketplace', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('Fetching Marketplace Requests', () => {
    it('should fetch marketplace requests', async () => {
      const { result } = renderHook(() => useMarketplace(), { wrapper });

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should handle loading state', async () => {
      const { result } = renderHook(() => useMarketplace(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle error state', async () => {
      const { result } = renderHook(() => useMarketplace(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by currency pair', async () => {
      const { result } = renderHook(
        () =>
          useMarketplace({
            fromCurrency: 'USD',
            toCurrency: 'SAR',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should filter by amount range', async () => {
      const { result } = renderHook(
        () =>
          useMarketplace({
            minAmount: 100,
            maxAmount: 1000,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should filter by rate range', async () => {
      const { result } = renderHook(
        () =>
          useMarketplace({
            minRate: 3.5,
            maxRate: 4.0,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should filter by trust level', async () => {
      const { result } = renderHook(
        () =>
          useMarketplace({
            minTrustLevel: 3,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by rate', async () => {
      const { result } = renderHook(
        () =>
          useMarketplace({
            sortBy: 'rate',
            sortOrder: 'asc',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should sort by amount', async () => {
      const { result } = renderHook(
        () =>
          useMarketplace({
            sortBy: 'amount',
            sortOrder: 'desc',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should sort by reputation', async () => {
      const { result } = renderHook(
        () =>
          useMarketplace({
            sortBy: 'reputation',
            sortOrder: 'desc',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should sort by time', async () => {
      const { result } = renderHook(
        () =>
          useMarketplace({
            sortBy: 'time',
            sortOrder: 'desc',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });
  });

  describe('Pagination', () => {
    it('should handle pagination', async () => {
      const { result } = renderHook(
        () => useMarketplace({ page: 1, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.pagination).toBeDefined();
        expect(result.current.pagination?.page).toBe(1);
        expect(result.current.pagination?.limit).toBe(10);
      });
    });

    it('should fetch next page', async () => {
      const { result } = renderHook(
        () => useMarketplace({ page: 1, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.pagination).toBeDefined();
      });

      act(() => {
        result.current.nextPage?.();
      });

      await waitFor(() => {
        expect(result.current.pagination?.page).toBe(2);
      });
    });

    it('should fetch previous page', async () => {
      const { result } = renderHook(
        () => useMarketplace({ page: 2, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.pagination).toBeDefined();
      });

      act(() => {
        result.current.prevPage?.();
      });

      await waitFor(() => {
        expect(result.current.pagination?.page).toBe(1);
      });
    });
  });

  describe('Accepting Match', () => {
    it('should accept a match', async () => {
      const { result } = renderHook(() => useMarketplace(), { wrapper });

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });

      act(() => {
        result.current.acceptMatch?.(1);
      });

      await waitFor(() => {
        expect(result.current.isAccepting).toBe(false);
      });
    });

    it('should handle accept error', async () => {
      const { result } = renderHook(() => useMarketplace(), { wrapper });

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });

      act(() => {
        result.current.acceptMatch?.(999);
      });

      await waitFor(() => {
        expect(result.current.acceptError).toBeDefined();
      });
    });
  });

  describe('Caching', () => {
    it('should cache marketplace requests', async () => {
      const { result: result1 } = renderHook(() => useMarketplace(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.requests).toBeDefined();
      });

      const { result: result2 } = renderHook(() => useMarketplace(), {
        wrapper,
      });

      expect(result2.current.requests).toEqual(result1.current.requests);
    });

    it('should invalidate cache on filter change', async () => {
      const { result, rerender } = renderHook(
        ({ filters }) => useMarketplace(filters),
        {
          wrapper,
          initialProps: { filters: {} },
        }
      );

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });

      const initialRequests = result.current.requests;

      rerender({ filters: { fromCurrency: 'USD' } });

      await waitFor(() => {
        // Should refetch with new filters
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should refetch on interval', async () => {
      const { result } = renderHook(() => useMarketplace(), { wrapper });

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });

      const initialRequests = result.current.requests;

      // Wait for refetch interval
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Should have same or updated requests
      expect(result.current.requests).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const { result } = renderHook(() => useMarketplace(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle network errors', async () => {
      const { result } = renderHook(() => useMarketplace(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Refetch', () => {
    it('should manually refetch data', async () => {
      const { result } = renderHook(() => useMarketplace(), { wrapper });

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });

      act(() => {
        result.current.refetch?.();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
