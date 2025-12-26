// Recommendation Service - Gen 10 AI Personalized Recommendations
// خدمة التوصيات الشخصية - الجيل العاشر

import { PrismaClient, RecommendationType } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ProductData {
  id: string;
  name: string;
  nameAr?: string;
  category: string;
  price: number;
  rating: number;
  sales: number;
  tags: string[];
}

interface UserBehavior {
  viewedProducts: string[];
  purchasedProducts: string[];
  searchHistory: string[];
  categories: string[];
  priceRange: { min: number; max: number };
}

export class RecommendationService {
  // Get personalized recommendations
  async getPersonalizedRecommendations(userId: string, limit = 20) {
    // Get or create user profile
    let profile = await prisma.aIUserProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      profile = await this.createUserProfile(userId);
    }

    // Calculate recommendation scores
    const recommendations = await this.calculateRecommendations(profile, limit);

    // Save recommendations
    const saved = await prisma.aIRecommendation.create({
      data: {
        userId,
        type: 'PERSONALIZED',
        items: recommendations,
        relevanceScore: this.calculateRelevanceScore(recommendations),
        personalScore: this.calculatePersonalScore(profile),
        trendScore: await this.calculateTrendScore(recommendations)
      }
    });

    return {
      id: saved.id,
      recommendations,
      reason: 'Based on your browsing history and preferences',
      reasonAr: 'بناءً على سجل التصفح والتفضيلات الخاصة بك'
    };
  }

  // Get similar products
  async getSimilarProducts(productId: string, limit = 10) {
    // In production, this would use vector embeddings
    const similarProducts = await this.findSimilarByFeatures(productId, limit);

    return {
      productId,
      similar: similarProducts,
      reason: 'Products similar to what you viewed',
      reasonAr: 'منتجات مشابهة لما شاهدته'
    };
  }

  // Get complementary products (frequently bought together)
  async getComplementaryProducts(productId: string, limit = 5) {
    const complementary = await this.findComplementaryProducts(productId, limit);

    return {
      productId,
      complementary,
      reason: 'Frequently bought together',
      reasonAr: 'يتم شراؤها معاً بشكل متكرر'
    };
  }

  // Get trending products
  async getTrendingProducts(category?: string, region?: string, limit = 20) {
    const trending = await this.calculateTrendingProducts(category, region, limit);

    const saved = await prisma.aIRecommendation.create({
      data: {
        userId: 'system',
        type: 'TRENDING',
        items: trending,
        relevanceScore: 0.9,
        personalScore: 0,
        trendScore: 1.0,
        context: { category, region }
      }
    });

    return {
      id: saved.id,
      trending,
      reason: category ? `Trending in ${category}` : 'Trending now',
      reasonAr: category ? `الأكثر رواجاً في ${category}` : 'الأكثر رواجاً الآن'
    };
  }

  // Get deals and offers
  async getDeals(userId: string, limit = 10) {
    const profile = await prisma.aIUserProfile.findUnique({
      where: { userId }
    });

    const deals = await this.findRelevantDeals(profile, limit);

    return {
      deals,
      reason: 'Deals matching your interests',
      reasonAr: 'عروض تتناسب مع اهتماماتك'
    };
  }

  // Update user profile based on behavior
  async updateUserProfile(userId: string, behavior: Partial<UserBehavior>) {
    const profile = await prisma.aIUserProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return this.createUserProfile(userId, behavior);
    }

    const currentPreferences = profile.preferences as any || {};
    const currentBrowsing = profile.browsingPattern as any || {};
    const currentPurchase = profile.purchasePattern as any || {};

    // Merge behavior data
    const updatedProfile = await prisma.aIUserProfile.update({
      where: { userId },
      data: {
        preferences: {
          ...currentPreferences,
          categories: [...new Set([...(currentPreferences.categories || []), ...(behavior.categories || [])])]
        },
        browsingPattern: {
          ...currentBrowsing,
          recentViews: [...(behavior.viewedProducts || []), ...(currentBrowsing.recentViews || [])].slice(0, 100)
        },
        purchasePattern: {
          ...currentPurchase,
          recentPurchases: [...(behavior.purchasedProducts || []), ...(currentPurchase.recentPurchases || [])].slice(0, 50)
        },
        searchHistory: [...new Set([...(behavior.searchHistory || []), ...profile.searchHistory])].slice(0, 100),
        engagementScore: this.calculateEngagementScore(behavior),
        updatedAt: new Date()
      }
    });

    return updatedProfile;
  }


  // Create new user profile
  private async createUserProfile(userId: string, behavior?: Partial<UserBehavior>) {
    return prisma.aIUserProfile.create({
      data: {
        userId,
        preferences: {
          categories: behavior?.categories || [],
          priceRange: behavior?.priceRange || { min: 0, max: 10000 }
        },
        browsingPattern: {
          recentViews: behavior?.viewedProducts || []
        },
        purchasePattern: {
          recentPurchases: behavior?.purchasedProducts || []
        },
        searchHistory: behavior?.searchHistory || [],
        segments: ['new_user'],
        engagementScore: 0,
        loyaltyScore: 0,
        lifetimeValue: 0,
        churnRisk: 0.5
      }
    });
  }

  // Calculate recommendations based on profile
  private async calculateRecommendations(profile: any, limit: number) {
    const preferences = profile.preferences as any || {};
    const browsingPattern = profile.browsingPattern as any || {};
    
    // Scoring factors
    const categoryWeight = 0.3;
    const viewHistoryWeight = 0.25;
    const purchaseHistoryWeight = 0.2;
    const trendWeight = 0.15;
    const ratingWeight = 0.1;

    // Mock product scoring (in production, this would query actual products)
    const recommendations = [];
    
    // Generate recommendations based on categories
    const categories = preferences.categories || [];
    for (const category of categories.slice(0, 5)) {
      recommendations.push({
        type: 'category_based',
        category,
        score: categoryWeight,
        reason: `Based on your interest in ${category}`,
        reasonAr: `بناءً على اهتمامك بـ ${category}`
      });
    }

    // Add view-based recommendations
    const recentViews = browsingPattern.recentViews || [];
    for (const productId of recentViews.slice(0, 5)) {
      recommendations.push({
        type: 'view_based',
        productId,
        score: viewHistoryWeight,
        reason: 'Similar to recently viewed',
        reasonAr: 'مشابه لما شاهدته مؤخراً'
      });
    }

    return recommendations.slice(0, limit);
  }

  // Find similar products by features
  private async findSimilarByFeatures(productId: string, limit: number) {
    // In production, use vector similarity search
    return [
      { productId: `similar_${productId}_1`, similarity: 0.95 },
      { productId: `similar_${productId}_2`, similarity: 0.89 },
      { productId: `similar_${productId}_3`, similarity: 0.85 }
    ].slice(0, limit);
  }

  // Find complementary products
  private async findComplementaryProducts(productId: string, limit: number) {
    // In production, analyze purchase patterns
    return [
      { productId: `comp_${productId}_1`, frequency: 0.45 },
      { productId: `comp_${productId}_2`, frequency: 0.32 }
    ].slice(0, limit);
  }

  // Calculate trending products
  private async calculateTrendingProducts(category?: string, region?: string, limit?: number) {
    // In production, analyze real-time sales and views
    const trending = [
      { productId: 'trending_1', trendScore: 0.98, velocity: 150 },
      { productId: 'trending_2', trendScore: 0.95, velocity: 120 },
      { productId: 'trending_3', trendScore: 0.92, velocity: 100 }
    ];

    return trending.slice(0, limit || 20);
  }

  // Find relevant deals
  private async findRelevantDeals(profile: any, limit: number) {
    const preferences = profile?.preferences as any || {};
    const categories = preferences.categories || [];

    return [
      { dealId: 'deal_1', discount: 30, category: categories[0] || 'electronics' },
      { dealId: 'deal_2', discount: 25, category: categories[1] || 'fashion' }
    ].slice(0, limit);
  }

  // Calculate relevance score
  private calculateRelevanceScore(recommendations: any[]): number {
    if (!recommendations.length) return 0;
    const scores = recommendations.map(r => r.score || 0.5);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  // Calculate personal score
  private calculatePersonalScore(profile: any): number {
    const preferences = profile?.preferences as any || {};
    const hasCategories = (preferences.categories?.length || 0) > 0;
    const hasHistory = (profile?.searchHistory?.length || 0) > 0;
    
    let score = 0.5;
    if (hasCategories) score += 0.25;
    if (hasHistory) score += 0.25;
    
    return Math.min(score, 1);
  }

  // Calculate trend score
  private async calculateTrendScore(recommendations: any[]): Promise<number> {
    // In production, compare with trending data
    return 0.7;
  }

  // Calculate engagement score
  private calculateEngagementScore(behavior: Partial<UserBehavior>): number {
    let score = 0;
    if (behavior.viewedProducts?.length) score += Math.min(behavior.viewedProducts.length * 0.01, 0.3);
    if (behavior.purchasedProducts?.length) score += Math.min(behavior.purchasedProducts.length * 0.05, 0.4);
    if (behavior.searchHistory?.length) score += Math.min(behavior.searchHistory.length * 0.02, 0.3);
    return Math.min(score, 1);
  }

  // Track recommendation interaction
  async trackInteraction(recommendationId: string, action: 'view' | 'click' | 'purchase') {
    const updateData: any = {};
    
    if (action === 'view') {
      updateData.viewed = true;
      updateData.viewedAt = new Date();
    } else if (action === 'click') {
      updateData.clicked = true;
      updateData.clickedAt = new Date();
    } else if (action === 'purchase') {
      updateData.purchased = true;
      updateData.purchasedAt = new Date();
    }

    return prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: updateData
    });
  }

  // Get recommendation analytics
  async getRecommendationAnalytics(userId?: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = { createdAt: { gte: startDate } };
    if (userId) where.userId = userId;

    const recommendations = await prisma.aIRecommendation.findMany({ where });

    const total = recommendations.length;
    const viewed = recommendations.filter(r => r.viewed).length;
    const clicked = recommendations.filter(r => r.clicked).length;
    const purchased = recommendations.filter(r => r.purchased).length;

    return {
      total,
      viewed,
      clicked,
      purchased,
      viewRate: total ? (viewed / total * 100).toFixed(2) : 0,
      clickRate: total ? (clicked / total * 100).toFixed(2) : 0,
      conversionRate: total ? (purchased / total * 100).toFixed(2) : 0
    };
  }
}

export const recommendationService = new RecommendationService();
