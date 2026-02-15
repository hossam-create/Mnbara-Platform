/**
 * Smart Search Service
 * Natural language understanding and intelligent product search
 */

import {
  SmartSearchResult,
  InterpretedQuery,
  SearchIntent,
  SearchEntity,
  EntityType,
  SearchFilter,
  SearchSuggestion,
  FilterOperator
} from '../types/ai-buyer.types';
import { logger } from '../utils/logger';

export class SmartSearchService {
  private isInitialized = false;

  // Entity extraction patterns
  private entityPatterns: Record<EntityType, RegExp> = {
    [EntityType.PRODUCT_NAME]: /\b(iphone|macbook|airpods|ipad|watch)\b/i,
    [EntityType.BRAND]: /\b(apple|samsung|sony|nike|adidas)\b/i,
    [EntityType.CATEGORY]: /\b(phone|laptop|camera|headphones|shoes|clothes)\b/i,
    [EntityType.PRICE_RANGE]: /\$\d+(-\d+)?/i,
    [EntityType.COLOR]: /\b(red|blue|black|white|green)\b/i,
    [EntityType.CONDITION]: /\b(new|used|like new|refurbished)\b/i,
    [EntityType.LOCATION]: /\bin\s+(\w+)|near\s+(\w+)/i,
    [EntityType.SIZE]: /\b(small|medium|large|xl|xxl)\b/i
  };

  // Popular searches
  private popularSearches: SearchSuggestion[] = [
    { type: 'popular', text: 'iPhone', confidence: 0.95 },
    { type: 'popular', text: 'MacBook', confidence: 0.92 },
    { type: 'popular', text: 'Samsung Galaxy', confidence: 0.89 },
    { type: 'popular', text: 'AirPods', confidence: 0.87 },
    { type: 'popular', text: 'Nike Shoes', confidence: 0.85 }
  ];

  /**
   * Initialize smart search service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Smart Search Service...');
      this.isInitialized = true;
      logger.info('Smart Search Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Smart Search Service:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return this.isInitialized;
  }

  /**
   * Process smart search request
   */
  async search(query: string): Promise<SmartSearchResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Smart search: "${query}"`);
      
      const interpretedQuery = this.interpretQuery(query);
      const entities = this.extractEntities(query);
      interpretedQuery.entities = entities;
      const filters = this.extractFilters(query);
      interpretedQuery.filters = filters;
      const suggestions = this.generateSuggestions(query, entities);
      
      const mockProducts = this.getMockProducts(interpretedQuery);
      
      const result: SmartSearchResult = {
        query,
        interpretedQuery,
        products: mockProducts,
        suggestions,
        relatedCategories: this.getRelatedCategories(entities),
        processingTimeMs: Date.now() - startTime
      };

      logger.info(`Search completed in ${result.processingTimeMs}ms`);
      
      return result;
    } catch (error) {
      logger.error('Smart search failed:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string, limit?: number): Promise<SearchSuggestion[]> {
    try {
      const matchingPopular = this.popularSearches.filter(s => 
        s.text.toLowerCase().includes(query.toLowerCase())
      );

      const completions = this.generateCompletions(query);
      const corrections = this.getCorrections(query);

      return [...matchingPopular, ...completions, ...corrections].slice(0, limit || 10);
    } catch (error) {
      logger.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Interpret natural language query
   */
  interpretQuery(query: string): InterpretedQuery {
    const normalized = query.trim().toLowerCase();
    
    let intent = SearchIntent.FIND_PRODUCT; // Default intent
    
    // Simple intent detection
    if (/compare/i.test(normalized)) {
      intent = SearchIntent.COMPARE_PRICES;
    } else if (/available|in stock/i.test(normalized)) {
      intent = SearchIntent.CHECK_AVAILABILITY;
    } else if (/similar|like|alternative/i.test(normalized)) {
      intent = SearchIntent.FIND_SIMILAR;
    } else if (/browse|show me|what's new/i.test(normalized)) {
      intent = SearchIntent.BROWSING;
    }

    return { original: query, normalized, intent, entities: [], filters: [] };
  }

  /**
   * Extract entities from query
   */
  extractEntities(query: string): SearchEntity[] {
    const entities: SearchEntity[] = [];

    for (const [type, pattern] of Object.entries(this.entityPatterns)) {
      const match = query.match(pattern);
      if (match) {
        entities.push({ type: type as EntityType, value: match[0], confidence: 0.9 });
      }
    }

    return entities;
  }

  /**
   * Extract filters from query
   */
  extractFilters(query: string): SearchFilter[] {
    const filters: SearchFilter[] = [];

    const priceMatch = query.match(/under\s+\$?(\d+)/i);
    if (priceMatch) {
      filters.push({ field: 'price', operator: FilterOperator.LT, value: parseFloat(priceMatch[1]) });
    }

    const priceMatch2 = query.match(/over\s+\$?(\d+)|above\s+\$?(\d+)/i);
    if (priceMatch2) {
      filters.push({ field: 'price', operator: FilterOperator.GT, value: parseFloat(priceMatch2[1]) });
    }

    if (/new\s+only|fresh/i.test(query)) {
      filters.push({ field: 'condition', operator: FilterOperator.EQUALS, value: 'NEW' });
    }

    return filters;
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string, entities: SearchEntity[]): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    if (query.length > 2) {
      suggestions.push({ type: 'completion', text: `${query} Pro`, confidence: 0.8 });
      suggestions.push({ type: 'completion', text: `${query} Ultra`, confidence: 0.75 });
    }

    const brands = entities.filter(e => e.type === EntityType.BRAND);
    if (brands.length === 0) {
      suggestions.push({ type: 'related', text: 'Apple products', confidence: 0.85 });
      suggestions.push({ type: 'related', text: 'Samsung products', confidence: 0.82 });
    }

    return suggestions;
  }

  /**
   * Generate query completions
   */
  private generateCompletions(query: string): SearchSuggestion[] {
    const completions: SearchSuggestion[] = [];
    const completionTerms = ['Pro Max', 'Ultra', 'Plus', 'Lite', 'SE', '2024'];
    const queryLower = query.toLowerCase();

    for (const term of completionTerms) {
      if (term.toLowerCase().startsWith(queryLower.slice(-3))) {
        completions.push({ type: 'completion', text: query + term.slice(queryLower.slice(-3).length), confidence: 0.7 });
      }
    }

    return completions;
  }

  /**
   * Get corrections for misspellings
   */
  private getCorrections(query: string): SearchSuggestion[] {
    const corrections: SearchSuggestion[] = [];
    const misspellings: Record<string, string> = {
      'iphon': 'iPhone', 'iphne': 'iPhone', 'macbok': 'MacBook',
      'galexy': 'Galaxy', 'headpones': 'Headphones'
    };

    for (const [misspelled, correct] of Object.entries(misspellings)) {
      if (query.toLowerCase().includes(misspelled)) {
        corrections.push({ type: 'correction', text: query.replace(new RegExp(misspelled, 'i'), correct), confidence: 0.9 });
      }
    }

    return corrections;
  }

  /**
   * Get related categories
   */
  private getRelatedCategories(entities: SearchEntity[]): string[] {
    const categories = new Set<string>();
    for (const entity of entities) {
      if (entity.type === EntityType.BRAND) categories.add('Electronics');
      if (entity.type === EntityType.CATEGORY && entity.value.match(/phone|computer/i)) {
        categories.add('Accessories');
        categories.add('Cases & Covers');
      }
    }
    return Array.from(categories);
  }

  /**
   * Get mock products for development
   */
  private getMockProducts(interpretedQuery: InterpretedQuery): any[] {
    return [
      {
        productId: 'mock-001',
        productName: `${interpretedQuery.normalized} - Premium Option`,
        matchScore: 0.95,
        price: 999,
        currency: 'USD',
        sellerName: 'Top Rated Seller',
        trustScore: 94,
        condition: 'NEW',
        category: 'Electronics',
        tags: ['premium', 'top-rated']
      },
      {
        productId: 'mock-002',
        productName: `${interpretedQuery.normalized} - Best Value`,
        matchScore: 0.87,
        price: 699,
        currency: 'USD',
        sellerName: 'Value Store',
        trustScore: 88,
        condition: 'NEW',
        category: 'Electronics',
        tags: ['value', 'popular']
      }
    ];
  }
}

export default SmartSearchService;
