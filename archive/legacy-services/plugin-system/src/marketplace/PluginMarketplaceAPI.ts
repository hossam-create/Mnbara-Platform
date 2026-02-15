// ============================================================
// Plugin Marketplace API - Manages plugin marketplace
// ============================================================

import { PrismaClient } from '@prisma/client';
import { PluginCategory } from '../types/plugin.types';
import { Logger } from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface MarketplacePlugin {
  id: string;
  pluginId: string;
  developerId: string;
  name: string;
  description?: string;
  category: PluginCategory;
  price: number;
  isVerified: boolean;
  isPublished: boolean;
  downloadCount: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PluginFilters {
  category?: PluginCategory;
  type?: string;
  verified?: boolean;
  published?: boolean;
  minRating?: number;
  maxPrice?: number;
  search?: string;
}

export interface PluginSubmission {
  name: string;
  description?: string;
  category: PluginCategory;
  price: number;
  pluginPackage: Buffer; // ZIP file
  manifest: any;
}

export class PluginMarketplaceAPI {
  private prisma: PrismaClient;
  private logger: Logger;
  private pluginsDir: string;

  constructor(prisma: PrismaClient, logger: Logger, pluginsDir: string) {
    this.prisma = prisma;
    this.logger = logger;
    this.pluginsDir = pluginsDir;
  }

  /**
   * List available plugins with filters
   */
  async listPlugins(filters?: PluginFilters, limit: number = 20, offset: number = 0): Promise<{
    plugins: MarketplacePlugin[];
    total: number;
  }> {
    try {
      const where: any = {};

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.verified !== undefined) {
        where.isVerified = filters.verified;
      }

      if (filters?.published !== undefined) {
        where.isPublished = filters.published;
      }

      if (filters?.minRating) {
        where.rating = { gte: filters.minRating };
      }

      if (filters?.maxPrice !== undefined) {
        where.price = { lte: filters.maxPrice };
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [plugins, total] = await Promise.all([
        this.prisma.marketplacePlugin.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: [
            { downloadCount: 'desc' },
            { rating: 'desc' }
          ],
          include: {
            plugin: {
              select: {
                id: true,
                name: true,
                version: true,
                type: true
              }
            }
          }
        }),
        this.prisma.marketplacePlugin.count({ where })
      ]);

      return {
        plugins: plugins.map(p => this.mapToMarketplacePlugin(p)),
        total
      };
    } catch (error: any) {
      this.logger.error('Failed to list plugins', error);
      throw error;
    }
  }

  /**
   * Get plugin details
   */
  async getPlugin(pluginId: string): Promise<MarketplacePlugin | null> {
    try {
      const plugin = await this.prisma.marketplacePlugin.findUnique({
        where: { pluginId },
        include: {
          plugin: true,
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!plugin) {
        return null;
      }

      return this.mapToMarketplacePlugin(plugin);
    } catch (error: any) {
      this.logger.error(`Failed to get plugin: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * Install plugin for user
   */
  async installPlugin(userId: string, pluginId: string): Promise<{ success: boolean; installationId?: string; error?: string }> {
    try {
      // Get marketplace plugin
      const marketplacePlugin = await this.prisma.marketplacePlugin.findUnique({
        where: { pluginId },
        include: { plugin: true }
      });

      if (!marketplacePlugin) {
        return { success: false, error: 'Plugin not found' };
      }

      if (!marketplacePlugin.isPublished) {
        return { success: false, error: 'Plugin is not published' };
      }

      // Check if paid plugin
      if (marketplacePlugin.price > 0) {
        const hasPurchased = await this.checkPurchase(userId, pluginId);
        if (!hasPurchased) {
          return { success: false, error: 'Plugin not purchased' };
        }
      }

      // Check if already installed
      const existing = await this.prisma.pluginInstallation.findFirst({
        where: {
          pluginId: marketplacePlugin.pluginId,
          userId,
          status: 'ACTIVE'
        }
      });

      if (existing) {
        return { success: false, error: 'Plugin already installed' };
      }

      // Create installation record
      const installation = await this.prisma.pluginInstallation.create({
        data: {
          pluginId: marketplacePlugin.pluginId,
          userId,
          version: marketplacePlugin.plugin.version,
          status: 'ACTIVE'
        }
      });

      // Increment download count
      await this.prisma.marketplacePlugin.update({
        where: { pluginId },
        data: {
          downloadCount: { increment: 1 }
        }
      });

      this.logger.info(`Plugin installed: ${pluginId} by user ${userId}`);

      return {
        success: true,
        installationId: installation.id
      };
    } catch (error: any) {
      this.logger.error(`Failed to install plugin: ${pluginId}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Uninstall plugin
   */
  async uninstallPlugin(userId: string, pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const installation = await this.prisma.pluginInstallation.findFirst({
        where: {
          pluginId,
          userId,
          status: 'ACTIVE'
        }
      });

      if (!installation) {
        return { success: false, error: 'Plugin not installed' };
      }

      await this.prisma.pluginInstallation.update({
        where: { id: installation.id },
        data: {
          status: 'INACTIVE',
          uninstalledAt: new Date()
        }
      });

      this.logger.info(`Plugin uninstalled: ${pluginId} by user ${userId}`);

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to uninstall plugin: ${pluginId}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit new plugin (for developers)
   */
  async submitPlugin(developerId: string, submission: PluginSubmission): Promise<{ success: boolean; pluginId?: string; error?: string }> {
    try {
      // Validate plugin package
      const validationResult = await this.validatePluginPackage(submission.pluginPackage, submission.manifest);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.errors.join(', ') };
      }

      // Security scan
      const scanResult = await this.securityScan(submission.pluginPackage);
      if (!scanResult.passed) {
        return { success: false, error: `Security scan failed: ${scanResult.issues.join(', ')}` };
      }

      // Extract and save plugin
      const pluginId = await this.savePluginPackage(submission.pluginPackage, submission.manifest);

      // Create plugin record
      const plugin = await this.prisma.plugin.create({
        data: {
          id: pluginId,
          name: submission.manifest.name,
          version: submission.manifest.version,
          type: submission.manifest.type,
          category: submission.category,
          manifest: submission.manifest as any,
          status: 'INACTIVE'
        }
      });

      // Create marketplace entry
      const marketplacePlugin = await this.prisma.marketplacePlugin.create({
        data: {
          pluginId: plugin.id,
          developerId,
          name: submission.name,
          description: submission.description,
          category: submission.category,
          price: submission.price,
          isVerified: false,
          isPublished: false
        }
      });

      // Notify review team
      await this.notifyReviewTeam(marketplacePlugin.id);

      this.logger.info(`Plugin submitted: ${submission.manifest.name} by developer ${developerId}`);

      return {
        success: true,
        pluginId: marketplacePlugin.id
      };
    } catch (error: any) {
      this.logger.error('Failed to submit plugin', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add plugin review
   */
  async addReview(pluginId: string, userId: string, rating: number, comment?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
      }

      // Check if user has installed plugin
      const installation = await this.prisma.pluginInstallation.findFirst({
        where: {
          pluginId,
          userId,
          status: 'ACTIVE'
        }
      });

      if (!installation) {
        return { success: false, error: 'Plugin must be installed to review' };
      }

      // Create or update review
      await this.prisma.pluginReview.upsert({
        where: {
          pluginId_userId: {
            pluginId,
            userId
          }
        },
        create: {
          pluginId,
          userId,
          rating,
          comment
        },
        update: {
          rating,
          comment,
          updatedAt: new Date()
        }
      });

      // Update plugin rating
      await this.updatePluginRating(pluginId);

      this.logger.info(`Review added: plugin ${pluginId} by user ${userId}`);

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to add review: ${pluginId}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update plugin rating (recalculate)
   */
  private async updatePluginRating(pluginId: string): Promise<void> {
    const reviews = await this.prisma.pluginReview.findMany({
      where: { pluginId }
    });

    if (reviews.length === 0) {
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.prisma.marketplacePlugin.update({
      where: { pluginId },
      data: {
        rating: avgRating,
        reviewCount: reviews.length
      }
    });
  }

  /**
   * Validate plugin package
   */
  private async validatePluginPackage(packageData: Buffer, manifest: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check if ZIP file
    // In production, use a proper ZIP library
    if (packageData.length === 0) {
      errors.push('Package is empty');
    }

    // Validate manifest
    if (!manifest.name) {
      errors.push('Manifest missing name');
    }

    if (!manifest.version) {
      errors.push('Manifest missing version');
    }

    // Check package size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (packageData.length > maxSize) {
      errors.push(`Package size exceeds ${maxSize} bytes`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Security scan (simplified)
   */
  private async securityScan(packageData: Buffer): Promise<{ passed: boolean; issues: string[] }> {
    const issues: string[] = [];

    // In production, use proper security scanning
    // For now, just check for basic patterns
    const content = packageData.toString('utf-8', 0, Math.min(10000, packageData.length));

    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /process\.exit/i,
      /require\s*\(\s*['"]child_process['"]/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        issues.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Save plugin package to filesystem
   */
  private async savePluginPackage(packageData: Buffer, manifest: any): Promise<string> {
    const pluginId = `${manifest.name}@${manifest.version}`;
    const pluginDir = path.join(this.pluginsDir, manifest.name);

    // Create plugin directory
    await fs.mkdir(pluginDir, { recursive: true });

    // In production, extract ZIP and save files
    // For now, just save the package
    const packagePath = path.join(pluginDir, 'package.zip');
    await fs.writeFile(packagePath, packageData);

    return pluginId;
  }

  /**
   * Check if user has purchased plugin
   */
  private async checkPurchase(userId: string, pluginId: string): Promise<boolean> {
    // In production, check payment records
    // For now, return false
    return false;
  }

  /**
   * Notify review team
   */
  private async notifyReviewTeam(marketplacePluginId: string): Promise<void> {
    // In production, send notification to review team
    this.logger.info(`Review notification: plugin ${marketplacePluginId} needs review`);
  }

  /**
   * Map Prisma model to MarketplacePlugin
   */
  private mapToMarketplacePlugin(plugin: any): MarketplacePlugin {
    return {
      id: plugin.id,
      pluginId: plugin.pluginId,
      developerId: plugin.developerId,
      name: plugin.name,
      description: plugin.description,
      category: plugin.category,
      price: Number(plugin.price),
      isVerified: plugin.isVerified,
      isPublished: plugin.isPublished,
      downloadCount: plugin.downloadCount,
      rating: Number(plugin.rating),
      reviewCount: plugin.reviewCount,
      createdAt: plugin.createdAt,
      updatedAt: plugin.updatedAt
    };
  }
}

