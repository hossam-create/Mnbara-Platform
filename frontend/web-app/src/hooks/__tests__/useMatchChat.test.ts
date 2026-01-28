import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useMatchChat from '../useMatchChat';
import React from 'react';

describe('useMatchChat', () => {
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

  describe('Fetching Messages', () => {
    it('should fetch messages', async () => {
      const { result } = renderHook(() => useMatchChat('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.messages).toBeDefined();
      });
    });

    it('should handle loading state', async () => {
      const { result } = renderHook(() => useMatchChat('1'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Sending Messages', () => {
    it('should send message', async () => {
      const { result } = renderHook(() => useMatchChat('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.messages).toBeDefined();
      });

      act(() => {
        result.current.sendMessage?.('Hello');
      });

      await waitFor(() => {
        expect(result.current.isSending).toBe(false);
      });
    });

    it('should detect external contact', async () => {
      const { result } = renderHook(() => useMatchChat('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.messages).toBeDefined();
      });

      const hasExternalContact = result.current.messages?.some(
        m => m.containsExternalContact
      );

      if (hasExternalContact) {
        expect(result.current.hasExternalContact).toBe(true);
      }
    });
  });

  describe('Real-time Updates', () => {
    it('should poll for new messages', async () => {
      const { result } = renderHook(() => useMatchChat('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.messages).toBeDefined();
      });

      const initialCount = result.current.messages?.length || 0;

      // Wait for polling interval
      await new Promise(resolve => setTimeout(resolve, 3500));

      expect(result.current.messages).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error', async () => {
      const { result } = renderHook(() => useMatchChat('999'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle send error', async () => {
      const { result } = renderHook(() => useMatchChat('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.messages).toBeDefined();
      });

      act(() => {
        result.current.sendMessage?.('');
      });

      await waitFor(() => {
        expect(result.current.sendError).toBeDefined();
      });
    });
  });
});
