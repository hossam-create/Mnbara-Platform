import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';

const prisma = new PrismaClient();

export interface JWTPayload {
  userId: string;
  email: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

// Authentication middleware
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token is required'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Check if session exists and is valid
    const session = await prisma.userSession.findFirst({
      where: {
        sessionToken: token,
        userId: decoded.userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    // Check if user is active
    if (session.user.status !== 'ACTIVE') {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Account is disabled'
        }
      });
    }

    // Update last active time
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { lastActiveAt: new Date() }
    });

    // Update session last used time
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() }
    });

    // Attach user info to request
    req.user = {
      userId: session.user.id,
      email: session.user.email,
      roles: session.user.roles.map(ur => ur.role.name),
      permissions: session.user.roles.flatMap(ur => ur.role.permissions)
    };

    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

// Authorization middleware
export const authorize = (requiredRoles: string[] = [], requiredPermissions: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userRoles = req.user.roles || [];
    const userPermissions = req.user.permissions || [];

    // Check if user has required roles
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRequiredRole) {
        return res.status(403).json({
          status: 'error',
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions'
          }
        });
      }
    }

    // Check if user has required permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
      if (!hasRequiredPermission) {
        return res.status(403).json({
          status: 'error',
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions'
          }
        });
      }
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const session = await prisma.userSession.findFirst({
      where: {
        sessionToken: token,
        userId: decoded.userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (session && session.user.status === 'ACTIVE') {
      req.user = {
        userId: session.user.id,
        email: session.user.email,
        roles: session.user.roles.map(ur => ur.role.name),
        permissions: session.user.roles.flatMap(ur => ur.role.permissions)
      };

      // Update last active time
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { lastActiveAt: new Date() }
      });
    }

    next();

  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};

// Rate limiting middleware
export const rateLimitAuth = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const userAttempts = attempts.get(key);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        status: 'error',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts. Please try again later.',
          retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
        }
      });
    }
    
    userAttempts.count++;
    next();
  };
};