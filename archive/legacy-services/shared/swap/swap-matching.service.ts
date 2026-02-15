import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  SwapMatchResult,
  ListingForMatching,
  MatchingWeights,
  DEFAULT_MATCHING_WEIGHTS
} from './swap.types';

/**
 * Swap Matching Service
 * 
 * Implements the swap matching algorithm to find compatible listings
 * for peer-to-peer swaps based on category, price, location, and condition.
 */
export class SwapMatchingService {
  private prisma: PrismaClient;
  private weights: MatchingWeights;

  constructor(prisma: PrismaClient, weights?: MatchingWeights) {
    this.prisma = prisma;
    this.weights = weights || DEFAULT_MATCHING_WEIGHTS;
  }

  /**
   * Find potential swap matches for a listing
   */
  async findMatches(
    listingId: number,
    options: {
      limit?: number;
      minScore?: number;
      maxPriceDifferencePercent?: number;
      sameCategory?: boolean;
      sameCountry?: boolean;
    } = {}
  ): Promise<SwapMatchResult[]> {
    const {
      limit = 20,
      minScore = 0.5,
      maxPriceDifferencePercent = 30,
      sameCategory = false,
      sameCountry = false
    } = options;

    // Get the source listing
    const sourceListing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { category: true }
    });

    if (!sourceListing || !sourceListing.isActive || sourceListing.status !== 'ACTIVE') {
      throw new Error('Listing not found or not available for swap');
    }

    // Build query for potential matches
    const whereClause: any = {
      id: { not: listingId },
      sellerId: { not: sourceListing.sellerId },
      isActive: true,
      status: 'ACTIVE',
      isAuction: false // Only fixed-price listings can be swapped
    };

    // Optional filters
    if (sameCategory) {
      whereClause.categoryId = sourceListing.categoryId;
    }

    if (sameCountry) {
      whereClause.country = sourceListing.country;
    }

    // Price range filter (within maxPriceDifferencePercent)
    const sourcePrice = Number(sourceListing.price);
    const minPrice = sourcePrice * (1 - maxPriceDifferencePercent / 100);
    const maxPrice = sourcePrice * (1 + maxPriceDifferencePercent / 100);
    
    whereClause.price = {
      gte: minPrice,
      lte: maxPrice
    };

    // Fetch potential matches
    const potentialMatches = await this.prisma.listing.findMany({
      where: whereClause,
      include: { category: true },
      take: limit * 3 // Fetch more to filter by score
    });

    // Calculate match scores
    const matches: SwapMatchResult[] = [];

    for (const match of potentialMatches) {
      const score = this.calculateMatchScore(sourceListing as any, match as any);
      
      if (score.matchScore >= minScore) {
        matches.push(score);
      }
    }

    // Sort by score descending and limit
    matches.sort((a, b) => b.matchScore - a.matchScore);
    return matches.slice(0, limit);
  }

  /**
   * Calculate match score between two listings
   */
  calculateMatchScore(
    source: ListingForMatching & { category?: { id: number; parentId?: number | null } },
    target: ListingForMatching & { category?: { id: number; parentId?: number | null } }
  ): SwapMatchResult {
    // Category match (exact or parent category)
    const categoryMatch = this.calculateCategoryMatch(source, target);
    
    // Price match (closer prices = higher score)
    const priceMatch = this.calculatePriceMatch(source, target);
    
    // Location match (same city > same country > different)
    const locationMatch = this.calculateLocationMatch(source, target);
    
    // Condition match (same condition = higher score)
    const conditionMatch = this.calculateConditionMatch(source, target);

    // Calculate weighted score
    const matchScore = 
      categoryMatch.score * this.weights.categoryWeight +
      priceMatch.score * this.weights.priceWeight +
      locationMatch.score * this.weights.locationWeight +
      conditionMatch.score * this.weights.conditionWeight;

    // Calculate value difference
    const sourcePrice = Number(source.price);
    const targetPrice = Number(target.price);
    const valueDifference = targetPrice - sourcePrice;
    const valueDifferencePercent = sourcePrice > 0 
      ? (valueDifference / sourcePrice) * 100 
      : 0;

    return {
      initiatorListingId: source.id,
      matchedListingId: target.id,
      matchScore: Math.round(matchScore * 100) / 100,
      categoryMatch: categoryMatch.isMatch,
      priceRangeMatch: priceMatch.isMatch,
      locationMatch: locationMatch.isMatch,
      conditionMatch: conditionMatch.isMatch,
      valueDifference: Math.round(valueDifference * 100) / 100,
      valueDifferencePercent: Math.round(valueDifferencePercent * 100) / 100
    };
  }

  /**
   * Calculate category match score
   */
  private calculateCategoryMatch(
    source: ListingForMatching & { category?: { id: number; parentId?: number | null } },
    target: ListingForMatching & { category?: { id: number; parentId?: number | null } }
  ): { score: number; isMatch: boolean } {
    // Exact category match
    if (source.categoryId === target.categoryId) {
      return { score: 1.0, isMatch: true };
    }

    // Parent category match
    if (source.category?.parentId && target.category?.parentId) {
      if (source.category.parentId === target.category.parentId) {
        return { score: 0.7, isMatch: true };
      }
      if (source.category.parentId === target.categoryId || 
          target.category.parentId === source.categoryId) {
        return { score: 0.5, isMatch: true };
      }
    }

    return { score: 0.2, isMatch: false };
  }

  /**
   * Calculate price match score
   */
  private calculatePriceMatch(
    source: ListingForMatching,
    target: ListingForMatching
  ): { score: number; isMatch: boolean } {
    const sourcePrice = Number(source.price);
    const targetPrice = Number(target.price);
    
    if (sourcePrice === 0 || targetPrice === 0) {
      return { score: 0, isMatch: false };
    }

    const priceDiffPercent = Math.abs(targetPrice - sourcePrice) / sourcePrice * 100;

    // Within 5% = perfect match
    if (priceDiffPercent <= 5) {
      return { score: 1.0, isMatch: true };
    }
    // Within 10% = very good match
    if (priceDiffPercent <= 10) {
      return { score: 0.9, isMatch: true };
    }
    // Within 20% = good match
    if (priceDiffPercent <= 20) {
      return { score: 0.7, isMatch: true };
    }
    // Within 30% = acceptable match
    if (priceDiffPercent <= 30) {
      return { score: 0.5, isMatch: true };
    }
    // Beyond 30% = poor match
    return { score: Math.max(0, 1 - priceDiffPercent / 100), isMatch: false };
  }

  /**
   * Calculate location match score
   */
  private calculateLocationMatch(
    source: ListingForMatching,
    target: ListingForMatching
  ): { score: number; isMatch: boolean } {
    // Same city
    if (source.city.toLowerCase() === target.city.toLowerCase() &&
        source.country.toLowerCase() === target.country.toLowerCase()) {
      return { score: 1.0, isMatch: true };
    }

    // Same country
    if (source.country.toLowerCase() === target.country.toLowerCase()) {
      return { score: 0.6, isMatch: true };
    }

    // Different country
    return { score: 0.2, isMatch: false };
  }

  /**
   * Calculate condition match score
   */
  private calculateConditionMatch(
    source: ListingForMatching,
    target: ListingForMatching
  ): { score: number; isMatch: boolean } {
    const conditionRanks: Record<string, number> = {
      'NEW': 5,
      'LIKE_NEW': 4,
      'GOOD': 3,
      'FAIR': 2,
      'POOR': 1
    };

    const sourceRank = conditionRanks[source.condition] || 3;
    const targetRank = conditionRanks[target.condition] || 3;
    const diff = Math.abs(sourceRank - targetRank);

    if (diff === 0) return { score: 1.0, isMatch: true };
    if (diff === 1) return { score: 0.8, isMatch: true };
    if (diff === 2) return { score: 0.5, isMatch: false };
    return { score: 0.2, isMatch: false };
  }

  /**
   * Store computed matches in database for quick retrieval
   */
  async storeMatches(matches: SwapMatchResult[]): Promise<number> {
    if (matches.length === 0) return 0;

    const result = await this.prisma.swapMatch.createMany({
      data: matches.map(m => ({
        initiatorListingId: m.initiatorListingId,
        matchedListingId: m.matchedListingId,
        matchScore: new Decimal(m.matchScore),
        categoryMatch: m.categoryMatch,
        priceRangeMatch: m.priceRangeMatch,
        locationMatch: m.locationMatch,
        conditionMatch: m.conditionMatch,
        valueDifference: new Decimal(m.valueDifference),
        valueDifferencePercent: new Decimal(m.valueDifferencePercent),
        isActive: true
      })),
      skipDuplicates: true
    });

    return result.count;
  }

  /**
   * Get stored matches for a listing
   */
  async getStoredMatches(
    listingId: number,
    options: { limit?: number; minScore?: number } = {}
  ): Promise<SwapMatchResult[]> {
    const { limit = 20, minScore = 0.5 } = options;

    const matches = await this.prisma.swapMatch.findMany({
      where: {
        initiatorListingId: listingId,
        isActive: true,
        matchScore: { gte: minScore }
      },
      orderBy: { matchScore: 'desc' },
      take: limit
    });

    return matches.map(m => ({
      initiatorListingId: m.initiatorListingId,
      matchedListingId: m.matchedListingId,
      matchScore: Number(m.matchScore),
      categoryMatch: m.categoryMatch,
      priceRangeMatch: m.priceRangeMatch,
      locationMatch: m.locationMatch,
      conditionMatch: m.conditionMatch,
      valueDifference: Number(m.valueDifference),
      valueDifferencePercent: Number(m.valueDifferencePercent)
    }));
  }

  /**
   * Invalidate matches when a listing is updated or deactivated
   */
  async invalidateMatches(listingId: number): Promise<number> {
    const result = await this.prisma.swapMatch.updateMany({
      where: {
        OR: [
          { initiatorListingId: listingId },
          { matchedListingId: listingId }
        ]
      },
      data: { isActive: false }
    });

    return result.count;
  }
}

export default SwapMatchingService;
