/**
 * Buyer Trust Middleware
 *
 * Access Rules:
 * - Unverified buyers CAN browse (no blocking)
 * - Verified required to submit purchase requests
 *
 * Constraints:
 * - Deterministic logic
 * - No scoring mutation
 * - No automation decisions
 * - Read-only trust indicators
 */

import { Request, Response, NextFunction } from 'express';
import { buyerTrustService } from '../services/buyer-trust.service';
import { BuyerVerificationStatus } from '../types/buyer-trust.types';

/**
 * Require verified buyer
 *
 * Use on routes that require buyer verification:
 * - Submitting purchase requests
 * - Creating offers
 * - Initiating transactions
 */
export async function requireVerifiedBuyer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    if (!user || !user.id) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const accessStatus = await buyerTrustService.checkBuyerAccess(user.id);

    if (!accessStatus.isVerified) {
      res.status(403).json({
        error: {
          code: 'BUYER_VERIFICATION_REQUIRED',
          message: accessStatus.message,
          details: {
            status: accessStatus.status,
            canBrowse: accessStatus.canBrowse,
            canSubmitRequests: accessStatus.canSubmitRequests,
            profileId: accessStatus.profileId,
          },
        },
      });
      return;
    }

    // Attach status to request
    (req as any).buyerTrust = accessStatus;
    next();
  } catch (error: any) {
    console.error('Buyer trust middleware error:', error);
    res.status(500).json({
      error: {
        code: 'BUYER_CHECK_FAILED',
        message: 'Failed to verify buyer status',
      },
    });
  }
}

/**
 * Check buyer status (non-blocking)
 *
 * Attaches buyer status to request but doesn't block.
 * Use for routes that need to know status but don't require verification.
 */
export async function checkBuyerStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    if (user && user.id) {
      const accessStatus = await buyerTrustService.checkBuyerAccess(user.id);
      (req as any).buyerTrust = accessStatus;
    }

    next();
  } catch (error) {
    // Non-blocking - just log and continue
    console.error('Buyer status check error:', error);
    next();
  }
}

/**
 * Block restricted buyers
 *
 * Use on routes that should block restricted accounts.
 * Unverified buyers are NOT blocked (they can browse).
 */
export async function blockRestrictedBuyer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    if (!user || !user.id) {
      next();
      return;
    }

    const accessStatus = await buyerTrustService.checkBuyerAccess(user.id);

    if (accessStatus.status === BuyerVerificationStatus.RESTRICTED) {
      res.status(403).json({
        error: {
          code: 'BUYER_RESTRICTED',
          message: accessStatus.message,
          details: {
            status: accessStatus.status,
          },
        },
      });
      return;
    }

    (req as any).buyerTrust = accessStatus;
    next();
  } catch (error) {
    // Non-blocking on error
    next();
  }
}

/**
 * Log buyer device activity
 *
 * Middleware to log device/IP for fraud detection.
 * Read-only - no automation decisions.
 */
export async function logBuyerActivity(activityType: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;

      if (user && user.id) {
        const accessStatus = await buyerTrustService.checkBuyerAccess(user.id);

        if (accessStatus.profileId) {
          await buyerTrustService.logDevice(user.id, accessStatus.profileId, {
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            deviceFingerprint: req.headers['x-device-fingerprint'] as string,
            userAgent: req.headers['user-agent'],
            activityType,
            activityDetails: {
              path: req.path,
              method: req.method,
            },
          });
        }
      }

      next();
    } catch (error) {
      // Non-blocking - just log and continue
      console.error('Device logging error:', error);
      next();
    }
  };
}

/**
 * Express middleware type export
 */
export type BuyerTrustMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;
