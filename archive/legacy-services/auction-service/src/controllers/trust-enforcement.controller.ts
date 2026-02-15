// ============================================================
// PHASE 6.0 — Trust & Safety Enforcement Controller
//
// CRITICAL RULES:
// - All endpoints require Trust & Safety admin role
// - No frontend-triggered enforcement
// - All actions logged immutably
// - Dual approval required for Tier 3
// ============================================================

import { Request, Response } from 'express';
import {
  TrustEnforcementService,
  EnforcementActionType,
  EnforcementTier,
  EnforcementStatus,
} from '../services/trust-enforcement.service';
import { AppealService } from '../services/appeal.service';
import { EnforcementPolicyService } from '../services/enforcement-policy.service';

const trustEnforcementService = new TrustEnforcementService();
const appealService = new AppealService();
const enforcementPolicyService = new EnforcementPolicyService();

// ============================================================
// MIDDLEWARE: Verify Trust & Safety Admin Role
// ============================================================
const verifyTrustSafetyAdmin = (
  req: Request,
  res: Response,
  next: Function
) => {
  const userRole = (req as any).user?.role;
  const isTrustSafetyAdmin = userRole === 'TRUST_SAFETY_ADMIN';

  if (!isTrustSafetyAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only Trust & Safety admins can access enforcement endpoints',
    });
  }

  next();
};

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

/**
 * POST /admin/enforcement/review
 * Create enforcement review (PENDING_REVIEW status)
 */
export const createEnforcementReview = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      targetUserId,
      targetAuctionId,
      targetSellerId,
      recommendedAction,
      tier,
      evidence,
      justification,
      durationMinutes,
    } = req.body;

    // Validate required fields
    if (!recommendedAction || !tier || !justification) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: recommendedAction, tier, justification',
      });
    }

    // Validate at least one target
    if (!targetUserId && !targetAuctionId && !targetSellerId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Must specify at least one target: targetUserId, targetAuctionId, or targetSellerId',
      });
    }

    const action = await trustEnforcementService.createEnforcementReview({
      targetUserId,
      targetAuctionId,
      targetSellerId,
      recommendedAction,
      tier,
      evidence: evidence || {},
      justification,
      durationMinutes,
    });

    return res.status(201).json({
      success: true,
      action,
      message: 'Enforcement review created. Awaiting approval.',
    });
  } catch (error: any) {
    console.error('[ENFORCEMENT_REVIEW_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/enforcement/approve
 * Approve enforcement action (PENDING_REVIEW → APPROVED)
 */
export const approveEnforcementAction = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId } = req.body;
    const adminId = (req as any).user?.id;

    if (!actionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: actionId',
      });
    }

    const action = await trustEnforcementService.approveEnforcementAction(
      actionId,
      adminId
    );

    return res.status(200).json({
      success: true,
      action,
      message: 'Enforcement action approved. Ready for execution.',
    });
  } catch (error: any) {
    console.error('[ENFORCEMENT_APPROVE_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/enforcement/reject
 * Reject enforcement action (PENDING_REVIEW → REJECTED)
 */
export const rejectEnforcementAction = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId, reason } = req.body;
    const adminId = (req as any).user?.id;

    if (!actionId || !reason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: actionId, reason',
      });
    }

    const action = await trustEnforcementService.rejectEnforcementAction(
      actionId,
      adminId,
      reason
    );

    return res.status(200).json({
      success: true,
      action,
      message: 'Enforcement action rejected.',
    });
  } catch (error: any) {
    console.error('[ENFORCEMENT_REJECT_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/enforcement/execute
 * Execute approved enforcement action (APPROVED → EXECUTED)
 * Requires dual approval for Tier 3
 */
export const executeEnforcementAction = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId, secondApprovedBy, executionNote } = req.body;
    const adminId = (req as any).user?.id;

    if (!actionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: actionId',
      });
    }

    const action = await trustEnforcementService.executeEnforcementAction({
      actionId,
      approvedBy: adminId,
      secondApprovedBy,
      executionNote,
    });

    return res.status(200).json({
      success: true,
      action,
      message: 'Enforcement action executed. Appeal window created (72 hours).',
    });
  } catch (error: any) {
    console.error('[ENFORCEMENT_EXECUTE_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/enforcement/revert
 * Revert executed enforcement action (EXECUTED → REVERTED)
 */
export const revertEnforcementAction = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId, revertReason } = req.body;
    const adminId = (req as any).user?.id;

    if (!actionId || !revertReason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: actionId, revertReason',
      });
    }

    const action = await trustEnforcementService.revertEnforcementAction({
      actionId,
      revertedBy: adminId,
      revertReason,
    });

    return res.status(200).json({
      success: true,
      action,
      message: 'Enforcement action reverted.',
    });
  } catch (error: any) {
    console.error('[ENFORCEMENT_REVERT_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /admin/enforcement/actions
 * List enforcement actions with filters
 */
export const getEnforcementActions = async (
  req: Request,
  res: Response
) => {
  try {
    const { status, tier, targetUserId, limit, offset } = req.query;

    const result = await trustEnforcementService.getEnforcementActions({
      status: status as EnforcementStatus,
      tier: tier as EnforcementTier,
      targetUserId: targetUserId ? parseInt(targetUserId as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[ENFORCEMENT_LIST_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /admin/enforcement/actions/:actionId
 * Get enforcement action details
 */
export const getEnforcementAction = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId } = req.params;

    const action = await (global as any).prisma.enforcementAction.findUnique({
      where: { id: parseInt(actionId) },
      include: {
        evidence: true,
        auditLogs: { orderBy: { createdAt: 'desc' } },
        appeals: { include: { submissions: true, decision: true } },
      },
    });

    if (!action) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Enforcement action not found',
      });
    }

    return res.status(200).json({
      success: true,
      action,
    });
  } catch (error: any) {
    console.error('[ENFORCEMENT_GET_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /admin/enforcement/policy/evaluate
 * Evaluate policy against signals (recommendation only)
 */
export const evaluatePolicy = async (
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

    const recommendation = await enforcementPolicyService.evaluatePolicy({
      targetUserId,
      targetAuctionId,
      targetSellerId,
      signals,
      policyVersion,
    });

    return res.status(200).json({
      success: true,
      recommendation,
      message: 'Policy evaluation complete. This is a recommendation only.',
    });
  } catch (error: any) {
    console.error('[POLICY_EVALUATE_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

// ============================================================
// APPEAL ENDPOINTS
// ============================================================

/**
 * POST /admin/appeals/decide
 * Admin decides on appeal (APPROVED or REJECTED)
 */
export const decideAppeal = async (
  req: Request,
  res: Response
) => {
  try {
    const { appealId, decision, justification } = req.body;
    const adminId = (req as any).user?.id;

    if (!appealId || !decision || !justification) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: appealId, decision, justification',
      });
    }

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Decision must be APPROVED or REJECTED',
      });
    }

    const result = await appealService.decideAppeal({
      appealId,
      decision,
      decidedBy: adminId,
      justification,
    });

    return res.status(200).json({
      success: true,
      ...result,
      message: `Appeal ${decision.toLowerCase()}. User notified.`,
    });
  } catch (error: any) {
    console.error('[APPEAL_DECIDE_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /admin/appeals/open
 * Get open appeals awaiting decision
 */
export const getOpenAppeals = async (
  req: Request,
  res: Response
) => {
  try {
    const { limit, offset } = req.query;

    const result = await appealService.getOpenAppeals(
      limit ? parseInt(limit as string) : 50,
      offset ? parseInt(offset as string) : 0
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[APPEALS_LIST_ERROR]', error);
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
 * GET /me/enforcement-status
 * Get user's enforcement status and active appeals
 */
export const getEnforcementStatus = async (
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

    const status = await trustEnforcementService.getEnforcementStatus(userId);

    return res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    console.error('[ENFORCEMENT_STATUS_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /me/appeal
 * User submits appeal during appeal window
 */
export const submitAppeal = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId, reason, evidence } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    if (!actionId || !reason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: actionId, reason',
      });
    }

    const result = await appealService.submitAppeal({
      actionId,
      userId,
      reason,
      evidence: evidence || {},
    });

    return res.status(201).json({
      success: true,
      ...result,
      message: 'Appeal submitted. Admin will review within 72 hours.',
    });
  } catch (error: any) {
    console.error('[APPEAL_SUBMIT_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /me/appeals
 * Get user's appeals
 */
export const getUserAppeals = async (
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

    const appeals = await appealService.getAppealsForUser(userId);

    return res.status(200).json({
      success: true,
      appeals,
    });
  } catch (error: any) {
    console.error('[USER_APPEALS_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /me/appeal-window/:actionId
 * Check if appeal window is still open for an action
 */
export const getAppealWindowInfo = async (
  req: Request,
  res: Response
) => {
  try {
    const { actionId } = req.params;

    const info = await appealService.getAppealWindowInfo(parseInt(actionId));

    return res.status(200).json({
      success: true,
      ...info,
    });
  } catch (error: any) {
    console.error('[APPEAL_WINDOW_ERROR]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

export default {
  verifyTrustSafetyAdmin,
  createEnforcementReview,
  approveEnforcementAction,
  rejectEnforcementAction,
  executeEnforcementAction,
  revertEnforcementAction,
  getEnforcementActions,
  getEnforcementAction,
  evaluatePolicy,
  decideAppeal,
  getOpenAppeals,
  getEnforcementStatus,
  submitAppeal,
  getUserAppeals,
  getAppealWindowInfo,
};
