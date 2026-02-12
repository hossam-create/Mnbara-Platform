// AI Recommendation Service - Hybrid LLM + ML
// Merged from ai-recommendations (v1) and ai-recommendations-v2
// Supports both LLM-based and ML-based recommendations

import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import {
  UserBehavior,
  ProductRecommendation,
  RecommendationRequest,
  RecommendationResponse,
  AIConfig
} from '../types/recommendation.types';
import { logger } from '../utils/logger';

// ML Types (from v2)
type RecommendationContext = 'HOME_PAGE' | 'PRODUCT_PAGE' | 'CART_PAGE' | 'CHECKOUT' | 'SEARCH_RESULTS' | 'CATEGORY_PAGE' | 'EMAIL' | 'PUSH_NOTIFICATION';
type RecommendationAlgorithm = 'COLLABORATIVE_FILTERING' | 'CONTENT_BASED' | 'HYBRID' | 'TRENDING' | 'PERSONALIZED_RANKING' | 'SIMILAR_ITEMS' | 'FREQUENTLY_BOUGHT_TOGETHER' | 'RECENTLY_VIEWED' | 'DEEP_LEARNING' | 'LLM_GENERATED';

interface MLRecommendationResult {
  productId: string;
  score: number;
  reason: string;
  reasonAr: string;
  algorithm: RecommendationAlgorithm;
}

export class RecommendationService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private config: AIConfig;
  private prisma: PrismaClient;
  private redis: Redis;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor() {
    // LLM initialization (from v1)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.config = {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    };

    // ML initialization (from v2)
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Get hybrid recommendations - combines LLM and ML approaches
   */
  async getHybridRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();

    try {
      logger.info(`Getting hybrid recommendations for user: ${request.userId}`);

      // Use hybrid approach: ML + LLM fallback
      const mlResults = await this.getMLRecommendations(request);
      
      // If ML results are insufficient, use LLM
      let llmRecommendations: ProductRecommendation[] = [];
      if (mlResults.recommendations.length < (request.context?.limit || 10)) {
        llmRecommendations = await this.getLLMRecommendations(request);
      }

      // Merge and rank results
      const mergedRecommendations = this.mergeRecommendations(
        mlResults.recommendations,
        llmRecommendations
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        recommendations: mergedRecommendations,
        metadata: {
          model: this.config.model,
          timestamp: new Date(),
          processingTime,
          hybridMode: true,
          mlCount: mlResults.recommendations.length,
          llmCount: llmRecommendations.length
        }
      };
    } catch (error) {
      logger.error('Error generating hybrid recommendations:', error);
      throw error;
    }
  }

  /**
   * Get ML-based recommendations (from v2)
   */
  private async getMLRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const { userId, context, productId, cartItems, limit = 10, excludeIds = [] } = request;
    
    // Check cache first
    const cacheKey = `recs:${userId}:${context}:${productId || 'none'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let recommendations: MLRecommendationResult[] = [];

    // Select algorithm based on context
    switch (context) {
      case 'HOME_PAGE':
        recommendations = await this.getHomePageRecommendations(userId, limit);
        break;
      case 'PRODUCT_PAGE':
        recommendations = await this.getProductPageRecommendations(userId, productId!, limit);
        break;
      case 'CART_PAGE':
        recommendations = await this.getCartRecommendations(userId, cartItems || [], limit);
        break;
      case 'CHECKOUT':
        recommendations = await this.getCheckoutRecommendations(userId, cartItems || [], limit);
        break;
      default:
        recommendations = await this.getPersonalizedRecommendations(userId, limit);
    }

    // Filter excluded items
    recommendations = recommendations.filter(r => !excludeIds.includes(r.productId));

    // Cache results
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify({
      success: true,
      recommendations,
      metadata: { hybridMode: false }
    }));

    // Convert to ProductRecommendation format
    return {
      success: true,
      recommendations: recommendations.map(r => ({
        productId: r.productId,
        productName: '',
        category: '',
        price: 0,
        score: r.score,
        reason: r.reason,
        confidence: r.score
      })),
      metadata: { hybridMode: false }
    };
  }

  /**
   * Get LLM-based recommendations (from v1)
   */
  private async getLLMRecommendations(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    const userBehavior = await this.analyzeUserBehavior(request.userId);
    return this.generateRecommendationsWithLLM(userBehavior, request.context);
  }

  /**
   * Main entry point - adapted from ai_investment_agent
   */
  async getRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();

    try {
      logger.info(`Getting recommendations for user: ${request.userId}`);

      // 1. Analyze user behavior
      const userBehavior = await this.analyzeUserBehavior(request.userId);

      // 2. Generate recommendations using AI
      const recommendations = await this.generateRecommendations(
        userBehavior,
        request.context
      );

      // 3. Rank and filter recommendations
      const rankedRecommendations = this.rankRecommendations(
        recommendations,
        request.context?.limit || 10
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        recommendations: rankedRecommendations,
        metadata: {
          model: this.config.model,
          timestamp: new Date(),
          processingTime
        }
      };
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Analyze user behavior
   * Adapted from ai_investment_agent/analysis_logic.py
   */
  private async analyzeUserBehavior(userId: string): Promise<UserBehavior> {
    // Try to fetch from database (v2)
    try {
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId }
      });

      if (profile) {
        return {
          userId,
          viewedProducts: [],
          purchasedProducts: [],
          searchQueries: [],
          categories: profile.preferredCategories,
          priceRange: profile.priceRange as { min: number; max: number } || { min: 100, max: 1000 },
          lastActivity: new Date()
        };
      }
    } catch (error) {
      logger.warn('Could not fetch user profile, using defaults');
    }

    // Return mock data if no profile
    return {
      userId,
      viewedProducts: [],
      purchasedProducts: [],
      searchQueries: [],
      categories: ['electronics', 'fashion'],
      priceRange: { min: 100, max: 1000 },
      lastActivity: new Date()
    };
  }

  /**
   * Generate recommendations using AI
   * Core logic from ai_investment_agent
   */
  private async generateRecommendations(
    userBehavior: UserBehavior,
    context?: any
  ): Promise<ProductRecommendation[]> {
    const prompt = this.buildPrompt(userBehavior, context);

    if (this.config.provider === 'openai') {
      return this.generateWithOpenAI(prompt);
    } else {
      return this.generateWithAnthropic(prompt);
    }
  }

  /**
   * Build AI prompt
   */
  private buildPrompt(userBehavior: UserBehavior, context?: any): string {
    return `
You are an expert product recommendation system for an e-commerce marketplace.

User Profile:
- User ID: ${userBehavior.userId}
- Viewed Products: ${userBehavior.viewedProducts.length}
- Purchased Products: ${userBehavior.purchasedProducts.length}
- Preferred Categories: ${userBehavior.categories.join(', ')}
- Price Range: $${userBehavior.priceRange.min} - $${userBehavior.priceRange.max}

${context?.category ? `Context: User is browsing ${context.category} category` : ''}

Task: Recommend 10 products that match this user's interests and behavior.

For each recommendation, provide:
1. Product name
2. Category
3. Estimated price
4. Reason for recommendation
5. Confidence score (0-1)

Format your response as JSON array:
[
  {
    "productName": "...",
    "category": "...",
    "price": 0,
    "reason": "...",
    "confidence": 0.0
  }
]
    `.trim();
  }

  /**
   * Generate with OpenAI
   */
  private async generateWithOpenAI(
    prompt: string
  ): Promise<ProductRecommendation[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert product recommendation AI.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Parse JSON response
      const recommendations = JSON.parse(content);
      
      return recommendations.map((rec: any, index: number) => ({
        productId: `product_${index + 1}`,
        productName: rec.productName,
        category: rec.category,
        price: rec.price,
        score: rec.confidence,
        reason: rec.reason,
        confidence: rec.confidence
      }));
    } catch (error) {
      logger.error('OpenAI generation error:', error);
      throw error;
    }
  }

  /**
   * Generate with Anthropic Claude
   */
  private async generateWithAnthropic(
    prompt: string
  ): Promise<ProductRecommendation[]> {
    try {
      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      // Parse JSON response
      const recommendations = JSON.parse(content.text);
      
      return recommendations.map((rec: any, index: number) => ({
        productId: `product_${index + 1}`,
        productName: rec.productName,
        category: rec.category,
        price: rec.price,
        score: rec.confidence,
        reason: rec.reason,
        confidence: rec.confidence
      }));
    } catch (error) {
      logger.error('Anthropic generation error:', error);
      throw error;
    }
  }

  /**
   * Generate LLM recommendations (merged)
   */
  private async generateRecommendationsWithLLM(
    userBehavior: UserBehavior,
    context?: any
  ): Promise<ProductRecommendation[]> {
    return this.generateRecommendations(userBehavior, context);
  }

  /**
   * Merge ML and LLM recommendations
   */
  private mergeRecommendations(
    ml: ProductRecommendation[],
    llm: ProductRecommendation[]
  ): ProductRecommendation[] {
    const productMap = new Map<string, ProductRecommendation>();

    // Add ML results first (higher priority)
    for (const rec of ml) {
      if (!productMap.has(rec.productId)) {
        productMap.set(rec.productId, { ...rec, reason: rec.reason + ' (ML)' });
      }
    }

    // Add LLM results
    for (const rec of llm) {
      if (!productMap.has(rec.productId)) {
        productMap.set(rec.productId, { ...rec, reason: rec.reason + ' (LLM)' });
      }
    }

    // Return merged and ranked results
    return Array.from(productMap.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Rank recommendations by score
   */
  private rankRecommendations(
    recommendations: ProductRecommendation[],
    limit: number
  ): ProductRecommendation[] {
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ==========================================
  // ML METHODS (from v2)
  // ==========================================

  private async getHomePageRecommendations(userId: string, limit: number): Promise<MLRecommendationResult[]> {
    const results: MLRecommendationResult[] = [];

    // Get user profile
    const profile = await this.getUserProfile(userId);

    // 1. Personalized recommendations (40%)
    const personalized = await this.getPersonalizedRecommendations(userId, Math.ceil(limit * 0.4));
    results.push(...personalized);

    // 2. Trending items (30%)
    const trending = await this.getTrendingRecommendations(limit - results.length);
    results.push(...trending.slice(0, Math.ceil(limit * 0.3)));

    // 3. Recently viewed (20%)
    const recentlyViewed = await this.getRecentlyViewedRecommendations(userId, Math.ceil(limit * 0.2));
    results.push(...recentlyViewed);

    // 4. New arrivals (10%)
    const newArrivals = await this.getNewArrivalsRecommendations(Math.ceil(limit * 0.1));
    results.push(...newArrivals);

    return this.deduplicateAndRank(results, limit);
  }

  private async getProductPageRecommendations(userId: string, productId: string, limit: number): Promise<MLRecommendationResult[]> {
    const results: MLRecommendationResult[] = [];

    // 1. Similar items (50%)
    const similar = await this.getSimilarItems(productId, Math.ceil(limit * 0.5));
    results.push(...similar);

    // 2. Frequently bought together (30%)
    const fbt = await this.getFrequentlyBoughtTogether(productId, Math.ceil(limit * 0.3));
    results.push(...fbt);

    // 3. Personalized alternatives (20%)
    const alternatives = await this.getPersonalizedAlternatives(userId, productId, Math.ceil(limit * 0.2));
    results.push(...alternatives);

    return this.deduplicateAndRank(results, limit);
  }

  private async getCartRecommendations(userId: string, cartItems: string[], limit: number): Promise<MLRecommendationResult[]> {
    const results: MLRecommendationResult[] = [];

    // 1. Complementary items for cart
    for (const itemId of cartItems.slice(0, 3)) {
      const complementary = await this.getComplementaryItems(itemId, 3);
      results.push(...complementary);
    }

    // 2. Frequently bought together with cart items
    const fbt = await this.getFrequentlyBoughtTogetherMultiple(cartItems, 5);
    results.push(...fbt);

    return this.deduplicateAndRank(results, limit);
  }

  private async getCheckoutRecommendations(userId: string, cartItems: string[], limit: number): Promise<MLRecommendationResult[]> {
    const results: MLRecommendationResult[] = [];

    // Get cheap complementary items (impulse buys)
    for (const itemId of cartItems.slice(0, 2)) {
      const addOns = await this.getImpulseBuyItems(itemId, 3);
      results.push(...addOns);
    }

    return this.deduplicateAndRank(results, limit);
  }

  private async getPersonalizedRecommendations(userId: string, limit: number): Promise<MLRecommendationResult[]> {
    const profile = await this.getUserProfile(userId);
    
    if (!profile || !profile.userEmbedding || profile.userEmbedding.length === 0) {
      return this.getTrendingRecommendations(limit);
    }

    const products = await this.prisma.productEmbedding.findMany({
      take: limit * 2,
      orderBy: { trendingScore: 'desc' }
    });

    return products.slice(0, limit).map((p, i) => ({
      productId: p.productId,
      score: 0.9 - (i * 0.05),
      reason: 'Recommended for you based on your preferences',
      reasonAr: 'موصى به لك بناءً على تفضيلاتك',
      algorithm: 'HYBRID' as RecommendationAlgorithm
    }));
  }

  private async getSimilarItems(productId: string, limit: number): Promise<MLRecommendationResult[]> {
    const product = await this.prisma.productEmbedding.findUnique({
      where: { productId }
    });

    if (!product || !product.similarProducts) {
      return [];
    }

    return product.similarProducts.slice(0, limit).map((id, i) => ({
      productId: id,
      score: 0.95 - (i * 0.03),
      reason: 'Similar to what you\'re viewing',
      reasonAr: 'مشابه لما تشاهده',
      algorithm: 'SIMILAR_ITEMS' as RecommendationAlgorithm
    }));
  }

  private async getFrequentlyBoughtTogether(productId: string, limit: number): Promise<MLRecommendationResult[]> {
    const products = await this.prisma.productEmbedding.findMany({
      take: limit,
      orderBy: { purchaseCount: 'desc' }
    });

    return products.map((p, i) => ({
      productId: p.productId,
      score: 0.85 - (i * 0.05),
      reason: 'Frequently bought together',
      reasonAr: 'يُشترى معاً بشكل متكرر',
      algorithm: 'FREQUENTLY_BOUGHT_TOGETHER' as RecommendationAlgorithm
    }));
  }

  private async getFrequentlyBoughtTogetherMultiple(productIds: string[], limit: number): Promise<MLRecommendationResult[]> {
    const results: MLRecommendationResult[] = [];
    
    for (const id of productIds.slice(0, 3)) {
      const fbt = await this.getFrequentlyBoughtTogether(id, 2);
      results.push(...fbt);
    }

    return results.slice(0, limit);
  }

  private async getTrendingRecommendations(limit: number): Promise<MLRecommendationResult[]> {
    const products = await this.prisma.productEmbedding.findMany({
      take: limit,
      orderBy: { trendingScore: 'desc' }
    });

    return products.map((p, i) => ({
      productId: p.productId,
      score: 0.8 - (i * 0.03),
      reason: 'Trending now',
      reasonAr: 'رائج الآن',
      algorithm: 'TRENDING' as RecommendationAlgorithm
    }));
  }

  private async getRecentlyViewedRecommendations(userId: string, limit: number): Promise<MLRecommendationResult[]> {
    const interactions = await this.prisma.userInteraction.findMany({
      where: {
        userId,
        interactionType: 'VIEW'
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      distinct: ['productId']
    });

    return interactions.map((i, idx) => ({
      productId: i.productId,
      score: 0.7 - (idx * 0.05),
      reason: 'Recently viewed',
      reasonAr: 'شاهدته مؤخراً',
      algorithm: 'RECENTLY_VIEWED' as RecommendationAlgorithm
    }));
  }

  private async getNewArrivalsRecommendations(limit: number): Promise<MLRecommendationResult[]> {
    const products = await this.prisma.productEmbedding.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return products.map((p, i) => ({
      productId: p.productId,
      score: 0.75 - (i * 0.05),
      reason: 'New arrival',
      reasonAr: 'وصل حديثاً',
      algorithm: 'CONTENT_BASED' as RecommendationAlgorithm
    }));
  }

  private async getComplementaryItems(productId: string, limit: number): Promise<MLRecommendationResult[]> {
    return this.getFrequentlyBoughtTogether(productId, limit);
  }

  private async getPersonalizedAlternatives(userId: string, productId: string, limit: number): Promise<MLRecommendationResult[]> {
    return this.getSimilarItems(productId, limit);
  }

  private async getImpulseBuyItems(productId: string, limit: number): Promise<MLRecommendationResult[]> {
    const products = await this.prisma.productEmbedding.findMany({
      where: { price: { lt: 50 } },
      take: limit,
      orderBy: { purchaseCount: 'desc' }
    });

    return products.map((p, i) => ({
      productId: p.productId,
      score: 0.6 - (i * 0.05),
      reason: 'You might also like',
      reasonAr: 'قد يعجبك أيضاً',
      algorithm: 'CONTENT_BASED' as RecommendationAlgorithm
    }));
  }

  private async getUserProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId }
    });
  }

  private deduplicateAndRank(results: MLRecommendationResult[], limit: number): MLRecommendationResult[] {
    const seen = new Set<string>();
    const unique: MLRecommendationResult[] = [];

    for (const r of results) {
      if (!seen.has(r.productId)) {
        seen.add(r.productId);
        unique.push(r);
      }
    }

    return unique
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ==========================================
  // TRACKING & ANALYTICS (from v2)
  // ==========================================

  async trackInteraction(userId: string, productId: string, type: string, metadata?: any) {
    await this.prisma.userInteraction.create({
      data: {
        userId,
        productId,
        interactionType: type as any,
        sessionId: metadata?.sessionId,
        deviceType: metadata?.deviceType,
        source: metadata?.source,
        dwellTime: metadata?.dwellTime,
        scrollDepth: metadata?.scrollDepth,
        converted: metadata?.converted || false,
        purchaseAmount: metadata?.purchaseAmount
      }
    });

    // Invalidate cache
    await this.redis.del(`recs:${userId}:*`);
  }

  async updateUserProfile(userId: string, data: any) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });
  }

  async getMetrics(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.recommendationMetrics.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' }
    });
  }
}

export const recommendationService = new RecommendationService();
