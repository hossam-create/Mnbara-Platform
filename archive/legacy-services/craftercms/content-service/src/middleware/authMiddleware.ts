import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '@mnbara/shared-utils';
import { UnauthorizedError, ForbiddenError } from './errorHandler';

const logger = new Logger('AuthMiddleware');

/**
 * Authentication middleware
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Skip authentication for health check and public endpoints
    if (req.path === '/health' || req.path === '/api/docs') {
      return next();
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No valid authentication token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;

    // Add user to request
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
    };

    // Log successful authentication
    logger.debug(`User authenticated: ${req.user.id}`);
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid JWT token', error);
      return next(new UnauthorizedError('Invalid authentication token'));
    } else if (error.name === 'TokenExpiredError') {
      logger.warn('Expired JWT token', error);
      return next(new UnauthorizedError('Authentication token has expired'));
    } else {
      logger.error('Authentication error', error);
      return next(new UnauthorizedError('Authentication failed'));
    }
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      logger.warn(`User ${req.user.id} lacks required role: ${requiredRole}`);
      return next(new ForbiddenError(`Insufficient permissions. Required role: ${requiredRole}`));
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = userPermissions.includes(requiredPermission) || 
                         userPermissions.includes('admin') ||
                         req.user.role === 'admin';

    if (!hasPermission) {
      logger.warn(`User ${req.user.id} lacks required permission: ${requiredPermission}`);
      return next(new ForbiddenError(`Insufficient permissions. Required permission: ${requiredPermission}`));
    }

    next();
  };
};

/**
 * API key authentication middleware (for service-to-service communication)
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      throw new UnauthorizedError('API key required');
    }

    // Verify API key (in production, this should check against database)
    const validApiKey = process.env.API_KEY || 'your-api-key';
    if (apiKey !== validApiKey) {
      logger.warn('Invalid API key provided');
      throw new UnauthorizedError('Invalid API key');
    }

    // Mark as service account
    req.user = {
      id: 'service-account',
      email: 'service@mnbara.com',
      role: 'service',
      permissions: ['content:read', 'content:write', 'content:delete', 'content:publish'],
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware (allows both authenticated and unauthenticated requests)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    // Try to authenticate, but don't fail if it doesn't work
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, secret) as any;
      req.user = {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || [],
      };
    } catch (error) {
      // Invalid token, but continue without authentication
      logger.debug('Optional auth: Invalid token provided, continuing without auth');
    }

    next();
  } catch (error) {
    // Any other error, continue without authentication
    logger.debug('Optional auth error, continuing without auth', error);
    next();
  }
};

/**
 * Rate limiting by user ID
 */
export const userRateLimit = (windowMs: number, max: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting for authenticated users with special roles
    if (req.user && (req.user.role === 'admin' || req.user.role === 'service')) {
      return next();
    }

    // Apply rate limiting based on user ID or IP address
    const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    
    // This is a simplified implementation
    // In production, use express-rate-limit with Redis store
    logger.debug(`Rate limit check for: ${key}`);
    
    next();
  };
};