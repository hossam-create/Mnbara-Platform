// ============================================================
// Plugin Controller - HTTP endpoints
// ============================================================

import { Request, Response } from 'express';
import { PluginManager } from '../core/PluginManager';
import { PluginRegistry } from '../core/PluginRegistry';
import { PluginMarketplaceAPI } from '../marketplace/PluginMarketplaceAPI';
import { Logger } from '../utils/logger';

export class PluginController {
  private manager: PluginManager;
  private registry: PluginRegistry;
  private marketplace: PluginMarketplaceAPI;
  private logger: Logger;

  constructor(
    manager: PluginManager,
    registry: PluginRegistry,
    marketplace: PluginMarketplaceAPI,
    logger: Logger
  ) {
    this.manager = manager;
    this.registry = registry;
    this.marketplace = marketplace;
    this.logger = logger;
  }

  /**
   * GET /api/plugins
   * List all plugins
   */
  async listPlugins(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        category: req.query.category as any,
        verified: req.query.verified === 'true' ? true : undefined,
        published: req.query.published === 'true' ? true : undefined,
        minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        search: req.query.search as string
      };

      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const result = await this.marketplace.listPlugins(filters, limit, offset);

      res.json({
        success: true,
        data: result.plugins,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total
        }
      });
    } catch (error: any) {
      this.logger.error('Failed to list plugins', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/plugins/:id
   * Get plugin details
   */
  async getPlugin(req: Request, res: Response): Promise<void> {
    try {
      const plugin = await this.marketplace.getPlugin(req.params.id);

      if (!plugin) {
        res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
        return;
      }

      res.json({
        success: true,
        data: plugin
      });
    } catch (error: any) {
      this.logger.error(`Failed to get plugin: ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/plugins/:id/install
   * Install plugin
   */
  async installPlugin(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID required'
        });
        return;
      }

      const result = await this.marketplace.installPlugin(userId, req.params.id);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        data: {
          installationId: result.installationId
        }
      });
    } catch (error: any) {
      this.logger.error(`Failed to install plugin: ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/plugins/:id/uninstall
   * Uninstall plugin
   */
  async uninstallPlugin(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID required'
        });
        return;
      }

      const result = await this.marketplace.uninstallPlugin(userId, req.params.id);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true
      });
    } catch (error: any) {
      this.logger.error(`Failed to uninstall plugin: ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/plugins/submit
   * Submit new plugin
   */
  async submitPlugin(req: Request, res: Response): Promise<void> {
    try {
      const developerId = (req as any).user?.id || req.body.developerId;
      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Developer ID required'
        });
        return;
      }

      // In production, handle file upload properly
      const submission = {
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        price: Number(req.body.price) || 0,
        pluginPackage: Buffer.from(req.body.package || '', 'base64'),
        manifest: req.body.manifest
      };

      const result = await this.marketplace.submitPlugin(developerId, submission);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          pluginId: result.pluginId
        }
      });
    } catch (error: any) {
      this.logger.error('Failed to submit plugin', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/plugins/:id/reviews
   * Add plugin review
   */
  async addReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID required'
        });
        return;
      }

      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
        return;
      }

      const result = await this.marketplace.addReview(req.params.id, userId, rating, comment);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true
      });
    } catch (error: any) {
      this.logger.error(`Failed to add review: ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/plugins/:id/config
   * Get plugin configuration
   */
  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const plugin = await this.registry.getPlugin(req.params.id);
      if (!plugin) {
        res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
        return;
      }

      // Get configs (without secrets)
      // In production, filter based on user permissions
      res.json({
        success: true,
        data: {
          pluginId: plugin.id,
          config: {} // Should fetch from database
        }
      });
    } catch (error: any) {
      this.logger.error(`Failed to get config: ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/plugins/:id/config
   * Update plugin configuration
   */
  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID required'
        });
        return;
      }

      // Update config
      // In production, validate config against manifest
      res.json({
        success: true,
        message: 'Config updated'
      });
    } catch (error: any) {
      this.logger.error(`Failed to update config: ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

