// ============================================================
// Admin Payout Controller - Admin endpoints for managing payouts
// ============================================================

import { Request, Response } from 'express';
import { PayoutService } from '../services/payout.service';
import { PayoutError } from '../errors/WalletErrors';
import { logger } from '../utils/logger';

const payoutService = new PayoutService();

export class AdminPayoutController {
  /**
   * GET /api/admin/payouts/pending
   * Get all pending payout requests
   */
  async getPendingPayouts(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { minAmount, maxAmount, limit, offset } = req.query;

      logger.info('Admin fetching pending payouts', { adminId });

      const requests = await payoutService.getPendingPayoutRequests({
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      // Don't decrypt account details in list view
      const sanitizedRequests = requests.map((req) => ({
        ...req,
        accountDetails: undefined,
      }));

      res.status(200).json({
        success: true,
        data: sanitizedRequests,
      });
    } catch (error) {
      logger.error('Failed to get pending payouts', error as Error, {
        adminId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve pending payouts',
      });
    }
  }

  /**
   * GET /api/admin/payouts/:id
   * Get a specific payout request with decrypted account details
   */
  async getPayoutDetails(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { id } = req.params;

      logger.info('Admin fetching payout details', { adminId, requestId: id });

      const request = await payoutService.getPayoutRequestById(id, true);

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      logger.error('Failed to get payout details', error as Error, {
        adminId: req.user?.id,
        requestId: req.params.id,
      });

      if (error instanceof PayoutError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payout details',
      });
    }
  }

  /**
   * POST /api/admin/payouts/:id/approve
   * Approve a payout request
   */
  async approvePayoutRequest(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { id } = req.params;

      logger.info('Admin approving payout', { adminId, requestId: id });

      const updatedRequest = await payoutService.approvePayoutRequest(
        id,
        adminId
      );

      res.status(200).json({
        success: true,
        data: {
          ...updatedRequest,
          accountDetails: undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to approve payout', error as Error, {
        adminId: req.user?.id,
        requestId: req.params.id,
      });

      if (error instanceof PayoutError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to approve payout request',
      });
    }
  }

  /**
   * POST /api/admin/payouts/:id/reject
   * Reject a payout request
   */
  async rejectPayoutRequest(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        res.status(400).json({
          success: false,
          error: 'Rejection reason is required',
        });
        return;
      }

      logger.info('Admin rejecting payout', {
        adminId,
        requestId: id,
        reason: rejectionReason,
      });

      const updatedRequest = await payoutService.rejectPayoutRequest(
        id,
        adminId,
        rejectionReason
      );

      res.status(200).json({
        success: true,
        data: {
          ...updatedRequest,
          accountDetails: undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to reject payout', error as Error, {
        adminId: req.user?.id,
        requestId: req.params.id,
      });

      if (error instanceof PayoutError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to reject payout request',
      });
    }
  }

  /**
   * POST /api/admin/payouts/:id/process
   * Mark payout as processing (admin is manually processing the bank transfer)
   */
  async markAsProcessing(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { id } = req.params;

      logger.info('Admin marking payout as processing', {
        adminId,
        requestId: id,
      });

      const updatedRequest = await payoutService.markPayoutAsProcessing(
        id,
        adminId
      );

      res.status(200).json({
        success: true,
        data: {
          ...updatedRequest,
          accountDetails: undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to mark payout as processing', error as Error, {
        adminId: req.user?.id,
        requestId: req.params.id,
      });

      if (error instanceof PayoutError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to mark payout as processing',
      });
    }
  }

  /**
   * POST /api/admin/payouts/:id/complete
   * Complete a payout request (after manual bank transfer is done)
   */
  async completePayoutRequest(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { id } = req.params;
      const { notes } = req.body;

      logger.info('Admin completing payout', { adminId, requestId: id });

      const updatedRequest = await payoutService.completePayoutRequest(
        id,
        adminId,
        notes
      );

      res.status(200).json({
        success: true,
        data: {
          ...updatedRequest,
          accountDetails: undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to complete payout', error as Error, {
        adminId: req.user?.id,
        requestId: req.params.id,
      });

      if (error instanceof PayoutError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to complete payout request',
      });
    }
  }
}

export const adminPayoutController = new AdminPayoutController();
