import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { httpClient } from '../services/http-client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  body?: Record<string, unknown>;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const request = req as any;
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid authorization token provided',
        code: 'MISSING_TOKEN',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with auth-service
    try {
      const response = await httpClient.proxy('auth', {
        method: 'POST',
        path: '/api/auth/verify',
        body: { token },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        req.user = response.data as AuthenticatedRequest['user'];
        next();
      } else {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        });
      }
    } catch {
      // Fallback to local JWT verification
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions || [],
        };
        next();
      } catch {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const request = req as any;
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const response = await httpClient.proxy('auth', {
        method: 'POST',
        path: '/api/auth/verify',
        body: { token },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        req.user = response.data as AuthenticatedRequest['user'];
      }
    } catch {
      // Fallback to local JWT verification
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions || [],
        };
      } catch {
        // Ignore invalid token for optional auth
      }
    }

    next();
  } catch {
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

export const requirePermission = (...permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const hasPermission = permissions.every(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required permissions: ${permissions.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

export default authMiddleware;
