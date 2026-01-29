import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

// Import routes
import exchangeRequestRoutes from './routes/exchange-request.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import matchRoutes from './routes/match.routes';
import settlementRoutes from './routes/settlement.routes';
import securityRoutes from './routes/security.routes';
import communicationRoutes from './routes/communication.routes';
import adminExchangeRoutes from './routes/admin-exchange.routes';

// Import middleware
import { errorHandler } from './middleware/error-handler.middleware';
import { metricsMiddleware } from './middleware/metrics.middleware';

// Import services
import { CronSchedulerService } from './services/cron-scheduler.service';
import { MatchingEngineService } from './services/matching-engine.service';
import { UptimeMonitorService } from './services/uptime-monitor.service';
import { MatchingEngineHealthService } from './services/matching-engine-health.service';

// Import routes
import uptimeMonitorRoutes from './routes/uptime-monitor.routes';

// Import metrics
import { metricsHandler } from './utils/metrics';
import logger from './utils/logger';

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Redis Client
export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Initialize services
let cronScheduler: CronSchedulerService | null = null;

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser
app.use(metricsMiddleware); // Metrics collection

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    const redisStatus = redis.isOpen ? 'connected' : 'disconnected';
    
    res.status(200).json({
      status: 'healthy',
      service: 'p2p-exchange-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redisStatus,
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'p2p-exchange-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Metrics endpoint
app.get('/metrics', metricsHandler);

// API Routes
app.use('/api/v1/exchange/requests', exchangeRequestRoutes);
app.use('/api/v1/exchange/marketplace', marketplaceRoutes);
app.use('/api/v1/exchange/matches', matchRoutes);
app.use('/api/v1/exchange/settlements', settlementRoutes);
app.use('/api/v1/exchange/security', securityRoutes);
app.use('/api/v1/exchange/communication', communicationRoutes);
app.use('/api/v1/admin/exchange', adminExchangeRoutes);
app.use('/api/v1/admin/uptime', uptimeMonitorRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing connections...');
  
  try {
    // Stop health checks
    MatchingEngineHealthService.stopHealthChecks();
    logger.info('Health checks stopped');
    
    // Record shutdown
    await UptimeMonitorService.recordShutdown();
    logger.info('Uptime monitoring stopped');
    
    // Stop cron jobs
    if (cronScheduler) {
      await cronScheduler.stop();
      logger.info('Cron jobs stopped');
    }
    
    // Close Redis connection
    await redis.quit();
    logger.info('Redis connection closed');
    
    // Close Prisma connection
    await prisma.$disconnect();
    logger.info('Database connection closed');
    
    logger.info('All connections closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await redis.connect();
    logger.info('✅ Redis connected');
    
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');
    
    // Start uptime monitoring
    await UptimeMonitorService.recordStartup();
    MatchingEngineHealthService.startHealthChecks();
    logger.info('✅ Uptime monitoring started');
    
    // Initialize and start cron jobs
    const matchingEngineService = new MatchingEngineService(prisma);
    cronScheduler = new CronSchedulerService(matchingEngineService, logger);
    await cronScheduler.initialize();
    await cronScheduler.start();
    logger.info('✅ Cron jobs started');
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 P2P Exchange Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`📊 Uptime status: http://localhost:${PORT}/api/v1/admin/uptime/status`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
