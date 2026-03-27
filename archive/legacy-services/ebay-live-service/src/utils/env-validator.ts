import Joi from 'joi';
import { logger } from './logger';

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(3000),
  
  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:3000'),
  
  // Database
  DATABASE_URL: Joi.string()
    .uri()
    .required(),
  
  // Redis
  REDIS_URL: Joi.string()
    .uri()
    .default('redis://localhost:6379'),
  
  // JWT
  JWT_SECRET: Joi.string()
    .min(32)
    .required(),
  
  JWT_EXPIRES_IN: Joi.string()
    .default('24h'),
  
  // RTMP Server
  RTMP_PORT: Joi.number()
    .port()
    .default(1935),
  
  RTMP_SECRET: Joi.string()
    .min(16)
    .required(),
  
  // HLS Settings
  HLS_SEGMENT_DURATION: Joi.number()
    .positive()
    .default(6),
  
  HLS_PLAYLIST_LENGTH: Joi.number()
    .positive()
    .default(30),
  
  // WebRTC
  WEBRTC_STUN_SERVER: Joi.string()
    .default('stun:stun.l.google.com:19302'),
  
  WEBRTC_TURN_SERVER: Joi.string()
    .optional(),
  
  WEBRTC_TURN_USERNAME: Joi.string()
    .optional(),
  
  WEBRTC_TURN_CREDENTIAL: Joi.string()
    .optional(),
  
  // AWS S3 (for recordings)
  AWS_ACCESS_KEY_ID: Joi.string()
    .optional(),
  
  AWS_SECRET_ACCESS_KEY: Joi.string()
    .optional(),
  
  AWS_REGION: Joi.string()
    .default('us-east-1'),
  
  S3_BUCKET_NAME: Joi.string()
    .optional(),
  
  // Chat Settings
  CHAT_RATE_LIMIT_WINDOW: Joi.number()
    .positive()
    .default(60000), // 1 minute
  
  CHAT_RATE_LIMIT_MAX: Joi.number()
    .positive()
    .default(30), // 30 messages per minute
  
  CHAT_MESSAGE_MAX_LENGTH: Joi.number()
    .positive()
    .default(500),
  
  // Auction Settings
  AUCTION_BID_RATE_LIMIT_WINDOW: Joi.number()
    .positive()
    .default(1000), // 1 second
  
  AUCTION_BID_RATE_LIMIT_MAX: Joi.number()
    .positive()
    .default(10), // 10 bids per second
  
  AUCTION_AUTO_EXTEND_TIME: Joi.number()
    .positive()
    .default(300000), // 5 minutes
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  
  // Monitoring
  ENABLE_METRICS: Joi.boolean()
    .default(true),
  
  METRICS_PORT: Joi.number()
    .port()
    .default(9090),
  
  // Security
  ENABLE_RATE_LIMITING: Joi.boolean()
    .default(true),
  
  RATE_LIMIT_WINDOW: Joi.number()
    .positive()
    .default(900000), // 15 minutes
  
  RATE_LIMIT_MAX: Joi.number()
    .positive()
    .default(100), // 100 requests per window
  
  // File Upload
  MAX_FILE_SIZE: Joi.number()
    .positive()
    .default(104857600), // 100MB
  
  ALLOWED_FILE_TYPES: Joi.string()
    .default('image/jpeg,image/png,image/gif,video/mp4,video/webm'),
  
  // Streaming Settings
  MAX_STREAM_DURATION: Joi.number()
    .positive()
    .default(14400000), // 4 hours
  
  MAX_CONCURRENT_STREAMS: Joi.number()
    .positive()
    .default(100),
  
  STREAM_QUALITY_PRESETS: Joi.string()
    .default('low:480p:800k,medium:720p:2500k,high:1080p:5000k,ultra:4k:15000k')
}).unknown();

export const validateEnv = (): void => {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: true
  });

  if (error) {
    logger.error('Environment validation failed:', error.details);
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  // Log validated environment (without sensitive data)
  const safeEnv = { ...value };
  delete safeEnv.JWT_SECRET;
  delete safeEnv.RTMP_SECRET;
  delete safeEnv.AWS_SECRET_ACCESS_KEY;
  delete safeEnv.WEBRTC_TURN_CREDENTIAL;
  
  logger.info('Environment variables validated successfully', safeEnv);
};

export default validateEnv;