/**
 * Require Admin Middleware
 * 
 * Ensures the authenticated user has admin role.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Require admin middleware
 * Checks if user has admin role
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'admin') {
      logger.warn('Non-admin user attempted to access admin endpoint', {
        userId: user.id,
        role: user.role
      });

      res.status(403).json({
        success: false,
        error: 'Forbidden: Admin access required'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Admin authorization failed', { error });

    res.status(500).json({
      success: false,
      error: 'Authorization error'
    });
  }
};
