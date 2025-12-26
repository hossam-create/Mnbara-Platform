import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import services and middleware
import { PrismaClient } from '@prisma/client';
import { ElasticsearchService } from './services/elasticsearch.service';
import { RedisService } from './services/redis.service';
import { RabbitMQService } from './services/rabbitmq.service';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { metricsMiddleware } from './middleware/metrics.middleware';

// Import routes
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import searchRoutes from './routes/search.routes';
import bidRoutes from './routes/bid.routes';
import reviewRoutes from './routes/review.routes';
import adminRoutes from './routes/admin.routes';

// Load environment variables
dotenv.config();

/**
 * Mnbara Listing Service - eBay-Level Product Catalog
 * 
 * Features:
 * - Advanced product catalog management
 * - Elasticsearch-powered search
 * - Real-time bidding system
 * - Category hierarchy management
 * - Image and media handling
 * - Review and rating system
 * - Analytics and reporting
 */

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize services
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const elasticsearchService = new ElasticsearchService();
const redisService = new RedisService();
const rabbitmqService = new RabbitMQService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - eBay-level protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Metrics middleware
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Elasticsearch connection
    const esHealth = await elasticsearchService.checkHealth();
    
    // Check Redis connection
    const redisHealth = await redisService.ping();
    
    // Check RabbitMQ connection
    const rabbitmqHealth = await rabbitmqService.checkHealth();

    res.json({
      status: 'success',
      data: {
        service: 'listing-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        dependencies: {
          database: 'healthy',
          elasticsearch: esHealth ? 'healthy' : 'unhealthy',
          redis: redisHealth ? 'healthy' : 'unhealthy',
          rabbitmq: rabbitmqHealth ? 'healthy' : 'unhealthy'
        }
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      error: {
        code: 'SERVICE_UNHEALTHY',
        message: 'Service health check failed'
      }
    });
  }
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bids', authMiddleware, bidRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connections closed');
    
    // Close Elasticsearch connection
    await elasticsearchService.close();
    logger.info('Elasticsearch connection closed');
    
    // Close Redis connection
    await redisService.disconnect();
    logger.info('Redis connection closed');
    
    // Close RabbitMQ connection
    await rabbitmqService.close();
    logger.info('RabbitMQ connection closed');
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Elasticsearch
    await elasticsearchService.initialize();
    logger.info('Elasticsearch service initialized');
    
    // Initialize Redis
    await redisService.connect();
    logger.info('Redis service initialized');
    
    // Initialize RabbitMQ
    await rabbitmqService.connect();
    logger.info('RabbitMQ service initialized');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Listing Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔍 Search API: http://localhost:${PORT}/api/search`);
      logger.info(`📦 Products API: http://localhost:${PORT}/api/products`);
      logger.info(`🏷️ Categories API: http://localhost:${PORT}/api/categories`);
      logger.info(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;