import { apiClient } from './api.service';
import type { ApiResponse, Trip } from '../types';

export interface MatchResult {
    trip: Trip;
    matchScore: number;
    estimatedCost: number;
    estimatedDelivery: string;
}

export interface MatchRequest {
    orderId: number;
    tripId: number;
}

class MatchingService {
  private readonly baseUrl = '/matching';

  private async ensureSuccess<T>(request: () => Promise<ApiResponse<T>>, context: string): Promise<T> {
    const response = await request();
    if (!response.success || response.data === undefined || response.data === null) {
      throw new Error(response.message || `Failed to ${context}`);
    }
    return response.data;
  }

  /**
   * Find compatible travelers for a specific order
   */
  async findCompatibleTravelers(
    orderId: string,
    filters?: { departureAfter?: string }
  ): Promise<MatchResult[]> {
    const data = await this.ensureSuccess(
      async () =>
        (await apiClient.get<ApiResponse<{ matches: MatchResult[] }>>(
          `${this.baseUrl}/find-travelers`,
          {
            params: { orderId, ...filters },
          }
        )).data,
      'find compatible travelers'
    );
    return data.matches;
  }

  /**
   * Request a match with a traveler
   */
  async requestMatch(orderId: string, tripId: string): Promise<void> {
    await this.ensureSuccess(
      async () =>
        (await apiClient.post<ApiResponse<null>>(`${this.baseUrl}/request-match`, { orderId, tripId }))
          .data,
      'request match'
    );
  }

  /**
   * Traveler accepts a match
   */
  async acceptMatch(orderId: string, tripId: string): Promise<void> {
    await this.ensureSuccess(
      async () =>
        (await apiClient.post<ApiResponse<null>>(`${this.baseUrl}/accept-match`, { orderId, tripId }))
          .data,
      'accept match'
    );
  }

  /**
   * Traveler rejects a match
   */
  async rejectMatch(orderId: string, tripId: string): Promise<void> {
    await this.ensureSuccess(
      async () =>
        (await apiClient.post<ApiResponse<null>>(`${this.baseUrl}/reject-match`, { orderId, tripId }))
          .data,
      'reject match'
    );
  }
}

export const matchingService = new MatchingService();
export default matchingService;
