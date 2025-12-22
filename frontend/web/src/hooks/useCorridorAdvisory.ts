/**
 * useCorridorAdvisory Hook
 * Sprint 2: React hook for corridor advisory integration
 * 
 * CONSTRAINTS:
 * - Read-only data fetching
 * - Advisory only
 * - Feature-flagged
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCorridorAdvisory,
  classifyMarketIntent,
  getConfirmationCheckpoints,
  getFeatureFlags,
} from '../services/crowdship-ai.service';
import type {
  CorridorAssessment,
  MarketIntentResult,
  HumanConfirmationCheckpoint,
} from '../services/crowdship-ai.service';

interface UseCorridorAdvisoryInput {
  origin: string;
  destination: string;
  itemValueUSD: number;
  deliveryDays?: number;
  buyerId?: number;
  travelerId?: number;
  pageContext?: string;
  action?: string;
  userRole?: 'buyer' | 'traveler';
  productUrl?: string;
}

interface UseCorridorAdvisoryResult {
  // Data
  corridorAssessment: CorridorAssessment | null;
  marketIntent: MarketIntentResult | null;
  confirmationCheckpoints: HumanConfirmationCheckpoint[];
  
  // State
  isLoading: boolean;
  isEnabled: boolean;
  error: string | null;
  correlationId: string | null;
  
  // Feature flags
  flags: {
    corridorAiAdvisory: boolean;
    trustGating: boolean;
    intentChipUi: boolean;
    humanConfirmationCheckpoints: boolean;
  };
  
  // Actions
  refetch: () => Promise<void>;
  classifyIntent: (signals: Parameters<typeof classifyMarketIntent>[0]) => Promise<void>;
}

export function useCorridorAdvisory(input: UseCorridorAdvisoryInput | null): UseCorridorAdvisoryResult {
  const [corridorAssessment, setCorridorAssessment] = useState<CorridorAssessment | null>(null);
  const [marketIntent, setMarketIntent] = useState<MarketIntentResult | null>(null);
  const [confirmationCheckpoints, setConfirmationCheckpoints] = useState<HumanConfirmationCheckpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correlationId] = useState<string | null>(null);

  const flags = getFeatureFlags();
  const isEnabled = flags.corridorAiAdvisory;

  const fetchCorridorAdvisory = useCallback(async () => {
    if (!input || !isEnabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch corridor assessment
      const corridorResponse = await getCorridorAdvisory({
        origin: input.origin,
        destination: input.destination,
        itemValueUSD: input.itemValueUSD,
        deliveryDays: input.deliveryDays || 14,
        buyerId: input.buyerId || 0,
        travelerId: input.travelerId || 0,
      });

      if (corridorResponse.data) {
        setCorridorAssessment(corridorResponse.data);
      } else {
        setError(corridorResponse.message || 'Corridor advisory unavailable');
      }

      // Fetch market intent
      const intentResponse = await classifyMarketIntent({
        pageContext: input.pageContext,
        action: input.action,
        userRole: input.userRole,
        productUrl: input.productUrl,
        isCrossBorder: input.origin !== input.destination,
      });

      if (intentResponse.data) {
        setMarketIntent(intentResponse.data);
      }

      // Fetch confirmation checkpoints
      if (flags.humanConfirmationCheckpoints) {
        const checkpointsResponse = await getConfirmationCheckpoints({
          isCrossBorder: input.origin !== input.destination,
          isContactingTraveler: false,
          isSelectingPayment: false,
        });
        setConfirmationCheckpoints(checkpointsResponse.data);
      }

    } catch (err) {
      setError('Failed to fetch corridor advisory');
      console.error('Corridor advisory error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [input, isEnabled, flags.humanConfirmationCheckpoints]);

  const classifyIntentManual = useCallback(async (signals: Parameters<typeof classifyMarketIntent>[0]) => {
    if (!isEnabled) return;

    try {
      const response = await classifyMarketIntent(signals);
      if (response.data) {
        setMarketIntent(response.data);
      }
    } catch (err) {
      console.error('Intent classification error:', err);
    }
  }, [isEnabled]);

  useEffect(() => {
    fetchCorridorAdvisory();
  }, [fetchCorridorAdvisory]);

  return {
    corridorAssessment,
    marketIntent,
    confirmationCheckpoints,
    isLoading,
    isEnabled,
    error,
    correlationId,
    flags,
    refetch: fetchCorridorAdvisory,
    classifyIntent: classifyIntentManual,
  };
}

/**
 * Hook for managing confirmation checkpoints flow
 */
export function useConfirmationFlow(checkpoints: HumanConfirmationCheckpoint[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const currentCheckpoint = checkpoints[currentIndex] || null;
  const progress = checkpoints.length > 0 ? ((currentIndex + 1) / checkpoints.length) * 100 : 0;

  const confirm = useCallback((checkpointId: string) => {
    const newConfirmed = new Set(confirmedIds);
    newConfirmed.add(checkpointId);
    setConfirmedIds(newConfirmed);

    if (currentIndex < checkpoints.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsComplete(true);
    }
  }, [confirmedIds, currentIndex, checkpoints.length]);

  const cancel = useCallback(() => {
    setIsCancelled(true);
  }, []);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setConfirmedIds(new Set());
    setIsComplete(false);
    setIsCancelled(false);
  }, []);

  return {
    currentCheckpoint,
    currentIndex,
    totalCheckpoints: checkpoints.length,
    progress,
    confirmedIds,
    isComplete,
    isCancelled,
    confirm,
    cancel,
    reset,
  };
}

export default useCorridorAdvisory;
