import { apiClient } from './client';
import { Trip, TripStatus, TripFilter } from '../../domain/entities/trip.entity';

interface MyTripFilters extends TripFilter {
  status?: TripStatus | TripStatus[];
}

export interface CreateTripRequest {
  origin: {
    address: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  departureDate: string;
  departureTimeWindow: {
    start: string;
    end: string;
  };
  arrivalDate: string;
  arrivalTimeWindow: {
    start: string;
    end: string;
  };
  availableWeight: number;
  availableDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  vehicleType: 'car' | 'motorcycle' | 'van' | 'truck';
  tripType: 'one-way' | 'round-trip';
  canCarryFragile: boolean;
  canCarryRefrigerated: boolean;
  pricePerKg: number;
  maxPackageDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  routeDescription?: string;
  stops?: Array<{
    address: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface UpdateTripRequest {
  departureDate?: string;
  departureTimeWindow?: {
    start: string;
    end: string;
  };
  availableWeight?: number;
  pricePerKg?: number;
  status?: TripStatus;
  canCarryFragile?: boolean;
  canCarryRefrigerated?: boolean;
  stops?: Array<{
    address: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface TripSearchParams {
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  departureDate?: string;
  maxDistance?: number;
  availableWeight?: number;
  needsFragile?: boolean;
  needsRefrigerated?: boolean;
  page?: number;
  limit?: number;
}

class TripApiService {
  private static instance: TripApiService;

  public static getInstance(): TripApiService {
    if (!TripApiService.instance) {
      TripApiService.instance = new TripApiService();
    }
    return TripApiService.instance;
  }

  async createTrip(data: CreateTripRequest): Promise<Trip> {
    const response = await apiClient.post<Trip>('/api/trips', data);
    return response;
  }

  async getMyTrips(filters?: MyTripFilters): Promise<Trip[]> {
    let url = '/api/trips/my-trips';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) {
        const statusValue = Array.isArray(filters.status) 
          ? filters.status.join(',') 
          : filters.status;
        params.append('status', statusValue);
      }
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      url += `?${params.toString()}`;
    }
    const response = await apiClient.get<Trip[]>(url);
    return response;
  }

  async getTripById(tripId: string): Promise<Trip> {
    const response = await apiClient.get<Trip>(`/api/trips/${tripId}`);
    return response;
  }

  async updateTrip(tripId: string, data: UpdateTripRequest): Promise<Trip> {
    const response = await apiClient.patch<Trip>(`/api/trips/${tripId}`, data);
    return response;
  }

  async cancelTrip(tripId: string, reason: string): Promise<void> {
    await apiClient.post(`/api/trips/${tripId}/cancel`, { reason });
  }

  async completeTrip(tripId: string): Promise<Trip> {
    const response = await apiClient.post<Trip>(`/api/trips/${tripId}/complete`);
    return response;
  }

  async searchTrips(params: TripSearchParams): Promise<{
    trips: Trip[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    
    const response = await apiClient.get<{
      trips: Trip[];
      total: number;
      hasMore: boolean;
    }>(`/api/trips/search?${queryParams.toString()}`);
    return response;
  }

  async getAvailableTrips(): Promise<Trip[]> {
    const response = await apiClient.get<Trip[]>('/api/trips/available');
    return response;
  }

  async getTripStats(tripId: string): Promise<{
    totalDeliveries: number;
    completedDeliveries: number;
    totalEarnings: number;
    averageRating: number;
  }> {
    const response = await apiClient.get<{
      totalDeliveries: number;
      completedDeliveries: number;
      totalEarnings: number;
      averageRating: number;
    }>(`/api/trips/${tripId}/stats`);
    return response;
  }

  async addStop(tripId: string, stop: {
    address: string;
    latitude: number;
    longitude: number;
  }): Promise<Trip> {
    const response = await apiClient.post<Trip>(`/api/trips/${tripId}/stops`, stop);
    return response;
  }

  async removeStop(tripId: string, stopIndex: number): Promise<Trip> {
    const response = await apiClient.delete<Trip>(`/api/trips/${tripId}/stops/${stopIndex}`);
    return response;
  }
}

export const tripApi = TripApiService.getInstance();
