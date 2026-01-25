/**
 * Admin Dispute Controller
 * 
 * Handles admin-facing dispute endpoints.
 * Provides REST API for reviewing disputes, resolving disputes, and viewing statistics.
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { DisputeService } from '../services/DisputeService';
import { ResolutionService } from '../services/ResolutionService';
import { DisputeReason, DisputeStatus, DisputeResolution } from '../types/dispute.types';
import { logger } from '../utils/logger';

export class AdminDisputeController {
  private disputeService: DisputeService;
  private resolutionService: ResolutionService;

  constructor(db: Pool) {
    this.disputeService = new DisputeService(db);
    this.resolutionService = new ResolutionService(db);
  }

  /**
   * GET /api/admin/disputes
   * Get all disputes with filters
   */
  getAllDisputes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, reason, dateFrom, dateTo, search, limit, offset } = req.query;

      logger.info('Getting all disputes (admin)', { filters: req.query });

      // Validate status if provided
      if (status && !Object.values(DisputeStatus).includes(status as DisputeStatus)) {
        res.status(400).json({
          success: false,
          error: 'Invalid dispute status'
        });
        return;
      }

      // Validate reason if provided
      if (reason && !Object.values(DisputeReason).includes(reason as DisputeReason)) {
        res.status(400).json({
          success: false,
          error: 'Invalid dispute reason'
        });
        return;
      }

      const filters = {
        status: status as DisputeStatus | undefined,
        reason: reason as DisputeReason | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
        search: search as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0
      };

      const result = await this.disputeService.getAllDisputes(filters);

      res.status(200).json({
        success: true,
        data: result.disputes,
        pagination: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset
        }
      });
    } catch (error) {
      logger.error('Failed to get all disputes', { error });
      next(error);
    }
  };

  /**
   * GET /api/admin/disputes/:id
   * Get dispute details with full information
   */
  getDisputeDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const disputeId = req.params.id;

      logger.info('Getting dispute details (admin)', { disputeId });

      // For admin, we don't need userId check
      // We'll need to modify getDisputeById to support admin access
      // For now, we'll use a workaround by passing 0 as userId
      // TODO: Add getDisputeDetailsForAdmin method
      const dispute = await this.disputeService.getDisputeById(disputeId, 0);

      res.status(200).json({
        success: true,
        data: dispute
      });
    } catch (error) {
      logger.error('Failed to get dispute details', { error });
      next(error);
    }
  };

  /**
   * POST /api/admin/disputes/:id/review
   * Mark dispute as under review
   */
  markUnderReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const disputeId = req.params.id;
      const adminId = req.user?.id;

      logger.info('Marking dispute under review', { disputeId, adminId });

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const dispute = await this.disputeService.markUnderReview(disputeId, adminId);

      res.status(200).json({
        success: true,
        data: dispute
      });
    } catch (error) {
      logger.error('Failed to mark dispute under review', { error });
      next(error);
    }
  };

  /**
   * POST /api/admin/disputes/:id/resolve
   * Resolve a dispute
   */
  resolveDispute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const disputeId = req.params.id;
      const adminId = req.user?.id;
      const { resolution, percentage, notes } = req.body;

      logger.info('Resolving dispute', { disputeId, adminId, resolution });

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      // Validate resolution
      if (!resolution || !Object.values(DisputeResolution).includes(resolution)) {
        res.status(400).json({
          success: false,
          error: 'Invalid resolution type'
        });
        return;
      }

      // Validate percentage for partial refund
      if (resolution === DisputeResolution.PARTIAL_REFUND) {
        if (percentage === undefined || percentage < 0 || percentage > 100) {
          res.status(400).json({
            success: false,
            error: 'Percentage is required for partial refund and must be between 0 and 100'
          });
          return;
        }
      }

      let result;

      switch (resolution) {
        case DisputeResolution.REFUND_BUYER:
          result = await this.resolutionService.refundBuyer(disputeId, adminId, notes);
          break;

        case DisputeResolution.RELEASE_TO_SELLER:
          result = await this.resolutionService.releaseToSeller(disputeId, adminId, notes);
          break;

        case DisputeResolution.PARTIAL_REFUND:
          result = await this.resolutionService.partialRefund(
            disputeId,
            percentage,
            adminId,
            notes
          );
          break;

        default:
          res.status(400).json({
            success: false,
            error: 'Invalid resolution type'
          });
          return;
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to resolve dispute', { error });
      next(error);
    }
  };

  /**
   * GET /api/admin/disputes/stats
   * Get dispute statistics
   */
  getDisputeStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Getting dispute statistics');

      // TODO: Implement getDisputeStats in DisputeService
      // For now, return placeholder data
      const stats = {
        total: 0,
        byStatus: {
          open: 0,
          underReview: 0,
          resolved: 0,
          closed: 0
        },
        byReason: {
          notDelivered: 0,
          wrongItem: 0,
          damaged: 0,
          other: 0
        },
        byResolution: {
          refundBuyer: 0,
          releaseToSeller: 0,
          partialRefund: 0
        },
        averageResolutionTime: 0,
        refundRate: 0
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get dispute statistics', { error });
      next(error);
    }
  };
}
