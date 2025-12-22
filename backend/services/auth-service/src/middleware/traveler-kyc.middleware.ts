/**
 * Traveler KYC Middleware
 * 
 * HARD-BLOCKS unverified travelers from accessing protected routes
 * 
 * Purpose: Trust, fraud prevention, dispute resolution ONLY
 * NO payments, NO wallets, NO FX, NO financial execution
 */

import { Request, Response, NextFunction } from 'express';
import { travelerKycService } from '../services/traveler-kyc.service';
import { TravelerKycStatus } from '../types/traveler-kyc.types';

/**
 * Require verified traveler KYC
 * 
 * Use this middleware on routes that require full traveler verification:
 * - Viewing shopper requests
 * - Accepting delivery requests
 * - Creating trips
 * - Any traveler-specific actions
 */
export async function requireVerifiedTraveler(
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

    // Check traveler KYC status
    const kycStatus = await travelerKycService.checkTravelerAccess(user.id);

    if (!kycStatus.isVerified) {
      res.status(403).json({
        error: {
          code: 'TRAVELER_KYC_REQUIRED',
          message: kycStatus.message,
          details: {
            status: kycStatus.status,
            canViewRequests: kycStatus.canViewRequests,
            canAcceptRequests: kycStatus.canAcceptRequests,
            applicationId: kycStatus.applicationId,
          },
        },
      });
      return;
    }

    // Attach KYC status to request for downstream use
    (req as any).travelerKyc = kycStatus;

    next();
  } catch (error: any) {
    console.error('Traveler KYC middleware error:', error);
    res.status(500).json({
      error: {
        code: 'KYC_CHECK_FAILED',
        message: 'Failed to verify traveler KYC status',
      },
    });
  }
}

/**
 * Check traveler KYC status (non-blocking)
 * 
 * Attaches KYC status to request but doesn't block
 * Use for routes that need to know KYC status but don't require it
 */
export async function checkTravelerKyc(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    if (user && user.id) {
      const kycStatus = await travelerKycService.checkTravelerAccess(user.id);
      (req as any).travelerKyc = kycStatus;
    }

    next();
  } catch (error) {
    // Non-blocking - just log and continue
    console.error('Traveler KYC check error:', error);
    next();
  }
}

/**
 * Require specific KYC status
 * 
 * Factory function to create middleware that requires specific status
 */
export function requireKycStatus(...allowedStatuses: TravelerKycStatus[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const kycStatus = await travelerKycService.checkTravelerAccess(user.id);

      if (!allowedStatuses.includes(kycStatus.status)) {
        res.status(403).json({
          error: {
            code: 'KYC_STATUS_INVALID',
            message: `KYC status must be one of: ${allowedStatuses.join(', ')}`,
            details: {
              currentStatus: kycStatus.status,
              requiredStatuses: allowedStatuses,
            },
          },
        });
        return;
      }

      (req as any).travelerKyc = kycStatus;
      next();
    } catch (error: any) {
      console.error('KYC status check error:', error);
      res.status(500).json({
        error: {
          code: 'KYC_CHECK_FAILED',
          message: 'Failed to verify KYC status',
        },
      });
    }
  };
}

/**
 * Block action if KYC is pending review
 * 
 * Use for actions that should be blocked while KYC is being reviewed
 */
export async function blockIfKycPending(
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

    const kycStatus = await travelerKycService.checkTravelerAccess(user.id);

    if (
      kycStatus.status === TravelerKycStatus.SUBMITTED ||
      kycStatus.status === TravelerKycStatus.UNDER_REVIEW
    ) {
      res.status(403).json({
        error: {
          code: 'KYC_PENDING_REVIEW',
          message: 'Your KYC application is being reviewed. Please wait for approval.',
          details: {
            status: kycStatus.status,
          },
        },
      });
      return;
    }

    (req as any).travelerKyc = kycStatus;
    next();
  } catch (error) {
    // Non-blocking on error
    next();
  }
}

/**
 * Express middleware type export
 */
export type TravelerKycMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;
