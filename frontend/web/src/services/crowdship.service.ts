import { apiClient } from './api.service';
import type { ApiResponse } from '../types';

export interface TravelerLocation {
    travelerId: number;
    latitude: number;
    longitude: number;
    country: string;
    airportCode?: string;
    lastSeenAt: string;
}

class CrowdshipService {
    private baseUrl = '/crowdship'; // Gateway path

    private ensureData<T>(response: ApiResponse<T>, context: string): T {
        if (!response.success || response.data === undefined || response.data === null) {
            throw new Error(response.message || `Failed to ${context}`);
        }
        return response.data;
    }

    /**
     * Update traveler's real-time location
     */
    async updateLocation(
        travelerId: number,
        location: { latitude: number; longitude: number; country: string; airportCode?: string }
    ): Promise<void> {
        const response = await apiClient.post<ApiResponse<null>>(
            `${this.baseUrl}/travelers/${travelerId}/location`,
            location
        );
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update traveler location');
        }
    }

    /**
     * Get traveler's last known location
     */
    async getLocation(travelerId: number): Promise<TravelerLocation> {
        const response = await apiClient.get<ApiResponse<TravelerLocation>>(
            `${this.baseUrl}/travelers/${travelerId}/location`
        );
        return this.ensureData(response.data, 'get traveler location');
    }

    /**
     * Get nearby requests for a traveler
     */
    async getNearbyRequests(params: { lat: number; lon: number; radius?: number }): Promise<unknown[]> {
        const response = await apiClient.get<ApiResponse<unknown[]>>(
            `${this.baseUrl}/travelers/nearby-requests`,
            { params }
        );
        return this.ensureData(response.data, 'get nearby requests');
    }
}

export const crowdshipService = new CrowdshipService();
export default crowdshipService;
