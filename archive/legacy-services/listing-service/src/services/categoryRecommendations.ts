import { PrismaClient } from '@prisma/client';
import { invalidateCategoryCache } from '../middleware/cache';

const prisma = new PrismaClient();

interface UserBehavior {
  userId: string;
  categoryId: string;
  action: 'view' | 'click' | 'search' | 'favorite' | 'purchase';
  timestamp: Date;
  weight?: number;
}

interface RecommendationScore {
  categoryId: string;
  score: number;
  reason: string;
}

class CategoryRecommendationsService {
  private readonly actionWeights = {
    view: 1,
    click: 2,
    search: 3,
    favorite: 5,
    purchase: 10
  };

  async getUserRecommendations(userId: string, limit: number = 10): Promise<RecommendationScore[]> {
    try {
      // Get user's recent behavior
      const userBehavior = await this.getUserBehavior(userId);
      
      // Calculate recommendations based on different strategies
      const [collaborativeScores, contentScores, popularityScores] = await Promise.all([
        this.getCollaborativeRecommendations(userBehavior),
        this.getContentBasedRecommendations(userBehavior),
        this.getPopularityBasedRecommendations()
      ]);

      // Combine scores with weights
      const combinedScores = this.combineRecommendationScores(
        collaborativeScores,
        contentScores,
        popularityScores
      );

      // Sort and limit
      return combinedScores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      return [];
    }
  }

  private async getUserBehavior(userId: string): Promise<UserBehavior[]> {
    // This would typically query user behavior logs
    // For now, returning mock data
    return [
      { userId, categoryId: '1', action: 'view', timestamp: new Date() },
      { userId, categoryId: '2', action: 'click', timestamp: new Date() },
      { userId, categoryId: '3', action: 'favorite', timestamp: new Date() }
    ];
  }

  private async getCollaborativeRecommendations(userBehavior: UserBehavior[]): Promise<RecommendationScore[]> {
    const scores: Map<string, number> = new Map();

    // Find users with similar behavior
    const similarUsers = await this.findSimilarUsers(userBehavior);
    
    // Get categories liked by similar users
    for (const similarUser of similarUsers) {
      const similarUserBehavior = await this.getUserBehavior(similarUser.userId);
      
      for (const behavior of similarUserBehavior) {
        if (!userBehavior.some(ub => ub.categoryId === behavior.categoryId)) {
          const weight = this.actionWeights[behavior.action] * similarUser.similarity;
          scores.set(behavior.categoryId, (scores.get(behavior.categoryId) || 0) + weight);
        }
      }
    }

    return Array.from(scores.entries()).map(([categoryId, score]) => ({
      categoryId,
      score,
      reason: 'Users like you also liked this'
    }));
  }

  private async getContentBasedRecommendations(userBehavior: UserBehavior[]): Promise<RecommendationScore[]> {
    const scores: Map<string, number> = new Map();

    // Get categories user interacted with
    const userCategories = userBehavior.map(ub => ub.categoryId);
    
    // Find related categories based on hierarchy and metadata
    for (const categoryId of userCategories) {
      const relatedCategories = await this.getRelatedCategories(categoryId);
      
      for (const related of relatedCategories) {
        const weight = this.calculateContentSimilarity(categoryId, related.id);
        scores.set(related.id, (scores.get(related.id) || 0) + weight);
      }
    }

    return Array.from(scores.entries()).map(([categoryId, score]) => ({
      categoryId,
      score,
      reason: 'Similar to categories you like'
    }));
  }

  private async getPopularityBasedRecommendations(): Promise<RecommendationScore[]> {
    try {
      const popularCategories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { productCount: 'desc' },
        take: 50,
        select: {
          id: true,
          productCount: true,
          stats: {
            select: {
              activeListings: true,
              viewCount: true
            }
          }
        }
      });

      return popularCategories.map(category => ({
        categoryId: category.id,
        score: Math.log(category.productCount + 1) * 
               (category.stats?.viewCount ? Math.log(category.stats.viewCount + 1) : 1),
        reason: 'Popular category'
      }));
    } catch (error) {
      console.error('Error getting popularity recommendations:', error);
      return [];
    }
  }

  private combineRecommendationScores(
    collaborative: RecommendationScore[],
    content: RecommendationScore[],
    popularity: RecommendationScore[]
  ): RecommendationScore[] {
    const combined: Map<string, RecommendationScore> = new Map();

    // Weight different recommendation types
    const weights = {
      collaborative: 0.4,
      content: 0.4,
      popularity: 0.2
    };

    // Combine collaborative scores
    collaborative.forEach(rec => {
      combined.set(rec.categoryId, {
        categoryId: rec.categoryId,
        score: rec.score * weights.collaborative,
        reason: rec.reason
      });
    });

    // Add content scores
    content.forEach(rec => {
      const existing = combined.get(rec.categoryId);
      if (existing) {
        existing.score += rec.score * weights.content;
        existing.reason += `, ${rec.reason}`;
      } else {
        combined.set(rec.categoryId, {
          categoryId: rec.categoryId,
          score: rec.score * weights.content,
          reason: rec.reason
        });
      }
    });

    // Add popularity scores
    popularity.forEach(rec => {
      const existing = combined.get(rec.categoryId);
      if (existing) {
        existing.score += rec.score * weights.popularity;
      } else {
        combined.set(rec.categoryId, {
          categoryId: rec.categoryId,
          score: rec.score * weights.popularity,
          reason: rec.reason
        });
      }
    });

    return Array.from(combined.values());
  }

  private async findSimilarUsers(userBehavior: UserBehavior[]): Promise<Array<{ userId: string; similarity: number }>> {
    // This would implement collaborative filtering
    // For now, returning mock similar users
    return [
      { userId: 'user2', similarity: 0.8 },
      { userId: 'user3', similarity: 0.6 }
    ];
  }

  private async getRelatedCategories(categoryId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          children: true,
          parent: true
        }
      });

      const related = [];

      // Add parent category
      if (category?.parent) {
        related.push({ id: category.parent.id, name: category.parent.name });
      }

      // Add sibling categories
      if (category?.parentId) {
        const siblings = await prisma.category.findMany({
          where: { 
            parentId: category.parentId,
            id: { not: categoryId },
            isActive: true
          },
          select: { id: true, name: true }
        });
        related.push(...siblings);
      }

      // Add child categories
      if (category?.children) {
        related.push(...category.children.map(child => ({ id: child.id, name: child.name })));
      }

      return related;
    } catch (error) {
      console.error('Error getting related categories:', error);
      return [];
    }
  }

  private calculateContentSimilarity(categoryId1: string, categoryId2: string): number {
    // This would calculate similarity based on category attributes
    // For now, returning a simple similarity score
    return Math.random() * 0.5 + 0.1; // Random between 0.1 and 0.6
  }

  async recordUserBehavior(userId: string, categoryId: string, action: UserBehavior['action']): Promise<void> {
    try {
      // This would record user behavior in a analytics table
      console.log(`Recorded ${action} for user ${userId} on category ${categoryId}`);
      
      // Invalidate cache for this user's recommendations
      await this.invalidateUserRecommendationCache(userId);
    } catch (error) {
      console.error('Error recording user behavior:', error);
    }
  }

  private async invalidateUserRecommendationCache(userId: string): Promise<void> {
    const pattern = `recommendations:user:${userId}:*`;
    await invalidateCategoryCache(pattern);
  }

  async getCategoryInsights(categoryId: string): Promise<{
    similarCategories: Array<{ id: string; name: string; similarity: number }>;
    frequentlyViewedTogether: Array<{ id: string; name: string; frequency: number }>;
    trendingRelated: Array<{ id: string; name: string; trend: number }>;
  }> {
    try {
      const [similar, together, trending] = await Promise.all([
        this.getSimilarCategories(categoryId),
        this.getFrequentlyViewedTogether(categoryId),
        this.getTrendingRelatedCategories(categoryId)
      ]);

      return {
        similarCategories: similar,
        frequentlyViewedTogether: together,
        trendingRelated: trending
      };
    } catch (error) {
      console.error('Error getting category insights:', error);
      return {
        similarCategories: [],
        frequentlyViewedTogether: [],
        trendingRelated: []
      };
    }
  }

  private async getSimilarCategories(categoryId: string): Promise<Array<{ id: string; name: string; similarity: number }>> {
    // Implementation for finding similar categories
    return [];
  }

  private async getFrequentlyViewedTogether(categoryId: string): Promise<Array<{ id: string; name: string; frequency: number }>> {
    // Implementation for finding categories frequently viewed together
    return [];
  }

  private async getTrendingRelatedCategories(categoryId: string): Promise<Array<{ id: string; name: string; trend: number }>> {
    // Implementation for finding trending related categories
    return [];
  }
}

export const categoryRecommendationsService = new CategoryRecommendationsService();
export default CategoryRecommendationsService;
