// ============================================================
// Event Bus Configuration - Routing and Processing Rules
// ============================================================

import { 
  EventCategory, 
  EventPriority, 
  EventRoutingRule, 
  EventValidationRule, 
  EventRetentionPolicy,
  EventIndexingConfig,
  EventAnalyticsConfig
} from './EventTaxonomy';

/**
 * Default event routing configuration
 */
export const defaultEventRoutingRules: EventRoutingRule[] = [
  // User Events
  {
    eventType: 'user.registered',
    category: EventCategory.USER,
    priority: EventPriority.MEDIUM,
    destinations: ['user-events', 'analytics', 'email-notifications', 'user-onboarding'],
    filters: { priority: [EventPriority.HIGH, EventPriority.CRITICAL] }
  },
  {
    eventType: 'user.login',
    category: EventCategory.USER,
    priority: EventPriority.LOW,
    destinations: ['user-events', 'analytics', 'security-monitoring'],
    filters: { priority: [EventPriority.HIGH, EventPriority.CRITICAL] }
  },
  {
    eventType: 'user.kyc_approved',
    category: EventCategory.USER,
    priority: EventPriority.HIGH,
    destinations: ['user-events', 'compliance', 'wallet-service', 'analytics'],
    transformations: {
      fieldMappings: { 'userId': 'subjectId', 'kycLevel': 'verificationLevel' }
    }
  },

  // Wallet Events
  {
    eventType: 'wallet.created',
    category: EventCategory.WALLET,
    priority: EventPriority.MEDIUM,
    destinations: ['wallet-events', 'analytics', 'compliance'],
    filters: { metadata: { 'initialBalance': { $gt: 1000 } } }
  },
  {
    eventType: 'wallet.deposit_completed',
    category: EventCategory.WALLET,
    priority: EventPriority.HIGH,
    destinations: ['wallet-events', 'analytics', 'compliance', 'notifications'],
    filters: { metadata: { 'amount': { $gte: 1000 } } }
  },
  {
    eventType: 'wallet.withdrawal_completed',
    category: EventCategory.WALLET,
    priority: EventPriority.HIGH,
    destinations: ['wallet-events', 'analytics', 'compliance', 'notifications'],
    filters: { metadata: { 'amount': { $gte: 500 } } }
  },
  {
    eventType: 'wallet.limit_exceeded',
    category: EventCategory.WALLET,
    priority: EventPriority.CRITICAL,
    destinations: ['wallet-events', 'security-monitoring', 'compliance', 'admin-notifications']
  },

  // Plugin Events
  {
    eventType: 'plugin.installed',
    category: EventCategory.PLUGIN,
    priority: EventPriority.MEDIUM,
    destinations: ['plugin-events', 'analytics', 'plugin-marketplace', 'developer-notifications'],
    transformations: {
      valueTransformers: {
        'pluginId': (value) => value.toLowerCase(),
        'installationTime': (value) => new Date(value).toISOString()
      }
    }
  },
  {
    eventType: 'plugin.execution_failed',
    category: EventCategory.PLUGIN,
    priority: EventPriority.CRITICAL,
    destinations: ['plugin-events', 'error-tracking', 'developer-notifications', 'plugin-marketplace']
  },
  {
    eventType: 'plugin.sandbox_violation',
    category: EventCategory.PLUGIN,
    priority: EventPriority.CRITICAL,
    destinations: ['plugin-events', 'security-monitoring', 'plugin-marketplace', 'admin-notifications']
  },

  // Plugin Marketplace Events
  {
    eventType: 'plugin.submitted',
    category: EventCategory.PLUGIN_MARKETPLACE,
    priority: EventPriority.MEDIUM,
    destinations: ['marketplace-events', 'plugin-review', 'developer-notifications'],
    filters: { tags: ['new-submission', 'plugin-review'] }
  },
  {
    eventType: 'plugin.published',
    category: EventCategory.PLUGIN_MARKETPLACE,
    priority: EventPriority.MEDIUM,
    destinations: ['marketplace-events', 'plugin-discovery', 'developer-notifications', 'analytics'],
    transformations: {
      fieldMappings: { 'pluginName': 'name', 'pluginVersion': 'version' }
    }
  },
  {
    eventType: 'plugin.purchased',
    category: EventCategory.PLUGIN_MARKETPLACE,
    priority: EventPriority.HIGH,
    destinations: ['marketplace-events', 'billing', 'analytics', 'developer-revenue'],
    filters: { metadata: { 'price': { $gt: 0 } } }
  },

  // Developer Events
  {
    eventType: 'developer.registered',
    category: EventCategory.DEVELOPER,
    priority: EventPriority.MEDIUM,
    destinations: ['developer-events', 'onboarding', 'email-notifications', 'analytics']
  },
  {
    eventType: 'developer.kyc_approved',
    category: EventCategory.DEVELOPER,
    priority: EventPriority.HIGH,
    destinations: ['developer-events', 'plugin-submission', 'analytics', 'compliance']
  },
  {
    eventType: 'developer.support_ticket_created',
    category: EventCategory.DEVELOPER,
    priority: EventPriority.MEDIUM,
    destinations: ['developer-events', 'support-system', 'analytics']
  },

  // Stream Events
  {
    eventType: 'stream.started',
    category: EventCategory.STREAM,
    priority: EventPriority.MEDIUM,
    destinations: ['stream-events', 'analytics', 'live-notifications', 'recording-service'],
    filters: { priority: [EventPriority.HIGH, EventPriority.CRITICAL] }
  },
  {
    eventType: 'stream.ended',
    category: EventCategory.STREAM,
    priority: EventPriority.MEDIUM,
    destinations: ['stream-events', 'analytics', 'recording-service', 'analytics'],
    transformations: {
      fieldMappings: { 'streamDuration': 'duration', 'viewerCount': 'finalViewers' }
    }
  },
  {
    eventType: 'stream.connection_lost',
    category: EventCategory.STREAM,
    priority: EventPriority.HIGH,
    destinations: ['stream-events', 'error-tracking', 'live-notifications', 'support-system']
  },
  {
    eventType: 'stream.viewer_count_updated',
    category: EventCategory.STREAM,
    priority: EventPriority.LOW,
    destinations: ['stream-events', 'analytics', 'live-analytics'],
    filters: { priority: [EventPriority.MEDIUM, EventPriority.HIGH, EventPriority.CRITICAL] }
  },

  // Stream Chat Events
  {
    eventType: 'chat.message_sent',
    category: EventCategory.STREAM_CHAT,
    priority: EventPriority.LOW,
    destinations: ['chat-events', 'chat-moderation', 'analytics'],
    filters: { priority: [EventPriority.MEDIUM, EventPriority.HIGH, EventPriority.CRITICAL] }
  },
  {
    eventType: 'chat.spam_detected',
    category: EventCategory.STREAM_CHAT,
    priority: EventPriority.HIGH,
    destinations: ['chat-events', 'chat-moderation', 'security-monitoring', 'user-sanctions']
  },
  {
    eventType: 'chat.user_banned',
    category: EventCategory.STREAM_CHAT,
    priority: EventPriority.MEDIUM,
    destinations: ['chat-events', 'chat-moderation', 'user-sanctions', 'notifications']
  },

  // Stream Auction Events
  {
    eventType: 'auction.started',
    category: EventCategory.STREAM_AUCTION,
    priority: EventPriority.MEDIUM,
    destinations: ['auction-events', 'live-notifications', 'analytics', 'bid-tracking']
  },
  {
    eventType: 'auction.bid_placed',
    category: EventCategory.STREAM_AUCTION,
    priority: EventPriority.MEDIUM,
    destinations: ['auction-events', 'bid-tracking', 'analytics', 'live-notifications'],
    filters: { priority: [EventPriority.MEDIUM, EventPriority.HIGH, EventPriority.CRITICAL] }
  },
  {
    eventType: 'auction.item_sold',
    category: EventCategory.STREAM_AUCTION,
    priority: EventPriority.HIGH,
    destinations: ['auction-events', 'order-processing', 'analytics', 'notifications']
  },

  // Product Carousel Events
  {
    eventType: 'carousel.item_clicked',
    category: EventCategory.PRODUCT_CAROUSEL,
    priority: EventPriority.LOW,
    destinations: ['carousel-events', 'analytics', 'product-analytics'],
    transformations: {
      fieldMappings: { 'productId': 'itemId', 'carouselPosition': 'position' }
    }
  },
  {
    eventType: 'carousel.rotation_started',
    category: EventCategory.PRODUCT_CAROUSEL,
    priority: EventPriority.LOW,
    destinations: ['carousel-events', 'analytics']
  },

  // eBay Integration Events
  {
    eventType: 'ebay.product_sync_completed',
    category: EventCategory.EBAY_LIVE,
    priority: EventPriority.MEDIUM,
    destinations: ['ebay-events', 'product-sync', 'analytics'],
    filters: { metadata: { 'syncStatus': 'success' } }
  },
  {
    eventType: 'ebay.order_received',
    category: EventCategory.EBAY_LIVE,
    priority: EventPriority.HIGH,
    destinations: ['ebay-events', 'order-processing', 'notifications', 'analytics']
  },

  // Integration Events
  {
    eventType: 'integration.api_request_received',
    category: EventCategory.INTEGRATION,
    priority: EventPriority.LOW,
    destinations: ['integration-events', 'api-analytics'],
    filters: { priority: [EventPriority.MEDIUM, EventPriority.HIGH, EventPriority.CRITICAL] }
  },
  {
    eventType: 'integration.webhook_received',
    category: EventCategory.INTEGRATION,
    priority: EventPriority.MEDIUM,
    destinations: ['integration-events', 'webhook-processing', 'analytics']
  },
  {
    eventType: 'integration.sync_failed',
    category: EventCategory.INTEGRATION,
    priority: EventPriority.HIGH,
    destinations: ['integration-events', 'error-tracking', 'notifications']
  },

  // Monitoring Events
  {
    eventType: 'monitoring.health_check_failed',
    category: EventCategory.MONITORING,
    priority: EventPriority.CRITICAL,
    destinations: ['monitoring-events', 'alerting', 'admin-notifications', 'pagerduty'],
    filters: { priority: [EventPriority.CRITICAL] }
  },
  {
    eventType: 'monitoring.unhandled_exception',
    category: EventCategory.MONITORING,
    priority: EventPriority.CRITICAL,
    destinations: ['monitoring-events', 'error-tracking', 'admin-notifications'],
    transformations: {
      fieldMappings: { 'errorMessage': 'message', 'errorStack': 'stack' }
    }
  },
  {
    eventType: 'monitoring.suspicious_activity',
    category: EventCategory.MONITORING,
    priority: EventPriority.HIGH,
    destinations: ['monitoring-events', 'security-monitoring', 'admin-notifications']
  }
];

/**
 * Default event validation rules
 */
export const defaultEventValidationRules: EventValidationRule[] = [
  // User Events Validation
  {
    eventType: 'user.registered',
    requiredFields: ['userId', 'email', 'timestamp'],
    optionalFields: ['ipAddress', 'userAgent', 'referrer', 'utmSource'],
    metadataSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        email: { type: 'string', format: 'email' },
        ipAddress: { type: 'string' },
        userAgent: { type: 'string' },
        referrer: { type: 'string' },
        utmSource: { type: 'string' }
      },
      required: ['userId', 'email']
    },
    maxSizeBytes: 2048,
    ttlSeconds: 2592000 // 30 days
  },
  {
    eventType: 'user.login',
    requiredFields: ['userId', 'timestamp'],
    optionalFields: ['ipAddress', 'userAgent', 'sessionId', 'loginMethod'],
    metadataSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        ipAddress: { type: 'string' },
        userAgent: { type: 'string' },
        sessionId: { type: 'string' },
        loginMethod: { type: 'string', enum: ['password', 'oauth', 'mfa'] }
      },
      required: ['userId']
    },
    maxSizeBytes: 1024,
    ttlSeconds: 7776000 // 90 days
  },

  // Wallet Events Validation
  {
    eventType: 'wallet.deposit_completed',
    requiredFields: ['walletId', 'amount', 'currency', 'timestamp'],
    optionalFields: ['referenceId', 'transactionId', 'fees', 'paymentMethod'],
    metadataSchema: {
      type: 'object',
      properties: {
        walletId: { type: 'string' },
        amount: { type: 'number', minimum: 0.01 },
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
        referenceId: { type: 'string' },
        transactionId: { type: 'string' },
        fees: {
          type: 'object',
          properties: {
            platform: { type: 'number', minimum: 0 },
            processing: { type: 'number', minimum: 0 }
          }
        },
        paymentMethod: { type: 'string', enum: ['card', 'bank_transfer', 'crypto', 'paypal'] }
      },
      required: ['walletId', 'amount', 'currency']
    },
    maxSizeBytes: 2048,
    ttlSeconds: 220752000 // 7 years for compliance
  },

  // Plugin Events Validation
  {
    eventType: 'plugin.installed',
    requiredFields: ['pluginId', 'userId', 'timestamp'],
    optionalFields: ['pluginVersion', 'installationSource', 'configuration'],
    metadataSchema: {
      type: 'object',
      properties: {
        pluginId: { type: 'string' },
        userId: { type: 'string' },
        pluginVersion: { type: 'string' },
        installationSource: { type: 'string', enum: ['marketplace', 'direct', 'api'] },
        configuration: { type: 'object' }
      },
      required: ['pluginId', 'userId']
    },
    maxSizeBytes: 1024,
    ttlSeconds: 31536000 // 1 year
  },
  {
    eventType: 'plugin.execution_failed',
    requiredFields: ['pluginId', 'error', 'timestamp'],
    optionalFields: ['errorCode', 'errorStack', 'executionTime', 'memoryUsage'],
    metadataSchema: {
      type: 'object',
      properties: {
        pluginId: { type: 'string' },
        error: { type: 'string' },
        errorCode: { type: 'string' },
        errorStack: { type: 'string' },
        executionTime: { type: 'number', minimum: 0 },
        memoryUsage: { type: 'number', minimum: 0 }
      },
      required: ['pluginId', 'error']
    },
    maxSizeBytes: 4096,
    ttlSeconds: 7776000 // 90 days
  },

  // Stream Events Validation
  {
    eventType: 'stream.started',
    requiredFields: ['streamId', 'userId', 'timestamp'],
    optionalFields: ['streamKey', 'title', 'quality', 'protocol'],
    metadataSchema: {
      type: 'object',
      properties: {
        streamId: { type: 'string' },
        userId: { type: 'string' },
        streamKey: { type: 'string' },
        title: { type: 'string' },
        quality: { type: 'string' },
        protocol: { type: 'string', enum: ['rtmp', 'hls', 'webrtc'] }
      },
      required: ['streamId', 'userId']
    },
    maxSizeBytes: 1024,
    ttlSeconds: 2592000 // 30 days
  },
  {
    eventType: 'stream.viewer_count_updated',
    requiredFields: ['streamId', 'viewerCount', 'timestamp'],
    optionalFields: ['previousCount', 'peakViewers', 'averageViewers'],
    metadataSchema: {
      type: 'object',
      properties: {
        streamId: { type: 'string' },
        viewerCount: { type: 'integer', minimum: 0 },
        previousCount: { type: 'integer', minimum: 0 },
        peakViewers: { type: 'integer', minimum: 0 },
        averageViewers: { type: 'number', minimum: 0 }
      },
      required: ['streamId', 'viewerCount']
    },
    maxSizeBytes: 512,
    ttlSeconds: 604800 // 7 days
  },

  // Auction Events Validation
  {
    eventType: 'auction.bid_placed',
    requiredFields: ['auctionId', 'bidderId', 'amount', 'timestamp'],
    optionalFields: ['bidId', 'previousBid', 'isProxyBid', 'bidCount'],
    metadataSchema: {
      type: 'object',
      properties: {
        auctionId: { type: 'string' },
        bidderId: { type: 'string' },
        amount: { type: 'number', minimum: 0.01 },
        bidId: { type: 'string' },
        previousBid: { type: 'number', minimum: 0 },
        isProxyBid: { type: 'boolean' },
        bidCount: { type: 'integer', minimum: 1 }
      },
      required: ['auctionId', 'bidderId', 'amount']
    },
    maxSizeBytes: 1024,
    ttlSeconds: 7776000 // 90 days
  },

  // Monitoring Events Validation
  {
    eventType: 'monitoring.health_check_failed',
    requiredFields: ['service', 'error', 'timestamp'],
    optionalFields: ['errorCode', 'errorDetails', 'severity', 'affectedComponents'],
    metadataSchema: {
      type: 'object',
      properties: {
        service: { type: 'string' },
        error: { type: 'string' },
        errorCode: { type: 'string' },
        errorDetails: { type: 'object' },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        affectedComponents: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['service', 'error']
    },
    maxSizeBytes: 2048,
    ttlSeconds: 2592000 // 30 days
  }
];

/**
 * Default event retention policies
 */
export const defaultEventRetentionPolicies: EventRetentionPolicy[] = [
  // User events retention
  {
    category: EventCategory.USER,
    priority: EventPriority.LOW,
    retentionDays: 90,
    archiveAfterDays: 30,
    compressAfterDays: 7
  },
  {
    category: EventCategory.USER,
    priority: EventPriority.MEDIUM,
    retentionDays: 365,
    archiveAfterDays: 90,
    compressAfterDays: 30
  },
  {
    category: EventCategory.USER,
    priority: EventPriority.HIGH,
    retentionDays: 1095, // 3 years
    archiveAfterDays: 365,
    compressAfterDays: 90
  },
  {
    category: EventCategory.USER,
    priority: EventPriority.CRITICAL,
    retentionDays: 2555, // 7 years
    archiveAfterDays: 1095,
    compressAfterDays: 365
  },

  // Wallet events retention (compliance requirements)
  {
    category: EventCategory.WALLET,
    priority: EventPriority.LOW,
    retentionDays: 2555, // 7 years
    archiveAfterDays: 365,
    compressAfterDays: 90
  },
  {
    category: EventCategory.WALLET,
    priority: EventPriority.MEDIUM,
    retentionDays: 2555, // 7 years
    archiveAfterDays: 1095,
    compressAfterDays: 365
  },
  {
    category: EventCategory.WALLET,
    priority: EventPriority.HIGH,
    retentionDays: 2555, // 7 years
    archiveAfterDays: 1095,
    compressAfterDays: 365
  },
  {
    category: EventCategory.WALLET,
    priority: EventPriority.CRITICAL,
    retentionDays: 2555, // 7 years
    archiveAfterDays: 1095,
    compressAfterDays: 365
  },

  // Plugin events retention
  {
    category: EventCategory.PLUGIN,
    priority: EventPriority.LOW,
    retentionDays: 90,
    archiveAfterDays: 30,
    compressAfterDays: 7
  },
  {
    category: EventCategory.PLUGIN,
    priority: EventPriority.MEDIUM,
    retentionDays: 365,
    archiveAfterDays: 90,
    compressAfterDays: 30
  },
  {
    category: EventCategory.PLUGIN,
    priority: EventPriority.HIGH,
    retentionDays: 1095, // 3 years
    archiveAfterDays: 365,
    compressAfterDays: 90
  },
  {
    category: EventCategory.PLUGIN,
    priority: EventPriority.CRITICAL,
    retentionDays: 2555, // 7 years
    archiveAfterDays: 1095,
    compressAfterDays: 365
  },

  // Stream events retention
  {
    category: EventCategory.STREAM,
    priority: EventPriority.LOW,
    retentionDays: 30,
    archiveAfterDays: 7,
    compressAfterDays: 1
  },
  {
    category: EventCategory.STREAM,
    priority: EventPriority.MEDIUM,
    retentionDays: 90,
    archiveAfterDays: 30,
    compressAfterDays: 7
  },
  {
    category: EventCategory.STREAM,
    priority: EventPriority.HIGH,
    retentionDays: 365,
    archiveAfterDays: 90,
    compressAfterDays: 30
  },
  {
    category: EventCategory.STREAM,
    priority: EventPriority.CRITICAL,
    retentionDays: 1095, // 3 years
    archiveAfterDays: 365,
    compressAfterDays: 90
  },

  // Monitoring events retention
  {
    category: EventCategory.MONITORING,
    priority: EventPriority.LOW,
    retentionDays: 30,
    archiveAfterDays: 7,
    compressAfterDays: 1
  },
  {
    category: EventCategory.MONITORING,
    priority: EventPriority.MEDIUM,
    retentionDays: 90,
    archiveAfterDays: 30,
    compressAfterDays: 7
  },
  {
    category: EventCategory.MONITORING,
    priority: EventPriority.HIGH,
    retentionDays: 365,
    archiveAfterDays: 90,
    compressAfterDays: 30
  },
  {
    category: EventCategory.MONITORING,
    priority: EventPriority.CRITICAL,
    retentionDays: 1095, // 3 years
    archiveAfterDays: 365,
    compressAfterDays: 90
  }
];

/**
 * Default event indexing configuration
 */
export const defaultEventIndexingConfig: EventIndexingConfig[] = [
  {
    eventType: 'user.login',
    indexedFields: ['userId', 'timestamp', 'ipAddress'],
    timeSeriesFields: ['timestamp'],
    aggregationFields: ['userId']
  },
  {
    eventType: 'wallet.deposit_completed',
    indexedFields: ['walletId', 'userId', 'timestamp', 'amount', 'currency'],
    timeSeriesFields: ['timestamp', 'amount'],
    aggregationFields: ['walletId', 'userId', 'currency']
  },
  {
    eventType: 'plugin.installed',
    indexedFields: ['pluginId', 'userId', 'timestamp'],
    timeSeriesFields: ['timestamp'],
    aggregationFields: ['pluginId', 'userId']
  },
  {
    eventType: 'stream.started',
    indexedFields: ['streamId', 'userId', 'timestamp', 'quality'],
    timeSeriesFields: ['timestamp'],
    aggregationFields: ['userId', 'quality']
  },
  {
    eventType: 'auction.bid_placed',
    indexedFields: ['auctionId', 'bidderId', 'timestamp', 'amount'],
    timeSeriesFields: ['timestamp', 'amount'],
    aggregationFields: ['auctionId', 'bidderId']
  }
];

/**
 * Default event analytics configuration
 */
export const defaultEventAnalyticsConfig: EventAnalyticsConfig[] = [
  {
    eventType: 'user.login',
    metrics: { count: true, rate: true },
    dimensions: ['userId', 'loginMethod', 'ipAddress'],
    timeWindows: ['1m', '5m', '15m', '1h', '6h', '24h'],
    alerts: [
      { threshold: 100, window: '1m', comparison: 'greater_than' },
      { threshold: 500, window: '5m', comparison: 'greater_than' }
    ]
  },
  {
    eventType: 'wallet.deposit_completed',
    metrics: { count: true, rate: true },
    dimensions: ['currency', 'paymentMethod', 'userId'],
    timeWindows: ['1m', '5m', '15m', '1h', '6h', '24h', '7d'],
    alerts: [
      { threshold: 50, window: '1m', comparison: 'greater_than' },
      { threshold: 10000, window: '1h', comparison: 'greater_than' }
    ]
  },
  {
    eventType: 'plugin.execution_failed',
    metrics: { count: true, rate: true, errorRate: true },
    dimensions: ['pluginId', 'errorCode'],
    timeWindows: ['1m', '5m', '15m', '1h'],
    alerts: [
      { threshold: 5, window: '1m', comparison: 'greater_than' },
      { threshold: 0.1, window: '15m', comparison: 'greater_than' }
    ]
  },
  {
    eventType: 'stream.viewer_count_updated',
    metrics: { count: true, rate: true },
    dimensions: ['streamId', 'quality'],
    timeWindows: ['1m', '5m', '15m', '1h'],
    alerts: [
      { threshold: 1000, window: '1m', comparison: 'greater_than' }
    ]
  },
  {
    eventType: 'auction.bid_placed',
    metrics: { count: true, rate: true },
    dimensions: ['auctionId', 'bidderId'],
    timeWindows: ['1m', '5m', '15m', '1h'],
    alerts: [
      { threshold: 50, window: '1m', comparison: 'greater_than' }
    ]
  }
];

/**
 * Event Bus Configuration Interface
 */
export interface EventBusConfiguration {
  routingRules: EventRoutingRule[];
  validationRules: EventValidationRule[];
  retentionPolicies: EventRetentionPolicy[];
  indexingConfig: EventIndexingConfig[];
  analyticsConfig: EventAnalyticsConfig[];
  
  // Processing configuration
  processing: {
    batchSize: number;
    flushInterval: number;
    maxRetries: number;
    retryDelay: number;
    maxConcurrency: number;
  };
  
  // Storage configuration
  storage: {
    redis: {
      host: string;
      port: number;
      db: number;
      password?: string;
      maxRetries: number;
      retryDelay: number;
    };
    
    // Time-series database configuration
    timeseries: {
      enabled: boolean;
      database: string;
      retentionDays: number;
      compressionEnabled: boolean;
    };
    
    // Archive configuration
    archive: {
      enabled: boolean;
      storageType: 's3' | 'gcs' | 'local';
      bucket?: string;
      path?: string;
      compressionEnabled: boolean;
      encryptionEnabled: boolean;
    };
  };
  
  // Analytics configuration
  analytics: {
    enabled: boolean;
    realTimeProcessing: boolean;
    batchProcessing: boolean;
    aggregationInterval: number;
    alertCheckInterval: number;
    
    // External analytics integration
    integrations: {
      googleAnalytics?: {
        enabled: boolean;
        trackingId: string;
      };
      mixpanel?: {
        enabled: boolean;
        token: string;
      };
      amplitude?: {
        enabled: boolean;
        apiKey: string;
      };
    };
  };
  
  // Security configuration
  security: {
    encryptionEnabled: boolean;
    signingEnabled: boolean;
    rateLimiting: {
      enabled: boolean;
      maxEventsPerSecond: number;
      burstSize: number;
    };
    ipWhitelist?: string[];
    ipBlacklist?: string[];
  };
  
  // Monitoring configuration
  monitoring: {
    healthCheckInterval: number;
    metricsCollection: boolean;
    alerting: {
      enabled: boolean;
      channels: string[];
      severityThresholds: {
        low: number;
        medium: number;
        high: number;
        critical: number;
      };
    };
  };
}

/**
 * Default Event Bus Configuration
 */
export const defaultEventBusConfiguration: EventBusConfiguration = {
  routingRules: defaultEventRoutingRules,
  validationRules: defaultEventValidationRules,
  retentionPolicies: defaultEventRetentionPolicies,
  indexingConfig: defaultEventIndexingConfig,
  analyticsConfig: defaultEventAnalyticsConfig,
  
  processing: {
    batchSize: 100,
    flushInterval: 5000,
    maxRetries: 3,
    retryDelay: 1000,
    maxConcurrency: 10
  },
  
  storage: {
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0,
      maxRetries: 3,
      retryDelay: 1000
    },
    timeseries: {
      enabled: true,
      database: 'timeseries',
      retentionDays: 365,
      compressionEnabled: true
    },
    archive: {
      enabled: true,
      storageType: 'local',
      path: '/var/log/events',
      compressionEnabled: true,
      encryptionEnabled: false
    }
  },
  
  analytics: {
    enabled: true,
    realTimeProcessing: true,
    batchProcessing: true,
    aggregationInterval: 60000, // 1 minute
    alertCheckInterval: 300000, // 5 minutes
    integrations: {
      googleAnalytics: {
        enabled: false,
        trackingId: ''
      },
      mixpanel: {
        enabled: false,
        token: ''
      },
      amplitude: {
        enabled: false,
        apiKey: ''
      }
    }
  },
  
  security: {
    encryptionEnabled: false,
    signingEnabled: false,
    rateLimiting: {
      enabled: true,
      maxEventsPerSecond: 1000,
      burstSize: 2000
    }
  },
  
  monitoring: {
    healthCheckInterval: 30000, // 30 seconds
    metricsCollection: true,
    alerting: {
      enabled: true,
      channels: ['email', 'slack'],
      severityThresholds: {
        low: 100,
        medium: 50,
        high: 20,
        critical: 5
      }
    }
  }
};