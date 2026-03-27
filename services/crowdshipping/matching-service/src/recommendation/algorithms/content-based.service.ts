import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

export interface ContentBasedMatch {
  itemId: string;
  score: number;
  confidence: number;
  matchedFeatures: string[];
  reason: string;
}

/**
 * Content-Based Filtering Implementation
 * Matches items based on feature similarity
 * يطابق العناصر بناءً على التشابه في الميزات
 */
@Injectable()
export class ContentBasedService {
  private readonly logger = new Logger(ContentBasedService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Find similar listings based on content features
   * البحث عن قوائم مشابهة بناءً على محتوى الميزات
   */
  async findSimilarListings(
    listingId: string,
    limit: number = 10,
  ): Promise<ContentBasedMatch[]> {
    const cacheKey = `cb:similar:${listingId}:${limit}`;
    const cached = await this.cache.get<ContentBasedMatch[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get source listing features
      const sourceListing = await this.prisma.listing.findUnique({
        where: { id: Number(listingId) },
        select: {
          id: true,
          title: true,
          description: true,
          categoryId: true,
          price: true,
          city: true,
          country: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!sourceListing) {
        return [];
      }

      // Find listings with similar category or features
      const similarListings = await this.prisma.listing.findMany({
        where: {
          id: { not: Number(listingId) },
          status: 'ACTIVE',
          OR: [
            { categoryId: sourceListing.categoryId },
            { city: sourceListing.city },
            { country: sourceListing.country },
          ],
        },
        take: limit * 3,
        select: {
          id: true,
          title: true,
          description: true,
          categoryId: true,
          price: true,
          city: true,
          country: true,
          latitude: true,
          longitude: true,
        },
      });

      // Calculate similarity scores
      const results: ContentBasedMatch[] = similarListings.map((listing) => {
        const { score, matchedFeatures } = this.calculateContentSimilarity(sourceListing, listing);
        return {
          itemId: String(listing.id),
          score: score * 100,
          confidence: this.calculateConfidence(sourceListing, listing),
          matchedFeatures,
          reason: matchedFeatures.length > 0 
            ? `يتطابق مع: ${matchedFeatures.slice(0, 3).join(', ')}`
            : 'مقترح بناءً على التشابه العام',
        };
      });

      // Sort and limit
      const finalResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache for 2 hours
      await this.cache.set(cacheKey, finalResults, 7200);

      return finalResults;
    } catch (error) {
      this.logger.error(`Error finding similar listings: ${error.message}`);
      return [];
    }
  }

  /**
   * Get content-based recommendations for a buyer based on their preferences
   */
  async getContentBasedRecommendations(
    userId: string,
    preferences: {
      categories?: string[];
      priceRange?: { min: number; max: number };
      locations?: string[];
      keywords?: string[];
    },
    limit: number = 20,
  ): Promise<ContentBasedMatch[]> {
    const cacheKey = `cb:recommendations:${userId}:${JSON.stringify(preferences)}:${limit}`;
    const cached = await this.cache.get<ContentBasedMatch[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Build query conditions
      const whereConditions: any = { status: 'ACTIVE' };

      if (preferences.categories?.length) {
        whereConditions.categoryId = { in: preferences.categories };
      }

      if (preferences.priceRange) {
        whereConditions.price = {
          gte: preferences.priceRange.min,
          lte: preferences.priceRange.max,
        };
      }

      if (preferences.locations?.length) {
        whereConditions.OR = [
          { city: { in: preferences.locations } },
          { country: { in: preferences.locations } },
        ];
      }

      // Get matching listings
      const listings = await this.prisma.listing.findMany({
        where: whereConditions,
        take: limit * 2,
        select: {
          id: true,
          title: true,
          description: true,
          categoryId: true,
          price: true,
          city: true,
          country: true,
        },
      });

      // Score listings based on preference match
      const results: ContentBasedMatch[] = listings.map((listing) => {
        const matchedFeatures: string[] = [];

        if (preferences.categories?.includes(String(listing.categoryId))) {
          matchedFeatures.push('الفئة المفضلة');
        }
        if (preferences.locations?.includes(listing.city || '')) {
          matchedFeatures.push('الموقع المفضل');
        }
        if (preferences.priceRange && listing.price) {
          if (listing.price >= preferences.priceRange.min && listing.price <= preferences.priceRange.max) {
            matchedFeatures.push('نطاق السعر المناسب');
          }
        }

        const relevanceScore = this.calculateRelevanceScore(listing, preferences);

        return {
          itemId: String(listing.id),
          score: relevanceScore * 100,
          confidence: matchedFeatures.length / Math.max(preferences.categories?.length || 1, 1),
          matchedFeatures,
          reason: matchedFeatures[0] || 'مقترح بناءً على تفضيلاتك',
        };
      });

      const finalResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache for 1 hour
      await this.cache.set(cacheKey, finalResults, 3600);

      return finalResults;
    } catch (error) {
      this.logger.error(`Error getting content-based recommendations: ${error.message}`);
      return [];
    }
  }

  /**
   * Match buyer's request with seller's offers based on content
   */
  async matchBuyerRequestWithOffers(
    buyerRequest: {
      categories?: string[];
      priceRange?: { min: number; max: number };
      locations?: string[];
      keywords?: string[];
    },
    sellerOffers: Array<{ id: string; title: string; price?: number; categoryId?: number; city?: string; country?: string }>,
    limit: number = 10,
  ): Promise<ContentBasedMatch[]> {
    const results: ContentBasedMatch[] = sellerOffers.map((offer) => {
      const matchedFeatures: string[] = [];
      let score = 0;

      // Category match
      if (buyerRequest.categories?.length && offer.categoryId) {
        if (buyerRequest.categories.includes(String(offer.categoryId))) {
          matchedFeatures.push('الفئة المطلوبة');
          score += 30;
        }
      }

      // Price match
      if (buyerRequest.priceRange && offer.price) {
        if (offer.price >= buyerRequest.priceRange.min && offer.price <= buyerRequest.priceRange.max) {
          matchedFeatures.push('السعر مناسب');
          score += 25;
        } else if (offer.price < buyerRequest.priceRange.min) {
          score += 15; // Bonus for lower price
          matchedFeatures.push('سعر أفضل');
        }
      }

      // Location match
      if (buyerRequest.locations?.length && offer.city) {
        if (buyerRequest.locations.includes(offer.city)) {
          matchedFeatures.push('الموقع المطلوب');
          score += 25;
        }
      }

      // Keyword match in title
      if (buyerRequest.keywords?.length && offer.title) {
        const keywordMatches = buyerRequest.keywords.filter((kw) =>
          offer.title!.toLowerCase().includes(kw.toLowerCase())
        );
        if (keywordMatches.length > 0) {
          matchedFeatures.push('كلمات مفتاحية متطابقة');
          score += Math.min(keywordMatches.length * 10, 20);
        }
      }

      return {
        itemId: offer.id,
        score: Math.min(score, 100),
        confidence: score / 100,
        matchedFeatures,
        reason: matchedFeatures[0] || 'يطلبك المشترون',
      };
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate content similarity between two listings
   */
  private calculateContentSimilarity(
    source: any,
    target: any,
  ): { score: number; matchedFeatures: string[] } {
    const matchedFeatures: string[] = [];
    let totalScore = 0;
    let factors = 0;

    // Category similarity (30% weight)
    if (source.categoryId === target.categoryId) {
      matchedFeatures.push('نفس الفئة');
      totalScore += 1;
    }
    factors += 1;

    // Price similarity (25% weight) - normalized
    if (source.price && target.price) {
      const priceDiff = Math.abs(source.price - target.price) / Math.max(source.price, target.price);
      const priceScore = Math.max(0, 1 - priceDiff);
      totalScore += priceScore;
      factors += 1;
    }

    // Location similarity (25% weight)
    if (source.city === target.city) {
      matchedFeatures.push('نفس المدينة');
      totalScore += 1;
    } else if (source.country === target.country) {
      totalScore += 0.7;
    }
    factors += 1;

    // Title similarity (20% weight) - simple word overlap
    if (source.title && target.title) {
      const sourceWords = new Set(source.title.toLowerCase().split(' '));
      const targetWords = target.title.toLowerCase().split(' ');
      const overlap = targetWords.filter((w: string) => sourceWords.has(w) && w.length > 3).length;
      const titleScore = Math.min(overlap / Math.max(sourceWords.size, targetWords.length), 1);
      totalScore += titleScore;
      factors += 1;
    }

    const finalScore = factors > 0 ? totalScore / factors : 0;
    return { score: finalScore, matchedFeatures };
  }

  /**
   * Calculate confidence score for a match
   */
  private calculateConfidence(source: any, target: any): number {
    let knownFields = 0;
    let matchingFields = 0;

    if (source.categoryId && target.categoryId) {
      knownFields++;
      if (source.categoryId === target.categoryId) matchingFields++;
    }
    if (source.city && target.city) {
      knownFields++;
      if (source.city === target.city) matchingFields++;
    }
    if (source.country && target.country) {
      knownFields++;
      if (source.country === target.country) matchingFields++;
    }

    return knownFields > 0 ? matchingFields / knownFields : 0.5;
  }

  /**
   * Calculate relevance score based on user preferences
   */
  private calculateRelevanceScore(listing: any, preferences: any): number {
    let score = 0;
    let maxScore = 0;

    // Category match (40%)
    if (preferences.categories?.length) {
      maxScore += 40;
      if (preferences.categories.includes(String(listing.categoryId))) {
        score += 40;
      }
    }

    // Price match (30%)
    if (preferences.priceRange && listing.price) {
      maxScore += 30;
      if (listing.price >= preferences.priceRange.min && listing.price <= preferences.priceRange.max) {
        score += 30;
      } else if (listing.price < preferences.priceRange.min) {
        score += 20;
      }
    }

    // Location match (30%)
    if (preferences.locations?.length) {
      maxScore += 30;
      if (preferences.locations.includes(listing.city) || preferences.locations.includes(listing.country)) {
        score += 30;
      }
    }

    return maxScore > 0 ? score / maxScore : 0.5;
  }
}
