// ============================================================
// PHASE 6.2 — Trust Action Controller
//
// Admin/Control Center endpoints only
// Backend-only enforcement
// ============================================================

import { Request, Response } from 'express';
import { TrustActionService, TrustActionType, TrustSeverity } from '../services/trust-action.service';
import { TrustRuleEvaluator } from '../services/trust-rule-evaluator.service';

const trustActionService = new TrustActionService();
const trustRuleEvaluator = new TrustRuleEvaluator();

// ============================================================
// MIDDLEWARE: Verify Admin Role
// ============================================================
const verifyAdmin = (req: Request, res: Response, next: Function) => {
  const userRole = (req as any).user?.role;
  const isAdmin = userRole === 'ADMIN' || userRole === 'TRUST_SAFETY_ADMIN';

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only admins can access trust action endpoints',
    });
  }

  next();
};

// ============================================================
// ADMIN ENDPOINTS (Control Center Only)
// ============================================================

/**
 * POST /admin/control-center/trust-actions/execute
 * Execute trust action (backend-only)
 */
export const executeTrustAction = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      userId,
      walletId,
      auctionId,
      actionType,
      severity,
      reason,
      durationMinutes,
    } = req.body;

    if (!actionType || !severity || !reason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: actionType, severity, reason',
      });
    }

    if (!userId && !walletId && !auctionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Must specify at least one target: userId, walletId, or auctionId',
      });
    }

    const action = await trustActionService.executeTrustAction({
      userId,
      walletId,
      auctionId,
      actionType,
      severity,
      reason,
      durationMinutes,
    });

    return res.status(201).json({
      success: true,
      action,
      message: 'Trust action executed',
    });
  } catch (error: any) {
    console.error('[TRUST_ACTION_EXECUTE_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/control-center/trust-actions/evaluate
 * Evaluate user for trust actions
 */
export const evaluateTrustAction = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: userId',
      });
    }

    const evaluation = await trustRuleEvaluator.evaluateUserTrust(userId);

    return res.status(200).json({
      success: true,
      evaluation,
      message: 'Trust evaluation complete',
    });
  } catch (error: any) {
    console.error('[TRUST_EVALUATE_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /admin/control-center/trust-actions/active
 * Get all active trust actions
 */
export const getActiveTrustActions = async (
  req: Request,
  res: Response
) => {
  try {
    const { limit, offset } = req.query;

    const actions = await (global as any).prisma.trustAction.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { activatedAt: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0,
      include: {
        logs: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });

    const total = await (global as any).prisma.trustAction.count({
      where: { status: 'ACTIVE' },
    });

    return res.status(200).json({
      success: true,
      actions,
      pagination: {
        total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
        hasMore: (offset ? parseInt(offset as string) : 0) + actions.length < total,
      },
    });
  } catch (error: any) {
    console.error('[ACTIVE_TRUST_ACTIONS_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /admin/control-center/trust-actions/user/:userId
 * Get trust actions for user
 */
export const getUserTrustActions = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const { limit, offset } = req.query;

    const result = await trustActionService.getActionHistory(
      parseInt(userId),
      limit ? parseInt(limit as string) : 50,
      offset ? parseInt(offset as string) : 0
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[USER_TRUST_ACTIONS_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /admin/control-center/trust-actions/:actionId
 * Get trust action details
 */
export const getTrustActionDetails = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId } = req.params;

    const details = await trustActionService.getActionDetails(parseInt(actionId));

    if (!details) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Trust action not found',
      });
    }

    return res.status(200).json({
      success: true,
      details,
    });
  } catch (error: any) {
    console.error('[TRUST_ACTION_DETAILS_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/control-center/trust-actions/:actionId/lift
 * Lift trust action
 */
export const liftTrustAction = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user?.id;

    if (!reason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: reason',
      });
    }

    const lifted = await trustActionService.liftTrustAction(
      parseInt(actionId),
      adminId,
      reason
    );

    return res.status(200).json({
      success: true,
      lifted,
      message: 'Trust action lifted',
    });
  } catch (error: any) {
    console.error('[LIFT_TRUST_ACTION_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/control-center/trust-actions/:actionId/revert
 * Revert trust action
 */
export const revertTrustAction = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user?.id;

    if (!reason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: reason',
      });
    }

    const reverted = await trustActionService.revertTrustAction(
      parseInt(actionId),
      adminId,
      reason
    );

    return res.status(200).json({
      success: true,
      reverted,
      message: 'Trust action reverted',
    });
  } catch (error: any) {
    console.error('[REVERT_TRUST_ACTION_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/control-center/trust-actions/manual-flag
 * Manually flag user for trust action
 */
export const manualFlagUser = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, reason, severity } = req.body;
    const adminId = (req as any).user?.id;

    if (!userId || !reason || !severity) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: userId, reason, severity',
      });
    }

    // Evaluate manual flag
    const evaluation = await trustRuleEvaluator.evaluateManualFlag(
      userId,
      reason,
      severity
    );

    // Execute trust action
    const action = await trustActionService.executeTrustAction({
      userId,
      actionType: evaluation.actionType!,
      severity: evaluation.severity!,
      reason: evaluation.reason!,
      durationMinutes: evaluation.durationMinutes,
    });

    return res.status(201).json({
      success: true,
      action,
      message: 'User manually flagged and trust action executed',
    });
  } catch (error: any) {
    console.error('[MANUAL_FLAG_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

export default {
  verifyAdmin,
  executeTrustAction,
  evaluateTrustAction,
  getActiveTrustActions,
  getUserTrustActions,
  getTrustActionDetails,
  liftTrustAction,
  revertTrustAction,
  manualFlagUser,
};
