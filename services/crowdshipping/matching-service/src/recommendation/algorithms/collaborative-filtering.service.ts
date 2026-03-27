import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

export interface CollaborativeMatch {
  userId: string;
  matchedItemId: string;
  score: number;
  confidence: number;
  reason: string;
  similarUsersCount: number;
}

/**
 * Collaborative Filtering Implementation
 * Matches users based on similar behavior patterns
 * يطابق المستخدمين بناءً على أنماط السلوك المتشابهة
 */
@Injectable()
export class CollaborativeFilteringService {
  private readonly logger = new Logger(CollaborativeFilteringService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Find similar users based on behavior patterns
   * البحث عن مستخدمين متشابهين بناءً على أنماط السلوك
   */
  async findSimilarUsers(
    userId: string,
    userType: string,
    limit: number = 10,
  ): Promise<{ userId: string; similarity: number }[]> {
    const cacheKey = `cf:similar:${userId}:${userType}:${limit}`;
    const cached = await this.cache.get<{ userId: string; similarity: number }[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get user's behavior vector
      const userBehaviors = await this.prisma.userBehavior.findMany({
        where: { userId, userType: userType as any },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      if (userBehaviors.length === 0) {
        return [];
      }

      // Get users with similar behavior patterns
      const userBehaviorTypes = userBehaviors.map((b) => b.eventType);
      
      const similarUsers = await this.prisma.userBehavior.groupBy({
        by: ['userId'],
        where: {
          userId: { not: userId },
          eventType: { in: userBehaviorTypes },
          timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: limit * 2,
      });

      // Calculate similarity scores
      const results = similarUsers.map((u) => ({
        userId: u.userId,
        similarity: Math.min(u._count.userId / userBehaviors.length, 1),
      }));

      // Sort by similarity and limit
      results.sort((a, b) => b.similarity - a.similarity);
      const finalResults = results.slice(0, limit);

      // Cache for 1 hour
      await this.cache.set(cacheKey, finalResults, 3600);

      return finalResults;
    } catch (error) {
      this.logger.error(`Error finding similar users: ${error.message}`);
      return [];
    }
  }

  /**
   * Get collaborative recommendations for a buyer
   *الحصول على توصيات تعاونية للمشتري
   */
  async getCollaborativeRecommendations(
    userId: string,
    contextType: string,
    contextId?: string,
    limit: number = 20,
  ): Promise<CollaborativeMatch[]> {
    const cacheKey = `cf:recommendations:${userId}:${contextType}:${contextId || 'all'}:${limit}`;
    const cached = await this.cache.get<CollaborativeMatch[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get similar users
      const similarUsers = await this.findSimilarUsers(userId, 'BUYER', 20);

      if (similarUsers.length === 0) {
        return this.getFallbackRecommendations(userId, limit);
      }

      // Get items that similar users engaged with
      const similarUserIds = similarUsers.map((u) => u.userId);
      
      const similarUserBehaviors = await this.prisma.userBehavior.findMany({
        where: {
          userId: { in: similarUserIds },
          eventType: { in: ['BOOKING', 'VIEW', 'FAVORITE'] },
          timestamp: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
        },
        orderBy: { timestamp: 'desc' },
        take: 500,
      });

      // Aggregate scores based on similar user preferences
      const itemScores = new Map<string, { score: number; count: number; reasons: string[] }>();

      for (const behavior of similarUserBehaviors) {
        const userSimilarity = similarUsers.find((u) => u.userId === behavior.userId)?.similarity || 0;
        const weight = this.getEventWeight(behavior.eventType) * userSimilarity;

        const existing = itemScores.get(behavior.eventData as string) || { score: 0, count: 0, reasons: [] };
        existing.score += weight;
        existing.count += 1;
        
        if (behavior.eventType === 'BOOKING') {
          existing.reasons.push('المستخدمون المشابون حجزوا هذا العنصر');
        } else if (behavior.eventType === 'FAVORITE') {
          existing.reasons.push('المستخدمون المشابون أضافوه للمفضلة');
        }

        itemScores.set(behavior.eventData as string, existing);
      }

      // Convert to recommendations
      const recommendations: CollaborativeMatch[] = Array.from(itemScores.entries())
        .map(([itemId, data]) => ({
          userId,
          matchedItemId: itemId,
          score: Math.min(data.score * 100, 100),
          confidence: Math.min(data.count / similarUsers.length, 1),
          reason: data.reasons[0] || 'موصى به بناءً على تفضيلاتك',
          similarUsersCount: data.count,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache for 30 minutes
      await this.cache.set(cacheKey, recommendations, 1800);

      return recommendations;
    } catch (error) {
      this.logger.error(`Error getting collaborative recommendations: ${error.message}`);
      return this.getFallbackRecommendations(userId, limit);
    }
  }

  /**
   * Get item-based collaborative recommendations
   */
  async getItemBasedRecommendations(
    itemId: string,
    userId: string,
    limit: number = 10,
  ): Promise<CollaborativeMatch[]> {
    try {
      // Find users who engaged with this item
      const itemEngagers = await this.prisma.userBehavior.findMany({
        where: {
          eventData: { equals: itemId },
          eventType: { in: ['BOOKING', 'FAVORITE'] },
          timestamp: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      const engagerIds = itemEngagers.map((e) => e.userId);

      // Find other items these users engaged with
      const otherItemBehaviors = await this.prisma.userBehavior.findMany({
        where: {
          userId: { in: engagerIds },
          eventData: { not: itemId },
          eventType: { in: ['BOOKING', 'FAVORITE', 'VIEW'] },
          timestamp: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { timestamp: 'desc' },
        take: 200,
      });

      // Calculate co-occurrence scores
      const coOccurrence = new Map<string, { score: number; count: number }>();
      for (const behavior of otherItemBehaviors) {
        const existing = coOccurrence.get(behavior.eventData as string) || { score: 0, count: 0 };
        existing.score += this.getEventWeight(behavior.eventType);
        existing.count += 1;
        coOccurrence.set(behavior.eventData as string, existing);
      }

      // Sort and limit
      const recommendations: CollaborativeMatch[] = Array.from(coOccurrence.entries())
        .map(([item, data]) => ({
          userId,
          matchedItemId: item,
          score: Math.min(data.score * 20, 100),
          confidence: Math.min(data.count / Math.max(itemEngagers.length, 1), 1),
          reason: 'المستخدمون الذين أحبوا هذا العنصر أحبوا أيضاً',
          similarUsersCount: data.count,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      this.logger.error(`Error getting item-based recommendations: ${error.message}`);
      return [];
    }
  }

  /**
   * Record user behavior for collaborative filtering
   */
  async recordBehavior(
    userId: string,
    userType: string,
    eventType: string,
    eventData: any,
    location?: { lat: number; lon: number; city?: string; country?: string },
  ): Promise<void> {
    try {
      await this.prisma.userBehavior.create({
        data: {
          userId,
          userType: userType as any,
          eventType,
          eventData: typeof eventData === 'string' ? eventData : JSON.stringify(eventData),
          latitude: location?.lat,
          longitude: location?.lon,
          city: location?.city,
          country: location?.country,
          timestamp: new Date(),
        },
      });

      // Invalidate user's recommendation cache
      await this.cache.delPattern(`cf:*:${userId}:*`);
    } catch (error) {
      this.logger.error(`Error recording behavior: ${error.message}`);
    }
  }

  /**
   * Get fallback recommendations when CF fails
   */
  private getFallbackRecommendations(userId: string, limit: number): CollaborativeMatch[] {
    return Array(limit).fill(null).map((_, i) => ({
      userId,
      matchedItemId: `fallback_${i}`,
      score: 50,
      confidence: 0.5,
      reason: 'توصيات شائعة',
      similarUsersCount: 0,
    }));
  }

  /**
   * Get weight for different event types
   */
  private getEventWeight(eventType: string): number {
    const weights: Record<string, number> = {
      BOOKING: 1.0,
      FAVORITE: 0.7,
      VIEW: 0.3,
      SEARCH: 0.1,
      CANCELLATION: -0.5,
    };
    return weights[eventType] || 0.2;
  }
}
