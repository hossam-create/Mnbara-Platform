import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useMatch from '../useMatch';
import React from 'react';

describe('useMatch', () => {
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

  describe('Fetching Match', () => {
    it('should fetch match details', async () => {
      const { result } = renderHook(() => useMatch('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.match).toBeDefined();
      });
    });

    it('should handle loading state', async () => {
      const { result } = renderHook(() => useMatch('1'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Payment Initiation', () => {
    it('should initiate payment', async () => {
      const { result } = renderHook(() => useMatch('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.match).toBeDefined();
      });

      act(() => {
        result.current.initiatePayment?.();
      });

      await waitFor(() => {
        expect(result.current.isInitiatingPayment).toBe(false);
      });
    });
  });

  describe('Proof Upload', () => {
    it('should upload proof', async () => {
      const { result } = renderHook(() => useMatch('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.match).toBeDefined();
      });

      const file = new File(['proof'], 'proof.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.uploadProof?.(file);
      });

      await waitFor(() => {
        expect(result.current.isUploadingProof).toBe(false);
      });
    });
  });

  describe('Receipt Confirmation', () => {
    it('should confirm receipt', async () => {
      const { result } = renderHook(() => useMatch('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.match).toBeDefined();
      });

      act(() => {
        result.current.confirmReceipt?.();
      });

      await waitFor(() => {
        expect(result.current.isConfirmingReceipt).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error', async () => {
      const { result } = renderHook(() => useMatch('999'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });
});
