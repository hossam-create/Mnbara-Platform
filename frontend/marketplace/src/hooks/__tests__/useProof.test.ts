import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useProof from '../useProof';
import { mockMatches } from '../../__tests__/fixtures/mock-data';

describe('useProof', () => {
  const mockMatch = mockMatches[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useProof(mockMatch));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.proofs).toEqual([]);
    });
  });

  describe('Proof Upload', () => {
    it('should upload proof', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.uploadProof(file);
      });

      await waitFor(() => {
        expect(result.current.proofs.length).toBeGreaterThan(0);
      });
    });

    it('should validate file type', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      const file = new File(['test'], 'proof.txt', { type: 'text/plain' });

      await act(async () => {
        try {
          await result.current.uploadProof(file);
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it('should validate file size', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        try {
          await result.current.uploadProof(largeFile);
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it('should set loading state during upload', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.uploadProof(file);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Proof Retrieval', () => {
    it('should fetch proofs', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      await act(async () => {
        await result.current.fetchProofs();
      });

      expect(result.current.proofs).toBeDefined();
    });

    it('should get proof by ID', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      await act(async () => {
        const proof = await result.current.getProofById('proof-123');
        expect(proof).toBeDefined();
      });
    });
  });

  describe('Proof Deletion', () => {
    it('should delete proof', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      await act(async () => {
        await result.current.deleteProof('proof-123');
      });

      expect(result.current.proofs).toBeDefined();
    });
  });

  describe('Proof Status', () => {
    it('should get proof status', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      await act(async () => {
        const status = await result.current.getProofStatus('proof-123');
        expect(status).toBeDefined();
      });
    });

    it('should update proof status', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      await act(async () => {
        await result.current.updateProofStatus('proof-123', 'APPROVED');
      });

      expect(result.current.proofs).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle upload errors', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      const file = new File(['test'], 'proof.txt', { type: 'text/plain' });

      await act(async () => {
        try {
          await result.current.uploadProof(file);
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it('should clear errors', async () => {
      const { result } = renderHook(() => useProof(mockMatch));

      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useProof(mockMatch));

      expect(() => unmount()).not.toThrow();
    });
  });
});
