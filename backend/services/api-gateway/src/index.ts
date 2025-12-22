/**
 * MNBARA API Gateway
 * Central entry point for all microservices with authentication,
 * rate limiting, request validation, and logging
 */

import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options, fixRequestBody } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import middleware
import { correlationMiddleware } from './middleware/correlation.middleware';
import { requestLogger, errorLogger, logger } from './middleware/logging.middleware';
import { authenticate, optionalAuth, authorize, AuthenticatedRequest } from './middleware/auth.middleware';
import { createRateLimiter, globalRateLimiter, closeRateLimiter } from './middleware/rate-limiter.middleware';
import { sanitizeRequest, validateContentType } from './middleware/validation.middleware';

// Import config and services
import { servicesConfig, getAllRoutes, defaultRateLimit } from './config/routes.config';
import { getGatewayHealth, startHealthChecks } from './services/health-check.service';

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy (for correct IP detection behind load balancer)
app.set('trust proxy', true);

// Basic middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
}));

app.use(helmet({
  contentSecurityPolicy: false, // Disable for API gateway
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(correlationMiddleware as any);
app.use(requestLogger);
app.use(sanitizeRequest);
app.use(validateContentType(['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded']));
app.use(globalRateLimiter);

// Health check endpoints
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const health = await getGatewayHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 207 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to check health',
    });
  }
});

// API documentation endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    name: 'MNBARA API Gateway',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    services: servicesConfig.map((s) => ({
      name: s.name,
      routes: s.routes.map((r) => ({
        path: r.path,
        requiresAuth: r.requiresAuth,
        roles: r.roles,
      })),
    })),
  });
});

// Create proxy options with error handling
const createProxyOptions = (target: string, pathRewrite?: Record<string, string>): Options => ({
  target,
  changeOrigin: true,
  pathRewrite,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err: Error, req: Request, res: Response) => {
    logger.error('Proxy error', err, {
      target,
      path: req.path,
    });
    
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Service temporarily unavailable',
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    const authReq = req as AuthenticatedRequest;
    
    // Forward correlation ID
    if (authReq.correlationId) {
      proxyReq.setHeader('x-correlation-id', authReq.correlationId);
    }
    
    // Forward user info if authenticated
    if (authReq.user) {
      proxyReq.setHeader('x-user-id', authReq.user.id);
      proxyReq.setHeader('x-user-email', authReq.user.email);
      proxyReq.setHeader('x-user-role', authReq.user.role);
    }
    
    // Fix request body for POST/PUT/PATCH
    fixRequestBody(proxyReq, req);
  },
});

// Register routes for each service
servicesConfig.forEach((service) => {
  service.routes.forEach((route) => {
    const middlewares: any[] = [];
    
    // Add rate limiter if configured
    if (route.rateLimit) {
      middlewares.push(createRateLimiter(route.rateLimit, route.path));
    } else {
      middlewares.push(createRateLimiter(defaultRateLimit, route.path));
    }
    
    // Add authentication middleware
    if (route.requiresAuth) {
      middlewares.push(authenticate);
      
      // Add role-based authorization if roles specified
      if (route.roles && route.roles.length > 0) {
        middlewares.push(authorize(...route.roles));
      }
    } else {
      middlewares.push(optionalAuth);
    }
    
    // Create proxy middleware
    const proxyMiddleware = createProxyMiddleware(createProxyOptions(route.target, route.pathRewrite));
    
    // Register route
    if (route.methods && route.methods.length > 0) {
      route.methods.forEach((method) => {
        const httpMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
        app[httpMethod](route.path, ...middlewares, proxyMiddleware);
        app[httpMethod](`${route.path}/*`, ...middlewares, proxyMiddleware);
      });
    } else {
      app.use(route.path, ...middlewares, proxyMiddleware);
    }
    
    logger.info(`Registered route: ${route.path} -> ${route.target}`, {
      requiresAuth: route.requiresAuth,
      roles: route.roles,
      rateLimit: route.rateLimit,
    });
  });
});

// WebSocket upgrade handling for auction service
app.use('/ws', (req, res, next) => {
  // WebSocket connections are handled separately
  next();
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: '/api/v1',
  });
});

// Error handler
app.use(errorLogger);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = (err as any).statusCode || 500;
  
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    correlationId: (req as any).correlationId,
  });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down API Gateway...');
  
  try {
    await closeRateLimiter();
    logger.info('Rate limiter closed');
  } catch (error) {
    logger.error('Error closing rate limiter', error as Error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    servicesCount: servicesConfig.length,
    routesCount: getAllRoutes().length,
  });
  
  // Start periodic health checks
  startHealthChecks(60000);
});

// Handle WebSocket upgrades
server.on('upgrade', (request, socket, head) => {
  // WebSocket upgrade handling for real-time features
  logger.info('WebSocket upgrade request', {
    url: request.url,
  });
});

export default app;
