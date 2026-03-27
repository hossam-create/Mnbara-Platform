/**
 * Plugin Marketplace Service
 * 
 * Manages plugin discovery, installation, ratings, reviews, and marketplace
 * operations. Provides plugin search, filtering, and recommendation features.
 * 
 * Features:
 * - Plugin discovery and search
 * - Rating and review system
 * - Plugin recommendations
 * - Category management
 * - Version management
 * - Publisher management
 * 
 * Usage:
 * ```typescript
 * const marketplace = new PluginMarketplace(prisma);
 * const plugins = await marketplace.searchPlugins({ category: 'payment' });
 * ```
 */

import { PrismaClient } from '@prisma/client';

export interface PluginSearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  minRating?: number;
  verifiedOnly?: boolean;
  sortBy?: 'name' | 'rating' | 'downloads' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PluginRatingData {
  pluginId: string;
  userId: string;
  rating: number; // 1-5
  review?: string;
  version?: string;
}

export interface PluginPublisherData {
  name: string;
  email: string;
  website?: string;
  verified: boolean;
  description?: string;
}

export interface PluginVersionData {
  pluginId: string;
  version: string;
  manifest: any;
  downloadUrl: string;
  changelog?: string;
  minCoreVersion?: string;
  maxCoreVersion?: string;
  dependencies?: string[];
}

export interface MarketplaceStats {
  totalPlugins: number;
  totalDownloads: number;
  totalPublishers: number;
  averageRating: number;
  topCategories: Array<{ category: string; count: number }>;
  recentPlugins: Array<{ name: string; createdAt: Date }>;
  popularPlugins: Array<{ name: string; downloads: number }>;
}

export class PluginMarketplace {
  constructor(private prisma: PrismaClient) {}

  /**
   * Search plugins with various filters
   */
  async searchPlugins(options: PluginSearchOptions = {}): Promise<any[]> {
    const {
      query,
      category,
      tags,
      minRating,
      verifiedOnly,
      sortBy = 'name',
      sortOrder = 'asc',
      limit = 20,
      offset = 0,
    } = options;

    const where: any = {};

    // Text search
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Verified publisher filter
    if (verifiedOnly) {
      where.publisher = { verified: true };
    }

    // Rating filter
    if (minRating) {
      where.averageRating = { gte: minRating };
    }

    const plugins = await this.prisma.pluginMarketplace.findMany({
      where,
      include: {
        publisher: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        ratings: {
          select: {
            rating: true,
            review: true,
            userId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            ratings: true,
            downloads: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    return plugins.map((plugin: any) => ({
      ...plugin,
      totalRatings: plugin._count.ratings,
      totalDownloads: plugin._count.downloads,
      latestVersion: plugin.versions[0],
    }));
  }

  /**
   * Get plugin details by ID
   */
  async getPluginById(pluginId: string): Promise<any> {
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id: pluginId },
      include: {
        publisher: true,
        versions: {
          orderBy: { createdAt: 'desc' },
        },
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        downloads: {
          select: {
            id: true,
            userId: true,
            version: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            ratings: true,
            downloads: true,
          },
        },
      },
    });

    if (!plugin) {
      return null;
    }

    return {
      ...plugin,
      totalRatings: plugin._count.ratings,
      totalDownloads: plugin._count.downloads,
      ratingDistribution: await this.getRatingDistribution(pluginId),
    };
  }

  /**
   * Get plugin by name
   */
  async getPluginByName(name: string): Promise<any> {
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { name },
      include: {
        publisher: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            ratings: true,
            downloads: true,
          },
        },
      },
    });

    if (!plugin) {
      return null;
    }

    return {
      ...plugin,
      totalRatings: plugin._count.ratings,
      totalDownloads: plugin._count.downloads,
      latestVersion: plugin.versions[0],
    };
  }

  /**
   * Add or update plugin rating
   */
  async addRating(data: PluginRatingData): Promise<any> {
    const { pluginId, userId, rating, review, version } = data;

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if user has already rated this plugin
    const existingRating = await this.prisma.pluginRating.findUnique({
      where: {
        pluginId_userId: {
          pluginId,
          userId,
        },
      },
    });

    let result;
    if (existingRating) {
      // Update existing rating
      result = await this.prisma.pluginRating.update({
        where: { id: existingRating.id },
        data: {
          rating,
          review,
          version,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new rating
      result = await this.prisma.pluginRating.create({
        data: {
          pluginId,
          userId,
          rating,
          review,
          version,
        },
      });
    }

    // Update plugin average rating
    await this.updatePluginAverageRating(pluginId);

    return result;
  }

  /**
   * Get plugin rating distribution
   */
  private async getRatingDistribution(pluginId: string): Promise<any> {
    const ratings = await this.prisma.pluginRating.groupBy({
      by: ['rating'],
      where: { pluginId },
      _count: { rating: true },
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(({ rating, _count }: any) => {
      distribution[rating as keyof typeof distribution] = _count.rating;
    });

    return distribution;
  }

  /**
   * Update plugin average rating
   */
  private async updatePluginAverageRating(pluginId: string): Promise<void> {
    const result = await this.prisma.pluginRating.aggregate({
      where: { pluginId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.pluginMarketplace.update({
      where: { id: pluginId },
      data: {
        averageRating: result._avg.rating || 0,
        ratingCount: result._count.rating,
      },
    });
  }

  /**
   * Record plugin download
   */
  async recordDownload(
    pluginId: string,
    userId: string,
    version: string
  ): Promise<void> {
    await this.prisma.pluginDownload.create({
      data: {
        pluginId,
        userId,
        version,
      },
    });

    // Update plugin download count
    await this.prisma.pluginMarketplace.update({
      where: { id: pluginId },
      data: {
        downloadCount: { increment: 1 },
      },
    });
  }

  /**
   * Get plugin recommendations for a user
   */
  async getRecommendations(userId: string, limit = 10): Promise<any[]> {
    // Get user's downloaded plugins
    const userDownloads = await this.prisma.pluginDownload.findMany({
      where: { userId },
      select: { pluginId: true },
    });

    const downloadedPluginIds = userDownloads.map((d: any) => d.pluginId);

    // Get similar plugins based on category and tags
    const recommendations = await this.prisma.pluginMarketplace.findMany({
      where: {
        id: { notIn: downloadedPluginIds },
        averageRating: { gte: 3.5 },
      },
      include: {
        publisher: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            ratings: true,
            downloads: true,
          },
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { downloadCount: 'desc' },
      ],
      take: limit,
    });

    return recommendations.map((plugin: any) => ({
      ...plugin,
      totalRatings: plugin._count.ratings,
      totalDownloads: plugin._count.downloads,
      latestVersion: plugin.versions[0],
    }));
  }

  /**
   * Get trending plugins
   */
  async getTrendingPlugins(limit = 10): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trending = await this.prisma.pluginMarketplace.findMany({
      where: {
        averageRating: { gte: 3.5 },
      },
      include: {
        publisher: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            ratings: true,
            downloads: true,
          },
        },
      },
      orderBy: [
        { downloadCount: 'desc' },
        { averageRating: 'desc' },
      ],
      take: limit,
    });

    return trending.map((plugin: any) => ({
      ...plugin,
      totalRatings: plugin._count.ratings,
      totalDownloads: plugin._count.downloads,
      latestVersion: plugin.versions[0],
    }));
  }

  /**
   * Get categories with plugin counts
   */
  async getCategories(): Promise<any[]> {
    const categories = await this.prisma.pluginMarketplace.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    return categories.map(({ category, _count }: any) => ({
      name: category,
      count: _count.category,
    }));
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const [
      totalPlugins,
      totalDownloads,
      totalPublishers,
      averageRating,
      topCategories,
      recentPlugins,
      popularPlugins,
    ] = await Promise.all([
      this.prisma.pluginMarketplace.count(),
      this.prisma.pluginMarketplace.aggregate({
        _sum: { downloadCount: true },
      }),
      this.prisma.pluginPublisher.count(),
      this.prisma.pluginMarketplace.aggregate({
        _avg: { averageRating: true },
      }),
      this.getCategories(),
      this.prisma.pluginMarketplace.findMany({
        select: { name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.pluginMarketplace.findMany({
        select: { name: true, downloadCount: true },
        orderBy: { downloadCount: 'desc' },
        take: 5,
      }),
    ]);

    return {
      totalPlugins,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      totalPublishers,
      averageRating: averageRating._avg.averageRating || 0,
      topCategories,
      recentPlugins,
      popularPlugins,
    };
  }

  /**
   * Create or update publisher
   */
  async createOrUpdatePublisher(data: PluginPublisherData): Promise<any> {
    return this.prisma.pluginPublisher.upsert({
      where: { email: data.email },
      update: data,
      create: data,
    });
  }

  /**
   * Add plugin version
   */
  async addPluginVersion(data: PluginVersionData): Promise<any> {
    return this.prisma.pluginVersion.create({
      data: {
        pluginId: data.pluginId,
        version: data.version,
        manifest: data.manifest,
        downloadUrl: data.downloadUrl,
        changelog: data.changelog,
        minCoreVersion: data.minCoreVersion,
        maxCoreVersion: data.maxCoreVersion,
        dependencies: data.dependencies,
      },
    });
  }

  /**
   * Get plugin versions
   */
  async getPluginVersions(pluginId: string): Promise<any[]> {
    return this.prisma.pluginVersion.findMany({
      where: { pluginId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check plugin compatibility
   */
  async checkCompatibility(
    pluginId: string,
    coreVersion: string
  ): Promise<{ compatible: boolean; message: string }> {
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id: pluginId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!plugin || !plugin.versions[0]) {
      return { compatible: false, message: 'Plugin not found' };
    }

    const latestVersion = plugin.versions[0];
    
    // Simple version comparison (in production, use proper semver comparison)
    if (latestVersion.minCoreVersion && coreVersion < latestVersion.minCoreVersion) {
      return {
        compatible: false,
        message: `Core version ${coreVersion} is below minimum required version ${latestVersion.minCoreVersion}`,
      };
    }

    if (latestVersion.maxCoreVersion && coreVersion > latestVersion.maxCoreVersion) {
      return {
        compatible: false,
        message: `Core version ${coreVersion} is above maximum supported version ${latestVersion.maxCoreVersion}`,
      };
    }

    return { compatible: true, message: 'Plugin is compatible' };
  }
}