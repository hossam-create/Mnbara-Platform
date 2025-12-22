// ============================================
// ✈️ Traveler Service - API for Traveler Dashboard
// ============================================

import { apiClient } from './api.service';
import type { ApiResponse, SearchResult, BuyerRequest, Trip, Order } from '../types';

// ============ TRAVELER TYPES ============
export interface TravelerStats {
  activeTrips: number;
  completedTrips: number;
  activeDeliveries: number;
  completedDeliveries: number;
  totalEarnings: number;
  monthlyEarnings: number;
  avgRating: number;
  totalReviews: number;
  responseRate: number;
  onTimeRate: number;
}

export interface TravelerRequest extends BuyerRequest {
  matchScore?: number;
  estimatedEarnings: number;
  distanceKm: number;
  urgency: 'low' | 'medium' | 'high';
  buyerRating: number;
  buyerReviews: number;
  buyerTrustScore: number;
  productImages?: string[];
  specialInstructions?: string;
  insuranceRequired?: boolean;
  maxDeliveryDays?: number;
  preferredCarrier?: string;
  customsDocumentation?: string;
}

export interface OfferFormData {
  requestId: string;
  price: number;
  deliveryDate: string;
  message: string;
  terms: {
    insurance: boolean;
    tracking: boolean;
    photoUpdates: boolean;
    customsHandling: boolean;
  };
  estimatedWeight: number;
  estimatedVolume: number;
}

export interface TrustReadinessChecklist {
  id: string;
  item: string;
  description: string;
  required: boolean;
  completed: boolean;
  verifiedAt?: string;
}

export interface DeliveryEvidence {
  pickupPhoto?: string;
  deliveryPhoto?: string;
  trackingNumber?: string;
  location?: {
    lat: number;
    lon: number;
  };
  timestamp: string;
}

// ============ TRAVELER API ============
export const travelerApi = {
  // Dashboard Stats
  getStats: () =>
    apiClient.get<ApiResponse<TravelerStats>>('/traveler/stats'),

  // Requests Management
  getRequests: (params?: {
    status?: string;
    originCountry?: string;
    destinationCountry?: string;
    minReward?: number;
    maxDistance?: number;
    page?: number;
    pageSize?: number;
  }) =>
    apiClient.get<ApiResponse<SearchResult<TravelerRequest>>>('/traveler/requests', { params }),

  getRequest: (requestId: string) =>
    apiClient.get<ApiResponse<TravelerRequest>>(`/traveler/requests/${requestId}`),

  submitOffer: (data: OfferFormData) =>
    apiClient.post<ApiResponse<{ offerId: string; message: string }>>('/traveler/offers', data),

  getMyOffers: (params?: {
    status?: 'pending' | 'accepted' | 'rejected' | 'expired';
    page?: number;
    pageSize?: number;
  }) =>
    apiClient.get<ApiResponse<SearchResult<any>>>('/traveler/my-offers', { params }),

  // Trips Management
  getTrips: (params?: {
    status?: Trip['status'];
    page?: number;
    pageSize?: number;
  }) =>
    apiClient.get<ApiResponse<SearchResult<Trip>>>('/traveler/trips', { params }),

  createTrip: (data: Partial<Trip>) =>
    apiClient.post<ApiResponse<Trip>>('/traveler/trips', data),

  updateTrip: (tripId: string, data: Partial<Trip>) =>
    apiClient.put<ApiResponse<Trip>>(`/traveler/trips/${tripId}`, data),

  // Deliveries Management
  getDeliveries: (params?: {
    status?: Order['status'];
    page?: number;
    pageSize?: number;
  }) =>
    apiClient.get<ApiResponse<SearchResult<Order>>>('/traveler/deliveries', { params }),

  updateDeliveryStatus: (orderId: string, status: Order['status'], evidence?: DeliveryEvidence) =>
    apiClient.put<ApiResponse<Order>>(`/traveler/deliveries/${orderId}/status`, {
      status,
      evidence,
    }),

  // Trust & Readiness
  getReadinessChecklist: () =>
    apiClient.get<ApiResponse<TrustReadinessChecklist[]>>('/traveler/readiness-checklist'),

  updateChecklistItem: (itemId: string, completed: boolean) =>
    apiClient.put<ApiResponse<TrustReadinessChecklist>>(`/traveler/checklist/${itemId}`, {
      completed,
    }),

  getTrustScore: () =>
    apiClient.get<ApiResponse<{ score: number; breakdown: any }>>('/traveler/trust-score'),

  // Earnings & Analytics
  getEarnings: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' }) =>
    apiClient.get<ApiResponse<any[]>>('/traveler/earnings', { params }),

  getPerformanceMetrics: () =>
    apiClient.get<ApiResponse<{
      onTimeRate: number;
      responseRate: number;
      satisfactionScore: number;
      disputeRate: number;
    }>>('/traveler/performance'),
};

export default travelerApi;