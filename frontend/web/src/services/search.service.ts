/**
 * Search Service
 * Connects to listing-service search endpoints
 */

import { apiClient } from './api.service';
import { API_CONFIG, isFeatureEnabled } from '../config/api.config';
import type { ApiResponse, Product } from '../types';

export interface SearchFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  minTrustScore?: number;
  verifiedSellerOnly?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'ending_soon';
}

export interface SearchResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SearchState {
  loading: boolean;
  error: string | null;
  results: SearchResult | null;
}

class SearchService {
  private baseUrl = API_CONFIG.SERVICES.SEARCH;

  /**
   * Search listings with filters
   */
  private loading = false;
  private error: string | null = null;
  private lastSearchResult: SearchResult | null = null;

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
   * Get last search results
   */
  getLastResults(): SearchResult | null {
    return this.lastSearchResult;
  }

  /**
   * Search listings with filters and pagination
   */
  async search(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<SearchResult> {
    this.loading = true;
    this.error = null;

    try {
      const params: Record<string, unknown> = {
        q: query,
        page,
        limit: pageSize,
        ...filters,
      };

      // Apply feature-flagged filters
      if (isFeatureEnabled('TRUST_SCORING') && filters.minTrustScore) {
        params.minTrustScore = filters.minTrustScore;
      }

      const response = await apiClient.get<ApiResponse<SearchResult>>(this.baseUrl, {
        params: {
          ...params,
          ...filters,
        },
      });

      if (response.data.success && response.data.data) {
        this.lastSearchResult = response.data.data;
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to fetch search results');
    } catch (error: unknown) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get search suggestions/autocomplete
   */
  async getSuggestions(query: string): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        `${this.baseUrl}/suggestions`,
        { params: { q: query } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        `${this.baseUrl}/popular-searches`
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get popular searches:', error);
      return ['iPhone', 'Laptop', 'Camera', 'Watch', 'Shoes'];
    }
  }

  /**
   * Get featured listings
   */
  async getFeaturedListings(): Promise<Product[]> {
    try {
      const response = await apiClient.get<ApiResponse<Product[]>>(
        `${this.baseUrl}/featured/all`
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get featured listings:', error);
      return [];
    }
  }

  /**
   * Get category-specific listings
   */
  async getByCategory(
    categoryId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<SearchResult> {
    return this.search('', { categoryId }, page, pageSize);
  }
}

export const searchService = new SearchService();
export default searchService;
