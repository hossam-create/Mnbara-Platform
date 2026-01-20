// ============================================================
// PHASE 6.1 — Safeguard Controller
//
// API endpoints for safeguard management
// ============================================================

import { Request, Response } from 'express';
import { SafeguardPolicyEngine } from '../services/safeguard-policy.service';
import { SafeguardExecutionService } from '../services/safeguard-execution.service';
import { SafeguardStateService } from '../services/safeguard-state.service';

const safeguardPolicyEngine = new SafeguardPolicyEngine();
const safeguardExecutionService = new SafeguardExecutionService();
const safeguardStateService = new SafeguardStateService();

// ============================================================
// INTERNAL ENDPOINTS (System Only)
// ============================================================

/**
 * POST /internal/safeguards/evaluate
 * Evaluate safeguard policy and auto-execute if needed
 */
export const evaluateSafeguards = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      targetUserId,
      targetAuctionId,
      targetSellerId,
      signals,
      policyVersion,
    } = req.body;

    if (!signals) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: signals',
      });
    }

    // Evaluate policy
    const recommendation = await safeguardPolicyEngine.evaluatePolicy(
      targetUserId,
      targetAuctionId,
      targetSellerId,
      signals,
      policyVersion
    );

    // If recommendation, auto-execute safeguard
    if (recommendation && recommendation.shouldActivate) {
      const activation = await safeguardExecutionService.activateSafeguard({
        targetUserId,
        targetAuctionId,
        targetSellerId,
        safeguardType: recommendation.safeguardType,
        scope: recommendation.scope,
        durationMinutes: recommendation.durationMinutes,
        parameters: recommendation.parameters,
        reason: recommendation.reason,
        confidence: recommendation.confidence,
      });

      // Check escalation risk
      if (recommendation.escalationRisk) {
        const escalationRisk = await safeguardExecutionService.checkEscalationRisk(
          targetUserId,
          targetAuctionId,
          targetSellerId
        );

        if (escalationRisk) {
          await safeguardExecutionService.createEscalationReview(
            targetUserId,
            targetAuctionId,
            targetSellerId,
            `Escalation from safeguard: ${recommendation.reason}`
          );
        }
      }

      return res.status(200).json({
        success: true,
        recommendation,
        activation,
        message: 'Safeguard activated',
      });
    }

    return res.status(200).json({
      success: true,
      recommendation: null,
      message: 'No safeguard needed',
    });
  } catch (error: any) {
    console.error('[SAFEGUARD_EVALUATE_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

// ============================================================
// USER ENDPOINTS
// ============================================================

/**
 * GET /me/safeguards
 * Get user's active safeguards
 */
export const getUserSafeguards = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const state = await safeguardStateService.getUserSafeguardState(userId);
    const notification = await safeguardStateService.getUserNotification(userId);

    return res.status(200).json({
      success: true,
      ...state,
      notification,
    });
  } catch (error: any) {
    console.error('[USER_SAFEGUARDS_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /me/safeguards/check/:safeguardType
 * Check if specific safeguard is active
 */
export const checkUserSafeguard = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;
    const { safeguardType } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const safeguard = await safeguardStateService.checkSafeguard(
      safeguardType as any,
      userId
    );

    return res.status(200).json({
      success: true,
      safeguard,
      isActive: !!safeguard,
    });
  } catch (error: any) {
    console.error('[CHECK_SAFEGUARD_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /me/safeguards/apply/:action
 * Check if action should be limited by safeguard
 */
export const applySafeguardLimit = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;
    const { action } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const result = await safeguardStateService.applySafeguardLimit(
      action,
      userId
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[APPLY_LIMIT_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

// ============================================================
// ADMIN ENDPOINTS (Read-Only)
// ============================================================

/**
 * GET /admin/safeguards/active
 * Get all active safeguards
 */
export const getActiveSafeguards = async (
  req: Request,
  res: Response
) => {
  try {
    const { limit, offset } = req.query;

    const activations = await (global as any).prisma.safeguardActivation.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { activatedAt: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0,
      include: {
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });

    const total = await (global as any).prisma.safeguardActivation.count({
      where: { status: 'ACTIVE' },
    });

    return res.status(200).json({
      success: true,
      activations,
      pagination: {
        total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
        hasMore: (offset ? parseInt(offset as string) : 0) + activations.length < total,
      },
    });
  } catch (error: any) {
    console.error('[ACTIVE_SAFEGUARDS_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /admin/safeguards/history
 * Get safeguard history
 */
export const getSafeguardHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const { targetUserId, limit, offset } = req.query;

    const result = await safeguardExecutionService.getSafeguardHistory(
      targetUserId ? parseInt(targetUserId as string) : undefined,
      limit ? parseInt(limit as string) : 50,
      offset ? parseInt(offset as string) : 0
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[SAFEGUARD_HISTORY_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /admin/safeguards/:activationId
 * Get safeguard details
 */
export const getSafeguardDetails = async (
  req: Request,
  res: Response
) => {
  try {
    const { activationId } = req.params;

    const details = await safeguardExecutionService.getSafeguardDetails(
      parseInt(activationId)
    );

    if (!details) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Safeguard activation not found',
      });
    }

    return res.status(200).json({
      success: true,
      details,
    });
  } catch (error: any) {
    console.error('[SAFEGUARD_DETAILS_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/safeguards/:activationId/lift
 * Manually lift safeguard
 */
export const liftSafeguard = async (
  req: Request,
  res: Response
) => {
  try {
    const { activationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: reason',
      });
    }

    const lifted = await safeguardExecutionService.liftSafeguard({
      activationId: parseInt(activationId),
      reason,
    });

    return res.status(200).json({
      success: true,
      lifted,
      message: 'Safeguard lifted',
    });
  } catch (error: any) {
    console.error('[LIFT_SAFEGUARD_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

export default {
  evaluateSafeguards,
  getUserSafeguards,
  checkUserSafeguard,
  applySafeguardLimit,
  getActiveSafeguards,
  getSafeguardHistory,
  getSafeguardDetails,
  liftSafeguard,
};
