import dotenv from 'dotenv';

dotenv.config();

interface GatewayConfig {
  port: number;
  nodeEnv: string;
  
  // Service URLs
  authServiceUrl: string;
  userServiceUrl: string;
  orderServiceUrl: string;
  paymentServiceUrl: string;
  deliveryServiceUrl: string;
  walletServiceUrl: string;
  travelerServiceUrl: string;
  marketplaceServiceUrl: string;
  
  // Rate limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // JWT
  jwtSecret: string;
  jwtAlgorithm: string;
  jwtExpiresIn: string;
  
  // Redis
  redisUrl: string;
  
  // CORS
  corsOrigin: string;
  
  // Logging
  logLevel: string;
}

export const config: GatewayConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  deliveryServiceUrl: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3005',
  walletServiceUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:3006',
  travelerServiceUrl: process.env.TRAVELER_SERVICE_URL || 'http://localhost:3007',
  marketplaceServiceUrl: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3008',
  
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  logLevel: process.env.LOG_LEVEL || 'info',
};

export const serviceUrls = {
  auth: config.authServiceUrl,
  user: config.userServiceUrl,
  order: config.orderServiceUrl,
  payment: config.paymentServiceUrl,
  delivery: config.deliveryServiceUrl,
  wallet: config.walletServiceUrl,
  traveler: config.travelerServiceUrl,
  marketplace: config.marketplaceServiceUrl,
};

export default config;
