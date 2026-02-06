import { Injectable, Logger } from '@nestjs/common';
import { HybridRecommendationService, HybridRecommendation } from './algorithms/hybrid-recommendation.service';

export interface MatchRequest {
  buyerId: string;
  request: {
    categories?: string[];
    priceRange?: { min: number; max: number };
    locations?: string[];
    keywords?: string[];
  };
}

export interface MatchResult {
  sellerId: string;
  score: number;
  confidence: number;
  matchedFeatures: string[];
  reason: string;
}

export interface RecommendationResponse {
  success: boolean;
  totalMatches: number;
  recommendations: HybridRecommendation[];
  metadata: {
    algorithm: string;
    executionTime: number;
    cacheHit: boolean;
  };
}

/**
 * Main Recommendation Service
 * نقطة الدخول الرئيسية لخدمة التوصيات
 */
@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private hybridService: HybridRecommendationService) {}

  /**
   * Get personalized recommendations for a user
   * الحصول على توصيات مخصصة للمستخدم
   */
  async getPersonalizedRecommendations(
    userId: string,
    options?: { limit?: number },
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();
    
    try {
      const recommendations = await this.hybridService.getPersonalizedRecommendations(
        userId,
        'BUYER',
        options,
      );

      return {
        success: true,
        totalMatches: recommendations.length,
        recommendations,
        metadata: {
          algorithm: 'HYBRID_V1',
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting personalized recommendations: ${error.message}`);
      return {
        success: false,
        totalMatches: 0,
        recommendations: [],
        metadata: {
          algorithm: 'HYBRID_V1',
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    }
  }

  /**
   * Match buyer request with available sellers
   * مطابقة طلب المشتري مع البائعين المتاحين
   */
  async matchBuyerWithSellers(
    request: MatchRequest,
    sellerOffers: Array<{
      id: string;
      title: string;
      price?: number;
      categoryId?: number;
      city?: string;
      country?: string;
      sellerId: string;
    }>,
    options?: { limit?: number },
  ): Promise<{ success: boolean; matches: MatchResult[] }> {
    try {
      const recommendations = await this.hybridService.matchBuyerWithSellers(
        request.buyerId,
        request.request,
        sellerOffers,
        options,
      );

      const matches: MatchResult[] = recommendations.map((r) => ({
        sellerId: r.itemId,
        score: r.score,
        confidence: r.confidence,
        matchedFeatures: r.sources.contentBased?.score 
          ? ['الفئة', 'السعر', 'الموقع'].slice(0, Math.floor(r.sources.contentBased.score / 30))
          : [],
        reason: r.reason,
      }));

      return {
        success: true,
        matches,
      };
    } catch (error) {
      this.logger.error(`Error matching buyer with sellers: ${error.message}`);
      return {
        success: false,
        matches: [],
      };
    }
  }

  /**
   * Get similar listings to a given listing
   * الحصول على قوائم مشابهة لقائمة معينة
   */
  async getSimilarListings(
    userId: string,
    listingId: string,
    options?: { limit?: number },
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();

    try {
      const recommendations = await this.hybridService.getSimilarItemRecommendations(
        userId,
        listingId,
        options,
      );

      return {
        success: true,
        totalMatches: recommendations.length,
        recommendations,
        metadata: {
          algorithm: 'SIMILAR_ITEMS_V1',
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting similar listings: ${error.message}`);
      return {
        success: false,
        totalMatches: 0,
        recommendations: [],
        metadata: {
          algorithm: 'SIMILAR_ITEMS_V1',
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    }
  }

  /**
   * Get contextual recommendations based on location/time
   * الحصول على توصيات سياقية بناءً على الموقع/الوقت
   */
  async getContextualRecommendations(
    userId: string,
    context: {
      latitude: number;
      longitude: number;
      timeOfDay?: number;
      dayOfWeek?: number;
    },
    options?: { limit?: number },
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();

    try {
      const recommendations = await this.hybridService.getContextualRecommendations(
        userId,
        context,
        options,
      );

      return {
        success: true,
        totalMatches: recommendations.length,
        recommendations,
        metadata: {
          algorithm: 'CONTEXTUAL_V1',
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting contextual recommendations: ${error.message}`);
      return {
        success: false,
        totalMatches: 0,
        recommendations: [],
        metadata: {
          algorithm: 'CONTEXTUAL_V1',
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    }
  }

  /**
   * Record user interaction for learning
   * تسجيل تفاعل المستخدم للتعلم
   */
  async recordInteraction(
    userId: string,
    itemId: string,
    interactionType: 'VIEW' | 'BOOKING' | 'CANCEL' | 'RATING',
    rating?: number,
  ): Promise<{ success: boolean }> {
    try {
      await this.hybridService.recordInteraction(userId, itemId, interactionType, rating);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error recording interaction: ${error.message}`);
      return { success: false };
    }
  }

  /**
   * Get A/B test recommendations
   */
  async getABTestRecommendations(
    userId: string,
    testGroup: 'A' | 'B',
    options?: { limit?: number },
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();

    try {
      const recommendations = await this.hybridService.getABTestRecommendations(
        userId,
        testGroup,
        options,
      );

      return {
        success: true,
        totalMatches: recommendations.length,
        recommendations,
        metadata: {
          algorithm: `AB_TEST_${testGroup}`,
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting A/B test recommendations: ${error.message}`);
      return {
        success: false,
        totalMatches: 0,
        recommendations: [],
        metadata: {
          algorithm: `AB_TEST_${testGroup}`,
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    }
  }

  /**
   * Get trending items based on recent activity
   */
  async getTrendingItems(
    categoryId?: string,
    limit: number = 10,
  ): Promise<{ success: boolean; items: Array<{ itemId: string; score: number; reason: string }> }> {
    try {
      // Placeholder for trending logic
      // In production, this would query recent bookings/views
      const items = Array(limit).fill(null).map((_, i) => ({
        itemId: `trending_${i}`,
        score: 100 - i * 5,
        reason: 'مقتنيات شائعة هذه الأسبوع',
      }));

      return {
        success: true,
        items,
      };
    } catch (error) {
      this.logger.error(`Error getting trending items: ${error.message}`);
      return {
        success: false,
        items: [],
      };
    }
  }

  /**
   * Get price predictions for items
   */
  async getPricePredictions(
    items: Array<{ id: string; title: string; categoryId?: number }>,
  ): Promise<Array<{ itemId: string; predictedPrice: number; confidence: number }>> {
    try {
      // Placeholder for price prediction logic
      // In production, this would use ML model
      return items.map((item, i) => ({
        itemId: item.id,
        predictedPrice: 100 + i * 10,
        confidence: 0.8 - i * 0.05,
      }));
    } catch (error) {
      this.logger.error(`Error getting price predictions: ${error.message}`);
      return [];
    }
  }
}
