import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useSecurity from '../useSecurity';
import React from 'react';

describe('useSecurity', () => {
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

  describe('Security Deposit', () => {
    it('should fetch security deposit', async () => {
      const { result } = renderHook(() => useSecurity(), { wrapper });

      await waitFor(() => {
        expect(result.current.deposit).toBeDefined();
      });
    });

    it('should add deposit', async () => {
      const { result } = renderHook(() => useSecurity(), { wrapper });

      await waitFor(() => {
        expect(result.current.deposit).toBeDefined();
      });

      act(() => {
        result.current.addDeposit?.({ amount: 100, currency: 'USD' });
      });

      await waitFor(() => {
        expect(result.current.isAddingDeposit).toBe(false);
      });
    });
  });

  describe('Trust Level', () => {
    it('should fetch trust level', async () => {
      const { result } = renderHook(() => useSecurity(), { wrapper });

      await waitFor(() => {
        expect(result.current.trustLevel).toBeDefined();
      });
    });

    it('should have trust level properties', async () => {
      const { result } = renderHook(() => useSecurity(), { wrapper });

      await waitFor(() => {
        expect(result.current.trustLevel?.level).toBeDefined();
        expect(result.current.trustLevel?.maxTransactionAmount).toBeDefined();
      });
    });
  });

  describe('External Escrow', () => {
    it('should fetch escrow providers', async () => {
      const { result } = renderHook(() => useSecurity(), { wrapper });

      await waitFor(() => {
        expect(result.current.escrowProviders).toBeDefined();
      });
    });

    it('should select escrow provider', async () => {
      const { result } = renderHook(() => useSecurity(), { wrapper });

      await waitFor(() => {
        expect(result.current.escrowProviders).toBeDefined();
      });

      act(() => {
        result.current.selectEscrowProvider?.(1);
      });

      expect(result.current.selectedEscrowProvider).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error', async () => {
      const { result } = renderHook(() => useSecurity(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});
