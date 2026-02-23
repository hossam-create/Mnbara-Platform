/**
 * Listing Service - منصة منبرة
 * 
 * Frontend service for Listing API integration
 */

import axios from 'axios';
import type {
  Listing,
  CreateListingInput,
  UpdateListingInput,
  ListingFilters,
  ListingsPaginatedResponse,
  Category,
  CategoryStats,
  BulkUploadResult,
  FeeCalculation,
} from '../types/listing.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_LISTING_SERVICE_URL || '/api/v1';

/**
 * Listing Service - Manages product listings and classified ads
 */
export const listingService = {
  // ============ LISTINGS ============

  /**
   * Create a new listing
   */
  async createListing(data: CreateListingInput): Promise<Listing> {
    const response = await axios.post(`${API_BASE_URL}/listings`, data);
    return response.data.data;
  },

  /**
   * Get listings with filters and pagination
   */
  async getListings(filters?: ListingFilters): Promise<ListingsPaginatedResponse> {
    const response = await axios.get(`${API_BASE_URL}/listings`, {
      params: filters,
    });
    return {
      listings: response.data.data,
      pagination: response.data.pagination,
    };
  },

  /**
   * Get single listing by ID
   */
  async getListing(id: number): Promise<Listing> {
    const response = await axios.get(`${API_BASE_URL}/listings/${id}`);
    return response.data.data;
  },

  /**
   * Update listing
   */
  async updateListing(id: number, data: UpdateListingInput): Promise<Listing> {
    const response = await axios.put(`${API_BASE_URL}/listings/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete listing
   */
  async deleteListing(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/listings/${id}`);
  },

  /**
   * Mark listing as sold
   */
  async markAsSold(id: number): Promise<Listing> {
    const response = await axios.patch(`${API_BASE_URL}/listings/${id}/sold`);
    return response.data.data;
  },

  /**
   * Get featured listings
   */
  async getFeaturedListings(limit: number = 10): Promise<Listing[]> {
    const response = await axios.get(`${API_BASE_URL}/listings/featured/all`, {
      params: { limit },
    });
    return response.data.data;
  },

  /**
   * Upload images for listing
   */
  async uploadImages(listingId: number, files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await axios.post(
      `${API_BASE_URL}/listings/${listingId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Get listing decision status (Decision Authority integration)
   */
  async getListingDecisionStatus(listingId: number): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/listings/${listingId}/decision`);
    return response.data.data;
  },

  // ============ CATEGORIES ============

  /**
   * Get all categories
   */
  async getCategories(params?: { level?: number; parentId?: number }): Promise<Category[]> {
    const response = await axios.get(`${API_BASE_URL}/categories`, { params });
    return response.data.data;
  },

  /**
   * Get category tree (hierarchical)
   */
  async getCategoryTree(): Promise<Category[]> {
    const response = await axios.get(`${API_BASE_URL}/categories/tree`);
    return response.data.data;
  },

  /**
   * Get popular categories
   */
  async getPopularCategories(): Promise<Category[]> {
    const response = await axios.get(`${API_BASE_URL}/categories/popular`);
    return response.data.data;
  },

  /**
   * Search categories
   */
  async searchCategories(query: string): Promise<Category[]> {
    const response = await axios.get(`${API_BASE_URL}/categories/search`, {
      params: { q: query },
    });
    return response.data.data;
  },

  /**
   * Get single category
   */
  async getCategory(id: number): Promise<Category> {
    const response = await axios.get(`${API_BASE_URL}/categories/${id}`);
    return response.data.data;
  },

  /**
   * Get category path (breadcrumb)
   */
  async getCategoryPath(id: number): Promise<Category[]> {
    const response = await axios.get(`${API_BASE_URL}/categories/${id}/path`);
    return response.data.data;
  },

  /**
   * Get category statistics
   */
  async getCategoryStats(id: number): Promise<CategoryStats> {
    const response = await axios.get(`${API_BASE_URL}/categories/${id}/stats`);
    return response.data.data;
  },

  // ============ BULK OPERATIONS ============

  /**
   * Bulk upload listings from CSV
   */
  async bulkUpload(file: File): Promise<BulkUploadResult> {
    const formData = new FormData();
    formData.append('inventory', file);

    const response = await axios.post(`${API_BASE_URL}/bulk/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // ============ FEE CALCULATION ============

  /**
   * Calculate listing fees
   */
  async calculateFees(price: number, categoryId: number): Promise<FeeCalculation> {
    const response = await axios.post(`${API_BASE_URL}/fees/calculate`, {
      price,
      categoryId,
    });
    return response.data.data;
  },

  /**
   * Calculate checkout fees
   */
  async calculateCheckoutFees(
    price: number,
    categoryId: number,
    paymentMethod: string
  ): Promise<FeeCalculation> {
    const response = await axios.post(`${API_BASE_URL}/fees/calculate-checkout`, {
      price,
      categoryId,
      paymentMethod,
    });
    return response.data.data;
  },

  // ============ SEARCH ============

  /**
   * Search listings (Elasticsearch)
   */
  async searchListings(query: string, filters?: ListingFilters): Promise<ListingsPaginatedResponse> {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: {
        q: query,
        ...filters,
      },
    });
    return {
      listings: response.data.data,
      pagination: response.data.pagination,
    };
  },
};

export default listingService;
