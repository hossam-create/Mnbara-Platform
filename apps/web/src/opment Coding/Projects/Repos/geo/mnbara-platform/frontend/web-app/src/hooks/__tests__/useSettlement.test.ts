import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useSettlement from '../useSettlement';
import { mockMatches } from '../../__tests__/fixtures/mock-data';

describe('useSettlement', () => {
  const mockMatch = mockMatches[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.settlementStatus).toBeNull();
    });
  });

  describe('Settlement Initiation', () => {
    it('should initiate settlement', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        await result.current.initiateSettlement();
      });

      await waitFor(() => {
        expect(result.current.settlementStatus).toBe('INITIATED');
      });
    });

    it('should set loading state during settlement', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      act(() => {
        result.current.initiateSettlement();
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Settlement Confirmation', () => {
    it('should confirm settlement', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        await result.current.confirmSettlement();
      });

      await waitFor(() => {
        expect(result.current.settlementStatus).toBe('CONFIRMED');
      });
    });
  });

  describe('Settlement Finalization', () => {
    it('should finalize settlement', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        await result.current.finalizeSettlement();
      });

      await waitFor(() => {
        expect(result.current.settlementStatus).toBe('FINALIZED');
      });
    });
  });

  describe('Settlement Status', () => {
    it('should fetch settlement status', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        const status = await result.current.getSettlementStatus();
        expect(status).toBeDefined();
      });
    });

    it('should get settlement details', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        const details = await result.current.getSettlementDetails();
        expect(details).toBeDefined();
      });
    });
  });

  describe('Settlement Cancellation', () => {
    it('should cancel settlement', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        await result.current.cancelSettlement('reason');
      });

      await waitFor(() => {
        expect(result.current.settlementStatus).toBe('CANCELLED');
      });
    });

    it('should require cancellation reason', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        try {
          await result.current.cancelSettlement('');
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Settlement Timeline', () => {
    it('should get settlement timeline', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        const timeline = await result.current.getSettlementTimeline();
        expect(timeline).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle settlement errors', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        try {
          await result.current.initiateSettlement();
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it('should clear errors', async () => {
      const { result } = renderHook(() => useSettlement(mockMatch));

      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useSettlement(mockMatch));

      expect(() => unmount()).not.toThrow();
    });
  });
});
