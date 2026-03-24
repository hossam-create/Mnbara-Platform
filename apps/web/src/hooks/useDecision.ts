/**
 * useDecision Hook
 * React hook for fetching and managing decision status
 */

import { useState, useEffect, useCallback } from 'react';
import { decisionService } from '../api/decisionService';
import {
  AssetDecisionRecord,
  DecisionStatus,
  AssetType,
  getDecisionStatusDisplay,
  DecisionStatusDisplay
} from '../types/decision.types';

/**
 * Hook for fetching a single decision by ID
 */
export const useDecision = (decisionId: string | null) => {
  const [decision, setDecision] = useState<AssetDecisionRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDecision = useCallback(async () => {
    if (!decisionId) {
      setDecision(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await decisionService.getDecision(decisionId);
      setDecision(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch decision'));
      setDecision(null);
    } finally {
      setLoading(false);
    }
  }, [decisionId]);

  useEffect(() => {
    fetchDecision();
  }, [fetchDecision]);

  return { decision, loading, error, refetch: fetchDecision };
};

/**
 * Hook for fetching decisions for an asset
 */
export const useDecisionsByAsset = (
  assetType: AssetType | string | null,
  assetId: string | null
) => {
  const [decisions, setDecisions] = useState<AssetDecisionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDecisions = useCallback(async () => {
    if (!assetType || !assetId) {
      setDecisions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await decisionService.getDecisionsByAsset(assetType, assetId);
      setDecisions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch decisions'));
      setDecisions([]);
    } finally {
      setLoading(false);
    }
  }, [assetType, assetId]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  return { decisions, loading, error, refetch: fetchDecisions };
};

/**
 * Hook for getting the latest decision status for an asset
 */
export const useDecisionStatus = (
  assetType: AssetType | string | null,
  assetId: string | null
) => {
  const [status, setStatus] = useState<DecisionStatus | null>(null);
  const [decision, setDecision] = useState<AssetDecisionRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!assetType || !assetId) {
      setStatus(null);
      setDecision(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await decisionService.getLatestDecisionForAsset(assetType, assetId);
      if (data) {
        setStatus(data.status as DecisionStatus);
        setDecision(data);
      } else {
        setStatus(null);
        setDecision(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch decision status'));
      setStatus(null);
      setDecision(null);
    } finally {
      setLoading(false);
    }
  }, [assetType, assetId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    decision,
    loading,
    error,
    isApproved: status === DecisionStatus.APPROVED,
    isPending: status === DecisionStatus.PENDING,
    isRejected: status === DecisionStatus.REJECTED,
    isExpired: status === DecisionStatus.EXPIRED,
    refetch: fetchStatus
  };
};

/**
 * Hook for getting decision status display information
 */
export const useDecisionStatusDisplay = (
  assetType: AssetType | string | null,
  assetId: string | null
) => {
  const { status, loading, error } = useDecisionStatus(assetType, assetId);
  const [display, setDisplay] = useState<DecisionStatusDisplay | null>(null);

  useEffect(() => {
    if (status) {
      setDisplay(getDecisionStatusDisplay(status));
    } else {
      setDisplay(null);
    }
  }, [status]);

  return { display, loading, error };
};

/**
 * Hook for checking if an asset is approved
 */
export const useIsAssetApproved = (
  assetType: AssetType | string | null,
  assetId: string | null
) => {
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkApproval = useCallback(async () => {
    if (!assetType || !assetId) {
      setIsApproved(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const approved = await decisionService.isDecisionApproved(assetType, assetId);
      setIsApproved(approved);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check approval'));
      setIsApproved(false);
    } finally {
      setLoading(false);
    }
  }, [assetType, assetId]);

  useEffect(() => {
    checkApproval();
  }, [checkApproval]);

  return { isApproved, loading, error, refetch: checkApproval };
};

/**
 * Hook for polling decision status
 */
export const useDecisionStatusPolling = (
  assetType: AssetType | string | null,
  assetId: string | null,
  pollInterval: number = 5000
) => {
  const { status, decision, loading, error, refetch } = useDecisionStatus(
    assetType,
    assetId
  );

  useEffect(() => {
    if (!assetType || !assetId) {
      return;
    }

    // Only poll if status is pending
    if (status !== DecisionStatus.PENDING) {
      return;
    }

    const interval = setInterval(() => {
      refetch();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [assetType, assetId, status, pollInterval, refetch]);

  return { status, decision, loading, error, refetch };
};
