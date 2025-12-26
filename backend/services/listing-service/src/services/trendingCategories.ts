import { PrismaClient } from '@prisma/client';
import { invalidateCategoryCache } from '../middleware/cache';

const prisma = new PrismaClient();

interface TrendingCategory {
  categoryId: string;
  name: string;
  nameAr: string;
  slug: string;
  trendScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  changePercent: number;
  currentViews: number;
  previousViews: number;
  productCount: number;
  activeListings: number;
}

interface TrendingMetrics {
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  categories: TrendingCategory[];
  lastUpdated: Date;
}

class TrendingCategoriesService {
  private readonly timeframes = {
    hourly: 1, // 1 hour
    daily: 24, // 24 hours
    weekly: 168, // 7 days
    monthly: 720 // 30 days
  };

  async getTrendingCategories(
    timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
    limit: number = 20
  ): Promise<TrendingCategory[]> {
    try {
      const hours = this.timeframes[timeframe];
      const trending = await this.calculateTrendingScores(hours, limit);
      
      return trending;
    } catch (error) {
      console.error('Error getting trending categories:', error);
      return [];
    }
  }

  private async calculateTrendingScores(hours: number, limit: number): Promise<TrendingCategory[]> {
    // Get categories with view data for the specified timeframe
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        stats: true
      },
      take: limit * 2 // Get more to calculate trends
    });

    const trendingCategories: TrendingCategory[] = [];

    for (const category of categories) {
      const currentViews = await this.getCategoryViews(category.id, hours);
      const previousViews = await this.getCategoryViews(category.id, hours * 2, hours);
      
      const changePercent = previousViews > 0 
        ? ((currentViews - previousViews) / previousViews) * 100 
        : 0;

      const trendDirection = changePercent > 10 ? 'up' : changePercent < -10 ? 'down' : 'stable';
      
      // Calculate trend score based on multiple factors
      const trendScore = this.calculateTrendScore({
        currentViews,
        previousViews,
        changePercent,
        productCount: category.productCount,
        activeListings: category.stats?.activeListings || 0,
        categoryLevel: category.level
      });

      trendingCategories.push({
        categoryId: category.id,
        name: category.name,
        nameAr: category.nameAr || '',
        slug: category.slug,
        trendScore,
        trendDirection,
        changePercent,
        currentViews,
        previousViews,
        productCount: category.productCount,
        activeListings: category.stats?.activeListings || 0
      });
    }

    return trendingCategories
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);
  }

  private calculateTrendScore(metrics: {
    currentViews: number;
    previousViews: number;
    changePercent: number;
    productCount: number;
    activeListings: number;
    categoryLevel: number;
  }): number {
    let score = 0;

    // View velocity (recent views weighted more)
    score += Math.log(metrics.currentViews + 1) * 10;

    // Growth rate
    if (metrics.changePercent > 0) {
      score += Math.min(metrics.changePercent, 100) * 5;
    }

    // Product activity
    score += Math.log(metrics.activeListings + 1) * 3;

    // Category depth (deeper categories get bonus for specificity)
    score += metrics.categoryLevel * 2;

    // Product diversity
    if (metrics.productCount > 100) {
      score += Math.log(metrics.productCount) * 2;
    }

    return Math.round(score * 100) / 100;
  }

  private async getCategoryViews(categoryId: string, startHours: number, endHours: number = 0): Promise<number> {
    // This would query analytics data for category views
    // For now, returning mock data based on category ID
    const baseViews = parseInt(categoryId) * 100 || Math.random() * 1000;
    const timeMultiplier = startHours / 24; // Scale by timeframe
    return Math.round(baseViews * timeMultiplier * (0.8 + Math.random() * 0.4));
  }

  async getTrendingInsights(categoryId: string): Promise<{
    currentTrend: TrendingCategory | null;
    historicalTrends: Array<{
      timeframe: string;
      score: number;
      direction: 'up' | 'down' | 'stable';
    }>;
    relatedTrending: TrendingCategory[];
    predictions: {
      nextPeriodTrend: 'up' | 'down' | 'stable';
      confidence: number;
      estimatedViews: number;
    };
  }> {
    try {
      const [currentTrend, historicalTrends, relatedTrending] = await Promise.all([
        this.getCurrentCategoryTrend(categoryId),
        this.getHistoricalTrends(categoryId),
        this.getRelatedTrendingCategories(categoryId)
      ]);

      const predictions = this.generateTrendPredictions(historicalTrends);

      return {
        currentTrend,
        historicalTrends,
        relatedTrending,
        predictions
      };
    } catch (error) {
      console.error('Error getting trending insights:', error);
      return {
        currentTrend: null,
        historicalTrends: [],
        relatedTrending: [],
        predictions: {
          nextPeriodTrend: 'stable',
          confidence: 0,
          estimatedViews: 0
        }
      };
    }
  }

  private async getCurrentCategoryTrend(categoryId: string): Promise<TrendingCategory | null> {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { stats: true }
      });

      if (!category) return null;

      const currentViews = await this.getCategoryViews(categoryId, 24);
      const previousViews = await this.getCategoryViews(categoryId, 48, 24);
      
      const changePercent = previousViews > 0 
        ? ((currentViews - previousViews) / previousViews) * 100 
        : 0;

      const trendDirection = changePercent > 10 ? 'up' : changePercent < -10 ? 'down' : 'stable';
      
      const trendScore = this.calculateTrendScore({
        currentViews,
        previousViews,
        changePercent,
        productCount: category.productCount,
        activeListings: category.stats?.activeListings || 0,
        categoryLevel: category.level
      });

      return {
        categoryId: category.id,
        name: category.name,
        nameAr: category.nameAr || '',
        slug: category.slug,
        trendScore,
        trendDirection,
        changePercent,
        currentViews,
        previousViews,
        productCount: category.productCount,
        activeListings: category.stats?.activeListings || 0
      };
    } catch (error) {
      console.error('Error getting current category trend:', error);
      return null;
    }
  }

  private async getHistoricalTrends(categoryId: string): Promise<Array<{
    timeframe: string;
    score: number;
    direction: 'up' | 'down' | 'stable';
  }>> {
    // This would query historical trend data
    // For now, returning mock historical data
    const timeframes = ['1h', '6h', '12h', '24h', '3d', '7d'];
    return timeframes.map(timeframe => ({
      timeframe,
      score: Math.random() * 100,
      direction: Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'down' : 'stable'
    }));
  }

  private async getRelatedTrendingCategories(categoryId: string): Promise<TrendingCategory[]> {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          parent: true,
          children: true
        }
      });

      if (!category) return [];

      const relatedIds = [
        category.parent?.id,
        ...category.children.map(child => child.id)
      ].filter(Boolean);

      const relatedCategories = await prisma.category.findMany({
        where: {
          id: { in: relatedIds as string[] },
          isActive: true
        },
        include: { stats: true }
      });

      return relatedCategories.map(cat => ({
        categoryId: cat.id,
        name: cat.name,
        nameAr: cat.nameAr || '',
        slug: cat.slug,
        trendScore: Math.random() * 100,
        trendDirection: Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'down' : 'stable',
        changePercent: (Math.random() - 0.5) * 100,
        currentViews: Math.floor(Math.random() * 1000),
        previousViews: Math.floor(Math.random() * 1000),
        productCount: cat.productCount,
        activeListings: cat.stats?.activeListings || 0
      }));
    } catch (error) {
      console.error('Error getting related trending categories:', error);
      return [];
    }
  }

  private generateTrendPredictions(historicalTrends: Array<{
    timeframe: string;
    score: number;
    direction: 'up' | 'down' | 'stable';
  }>): {
    nextPeriodTrend: 'up' | 'down' | 'stable';
    confidence: number;
    estimatedViews: number;
  } {
    // Simple trend prediction based on historical data
    const recentTrends = historicalTrends.slice(-3);
    const upCount = recentTrends.filter(t => t.direction === 'up').length;
    const downCount = recentTrends.filter(t => t.direction === 'down').length;
    
    let nextPeriodTrend: 'up' | 'down' | 'stable';
    let confidence: number;

    if (upCount > downCount) {
      nextPeriodTrend = 'up';
      confidence = upCount / recentTrends.length;
    } else if (downCount > upCount) {
      nextPeriodTrend = 'down';
      confidence = downCount / recentTrends.length;
    } else {
      nextPeriodTrend = 'stable';
      confidence = 0.5;
    }

    const avgScore = recentTrends.reduce((sum, t) => sum + t.score, 0) / recentTrends.length;
    const estimatedViews = Math.round(avgScore * 10);

    return {
      nextPeriodTrend,
      confidence,
      estimatedViews
    };
  }

  async refreshTrendingData(): Promise<void> {
    try {
      console.log('Refreshing trending categories data...');
      
      // This would trigger a recalculation of trending data
      // and update cache
      
      await invalidateCategoryCache('trending:*');
      
      console.log('Trending data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing trending data:', error);
    }
  }

  async getTrendingSummary(): Promise<{
    totalTrending: number;
    trendingUp: number;
    trendingDown: number;
    stable: number;
    topCategory: TrendingCategory | null;
    lastUpdated: Date;
  }> {
    try {
      const dailyTrending = await this.getTrendingCategories('daily', 50);
      
      const trendingUp = dailyTrending.filter(c => c.trendDirection === 'up').length;
      const trendingDown = dailyTrending.filter(c => c.trendDirection === 'down').length;
      const stable = dailyTrending.filter(c => c.trendDirection === 'stable').length;

      return {
        totalTrending: dailyTrending.length,
        trendingUp,
        trendingDown,
        stable,
        topCategory: dailyTrending[0] || null,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting trending summary:', error);
      return {
        totalTrending: 0,
        trendingUp: 0,
        trendingDown: 0,
        stable: 0,
        topCategory: null,
        lastUpdated: new Date()
      };
    }
  }
}

export const trendingCategoriesService = new TrendingCategoriesService();
export default TrendingCategoriesService;
