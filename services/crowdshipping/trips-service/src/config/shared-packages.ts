/**
 * Shared Packages Configuration
 * 
 * This file demonstrates how to use the shared packages in the trips-service.
 * All shared packages are imported from @mnbara/* namespace.
 */

// Import types from @mnbara/types
import type {
  User,
  UserStatus,
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
 * Example: Using shared types in trips service
 */
export interface TripRequest {
  driverId: string;
  startLocation: GeoLocation;
  endLocation: GeoLocation;
  departureTime: Date;
  availableSeats: number;
}

export interface TripResponse {
  id: string;
  driver: User;
  startLocation: GeoLocation;
  endLocation: GeoLocation;
  departureTime: Date;
  availableSeats: number;
  createdAt: Date;
}

/**
 * Example: Using utility functions
 */
export const formatTripDate = (date: Date): string => {
  return formatDate(date, 'medium');
};

export const formatTripPrice = (amount: number, currency: CurrencyCode = 'USD'): string => {
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
 * Example: Creating a trip with shared packages
 * Note: This is a simplified example. In production, construct the User object properly.
 */
export const createTrip = async (
  tripRequest: TripRequest,
  apiClient: ApiClient
): Promise<TripResponse> => {
  // Create trip object using shared types
  // In production, fetch the actual driver user from the database
  const trip: TripResponse = {
    id: `trip-${Date.now()}`,
    driver: {
      id: tripRequest.driverId,
      email: 'driver@example.com',
      roles: ['traveler'] as any,
      status: 'active' as UserStatus,
      accountType: 'personal' as any,
      profile: {
        firstName: 'Driver',
        lastName: 'Name',
        avatar: null,
      },
      authentication: {
        email: 'driver@example.com',
        emailVerified: false,
        phoneVerified: false,
        twoFactorEnabled: false,
      },
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        newsletter: false,
        language: 'en',
        currency: 'USD',
      },
      statistics: {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalSpent: 0,
        totalEarned: 0,
        totalDeliveries: 0,
        completedDeliveries: 0,
        averageRating: 0,
        totalReviews: 0,
        trustScore: 0,
        memberSince: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    startLocation: tripRequest.startLocation,
    endLocation: tripRequest.endLocation,
    departureTime: tripRequest.departureTime,
    availableSeats: tripRequest.availableSeats,
    createdAt: new Date(),
  };

  return trip;
};

/**
 * Example: Formatting trip information
 */
export const formatTripInfo = (trip: TripResponse): any => {
  return {
    id: trip.id,
    driver: `${trip.driver.profile.firstName} ${trip.driver.profile.lastName}`,
    route: `${trip.startLocation.latitude},${trip.startLocation.longitude} → ${trip.endLocation.latitude},${trip.endLocation.longitude}`,
    departureTime: formatTripDate(trip.departureTime),
    availableSeats: trip.availableSeats,
    createdAt: formatTripDate(trip.createdAt),
  };
};

/**
 * Example: Calculating trip fare
 */
export const calculateTripFare = (distance: number, baseRate: number = 0.5): number => {
  return distance * baseRate;
};

/**
 * Example: Combining multiple shared packages
 */
export const processNewTrip = async (
  tripRequest: TripRequest,
  apiClient: ApiClient
): Promise<TripResponse> => {
  // Create trip
  const trip = await createTrip(tripRequest, apiClient);

  // Format for logging
  const tripInfo = formatTripInfo(trip);
  console.log('New trip created:', tripInfo);

  return trip;
};

export default {
  formatTripDate,
  formatTripPrice,
  initializeApiClient,
  createTrip,
  formatTripInfo,
  calculateTripFare,
  processNewTrip,
};
