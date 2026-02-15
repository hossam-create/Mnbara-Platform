/**
 * Product Matching Service
 * AI-powered product matching from image/voice/text queries
 */

import {
  ProductMatchResult,
  ProductMatch,
  ProductQuery,
  ProductCondition
} from '../types/ai-buyer.types';
import { logger } from '../utils/logger';

export class ProductMatchingService {
  private isInitialized = false;
  private productDatabase: ProductMatch[] = [];

  /**
   * Initialize product matching service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Product Matching Service...');
      this.initializeMockProducts();
      this.isInitialized = true;
      logger.info('Product Matching Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Product Matching Service:', error);
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
   * Match products based on query
   */
  async matchProducts(query: ProductQuery, limit?: number): Promise<ProductMatchResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Matching products for query: ${JSON.stringify(query)}`);
      
      let matches = this.productDatabase.filter(product => {
        return this.calculateMatchScore(product, query) > 0.3;
      });

      matches = matches.map(product => {
        const score = this.calculateMatchScore(product, query);
        const reasons = this.generateMatchReasons(product, query);
        return { ...product, matchScore: score, matchReasons: reasons };
      });

      matches.sort((a, b) => b.matchScore - a.matchScore);

      if (limit) {
        matches = matches.slice(0, limit);
      }

      const result: ProductMatchResult = {
        matches,
        totalMatches: matches.length,
        query,
        processingTimeMs: Date.now() - startTime
      };

      logger.info(`Found ${result.totalMatches} matches in ${result.processingTimeMs}ms`);
      
      return result;
    } catch (error) {
      logger.error('Product matching failed:', error);
      throw error;
    }
  }

  /**
   * Match products from image URL
   */
  async matchFromImage(imageUrl: string, extractedTags: string[]): Promise<ProductMatchResult> {
    const query: ProductQuery = {
      type: 'image',
      sourceImageUrl: imageUrl,
      extractedTags,
      extractedCategories: this.inferCategories(extractedTags),
      extractedColors: [],
      extractedAttributes: {}
    };
    return this.matchProducts(query, 20);
  }

  /**
   * Match products from voice transcript
   */
  async matchFromVoice(transcript: string, extractedTags: string[]): Promise<ProductMatchResult> {
    const query: ProductQuery = {
      type: 'voice',
      voiceTranscript: transcript,
      extractedTags,
      extractedCategories: this.inferCategories(extractedTags),
      extractedColors: [],
      extractedAttributes: {}
    };
    return this.matchProducts(query, 20);
  }

  /**
   * Calculate match score between product and query
   */
  private calculateMatchScore(product: ProductMatch, query: ProductQuery): number {
    let score = 0;

    const productTagsLower = product.tags.map(t => t.toLowerCase());
    const queryTagsLower = query.extractedTags.map(t => t.toLowerCase());
    
    const matchedTags = queryTagsLower.filter(tag => 
      productTagsLower.some(pt => pt.includes(tag) || tag.includes(pt))
    );
    
    if (queryTagsLower.length > 0) {
      score += (matchedTags.length / queryTagsLower.length) * 0.4;
    } else {
      score += 0.2;
    }

    const queryCategoriesLower = query.extractedCategories.map(c => c.toLowerCase());
    if (queryCategoriesLower.length > 0) {
      const categoryMatch = queryCategoriesLower.some(cat => 
        product.category.toLowerCase().includes(cat) || 
        cat.includes(product.category.toLowerCase())
      );
      if (categoryMatch) score += 0.3;
    } else {
      score += 0.1;
    }

    score += 0.2;
    score += (product.trustScore / 100) * 0.1;

    return Math.min(score, 1);
  }

  /**
   * Generate human-readable match reasons
   */
  private generateMatchReasons(product: ProductMatch, query: ProductQuery): string[] {
    const reasons: string[] = [];

    const productTagsLower = product.tags.map(t => t.toLowerCase());
    const queryTagsLower = query.extractedTags.map(t => t.toLowerCase());

    const matchedTags = queryTagsLower.filter(tag => 
      productTagsLower.some(pt => pt.includes(tag) || tag.includes(pt))
    );

    if (matchedTags.length > 0) {
      reasons.push(`Matches: ${matchedTags.join(', ')}`);
    }

    if (query.extractedCategories.some(cat => 
      product.category.toLowerCase().includes(cat.toLowerCase()))) {
      reasons.push(`Category: ${product.category}`);
    }

    if (product.trustScore >= 80) {
      reasons.push('Highly trusted seller');
    }

    if (product.condition === ProductCondition.LIKE_NEW || product.condition === ProductCondition.NEW) {
      reasons.push(`Condition: ${product.condition}`);
    }

    return reasons;
  }

  /**
   * Infer categories from tags
   */
  private inferCategories(tags: string[]): string[] {
    const categoryMappings: Record<string, string[]> = {
      'Electronics': ['smartphone', 'phone', 'laptop', 'computer', 'tablet', 'camera', 'tv', 'audio'],
      'Vehicles': ['car', 'motorcycle', 'bike', 'vehicle', 'truck'],
      'Clothing': ['shirt', 'pants', 'dress', 'jacket', 'shoes', 'clothing'],
      'Furniture': ['chair', 'table', 'sofa', 'bed', 'furniture', 'desk'],
      'Sports': ['ball', 'gym', 'sport', 'fitness', 'outdoor']
    };

    const inferred: string[] = [];
    const tagsLower = tags.map(t => t.toLowerCase());

    for (const [category, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(keyword => tagsLower.some(tag => tag.includes(keyword)))) {
        inferred.push(category);
      }
    }

    return inferred.length > 0 ? inferred : ['General'];
  }

  /**
   * Initialize mock product database
   */
  private initializeMockProducts(): void {
    this.productDatabase = [
      {
        productId: 'prod-001',
        productName: 'iPhone 14 Pro Max',
        matchScore: 0,
        matchReasons: [],
        price: 999,
        currency: 'USD',
        sellerId: 'seller-001',
        sellerName: 'TechStore Pro',
        trustScore: 95,
        location: { city: 'Cairo', country: 'Egypt' },
        condition: ProductCondition.NEW,
        category: 'Electronics',
        tags: ['smartphone', 'apple', 'iphone', 'mobile', 'phone', 'new']
      },
      {
        productId: 'prod-002',
        productName: 'Samsung Galaxy S23 Ultra',
        matchScore: 0,
        matchReasons: [],
        price: 899,
        currency: 'USD',
        sellerId: 'seller-002',
        sellerName: 'Mobile World',
        trustScore: 92,
        location: { city: 'Alexandria', country: 'Egypt' },
        condition: ProductCondition.NEW,
        category: 'Electronics',
        tags: ['smartphone', 'samsung', 'galaxy', 'mobile', 'phone', 'new']
      },
      {
        productId: 'prod-003',
        productName: 'MacBook Pro 16" M2',
        matchScore: 0,
        matchReasons: [],
        price: 2499,
        currency: 'USD',
        sellerId: 'seller-001',
        sellerName: 'TechStore Pro',
        trustScore: 95,
        location: { city: 'Cairo', country: 'Egypt' },
        condition: ProductCondition.NEW,
        category: 'Electronics',
        tags: ['laptop', 'macbook', 'apple', 'computer', 'pro']
      },
      {
        productId: 'prod-004',
        productName: 'Sony WH-1000XM5 Headphones',
        matchScore: 0,
        matchReasons: [],
        price: 349,
        currency: 'USD',
        sellerId: 'seller-003',
        sellerName: 'Audio Excellence',
        trustScore: 88,
        location: { city: 'Giza', country: 'Egypt' },
        condition: ProductCondition.NEW,
        category: 'Electronics',
        tags: ['headphones', 'audio', 'sony', 'wireless', 'noise-cancelling']
      }
    ];
  }
}

export default ProductMatchingService;
