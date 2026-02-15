/**
 * Listing Service Client
 * 
 * Connects to listing-service (Port 3002)
 * Provides access to product catalog and listings
 */

import axios from 'axios';

const LISTING_SERVICE_URL = process.env.LISTING_SERVICE_URL || 'http://localhost:3002/api/v1';

export interface ListingProduct {
  id: number;
  title: string;
  titleAr?: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  status: string;
  categoryId: number;
  category?: {
    id: number;
    name: string;
    nameAr: string;
  };
  seller?: {
    id: number;
    name: string;
    rating?: number;
  };
  images: Array<{
    url: string;
    thumbnailUrl?: string;
  }>;
  location?: {
    city: string;
    country: string;
  };
  views: number;
  isFeatured: boolean;
  isNegotiable: boolean;
  createdAt: string;
}

export interface ListingFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  city?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface Category {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  level: number;
  parentId: number | null;
  children?: Category[];
}

export class ListingClient {
  /**
   * Get listings with filters
   */
  async getListings(filters?: ListingFilters): Promise<ListingProduct[]> {
    try {
      const params: any = {
        status: 'ACTIVE',
        dispositionStatus: 'APPROVED', // Only approved listings
        ...filters
      };

      const response = await axios.get(
        `${LISTING_SERVICE_URL}/listings`,
        {
          params,
          timeout: 5000
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to get listings:', error.message);
      return [];
    }
  }

  /**
   * Get single listing by ID
   */
  async getListing(id: number): Promise<ListingProduct | null> {
    try {
      const response = await axios.get(
        `${LISTING_SERVICE_URL}/listings/${id}`,
        { timeout: 5000 }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get listing:', error.message);
      return null;
    }
  }

  /**
   * Get featured listings
   */
  async getFeaturedListings(limit: number = 10): Promise<ListingProduct[]> {
    try {
      const response = await axios.get(
        `${LISTING_SERVICE_URL}/listings/featured/all`,
        {
          params: { limit },
          timeout: 5000
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to get featured listings:', error.message);
      return [];
    }
  }

  /**
   * Get listings by category
   */
  async getListingsByCategory(
    categoryId: number,
    limit: number = 20
  ): Promise<ListingProduct[]> {
    try {
      return this.getListings({ categoryId, limit });
    } catch (error: any) {
      console.error('Failed to get listings by category:', error.message);
      return [];
    }
  }

  /**
   * Get listings by price range
   */
  async getListingsByPriceRange(
    minPrice: number,
    maxPrice: number,
    limit: number = 20
  ): Promise<ListingProduct[]> {
    try {
      return this.getListings({ minPrice, maxPrice, limit });
    } catch (error: any) {
      console.error('Failed to get listings by price range:', error.message);
      return [];
    }
  }

  /**
   * Get listings by location
   */
  async getListingsByLocation(
    city: string,
    limit: number = 20
  ): Promise<ListingProduct[]> {
    try {
      return this.getListings({ city, limit });
    } catch (error: any) {
      console.error('Failed to get listings by location:', error.message);
      return [];
    }
  }

  /**
   * Search listings
   */
  async searchListings(
    query: string,
    filters?: ListingFilters
  ): Promise<ListingProduct[]> {
    try {
      return this.getListings({ search: query, ...filters });
    } catch (error: any) {
      console.error('Failed to search listings:', error.message);
      return [];
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await axios.get(
        `${LISTING_SERVICE_URL}/categories`,
        { timeout: 5000 }
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to get categories:', error.message);
      return [];
    }
  }

  /**
   * Get category tree (hierarchical)
   */
  async getCategoryTree(): Promise<Category[]> {
    try {
      const response = await axios.get(
        `${LISTING_SERVICE_URL}/categories/tree`,
        { timeout: 5000 }
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to get category tree:', error.message);
      return [];
    }
  }

  /**
   * Get popular categories
   */
  async getPopularCategories(): Promise<Category[]> {
    try {
      const response = await axios.get(
        `${LISTING_SERVICE_URL}/categories/popular`,
        { timeout: 5000 }
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to get popular categories:', error.message);
      return [];
    }
  }

  /**
   * Search categories
   */
  async searchCategories(query: string): Promise<Category[]> {
    try {
      const response = await axios.get(
        `${LISTING_SERVICE_URL}/categories/search`,
        {
          params: { q: query },
          timeout: 3000
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to search categories:', error.message);
      return [];
    }
  }
}

export default new ListingClient();
