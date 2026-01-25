/**
 * Dispute Controller
 * 
 * Handles user-facing dispute endpoints.
 * Provides REST API for opening disputes, viewing disputes, and adding evidence.
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { DisputeService } from '../services/DisputeService';
import { DisputeReason, DisputeStatus } from '../types/dispute.types';
import { logger } from '../utils/logger';

export class DisputeController {
  private disputeService: DisputeService;

  constructor(db: Pool) {
    this.disputeService = new DisputeService(db);
  }

  /**
   * POST /api/requests/:id/dispute
   * Open a new dispute for a request
   */
  openDispute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = parseInt(req.params.id, 10);
      const userId = req.user?.id; // From auth middleware
      const { reason, description } = req.body;
      const evidenceFiles = req.files as Express.Multer.File[];

      logger.info('Opening dispute request', { requestId, userId, reason });

      // Validate input
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      if (!reason || !description) {
        res.status(400).json({
          success: false,
          error: 'Reason and description are required'
        });
        return;
      }

      if (!Object.values(DisputeReason).includes(reason)) {
        res.status(400).json({
          success: false,
          error: 'Invalid dispute reason'
        });
        return;
      }

      // Open dispute
      const dispute = await this.disputeService.openDispute(
        requestId,
        userId,
        reason as DisputeReason,
        description,
        evidenceFiles
      );

      res.status(201).json({
        success: true,
        data: {
          id: dispute.id,
          requestId: dispute.requestId,
          openedBy: dispute.openedBy,
          reason: dispute.reason,
          description: dispute.description,
          evidenceUrls: dispute.evidenceUrls,
          status: dispute.status,
          openedAt: dispute.openedAt
        }
      });
    } catch (error) {
      logger.error('Failed to open dispute', { error });
      next(error);
    }
  };

  /**
   * GET /api/disputes/my-disputes
   * Get user's disputes
   */
  getMyDisputes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { status, limit, offset } = req.query;

      logger.info('Getting user disputes', { userId });

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      // Validate status if provided
      if (status && !Object.values(DisputeStatus).includes(status as DisputeStatus)) {
        res.status(400).json({
          success: false,
          error: 'Invalid dispute status'
        });
        return;
      }

      const filters = {
        status: status as DisputeStatus | undefined,
        limit: limit ? parseInt(limit as string, 10) : 20,
        offset: offset ? parseInt(offset as string, 10) : 0
      };

      const result = await this.disputeService.getUserDisputes(userId, filters);

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
      logger.error('Failed to get user disputes', { error });
      next(error);
    }
  };

  /**
   * GET /api/disputes/:id
   * Get specific dispute details
   */
  getDisputeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const disputeId = req.params.id;
      const userId = req.user?.id;

      logger.info('Getting dispute by ID', { disputeId, userId });

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const dispute = await this.disputeService.getDisputeById(disputeId, userId);

      res.status(200).json({
        success: true,
        data: dispute
      });
    } catch (error) {
      logger.error('Failed to get dispute by ID', { error });
      next(error);
    }
  };

  /**
   * POST /api/disputes/:id/add-evidence
   * Add additional evidence to dispute
   */
  addEvidence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const disputeId = req.params.id;
      const userId = req.user?.id;
      const evidenceFiles = req.files as Express.Multer.File[];

      logger.info('Adding evidence to dispute', { disputeId, userId });

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      if (!evidenceFiles || evidenceFiles.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No evidence files provided'
        });
        return;
      }

      const result = await this.disputeService.addEvidence(
        disputeId,
        userId,
        evidenceFiles
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to add evidence', { error });
      next(error);
    }
  };
}
