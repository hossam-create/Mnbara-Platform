// Delivery Repository - API Integration
import {
  Delivery,
  DeliveryFilter,
  CreateDeliveryRequest,
  UpdateDeliveryRequest,
  DeliveryListResponse,
  DeliveryResponse,
} from '../../domain/entities/delivery.entity';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.mnbara.com';

class DeliveryRepository {
  private getAuthHeaders(): HeadersInit {
    const token = ''; // Get from secure storage
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async getDeliveries(filter?: DeliveryFilter): Promise<DeliveryListResponse> {
    const params = new URLSearchParams();
    if (filter?.status?.length) {
      params.append('status', filter.status.join(','));
    }
    if (filter?.dateFrom) {
      params.append('dateFrom', filter.dateFrom);
    }
    if (filter?.dateTo) {
      params.append('dateTo', filter.dateTo);
    }
    if (filter?.sortBy) {
      params.append('sortBy', filter.sortBy);
    }
    if (filter?.sortOrder) {
      params.append('sortOrder', filter.sortOrder);
    }

    const response = await fetch(
      `${API_BASE_URL}/deliveries?${params.toString()}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch deliveries');
    }

    return response.json();
  }

  async getDeliveryById(id: string): Promise<DeliveryResponse> {
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch delivery');
    }

    return response.json();
  }

  async createDelivery(
    request: CreateDeliveryRequest
  ): Promise<DeliveryResponse> {
    const response = await fetch(`${API_BASE_URL}/deliveries`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to create delivery');
    }

    return response.json();
  }

  async updateDelivery(
    id: string,
    request: UpdateDeliveryRequest
  ): Promise<DeliveryResponse> {
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to update delivery');
    }

    return response.json();
  }

  async cancelDelivery(id: string): Promise<DeliveryResponse> {
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel delivery');
    }

    return response.json();
  }

  async deleteDelivery(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete delivery');
    }

    return { success: true };
  }

  async uploadDeliveryMedia(
    deliveryId: string,
    files: File[]
  ): Promise<{ mediaIds: string[] }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('media', file);
    });

    const response = await fetch(
      `${API_BASE_URL}/deliveries/${deliveryId}/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${''}`, // Get from secure storage
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    return response.json();
  }

  async getDeliveryQuote(
    request: CreateDeliveryRequest
  ): Promise<{ price: number; estimatedEarnings: number }> {
    const response = await fetch(`${API_BASE_URL}/deliveries/quote`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to get delivery quote');
    }

    return response.json();
  }
}

export const deliveryRepository = new DeliveryRepository();
