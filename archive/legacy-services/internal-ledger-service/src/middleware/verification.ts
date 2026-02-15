// ============================================================
// User Verification Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Require verified user
 */
export const requireVerification = (
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

  if (!req.user.isVerified) {
    logger.warn('Unverified user attempted restricted action', {
      userId: req.user.id,
    });

    res.status(403).json({
      success: false,
      error: 'User verification required. Please complete KYC verification.',
    });
    return;
  }

  next();
};
