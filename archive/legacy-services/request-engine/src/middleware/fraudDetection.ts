import { Request, Response, NextFunction } from 'express';
import { FraudDetectionService } from '../services/FraudDetectionService';
import { FraudCheckType } from '../types/fraud.types';
import { logger } from '../utils/logger';

export interface FraudDetectionOptions {
  checkType: FraudCheckType;
  blockOnHighRisk?: boolean;
  requireReview?: boolean;
}

/**
 * Middleware factory for fraud detection
 */
export function fraudDetection(
  fraudService: FraudDetectionService,
  options: FraudDetectionOptions
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || null;
      const ipAddress = getClientIp(req);
      
      // Extract metadata from request
      const metadata = {
        userAgent: req.headers['user-agent'],
        deviceId: req.headers['x-device-id'],
        amount: req.body?.amount,
        endpoint: req.path,
        method: req.method,
      };

      // Perform fraud check
      const result = await fraudService.performFraudCheck(
        userId,
        ipAddress,
        options.checkType,
        metadata
      );

      // Attach result to request for downstream use
      (req as any).fraudCheck = result;

      // Handle blocking
      if (result.action === 'BLOCK') {
        logger.warn('Request blocked by fraud detection', {
          userId,
          ipAddress,
          riskLevel: result.riskLevel,
          flags: result.flags,
        });

        return res.status(403).json({
          error: 'Request blocked',
          message: 'This request has been flagged as potentially fraudulent',
          riskLevel: result.riskLevel,
          requestId: (req as any).requestId,
        });
      }

      // Handle review requirement
      if (options.requireReview && result.action === 'REVIEW') {
        logger.warn('Request requires review', {
          userId,
          ipAddress,
          riskLevel: result.riskLevel,
          flags: result.flags,
        });

        return res.status(403).json({
          error: 'Review required',
          message: 'This request requires manual review',
          riskLevel: result.riskLevel,
          requestId: (req as any).requestId,
        });
      }

      // Log high-risk requests that are allowed
      if (result.riskLevel === 'HIGH' && result.action === 'ALLOW') {
        logger.warn('High-risk request allowed', {
          userId,
          ipAddress,
          riskScore: result.riskScore,
          flags: result.flags,
        });
      }

      next();
    } catch (error) {
      logger.error('Fraud detection middleware error', { error });
      // Don't block request on fraud detection errors
      next();
    }
  };
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  // Check various headers for the real IP
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (forwarded as string).split(',');
    return ips[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp as string;
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Middleware to check if IP is blacklisted
 */
export function checkBlacklist(fraudService: FraudDetectionService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ipAddress = getClientIp(req);
      const alerts = await fraudService.getIpAlerts(ipAddress, 1);

      if (alerts.length > 0 && alerts[0].action === 'BLOCK') {
        logger.warn('Blacklisted IP attempted access', { ipAddress });

        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP address has been blocked',
        });
      }

      next();
    } catch (error) {
      logger.error('Blacklist check error', { error });
      // Don't block request on check errors
      next();
    }
  };
}
