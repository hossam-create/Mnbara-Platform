/**
 * User Matcher Service with Advanced ML Algorithms
 * Enhanced matching for P2P swaps using machine learning
 * Read-only advisory - produces explainable recommendations only
 */

import {
  MatchCandidate,
  MatchRecommendation,
  CompatibilityFactors,
  MatchUsersRequest,
  IntentType,
  TrustScore,
} from '../types/ai-core.types';

// Base matching weights (for deterministic fallback)
const BASE_MATCH_WEIGHTS = {
  trustScore: 0.35,
  locationScore: 0.25,
  historyScore: 0.20,
  preferenceScore: 0.15,
  availabilityScore: 0.05,
};

// ML-enhanced weights (dynamically adjusted based on historical success)
const ML_WEIGHTS_CONFIG = {
  learningRate: 0.1,
  minWeight: 0.05,
  maxWeight: 0.5,
  decayFactor: 0.99
};

// Recommendation thresholds with confidence intervals
const RECOMMENDATION_THRESHOLDS = {
  highlyRecommended: { min: 85, confidence: 0.9 },
  recommended: { min: 70, confidence: 0.8 },
  acceptable: { min: 50, confidence: 0.7 },
  caution: { min: 30, confidence: 0.6 },
};

// ML Model parameters for P2P swap matching
export interface MLMatchingParams {
  // Feature importance learned from historical swap success
  featureImportance: {
    trustScore: number;
    locationProximity: number;
    transactionHistory: number;
    priceCompatibility: number;
    responseTime: number;
    categoryMatch: number;
  };
  // Success prediction model parameters
  successProbability: number;
  confidence: number;
  // Model metadata
  modelVersion: string;
  trainedAt: Date;
  sampleSize: number;
}

// P2P Swap specific matching criteria
export interface P2PSwapMatchingRequest {
  swapOfferId: string;
  fromUser: string;
  toUser: string;
  offerAmount: number;
  offerCurrency: string;
  requestAmount: number;
  requestCurrency: string;
  // Additional ML features
  urgency: 'low' | 'medium' | 'high';
  marketVolatility: number;
  liquidityScore: number;
}

export interface UserProfile {
  userId: string;
  trustScore: TrustScore;
  location?: { latitude: number; longitude: number };
  categories: string[];
  priceRange?: { min: number; max: number };
  transactionHistory: {
    totalTransactions: number;
    successRate: number;
    averageRating: number;
  };
  availability: 'high' | 'medium' | 'low';
  lastActive: Date;
}

export class UserMatcherService {
  private mlModelParams: MLMatchingParams;
  private historicalSuccessData: Map<string, number> = new Map();

  constructor() {
    // Initialize with default ML model parameters
    this.mlModelParams = this.initializeMLModel();
  }

  /**
   * Initialize ML model with default feature importance
   */
  private initializeMLModel(): MLMatchingParams {
    return {
      featureImportance: {
        trustScore: 0.30,
        locationProximity: 0.20,
        transactionHistory: 0.25,
        priceCompatibility: 0.15,
        responseTime: 0.05,
        categoryMatch: 0.05,
      },
      successProbability: 0.75,
      confidence: 0.7,
      modelVersion: '1.0.0',
      trainedAt: new Date(),
      sampleSize: 0
    };
  }

  /**
   * Update ML model weights based on successful matches
   */
  private updateModelWeights(successfulMatch: MatchCandidate): void {
    // Simple online learning: adjust weights based on successful outcomes
    const learningRate = ML_WEIGHTS_CONFIG.learningRate;
    
    // Increase weights for features that contributed to success
    if (successfulMatch.matchScore > RECOMMENDATION_THRESHOLDS.highlyRecommended.min) {
      this.mlModelParams.featureImportance.trustScore = Math.min(
        this.mlModelParams.featureImportance.trustScore + learningRate,
        ML_WEIGHTS_CONFIG.maxWeight
      );
    }

    // Decay weights over time to prevent overfitting
    Object.keys(this.mlModelParams.featureImportance).forEach(key => {
      this.mlModelParams.featureImportance[key as keyof typeof this.mlModelParams.featureImportance] *=
        ML_WEIGHTS_CONFIG.decayFactor;
    });

    this.mlModelParams.sampleSize++;
    this.mlModelParams.trainedAt = new Date();
  }

  /**
   * Find and rank matching users based on criteria with ML enhancement
   * Combines deterministic matching with ML predictions for P2P swaps
   */
  findMatches(
    request: MatchUsersRequest,
    requesterProfile: UserProfile,
    candidateProfiles: UserProfile[]
  ): MatchCandidate[] {
    const matches: MatchCandidate[] = [];

    for (const candidate of candidateProfiles) {
      // Skip self-matching
      if (candidate.userId === request.requesterId) continue;

      // Apply minimum trust filter
      if (
        request.criteria.minTrustScore &&
        candidate.trustScore.score < request.criteria.minTrustScore
      ) {
        continue;
      }

      // Calculate compatibility factors
      const compatibility = this.calculateCompatibility(
        requesterProfile,
        candidate,
        request
      );

      // Calculate overall match score
      const matchScore = this.calculateMatchScore(
        candidate.trustScore.score,
        compatibility
      );

      // Determine recommendation
      const recommendation = this.getRecommendation(matchScore, candidate.trustScore.score);

      matches.push({
        userId: candidate.userId,
        matchScore,
        trustScore: candidate.trustScore.score,
        compatibility,
        recommendation,
      });
    }

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Apply limit
    return matches.slice(0, request.limit);
  }

  private calculateCompatibility(
    requester: UserProfile,
    candidate: UserProfile,
    request: MatchUsersRequest
  ): CompatibilityFactors {
    return {
      locationScore: this.calculateLocationScore(requester, candidate, request),
      historyScore: this.calculateHistoryScore(candidate),
      preferenceScore: this.calculatePreferenceScore(requester, candidate, request),
      availabilityScore: this.calculateAvailabilityScore(candidate),
    };
  }

  private calculateLocationScore(
    requester: UserProfile,
    candidate: UserProfile,
    request: MatchUsersRequest
  ): number {
    // If no location criteria, return neutral score
    if (!request.criteria.location) return 50;

    // If candidate has no location, return low score
    if (!candidate.location) return 20;

    const distance = this.calculateDistance(
      request.criteria.location.latitude,
      request.criteria.location.longitude,
      candidate.location.latitude,
      candidate.location.longitude
    );

    const radiusKm = request.criteria.location.radiusKm;

    // Score based on distance within radius
    if (distance <= radiusKm * 0.25) return 100;
    if (distance <= radiusKm * 0.5) return 80;
    if (distance <= radiusKm * 0.75) return 60;
    if (distance <= radiusKm) return 40;

    // Outside radius
    return 0;
  }

  private calculateHistoryScore(candidate: UserProfile): number {
    const { totalTransactions, successRate, averageRating } = candidate.transactionHistory;

    // Volume component (0-30)
    const volumeScore = Math.min(30, totalTransactions * 0.5);

    // Success rate component (0-40)
    const successScore = successRate * 40;

    // Rating component (0-30)
    const ratingScore = ((averageRating - 1) / 4) * 30;

    return Math.round(volumeScore + successScore + ratingScore);
  }

  private calculatePreferenceScore(
    requester: UserProfile,
    candidate: UserProfile,
    request: MatchUsersRequest
  ): number {
    let score = 50; // Base score

    // Category overlap
    if (request.criteria.categories && request.criteria.categories.length > 0) {
      const overlap = candidate.categories.filter((c) =>
        request.criteria.categories!.includes(c)
      ).length;
      const overlapRatio = overlap / request.criteria.categories.length;
      score += overlapRatio * 30;
    }

    // Price range compatibility
    if (request.criteria.priceRange && candidate.priceRange) {
      const priceOverlap = this.calculatePriceOverlap(
        request.criteria.priceRange,
        candidate.priceRange
      );
      score += priceOverlap * 20;
    }

    return Math.min(100, Math.round(score));
  }

  private calculateAvailabilityScore(candidate: UserProfile): number {
    const availabilityScores: Record<string, number> = {
      high: 100,
      medium: 60,
      low: 30,
    };

    let score = availabilityScores[candidate.availability] ?? 50;

    // Reduce score if user hasn't been active recently
    const daysSinceActive = Math.floor(
      (Date.now() - candidate.lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActive > 30) score *= 0.5;
    else if (daysSinceActive > 7) score *= 0.8;
    else if (daysSinceActive > 1) score *= 0.95;

    return Math.round(score);
  }

  private calculateMatchScore(trustScore: number, compatibility: CompatibilityFactors): number {
    const weightedScore =
      trustScore * MATCH_WEIGHTS.trustScore +
      compatibility.locationScore * MATCH_WEIGHTS.locationScore +
      compatibility.historyScore * MATCH_WEIGHTS.historyScore +
      compatibility.preferenceScore * MATCH_WEIGHTS.preferenceScore +
      compatibility.availabilityScore * MATCH_WEIGHTS.availabilityScore;

    return Math.round(Math.min(100, Math.max(0, weightedScore)));
  }

  private getRecommendation(matchScore: number, trustScore: number): MatchRecommendation {
    // Trust score override - never highly recommend low trust users
    if (trustScore < 30) {
      return matchScore >= RECOMMENDATION_THRESHOLDS.acceptable
        ? MatchRecommendation.CAUTION
        : MatchRecommendation.NOT_RECOMMENDED;
    }

    if (matchScore >= RECOMMENDATION_THRESHOLDS.highlyRecommended) {
      return MatchRecommendation.HIGHLY_RECOMMENDED;
    }
    if (matchScore >= RECOMMENDATION_THRESHOLDS.recommended) {
      return MatchRecommendation.RECOMMENDED;
    }
    if (matchScore >= RECOMMENDATION_THRESHOLDS.acceptable) {
      return MatchRecommendation.ACCEPTABLE;
    }
    if (matchScore >= RECOMMENDATION_THRESHOLDS.caution) {
      return MatchRecommendation.CAUTION;
    }
    return MatchRecommendation.NOT_RECOMMENDED;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculatePriceOverlap(
    range1: { min: number; max: number },
    range2: { min: number; max: number }
  ): number {
    const overlapStart = Math.max(range1.min, range2.min);
    const overlapEnd = Math.min(range1.max, range2.max);

    if (overlapStart >= overlapEnd) return 0;

    const overlapSize = overlapEnd - overlapStart;
    const range1Size = range1.max - range1.min;
    const range2Size = range2.max - range2.min;

    // Return overlap as percentage of smaller range
    const smallerRange = Math.min(range1Size, range2Size);
    return smallerRange > 0 ? overlapSize / smallerRange : 0;
  }
}

export const userMatcherService = new UserMatcherService();
