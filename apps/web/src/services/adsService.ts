import axios from 'axios';

// Ads API Types
export interface Ad {
  id: string;
  title: string;
  placement: 'carousel' | 'deals' | 'category';
  imageUrl?: string;
  mediaUrl?: string;
  ctaLink: string;
  priority: number;
  startDate: string;
  endDate: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    categorySlug?: string;
    impressions?: number;
    clicks?: number;
  };
}

export interface CreateAdData {
  title: string;
  placement: 'carousel' | 'deals' | 'category';
  imageUrl?: string;
  mediaUrl?: string;
  ctaLink: string;
  priority: number;
  startDate: string;
  endDate: string;
  enabled?: boolean;
  metadata?: {
    categorySlug?: string;
  };
}

export interface UpdateAdData extends Partial<CreateAdData> {
  enabled?: boolean;
}

export interface AdsResponse {
  ads: Ad[];
  total: number;
  page: number;
  limit: number;
}

export interface AdsFilters {
  status?: 'active' | 'scheduled' | 'expired' | 'all';
  placement?: 'carousel' | 'deals' | 'category' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

// API Base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/**
 * Ads Service - Manages advertisement content and placement
 */
export const adsService = {
  /**
   * Get all ads with optional filtering
   */
  async getAds(filters: AdsFilters = {}): Promise<AdsResponse> {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.placement && filters.placement !== 'all') {
      params.append('placement', filters.placement);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    params.append('page', String(filters.page || 1));
    params.append('limit', String(filters.limit || 20));

    const response = await axios.get<AdsResponse>(
      `${API_BASE_URL}/admin/ads?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get ad by ID
   */
  async getAdById(id: string): Promise<Ad> {
    const response = await axios.get<Ad>(`${API_BASE_URL}/admin/ads/${id}`);
    return response.data;
  },

  /**
   * Create a new ad
   */
  async createAd(data: CreateAdData): Promise<Ad> {
    const response = await axios.post<Ad>(`${API_BASE_URL}/admin/ads`, data);
    return response.data;
  },

  /**
   * Update an existing ad
   */
  async updateAd(id: string, data: UpdateAdData): Promise<Ad> {
    const response = await axios.put<Ad>(`${API_BASE_URL}/admin/ads/${id}`, data);
    return response.data;
  },

  /**
   * Delete an ad
   */
  async deleteAd(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/admin/ads/${id}`);
  },

  /**
   * Toggle ad enabled status
   */
  async toggleAd(id: string, enabled: boolean): Promise<Ad> {
    return this.updateAd(id, { enabled });
  },

  /**
   * Reorder ads within a placement
   */
  async reorderAds(placement: string, ads: { id: string; priority: number }[]): Promise<void> {
    await axios.put(`${API_BASE_URL}/admin/ads/reorder`, { placement, ads });
  },

  /**
   * Get ads by placement (for frontend consumption)
   */
  async getAdsByPlacement(placement: string): Promise<Ad[]> {
    const response = await axios.get<Ad[]>(
      `${API_BASE_URL}/api/v1/ads/placement/${placement}`
    );
    return response.data;
  },

  /**
   * Upload ad image
   */
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post<{ url: string }>(
      `${API_BASE_URL}/admin/ads/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Get ad statistics
   */
  async getAdStats(): Promise<{
    total: number;
    active: number;
    scheduled: number;
    expired: number;
    byPlacement: Record<string, number>;
  }> {
    const response = await axios.get(`${API_BASE_URL}/admin/ads/stats`);
    return response.data;
  },
};

export default adsService;
