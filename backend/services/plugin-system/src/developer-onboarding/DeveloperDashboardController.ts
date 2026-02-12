// ============================================================
// Developer Dashboard Controller - Phase 3 Developer Portal
// ============================================================

import { Request, Response } from 'express';
import { DeveloperOnboardingService } from './DeveloperOnboardingService';
import { PluginDocumentationService } from './PluginDocumentationService';
import { PluginMarketplaceAPI } from '../marketplace/PluginMarketplaceAPI';
import { Logger } from '../utils/logger';
import { AuthRequest } from '../../shared/middleware/auth.middleware';

export class DeveloperDashboardController {
  private onboardingService: DeveloperOnboardingService;
  private documentationService: PluginDocumentationService;
  private marketplace: PluginMarketplaceAPI;
  private logger: Logger;

  constructor(
    onboardingService: DeveloperOnboardingService,
    documentationService: PluginDocumentationService,
    marketplace: PluginMarketplaceAPI,
    logger: Logger
  ) {
    this.onboardingService = onboardingService;
    this.documentationService = documentationService;
    this.marketplace = marketplace;
    this.logger = logger;
  }

  /**
   * GET /api/developers/dashboard
   * Get developer dashboard overview
   */
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const developerId = req.user?.id;

      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      // Get developer stats
      const stats = await this.onboardingService.getDeveloperStats(developerId);
      
      // Get developer profile
      const profile = await this.onboardingService.getDeveloperProfile(developerId);

      // Get recent plugins
      const recentPlugins = await this.marketplace.getDeveloperPlugins(developerId, 5, 0);

      // Get recent reviews
      const recentReviews = await this.marketplace.getDeveloperReviews(developerId, 5, 0);

      res.json({
        success: true,
        data: {
          profile,
          stats,
          recentPlugins: recentPlugins.plugins,
          recentReviews: recentReviews.reviews,
          dashboard: {
            totalRevenue: this.calculateTotalRevenue(recentPlugins.plugins),
            monthlyDownloads: this.calculateMonthlyDownloads(recentPlugins.plugins),
            topRatedPlugin: this.getTopRatedPlugin(recentPlugins.plugins),
            needsAttention: this.getPluginsNeedingAttention(recentPlugins.plugins)
          }
        }
      });
    } catch (error: any) {
      this.logger.error('Failed to get developer dashboard', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get dashboard'
      });
    }
  }

  /**
   * GET /api/developers/plugins
   * Get all developer plugins with analytics
   */
  async getDeveloperPlugins(req: AuthRequest, res: Response): Promise<void> {
    try {
      const developerId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const offset = (page - 1) * limit;
      
      const result = await this.marketplace.getDeveloperPlugins(
        developerId, 
        limit, 
        offset,
        status
      );

      // Enhance with additional analytics
      const enhancedPlugins = await Promise.all(
        result.plugins.map(async (plugin: any) => {
          const analytics = await this.getPluginAnalytics(plugin.id);
          const documentation = await this.documentationService.getDocumentation(plugin.id);
          
          return {
            ...plugin,
            analytics,
            hasDocumentation: !!documentation,
            documentationPublished: documentation?.isPublished || false
          };
        })
      );

      res.json({
        success: true,
        data: {
          plugins: enhancedPlugins,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit)
          }
        }
      });
    } catch (error: any) {
      this.logger.error('Failed to get developer plugins', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get plugins'
      });
    }
  }

  /**
   * GET /api/developers/analytics
   * Get developer analytics
   */
  async getAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const developerId = req.user?.id;
      const timeRange = req.query.range as string || '30d';

      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const analytics = await this.getDeveloperAnalytics(developerId, timeRange);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      this.logger.error('Failed to get developer analytics', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get analytics'
      });
    }
  }

  /**
   * GET /api/developers/documentation/templates
   * Get documentation templates
   */
  async getDocumentationTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const templates = await this.documentationService.getDocumentationTemplates();

      res.json({
        success: true,
        data: templates
      });
    } catch (error: any) {
      this.logger.error('Failed to get documentation templates', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get templates'
      });
    }
  }

  /**
   * POST /api/developers/documentation/search
   * Search documentation
   */
  async searchDocumentation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, category, limit } = req.body;

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      const results = await this.documentationService.searchDocumentation(
        query,
        category,
        limit
      );

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      this.logger.error('Failed to search documentation', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search documentation'
      });
    }
  }

  /**
   * GET /api/developers/support/tickets
   * Get support tickets
   */
  async getSupportTickets(req: AuthRequest, res: Response): Promise<void> {
    try {
      const developerId = req.user?.id;
      const status = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      // TODO: Implement support ticket system
      // For now, return empty result
      res.json({
        success: true,
        data: {
          tickets: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        }
      });
    } catch (error: any) {
      this.logger.error('Failed to get support tickets', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get tickets'
      });
    }
  }

  private calculateTotalRevenue(plugins: any[]): number {
    return plugins.reduce((total, plugin) => {
      return total + (plugin.totalRevenue || 0);
    }, 0);
  }

  private calculateMonthlyDownloads(plugins: any[]): number {
    return plugins.reduce((total, plugin) => {
      return total + (plugin.monthlyDownloads || 0);
    }, 0);
  }

  private getTopRatedPlugin(plugins: any[]): any | null {
    if (plugins.length === 0) return null;
    
    return plugins.reduce((top, plugin) => {
      return (plugin.rating || 0) > (top.rating || 0) ? plugin : top;
    }, plugins[0]);
  }

  private getPluginsNeedingAttention(plugins: any[]): any[] {
    return plugins.filter(plugin => {
      const needsDocs = !plugin.hasDocumentation;
      const lowRating = (plugin.rating || 0) < 3.0;
      const noRecentUpdates = this.isOldPlugin(plugin.updatedAt);
      
      return needsDocs || lowRating || noRecentUpdates;
    });
  }

  private isOldPlugin(updatedAt: Date): boolean {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(updatedAt) < sixMonthsAgo;
  }

  private async getPluginAnalytics(pluginId: string): Promise<any> {
    // TODO: Implement detailed plugin analytics
    // For now, return mock data
    return {
      views: Math.floor(Math.random() * 1000),
      downloads: Math.floor(Math.random() * 100),
      installs: Math.floor(Math.random() * 50),
      uninstalls: Math.floor(Math.random() * 10),
      revenue: Math.floor(Math.random() * 1000)
    };
  }

  private async getDeveloperAnalytics(developerId: string, timeRange: string): Promise<any> {
    // TODO: Implement comprehensive developer analytics
    // For now, return mock data
    return {
      overview: {
        totalPlugins: 5,
        totalDownloads: 1250,
        totalRevenue: 5000,
        averageRating: 4.2
      },
      trends: {
        downloads: this.generateTrendData(30),
        revenue: this.generateTrendData(30),
        ratings: this.generateTrendData(30)
      },
      topPlugins: [
        { name: 'Sample Plugin 1', downloads: 500, revenue: 2000 },
        { name: 'Sample Plugin 2', downloads: 300, revenue: 1500 }
      ],
      demographics: {
        countries: [{ name: 'USA', value: 40 }, { name: 'UK', value: 25 }],
        categories: [{ name: 'Analytics', value: 30 }, { name: 'Payments', value: 20 }]
      }
    };
  }

  private generateTrendData(days: number): any[] {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 100) + 10
      });
    }
    
    return data;
  }
}