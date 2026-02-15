// Environment Configuration

export const config = {
  // Server Configuration
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ebay_live_service',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '100')
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100')
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'ebay-live-service'
  },

  // RTMP Configuration
  rtmp: {
    port: parseInt(process.env.RTMP_PORT || '1935'),
    httpPort: parseInt(process.env.RTMP_HTTP_PORT || '8080'),
    chunkSize: parseInt(process.env.RTMP_CHUNK_SIZE || '4096'),
    gopCache: process.env.RTMP_GOP_CACHE === 'true',
    ping: parseInt(process.env.RTMP_PING || '30'),
    pingTimeout: parseInt(process.env.RTMP_PING_TIMEOUT || '60')
  },

  // HLS Configuration
  hls: {
    basePath: process.env.HLS_BASE_PATH || '/var/www/html/media/hls',
    playlistLength: parseInt(process.env.HLS_PLAYLIST_LENGTH || '10'),
    segmentDuration: parseInt(process.env.HLS_SEGMENT_DURATION || '6'),
    cleanup: process.env.HLS_CLEANUP === 'true',
    autoStart: process.env.HLS_AUTO_START === 'true'
  },

  // WebRTC Configuration
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    maxBitrate: parseInt(process.env.WEBRTC_MAX_BITRATE || '2000000'),
    codec: process.env.WEBRTC_CODEC || 'h264'
  },

  // Media Storage Configuration
  media: {
    storageType: process.env.MEDIA_STORAGE_TYPE || 'local', // local, s3, gcs
    localPath: process.env.MEDIA_LOCAL_PATH || '/var/www/html/media',
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
    },
    gcs: {
      bucket: process.env.GCS_BUCKET || '',
      keyFile: process.env.GCS_KEY_FILE || ''
    }
  },

  // Analytics Configuration
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90'),
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '1000'),
    flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || '30000') // 30 seconds
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP'
  },

  // Chat Configuration
  chat: {
    maxMessageLength: parseInt(process.env.CHAT_MAX_MESSAGE_LENGTH || '500'),
    messageRateLimit: parseInt(process.env.CHAT_MESSAGE_RATE_LIMIT || '10'), // messages per minute
    bannedWords: process.env.CHAT_BANNED_WORDS?.split(',') || [],
    moderationEnabled: process.env.CHAT_MODERATION_ENABLED === 'true'
  },

  // Auction Configuration
  auction: {
    maxDuration: parseInt(process.env.AUCTION_MAX_DURATION || '1440'), // 24 hours in minutes
    minBidIncrement: parseFloat(process.env.AUCTION_MIN_BID_INCREMENT || '0.01'),
    autoExtendTime: parseInt(process.env.AUCTION_AUTO_EXTEND_TIME || '300'), // 5 minutes
    maxBidAmount: parseFloat(process.env.AUCTION_MAX_BID_AMOUNT || '1000000')
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: process.env.LOG_FILE || 'logs/ebay-live-service.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '5'
  },

  // Health Check Configuration
  health: {
    checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'), // 5 seconds
    failureThreshold: parseInt(process.env.HEALTH_FAILURE_THRESHOLD || '3')
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Security Configuration
  security: {
    helmet: process.env.SECURITY_HELMET === 'true',
    hsts: process.env.SECURITY_HSTS === 'true',
    noSniff: process.env.SECURITY_NO_SNIFF === 'true',
    xssFilter: process.env.SECURITY_XSS_FILTER === 'true',
    frameOptions: process.env.SECURITY_FRAME_OPTIONS || 'DENY'
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPort: parseInt(process.env.MONITORING_METRICS_PORT || '9090'),
    endpoint: process.env.MONITORING_ENDPOINT || '/metrics'
  },

  // Feature Flags
  features: {
    liveStreaming: process.env.FEATURE_LIVE_STREAMING === 'true',
    auctions: process.env.FEATURE_AUCTIONS === 'true',
    chat: process.env.FEATURE_CHAT === 'true',
    analytics: process.env.FEATURE_ANALYTICS === 'true',
    replays: process.env.FEATURE_REPLAYS === 'true',
    webrtc: process.env.FEATURE_WEBRTC === 'true',
    hls: process.env.FEATURE_HLS === 'true'
  }
};

// Validation
export function validateConfig() {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate feature dependencies
  if (config.features.hls && !config.features.liveStreaming) {
    throw new Error('HLS feature requires liveStreaming to be enabled');
  }

  if (config.features.webrtc && !config.features.liveStreaming) {
    throw new Error('WebRTC feature requires liveStreaming to be enabled');
  }

  if (config.features.analytics && !config.analytics.enabled) {
    throw new Error('Analytics feature requires analytics.enabled to be true');
  }

  logger.info('Configuration validated successfully');
}

export default config;