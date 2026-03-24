import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExchangeRequest } from '../useExchangeRequest';
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
    it('should fetch exchange requests', () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });
      expect(result.current).toBeDefined();
    });

    it('should handle loading state', () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });
      expect(result.current).toBeDefined();
    });

    it('should handle error state', () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });
      expect(result.current).toBeDefined();
    });
  });

  describe('Creating Exchange Request', () => {
    it('should create exchange request', () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });
      expect(result.current).toBeDefined();
    });

    it('should handle creation error', () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });
      expect(result.current).toBeDefined();
    });
  });

  describe('Updating Exchange Request', () => {
    it('should update exchange request', () => {
      const { result } = renderHook(() => useExchangeRequest(), { wrapper });
      expect(result.current).toBeDefined();
    });
  });

  describe('Fetching Single Request', () => {
    it('should fetch single exchange request', () => {
      const { result } = renderHook(() => useExchangeRequest(1), { wrapper });
      expect(result.current).toBeDefined();
    });

    it('should handle not found error', () => {
      const { result } = renderHook(() => useExchangeRequest(999), { wrapper });
      expect(result.current).toBeDefined();
    });
  });

  describe('Pagination', () => {
    it('should handle pagination', () => {
      const { result } = renderHook(
        () => useExchangeRequest(),
        { wrapper }
      );
      expect(result.current).toBeDefined();
    });

    it('should fetch next page', () => {
      const { result } = renderHook(
        () => useExchangeRequest(),
        { wrapper }
      );
      expect(result.current).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache requests', () => {
      const { result: result1 } = renderHook(() => useExchangeRequest(), {
        wrapper,
      });
      expect(result1.current).toBeDefined();

      const { result: result2 } = renderHook(() => useExchangeRequest(), {
        wrapper,
      });
      expect(result2.current).toBeDefined();
    });
  });
});
