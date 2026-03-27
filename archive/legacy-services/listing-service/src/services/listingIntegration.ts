import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { invalidateCategoryCache } from '../middleware/cache';

const prisma = new PrismaClient();

interface ListingCategoryUpdate {
  categoryId: string;
  action: 'product_added' | 'product_removed' | 'product_updated' | 'status_changed';
  productId?: string;
  count?: number;
  metadata?: any;
}

interface CategoryListingStats {
  categoryId: string;
  totalProducts: number;
  activeListings: number;
  soldProducts: number;
  pendingListings: number;
  avgPrice: number;
  totalRevenue: number;
  lastUpdated: Date;
}

class ListingIntegrationService {
  private readonly listingServiceUrl: string;
  private readonly searchServiceUrl: string;

  constructor() {
    this.listingServiceUrl = process.env.LISTING_SERVICE_URL || 'http://localhost:3002';
    this.searchServiceUrl = process.env.SEARCH_SERVICE_URL || 'http://localhost:3003';
  }

  async handleCategoryUpdate(update: ListingCategoryUpdate): Promise<void> {
    try {
      const { categoryId, action, productId, count = 1 } = update;

      // Update category stats based on action
      switch (action) {
        case 'product_added':
          await this.incrementProductCount(categoryId, count);
          await this.incrementActiveListings(categoryId, count);
          break;
        case 'product_removed':
          await this.decrementProductCount(categoryId, count);
          await this.decrementActiveListings(categoryId, count);
          break;
        case 'product_updated':
          await this.refreshCategoryStats(categoryId);
          break;
        case 'status_changed':
          await this.handleStatusChange(categoryId, productId, update.metadata);
          break;
      }

      // Invalidate cache
      await invalidateCategoryCache(categoryId);

      // Trigger search index update
      await this.updateSearchIndex(categoryId);

      console.log(`Category ${categoryId} updated: ${action}`);
    } catch (error) {
      console.error('Error handling category update:', error);
      throw error;
    }
  }

  async getCategoryListingStats(categoryId: string): Promise<CategoryListingStats> {
    try {
      // Get stats from listing service
      const response = await axios.get(`${this.listingServiceUrl}/api/listings/stats/category/${categoryId}`);
      
      if (response.data.success) {
        const stats = response.data.data;
        
        // Update local category stats
        await this.updateLocalCategoryStats(categoryId, stats);

        return {
          categoryId,
          totalProducts: stats.totalProducts || 0,
          activeListings: stats.activeListings || 0,
          soldProducts: stats.soldProducts || 0,
          pendingListings: stats.pendingListings || 0,
          avgPrice: stats.avgPrice || 0,
          totalRevenue: stats.totalRevenue || 0,
          lastUpdated: new Date()
        };
      }

      throw new Error('Failed to fetch listing stats');
    } catch (error) {
      console.error('Error getting category listing stats:', error);
      
      // Return cached/local stats if listing service is unavailable
      return await this.getLocalCategoryStats(categoryId);
    }
  }

  async syncCategoryStats(categoryId?: string): Promise<void> {
    try {
      if (categoryId) {
        // Sync single category
        await this.syncSingleCategoryStats(categoryId);
      } else {
        // Sync all categories
        await this.syncAllCategoryStats();
      }
    } catch (error) {
      console.error('Error syncing category stats:', error);
      throw error;
    }
  }

  async getCategoryProducts(categoryId: string, options: {
    limit?: number;
    offset?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<any> {
    try {
      const response = await axios.get(`${this.listingServiceUrl}/api/listings/category/${categoryId}`, {
        params: options
      });

      return response.data;
    } catch (error) {
      console.error('Error getting category products:', error);
      throw error;
    }
  }

  async getTopPerformingCategories(limit: number = 10): Promise<Array<{
    categoryId: string;
    categoryName: string;
    performance: {
      totalRevenue: number;
      totalSales: number;
      avgPrice: number;
      conversionRate: number;
    };
  }>> {
    try {
      const response = await axios.get(`${this.listingServiceUrl}/api/analytics/categories/top-performing`, {
        params: { limit }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error getting top performing categories:', error);
      return [];
    }
  }

  async getCategoryTrends(categoryId: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any> {
    try {
      const response = await axios.get(`${this.listingServiceUrl}/api/analytics/categories/${categoryId}/trends`, {
        params: { timeframe }
      });

      return response.data.data || {};
    } catch (error) {
      console.error('Error getting category trends:', error);
      return {};
    }
  }

  async updateCategoryFromListing(categoryId: string): Promise<void> {
    try {
      // Get latest stats from listing service
      const stats = await this.getCategoryListingStats(categoryId);
      
      // Update category in database
      await prisma.category.update({
        where: { id: categoryId },
        data: {
          productCount: stats.totalProducts,
          metadata: {
            listingStats: stats,
            lastSynced: new Date().toISOString()
          }
        }
      });

      // Update CategoryStats table
      await this.updateCategoryStatsTable(categoryId, stats);

      console.log(`Category ${categoryId} updated from listing service`);
    } catch (error) {
      console.error('Error updating category from listing:', error);
      throw error;
    }
  }

  private async incrementProductCount(categoryId: string, count: number): Promise<void> {
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        productCount: {
          increment: count
        }
      }
    });
  }

  private async decrementProductCount(categoryId: string, count: number): Promise<void> {
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        productCount: {
          decrement: count
        }
      }
    });
  }

  private async incrementActiveListings(categoryId: string, count: number): Promise<void> {
    await prisma.categoryStats.upsert({
      where: { categoryId },
      update: {
        activeListings: {
          increment: count
        },
        updatedAt: new Date()
      },
      create: {
        categoryId,
        activeListings: count,
        updatedAt: new Date()
      }
    });
  }

  private async decrementActiveListings(categoryId: string, count: number): Promise<void> {
    await prisma.categoryStats.update({
      where: { categoryId },
      data: {
        activeListings: {
          decrement: count
        },
        updatedAt: new Date()
      }
    });
  }

  private async handleStatusChange(categoryId: string, productId: string, metadata: any): Promise<void> {
    const { oldStatus, newStatus } = metadata;

    // Update active listings based on status change
    if (oldStatus === 'active' && newStatus !== 'active') {
      await this.decrementActiveListings(categoryId, 1);
    } else if (oldStatus !== 'active' && newStatus === 'active') {
      await this.incrementActiveListings(categoryId, 1);
    }

    // If sold, update sold products count
    if (newStatus === 'sold') {
      await prisma.categoryStats.upsert({
        where: { categoryId },
        update: {
          soldProducts: {
            increment: 1
          },
          updatedAt: new Date()
        },
        create: {
          categoryId,
          soldProducts: 1,
          updatedAt: new Date()
        }
      });
    }
  }

  private async refreshCategoryStats(categoryId: string): Promise<void> {
    await this.syncSingleCategoryStats(categoryId);
  }

  private async updateLocalCategoryStats(categoryId: string, stats: any): Promise<void> {
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        productCount: stats.totalProducts || 0,
        metadata: {
          listingStats: stats,
          lastSynced: new Date().toISOString()
        }
      }
    });

    await this.updateCategoryStatsTable(categoryId, stats);
  }

  private async updateCategoryStatsTable(categoryId: string, stats: any): Promise<void> {
    await prisma.categoryStats.upsert({
      where: { categoryId },
      update: {
        activeListings: stats.activeListings || 0,
        soldProducts: stats.soldProducts || 0,
        avgPrice: stats.avgPrice || 0,
        totalRevenue: stats.totalRevenue || 0,
        updatedAt: new Date()
      },
      create: {
        categoryId,
        activeListings: stats.activeListings || 0,
        soldProducts: stats.soldProducts || 0,
        avgPrice: stats.avgPrice || 0,
        totalRevenue: stats.totalRevenue || 0,
        updatedAt: new Date()
      }
    });
  }

  private async getLocalCategoryStats(categoryId: string): Promise<CategoryListingStats> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { stats: true }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return {
      categoryId,
      totalProducts: category.productCount,
      activeListings: category.stats?.activeListings || 0,
      soldProducts: category.stats?.soldProducts || 0,
      pendingListings: 0, // Not tracked locally
      avgPrice: category.stats?.avgPrice || 0,
      totalRevenue: category.stats?.totalRevenue || 0,
      lastUpdated: category.stats?.updatedAt || new Date()
    };
  }

  private async syncSingleCategoryStats(categoryId: string): Promise<void> {
    try {
      await this.updateCategoryFromListing(categoryId);
    } catch (error) {
      console.error(`Error syncing category ${categoryId}:`, error);
    }
  }

  private async syncAllCategoryStats(): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        select: { id: true }
      });

      const batchSize = 10;
      for (let i = 0; i < categories.length; i += batchSize) {
        const batch = categories.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(cat => this.syncSingleCategoryStats(cat.id))
        );
      }

      console.log('All category stats synced successfully');
    } catch (error) {
      console.error('Error syncing all category stats:', error);
    }
  }

  private async updateSearchIndex(categoryId: string): Promise<void> {
    try {
      // Notify search service to update category index
      await axios.post(`${this.searchServiceUrl}/api/search/index/category/${categoryId}`, {
        action: 'update',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating search index:', error);
      // Don't throw - search service might be temporarily unavailable
    }
  }

  async getCategoryHealth(categoryId: string): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const stats = await this.getCategoryListingStats(categoryId);
      
      // Check for potential issues
      if (stats.totalProducts === 0) {
        issues.push('No products in this category');
        recommendations.push('Consider adding products or merging with another category');
      }

      if (stats.activeListings === 0 && stats.totalProducts > 0) {
        issues.push('No active listings despite having products');
        recommendations.push('Review product statuses and activate listings');
      }

      if (stats.avgPrice === 0 && stats.totalProducts > 0) {
        issues.push('Average price is zero');
        recommendations.push('Review product pricing');
      }

      const conversionRate = stats.totalProducts > 0 ? stats.soldProducts / stats.totalProducts : 0;
      if (conversionRate < 0.01 && stats.totalProducts > 100) {
        issues.push('Low conversion rate');
        recommendations.push('Review product descriptions, pricing, and images');
      }

      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      return {
        isHealthy: false,
        issues: ['Unable to fetch category stats'],
        recommendations: ['Check listing service connectivity']
      };
    }
  }
}

export const listingIntegrationService = new ListingIntegrationService();
export default ListingIntegrationService;
