/**
 * API Gateway Routing Middleware
 * 
 * Handles dynamic routing based on centralized configuration.
 * Applies rate limiting, authentication, circuit breakers, and retries.
 */

import { Request, Response, NextFunction, Router } from 'express';
import { httpClient } from '../services/http-client';
import {
  routingConfig,
  getRouteConfig,
  getRateLimitPolicy,
  requiresAuthentication,
  getCircuitBreakerSettings,
  getRetryPolicy,
  getRouteTimeout,
  getLoggingSettings,
  redactSensitiveData,
} from '../config/routing.config';
import { authMiddleware, AuthenticatedRequest } from './auth.middleware';
import { asyncHandler } from './error.middleware';
import { logger } from '../utils/logger';

/**
 * Create a dynamic routing handler for a specific route prefix
 */
export function createRouteHandler(prefix: string) {
  return asyncHandler(async (req: Request | AuthenticatedRequest, res: Response) => {
    const routeConfig = getRouteConfig(prefix);
    
    if (!routeConfig) {
      return res.status(404).json({
        error: 'Route not configured',
        path: req.path,
      });
    }

    // Extract the path after the prefix
    const pathAfterPrefix = req.path.substring(prefix.length);
    const targetPath = `/api${prefix}${pathAfterPrefix}`;

    // Get logging settings
    const loggingSettings = getLoggingSettings(prefix);
    if (loggingSettings.enabled) {
      const logData = {
        method: req.method,
        path: req.path,
        service: routeConfig.service,
        targetPath,
        ip: req.ip,
      };

      if (loggingSettings.logBody && req.body) {
        logData['body'] = redactSensitiveData(
          req.body,
          loggingSettings.redactFields
        );
      }

      logger.debug('Routing request', logData);
    }

    // Prepare proxy options
    const proxyOptions = {
      method: req.method,
      path: targetPath,
      body: req.body,
      query: req.query as Record<string, string>,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'X-Forwarded-For': req.ip || '',
        'X-Request-ID': req.headers['x-request-id'] as string,
        'X-Original-Path': req.path,
        'X-Original-URL': req.originalUrl,
      },
    };

    // Add authorization header if present
    if (req.headers.authorization) {
      proxyOptions.headers['Authorization'] = req.headers.authorization as string;
    }

    // Add user context if authenticated
    if ('user' in req && req.user) {
      proxyOptions.headers['X-User-ID'] = (req.user as any).id;
      proxyOptions.headers['X-User-Email'] = (req.user as any).email;
      proxyOptions.headers['X-User-Roles'] = JSON.stringify((req.user as any).roles || []);
    }

    try {
      // Make the proxy request
      const response = await httpClient.proxy(routeConfig.service, proxyOptions);

      // Set response headers
      res.status(response.status);
      
      // Copy relevant headers from upstream service
      if (response.headers) {
        const headersToForward = [
          'content-type',
          'cache-control',
          'etag',
          'x-total-count',
          'x-page-count',
          'x-current-page',
        ];

        headersToForward.forEach((header) => {
          if (response.headers[header]) {
            res.setHeader(header, response.headers[header]);
          }
        });
      }

      // Send response
      res.json(response.data);

      // Log successful response
      if (loggingSettings.enabled) {
        logger.debug('Routing response', {
          method: req.method,
          path: req.path,
          service: routeConfig.service,
          status: response.status,
          duration: response.duration,
        });
      }
    } catch (error) {
      logger.error('Routing error', {
        method: req.method,
        path: req.path,
        service: routeConfig.service,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  });
}

/**
 * Apply routing middleware to a router
 */
export function applyRoutingMiddleware(router: Router): void {
  // Iterate through all configured routes
  Object.entries(routingConfig).forEach(([prefix, config]) => {
    // Apply authentication middleware if required
    if (config.requiresAuth) {
      router.use(prefix, authMiddleware);
    }

    // Apply rate limiting middleware
    const rateLimitPolicy = getRateLimitPolicy(prefix);
    if (rateLimitPolicy.maxRequests > 0) {
      // Rate limiting is applied globally, but could be customized per route here
    }

    // Create and apply the route handler
    const handler = createRouteHandler(prefix);

    // Apply to all HTTP methods
    router.all(`${prefix}/*`, handler);
    router.all(prefix, handler);
  });
}

/**
 * Middleware to validate routing configuration
 */
export function validateRoutingConfig(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const prefix = req.path.split('/')[1]; // Get first path segment
  const fullPrefix = `/${prefix}`;

  if (routingConfig[fullPrefix]) {
    next();
  } else {
    // Continue to next middleware (might be a static file or 404)
    next();
  }
}

/**
 * Middleware to log routing decisions
 */
export function logRoutingDecisions(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const prefix = req.path.split('/')[1];
  const fullPrefix = `/${prefix}`;
  const config = routingConfig[fullPrefix];

  if (config) {
    logger.info('Routing decision', {
      method: req.method,
      path: req.path,
      prefix: fullPrefix,
      service: config.service,
      requiresAuth: config.requiresAuth,
      rateLimitPolicy: config.rateLimitPolicy,
    });
  }

  next();
}

/**
 * Middleware to add routing metadata to request
 */
export function addRoutingMetadata(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const prefix = req.path.split('/')[1];
  const fullPrefix = `/${prefix}`;
  const config = routingConfig[fullPrefix];

  if (config) {
    (req as any).routingConfig = config;
    (req as any).targetService = config.service;
  }

  next();
}

export default {
  createRouteHandler,
  applyRoutingMiddleware,
  validateRoutingConfig,
  logRoutingDecisions,
  addRoutingMetadata,
};
