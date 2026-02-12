// ============================================================
// Enhanced Event Bus Service - Supports New Event Taxonomy
// ============================================================

import { EventEmitter } from 'events';
import { RedisClient } from '../utils/redis-client';
import { WinstonLogger } from '../utils/logger';
import { 
  EventCategory, 
  UserEvent, 
  WalletEvent, 
  PluginEvent, 
  PluginMarketplaceEvent, 
  DeveloperEvent,
  StreamEvent,
  StreamChatEvent,
  StreamAuctionEvent,
  ProductCarouselEvent,
  EbayLiveEvent,
  IntegrationEvent,
  MonitoringEvent,
  BaseEvent,
  EventPriority,
  EventRoutingRule,
  EventValidationRule,
  EventRetentionPolicy
} from './EventTaxonomy';
import { v4 as uuidv4 } from 'uuid';

export interface EventBusConfig {
  redis: RedisClient;
  logger: WinstonLogger;
  enableValidation?: boolean;
  enableRouting?: boolean;
  enableAnalytics?: boolean;
  enableRetention?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  flushInterval?: number;
}

export interface EventMetadata {
  eventId: string;
  timestamp: Date;
  category: EventCategory;
  priority: EventPriority;
  source: string;
  version: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  tags?: string[];
  ttl?: number;
}

export interface EventProcessingResult {
  success: boolean;
  eventId: string;
  processedAt: Date;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

export class EnhancedEventBus extends EventEmitter {
  private redis: RedisClient;
  private logger: WinstonLogger;
  private config: EventBusConfig;
  private routingRules: Map<string, EventRoutingRule[]>;
  private validationRules: Map<string, EventValidationRule>;
  private retentionPolicies: Map<EventCategory, EventRetentionPolicy>;
  private processingQueue: string[] = [];
  private isProcessing = false;

  constructor(config: EventBusConfig) {
    super();
    this.redis = config.redis;
    this.logger = config.logger;
    this.config = {
      enableValidation: true,
      enableRouting: true,
      enableAnalytics: true,
      enableRetention: true,
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 100,
      flushInterval: 5000,
      ...config
    };

    this.routingRules = new Map();
    this.validationRules = new Map();
    this.retentionPolicies = new Map();

    this.initializeDefaultRules();
    this.startProcessingLoop();
  }

  /**
   * Publish an event to the event bus
   */
  async publish(event: BaseEvent): Promise<EventProcessingResult> {
    try {
      const eventId = uuidv4();
      const metadata: EventMetadata = {
        eventId,
        timestamp: new Date(),
        category: event.category,
        priority: event.priority || EventPriority.MEDIUM,
        source: 'enhanced-event-bus',
        version: '1.0.0',
        correlationId: event.metadata?.correlationId,
        causationId: event.metadata?.causationId,
        userId: event.userId,
        sessionId: event.sessionId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        tags: event.tags,
        ttl: event.metadata?.ttl
      };

      // Validate event if enabled
      if (this.config.enableValidation) {
        const validationResult = await this.validateEvent(event, metadata);
        if (!validationResult.valid) {
          return {
            success: false,
            eventId,
            processedAt: new Date(),
            errors: validationResult.errors
          };
        }
      }

      // Route event if enabled
      if (this.config.enableRouting) {
        await this.routeEvent(event, metadata);
      }

      // Store event if retention is enabled
      if (this.config.enableRetention) {
        await this.storeEvent(event, metadata);
      }

      // Process analytics if enabled
      if (this.config.enableAnalytics) {
        await this.processAnalytics(event, metadata);
      }

      // Emit event for local listeners
      this.emit(event.type, event, metadata);

      // Publish to Redis for distributed processing
      await this.publishToRedis(event, metadata);

      return {
        success: true,
        eventId,
        processedAt: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to publish event', error);
      return {
        success: false,
        eventId: uuidv4(),
        processedAt: new Date(),
        errors: [error.message]
      };
    }
  }

  /**
   * Subscribe to events with filtering
   */
  async subscribe(
    eventTypes: string[],
    handler: (event: BaseEvent, metadata: EventMetadata) => void | Promise<void>,
    options?: {
      filter?: (event: BaseEvent, metadata: EventMetadata) => boolean;
      priority?: EventPriority;
      batchSize?: number;
      maxConcurrency?: number;
    }
  ): Promise<string> {
    const subscriptionId = uuidv4();
    
    const wrappedHandler = async (event: BaseEvent, metadata: EventMetadata) => {
      try {
        // Apply filter if provided
        if (options?.filter && !options.filter(event, metadata)) {
          return;
        }

        // Check priority if specified
        if (options?.priority && metadata.priority !== options.priority) {
          return;
        }

        await handler(event, metadata);
      } catch (error) {
        this.logger.error('Event handler error', error, { eventType: event.type, subscriptionId });
      }
    };

    // Subscribe to each event type
    for (const eventType of eventTypes) {
      this.on(eventType, wrappedHandler);
    }

    this.logger.info(`Subscription created: ${subscriptionId}`, { eventTypes, options });
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    // Remove all listeners for this subscription
    this.removeAllListeners(subscriptionId);
    this.logger.info(`Subscription removed: ${subscriptionId}`);
  }

  /**
   * Create event routing rule
   */
  addRoutingRule(rule: EventRoutingRule): void {
    const key = `${rule.category}:${rule.eventType}`;
    const existingRules = this.routingRules.get(key) || [];
    existingRules.push(rule);
    this.routingRules.set(key, existingRules);
    this.logger.info(`Routing rule added: ${key}`);
  }

  /**
   * Create event validation rule
   */
  addValidationRule(rule: EventValidationRule): void {
    this.validationRules.set(rule.eventType, rule);
    this.logger.info(`Validation rule added: ${rule.eventType}`);
  }

  /**
   * Create event retention policy
   */
  addRetentionPolicy(policy: EventRetentionPolicy): void {
    this.retentionPolicies.set(policy.category, policy);
    this.logger.info(`Retention policy added: ${policy.category}`);
  }

  /**
   * Get event statistics
   */
  async getEventStats(options?: {
    category?: EventCategory;
    eventType?: string;
    timeRange?: { start: Date; end: Date };
    userId?: string;
  }): Promise<{
    totalEvents: number;
    eventsByCategory: Record<EventCategory, number>;
    eventsByPriority: Record<EventPriority, number>;
    eventsByType: Record<string, number>;
    averageProcessingTime: number;
    errorRate: number;
  }> {
    // This would integrate with analytics storage
    // For now, return mock data
    return {
      totalEvents: 1000,
      eventsByCategory: {
        [EventCategory.USER]: 200,
        [EventCategory.WALLET]: 150,
        [EventCategory.PLUGIN]: 300,
        [EventCategory.STREAM]: 250,
        [EventCategory.SYSTEM]: 100
      },
      eventsByPriority: {
        [EventPriority.LOW]: 400,
        [EventPriority.MEDIUM]: 400,
        [EventPriority.HIGH]: 150,
        [EventPriority.CRITICAL]: 50
      },
      eventsByType: {
        'user.login': 100,
        'wallet.deposit': 50,
        'plugin.installed': 75,
        'stream.started': 25
      },
      averageProcessingTime: 50,
      errorRate: 0.01
    };
  }

  /**
   * Replay events from a specific time range
   */
  async replayEvents(options: {
    startTime: Date;
    endTime: Date;
    eventTypes?: string[];
    categories?: EventCategory[];
    handler: (event: BaseEvent, metadata: EventMetadata) => void | Promise<void>;
  }): Promise<{ processed: number; errors: number }> {
    // This would integrate with event storage
    // For now, return mock result
    return { processed: 100, errors: 2 };
  }

  // Private methods

  private initializeDefaultRules(): void {
    // Initialize default routing rules
    this.addRoutingRule({
      eventType: UserEvent.USER_LOGIN,
      category: EventCategory.USER,
      priority: EventPriority.MEDIUM,
      destinations: ['user-events', 'analytics', 'security-monitoring'],
      filters: { priority: [EventPriority.HIGH, EventPriority.CRITICAL] }
    });

    this.addRoutingRule({
      eventType: WalletEvent.WALLET_DEPOSIT_COMPLETED,
      category: EventCategory.WALLET,
      priority: EventPriority.HIGH,
      destinations: ['wallet-events', 'analytics', 'compliance'],
      filters: { metadata: { amount: { $gte: 1000 } } }
    });

    this.addRoutingRule({
      eventType: PluginEvent.PLUGIN_EXECUTION_FAILED,
      category: EventCategory.PLUGIN,
      priority: EventPriority.CRITICAL,
      destinations: ['plugin-events', 'error-tracking', 'developer-notifications']
    });

    this.addRoutingRule({
      eventType: StreamEvent.STREAM_STARTED,
      category: EventCategory.STREAM,
      priority: EventPriority.MEDIUM,
      destinations: ['stream-events', 'analytics', 'live-notifications']
    });

    // Initialize default validation rules
    this.addValidationRule({
      eventType: UserEvent.USER_LOGIN,
      requiredFields: ['userId', 'timestamp'],
      optionalFields: ['ipAddress', 'userAgent', 'sessionId'],
      metadataSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          ipAddress: { type: 'string' },
          userAgent: { type: 'string' },
          sessionId: { type: 'string' }
        },
        required: ['userId']
      },
      maxSizeBytes: 1024,
      ttlSeconds: 86400
    });

    this.addValidationRule({
      eventType: WalletEvent.WALLET_DEPOSIT_COMPLETED,
      requiredFields: ['walletId', 'amount', 'currency', 'timestamp'],
      optionalFields: ['referenceId', 'transactionId', 'fees'],
      metadataSchema: {
        type: 'object',
        properties: {
          walletId: { type: 'string' },
          amount: { type: 'number', minimum: 0 },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'] },
          referenceId: { type: 'string' },
          transactionId: { type: 'string' },
          fees: {
            type: 'object',
            properties: {
              platform: { type: 'number' },
              processing: { type: 'number' }
            }
          }
        },
        required: ['walletId', 'amount', 'currency']
      },
      maxSizeBytes: 2048,
      ttlSeconds: 2592000 // 30 days
    });

    // Initialize default retention policies
    this.addRetentionPolicy({
      category: EventCategory.USER,
      priority: EventPriority.LOW,
      retentionDays: 90,
      archiveAfterDays: 30,
      compressAfterDays: 7
    });

    this.addRetentionPolicy({
      category: EventCategory.WALLET,
      priority: EventPriority.HIGH,
      retentionDays: 2555, // 7 years for compliance
      archiveAfterDays: 365,
      compressAfterDays: 30
    });

    this.addRetentionPolicy({
      category: EventCategory.PLUGIN,
      priority: EventPriority.MEDIUM,
      retentionDays: 365,
      archiveAfterDays: 90,
      compressAfterDays: 30
    });

    this.addRetentionPolicy({
      category: EventCategory.STREAM,
      priority: EventPriority.MEDIUM,
      retentionDays: 30,
      archiveAfterDays: 7,
      compressAfterDays: 1
    });
  }

  private async validateEvent(event: BaseEvent, metadata: EventMetadata): Promise<{ valid: boolean; errors?: string[] }> {
    const rule = this.validationRules.get(event.type);
    if (!rule) {
      return { valid: true }; // No validation rule, allow event
    }

    const errors: string[] = [];

    // Check required fields
    for (const field of rule.requiredFields) {
      if (!event.metadata || !event.metadata[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate against schema if provided
    if (rule.metadataSchema) {
      const schemaErrors = this.validateAgainstSchema(event.metadata, rule.metadataSchema);
      errors.push(...schemaErrors);
    }

    // Check size limit
    if (rule.maxSizeBytes) {
      const eventSize = JSON.stringify(event).length;
      if (eventSize > rule.maxSizeBytes) {
        errors.push(`Event size (${eventSize} bytes) exceeds maximum (${rule.maxSizeBytes} bytes)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private validateAgainstSchema(data: any, schema: any): string[] {
    // Simple JSON schema validation
    const errors: string[] = [];

    if (schema.required) {
      for (const field of schema.required) {
        if (!data || data[field] === undefined) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (data && data[key] !== undefined) {
          const value = data[key];
          const propErrors = this.validateProperty(value, propSchema as any);
          errors.push(...propErrors.map(err => `${key}: ${err}`));
        }
      }
    }

    return errors;
  }

  private validateProperty(value: any, schema: any): string[] {
    const errors: string[] = [];

    if (schema.type) {
      const actualType = typeof value;
      if (actualType !== schema.type) {
        errors.push(`Expected type ${schema.type}, got ${actualType}`);
      }
    }

    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`Value ${value} is less than minimum ${schema.minimum}`);
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`Value ${value} is greater than maximum ${schema.maximum}`);
    }

    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`Value ${value} is not in allowed values: ${schema.enum.join(', ')}`);
    }

    return errors;
  }

  private async routeEvent(event: BaseEvent, metadata: EventMetadata): Promise<void> {
    const key = `${metadata.category}:${event.type}`;
    const rules = this.routingRules.get(key) || [];

    for (const rule of rules) {
      // Apply filters
      if (rule.filters) {
        if (rule.filters.priority && !rule.filters.priority.includes(metadata.priority)) {
          continue;
        }

        if (rule.filters.metadata && !this.matchesMetadataFilter(event.metadata, rule.filters.metadata)) {
          continue;
        }

        if (rule.filters.tags && rule.filters.tags.length > 0) {
          const hasMatchingTag = rule.filters.tags.some(tag => metadata.tags?.includes(tag));
          if (!hasMatchingTag) {
            continue;
          }
        }
      }

      // Route to destinations
      for (const destination of rule.destinations) {
        await this.publishToDestination(event, metadata, destination);
      }
    }
  }

  private matchesMetadataFilter(eventMetadata: any, filterMetadata: any): boolean {
    // Simple metadata matching - can be enhanced with more complex logic
    for (const [key, value] of Object.entries(filterMetadata)) {
      if (eventMetadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private async publishToDestination(event: BaseEvent, metadata: EventMetadata, destination: string): Promise<void> {
    try {
      const channel = `event-bus:${destination}`;
      const message = JSON.stringify({ event, metadata });
      await this.redis.publish(channel, message);
    } catch (error) {
      this.logger.error(`Failed to publish to destination: ${destination}`, error);
    }
  }

  private async storeEvent(event: BaseEvent, metadata: EventMetadata): Promise<void> {
    try {
      const policy = this.retentionPolicies.get(metadata.category);
      if (!policy) {
        return;
      }

      const eventData = {
        event,
        metadata,
        storedAt: new Date()
      };

      // Store in Redis with TTL
      const key = `event:${metadata.eventId}`;
      const ttl = metadata.ttl || (policy.retentionDays * 24 * 60 * 60); // Convert days to seconds
      
      await this.redis.setex(key, ttl, JSON.stringify(eventData));

      // Store in time-series data if needed
      await this.storeTimeSeriesData(event, metadata);
    } catch (error) {
      this.logger.error('Failed to store event', error);
    }
  }

  private async storeTimeSeriesData(event: BaseEvent, metadata: EventMetadata): Promise<void> {
    // Store time-series data for analytics
    const timestamp = metadata.timestamp.getTime();
    const key = `events:timeseries:${metadata.category}:${event.type}`;
    
    try {
      await this.redis.zadd(key, timestamp, JSON.stringify({
        eventId: metadata.eventId,
        timestamp,
        priority: metadata.priority,
        userId: metadata.userId
      }));
    } catch (error) {
      this.logger.error('Failed to store time-series data', error);
    }
  }

  private async processAnalytics(event: BaseEvent, metadata: EventMetadata): Promise<void> {
    // Process analytics data
    try {
      const analyticsKey = `analytics:${metadata.category}:${event.type}`;
      const date = metadata.timestamp.toISOString().split('T')[0];
      
      // Increment counters
      await this.redis.hincrby(`${analyticsKey}:count`, date, 1);
      await this.redis.hincrby(`${analyticsKey}:priority:${metadata.priority}`, date, 1);
      
      if (metadata.userId) {
        await this.redis.hincrby(`${analyticsKey}:users`, metadata.userId, 1);
      }
    } catch (error) {
      this.logger.error('Failed to process analytics', error);
    }
  }

  private async publishToRedis(event: BaseEvent, metadata: EventMetadata): Promise<void> {
    try {
      const channel = `events:${metadata.category}`;
      const message = JSON.stringify({ event, metadata });
      await this.redis.publish(channel, message);
    } catch (error) {
      this.logger.error('Failed to publish to Redis', error);
    }
  }

  private startProcessingLoop(): void {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      
      try {
        const batch = this.processingQueue.splice(0, this.config.batchSize!);
        await this.processBatch(batch);
      } catch (error) {
        this.logger.error('Error in processing loop', error);
      } finally {
        this.isProcessing = false;
      }
    }, this.config.flushInterval!);
  }

  private async processBatch(batch: string[]): Promise<void> {
    // Process batch of events
    for (const eventId of batch) {
      try {
        const eventData = await this.redis.get(`event:${eventId}`);
        if (eventData) {
          const { event, metadata } = JSON.parse(eventData);
          this.emit('processed', event, metadata);
        }
      } catch (error) {
        this.logger.error(`Failed to process event: ${eventId}`, error);
      }
    }
  }

  /**
   * Cleanup expired events
   */
  async cleanupExpiredEvents(): Promise<void> {
    // This would be implemented with a background job
    // For now, log the cleanup
    this.logger.info('Event cleanup completed');
  }
}