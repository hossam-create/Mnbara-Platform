/**
 * useAIRecommendation Hook
 * Sprint 1: React hook for AI Core integration
 * 
 * CONSTRAINTS:
 * - Read-only data fetching
 * - Advisory only
 * - Feature-flagged
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getAIRecommendation, 
  isAIEnabled,
  TrustScoreResult,
  RiskAssessmentResult,
  DecisionRecommendationResult,
} from '../services/crowdship-ai.service';

interface UseAIRecommendationResult {
  buyerTrust: TrustScoreResult | null;
  travelerTrust: TrustScoreResult | null;
  riskAssessment: RiskAssessmentResult | null;
  recommendation: DecisionRecommendationResult | null;
  isLoading: boolean;
  isEnabled: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAIRecommendation(offerId: number | null, buyerId?: number): UseAIRecommendationResult {
  const [buyerTrust, setBuyerTrust] = useState<TrustScoreResult | null>(null);
  const [travelerTrust, setTravelerTrust] = useState<TrustScoreResult | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentResult | null>(null);
  const [recommendation, setRecommendation] = useState<DecisionRecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEnabled = isAIEnabled();

  const fetchRecommendation = useCallback(async () => {
    if (!offerId || !isEnabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAIRecommendation(offerId, buyerId);
      
      if (response.data) {
        setBuyerTrust(response.data.buyerTrust);
        setTravelerTrust(response.data.travelerTrust);
        setRiskAssessment(response.data.riskAssessment);
        setRecommendation(response.data.recommendation);
      } else {
        setError(response.message || 'AI features unavailable');
      }
    } catch (err) {
      setError('Failed to fetch AI recommendation');
    } finally {
      setIsLoading(false);
    }
  }, [offerId, buyerId, isEnabled]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  return {
    buyerTrust,
    travelerTrust,
    riskAssessment,
    recommendation,
    isLoading,
    isEnabled,
    error,
    refetch: fetchRecommendation,
  };
}

export default useAIRecommendation;
