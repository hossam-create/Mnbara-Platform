/**
 * Elasticsearch Search Service
 * Provides search functionality with fuzzy matching, autocomplete, and filters
 */

import { getElasticsearchClient } from './elasticsearch.client';
import { INDICES } from './elasticsearch.config';

export interface SearchFilters {
  categoryId?: string;
  categoryPath?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: string[];
  status?: string[];
  location?: {
    lat: number;
    lon: number;
    radiusKm: number;
  };
  city?: string;
  country?: string;
  sellerId?: string;
  featured?: boolean;
  type?: 'fixed' | 'auction';
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  page?: number;
  pageSize?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'ending_soon' | 'popularity';
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  aggregations?: Record<string, unknown>;
}

export interface AutocompleteResult {
  text: string;
  type: 'product' | 'category' | 'suggestion';
  id?: string;
  score: number;
}

export class SearchService {
  private client = getElasticsearchClient();

  /**
   * Search products with full-text search, filters, and sorting
   */
  async searchProducts(options: SearchOptions): Promise<SearchResult<unknown>> {
    const { query, filters = {}, page = 1, pageSize = 20, sortBy = 'relevance' } = options;

    const must: unknown[] = [];
    const filter: unknown[] = [];

    // Full-text search query with fuzzy matching
    if (query && query.trim()) {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: [
            'title^3',
            'title.autocomplete^2',
            'description',
            'tags',
            'categoryName',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 2,
          operator: 'or',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    // Apply filters
    this.applyFilters(filter, filters);

    // Build sort
    const sort = this.buildSort(sortBy);

    const response = await this.client.search({
      index: INDICES.PRODUCTS,
      body: {
        from: (page - 1) * pageSize,
        size: pageSize,
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort,
        aggs: {
          categories: {
            terms: { field: 'categoryId', size: 20 },
          },
          conditions: {
            terms: { field: 'condition', size: 10 },
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 500 },
                { from: 500, to: 1000 },
                { from: 1000 },
              ],
            },
          },
          avg_price: {
            avg: { field: 'price' },
          },
        },
        highlight: {
          fields: {
            title: {},
            description: { fragment_size: 150 },
          },
        },
      },
    });

    const hits = response.hits.hits;
    const total = typeof response.hits.total === 'number' 
      ? response.hits.total 
      : response.hits.total?.value || 0;

    return {
      items: hits.map((hit) => ({
        ...hit._source,
        _score: hit._score,
        _highlight: hit.highlight,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      aggregations: response.aggregations,
    };
  }

  /**
   * Search listings (both fixed price and auctions)
   */
  async searchListings(options: SearchOptions): Promise<SearchResult<unknown>> {
    const { query, filters = {}, page = 1, pageSize = 20, sortBy = 'relevance' } = options;

    const must: unknown[] = [];
    const filter: unknown[] = [];

    if (query && query.trim()) {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ['title^3', 'title.autocomplete^2', 'description'],
          type: 'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 2,
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    // Default to active listings
    filter.push({ term: { status: 'active' } });

    this.applyFilters(filter, filters);

    const sort = this.buildSort(sortBy);

    const response = await this.client.search({
      index: INDICES.LISTINGS,
      body: {
        from: (page - 1) * pageSize,
        size: pageSize,
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort,
        aggs: {
          listing_types: {
            terms: { field: 'type', size: 10 },
          },
          categories: {
            terms: { field: 'categoryId', size: 20 },
          },
        },
      },
    });

    const hits = response.hits.hits;
    const total = typeof response.hits.total === 'number'
      ? response.hits.total
      : response.hits.total?.value || 0;

    return {
      items: hits.map((hit) => ({
        ...hit._source,
        _score: hit._score,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      aggregations: response.aggregations,
    };
  }

  /**
   * Search auctions with auction-specific filters
   */
  async searchAuctions(
    options: SearchOptions & {
      endingSoon?: boolean;
      reserveMet?: boolean;
    }
  ): Promise<SearchResult<unknown>> {
    const {
      query,
      filters = {},
      page = 1,
      pageSize = 20,
      sortBy = 'ending_soon',
      endingSoon,
      reserveMet,
    } = options;

    const must: unknown[] = [];
    const filter: unknown[] = [];

    if (query && query.trim()) {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ['title^3', 'title.autocomplete^2', 'description'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    // Active auctions only
    filter.push({ term: { status: 'active' } });

    // Ending soon filter (within 2 hours)
    if (endingSoon) {
      filter.push({
        range: {
          endAt: {
            lte: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            gte: new Date().toISOString(),
          },
        },
      });
    }

    // Reserve met filter
    if (reserveMet !== undefined) {
      filter.push({ term: { reserveMet } });
    }

    this.applyFilters(filter, filters);

    const sort = this.buildSort(sortBy);

    const response = await this.client.search({
      index: INDICES.AUCTIONS,
      body: {
        from: (page - 1) * pageSize,
        size: pageSize,
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort,
        aggs: {
          categories: {
            terms: { field: 'categoryId', size: 20 },
          },
          bid_ranges: {
            range: {
              field: 'currentBid',
              ranges: [
                { to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 500 },
                { from: 500 },
              ],
            },
          },
          ending_times: {
            date_histogram: {
              field: 'endAt',
              calendar_interval: 'hour',
            },
          },
        },
      },
    });

    const hits = response.hits.hits;
    const total = typeof response.hits.total === 'number'
      ? response.hits.total
      : response.hits.total?.value || 0;

    return {
      items: hits.map((hit) => ({
        ...hit._source,
        _score: hit._score,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      aggregations: response.aggregations,
    };
  }

  /**
   * Autocomplete suggestions for search
   */
  async autocomplete(
    query: string,
    limit: number = 10
  ): Promise<AutocompleteResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const results: AutocompleteResult[] = [];

    // Search products for autocomplete
    const productResponse = await this.client.search({
      index: INDICES.PRODUCTS,
      body: {
        size: limit,
        query: {
          bool: {
            should: [
              {
                match: {
                  'title.autocomplete': {
                    query: query.trim(),
                    operator: 'and',
                  },
                },
              },
              {
                prefix: {
                  'title.keyword': {
                    value: query.trim(),
                    case_insensitive: true,
                  },
                },
              },
            ],
            filter: [{ term: { status: 'active' } }],
          },
        },
        _source: ['id', 'title'],
      },
    });

    for (const hit of productResponse.hits.hits) {
      const source = hit._source as { id: string; title: string };
      results.push({
        text: source.title,
        type: 'product',
        id: source.id,
        score: hit._score || 0,
      });
    }

    // Search categories for autocomplete
    const categoryResponse = await this.client.search({
      index: INDICES.CATEGORIES,
      body: {
        size: 5,
        query: {
          match: {
            'name.autocomplete': {
              query: query.trim(),
              operator: 'and',
            },
          },
        },
        _source: ['id', 'name'],
      },
    });

    for (const hit of categoryResponse.hits.hits) {
      const source = hit._source as { id: string; name: string };
      results.push({
        text: source.name,
        type: 'category',
        id: source.id,
        score: hit._score || 0,
      });
    }

    // Sort by score and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get search suggestions based on popular searches
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    // This would typically use a separate suggestions index
    // For now, we'll use term aggregation on titles
    const response = await this.client.search({
      index: INDICES.PRODUCTS,
      body: {
        size: 0,
        query: {
          prefix: {
            'title.keyword': {
              value: query.trim(),
              case_insensitive: true,
            },
          },
        },
        aggs: {
          suggestions: {
            terms: {
              field: 'title.keyword',
              size: limit,
            },
          },
        },
      },
    });

    const buckets = (response.aggregations?.suggestions as { buckets: Array<{ key: string }> })?.buckets || [];
    return buckets.map((b) => b.key);
  }

  /**
   * Apply common filters to search query
   */
  private applyFilters(filter: unknown[], filters: SearchFilters): void {
    if (filters.categoryId) {
      filter.push({ term: { categoryId: filters.categoryId } });
    }

    if (filters.categoryPath) {
      filter.push({ prefix: { categoryPath: filters.categoryPath } });
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const range: { gte?: number; lte?: number } = {};
      if (filters.priceMin !== undefined) range.gte = filters.priceMin;
      if (filters.priceMax !== undefined) range.lte = filters.priceMax;
      filter.push({ range: { price: range } });
    }

    if (filters.condition && filters.condition.length > 0) {
      filter.push({ terms: { condition: filters.condition } });
    }

    if (filters.status && filters.status.length > 0) {
      filter.push({ terms: { status: filters.status } });
    }

    if (filters.location) {
      filter.push({
        geo_distance: {
          distance: `${filters.location.radiusKm}km`,
          location: {
            lat: filters.location.lat,
            lon: filters.location.lon,
          },
        },
      });
    }

    if (filters.city) {
      filter.push({ match: { city: filters.city } });
    }

    if (filters.country) {
      filter.push({ term: { country: filters.country } });
    }

    if (filters.sellerId) {
      filter.push({ term: { sellerId: filters.sellerId } });
    }

    if (filters.featured !== undefined) {
      filter.push({ term: { featured: filters.featured } });
    }

    if (filters.type) {
      filter.push({ term: { type: filters.type } });
    }
  }

  /**
   * Build sort configuration
   */
  private buildSort(sortBy: string): unknown[] {
    switch (sortBy) {
      case 'price_asc':
        return [{ currentPrice: 'asc' }, { _score: 'desc' }];
      case 'price_desc':
        return [{ currentPrice: 'desc' }, { _score: 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }, { _score: 'desc' }];
      case 'ending_soon':
        return [{ endAt: 'asc' }, { _score: 'desc' }];
      case 'popularity':
        return [{ viewsCount: 'desc' }, { _score: 'desc' }];
      case 'relevance':
      default:
        return [{ _score: 'desc' }, { createdAt: 'desc' }];
    }
  }
}
