import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { RedisService } from '../services/redis.service';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api.types';

/**
 * Search Controller - eBay-Level Search Engine
 * 
 * Features:
 * - Advanced product search with NLP
 * - Faceted search and filtering
 * - Auto-complete suggestions
 * - Search analytics
 * - Personalized search results
 * - Search history and saved searches
 */
export class SearchController {
  private elasticsearchService: ElasticsearchService;
  private redisService: RedisService;
  private prisma: PrismaClient;

  constructor() {
    this.elasticsearchService = new ElasticsearchService();
    this.redisService = new RedisService();
    this.prisma = new PrismaClient();
  }

  /**
   * Advanced product search - eBay-style
   */
  async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        q: query = '',
        category,
        minPrice,
        maxPrice,
        condition,
        brand,
        location,
        freeShipping,
        listingType,
        sortBy = 'relevance',
        page = 1,
        size = 20,
        facets = true
      } = req.query;

      const userId = req.user?.id;

      // Build search parameters
      const searchParams = {
        query: query as string,
        categoryId: category as string,
        filters: {
          priceMin: minPrice ? Number(minPrice) : undefined,
          priceMax: maxPrice ? Number(maxPrice) : undefined,
          condition: condition as string,
          brand: brand as string,
          location: location as string,
          freeShipping: freeShipping === 'true',
          listingType: listingType as string
        },
        sort: sortBy as string,
        page: Number(page),
        size: Number(size),
        userId
      };

      // Check cache for popular searches
      const cacheKey = this.generateSearchCacheKey(searchParams);
      const cachedResults = await this.redisService.get(cacheKey);

      if (cachedResults && !userId) {
        // Return cached results for anonymous users
        const results = JSON.parse(cachedResults);
        res.json({
          success: true,
          data: results,
          cached: true
        });
        return;
      }

      // Perform search
      const searchResults = await this.elasticsearchService.searchProducts(searchParams);

      // Enhance results with additional data
      const enhancedResults = await this.enhanceSearchResults(searchResults, userId);

      // Cache results for popular searches (anonymous users only)
      if (!userId && query && searchResults.total > 0) {
        await this.redisService.setWithExpiration(
          cacheKey,
          JSON.stringify(enhancedResults),
          300 // 5 minutes
        );
      }

      // Log search for analytics
      await this.logSearchQuery({
        query: query as string,
        userId,
        categoryId: category as string,
        filters: searchParams.filters,
        resultCount: searchResults.total,
        page: Number(page)
      });

      // Save search to user's history
      if (userId && query) {
        await this.saveSearchToHistory(userId, query as string, searchResults.total);
      }

      res.json({
        success: true,
        data: enhancedResults
      });

    } catch (error) {
      logger.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Search failed'
        }
      });
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query || (query as string).length < 2) {
        res.json({
          success: true,
          data: {
            suggestions: [],
            categories: [],
            brands: []
          }
        });
        return;
      }

      // Check cache first
      const cacheKey = `autocomplete:${query}:${limit}`;
      const cachedSuggestions = await this.redisService.get(cacheKey);

      if (cachedSuggestions) {
        res.json({
          success: true,
          data: JSON.parse(cachedSuggestions),
          cached: true
        });
        return;
      }

      // Get suggestions from Elasticsearch
      const [
        productSuggestions,
        categorySuggestions,
        brandSuggestions
      ] = await Promise.all([
        this.elasticsearchService.getAutocompleteSuggestions(
          query as string, 
          Number(limit)
        ),
        this.getCategorySuggestions(query as string, Number(limit)),
        this.getBrandSuggestions(query as string, Number(limit))
      ]);

      const suggestions = {
        suggestions: productSuggestions,
        categories: categorySuggestions,
        brands: brandSuggestions
      };

      // Cache suggestions
      await this.redisService.setWithExpiration(
        cacheKey,
        JSON.stringify(suggestions),
        3600 // 1 hour
      );

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      logger.error('Autocomplete error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTOCOMPLETE_ERROR',
          message: 'Autocomplete failed'
        }
      });
    }
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10, period = '24h' } = req.query;

      const cacheKey = `trending_searches:${period}:${limit}`;
      const cachedTrending = await this.redisService.get(cacheKey);

      if (cachedTrending) {
        res.json({
          success: true,
          data: JSON.parse(cachedTrending),
          cached: true
        });
        return;
      }

      // Calculate time range
      const now = new Date();
      const startTime = new Date();
      
      switch (period) {
        case '1h':
          startTime.setHours(now.getHours() - 1);
          break;
        case '24h':
          startTime.setDate(now.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        default:
          startTime.setDate(now.getDate() - 1);
      }

      // Get trending searches from database
      const trendingSearches = await this.prisma.searchQuery.groupBy({
        by: ['query'],
        where: {
          createdAt: {
            gte: startTime
          },
          query: {
            not: ''
          }
        },
        _count: {
          query: true
        },
        orderBy: {
          _count: {
            query: 'desc'
          }
        },
        take: Number(limit)
      });

      const trending = trendingSearches.map(item => ({
        query: item.query,
        count: item._count.query
      }));

      // Cache trending searches
      await this.redisService.setWithExpiration(
        cacheKey,
        JSON.stringify(trending),
        1800 // 30 minutes
      );

      res.json({
        success: true,
        data: trending
      });

    } catch (error) {
      logger.error('Trending searches error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRENDING_SEARCHES_ERROR',
          message: 'Failed to get trending searches'
        }
      });
    }
  }

  /**
   * Get search suggestions based on user history
   */
  async getPersonalizedSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { limit = 5 } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      // Get user's recent searches
      const recentSearches = await this.prisma.searchQuery.findMany({
        where: {
          userId,
          query: {
            not: ''
          }
        },
        select: {
          query: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Number(limit),
        distinct: ['query']
      });

      // Get user's watched categories
      const watchedCategories = await this.prisma.productWatcher.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        take: 5
      });

      const suggestions = {
        recentSearches: recentSearches.map(s => s.query),
        suggestedCategories: watchedCategories
          .map(w => w.product.category)
          .filter((category, index, self) => 
            index === self.findIndex(c => c.id === category.id)
          )
      };

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      logger.error('Personalized suggestions error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERSONALIZED_SUGGESTIONS_ERROR',
          message: 'Failed to get personalized suggestions'
        }
      });
    }
  }

  /**
   * Save search query
   */
  async saveSearch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { query, name } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      if (!query) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Search query is required'
          }
        });
        return;
      }

      // Save search query (this would typically be in a separate saved_searches table)
      // For now, we'll use the search_queries table with a special flag
      await this.prisma.searchQuery.create({
        data: {
          query,
          userId,
          resultCount: 0, // Will be updated when search is performed
          sessionId: `saved_${Date.now()}`
        }
      });

      res.json({
        success: true,
        message: 'Search saved successfully'
      });

    } catch (error) {
      logger.error('Save search error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SAVE_SEARCH_ERROR',
          message: 'Failed to save search'
        }
      });
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '7d' } = req.query;

      // Calculate time range
      const now = new Date();
      const startTime = new Date();
      
      switch (period) {
        case '24h':
          startTime.setDate(now.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(now.getDate() - 30);
          break;
        default:
          startTime.setDate(now.getDate() - 7);
      }

      // Get search analytics
      const [
        totalSearches,
        uniqueQueries,
        topQueries,
        noResultQueries,
        avgResultCount
      ] = await Promise.all([
        // Total searches
        this.prisma.searchQuery.count({
          where: {
            createdAt: { gte: startTime }
          }
        }),
        
        // Unique queries
        this.prisma.searchQuery.findMany({
          where: {
            createdAt: { gte: startTime },
            query: { not: '' }
          },
          select: { query: true },
          distinct: ['query']
        }),
        
        // Top queries
        this.prisma.searchQuery.groupBy({
          by: ['query'],
          where: {
            createdAt: { gte: startTime },
            query: { not: '' }
          },
          _count: { query: true },
          orderBy: { _count: { query: 'desc' } },
          take: 10
        }),
        
        // No result queries
        this.prisma.searchQuery.findMany({
          where: {
            createdAt: { gte: startTime },
            resultCount: 0,
            query: { not: '' }
          },
          select: { query: true },
          distinct: ['query'],
          take: 10
        }),
        
        // Average result count
        this.prisma.searchQuery.aggregate({
          where: {
            createdAt: { gte: startTime }
          },
          _avg: { resultCount: true }
        })
      ]);

      const analytics = {
        totalSearches,
        uniqueQueries: uniqueQueries.length,
        topQueries: topQueries.map(q => ({
          query: q.query,
          count: q._count.query
        })),
        noResultQueries: noResultQueries.map(q => q.query),
        avgResultCount: avgResultCount._avg.resultCount || 0,
        period
      };

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Search analytics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_ANALYTICS_ERROR',
          message: 'Failed to get search analytics'
        }
      });
    }
  }

  // Private helper methods

  private generateSearchCacheKey(params: any): string {
    const keyParts = [
      'search',
      params.query || 'all',
      params.categoryId || 'all',
      params.sort || 'relevance',
      params.page || 1,
      params.size || 20
    ];

    // Add filters to cache key
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        keyParts.push(`${key}:${value}`);
      }
    });

    return keyParts.join(':');
  }

  private async enhanceSearchResults(searchResults: any, userId?: string): Promise<any> {
    try {
      // Add user-specific data like watchlist status
      if (userId && searchResults.products.length > 0) {
        const productIds = searchResults.products.map((p: any) => p.id);
        
        const watchedProducts = await this.prisma.productWatcher.findMany({
          where: {
            userId,
            productId: { in: productIds }
          },
          select: { productId: true }
        });

        const watchedSet = new Set(watchedProducts.map(w => w.productId));

        searchResults.products = searchResults.products.map((product: any) => ({
          ...product,
          isWatching: watchedSet.has(product.id)
        }));
      }

      return searchResults;
    } catch (error) {
      logger.error('Error enhancing search results:', error);
      return searchResults;
    }
  }

  private async getCategorySuggestions(query: string, limit: number): Promise<any[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ],
          isActive: true
        },
        select: {
          id: true,
          name: true,
          slug: true
        },
        take: limit
      });

      return categories;
    } catch (error) {
      logger.error('Error getting category suggestions:', error);
      return [];
    }
  }

  private async getBrandSuggestions(query: string, limit: number): Promise<string[]> {
    try {
      const brands = await this.prisma.product.findMany({
        where: {
          brand: {
            contains: query,
            mode: 'insensitive'
          },
          isActive: true
        },
        select: {
          brand: true
        },
        distinct: ['brand'],
        take: limit
      });

      return brands.map(b => b.brand).filter(Boolean) as string[];
    } catch (error) {
      logger.error('Error getting brand suggestions:', error);
      return [];
    }
  }

  private async logSearchQuery(params: {
    query: string;
    userId?: string;
    categoryId?: string;
    filters?: any;
    resultCount: number;
    page: number;
  }): Promise<void> {
    try {
      await this.prisma.searchQuery.create({
        data: {
          query: params.query,
          userId: params.userId,
          categoryId: params.categoryId,
          filters: params.filters,
          resultCount: params.resultCount,
          sessionId: `search_${Date.now()}_${Math.random()}`
        }
      });
    } catch (error) {
      logger.error('Error logging search query:', error);
    }
  }

  private async saveSearchToHistory(userId: string, query: string, resultCount: number): Promise<void> {
    try {
      // Limit search history to last 50 searches per user
      const searchCount = await this.prisma.searchQuery.count({
        where: { userId }
      });

      if (searchCount >= 50) {
        // Delete oldest searches
        const oldestSearches = await this.prisma.searchQuery.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          take: searchCount - 49,
          select: { id: true }
        });

        await this.prisma.searchQuery.deleteMany({
          where: {
            id: { in: oldestSearches.map(s => s.id) }
          }
        });
      }
    } catch (error) {
      logger.error('Error managing search history:', error);
    }
  }
}