/**
 * Traveler Store - Zustand store for traveler-related state management
 * Manages trips, deliveries, nearby requests, and location tracking
 */

import { create } from 'zustand';
import { travelerService } from '../services/api';
import { Trip, TravelRequest, TravelMatch, Evidence } from '../types';

interface TravelerStats {
  activeTrips: number;
  activeDeliveries: number;
  pendingRequests: number;
  totalEarnings: number;
  monthlyEarnings: number;
}

interface EarningsData {
  total: number;
  monthly: number;
  pending: number;
  history: Array<{
    id: string;
    amount: number;
    type: 'delivery' | 'bonus' | 'tip';
    description: string;
    date: string;
    status: 'completed' | 'pending';
  }>;
}

interface TravelerState {
  // Data
  trips: Trip[];
  activeDeliveries: TravelMatch[];
  nearbyRequests: TravelRequest[];
  stats: TravelerStats | null;
  earnings: EarningsData | null;
  currentLocation: { lat: number; lon: number } | null;
  
  // Loading states
  isLoadingTrips: boolean;
  isLoadingDeliveries: boolean;
  isLoadingRequests: boolean;
  isLoadingStats: boolean;
  isLoadingEarnings: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchTrips: () => Promise<void>;
  fetchDeliveries: () => Promise<void>;
  fetchNearbyRequests: (lat: number, lon: number, radiusKm?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchEarnings: (startDate?: string, endDate?: string) => Promise<void>;
  createTrip: (data: Omit<Trip, 'id' | 'travelerId' | 'status' | 'availableKg'>) => Promise<Trip>;
  updateTripStatus: (tripId: string, status: Trip['status']) => Promise<void>;
  acceptRequest: (requestId: string, tripId: string) => Promise<TravelMatch>;
  updateDeliveryStatus: (matchId: string, status: 'picked_up' | 'delivered', evidence?: Evidence) => Promise<void>;
  updateLocation: (lat: number, lon: number) => Promise<void>;
  setCurrentLocation: (location: { lat: number; lon: number } | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  trips: [],
  activeDeliveries: [],
  nearbyRequests: [],
  stats: null,
  earnings: null,
  currentLocation: null,
  isLoadingTrips: false,
  isLoadingDeliveries: false,
  isLoadingRequests: false,
  isLoadingStats: false,
  isLoadingEarnings: false,
  error: null,
};

export const useTravelerStore = create<TravelerState>((set, get) => ({
  ...initialState,

  fetchTrips: async () => {
    set({ isLoadingTrips: true, error: null });
    try {
      const response = await travelerService.getTrips();
      set({ trips: response.data || response, isLoadingTrips: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch trips', 
        isLoadingTrips: false 
      });
    }
  },

  fetchDeliveries: async () => {
    set({ isLoadingDeliveries: true, error: null });
    try {
      const response = await travelerService.getDeliveries();
      set({ activeDeliveries: response.data || response, isLoadingDeliveries: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch deliveries', 
        isLoadingDeliveries: false 
      });
    }
  },

  fetchNearbyRequests: async (lat: number, lon: number, radiusKm: number = 50) => {
    set({ isLoadingRequests: true, error: null });
    try {
      const response = await travelerService.getNearbyRequests(lat, lon, radiusKm);
      set({ nearbyRequests: response.data || response, isLoadingRequests: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch nearby requests', 
        isLoadingRequests: false 
      });
    }
  },

  fetchStats: async () => {
    set({ isLoadingStats: true, error: null });
    try {
      // Fetch trips and deliveries to calculate stats
      const [tripsRes, deliveriesRes, earningsRes] = await Promise.all([
        travelerService.getTrips(),
        travelerService.getDeliveries(),
        travelerService.getEarnings(),
      ]);
      
      const trips = tripsRes.data || tripsRes;
      const deliveries = deliveriesRes.data || deliveriesRes;
      const earnings = earningsRes.data || earningsRes;
      
      const activeTrips = trips.filter((t: Trip) => 
        t.status === 'scheduled' || t.status === 'in_progress'
      ).length;
      
      const activeDeliveries = deliveries.filter((d: TravelMatch) => 
        d.status !== 'completed' && d.status !== 'cancelled'
      ).length;
      
      set({
        trips,
        activeDeliveries: deliveries,
        stats: {
          activeTrips,
          activeDeliveries,
          pendingRequests: 0, // Will be updated when nearby requests are fetched
          totalEarnings: earnings.total || 0,
          monthlyEarnings: earnings.monthly || 0,
        },
        isLoadingStats: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch stats', 
        isLoadingStats: false 
      });
    }
  },

  fetchEarnings: async (startDate?: string, endDate?: string) => {
    set({ isLoadingEarnings: true, error: null });
    try {
      const response = await travelerService.getEarnings({ startDate, endDate });
      set({ earnings: response.data || response, isLoadingEarnings: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch earnings', 
        isLoadingEarnings: false 
      });
    }
  },

  createTrip: async (data) => {
    set({ error: null });
    try {
      const trip = await travelerService.createTrip({
        origin: data.origin,
        destination: data.destination,
        departAt: data.departAt,
        arriveAt: data.arriveAt,
        capacityKg: data.capacityKg,
      });
      
      // Add to trips list
      set((state) => ({ trips: [trip, ...state.trips] }));
      
      return trip;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create trip' });
      throw error;
    }
  },

  updateTripStatus: async (tripId: string, status: Trip['status']) => {
    set({ error: null });
    try {
      await travelerService.updateTrip(tripId, { status });
      
      // Update local state
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId ? { ...t, status } : t
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update trip status' });
      throw error;
    }
  },

  acceptRequest: async (requestId: string, tripId: string) => {
    set({ error: null });
    try {
      const match = await travelerService.acceptRequest(requestId, tripId);
      
      // Remove from nearby requests and add to deliveries
      set((state) => ({
        nearbyRequests: state.nearbyRequests.filter((r) => r.id !== requestId),
        activeDeliveries: [match, ...state.activeDeliveries],
      }));
      
      return match;
    } catch (error: any) {
      set({ error: error.message || 'Failed to accept request' });
      throw error;
    }
  },

  updateDeliveryStatus: async (matchId: string, status: 'picked_up' | 'delivered', evidence?: Evidence) => {
    set({ error: null });
    try {
      await travelerService.updateDeliveryStatus(matchId, status, evidence);
      
      // Update local state
      set((state) => ({
        activeDeliveries: state.activeDeliveries.map((d) =>
          d.id === matchId
            ? {
                ...d,
                status,
                ...(status === 'picked_up' && evidence ? { pickupEvidence: evidence } : {}),
                ...(status === 'delivered' && evidence ? { deliveryEvidence: evidence } : {}),
              }
            : d
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update delivery status' });
      throw error;
    }
  },

  updateLocation: async (lat: number, lon: number) => {
    try {
      await travelerService.updateLocation(lat, lon);
      set({ currentLocation: { lat, lon } });
    } catch (error: any) {
      // Silent fail for location updates - don't disrupt UX
      console.warn('Failed to update location:', error.message);
    }
  },

  setCurrentLocation: (location) => {
    set({ currentLocation: location });
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
