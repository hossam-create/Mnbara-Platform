import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { invalidateCategoryCache } from '../middleware/cache';

const prisma = new PrismaClient();

interface SearchIndexDocument {
  id: string;
  type: 'category';
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  level: number;
  path?: string;
  productCount: number;
  isActive: boolean;
  tags: string[];
  metadata: any;
  timestamp: Date;
}

interface SearchQuery {
  query: string;
  filters?: {
    level?: number;
    isActive?: boolean;
    minProducts?: number;
    maxProducts?: number;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

interface SearchResult {
  documents: SearchIndexDocument[];
  total: number;
  facets: {
    levels: Array<{ value: number; count: number }>;
    productRanges: Array<{ range: string; count: number }>;
  };
  suggestions: string[];
}

class SearchIntegrationService {
  private readonly searchServiceUrl: string;
  private readonly indexName: string;

  constructor() {
    this.searchServiceUrl = process.env.SEARCH_SERVICE_URL || 'http://localhost:3003';
    this.indexName = process.env.CATEGORY_SEARCH_INDEX || 'categories';
  }

  async indexCategory(categoryId: string): Promise<void> {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          stats: true,
          parent: true,
          children: true
        }
      });

      if (!category) {
        throw new Error(`Category ${categoryId} not found`);
      }

      const document = await this.buildSearchDocument(category);
      
      await axios.post(`${this.searchServiceUrl}/api/index/${this.indexName}/document`, document);
      
      console.log(`Category ${categoryId} indexed successfully`);
    } catch (error) {
      console.error('Error indexing category:', error);
      throw error;
    }
  }

  async indexAllCategories(): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          stats: true,
          parent: true,
          children: true
        }
      });

      const documents = await Promise.all(
        categories.map(category => this.buildSearchDocument(category))
      );

      // Bulk index
      await axios.post(`${this.searchServiceUrl}/api/index/${this.indexName}/bulk`, {
        documents,
        clear: true
      });

      console.log(`Indexed ${categories.length} categories`);
    } catch (error) {
      console.error('Error indexing all categories:', error);
      throw error;
    }
  }

  async removeCategoryFromIndex(categoryId: string): Promise<void> {
    try {
      await axios.delete(`${this.searchServiceUrl}/api/index/${this.indexName}/document/${categoryId}`);
      
      console.log(`Category ${categoryId} removed from search index`);
    } catch (error) {
      console.error('Error removing category from index:', error);
      throw error;
    }
  }

  async searchCategories(query: SearchQuery): Promise<SearchResult> {
    try {
      const response = await axios.post(`${this.searchServiceUrl}/api/search/${this.indexName}`, {
        query: query.query,
        filters: query.filters,
        sort: query.sort,
        limit: query.limit || 20,
        offset: query.offset || 0
      });

      return response.data;
    } catch (error) {
      console.error('Error searching categories:', error);
      
      // Fallback to database search if search service is unavailable
      return await this.fallbackDatabaseSearch(query);
    }
  }

  async getCategorySuggestions(query: string, limit: number = 10): Promise<string[]> {
    try {
      const response = await axios.get(`${this.searchServiceUrl}/api/suggest/${this.indexName}`, {
        params: {
          query,
          limit,
          fields: 'name,nameAr,slug,tags'
        }
      });

      return response.data.suggestions || [];
    } catch (error) {
      console.error('Error getting category suggestions:', error);
      return [];
    }
  }

  async getSearchAnalytics(timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<{
    topQueries: Array<{ query: string; count: number }>;
    topCategories: Array<{ categoryId: string; name: string; clicks: number }>;
    searchVolume: Array<{ date: string; searches: number }>;
    zeroResultQueries: Array<{ query: string; count: number }>;
  }> {
    try {
      const response = await axios.get(`${this.searchServiceUrl}/api/analytics/${this.indexName}`, {
        params: { timeframe }
      });

      return response.data || {
        topQueries: [],
        topCategories: [],
        searchVolume: [],
        zeroResultQueries: []
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return {
        topQueries: [],
        topCategories: [],
        searchVolume: [],
        zeroResultQueries: []
      };
    }
  }

  async optimizeSearchIndex(): Promise<void> {
    try {
      await axios.post(`${this.searchServiceUrl}/api/index/${this.indexName}/optimize`);
      
      console.log('Search index optimized');
    } catch (error) {
      console.error('Error optimizing search index:', error);
    }
  }

  async getSearchHealth(): Promise<{
    isHealthy: boolean;
    indexSize: number;
    lastIndexed: Date;
    issues: string[];
  }> {
    try {
      const response = await axios.get(`${this.searchServiceUrl}/api/health/${this.indexName}`);
      
      return response.data;
    } catch (error) {
      console.error('Error getting search health:', error);
      return {
        isHealthy: false,
        indexSize: 0,
        lastIndexed: new Date(),
        issues: ['Search service unavailable']
      };
    }
  }

  private async buildSearchDocument(category: any): Promise<SearchIndexDocument> {
    const tags = this.extractTags(category);
    const path = await this.buildCategoryPath(category);

    return {
      id: category.id,
      type: 'category',
      name: category.name,
      nameAr: category.nameAr,
      slug: category.slug,
      description: category.description,
      level: category.level,
      path,
      productCount: category.productCount,
      isActive: category.isActive,
      tags,
      metadata: {
        parentId: category.parentId,
        displayOrder: category.displayOrder,
        hasChildren: category.children?.length > 0,
        stats: category.stats,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      },
      timestamp: new Date()
    };
  }

  private extractTags(category: any): string[] {
    const tags: string[] = [];

    // Add level-based tags
    tags.push(`level-${category.level}`);

    // Add product count ranges
    if (category.productCount > 0) {
      if (category.productCount < 10) tags.push('small');
      else if (category.productCount < 100) tags.push('medium');
      else if (category.productCount < 1000) tags.push('large');
      else tags.push('xlarge');
    }

    // Add status tags
    tags.push(category.isActive ? 'active' : 'inactive');

    // Add hierarchy tags
    if (category.parentId) {
      tags.push('subcategory');
    } else {
      tags.push('root-category');
    }

    if (category.children?.length > 0) {
      tags.push('has-children');
    }

    // Extract keywords from name and description
    const nameKeywords = this.extractKeywords(category.name);
    const descKeywords = category.description ? this.extractKeywords(category.description) : [];
    
    tags.push(...nameKeywords, ...descKeywords);

    return [...new Set(tags)]; // Remove duplicates
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 10); // Limit to 10 keywords
  }

  private async buildCategoryPath(category: any): Promise<string> {
    const path: string[] = [];
    let current = category;

    // Build path by traversing up the hierarchy
    while (current) {
      path.unshift(current.name);
      if (current.parentId) {
        current = await prisma.category.findUnique({
          where: { id: current.parentId },
          select: { id: true, name: true, parentId: true }
        });
      } else {
        break;
      }
    }

    return path.join(' > ');
  }

  private async fallbackDatabaseSearch(query: SearchQuery): Promise<SearchResult> {
    try {
      // Build Prisma query based on search parameters
      const where: any = {
        isActive: query.filters?.isActive ?? true
      };

      if (query.filters?.level) {
        where.level = query.filters.level;
      }

      if (query.filters?.minProducts || query.filters?.maxProducts) {
        where.productCount = {};
        if (query.filters.minProducts) {
          where.productCount.gte = query.filters.minProducts;
        }
        if (query.filters.maxProducts) {
          where.productCount.lte = query.filters.maxProducts;
        }
      }

      if (query.query) {
        where.OR = [
          { name: { contains: query.query, mode: 'insensitive' } },
          { nameAr: { contains: query.query, mode: 'insensitive' } },
          { description: { contains: query.query, mode: 'insensitive' } }
        ];
      }

      const orderBy = query.sort 
        ? { [query.sort.field]: query.sort.order }
        : { productCount: 'desc' };

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          orderBy,
          take: query.limit || 20,
          skip: query.offset || 0,
          include: {
            stats: true
          }
        }),
        prisma.category.count({ where })
      ]);

      const documents = await Promise.all(
        categories.map(category => this.buildSearchDocument(category))
      );

      return {
        documents,
        total,
        facets: {
          levels: await this.getLevelFacets(where),
          productRanges: await this.getProductRangeFacets(where)
        },
        suggestions: []
      };
    } catch (error) {
      console.error('Fallback search error:', error);
      return {
        documents: [],
        total: 0,
        facets: { levels: [], productRanges: [] },
        suggestions: []
      };
    }
  }

  private async getLevelFacets(baseWhere: any): Promise<Array<{ value: number; count: number }>> {
    const levels = await prisma.category.groupBy({
      by: ['level'],
      where: baseWhere,
      _count: { id: true }
    });

    return levels.map(level => ({
      value: level.level,
      count: level._count.id
    }));
  }

  private async getProductRangeFacets(baseWhere: any): Promise<Array<{ range: string; count: number }>> {
    const ranges = [
      { name: '0-10', min: 0, max: 10 },
      { name: '11-50', min: 11, max: 50 },
      { name: '51-100', min: 51, max: 100 },
      { name: '101-500', min: 101, max: 500 },
      { name: '500+', min: 501, max: null }
    ];

    const facets = await Promise.all(
      ranges.map(async range => {
        const where = {
          ...baseWhere,
          productCount: {
            gte: range.min
          }
        };

        if (range.max) {
          where.productCount.lte = range.max;
        }

        const count = await prisma.category.count({ where });

        return {
          range: range.name,
          count
        };
      })
    );

    return facets.filter(facet => facet.count > 0);
  }

  async recordSearchQuery(query: string, userId?: string, results?: number): Promise<void> {
    try {
      await axios.post(`${this.searchServiceUrl}/api/analytics/record`, {
        index: this.indexName,
        query,
        userId,
        resultCount: results,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error recording search query:', error);
      // Don't throw - analytics shouldn't break the main flow
    }
  }

  async recordSearchClick(categoryId: string, query: string, userId?: string): Promise<void> {
    try {
      await axios.post(`${this.searchServiceUrl}/api/analytics/click`, {
        index: this.indexName,
        categoryId,
        query,
        userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error recording search click:', error);
      // Don't throw - analytics shouldn't break the main flow
    }
  }
}

export const searchIntegrationService = new SearchIntegrationService();
export default SearchIntegrationService;
