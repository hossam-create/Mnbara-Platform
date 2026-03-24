import { Injectable, Logger } from '@nestjs/common';
import { CollaborativeFilteringService } from './collaborative-filtering.service';
import { ContentBasedService } from './content-based.service';
import { CacheService } from '../../common/cache/cache.service';

export interface HybridRecommendation {
  itemId: string;
  score: number;
  confidence: number;
  sources: {
    collaborative?: { score: number; weight: number };
    contentBased?: { score: number; weight: number };
  };
  reason: string;
}

export interface WeightConfig {
  collaborativeWeight: number;  // 0-1
  contentBasedWeight: number;   // 0-1
  fallbackScore: number;
}

/**
 * Hybrid Recommendation Service
 * Combines collaborative and content-based filtering
 * يجمع بين التصفية التعاونية والتصفية القائمة على المحتوى
 */
@Injectable()
export class HybridRecommendationService {
  private readonly logger = new Logger(HybridRecommendationService.name);

  constructor(
    private collaborativeService: CollaborativeFilteringService,
    private contentBasedService: ContentBasedService,
    private cache: CacheService,
  ) {}

  /**
   * Get hybrid recommendations combining both approaches
   * الحصول على توصيات هجينة تجمع بين كلا النهجين
   */
  async getHybridRecommendations(
    userId: string,
    context: {
      type: string;
      id?: string;
      preferences?: any;
    },
    options: {
      limit?: number;
      weights?: Partial<WeightConfig>;
    } = {},
  ): Promise<HybridRecommendation[]> {
    const { limit = 20, weights } = options;
    
    const cacheKey = `hybrid:recommendations:${userId}:${context.type}:${context.id || 'global'}:${limit}`;
    const cached = await this.cache.get<HybridRecommendation[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const config: WeightConfig = {
      collaborativeWeight: weights?.collaborativeWeight ?? 0.5,
      contentBasedWeight: weights?.contentBasedWeight ?? 0.4,
      fallbackScore: weights?.fallbackScore ?? 50,
    };

    try {
      // Get recommendations from both sources in parallel
      const [collaborativeRecs, contentBasedRecs] = await Promise.all([
        this.getCollaborativeWithContext(userId, context),
        this.getContentBasedWithContext(userId, context),
      ]);

      // Merge and score
      const mergedScores = this.mergeRecommendations(
        collaborativeRecs,
        contentBasedRecs,
        config,
      );

      // Sort and limit
      const results = mergedScores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache for 30 minutes
      await this.cache.set(cacheKey, results, 1800);

      return results;
    } catch (error) {
      this.logger.error(`Error getting hybrid recommendations: ${error.message}`);
      return this.getFallbackRecommendations(userId, limit, config);
    }
  }

  /**
   * Match buyer request with sellers using hybrid approach
   */
  async matchBuyerWithSellers(
    buyerId: string,
    buyerRequest: {
      categories?: string[];
      priceRange?: { min: number; max: number };
      locations?: string[];
      keywords?: string[];
    },
    sellerOffers: Array<{
      id: string;
      title: string;
      price?: number;
      categoryId?: number;
      city?: string;
      country?: string;
      sellerId: string;
    }>,
    options: {
      limit?: number;
      weights?: Partial<WeightConfig>;
    } = {},
  ): Promise<HybridRecommendation[]> {
    const { limit = 10, weights } = options;

    const config: WeightConfig = {
      collaborativeWeight: weights?.collaborativeWeight ?? 0.4,
      contentBasedWeight: weights?.contentBasedWeight ?? 0.6,
      fallbackScore: weights?.fallbackScore ?? 40,
    };

    try {
      // Get collaborative filtering results
      const collaborativeRecs = await this.collaborativeService.getCollaborativeRecommendations(
        buyerId,
        'BUYER_REQUEST',
        undefined,
        sellerOffers.length,
      );

      // Get content-based results
      const contentBasedRecs = await this.contentBasedService.matchBuyerRequestWithOffers(
        buyerRequest,
        sellerOffers,
        sellerOffers.length,
      );

      // Create collaborative score map
      const collaborativeMap = new Map<string, number>();
      collaborativeRecs.forEach((r) => collaborativeMap.set(r.matchedItemId, r.score));

      // Create content-based score map
      const contentBasedMap = new Map<string, { score: number; matchedFeatures: string[] }>();
      contentBasedRecs.forEach((r) => contentBasedMap.set(r.itemId, { score: r.score, matchedFeatures: r.matchedFeatures }));

      // Calculate hybrid scores
      const results: HybridRecommendation[] = sellerOffers.map((offer) => {
        const collabScore = collaborativeMap.get(offer.id)?.score ?? config.fallbackScore * 0.5;
        const contentScore = contentBasedMap.get(offer.id)?.score ?? config.fallbackScore * 0.5;

        const hybridScore = 
          (collabScore * config.collaborativeWeight) + 
          (contentScore * config.contentBasedWeight);

        const matchedFeatures = contentBasedMap.get(offer.id)?.matchedFeatures || [];

        return {
          itemId: offer.id,
          score: Math.min(hybridScore, 100),
          confidence: (collabScore + contentScore) / 200,
          sources: {
            collaborative: { score: collabScore, weight: config.collaborativeWeight },
            contentBased: { score: contentScore, weight: config.contentBasedWeight },
          },
          reason: matchedFeatures[0] || 'مطابقة بناءً على التفضيلات والتاريخ',
        };
      });

      return results.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      this.logger.error(`Error in hybrid buyer-seller matching: ${error.message}`);
      return this.getFallbackRecommendations(buyerId, limit, config);
    }
  }

  /**
   * Get personalized recommendations for a user based on behavior
   */
  async getPersonalizedRecommendations(
    userId: string,
    userType: string,
    options: {
      limit?: number;
      weights?: Partial<WeightConfig>;
    } = {},
  ): Promise<HybridRecommendation[]> {
    return this.getHybridRecommendations(
      userId,
      { type: 'PERSONALIZED', id: userId },
      options,
    );
  }

  /**
   * Get recommendations based on similar items
   */
  async getSimilarItemRecommendations(
    userId: string,
    itemId: string,
    options: {
      limit?: number;
      weights?: Partial<WeightConfig>;
    } = {},
  ): Promise<HybridRecommendation[]> {
    const { limit = 10, weights } = options;

    const config: WeightConfig = {
      collaborativeWeight: weights?.collaborativeWeight ?? 0.6,
      contentBasedWeight: weights?.contentBasedWeight ?? 0.4,
      fallbackScore: weights?.fallbackScore ?? 45,
    };

    try {
      // Get collaborative filtering (item-based)
      const collaborativeRecs = await this.collaborativeService.getItemBasedRecommendations(
        itemId,
        userId,
        limit,
      );

      // Get content-based filtering
      const contentBasedRecs = await this.contentBasedService.findSimilarListings(
        itemId,
        limit,
      );

      // Merge
      const results = this.mergeHybridRecs(
        collaborativeRecs.map((r) => ({
          itemId: r.matchedItemId,
          score: r.score,
          confidence: r.confidence,
          reason: r.reason,
        })),
        contentBasedRecs.map((r) => ({
          itemId: r.itemId,
          score: r.score,
          confidence: r.confidence,
          matchedFeatures: r.matchedFeatures,
          reason: r.reason,
        })),
        config,
      );

      return results.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting similar item recommendations: ${error.message}`);
      return this.getFallbackRecommendations(userId, limit, config);
    }
  }

  /**
   * Get contextual recommendations based on current location/time
   */
  async getContextualRecommendations(
    userId: string,
    context: {
      latitude: number;
      longitude: number;
      timeOfDay?: number; // 0-23
      dayOfWeek?: number; // 0-6
    },
    options: {
      limit?: number;
      weights?: Partial<WeightConfig>;
    } = {},
  ): Promise<HybridRecommendation[]> {
    const { limit = 10, weights } = options;

    const config: WeightConfig = {
      collaborativeWeight: weights?.collaborativeWeight ?? 0.5,
      contentBasedWeight: weights?.contentBasedWeight ?? 0.5,
      fallbackScore: weights?.fallbackScore ?? 40,
    };

    // Get location-based preferences
    const locationPrefs = {
      locations: await this.getNearbyLocations(context.latitude, context.longitude),
    };

    return this.getHybridRecommendations(
      userId,
      { type: 'CONTEXTUAL', preferences: locationPrefs },
      { limit, weights: config },
    );
  }

  /**
   * Record user interaction for learning
   */
  async recordInteraction(
    userId: string,
    itemId: string,
    interactionType: 'VIEW' | 'BOOKING' | 'CANCEL' | 'RATING',
    rating?: number,
  ): Promise<void> {
    try {
      await this.collaborativeService.recordBehavior(
        userId,
        'BUYER',
        interactionType,
        { itemId, rating },
      );

      // Update match history if it's a booking
      if (interactionType === 'BOOKING') {
        await this.updateMatchHistory(userId, itemId, true);
      }
    } catch (error) {
      this.logger.error(`Error recording interaction: ${error.message}`);
    }
  }

  /**
   * Get A/B test recommendations
   */
  async getABTestRecommendations(
    userId: string,
    testGroup: string,
    options: { limit?: number } = {},
  ): Promise<HybridRecommendation[]> {
    const weights = testGroup === 'A'
      ? { collaborativeWeight: 0.7, contentBasedWeight: 0.3 }
      : { collaborativeWeight: 0.3, contentBasedWeight: 0.7 };

    return this.getHybridRecommendations(
      userId,
      { type: 'AB_TEST', id: testGroup },
      { ...options, weights },
    );
  }

  // Private helper methods

  private async getCollaborativeWithContext(userId: string, context: any) {
    try {
      return await this.collaborativeService.getCollaborativeRecommendations(
        userId,
        context.type,
        context.id,
        50,
      );
    } catch {
      return [];
    }
  }

  private async getContentBasedWithContext(userId: string, context: any) {
    try {
      if (context.preferences) {
        return await this.contentBasedService.getContentBasedRecommendations(
          userId,
          context.preferences,
          50,
        );
      }
      return [];
    } catch {
      return [];
    }
  }

  private mergeRecommendations(
    collaborative: any[],
    contentBased: any[],
    config: WeightConfig,
  ): HybridRecommendation[] {
    const collabMap = new Map<string, number>();
    collaborative.forEach((r) => collabMap.set(r.matchedItemId, r.score));

    const contentMap = new Map<string, any>();
    contentBased.forEach((r) => contentMap.set(r.itemId, r));

    const allItems = new Set([...collabMap.keys(), ...contentMap.keys()]);

    return Array.from(allItems).map((itemId) => {
      const collabScore = collabMap.get(itemId) ?? config.fallbackScore * 0.5;
      const contentData = contentMap.get(itemId);
      const contentScore = contentData?.score ?? config.fallbackScore * 0.5;

      const hybridScore = 
        (collabScore * config.collaborativeWeight) + 
        (contentScore * config.contentBasedWeight);

      return {
        itemId,
        score: Math.min(hybridScore, 100),
        confidence: (collabScore + contentScore) / 200,
        sources: {
          collaborative: { score: collabScore, weight: config.collaborativeWeight },
          contentBased: { score: contentScore, weight: config.contentBasedWeight },
        },
        reason: contentData?.reason || 'موصى به للمستخدمين المشابهين',
      };
    });
  }

  private mergeHybridRecs(
    collaborative: Array<{ itemId: string; score: number; confidence: number; reason: string }>,
    contentBased: Array<{ itemId: string; score: number; confidence: number; matchedFeatures?: string[]; reason: string }>,
    config: WeightConfig,
  ): HybridRecommendation[] {
    const collabMap = new Map<string, number>();
    collaborative.forEach((r) => collabMap.set(r.itemId, r.score));

    const contentMap = new Map<string, any>();
    contentBased.forEach((r) => contentMap.set(r.itemId, r));

    const allItems = new Set([...collabMap.keys(), ...contentMap.keys()]);

    return Array.from(allItems).map((itemId) => {
      const collabScore = collabMap.get(itemId) ?? config.fallbackScore * 0.5;
      const contentData = contentMap.get(itemId);
      const contentScore = contentData?.score ?? config.fallbackScore * 0.5;

      const hybridScore = 
        (collabScore * config.collaborativeWeight) + 
        (contentScore * config.contentBasedWeight);

      return {
        itemId,
        score: Math.min(hybridScore, 100),
        confidence: (collabScore + contentScore) / 200,
        sources: {
          collaborative: { score: collabScore, weight: config.collaborativeWeight },
          contentBased: { score: contentScore, weight: config.contentBasedWeight },
        },
        reason: contentData?.reason || collaborative.find(c => c.itemId === itemId)?.reason || '',
      };
    });
  }

  private async getNearbyLocations(lat: number, lon: number): Promise<string[]> {
    // Simple geocoding placeholder - in production use a geocoding service
    return [`${lat.toFixed(2)},${lon.toFixed(2)}`];
  }

  private async updateMatchHistory(buyerId: string, itemId: string, wasCompleted: boolean): Promise<void> {
    // This would update the match history in the database
    // Implementation depends on existing models
  }

  private getFallbackRecommendations(userId: string, limit: number, config: WeightConfig): HybridRecommendation[] {
    return Array(limit).fill(null).map((_, i) => ({
      itemId: `fallback_${i}`,
      score: config.fallbackScore,
      confidence: 0.5,
      sources: {},
      reason: 'توصيات شائعة',
    }));
  }
}
