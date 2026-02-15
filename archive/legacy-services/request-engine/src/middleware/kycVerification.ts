import { Request, Response, NextFunction } from 'express';
import { KYCService } from '../services/KYCService';
import { VerificationLevel, VERIFICATION_LIMITS } from '../types/kyc.types';
import { logger } from '../utils/logger';

export interface KYCVerificationOptions {
  requiredLevel?: VerificationLevel;
  checkAmount?: boolean;
  checkPayout?: boolean;
}

/**
 * Middleware to check KYC verification level
 */
export function kycVerification(
  kycService: KYCService,
  options: KYCVerificationOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Get user verification status
      const status = await kycService.getUserVerificationStatus(userId);

      // Attach to request for downstream use
      (req as any).verificationStatus = status;

      // Check required level
      if (options.requiredLevel) {
        const levelOrder = [
          VerificationLevel.UNVERIFIED,
          VerificationLevel.EMAIL_VERIFIED,
          VerificationLevel.PHONE_VERIFIED,
          VerificationLevel.ID_VERIFIED,
        ];

        const currentIndex = levelOrder.indexOf(status.verificationLevel);
        const requiredIndex = levelOrder.indexOf(options.requiredLevel);

        if (currentIndex < requiredIndex) {
          return res.status(403).json({
            error: 'Verification required',
            message: `This action requires ${options.requiredLevel} verification level`,
            currentLevel: status.verificationLevel,
            requiredLevel: options.requiredLevel,
            upgradeUrl: '/api/verification/upgrade',
          });
        }
      }

      // Check transaction amount
      if (options.checkAmount && req.body.amount) {
        const amount = parseFloat(req.body.amount);
        const check = await kycService.checkTransactionLimit(userId, amount);

        if (!check.allowed) {
          return res.status(403).json({
            error: 'Transaction limit exceeded',
            message: check.message,
            currentLevel: check.currentLevel,
            currentLimit: check.currentLimit,
            requestedAmount: check.requestedAmount,
            requiredLevel: check.requiredLevel,
            upgradeUrl: '/api/verification/upgrade',
          });
        }
      }

      // Check payout eligibility
      if (options.checkPayout && req.body.amount) {
        const amount = parseFloat(req.body.amount);
        const check = await kycService.checkPayoutEligibility(userId, amount);

        if (!check.allowed) {
          return res.status(403).json({
            error: 'Payout not allowed',
            message: check.message,
            currentLevel: check.currentLevel,
            currentLimit: check.currentLimit,
            requestedAmount: check.requestedAmount,
            requiredLevel: check.requiredLevel,
            upgradeUrl: '/api/verification/upgrade',
          });
        }
      }

      next();
    } catch (error) {
      logger.error('KYC verification middleware error', { error });
      return res.status(500).json({
        error: 'Verification check failed',
        message: 'Unable to verify user status',
      });
    }
  };
}

/**
 * Middleware to require email verification
 */
export function requireEmailVerification(kycService: KYCService) {
  return kycVerification(kycService, {
    requiredLevel: VerificationLevel.EMAIL_VERIFIED,
  });
}

/**
 * Middleware to require phone verification
 */
export function requirePhoneVerification(kycService: KYCService) {
  return kycVerification(kycService, {
    requiredLevel: VerificationLevel.PHONE_VERIFIED,
  });
}

/**
 * Middleware to require ID verification
 */
export function requireIdVerification(kycService: KYCService) {
  return kycVerification(kycService, {
    requiredLevel: VerificationLevel.ID_VERIFIED,
  });
}

/**
 * Middleware to check transaction amount against verification level
 */
export function checkTransactionLimit(kycService: KYCService) {
  return kycVerification(kycService, {
    checkAmount: true,
  });
}

/**
 * Middleware to check payout eligibility
 */
export function checkPayoutEligibility(kycService: KYCService) {
  return kycVerification(kycService, {
    checkPayout: true,
  });
}

/**
 * Get verification upgrade prompt
 */
export function getUpgradePrompt(
  currentLevel: VerificationLevel,
  requiredLevel: VerificationLevel
): any {
  const upgradeSteps: string[] = [];

  if (currentLevel === VerificationLevel.UNVERIFIED) {
    upgradeSteps.push('Verify your email address');
    if (
      requiredLevel === VerificationLevel.PHONE_VERIFIED ||
      requiredLevel === VerificationLevel.ID_VERIFIED
    ) {
      upgradeSteps.push('Verify your phone number');
    }
    if (requiredLevel === VerificationLevel.ID_VERIFIED) {
      upgradeSteps.push('Upload your ID document');
    }
  } else if (currentLevel === VerificationLevel.EMAIL_VERIFIED) {
    upgradeSteps.push('Verify your phone number');
    if (requiredLevel === VerificationLevel.ID_VERIFIED) {
      upgradeSteps.push('Upload your ID document');
    }
  } else if (currentLevel === VerificationLevel.PHONE_VERIFIED) {
    upgradeSteps.push('Upload your ID document');
  }

  return {
    currentLevel,
    requiredLevel,
    currentLimit: VERIFICATION_LIMITS[currentLevel],
    requiredLimit: VERIFICATION_LIMITS[requiredLevel],
    upgradeSteps,
    message: `To increase your transaction limit to $${VERIFICATION_LIMITS[requiredLevel]}, please complete the following steps:`,
  };
}
