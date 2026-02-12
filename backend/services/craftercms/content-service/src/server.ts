import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { json, urlencoded } from 'body-parser';
import { Logger } from '@mnbara/shared-utils';
import { EventBus } from '@mnbara/event-bus';
import { ContentController } from './controllers/ContentController';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';
import { requestLogger } from './middleware/requestLogger';
import { validateContentType } from './middleware/validateContentType';

/**
 * CrafterCMS Content Service
 * Main service for content management and personalization
 */
export class ContentService {
  private app: express.Application;
  private logger: Logger;
  private contentController: ContentController;
  private eventBus: EventBus;
  private server: any;

  constructor() {
    this.app = express();
    this.logger = new Logger('ContentService');
    
    // Initialize event bus
    this.eventBus = new EventBus({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      }
    });

    // Initialize content controller
    this.contentController = new ContentController({
      crafterCMS: {
        studioUrl: process.env.CRAFTER_STUDIO_URL || 'http://localhost:8080',
        engineUrl: process.env.CRAFTER_ENGINE_URL || 'http://localhost:8081',
        authToken: process.env.CRAFTER_AUTH_TOKEN,
      },
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
      eventBus: this.eventBus,
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS middleware
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(json({ limit: '10mb' }));
    this.app.use(urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use(requestLogger);

    // Health check endpoint (before auth)
    this.app.get('/health', (req, res) => {
      this.contentController.healthCheck(req, res);
    });

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        service: 'CrafterCMS Content Service',
        version: '1.0.0',
        endpoints: this.getApiEndpoints(),
        documentation: '/api/docs',
        health: '/health'
      });
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Content routes
    const contentRouter = express.Router();
    
    // Apply authentication middleware to content routes
    contentRouter.use(authMiddleware);

    // Content retrieval
    contentRouter.get('/sites/:siteId/content/*', (req, res) => {
      // Extract path from wildcard
      req.params.path = req.params[0];
      this.contentController.getContent(req, res);
    });

    // Personalized content
    contentRouter.post('/sites/:siteId/content/:contentId/personalize', (req, res) => {
      this.contentController.getPersonalizedContent(req, res);
    });

    // Content search
    contentRouter.post('/sites/:siteId/search', (req, res) => {
      this.contentController.searchContent(req, res);
    });

    // Content tree
    contentRouter.get('/sites/:siteId/tree', (req, res) => {
      this.contentController.getContentTree(req, res);
    });

    // Content management (requires higher permissions)
    contentRouter.put('/sites/:siteId/content/*', validateContentType, (req, res) => {
      req.params.path = req.params[0];
      this.contentController.updateContent(req, res);
    });

    contentRouter.post('/sites/:siteId/content/batch-update', (req, res) => {
      this.contentController.batchUpdateContent(req, res);
    });

    contentRouter.delete('/sites/:siteId/content/*', (req, res) => {
      req.params.path = req.params[0];
      this.contentController.deleteContent(req, res);
    });

    // Publishing
    contentRouter.post('/sites/:siteId/publish', (req, res) => {
      this.contentController.publishContent(req, res);
    });

    contentRouter.get('/sites/:siteId/publishing-targets', (req, res) => {
      this.contentController.getPublishingTargets(req, res);
    });

    // Personalized recommendations
    contentRouter.post('/sites/:siteId/recommendations', (req, res) => {
      this.contentController.getPersonalizedRecommendations(req, res);
    });

    // Content versions
    contentRouter.get('/sites/:siteId/content/:path/versions', (req, res) => {
      this.contentController.getContentVersions(req, res);
    });

    contentRouter.post('/sites/:siteId/content/:path/revert', (req, res) => {
      this.contentController.revertContent(req, res);
    });

    // Mount content router
    this.app.use('/api/v1/content', contentRouter);

    // Webhook endpoints (no auth)
    this.app.post('/webhooks/content-updated', (req, res) => {
      this.handleContentWebhook(req, res);
    });

    this.app.post('/webhooks/index-updated', (req, res) => {
      this.handleIndexWebhook(req, res);
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route not found: ${req.method} ${req.originalUrl}`
        }
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Handle content webhook
   */
  private async handleContentWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { event, data } = req.body;
      
      this.logger.info(`Received content webhook: ${event}`, data);

      // Handle different webhook events
      switch (event) {
        case 'content.updated':
          await this.handleContentUpdated(data);
          break;
        case 'content.published':
          await this.handleContentPublished(data);
          break;
        case 'content.deleted':
          await this.handleContentDeleted(data);
          break;
        default:
          this.logger.warn(`Unknown webhook event: ${event}`);
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      this.logger.error('Failed to process content webhook', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Handle index webhook
   */
  private async handleIndexWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { event, data } = req.body;
      
      this.logger.info(`Received index webhook: ${event}`, data);

      // Handle index-related events
      switch (event) {
        case 'index.updated':
          await this.handleIndexUpdated(data);
          break;
        case 'index.rebuilt':
          await this.handleIndexRebuilt(data);
          break;
        default:
          this.logger.warn(`Unknown index webhook event: ${event}`);
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      this.logger.error('Failed to process index webhook', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Handle content updated event
   */
  private async handleContentUpdated(data: any): Promise<void> {
    // Clear relevant caches
    const { siteId, path } = data;
    await this.contentController['contentFetcher'].clearContentCache(siteId, path);
    
    // Publish event to event bus
    await this.eventBus.publish({
      type: 'content.updated',
      source: 'content-service',
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle content published event
   */
  private async handleContentPublished(data: any): Promise<void> {
    // Clear site cache to ensure fresh content
    const { siteId } = data;
    await this.contentController['contentFetcher'].clearSiteCache(siteId);
    
    // Publish event to event bus
    await this.eventBus.publish({
      type: 'content.published',
      source: 'content-service',
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle content deleted event
   */
  private async handleContentDeleted(data: any): Promise<void> {
    const { siteId, path } = data;
    await this.contentController['contentFetcher'].clearContentCache(siteId, path);
    
    // Publish event to event bus
    await this.eventBus.publish({
      type: 'content.deleted',
      source: 'content-service',
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle index updated event
   */
  private async handleIndexUpdated(data: any): Promise<void> {
    // Clear search result caches
    const { siteId } = data;
    await this.contentController['cacheService'].deletePattern(`search:${siteId}:*`);
    
    this.logger.info(`Cleared search caches for site: ${siteId}`);
  }

  /**
   * Handle index rebuilt event
   */
  private async handleIndexRebuilt(data: any): Promise<void> {
    // Clear all content caches for the site
    const { siteId } = data;
    await this.contentController['cacheService'].deletePattern(`*:${siteId}:*`);
    
    this.logger.info(`Cleared all caches for site: ${siteId} after index rebuild`);
  }

  /**
   * Get API endpoints documentation
   */
  private getApiEndpoints(): any[] {
    return [
      {
        method: 'GET',
        path: '/api/v1/content/sites/:siteId/content/*',
        description: 'Get content by path',
        parameters: {
          path: 'Content path (wildcard)',
          query: ['skipCache', 'allowStale', 'locale']
        }
      },
      {
        method: 'POST',
        path: '/api/v1/content/sites/:siteId/content/:contentId/personalize',
        description: 'Get personalized content',
        body: {
          userProfile: 'User profile object',
          context: 'Personalization context (optional)'
        }
      },
      {
        method: 'POST',
        path: '/api/v1/content/sites/:siteId/search',
        description: 'Search content',
        body: {
          query: 'Search query',
          filters: 'Search filters (optional)',
          sort: 'Sort options (optional)',
          limit: 'Result limit (optional)',
          offset: 'Result offset (optional)'
        }
      },
      {
        method: 'GET',
        path: '/api/v1/content/sites/:siteId/tree',
        description: 'Get content tree',
        parameters: {
          query: ['path', 'depth', 'locale', 'skipCache']
        }
      },
      {
        method: 'PUT',
        path: '/api/v1/content/sites/:siteId/content/*',
        description: 'Update content',
        body: {
          contentType: 'Content type',
          content: 'Content data',
          metadata: 'Content metadata (optional)',
          locale: 'Content locale (optional)',
          validate: 'Validate content (optional)',
          publish: 'Auto-publish (optional)',
          target: 'Publishing target (optional)'
        }
      },
      {
        method: 'POST',
        path: '/api/v1/content/sites/:siteId/publish',
        description: 'Publish content',
        body: {
          paths: 'Array of content paths',
          target: 'Publishing target',
          scheduledDate: 'Scheduled publish date (optional)',
          submissionComment: 'Publish comment (optional)'
        }
      },
      {
        method: 'POST',
        path: '/api/v1/content/sites/:siteId/recommendations',
        description: 'Get personalized recommendations',
        body: {
          userProfile: 'User profile object',
          limit: 'Recommendation limit (optional)',
          contentTypes: 'Filter by content types (optional)',
          excludeIds: 'Exclude content IDs (optional)',
          context: 'Personalization context (optional)'
        }
      }
    ];
  }

  /**
   * Start the server
   */
  async start(port: number = 3002): Promise<void> {
    try {
      // Test connections
      await this.eventBus.connect();
      this.logger.info('Event bus connected');

      // Start server
      this.server = this.app.listen(port, () => {
        this.logger.info(`Content service started on port ${port}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      this.logger.error('Failed to start content service', error);
      throw error;
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('Content service stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down content service...');
    
    try {
      await this.stop();
      await this.eventBus.disconnect();
      await this.contentController['cacheService'].close();
      
      this.logger.info('Content service shutdown complete');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown', error);
      process.exit(1);
    }
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  const service = new ContentService();
  const port = parseInt(process.env.PORT || '3002');
  
  service.start(port).catch((error) => {
    console.error('Failed to start content service:', error);
    process.exit(1);
  });
}