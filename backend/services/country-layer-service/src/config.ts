export const config = {
  // Server configuration
  port: parseInt(process.env.COUNTRY_SERVICE_PORT || '3015'),
  host: process.env.COUNTRY_SERVICE_HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  version: process.env.npm_package_version || '1.0.0',

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://country_user:password@localhost:5432/mnbara_country',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000')
    }
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '1'),
    cluster: process.env.REDIS_CLUSTER === 'true',
    sentinels: process.env.REDIS_SENTINELS ? process.env.REDIS_SENTINELS.split(',') : [],
    name: process.env.REDIS_SENTINEL_NAME || 'mymaster'
  },

  // JWT configuration
  jwt: {
    secret: process.env.COUNTRY_JWT_SECRET || 'your-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'mnbara-country-layer'
  },

  // Security configuration
  security: {
    encryptionKey: process.env.COUNTRY_ENCRYPTION_KEY || 'your-encryption-key-32-chars',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000']
  },

  // External API configuration
  external: {
    governmentApi: {
      url: process.env.GOV_API_URL || 'https://api.trade.gov',
      key: process.env.GOV_API_KEY,
      timeout: parseInt(process.env.GOV_API_TIMEOUT || '30000')
    },
    sanctionsApi: {
      url: process.env.SANCTIONS_API_URL || 'https://api.sanctions.gov',
      key: process.env.SANCTIONS_API_KEY,
      timeout: parseInt(process.env.SANCTIONS_API_TIMEOUT || '30000')
    }
  },

  // Cache configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes
    countryTtl: parseInt(process.env.COUNTRY_CACHE_TTL || '3600'), // 1 hour
    rulesTtl: parseInt(process.env.RULES_CACHE_TTL || '1800'), // 30 minutes
    analyticsTtl: parseInt(process.env.ANALYTICS_CACHE_TTL || '900') // 15 minutes
  },

  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'json'
};