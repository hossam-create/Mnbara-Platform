/**
 * Authentication Middleware
 * JWT validation and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  correlationId?: string;
}

/**
 * Extract JWT token from request
 */
const extractToken = (req: Request): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check query parameter (for WebSocket connections)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  // Check cookie
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * Verify JWT token
 */
const verifyToken = (token: string): JwtPayload | null => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.debug('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.debug('Invalid token:', error.message);
    }
    return null;
  }
};

/**
 * Authentication middleware - requires valid JWT
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please provide a valid token.',
    });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token. Please login again.',
    });
    return;
  }

  // Attach user to request
  req.user = payload;

  // Forward user info to downstream services
  req.headers['x-user-id'] = payload.id;
  req.headers['x-user-email'] = payload.email;
  req.headers['x-user-role'] = payload.role;

  next();
};

/**
 * Optional authentication - attaches user if token present, but doesn't require it
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
      req.headers['x-user-id'] = payload.id;
      req.headers['x-user-email'] = payload.email;
      req.headers['x-user-role'] = payload.role;
    }
  }

  next();
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
};

/**
 * Create authentication middleware based on route config
 */
export const createAuthMiddleware = (requiresAuth: boolean, roles?: string[]) => {
  if (!requiresAuth) {
    return optionalAuth;
  }

  if (roles && roles.length > 0) {
    return [authenticate, authorize(...roles)];
  }

  return authenticate;
};
