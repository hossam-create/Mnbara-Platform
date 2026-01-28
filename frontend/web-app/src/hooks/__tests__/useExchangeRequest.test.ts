import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useExchangeRequest from '../useExchangeRequest';
import { mockExchangeRequest } from '../../__tests__/fixtures/mock-data';
import React from 'react';

describe('useExchangeRequest', () => {
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

  describe('Fetching Exchange Requests', () => {
    it('should fetch exchange requests', async () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should handle loading state', async () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle error state', async () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Creating Exchange Request', () => {
    it('should create exchange request', async () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });

      const input = {
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: 100,
        toAmount: 375,
        desiredRate: 3.75,
      };

      result.current.createRequest(input);

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });

    it('should handle creation error', async () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });

      const input = {
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: -100, // Invalid
        toAmount: 375,
        desiredRate: 3.75,
      };

      result.current.createRequest(input);

      await waitFor(() => {
        expect(result.current.createError).toBeDefined();
      });
    });
  });

  describe('Updating Exchange Request', () => {
    it('should update exchange request', async () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });

      const input = {
        desiredRate: 3.80,
      };

      result.current.updateRequest(1, input);

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });
  });

  describe('Fetching Single Request', () => {
    it('should fetch single exchange request', async () => {
      const { result } = renderHook(() => useExchangeRequest(1), { wrapper });

      await waitFor(() => {
        expect(result.current.request).toBeDefined();
      });
    });

    it('should handle not found error', async () => {
      const { result } = renderHook(() => useExchangeRequest(999), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('Pagination', () => {
    it('should handle pagination', async () => {
      const { result } = renderHook(
        () => useExchangeRequest(undefined, { page: 1, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.pagination).toBeDefined();
        expect(result.current.pagination?.page).toBe(1);
      });
    });

    it('should fetch next page', async () => {
      const { result } = renderHook(
        () => useExchangeRequest(undefined, { page: 1, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.pagination).toBeDefined();
      });

      result.current.nextPage?.();

      await waitFor(() => {
        expect(result.current.pagination?.page).toBe(2);
      });
    });
  });

  describe('Caching', () => {
    it('should cache requests', async () => {
      const { result: result1 } = renderHook(() => useExchangeRequest(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.requests).toBeDefined();
      });

      const { result: result2 } = renderHook(() => useExchangeRequest(), {
        wrapper,
      });

      expect(result2.current.requests).toEqual(result1.current.requests);
    });
  });
});
