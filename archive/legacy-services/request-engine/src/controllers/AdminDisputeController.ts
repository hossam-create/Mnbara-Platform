// ============================================
// Admin Dispute Controller
// Admin-facing API endpoints for dispute management
// ============================================

import { Request, Response, NextFunction } from 'express';
import { DisputeService } from '../services/DisputeService';
import { ResolutionService } from '../services/ResolutionService';
import { DisputeFilters, ResolutionInput } from '../types/dispute.types';

const disputeService = new DisputeService();
const resolutionService = new ResolutionService();

/**
 * GET /api/admin/disputes
 * Get all disputes with filtering
 */
export async function getAllDisputes(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: DisputeFilters = {
      status: req.query.status as any,
      reason: req.query.reason as any,
      openedBy: req.query.openedBy as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await disputeService.getAllDisputes(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/disputes/:id
 * Get dispute details for admin
 */
export async function getDisputeDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const disputeId = req.params.id;
    const dispute = await disputeService.getDisputeById(disputeId, 'admin', 'ADMIN');

    res.json({
      success: true,
      data: dispute
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/disputes/:id/review
 * Mark dispute as under review
 */
export async function markUnderReview(req: Request, res: Response, next: NextFunction) {
  try {
    const disputeId = req.params.id;
    const adminId = (req.user?.id || 'admin-1') as string;

    const dispute = await disputeService.markUnderReview(disputeId, adminId);

    res.json({
      success: true,
      data: dispute
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/disputes/:id/resolve
 * Resolve a dispute
 */
export async function resolveDispute(req: Request, res: Response, next: NextFunction) {
  try {
    const disputeId = req.params.id;
    const adminId = (req.user?.id || 'admin-1') as string;
    
    const input: ResolutionInput = {
      resolution: req.body.resolution,
      resolutionPercentage: req.body.resolutionPercentage,
      adminNotes: req.body.adminNotes
    };

    const result = await resolutionService.resolveDispute(disputeId, input, adminId);

    res.json({
      success: result.success,
      data: result.dispute,
      error: result.error
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/disputes/stats
 * Get dispute statistics
 */
export async function getDisputeStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [disputeStats, resolutionStats] = await Promise.all([
      disputeService.getDisputeStats(),
      resolutionService.getResolutionStats()
    ]);

    res.json({
      success: true,
      data: {
        disputes: disputeStats,
        resolutions: resolutionStats
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/disputes/:id/close
 * Close a resolved dispute
 */
export async function closeDispute(req: Request, res: Response, next: NextFunction) {
  try {
    const disputeId = req.params.id;
    const adminId = (req.user?.id || 'admin-1') as string;

    // Import Prisma here to avoid circular dependencies
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Dispute closed successfully'
    });
  } catch (error) {
    next(error);
  }
}
