import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RecommendationService, MatchRequest } from './recommendation.service';

/**
 * Recommendation Controller
 * واجهة برمجة تطبيقات خدمة التوصيات
 */
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  /**
   * Get personalized recommendations for a user
   */
  @Get('personalized/:userId')
  async getPersonalizedRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getPersonalizedRecommendations(
      userId,
      limit ? { limit: parseInt(limit, 10) } : undefined,
    );
  }

  /**
   * Match buyer request with sellers
   */
  @Post('match')
  async matchBuyerWithSellers(@Body() request: {
    buyerId: string;
    request: MatchRequest['request'];
    sellerOffers: Array<{
      id: string;
      title: string;
      price?: number;
      categoryId?: number;
      city?: string;
      country?: string;
      sellerId: string;
    }>;
  }) {
    return this.recommendationService.matchBuyerWithSellers(
      { buyerId: request.buyerId, request: request.request },
      request.sellerOffers,
    );
  }

  /**
   * Get similar listings to a given listing
   */
  @Get('similar/:userId/:listingId')
  async getSimilarListings(
    @Param('userId') userId: string,
    @Param('listingId') listingId: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getSimilarListings(
      userId,
      listingId,
      limit ? { limit: parseInt(limit, 10) } : undefined,
    );
  }

  /**
   * Get contextual recommendations based on location/time
   */
  @Get('contextual/:userId')
  async getContextualRecommendations(
    @Param('userId') userId: string,
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('timeOfDay') timeOfDay?: string,
    @Query('dayOfWeek') dayOfWeek?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getContextualRecommendations(
      userId,
      {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        timeOfDay: timeOfDay ? parseInt(timeOfDay, 10) : undefined,
        dayOfWeek: dayOfWeek ? parseInt(dayOfWeek, 10) : undefined,
      },
      limit ? { limit: parseInt(limit, 10) } : undefined,
    );
  }

  /**
   * Record user interaction
   */
  @Post('interaction')
  async recordInteraction(@Body() body: {
    userId: string;
    itemId: string;
    interactionType: 'VIEW' | 'BOOKING' | 'CANCEL' | 'RATING';
    rating?: number;
  }) {
    return this.recommendationService.recordInteraction(
      body.userId,
      body.itemId,
      body.interactionType,
      body.rating,
    );
  }

  /**
   * Get A/B test recommendations
   */
  @Get('ab-test/:userId/:testGroup')
  async getABTestRecommendations(
    @Param('userId') userId: string,
    @Param('testGroup') testGroup: 'A' | 'B',
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getABTestRecommendations(
      userId,
      testGroup,
      limit ? { limit: parseInt(limit, 10) } : undefined,
    );
  }

  /**
   * Get trending items
   */
  @Get('trending')
  async getTrendingItems(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getTrendingItems(
      categoryId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * Get price predictions
   */
  @Post('price-predictions')
  async getPricePredictions(@Body() body: {
    items: Array<{ id: string; title: string; categoryId?: number }>;
  }) {
    return this.recommendationService.getPricePredictions(body.items);
  }
}
