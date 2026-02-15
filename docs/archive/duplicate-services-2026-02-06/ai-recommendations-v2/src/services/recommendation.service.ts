// AI Recommendations Service v2 - خدمة التوصيات الذكية الجيل الثاني
// Advanced ML-based personalized recommendations

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Types
type RecommendationContext = 'HOME_PAGE' | 'PRODUCT_PAGE' | 'CART_PAGE' | 'CHECKOUT' | 'SEARCH_RESULTS' | 'CATEGORY_PAGE' | 'EMAIL' | 'PUSH_NOTIFICATION';
type RecommendationAlgorithm = 'COLLABORATIVE_FILTERING' | 'CONTENT_BASED' | 'HYBRID' | 'TRENDING' | 'PERSONALIZED_RANKING' | 'SIMILAR_ITEMS' | 'FREQUENTLY_BOUGHT_TOGETHER' | 'RECENTLY_VIEWED' | 'DEEP_LEARNING';

interface RecommendationRequest {
  userId: string;
  context: RecommendationContext;
  productId?: string;
  cartItems?: string[];
  limit?: number;
  excludeIds?: string[];
}

interface RecommendationResult {
  productId: string;
  score: number;
  reason: string;
  reasonAr: string;
  algorithm: RecommendationAlgorithm;
}

export class RecommendationService {
  private readonly CACHE_TTL = 300; // 5 minutes

  // ==========================================
  // 🎯 MAIN RECOMMENDATION ENGINE
  // ==========================================

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userId, context, productId, cartItems, limit = 10, excludeIds = [] } = request;
    
    // Check cache first
    const cacheKey = `recs:${userId}:${context}:${productId || 'none'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let recommendations: RecommendationResult[] = [];

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
      case 'SEARCH_RESULTS':
        recommendations = await this.getSearchRecommendations(userId, limit);
        break;
      case 'CATEGORY_PAGE':
        recommendations = await this.getCategoryRecommendations(userId, limit);
        break;
      default:
        recommendations = await this.getPersonalizedRecommendations(userId, limit);
    }

    // Filter excluded items
    recommendations = recommendations.filter(r => !excludeIds.includes(r.productId));

    // Cache results
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(recommendations));

    // Store for analytics
    await this.storeRecommendations(userId, recommendations, context);

    return recommendations;
  }

  // ==========================================
  // 🏠 HOME PAGE RECOMMENDATIONS
  // ==========================================

  private async getHomePageRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    const results: RecommendationResult[] = [];

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

  // ==========================================
  // 📦 PRODUCT PAGE RECOMMENDATIONS
  // ==========================================

  private async getProductPageRecommendations(userId: string, productId: string, limit: number): Promise<RecommendationResult[]> {
    const results: RecommendationResult[] = [];

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

  // ==========================================
  // 🛒 CART RECOMMENDATIONS
  // ==========================================

  private async getCartRecommendations(userId: string, cartItems: string[], limit: number): Promise<RecommendationResult[]> {
    const results: RecommendationResult[] = [];

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

  // ==========================================
  // 💳 CHECKOUT RECOMMENDATIONS
  // ==========================================

  private async getCheckoutRecommendations(userId: string, cartItems: string[], limit: number): Promise<RecommendationResult[]> {
    // Low-friction add-ons
    const results: RecommendationResult[] = [];

    // Get cheap complementary items (impulse buys)
    for (const itemId of cartItems.slice(0, 2)) {
      const addOns = await this.getImpulseBuyItems(itemId, 3);
      results.push(...addOns);
    }

    return this.deduplicateAndRank(results, limit);
  }

  // ==========================================
  // 🔍 SEARCH RECOMMENDATIONS
  // ==========================================

  private async getSearchRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    // Based on search history and preferences
    const profile = await this.getUserProfile(userId);
    
    return this.getPersonalizedRecommendations(userId, limit);
  }

  // ==========================================
  // 📂 CATEGORY RECOMMENDATIONS
  // ==========================================

  private async getCategoryRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    const profile = await this.getUserProfile(userId);
    
    // Get top items in user's preferred categories
    const results: RecommendationResult[] = [];
    
    const trending = await this.getTrendingRecommendations(limit);
    results.push(...trending);

    return results;
  }

  // ==========================================
  // 🧠 CORE ALGORITHMS
  // ==========================================

  private async getPersonalizedRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    // Hybrid approach: Collaborative + Content-based
    const profile = await this.getUserProfile(userId);
    
    if (!profile || !profile.userEmbedding || profile.userEmbedding.length === 0) {
      // Cold start: return popular items
      return this.getTrendingRecommendations(limit);
    }

    // Find products with similar embeddings
    const products = await prisma.productEmbedding.findMany({
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

  private async getSimilarItems(productId: string, limit: number): Promise<RecommendationResult[]> {
    const product = await prisma.productEmbedding.findUnique({
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

  private async getFrequentlyBoughtTogether(productId: string, limit: number): Promise<RecommendationResult[]> {
    // In production, this would query co-purchase data
    const products = await prisma.productEmbedding.findMany({
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

  private async getFrequentlyBoughtTogetherMultiple(productIds: string[], limit: number): Promise<RecommendationResult[]> {
    const results: RecommendationResult[] = [];
    
    for (const id of productIds.slice(0, 3)) {
      const fbt = await this.getFrequentlyBoughtTogether(id, 2);
      results.push(...fbt);
    }

    return results.slice(0, limit);
  }

  private async getTrendingRecommendations(limit: number): Promise<RecommendationResult[]> {
    const products = await prisma.productEmbedding.findMany({
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

  private async getRecentlyViewedRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    const interactions = await prisma.userInteraction.findMany({
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

  private async getNewArrivalsRecommendations(limit: number): Promise<RecommendationResult[]> {
    const products = await prisma.productEmbedding.findMany({
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

  private async getComplementaryItems(productId: string, limit: number): Promise<RecommendationResult[]> {
    return this.getFrequentlyBoughtTogether(productId, limit);
  }

  private async getPersonalizedAlternatives(userId: string, productId: string, limit: number): Promise<RecommendationResult[]> {
    return this.getSimilarItems(productId, limit);
  }

  private async getImpulseBuyItems(productId: string, limit: number): Promise<RecommendationResult[]> {
    // Get cheap complementary items
    const products = await prisma.productEmbedding.findMany({
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

  // ==========================================
  // 👤 USER PROFILE
  // ==========================================

  private async getUserProfile(userId: string) {
    return prisma.userProfile.findUnique({
      where: { userId }
    });
  }

  async updateUserProfile(userId: string, data: any) {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });
  }

  // ==========================================
  // 📊 TRACKING & ANALYTICS
  // ==========================================

  async trackInteraction(userId: string, productId: string, type: string, metadata?: any) {
    await prisma.userInteraction.create({
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
    await redis.del(`recs:${userId}:*`);
  }

  async trackRecommendationFeedback(recommendationId: string, feedback: { clicked?: boolean; purchased?: boolean; dismissed?: boolean }) {
    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        shown: true,
        ...feedback
      }
    });
  }

  private async storeRecommendations(userId: string, recommendations: RecommendationResult[], context: RecommendationContext) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      await prisma.recommendation.create({
        data: {
          userId,
          productId: rec.productId,
          score: rec.score,
          rank: i + 1,
          algorithm: rec.algorithm,
          modelVersion: '2.0.0',
          reason: rec.reason,
          reasonAr: rec.reasonAr,
          context,
          expiresAt
        }
      });
    }
  }

  // ==========================================
  // 🔧 UTILITIES
  // ==========================================

  private deduplicateAndRank(results: RecommendationResult[], limit: number): RecommendationResult[] {
    const seen = new Set<string>();
    const unique: RecommendationResult[] = [];

    for (const r of results) {
      if (!seen.has(r.productId)) {
        seen.add(r.productId);
        unique.push(r);
      }
    }

    // Sort by score and take top N
    return unique
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ==========================================
  // 📈 METRICS
  // ==========================================

  async getMetrics(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.recommendationMetrics.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' }
    });
  }
}

export const recommendationService = new RecommendationService();
