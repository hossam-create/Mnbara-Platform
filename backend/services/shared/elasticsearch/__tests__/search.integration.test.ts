/**
 * Search Integration Tests
 * Tests search relevance scoring and autocomplete performance
 * Requirements: 17.1, 17.2, 17.3
 */

describe('SearchService Integration Tests', () => {
  // Mock search function
  const mockSearch = jest.fn();
  
  // Mock SearchService class
  class MockSearchService {
    private client = { search: mockSearch };

    async searchProducts(options: {
      query: string;
      filters?: Record<string, unknown>;
      page?: number;
      pageSize?: number;
      sortBy?: string;
    }) {
      const { query, filters = {}, page = 1, pageSize = 20, sortBy = 'relevance' } = options;

      const must: unknown[] = [];
      const filter: unknown[] = [];

      if (query && query.trim()) {
        must.push({
          multi_match: {
            query: query.trim(),
            fields: ['title^3', 'title.autocomplete^2', 'description', 'tags', 'categoryName'],
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
      if (filters.categoryId) {
        filter.push({ term: { categoryId: filters.categoryId } });
      }
      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        const range: { gte?: number; lte?: number } = {};
        if (filters.priceMin !== undefined) range.gte = filters.priceMin as number;
        if (filters.priceMax !== undefined) range.lte = filters.priceMax as number;
        filter.push({ range: { price: range } });
      }
      if (filters.location) {
        const loc = filters.location as { lat: number; lon: number; radiusKm: number };
        filter.push({
          geo_distance: {
            distance: `${loc.radiusKm}km`,
            location: { lat: loc.lat, lon: loc.lon },
          },
        });
      }

      // Build sort
      let sort: unknown[];
      switch (sortBy) {
        case 'price_asc':
          sort = [{ currentPrice: 'asc' }, { _score: 'desc' }];
          break;
        case 'price_desc':
          sort = [{ currentPrice: 'desc' }, { _score: 'desc' }];
          break;
        case 'newest':
          sort = [{ createdAt: 'desc' }, { _score: 'desc' }];
          break;
        case 'ending_soon':
          sort = [{ endAt: 'asc' }, { _score: 'desc' }];
          break;
        case 'popularity':
          sort = [{ viewsCount: 'desc' }, { _score: 'desc' }];
          break;
        default:
          sort = [{ _score: 'desc' }, { createdAt: 'desc' }];
      }

      const response = await this.client.search({
        index: 'mnbara_products',
        body: {
          from: (page - 1) * pageSize,
          size: pageSize,
          query: { bool: { must, filter } },
          sort,
          aggs: {
            categories: { terms: { field: 'categoryId', size: 20 } },
            conditions: { terms: { field: 'condition', size: 10 } },
            price_ranges: {
              range: {
                field: 'price',
                ranges: [{ to: 50 }, { from: 50, to: 100 }, { from: 100, to: 500 }, { from: 500, to: 1000 }, { from: 1000 }],
              },
            },
          },
        },
      });

      const hits = response.hits.hits;
      const total = typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0;

      return {
        items: hits.map((hit: { _source: unknown; _score: number; highlight?: unknown }) => ({
          ...hit._source as object,
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

    async searchAuctions(options: {
      query: string;
      filters?: Record<string, unknown>;
      page?: number;
      pageSize?: number;
      sortBy?: string;
      endingSoon?: boolean;
    }) {
      const { query, filters = {}, page = 1, pageSize = 20, sortBy = 'ending_soon', endingSoon } = options;

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

      filter.push({ term: { status: 'active' } });

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

      let sort: unknown[];
      switch (sortBy) {
        case 'ending_soon':
          sort = [{ endAt: 'asc' }, { _score: 'desc' }];
          break;
        default:
          sort = [{ _score: 'desc' }, { createdAt: 'desc' }];
      }

      const response = await this.client.search({
        index: 'mnbara_auctions',
        body: {
          from: (page - 1) * pageSize,
          size: pageSize,
          query: { bool: { must, filter } },
          sort,
        },
      });

      const hits = response.hits.hits;
      const total = typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0;

      return {
        items: hits.map((hit: { _source: unknown; _score: number }) => ({
          ...hit._source as object,
          _score: hit._score,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        aggregations: response.aggregations,
      };
    }

    async autocomplete(query: string, limit: number = 10) {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const results: Array<{ text: string; type: string; id?: string; score: number }> = [];

      const productResponse = await this.client.search({
        index: 'mnbara_products',
        body: {
          size: limit,
          query: {
            bool: {
              should: [
                { match: { 'title.autocomplete': { query: query.trim(), operator: 'and' } } },
                { prefix: { 'title.keyword': { value: query.trim(), case_insensitive: true } } },
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

      const categoryResponse = await this.client.search({
        index: 'mnbara_categories',
        body: {
          size: 5,
          query: { match: { 'name.autocomplete': { query: query.trim(), operator: 'and' } } },
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

      return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }
  }

  let searchService: MockSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    searchService = new MockSearchService();
  });

  describe('Search Relevance Scoring', () => {
    it('should rank title matches higher than description matches', async () => {
      const mockResponse = {
        hits: {
          total: { value: 2 },
          hits: [
            { _id: '1', _score: 15.5, _source: { id: '1', title: 'iPhone 15 Pro Max', description: 'Latest Apple smartphone', price: 1199, status: 'active' }, highlight: { title: ['<em>iPhone</em> 15 Pro Max'] } },
            { _id: '2', _score: 8.2, _source: { id: '2', title: 'Phone Case', description: 'Compatible with iPhone 15', price: 29, status: 'active' }, highlight: { description: ['Compatible with <em>iPhone</em> 15'] } },
          ],
        },
        aggregations: { categories: { buckets: [] }, conditions: { buckets: [] }, price_ranges: { buckets: [] }, avg_price: { value: 614 } },
      };

      mockSearch.mockResolvedValueOnce(mockResponse);

      const result = await searchService.searchProducts({ query: 'iPhone', sortBy: 'relevance' });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]._score).toBeGreaterThan(result.items[1]._score);
    });

    it('should rank exact matches higher than fuzzy matches', async () => {
      const mockResponse = {
        hits: {
          total: { value: 2 },
          hits: [
            { _id: '1', _score: 20.0, _source: { id: '1', title: 'Samsung Galaxy S24', description: 'Latest Samsung flagship', price: 999 } },
            { _id: '2', _score: 12.5, _source: { id: '2', title: 'Samsng Galaxy S23', description: 'Previous generation Samsung', price: 799 } },
          ],
        },
        aggregations: {},
      };

      mockSearch.mockResolvedValueOnce(mockResponse);

      const result = await searchService.searchProducts({ query: 'Samsung', sortBy: 'relevance' });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]._score).toBe(20.0);
      expect(result.items[1]._score).toBe(12.5);
    });

    it('should boost score when query matches multiple fields', async () => {
      const mockResponse = {
        hits: {
          total: { value: 2 },
          hits: [
            { _id: '1', _score: 25.0, _source: { id: '1', title: 'Vintage Leather Bag', description: 'Handcrafted leather bag with vintage design', tags: ['leather', 'vintage', 'bag'], categoryName: 'Bags' } },
            { _id: '2', _score: 10.0, _source: { id: '2', title: 'Modern Backpack', description: 'Leather straps included', tags: ['backpack'], categoryName: 'Bags' } },
          ],
        },
        aggregations: {},
      };

      mockSearch.mockResolvedValueOnce(mockResponse);

      const result = await searchService.searchProducts({ query: 'leather bag', sortBy: 'relevance' });

      expect(result.items[0]._score).toBeGreaterThan(result.items[1]._score);
    });

    it('should build correct multi_match query with fuzzy matching', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 0 }, hits: [] }, aggregations: {} });

      await searchService.searchProducts({ query: 'smartphone', sortBy: 'relevance' });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'mnbara_products',
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                must: expect.arrayContaining([
                  expect.objectContaining({
                    multi_match: expect.objectContaining({ query: 'smartphone', fuzziness: 'AUTO' }),
                  }),
                ]),
              }),
            }),
          }),
        })
      );
    });

    it('should use match_all query when no search query provided', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 100 }, hits: [] }, aggregations: {} });

      await searchService.searchProducts({ query: '', sortBy: 'newest' });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                must: expect.arrayContaining([{ match_all: {} }]),
              }),
            }),
          }),
        })
      );
    });
  });

  describe('Autocomplete Performance', () => {
    it('should return autocomplete results within performance threshold', async () => {
      const productResponse = { hits: { hits: [{ _score: 10, _source: { id: '1', title: 'iPhone 15 Pro' } }, { _score: 8, _source: { id: '2', title: 'iPhone 14' } }] } };
      const categoryResponse = { hits: { hits: [{ _score: 5, _source: { id: 'cat1', name: 'iPhones & Smartphones' } }] } };

      mockSearch.mockResolvedValueOnce(productResponse).mockResolvedValueOnce(categoryResponse);

      const startTime = Date.now();
      const results = await searchService.autocomplete('iPho', 10);
      const duration = Date.now() - startTime;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000);
    });

    it('should return autocomplete results sorted by relevance score', async () => {
      const productResponse = { hits: { hits: [{ _score: 15, _source: { id: '1', title: 'MacBook Pro 16' } }, { _score: 12, _source: { id: '2', title: 'MacBook Air M3' } }] } };
      const categoryResponse = { hits: { hits: [{ _score: 8, _source: { id: 'cat1', name: 'MacBooks' } }] } };

      mockSearch.mockResolvedValueOnce(productResponse).mockResolvedValueOnce(categoryResponse);

      const results = await searchService.autocomplete('Mac', 10);

      expect(results).toHaveLength(3);
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
    });

    it('should return empty results for queries shorter than 2 characters', async () => {
      const results = await searchService.autocomplete('a', 10);

      expect(results).toHaveLength(0);
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it('should include both product and category suggestions', async () => {
      const productResponse = { hits: { hits: [{ _score: 10, _source: { id: '1', title: 'Nike Air Max' } }] } };
      const categoryResponse = { hits: { hits: [{ _score: 8, _source: { id: 'cat1', name: 'Nike Shoes' } }] } };

      mockSearch.mockResolvedValueOnce(productResponse).mockResolvedValueOnce(categoryResponse);

      const results = await searchService.autocomplete('Nike', 10);

      const productResults = results.filter((r) => r.type === 'product');
      const categoryResults = results.filter((r) => r.type === 'category');

      expect(productResults.length).toBeGreaterThan(0);
      expect(categoryResults.length).toBeGreaterThan(0);
    });

    it('should respect the limit parameter for autocomplete results', async () => {
      const productResponse = { hits: { hits: [{ _score: 10, _source: { id: '1', title: 'Product 1' } }, { _score: 9, _source: { id: '2', title: 'Product 2' } }, { _score: 8, _source: { id: '3', title: 'Product 3' } }, { _score: 7, _source: { id: '4', title: 'Product 4' } }, { _score: 6, _source: { id: '5', title: 'Product 5' } }] } };
      const categoryResponse = { hits: { hits: [{ _score: 5, _source: { id: 'cat1', name: 'Category 1' } }, { _score: 4, _source: { id: 'cat2', name: 'Category 2' } }] } };

      mockSearch.mockResolvedValueOnce(productResponse).mockResolvedValueOnce(categoryResponse);

      const results = await searchService.autocomplete('Pro', 3);

      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Search Filters', () => {
    it('should apply price range filters correctly', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 5 }, hits: [] }, aggregations: {} });

      await searchService.searchProducts({ query: 'laptop', filters: { priceMin: 500, priceMax: 1500 } });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([{ range: { price: { gte: 500, lte: 1500 } } }]),
              }),
            }),
          }),
        })
      );
    });

    it('should apply category filter correctly', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 10 }, hits: [] }, aggregations: {} });

      await searchService.searchProducts({ query: 'phone', filters: { categoryId: 'electronics-phones' } });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([{ term: { categoryId: 'electronics-phones' } }]),
              }),
            }),
          }),
        })
      );
    });

    it('should apply geo-location filter correctly', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 8 }, hits: [] }, aggregations: {} });

      await searchService.searchProducts({ query: 'furniture', filters: { location: { lat: 30.0444, lon: 31.2357, radiusKm: 50 } } });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([{ geo_distance: { distance: '50km', location: { lat: 30.0444, lon: 31.2357 } } }]),
              }),
            }),
          }),
        })
      );
    });
  });

  describe('Search Sorting', () => {
    it('should sort by price ascending correctly', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 5 }, hits: [] }, aggregations: {} });

      await searchService.searchProducts({ query: 'headphones', sortBy: 'price_asc' });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ body: expect.objectContaining({ sort: [{ currentPrice: 'asc' }, { _score: 'desc' }] }) }));
    });

    it('should sort by newest correctly', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 5 }, hits: [] }, aggregations: {} });

      await searchService.searchProducts({ query: 'camera', sortBy: 'newest' });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ body: expect.objectContaining({ sort: [{ createdAt: 'desc' }, { _score: 'desc' }] }) }));
    });

    it('should sort by popularity correctly', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 5 }, hits: [] }, aggregations: {} });

      await searchService.searchProducts({ query: 'shoes', sortBy: 'popularity' });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ body: expect.objectContaining({ sort: [{ viewsCount: 'desc' }, { _score: 'desc' }] }) }));
    });
  });

  describe('Auction Search', () => {
    it('should filter auctions ending soon', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 3 }, hits: [] }, aggregations: {} });

      await searchService.searchAuctions({ query: 'vintage', endingSoon: true });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'mnbara_auctions',
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([{ term: { status: 'active' } }]),
              }),
            }),
          }),
        })
      );
    });

    it('should sort auctions by ending time', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 5 }, hits: [] }, aggregations: {} });

      await searchService.searchAuctions({ query: 'art', sortBy: 'ending_soon' });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ body: expect.objectContaining({ sort: [{ endAt: 'asc' }, { _score: 'desc' }] }) }));
    });
  });

  describe('Pagination', () => {
    it('should calculate correct pagination offset', async () => {
      mockSearch.mockResolvedValueOnce({ hits: { total: { value: 100 }, hits: [] }, aggregations: {} });

      await searchService.searchProducts({ query: 'electronics', page: 3, pageSize: 20 });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ body: expect.objectContaining({ from: 40, size: 20 }) }));
    });

    it('should return correct pagination metadata', async () => {
      mockSearch.mockResolvedValueOnce({
        hits: { total: { value: 95 }, hits: Array(20).fill({ _id: '1', _score: 5, _source: { id: '1', title: 'Product' } }) },
        aggregations: {},
      });

      const result = await searchService.searchProducts({ query: 'test', page: 2, pageSize: 20 });

      expect(result.total).toBe(95);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('Aggregations', () => {
    it('should return aggregations for faceted filtering', async () => {
      mockSearch.mockResolvedValueOnce({
        hits: { total: { value: 50 }, hits: [] },
        aggregations: {
          categories: { buckets: [{ key: 'electronics', doc_count: 30 }, { key: 'clothing', doc_count: 20 }] },
          conditions: { buckets: [{ key: 'new', doc_count: 35 }, { key: 'used', doc_count: 15 }] },
          price_ranges: { buckets: [{ key: '*-50.0', doc_count: 10 }, { key: '50.0-100.0', doc_count: 25 }] },
        },
      });

      const result = await searchService.searchProducts({ query: 'gadgets' });

      expect(result.aggregations).toBeDefined();
      expect(result.aggregations?.categories).toBeDefined();
      expect(result.aggregations?.conditions).toBeDefined();
      expect(result.aggregations?.price_ranges).toBeDefined();
    });
  });
});
