/**
 * Listing Service
 * Connects to listing-service endpoints
 */

import { apiClient } from './api.service';
import { API_CONFIG } from '../config/api.config';
import type { ApiResponse, Product } from '../types';

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  city: string;
  country: string;
  condition?: string;
  images?: string[];
  specifications?: Array<{ name: string; value: string }>;
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  price?: number;
  condition?: string;
  images?: string[];
}

class ListingService {
  private baseUrl = API_CONFIG.SERVICES.LISTING;

  /**
   * Get a single listing by ID
   */
  private loading = false;
  private error: string | null = null;
  private cache: Record<string, { data: Product; timestamp: number }> = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current loading state
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Get last error
   */
  getError(): string | null {
    return this.error;
  }

  /**
   * Clear cached listing
   */
  clearCache(id?: string): void {
    if (id) {
      delete this.cache[id];
    } else {
      this.cache = {};
    }
  }

  /**
   * Get a single listing by ID with caching
   */
  async getListing(id: string, forceRefresh = false): Promise<Product> {
    // Check cache first
    const cached = this.cache[id];
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.get<ApiResponse<Product>>(
        `${this.baseUrl}/${id}`,
        {
          params: {
            include: 'seller,images,specifications',
          },
        }
      );

      if (response.data.success && response.data.data) {
        // Update cache
        this.cache[id] = {
          data: response.data.data,
          timestamp: Date.now(),
        };
        return response.data.data;
      }

      throw new Error(response.data.message || 'Listing not found');
    } catch (error: unknown) {
      console.error('Failed to get listing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load listing';
      this.error = errorMessage;
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new listing
   */
  async createListing(data: CreateListingData): Promise<Product> {
    this.loading = true;
    this.error = null;

    try {
      const formData = new FormData();
      
      // Append basic fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' && Array.isArray(value)) {
          // Handle image uploads
          value.forEach((image, index) => {
            if (image instanceof File) {
              formData.append(`images[${index}]`, image);
            }
          });
        } else if (key === 'specifications' && Array.isArray(value)) {
          // Handle specifications
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await apiClient.post<ApiResponse<Product>>(
        this.baseUrl,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success && response.data.data) {
        // Invalidate relevant caches
        this.clearCache();
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to create listing');
    } catch (error: unknown) {
      console.error('Failed to create listing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create listing';
      this.error = errorMessage;
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing listing
   */
  async updateListing(id: string, data: UpdateListingData): Promise<Product> {
    this.loading = true;
    this.error = null;

    try {
      const formData = new FormData();
      
      // Append only provided fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' && Array.isArray(value)) {
          // Handle image updates
          value.forEach((image, index) => {
            if (image instanceof File) {
              formData.append(`newImages[${index}]`, image);
            } else if (typeof image === 'string') {
              formData.append('existingImages[]', image);
            }
          });
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await apiClient.patch<ApiResponse<Product>>(
        `${this.baseUrl}/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success && response.data.data) {
        // Update cache
        this.clearCache(id);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to update listing');
    } catch (error: unknown) {
      console.error('Failed to update listing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update listing';
      this.error = errorMessage;
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a listing
   */
  async deleteListing(id: string): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        `${this.baseUrl}/${id}`
      );

      if (response.data.success) {
        // Clear cache for deleted listing
        this.clearCache(id);
        return;
      }

      throw new Error(response.data.message || 'Failed to delete listing');
    } catch (error: unknown) {
      console.error('Failed to delete listing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete listing';
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Upload images for a listing
   */
  async uploadImages(id: string, images: File[]): Promise<string[]> {
    this.loading = true;
    this.error = null;

    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await apiClient.post<ApiResponse<{ urls: string[] }>>(
        `${this.baseUrl}/${id}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success && response.data.data) {
        // Invalidate cache for this listing
        this.clearCache(id);
        return response.data.data.urls;
      }

      throw new Error(response.data.message || 'Failed to upload images');
    } catch (error: unknown) {
      console.error('Failed to upload images:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Mark listing as sold
   */
  async markAsSold(id: string): Promise<Product> {
    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.patch<ApiResponse<Product>>(
        `${this.baseUrl}/${id}/sold`
      );

      if (response.data.success && response.data.data) {
        // Update cache
        this.clearCache(id);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to mark as sold');
    } catch (error: unknown) {
      console.error('Failed to mark as sold:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as sold';
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get my listings (seller view)
   */
  async getMyListings(page: number = 1, pageSize: number = 20): Promise<{ items: Product[]; total: number }> {
    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.get<ApiResponse<{ items: Product[]; total: number }>>(
        `${this.baseUrl}/me`,
        {
          params: {
            page,
            limit: pageSize,
          },
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get listings');
    } catch (error: unknown) {
      console.error('Failed to get my listings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get listings';
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }
}

export const listingService = new ListingService();
export default listingService;
