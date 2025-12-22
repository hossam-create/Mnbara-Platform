import { apiClient } from './api.service';
import type { ApiResponse, Trip, TripSearchResult } from '../types';

export interface SearchTripsParams {
  originCountry?: string;
  destCountry?: string;
  departureAfter?: string;
  departureBefore?: string;
  minWeight?: number;
  page?: number;
  limit?: number;
}

class TripsService {
  private readonly baseUrl = '/trips';

  async createTrip(data: Partial<Trip>): Promise<Trip> {
    const response = await apiClient.post<ApiResponse<Trip>>(this.baseUrl, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create trip');
    }
    return response.data.data;
  }

  async searchTrips(params: SearchTripsParams): Promise<TripSearchResult> {
    const response = await apiClient.get<ApiResponse<TripSearchResult>>(
      `${this.baseUrl}/search`,
      { params }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to search trips');
    }
    return response.data.data;
  }

  async getTrip(id: string): Promise<Trip> {
    const response = await apiClient.get<ApiResponse<Trip>>(`${this.baseUrl}/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Trip not found');
    }
    return response.data.data;
  }

  async updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
    const response = await apiClient.put<ApiResponse<Trip>>(`${this.baseUrl}/${id}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update trip');
    }
    return response.data.data;
  }

  async deleteTrip(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete trip');
    }
  }

  async getMyTrips(): Promise<Trip[]> {
    const response = await apiClient.get<ApiResponse<Trip[]>>(`${this.baseUrl}/my-trips`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to load trips');
    }
    return response.data.data;
  }
}

export const tripsService = new TripsService();
export default tripsService;
