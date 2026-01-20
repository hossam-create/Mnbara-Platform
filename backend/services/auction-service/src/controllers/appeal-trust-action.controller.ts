// ============================================================
// PHASE 6.3 — Appeal Trust Action Controller
//
// CRITICAL RULES:
// ❌ Appeals can NEVER auto-reverse enforcement
// ❌ Appeals can NEVER modify ledger entries
// ❌ Appeals can NEVER release escrow
// ❌ Appeals can NEVER be decided by Frontend
// ❌ No deletes, no updates to historical actions
//
// ✅ Appeals are REQUESTS only
// ✅ Decisions are ADMIN / CONTROL CENTER only
// ✅ Every step is logged and immutable
// ============================================================

import { Request, Response } from 'express';
import { appealTrustActionService } from '../services/appeal-trust-action.service';
import { appealReviewService } from '../services/appeal-review.service';
import {
  AppealSubmissionRequest,
  AppealReason,
  SubjectType,
} from '../services/appeal-trust-action.service';

export class AppealTrustActionController {
  // ============================================================
  // USER ENDPOINTS
  // ============================================================

  /**
   * POST /api/v1/appeals
   * User submits appeal for trust action
   */
  async submitAppeal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { trustActionId, subjectType, subjectId, appealReason, userStatement, evidence } =
        req.body;

      // Validate required fields
      if (!trustActionId || !subjectType || !subjectId || !appealReason || !userStatement) {
        res.status(400).json({
          error: 'Missing required fields: trustActionId, subjectType, subjectId, appealReason, userStatement',
        });
        return;
      }

      // Validate enums
      if (!Object.values(SubjectType).includes(subjectType)) {
        res.status(400).json({ error: 'Invalid subjectType' });
        return;
      }

      if (!Object.values(AppealReason).includes(appealReason)) {
        res.status(400).json({ error: 'Invalid appealReason' });
        return;
      }

      const params: AppealSubmissionRequest = {
        trustActionId,
        subjectType,
        subjectId,
        appealReason,
        userStatement,
        evidence: evidence || {},
      };

      const appeal = await appealTrustActionService.submitAppeal(params);

      res.status(201).json({
        success: true,
        appeal,
        message: 'Appeal submitted successfully',
      });
    } catch (error: any) {
      console.error('[APPEAL_SUBMIT_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/appeals/:appealId
   * Get appeal details (user can see their own appeals)
   */
  async getAppeal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { appealId } = req.params;

      const appeal = await appealTrustActionService.getAppeal(parseInt(appealId));

      if (!appeal) {
        res.status(404).json({ error: 'Appeal not found' });
        return;
      }

      // Verify user owns this appeal
      if (appeal.trustAction?.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.status(200).json({
        success: true,
        appeal,
      });
    } catch (error: any) {
      console.error('[APPEAL_GET_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/appeals
   * Get user's appeals
   */
  async getUserAppeals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const appeals = await appealTrustActionService.getAppealsForUser(userId);

      res.status(200).json({
        success: true,
        appeals,
        pagination: {
          total: appeals.length,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      console.error('[APPEAL_LIST_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // ============================================================
  // ADMIN / CONTROL CENTER ENDPOINTS
  // ============================================================

  /**
   * GET /admin/control-center/appeals/pending
   * Get pending appeals (admin only)
   */
  async getPendingAppeals(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CONTROL_CENTER') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await appealTrustActionService.getPendingAppeals(limit, offset);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('[APPEAL_PENDING_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /admin/control-center/appeals/:appealId
   * Get appeal details (admin only)
   */
  async getAppealAdmin(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CONTROL_CENTER') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const { appealId } = req.params;

      const appeal = await appealTrustActionService.getAppeal(parseInt(appealId));

      if (!appeal) {
        res.status(404).json({ error: 'Appeal not found' });
        return;
      }

      res.status(200).json({
        success: true,
        appeal,
      });
    } catch (error: any) {
      console.error('[APPEAL_GET_ADMIN_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /admin/control-center/appeals/:appealId/assign
   * Assign reviewer to appeal (admin only)
   */
  async assignReviewer(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CONTROL_CENTER') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const { appealId } = req.params;
      const { assignedTo } = req.body;

      if (!assignedTo) {
        res.status(400).json({ error: 'Missing required field: assignedTo' });
        return;
      }

      const appeal = await appealReviewService.assignReviewer({
        appealId: parseInt(appealId),
        assignedTo,
      });

      res.status(200).json({
        success: true,
        appeal,
        message: 'Reviewer assigned successfully',
      });
    } catch (error: any) {
      console.error('[APPEAL_ASSIGN_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /admin/control-center/appeals/:appealId/approve
   * Approve appeal and create reversal action (admin only, dual approval required)
   */
  async approveAppeal(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CONTROL_CENTER') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const { appealId } = req.params;
      const { justification, secondApprovedBy } = req.body;

      if (!justification || !secondApprovedBy) {
        res.status(400).json({
          error: 'Missing required fields: justification, secondApprovedBy (dual approval required)',
        });
        return;
      }

      const decidedBy = req.user?.id || req.user?.email || 'SYSTEM';

      const result = await appealReviewService.approveAppeal({
        appealId: parseInt(appealId),
        decision: 'APPROVED',
        justification,
        decidedBy,
        secondApprovedBy,
      });

      res.status(200).json({
        success: true,
        appeal: result.appeal,
        reversalAction: result.reversalAction,
        message: 'Appeal approved and reversal action created',
      });
    } catch (error: any) {
      console.error('[APPEAL_APPROVE_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /admin/control-center/appeals/:appealId/reject
   * Reject appeal (admin only)
   */
  async rejectAppeal(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CONTROL_CENTER') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const { appealId } = req.params;
      const { justification } = req.body;

      if (!justification) {
        res.status(400).json({ error: 'Missing required field: justification' });
        return;
      }

      const decidedBy = req.user?.id || req.user?.email || 'SYSTEM';

      const appeal = await appealReviewService.rejectAppeal({
        appealId: parseInt(appealId),
        decision: 'REJECTED',
        justification,
        decidedBy,
      });

      res.status(200).json({
        success: true,
        appeal,
        message: 'Appeal rejected',
      });
    } catch (error: any) {
      console.error('[APPEAL_REJECT_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /admin/control-center/appeals/:appealId/timeline
   * Get appeal timeline (admin only)
   */
  async getAppealTimeline(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CONTROL_CENTER') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const { appealId } = req.params;

      const timeline = await appealReviewService.getAppealTimeline(parseInt(appealId));

      res.status(200).json({
        success: true,
        ...timeline,
      });
    } catch (error: any) {
      console.error('[APPEAL_TIMELINE_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /admin/control-center/appeals
   * Get all appeals history (admin only)
   */
  async getAppealHistory(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CONTROL_CENTER') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const trustActionId = req.query.trustActionId
        ? parseInt(req.query.trustActionId as string)
        : undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await appealTrustActionService.getAppealHistory(trustActionId, limit, offset);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('[APPEAL_HISTORY_ERROR]', error.message);
      res.status(400).json({ error: error.message });
    }
  }
}

// Export singleton instance
export const appealTrustActionController = new AppealTrustActionController();
