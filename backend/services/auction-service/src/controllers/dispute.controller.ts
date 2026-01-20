// ============================================================
// PHASE 5.2 — Dispute Controller
// Control Center & Admin endpoints for dispute management
// ============================================================

import { Request, Response, NextFunction } from 'express';
import {
  disputeService,
  DisputeReason,
  ResolutionType,
  DisputeStatus,
} from '../services/dispute.service';

// Valid dispute reasons (for validation)
const VALID_REASONS = Object.values(DisputeReason);
const VALID_RESOLUTIONS = Object.values(ResolutionType);
const VALID_STATUSES = Object.values(DisputeStatus);

type AuthenticatedRequest = Request & { userId?: string; userRole?: string };

export class DisputeController {
  // ============================================================
  // CREATE DISPUTE
  // POST /api/v1/disputes
  // Allowed: System rules, Admin
  // ============================================================
  createDispute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId, bidId, reason } = req.body;
      const createdBy = (req as AuthenticatedRequest).userId || 'SYSTEM';

      // Validate required fields
      if (!auctionId || !bidId || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: auctionId, bidId, reason',
        });
      }

      // Validate reason is from allowed enum
      if (!VALID_REASONS.includes(reason)) {
        return res.status(400).json({
          success: false,
          error: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}`,
        });
      }

      const result = await disputeService.createDispute({
        auctionId: parseInt(auctionId),
        bidId: parseInt(bidId),
        reason: reason as DisputeReason,
        createdBy,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Dispute created. Auction settlement is now blocked until resolved.',
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error.message.includes('FORBIDDEN') ||
          error.message.includes('not found') ||
          error.message.includes('already')
        ) {
          return res.status(400).json({ success: false, error: error.message });
        }
      }
      next(error);
    }
  };

  // ============================================================
  // RESOLVE DISPUTE
  // POST /api/v1/disputes/:disputeId/resolve
  // Allowed: Admin with role-based access
  // ============================================================
  resolveDispute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { disputeId } = req.params;
      const { resolution, resolutionNote } = req.body;
      const resolvedBy = (req as AuthenticatedRequest).userId || 'ADMIN';

      // Validate required fields
      if (!resolution) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: resolution',
        });
      }

      // Validate resolution type
      if (!VALID_RESOLUTIONS.includes(resolution)) {
        return res.status(400).json({
          success: false,
          error: `Invalid resolution. Must be one of: ${VALID_RESOLUTIONS.join(', ')}`,
        });
      }

      const result = await disputeService.resolveDispute({
        disputeId: parseInt(disputeId),
        resolution: resolution as ResolutionType,
        resolutionNote,
        resolvedBy,
      });

      res.json({
        success: true,
        data: result,
        message: `Dispute resolved with: ${resolution}`,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error.message.includes('FORBIDDEN') ||
          error.message.includes('not found') ||
          error.message.includes('Cannot resolve')
        ) {
          return res.status(400).json({ success: false, error: error.message });
        }
      }
      next(error);
    }
  };

  // ============================================================
  // INVALIDATE BID
  // POST /api/v1/bids/:bidId/invalidate
  // Allowed: Admin BEFORE settlement only
  // ============================================================
  invalidateBid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bidId } = req.params;
      const { reason, disputeId } = req.body;
      const actorId = (req as AuthenticatedRequest).userId || 'ADMIN';

      // Validate required fields
      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: reason',
        });
      }

      // Validate reason
      if (!VALID_REASONS.includes(reason)) {
        return res.status(400).json({
          success: false,
          error: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}`,
        });
      }

      // TODO: Inject actual escrow release callback from wallet service
      const releaseEscrowCallback = async (bidId: number, auctionId: number): Promise<string | null> => {
        // This would call wallet-service to release escrow hold
        // For now, return null (no escrow)
        console.log(`[ESCROW] Would release escrow for bid ${bidId} on auction ${auctionId}`);
        return null;
      };

      const result = await disputeService.invalidateBid({
        bidId: parseInt(bidId),
        reason: reason as DisputeReason,
        disputeId: disputeId ? parseInt(disputeId) : undefined,
        actorId,
        releaseEscrowCallback,
      });

      res.json({
        success: true,
        data: result,
        message: 'Bid invalidated successfully. Auction ranking recomputed.',
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error.message.includes('FORBIDDEN') ||
          error.message.includes('not found') ||
          error.message.includes('already invalidated')
        ) {
          return res.status(400).json({ success: false, error: error.message });
        }
      }
      next(error);
    }
  };

  // ============================================================
  // GET DISPUTE
  // GET /api/v1/disputes/:disputeId
  // ============================================================
  getDispute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { disputeId } = req.params;

      const dispute = await disputeService.getDispute(parseInt(disputeId));

      if (!dispute) {
        return res.status(404).json({
          success: false,
          error: 'Dispute not found',
        });
      }

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // GET DISPUTES FOR AUCTION
  // GET /api/v1/auctions/:auctionId/disputes
  // ============================================================
  getDisputesForAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;
      const { status } = req.query;

      // Validate status if provided
      if (status && !VALID_STATUSES.includes(status as DisputeStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }

      const disputes = await disputeService.getDisputesForAuction(
        parseInt(auctionId),
        status as DisputeStatus | undefined
      );

      res.json({
        success: true,
        data: disputes,
        count: disputes.length,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // VALIDATE SETTLEMENT
  // GET /api/v1/auctions/:auctionId/settlement-validation
  // Used by settlement engine before settling
  // ============================================================
  validateSettlement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;

      const validation = await disputeService.validateSettlement(parseInt(auctionId));

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // GET ESCROW IMPACT PREVIEW
  // GET /api/v1/bids/:bidId/escrow-impact
  // Control Center preview before invalidation
  // ============================================================
  getEscrowImpactPreview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bidId } = req.params;

      const preview = await disputeService.getEscrowImpactPreview(parseInt(bidId));

      res.json({
        success: true,
        data: preview,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  };

  // ============================================================
  // GET ALL OPEN DISPUTES (Admin/Control Center)
  // GET /api/v1/disputes/open
  // ============================================================
  getAllOpenDisputes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, offset } = req.query;

      const result = await disputeService.getAllOpenDisputes(
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );

      res.json({
        success: true,
        data: result.disputes,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // GET INVALIDATION HISTORY
  // GET /api/v1/bids/:bidId/invalidation-history
  // ============================================================
  getInvalidationHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bidId } = req.params;

      const history = await disputeService.getInvalidationHistory(parseInt(bidId));

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const disputeController = new DisputeController();
