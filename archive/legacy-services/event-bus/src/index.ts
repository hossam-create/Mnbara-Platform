// ============================================================
// Enhanced Event Bus Service - Main Entry Point
// ============================================================

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { EnhancedEventBus } from './EnhancedEventBus';
import { RedisClient } from './utils/redis-client';
import { WinstonLogger } from './utils/logger';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { createRateLimiter } from '../../api-gateway/src/middleware/rate-limiter.middleware';
import { 
  defaultEventBusConfiguration,
  defaultEventRoutingRules,
  defaultEventValidationRules,
  defaultEventRetentionPolicies,
  defaultEventIndexingConfig,
  defaultEventAnalyticsConfig
} from './EventBusConfiguration';
import { 
  BaseEvent, 
  EventCategory, 
  EventPriority,
  UserEvent,
  WalletEvent,
  PluginEvent,
  StreamEvent,
  StreamChatEvent,
  StreamAuctionEvent
} from './events/EventTaxonomy';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3017;

// Initialize dependencies
const prisma = new PrismaClient();
const logger = new WinstonLogger('enhanced-event-bus');
const redis = new RedisClient(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize enhanced event bus
const eventBus = new EnhancedEventBus({
  redis,
  logger,
  enableValidation: true,
  enableRouting: true,
  enableAnalytics: true,
  enableRetention: true,
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 100,
  flushInterval: 5000
});

// Load default configuration
defaultEventRoutingRules.forEach(rule => eventBus.addRoutingRule(rule));
defaultEventValidationRules.forEach(rule => eventBus.addValidationRule(rule));
defaultEventRetentionPolicies.forEach(policy => eventBus.addRetentionPolicy(policy));

// Middleware
app.use(express.json());

// Rate limiting
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  routePrefix: 'event-bus-general'
});

const publishRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  routePrefix: 'event-bus-publish'
});

app.use(generalRateLimiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    const databaseHealthy = await prisma.$queryRaw`SELECT 1`;
    const redisHealthy = await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: databaseHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
        eventBus: 'healthy'
      },
      stats: await eventBus.getEventStats()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Event publishing endpoint
app.post('/api/events/publish', authMiddleware, publishRateLimiter, async (req, res) => {
  try {
    const { type, category, userId, sessionId, ipAddress, userAgent, metadata, tags, priority } = req.body;
    
    // Validate required fields
    if (!type || !category) {
      return res.status(400).json({
        success: false,
        error: 'Event type and category are required'
      });
    }

    // Create base event
    const event: BaseEvent = {
      id: uuidv4(),
      type,
      category,
      timestamp: new Date(),
      userId: userId || (req as any).user?.id,
      sessionId,
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.get('User-Agent'),
      metadata: {
        ...metadata,
        correlationId: metadata?.correlationId || uuidv4(),
        source: 'api',
        apiVersion: 'v1'
      },
      tags: tags || [],
      priority: priority || EventPriority.MEDIUM
    };

    // Publish event
    const result = await eventBus.publish(event);

    if (result.success) {
      res.json({
        success: true,
        data: {
          eventId: result.eventId,
          processedAt: result.processedAt
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Event validation failed',
        details: result.errors
      });
    }
  } catch (error: any) {
    logger.error('Failed to publish event', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to publish event'
    });
  }
});

// Batch event publishing
app.post('/api/events/publish/batch', authMiddleware, publishRateLimiter, async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Events array is required and must not be empty'
      });
    }

    if (events.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 events per batch allowed'
      });
    }

    const results = await Promise.all(
      events.map(async (eventData) => {
        const event: BaseEvent = {
          id: uuidv4(),
          type: eventData.type,
          category: eventData.category,
          timestamp: new Date(),
          userId: eventData.userId || (req as any).user?.id,
          sessionId: eventData.sessionId,
          ipAddress: eventData.ipAddress || req.ip,
          userAgent: eventData.userAgent || req.get('User-Agent'),
          metadata: {
            ...eventData.metadata,
            correlationId: eventData.metadata?.correlationId || uuidv4(),
            source: 'api-batch',
            apiVersion: 'v1'
          },
          tags: eventData.tags || [],
          priority: eventData.priority || EventPriority.MEDIUM
        };

        return await eventBus.publish(event);
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        total: results.length,
        successful,
        failed,
        results: results.map(r => ({
          success: r.success,
          eventId: r.eventId,
          errors: r.errors
        }))
      }
    });
  } catch (error: any) {
    logger.error('Failed to publish batch events', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to publish batch events'
    });
  }
});

// Event subscription endpoint
app.post('/api/events/subscribe', authMiddleware, async (req, res) => {
  try {
    const { eventTypes, filter, priority, maxConcurrency } = req.body;
    
    if (!Array.isArray(eventTypes) || eventTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Event types array is required'
      });
    }

    // Create webhook URL for subscription
    const webhookUrl = req.body.webhookUrl || `${req.protocol}://${req.get('host')}/api/events/webhook`;
    
    // Create subscription
    const subscriptionId = await eventBus.subscribe(
      eventTypes,
      async (event, metadata) => {
        // Send to webhook
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Event-Id': metadata.eventId,
              'X-Event-Type': event.type,
              'X-Event-Category': event.category,
              'X-Event-Priority': metadata.priority
            },
            body: JSON.stringify({ event, metadata })
          });
        } catch (error) {
          logger.error('Failed to send webhook', error, { subscriptionId, eventType: event.type });
        }
      },
      {
        filter: filter ? (event, metadata) => {
          // Simple filter implementation
          if (filter.userId && event.userId !== filter.userId) return false;
          if (filter.priority && metadata.priority !== filter.priority) return false;
          return true;
        } : undefined,
        priority: priority as EventPriority,
        maxConcurrency: maxConcurrency || 10
      }
    );

    res.json({
      success: true,
      data: {
        subscriptionId,
        webhookUrl,
        eventTypes,
        filter,
        priority
      }
    });
  } catch (error: any) {
    logger.error('Failed to create subscription', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription'
    });
  }
});

// Event replay endpoint
app.post('/api/events/replay', authMiddleware, async (req, res) => {
  try {
    const { startTime, endTime, eventTypes, categories, handler } = req.body;
    
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Start time and end time are required'
      });
    }

    const result = await eventBus.replayEvents({
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      eventTypes,
      categories,
      handler: async (event, metadata) => {
        // Send to handler webhook
        if (handler?.webhookUrl) {
          try {
            await fetch(handler.webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Event-Id': metadata.eventId,
                'X-Event-Type': event.type,
                'X-Event-Category': event.category,
                'X-Event-Priority': metadata.priority
              },
              body: JSON.stringify({ event, metadata })
            });
          } catch (error) {
            logger.error('Failed to send replay webhook', error, { eventType: event.type });
          }
        }
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to replay events', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to replay events'
    });
  }
});

// Event statistics endpoint
app.get('/api/events/stats', authMiddleware, async (req, res) => {
  try {
    const { category, eventType, startDate, endDate, userId } = req.query;
    
    const stats = await eventBus.getEventStats({
      category: category as EventCategory,
      eventType: eventType as string,
      timeRange: startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined,
      userId: userId as string
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Failed to get event stats', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get event stats'
    });
  }
});

// Configuration endpoints
app.get('/api/events/config', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        routingRules: defaultEventRoutingRules,
        validationRules: defaultEventValidationRules,
        retentionPolicies: defaultEventRetentionPolicies,
        indexingConfig: defaultEventIndexingConfig,
        analyticsConfig: defaultEventAnalyticsConfig
      }
    });
  } catch (error: any) {
    logger.error('Failed to get configuration', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get configuration'
    });
  }
});

// Event cleanup endpoint
app.post('/api/events/cleanup', authMiddleware, async (req, res) => {
  try {
    await eventBus.cleanupExpiredEvents();
    
    res.json({
      success: true,
      message: 'Event cleanup completed successfully'
    });
  } catch (error: any) {
    logger.error('Failed to cleanup events', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup events'
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redis.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Enhanced Event Bus Service running on port ${PORT}`);
});

export default app;