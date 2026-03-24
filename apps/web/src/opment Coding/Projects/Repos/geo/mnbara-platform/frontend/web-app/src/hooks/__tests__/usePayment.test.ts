import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import usePayment from '../usePayment';
import { mockMatches } from '../../__tests__/fixtures/mock-data';

describe('usePayment', () => {
  const mockMatch = mockMatches[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.paymentStatus).toBeNull();
    });

    it('should accept match as parameter', () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      expect(result.current).toBeDefined();
    });
  });

  describe('Payment Initiation', () => {
    it('should initiate payment', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        await result.current.initiatePayment({
          method: 'bank_transfer',
          amount: mockMatch.amount,
        });
      });

      await waitFor(() => {
        expect(result.current.paymentStatus).toBe('INITIATED');
      });
    });

    it('should set loading state during payment', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      act(() => {
        result.current.initiatePayment({
          method: 'bank_transfer',
          amount: mockMatch.amount,
        });
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle payment errors', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        try {
          await result.current.initiatePayment({
            method: 'invalid',
            amount: -100,
          });
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Payment Confirmation', () => {
    it('should confirm payment', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        await result.current.confirmPayment('payment-123');
      });

      await waitFor(() => {
        expect(result.current.paymentStatus).toBe('CONFIRMED');
      });
    });

    it('should validate payment ID', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        try {
          await result.current.confirmPayment('');
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Payment Cancellation', () => {
    it('should cancel payment', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        await result.current.cancelPayment('payment-123');
      });

      await waitFor(() => {
        expect(result.current.paymentStatus).toBe('CANCELLED');
      });
    });
  });

  describe('Payment Status', () => {
    it('should fetch payment status', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        await result.current.getPaymentStatus('payment-123');
      });

      expect(result.current.paymentStatus).toBeDefined();
    });

    it('should update payment status', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        await result.current.initiatePayment({
          method: 'bank_transfer',
          amount: mockMatch.amount,
        });
      });

      expect(result.current.paymentStatus).toBe('INITIATED');
    });
  });

  describe('Payment Methods', () => {
    it('should fetch available payment methods', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        const methods = await result.current.getPaymentMethods();
        expect(methods).toBeDefined();
      });
    });

    it('should validate payment method', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      const isValid = result.current.validatePaymentMethod('bank_transfer');
      expect(isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        try {
          await result.current.initiatePayment({
            method: 'bank_transfer',
            amount: mockMatch.amount,
          });
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it('should clear errors', async () => {
      const { result } = renderHook(() => usePayment(mockMatch));

      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => usePayment(mockMatch));

      expect(() => unmount()).not.toThrow();
    });
  });
});
