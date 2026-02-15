import { Request, Response } from 'express';
import { CrafterCMSClient } from '../craftercms-client/CrafterCMSClient';
import { ContentFetcher } from '../craftercms-client/ContentFetcher';
import { ContentUpdater } from '../craftercms-client/ContentUpdater';
import { PersonalizationEngine } from '../craftercms-client/PersonalizationEngine';
import { CacheService } from '../services/CacheService';
import { EventBus } from '@mnbara/event-bus';
import { Logger } from '@mnbara/shared-utils';
import { ContentItem, ContentQuery, ContentUpdate, ContentFetchOptions } from '../types/Content.types';
import { UserProfile } from '../types/Personalization.types';

/**
 * Content Service Controller - Main API controller for CrafterCMS integration
 */
export class ContentController {
  private crafterClient: CrafterCMSClient;
  private contentFetcher: ContentFetcher;
  private contentUpdater: ContentUpdater;
  private personalizationEngine: PersonalizationEngine;
  private cacheService: CacheService;
  private eventBus: EventBus;
  private logger: Logger;

  constructor(config: {
    crafterCMS: {
      studioUrl: string;
      engineUrl: string;
      authToken?: string;
    };
    redis: {
      url: string;
    };
    eventBus: EventBus;
  }) {
    this.logger = new Logger('ContentController');
    
    // Initialize services
    this.crafterClient = new CrafterCMSClient({
      studioUrl: config.crafterCMS.studioUrl,
      engineUrl: config.crafterCMS.engineUrl,
      authToken: config.crafterCMS.authToken,
    });

    this.cacheService = new CacheService(config.redis.url);
    this.eventBus = config.eventBus;

    this.contentFetcher = new ContentFetcher(this.crafterClient, this.cacheService);
    this.contentUpdater = new ContentUpdater(this.crafterClient, this.eventBus, this.cacheService);
    this.personalizationEngine = new PersonalizationEngine(this.crafterClient, this.cacheService);
  }

  /**
   * Get content by path
   */
  async getContent(req: Request, res: Response): Promise<void> {
    try {
      const { siteId, path } = req.params;
      const options: ContentFetchOptions = {
        skipCache: req.query.skipCache === 'true',
        allowStale: req.query.allowStale === 'true',
        locale: req.query.locale as string,
      };

      this.logger.info(`Getting content: ${path} from site: ${siteId}`);
      
      const content = await this.contentFetcher.fetchContent(siteId, path, options);
      
      if (!content) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: `Content not found: ${path}`
          }
        });
        return;
      }

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      this.logger.error(`Failed to get content: ${req.params.path}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get personalized content
   */
  async getPersonalizedContent(req: Request, res: Response): Promise<void> {
    try {
      const { siteId, contentId } = req.params;
      const userProfile: UserProfile = req.body.userProfile;
      const context = req.body.context || {};

      if (!userProfile) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'User profile is required for personalization'
          }
        });
        return;
      }

      this.logger.info(`Getting personalized content: ${contentId} for user: ${userProfile.id}`);
      
      const personalizedContent = await this.personalizationEngine.personalizeContent(
        siteId, 
        contentId, 
        userProfile, 
        context
      );

      res.json({
        success: true,
        data: personalizedContent
      });
    } catch (error) {
      this.logger.error(`Failed to get personalized content: ${req.params.contentId}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Search content
   */
  async searchContent(req: Request, res: Response): Promise<void> {
    try {
      const { siteId } = req.params;
      const query: ContentQuery = {
        query: req.body.query || req.query.q as string || '*',
        filters: req.body.filters || {},
        sort: req.body.sort || [{ field: 'lastModifiedOn', order: 'desc' }],
        limit: req.body.limit || parseInt(req.query.limit as string) || 20,
        offset: req.body.offset || parseInt(req.query.offset as string) || 0,
        locale: req.body.locale || req.query.locale as string,
      };

      this.logger.info(`Searching content in site: ${siteId} with query: ${query.query}`);
      
      const results = await this.contentFetcher.searchContent(siteId, query, {
        skipCache: req.query.skipCache === 'true',
      });

      res.json({
        success: true,
        data: results,
        pagination: {
          total: results.total,
          limit: query.limit,
          offset: query.offset,
          hasNext: results.total > query.offset + query.limit,
          hasPrevious: query.offset > 0
        }
      });
    } catch (error) {
      this.logger.error(`Failed to search content in site: ${req.params.siteId}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get content tree
   */
  async getContentTree(req: Request, res: Response): Promise<void> {
    try {
      const { siteId } = req.params;
      const path = req.query.path as string || '/';
      const depth = parseInt(req.query.depth as string) || 3;

      this.logger.info(`Getting content tree: ${path} (depth: ${depth}) from site: ${siteId}`);
      
      const tree = await this.contentFetcher.fetchContentTree(siteId, path, depth, {
        skipCache: req.query.skipCache === 'true',
        locale: req.query.locale as string,
      });

      res.json({
        success: true,
        data: tree
      });
    } catch (error) {
      this.logger.error(`Failed to get content tree: ${req.query.path}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Update content
   */
  async updateContent(req: Request, res: Response): Promise<void> {
    try {
      const { siteId, path } = req.params;
      const contentUpdate: ContentUpdate = {
        path,
        contentType: req.body.contentType,
        content: req.body.content,
        metadata: req.body.metadata,
        locale: req.body.locale,
        commitMessage: req.body.commitMessage,
      };

      const options = {
        validate: req.body.validate !== false,
        publish: req.body.publish === true,
        target: req.body.target,
        userId: req.user?.id,
      };

      this.logger.info(`Updating content: ${path} in site: ${siteId}`);
      
      const updatedContent = await this.contentUpdater.updateContent(
        siteId, 
        contentUpdate, 
        options
      );

      res.json({
        success: true,
        data: updatedContent
      });
    } catch (error) {
      this.logger.error(`Failed to update content: ${req.params.path}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Batch update content
   */
  async batchUpdateContent(req: Request, res: Response): Promise<void> {
    try {
      const { siteId } = req.params;
      const updates: ContentUpdate[] = req.body.updates;
      const options = {
        validate: req.body.validate !== false,
        publish: req.body.publish === true,
        target: req.body.target,
        userId: req.user?.id,
      };

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Updates array is required and cannot be empty'
          }
        });
        return;
      }

      this.logger.info(`Batch updating ${updates.length} content items in site: ${siteId}`);
      
      const results = await this.contentUpdater.batchUpdateContent(
        siteId, 
        updates, 
        options
      );

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      this.logger.error(`Failed to batch update content in site: ${req.params.siteId}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Delete content
   */
  async deleteContent(req: Request, res: Response): Promise<void> {
    try {
      const { siteId, path } = req.params;
      const options = {
        submissionComment: req.body.submissionComment,
        userId: req.user?.id,
        softDelete: req.body.softDelete === true,
      };

      this.logger.info(`Deleting content: ${path} from site: ${siteId}`);
      
      const success = await this.contentUpdater.deleteContent(siteId, path, options);

      if (success) {
        res.json({
          success: true,
          message: 'Content deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: `Content not found: ${path}`
          }
        });
      }
    } catch (error) {
      this.logger.error(`Failed to delete content: ${req.params.path}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Publish content
   */
  async publishContent(req: Request, res: Response): Promise<void> {
    try {
      const { siteId } = req.params;
      const paths: string[] = req.body.paths;
      const target: string = req.body.target;
      const scheduledDate = req.body.scheduledDate ? new Date(req.body.scheduledDate) : undefined;
      const submissionComment = req.body.submissionComment;
      const userId = req.user?.id;

      if (!paths || !Array.isArray(paths) || paths.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Paths array is required and cannot be empty'
          }
        });
        return;
      }

      if (!target) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Publishing target is required'
          }
        });
        return;
      }

      this.logger.info(`Publishing ${paths.length} content items to ${target} in site: ${siteId}`);
      
      const publishId = await this.contentUpdater.publishContent(
        siteId, 
        paths, 
        target, 
        userId, 
        scheduledDate, 
        submissionComment
      );

      res.json({
        success: true,
        data: {
          publishId,
          paths,
          target,
          scheduled: !!scheduledDate
        }
      });
    } catch (error) {
      this.logger.error(`Failed to publish content in site: ${req.params.siteId}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { siteId } = req.params;
      const userProfile: UserProfile = req.body.userProfile;
      const options = {
        limit: req.body.limit || 10,
        contentTypes: req.body.contentTypes,
        excludeIds: req.body.excludeIds,
        context: req.body.context || {},
      };

      if (!userProfile) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'User profile is required for recommendations'
          }
        });
        return;
      }

      this.logger.info(`Getting personalized recommendations for user: ${userProfile.id} in site: ${siteId}`);
      
      const recommendations = await this.personalizationEngine.getPersonalizedRecommendations(
        siteId, 
        userProfile, 
        options
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      this.logger.error(`Failed to get personalized recommendations for user in site: ${req.params.siteId}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get content versions
   */
  async getContentVersions(req: Request, res: Response): Promise<void> {
    try {
      const { siteId, path } = req.params;

      this.logger.info(`Getting content versions for: ${path} in site: ${siteId}`);
      
      const versions = await this.crafterClient.getContentVersions(siteId, path);

      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      this.logger.error(`Failed to get content versions: ${req.params.path}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Revert content to version
   */
  async revertContent(req: Request, res: Response): Promise<void> {
    try {
      const { siteId, path } = req.params;
      const { commitId, submissionComment } = req.body;
      const userId = req.user?.id;

      if (!commitId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Commit ID is required for revert'
          }
        });
        return;
      }

      this.logger.info(`Reverting content: ${path} to commit: ${commitId} in site: ${siteId}`);
      
      const revertedContent = await this.contentUpdater.revertContent(
        siteId, 
        path, 
        commitId, 
        { userId, submissionComment }
      );

      res.json({
        success: true,
        data: revertedContent
      });
    } catch (error) {
      this.logger.error(`Failed to revert content: ${req.params.path}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get publishing targets
   */
  async getPublishingTargets(req: Request, res: Response): Promise<void> {
    try {
      const { siteId } = req.params;

      this.logger.info(`Getting publishing targets for site: ${siteId}`);
      
      const targets = await this.crafterClient.getPublishingTargets(siteId);

      res.json({
        success: true,
        data: targets
      });
    } catch (error) {
      this.logger.error(`Failed to get publishing targets for site: ${req.params.siteId}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = await this.crafterClient.healthCheck();
      const cacheHealthy = await this.cacheService.testConnection();

      const health = {
        status: isHealthy && cacheHealthy ? 'healthy' : 'unhealthy',
        services: {
          craftercms: isHealthy ? 'healthy' : 'unhealthy',
          cache: cacheHealthy ? 'healthy' : 'unhealthy',
        },
        timestamp: new Date().toISOString()
      };

      const statusCode = isHealthy && cacheHealthy ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      this.logger.error('Health check failed', error);
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}