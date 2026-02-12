import { Router } from 'express';
import { prisma } from '../index';
import { redis } from '../index';
import { logger } from '../utils/logger';

const router = Router();

// Basic health check
router.get('/', async (_req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'unified-wallet-service',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  res.json({
    success: true,
    data: health,
  });
});

// Detailed health check with dependencies
router.get('/detailed', async (_req, res) => {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    logger.error('Database health check failed:', error instanceof Error ? error.message : String(error));
  }

  try {
    // Check Redis connection
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    logger.error('Redis health check failed:', error instanceof Error ? error.message : String(error));
  }

  const overallHealth = checks.database && checks.redis;

  res.status(overallHealth ? 200 : 503).json({
    success: overallHealth,
    data: {
      status: overallHealth ? 'healthy' : 'unhealthy',
      checks,
      timestamp: checks.timestamp,
      uptime: checks.uptime,
    },
  });
});

// Readiness check
router.get('/ready', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();

    res.json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'unified-wallet-service',
      },
    });
  } catch (error) {
    logger.error('Readiness check failed:', error instanceof Error ? error.message : String(error));
    res.status(503).json({
      success: false,
      error: 'Service not ready',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Liveness check
router.get('/live', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'unified-wallet-service',
    },
  });
});

export default router;