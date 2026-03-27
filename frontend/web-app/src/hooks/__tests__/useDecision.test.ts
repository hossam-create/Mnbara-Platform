/**
 * useDecision Hook Tests
 * Unit tests for decision-related React hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import {
  useDecision,
  useDecisionsByAsset,
  useDecisionStatus,
  useDecisionStatusDisplay,
  useIsAssetApproved,
  useDecisionStatusPolling
} from '../useDecision';
import * as decisionServiceModule from '../../api/decisionService';
import { DecisionStatus, DecisionSource, AssetType } from '../../types/decision.types';

jest.mock('../../api/decisionService');

const mockDecisionService = decisionServiceModule.decisionService as jest.Mocked<any>;

const mockDecision = {
  id: 'decision-123',
  assetType: AssetType.LISTING,
  assetId: 'listing-456',
  status: DecisionStatus.APPROVED,
  source: DecisionSource.INTERNAL,
  authority: 'MNBARH_INTERNAL',
  decisionRef: null,
  reason: null,
  metadata: {},
  requestedAt: '2026-01-29T10:00:00Z',
  decidedAt: '2026-01-29T10:01:00Z',
  expiresAt: null,
  createdAt: '2026-01-29T10:00:00Z',
  updatedAt: '2026-01-29T10:01:00Z'
};

describe('useDecision', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch decision by ID', async () => {
    mockDecisionService.getDecision.mockResolvedValue(mockDecision);

    const { result } = renderHook(() => useDecision('decision-123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.decision).toEqual(mockDecision);
    expect(result.current.error).toBeNull();
  });

  it('should handle null decision ID', async () => {
    const { result } = renderHook(() => useDecision(null));

    expect(result.current.decision).toBeNull();
    expect(mockDecisionService.getDecision).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch');
    mockDecisionService.getDecision.mockRejectedValue(error);

    const { result } = renderHook(() => useDecision('decision-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.decision).toBeNull();
  });
});

describe('useDecisionsByAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch decisions for an asset', async () => {
    const mockDecisions = [mockDecision];
    mockDecisionService.getDecisionsByAsset.mockResolvedValue(mockDecisions);

    const { result } = renderHook(() =>
      useDecisionsByAsset(AssetType.LISTING, 'listing-456')
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.decisions).toEqual(mockDecisions);
    expect(result.current.error).toBeNull();
  });

  it('should handle null asset type or ID', async () => {
    const { result } = renderHook(() => useDecisionsByAsset(null, 'listing-456'));

    expect(result.current.decisions).toEqual([]);
    expect(mockDecisionService.getDecisionsByAsset).not.toHaveBeenCalled();
  });
});

describe('useDecisionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch decision status for an asset', async () => {
    mockDecisionService.getLatestDecisionForAsset.mockResolvedValue(mockDecision);

    const { result } = renderHook(() =>
      useDecisionStatus(AssetType.LISTING, 'listing-456')
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.status).toBe(DecisionStatus.APPROVED);
    expect(result.current.decision).toEqual(mockDecision);
    expect(result.current.isApproved).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.isRejected).toBe(false);
  });

  it('should handle no decision', async () => {
    mockDecisionService.getLatestDecisionForAsset.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useDecisionStatus(AssetType.LISTING, 'listing-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.status).toBeNull();
    expect(result.current.decision).toBeNull();
  });
});

describe('useDecisionStatusDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return display information for decision status', async () => {
    mockDecisionService.getLatestDecisionForAsset.mockResolvedValue(mockDecision);

    const { result } = renderHook(() =>
      useDecisionStatusDisplay(AssetType.LISTING, 'listing-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.display).toBeDefined();
    expect(result.current.display?.status).toBe(DecisionStatus.APPROVED);
    expect(result.current.display?.label).toBe('Approved');
    expect(result.current.display?.color).toBe('success');
  });
});

describe('useIsAssetApproved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check if asset is approved', async () => {
    mockDecisionService.isDecisionApproved.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useIsAssetApproved(AssetType.LISTING, 'listing-456')
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isApproved).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should return false if not approved', async () => {
    mockDecisionService.isDecisionApproved.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useIsAssetApproved(AssetType.LISTING, 'listing-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isApproved).toBe(false);
  });
});

describe('useDecisionStatusPolling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should poll decision status when pending', async () => {
    const pendingDecision = { ...mockDecision, status: DecisionStatus.PENDING };
    mockDecisionService.getLatestDecisionForAsset.mockResolvedValue(pendingDecision);

    const { result } = renderHook(() =>
      useDecisionStatusPolling(AssetType.LISTING, 'listing-456', 5000)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.status).toBe(DecisionStatus.PENDING);

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    // Should have called refetch
    expect(mockDecisionService.getLatestDecisionForAsset).toHaveBeenCalledTimes(2);
  });

  it('should not poll when status is approved', async () => {
    mockDecisionService.getLatestDecisionForAsset.mockResolvedValue(mockDecision);

    const { result } = renderHook(() =>
      useDecisionStatusPolling(AssetType.LISTING, 'listing-456', 5000)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.status).toBe(DecisionStatus.APPROVED);

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    // Should not have called refetch again
    expect(mockDecisionService.getLatestDecisionForAsset).toHaveBeenCalledTimes(1);
  });
});
