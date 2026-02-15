import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { DatabaseManager } from '../database/DatabaseManager';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Get database manager
    const dbManager = DatabaseManager.getInstance();
    const prisma = dbManager.getPrisma();

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });

    if (!user || !user.isActive || !user.isVerified) {
      res.status(401).json({
        success: false,
        error: 'Invalid token. User not found or inactive.'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired.'
      });
    } else {
      logger.error('Auth middleware error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    const dbManager = DatabaseManager.getInstance();
    const prisma = dbManager.getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });

    if (user && user.isActive && user.isVerified) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    next();
  }
};

export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions.'
      });
      return;
    }

    next();
  };
};

export const requireOwnershipOrRole = (resourceOwnerField: string, allowedRoles: string[] = ['admin', 'moderator']) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
      return;
    }

    const resourceId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has allowed role
    if (allowedRoles.includes(userRole)) {
      next();
      return;
    }

    try {
      const dbManager = DatabaseManager.getInstance();
      const prisma = dbManager.getPrisma();

      // Build dynamic query based on resource type
      const resource = await prisma[req.route.path.split('/')[2]]?.findUnique({
        where: { id: resourceId },
        select: { [resourceOwnerField]: true }
      });

      if (!resource) {
        res.status(404).json({
          success: false,
          error: 'Resource not found.'
        });
        return;
      }

      if (resource[resourceOwnerField] !== userId) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to access this resource.'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership check error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  };
};

export const rateLimitMiddleware = (windowMs: number = 60000, maxRequests: number = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const userRequests = requests.get(ip);
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
      return;
    }

    userRequests.count++;
    next();
  };
};

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      validateObject(req.body, schema.body, 'body', errors);
    }

    // Validate query
    if (schema.query) {
      validateObject(req.query, schema.query, 'query', errors);
    }

    // Validate params
    if (schema.params) {
      validateObject(req.params, schema.params, 'params', errors);
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  };
};

function validateObject(obj: any, schema: any, path: string, errors: string[]): void {
  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    const fullPath = `${path}.${key}`;

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fullPath} is required`);
      continue;
    }

    // Skip further validation if not required and not provided
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type check
    if (rules.type) {
      const actualType = getValueType(value);
      if (actualType !== rules.type) {
        errors.push(`${fullPath} must be of type ${rules.type}, got ${actualType}`);
        continue;
      }
    }

    // Min/Max for numbers
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${fullPath} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${fullPath} must be at most ${rules.max}`);
      }
    }

    // Min/Max length for strings
    if (rules.type === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(`${fullPath} must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(`${fullPath} must be at most ${rules.maxLength} characters long`);
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors.push(`${fullPath} does not match the required pattern`);
      }
    }

    // Array validation
    if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${fullPath} must be an array`);
        continue;
      }
      if (rules.minItems !== undefined && value.length < rules.minItems) {
        errors.push(`${fullPath} must have at least ${rules.minItems} items`);
      }
      if (rules.maxItems !== undefined && value.length > rules.maxItems) {
        errors.push(`${fullPath} must have at most ${rules.maxItems} items`);
      }
    }
  }
}

function getValueType(value: any): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (value instanceof Date) return 'date';
  return typeof value;
}