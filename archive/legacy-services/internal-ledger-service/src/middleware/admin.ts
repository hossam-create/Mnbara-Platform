// ============================================================
// Admin Role Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Require admin role
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    logger.warn('Unauthorized admin access attempt', {
      userId: req.user.id,
      role: req.user.role,
    });

    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  next();
};
