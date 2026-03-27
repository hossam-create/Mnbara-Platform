import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to require admin role
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  return next();
};

/**
 * Middleware to require any admin or manager role
 */
export const requireManager = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Manager access required',
    });
  }

  return next();
};

/**
 * Middleware to require specific roles
 */
export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required roles: ${roles.join(', ')}`,
      });
    }

    return next();
  };
};