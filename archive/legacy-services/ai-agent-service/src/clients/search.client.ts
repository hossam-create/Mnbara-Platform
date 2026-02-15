/**
 * Search Service Client
 * 
 * Connects to search-service (Port 3023)
 * Powered by MeiliSearch for ultra-fast product search
 */

import axios from 'axios';

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:3023';

export interface SearchProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sellerId: string;
  sellerName: string;
  inStock: boolean;
  imageUrl?: string;
  rating?: number;
  reviewCount: number;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sellerId?: string;
  sort?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  hits: SearchProduct[];
  total: number;
  query: string;
  processingTimeMs: number;
}

export interface SearchSuggestion {
  id: string;
  text: string;
}

export class SearchClient {
  /**
   * Search products with query and filters
   */
  async searchProducts(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResult> {
    try {
      const params: any = {
        q: query,
        limit: options?.limit || 20,
        offset: options?.offset || 0
      };

      // Add filters
      if (filters?.category) params.category = filters.category;
      if (filters?.minPrice !== undefined) params.minPrice = filters.minPrice;
      if (filters?.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
      if (filters?.inStock !== undefined) params.inStock = filters.inStock;
      if (filters?.sellerId) params.sellerId = filters.sellerId;
      if (filters?.sort) params.sort = filters.sort;

      const response = await axios.get(
        `${SEARCH_SERVICE_URL}/api/search/products`,
        {
          params,
          timeout: 5000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to search products:', error.message);
      return {
        hits: [],
        total: 0,
        query,
        processingTimeMs: 0
      };
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      const response = await axios.get(
        `${SEARCH_SERVICE_URL}/api/search/suggestions`,
        {
          params: { q: query, type: 'products' },
          timeout: 3000
        }
      );

      return response.data.suggestions || [];
    } catch (error: any) {
      console.error('Failed to get suggestions:', error.message);
      return [];
    }
  }

  /**
   * Search products by category
   */
  async searchByCategory(
    category: string,
    limit: number = 20
  ): Promise<SearchProduct[]> {
    try {
      const result = await this.searchProducts('', { category }, { limit });
      return result.hits;
    } catch (error: any) {
      console.error('Failed to search by category:', error.message);
      return [];
    }
  }

  /**
   * Search products within price range
   */
  async searchByPriceRange(
    minPrice: number,
    maxPrice: number,
    limit: number = 20
  ): Promise<SearchProduct[]> {
    try {
      const result = await this.searchProducts(
        '',
        { minPrice, maxPrice, inStock: true },
        { limit }
      );
      return result.hits;
    } catch (error: any) {
      console.error('Failed to search by price range:', error.message);
      return [];
    }
  }

  /**
   * Search in-stock products only
   */
  async searchInStock(
    query: string,
    limit: number = 20
  ): Promise<SearchProduct[]> {
    try {
      const result = await this.searchProducts(
        query,
        { inStock: true },
        { limit }
      );
      return result.hits;
    } catch (error: any) {
      console.error('Failed to search in-stock products:', error.message);
      return [];
    }
  }

  /**
   * Get facets for filter UI
   */
  async getFacets(): Promise<any> {
    try {
      const response = await axios.get(
        `${SEARCH_SERVICE_URL}/api/search/facets`,
        {
          params: { type: 'products' },
          timeout: 3000
        }
      );

      return response.data.facets || {};
    } catch (error: any) {
      console.error('Failed to get facets:', error.message);
      return {};
    }
  }

  /**
   * Search with Arabic support
   */
  async searchArabic(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResult> {
    // MeiliSearch handles Arabic automatically
    // Just pass the query as-is
    return this.searchProducts(query, filters, options);
  }
}

export default new SearchClient();
