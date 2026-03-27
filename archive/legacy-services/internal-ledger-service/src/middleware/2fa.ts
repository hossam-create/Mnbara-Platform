// ============================================================
// Two-Factor Authentication Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface Require2FAOptions {
  amountField?: string;
  threshold?: number;
}

/**
 * Require 2FA for high-value transactions
 */
export const require2FA = (options: Require2FAOptions = {}) => {
  const { amountField = 'amount', threshold = 500 } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if amount exceeds threshold
    const amount = req.body[amountField];
    if (amount && amount > threshold) {
      // Check if user has 2FA enabled
      if (!req.user.has2FA) {
        logger.warn('2FA required for high-value transaction', {
          userId: req.user.id,
          amount,
          threshold,
        });

        res.status(403).json({
          success: false,
          error: `Two-factor authentication required for transactions over $${threshold}`,
        });
        return;
      }

      // In production, verify 2FA token from request
      // For now, we assume 2FA is verified if user has it enabled
      const twoFactorToken = req.headers['x-2fa-token'];
      if (!twoFactorToken) {
        res.status(403).json({
          success: false,
          error: 'Two-factor authentication token required',
        });
        return;
      }

      // TODO: Verify 2FA token with authentication service
      // For now, we'll accept any token if user has 2FA enabled
    }

    next();
  };
};
