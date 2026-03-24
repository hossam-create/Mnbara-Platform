import { apiClient } from './client';
import { Delivery, DeliveryStatus, DeliveryFilter } from '../../domain/entities/delivery.entity';

export interface CreateDeliveryRequest {
  originAddress: string;
  originLatitude: number;
  originLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  packageDescription: string;
  packageWeight: number;
  packageDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  estimatedValue: number;
  preferredDeliveryDate?: string;
  specialInstructions?: string;
  deliveryType: 'standard' | 'express' | 'fragile' | 'refrigerated';
}

export interface UpdateDeliveryRequest {
  status?: DeliveryStatus;
  originAddress?: string;
  destinationAddress?: string;
  specialInstructions?: string;
}

export interface DeliveryQuote {
  deliveryId: string;
  travelerId: string;
  travelerName: string;
  travelerRating: number;
  travelerTotalDeliveries: number;
  price: number;
  currency: string;
  estimatedDeliveryDate: string;
  travelerAvatar?: string;
}

class DeliveryApiService {
  private static instance: DeliveryApiService;

  public static getInstance(): DeliveryApiService {
    if (!DeliveryApiService.instance) {
      DeliveryApiService.instance = new DeliveryApiService();
    }
    return DeliveryApiService.instance;
  }

  async createDelivery(data: CreateDeliveryRequest): Promise<Delivery> {
    const response = await apiClient.post<Delivery>('/api/deliveries', data);
    return response;
  }

  async getDeliveries(filters?: DeliveryFilter): Promise<Delivery[]> {
    let url = '/api/deliveries';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      url += `?${params.toString()}`;
    }
    const response = await apiClient.get<Delivery[]>(url);
    return response;
  }

  async getDeliveryById(deliveryId: string): Promise<Delivery> {
    const response = await apiClient.get<Delivery>(`/api/deliveries/${deliveryId}`);
    return response;
  }

  async updateDelivery(deliveryId: string, data: UpdateDeliveryRequest): Promise<Delivery> {
    const response = await apiClient.patch<Delivery>(`/api/deliveries/${deliveryId}`, data);
    return response;
  }

  async cancelDelivery(deliveryId: string, reason: string): Promise<void> {
    await apiClient.post(`/api/deliveries/${deliveryId}/cancel`, { reason });
  }

  async getQuotes(deliveryId: string): Promise<DeliveryQuote[]> {
    const response = await apiClient.get<DeliveryQuote[]>(`/api/deliveries/${deliveryId}/quotes`);
    return response;
  }

  async acceptQuote(deliveryId: string, quoteId: string): Promise<Delivery> {
    const response = await apiClient.post<Delivery>(
      `/api/deliveries/${deliveryId}/accept-quote`,
      { quoteId }
    );
    return response;
  }

  async getDeliveryTracking(deliveryId: string): Promise<{
    currentLocation: { latitude: number; longitude: number };
    estimatedArrival: string;
    status: DeliveryStatus;
    updates: Array<{
      timestamp: string;
      status: DeliveryStatus;
      location?: { latitude: number; longitude: number };
      description: string;
    }>;
  }> {
    const response = await apiClient.get<{
      currentLocation: { latitude: number; longitude: number };
      estimatedArrival: string;
      status: DeliveryStatus;
      updates: Array<{
        timestamp: string;
        status: DeliveryStatus;
        location?: { latitude: number; longitude: number };
        description: string;
      }>;
    }>(`/api/deliveries/${deliveryId}/tracking`);
    return response;
  }

  async submitDeliveryProof(deliveryId: string, proof: {
    photoUrl?: string;
    signatureUrl?: string;
    recipientName: string;
    recipientId?: string;
  }): Promise<void> {
    await apiClient.post(`/api/deliveries/${deliveryId}/proof`, proof);
  }

  async rateDelivery(deliveryId: string, rating: {
    travelerId: string;
    score: number;
    comment?: string;
  }): Promise<void> {
    await apiClient.post(`/api/deliveries/${deliveryId}/rate`, rating);
  }
}

export const deliveryApi = DeliveryApiService.getInstance();
