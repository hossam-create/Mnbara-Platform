/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the matching-service.
 * All shared packages are imported from @mnbara/* namespace.
 */

// Import types from @mnbara/types
import type {
  User,
  UserStatus,
} from '@mnbara/types';

import {
  UserRole,
} from '@mnbara/types';

import type {
  Order,
  OrderStatus,
} from '@mnbara/types';

import type {
  GeoLocation,
} from '@mnbara/types';

// Import utilities from @mnbara/utils
import {
  formatCurrency,
  formatDate,
  type CurrencyCode,
} from '@mnbara/utils';

// Import API client from @mnbara/api-client
import { ApiClient, type ApiClientOptions } from '@mnbara/api-client';

/**
 * Example: Using shared types in matching service
 */
export interface MatchRequest {
  orderId: string;
  tripId: string;
  pickupLocation: GeoLocation;
  dropoffLocation: GeoLocation;
  estimatedDistance: number;
}

export interface MatchResponse {
  id: string;
  order: Order;
  trip: any; // Trip type from trips-service
  matchScore: number;
  estimatedFare: number;
  createdAt: Date;
}

/**
 * Example: Using utility functions
 */
export const formatMatchDate = (date: Date): string => {
  return formatDate(date, 'medium');
};

export const formatMatchFare = (amount: number, currency: CurrencyCode = 'USD'): string => {
  return formatCurrency(amount, currency);
};

/**
 * Example: Using API client
 */
export const initializeApiClient = (baseURL: string): ApiClient => {
  const options: ApiClientOptions = { baseURL };
  return new ApiClient(options);
};

/**
 * Example: Calculating match score
 */
export const calculateMatchScore = (
  distance: number,
  timeWindow: number,
  driverRating: number
): number => {
  // Simple scoring algorithm
  const distanceScore = Math.max(0, 100 - distance);
  const timeScore = Math.max(0, 100 - timeWindow);
  const ratingScore = driverRating * 10;

  return (distanceScore + timeScore + ratingScore) / 3;
};

/**
 * Example: Calculating estimated fare
 */
export const calculateEstimatedFare = (
  distance: number,
  baseRate: number = 0.5,
  surgeMultiplier: number = 1.0
): number => {
  return distance * baseRate * surgeMultiplier;
};

/**
 * Example: Creating a match with shared packages
 */
export const createMatch = async (
  matchRequest: MatchRequest,
  apiClient: ApiClient
): Promise<MatchResponse> => {
  // Calculate match score
  const matchScore = calculateMatchScore(
    matchRequest.estimatedDistance,
    30, // 30 minute time window
    4.5 // driver rating
  );

  // Calculate estimated fare
  const estimatedFare = calculateEstimatedFare(matchRequest.estimatedDistance);

  // Create match object using shared Order type
  // Note: This is a simplified example. In production, use the full Order interface
  const match: MatchResponse = {
    id: `match-${Date.now()}`,
    order: {
      id: matchRequest.orderId,
      status: 'pending' as OrderStatus,
      items: [],
      total: estimatedFare,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any, // Cast to any for demonstration purposes
    trip: {
      id: matchRequest.tripId,
    },
    matchScore,
    estimatedFare,
    createdAt: new Date(),
  };

  return match;
};

/**
 * Example: Formatting match information
 */
export const formatMatchInfo = (match: MatchResponse): any => {
  return {
    id: match.id,
    orderId: match.order.id,
    tripId: match.trip.id,
    matchScore: match.matchScore.toFixed(2),
    estimatedFare: formatMatchFare(match.estimatedFare),
    createdAt: formatMatchDate(match.createdAt),
  };
};

/**
 * Example: Combining multiple shared packages
 */
export const processOrderTripMatch = async (
  matchRequest: MatchRequest,
  apiClient: ApiClient
): Promise<MatchResponse> => {
  // Create match
  const match = await createMatch(matchRequest, apiClient);

  // Format for logging
  const matchInfo = formatMatchInfo(match);
  console.log('New match created:', matchInfo);

  return match;
};

/**
 * Example: Validating match feasibility
 */
export const isMatchFeasible = (
  matchScore: number,
  minScore: number = 50
): boolean => {
  return matchScore >= minScore;
};

export default {
  formatMatchDate,
  formatMatchFare,
  initializeApiClient,
  calculateMatchScore,
  calculateEstimatedFare,
  createMatch,
  formatMatchInfo,
  processOrderTripMatch,
  isMatchFeasible,
};
