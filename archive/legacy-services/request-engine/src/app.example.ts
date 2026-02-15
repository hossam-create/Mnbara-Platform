/**
 * Express App Example
 * 
 * Example of how to integrate the dispute routes into your Express application.
 * This file shows the recommended setup for the Request Engine service.
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import { createRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { defaultRateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

/**
 * Create and configure Express application
 * 
 * @param db - PostgreSQL connection pool
 * @returns Configured Express application
 */
export function createApp(db: Pool): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Apply default rate limiter to all routes
  app.use(defaultRateLimiter);

  // Request logging
  app.use((req, res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  });

  // Mount routes
  const routes = createRoutes(db);
  app.use(routes);

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start the Express server
 * 
 * @param app - Express application
 * @param port - Port number
 */
export function startServer(app: Application, port: number): void {
  app.listen(port, () => {
    logger.info(`Request Engine service started on port ${port}`);
  });
}

// Example usage:
// const db = new Pool({ connectionString: process.env.DATABASE_URL });
// const app = createApp(db);
// startServer(app, 3000);
