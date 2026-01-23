// ============================================================
// Payout Controller - User endpoints for payout requests
// ============================================================

import { Request, Response } from 'express';
import { PayoutService } from '../services/payout.service';
import { PayoutError, InsufficientBalanceError } from '../errors/WalletErrors';
import { logger } from '../utils/logger';

const payoutService = new PayoutService();

export class PayoutController {
  /**
   * POST /api/payouts/request
   * Create a new payout request
   */
  async createPayoutRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id; // From auth middleware
      const { walletId, amount, currency, method, accountDetails } = req.body;

      // Validation
      if (!walletId || !amount || !method || !accountDetails) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: walletId, amount, method, accountDetails',
        });
        return;
      }

      // Check if user is verified (required for payouts)
      if (!req.user?.isVerified) {
        res.status(403).json({
          success: false,
          error: 'User must be verified to request payouts',
        });
        return;
      }

      // Check if 2FA is required for amounts > $500
      if (amount > 500 && !req.user?.has2FA) {
        res.status(403).json({
          success: false,
          error: 'Two-factor authentication required for payouts over $500',
        });
        return;
      }

      logger.info('Creating payout request', {
        userId,
        walletId,
        amount,
        method,
      });

      const payoutRequest = await payoutService.createPayoutRequest({
        userId,
        walletId,
        amount,
        currency: currency || 'USD',
        method,
        accountDetails,
      });

      res.status(201).json({
        success: true,
        data: {
          ...payoutRequest,
          accountDetails: undefined, // Don't return encrypted details
        },
      });
    } catch (error) {
      logger.error('Failed to create payout request', error as Error, {
        userId: req.user?.id,
      });

      if (error instanceof InsufficientBalanceError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error instanceof PayoutError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create payout request',
      });
    }
  }

  /**
   * GET /api/payouts/my-requests
   * Get user's payout request history
   */
  async getMyPayoutRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { status, method, fromDate, toDate, limit, offset } = req.query;

      logger.debug('Getting user payout requests', { userId });

      const requests = await payoutService.getUserPayoutRequests(userId, {
        status: status as any,
        method: method as any,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      // Remove encrypted account details from response
      const sanitizedRequests = requests.map((req) => ({
        ...req,
        accountDetails: undefined,
      }));

      res.status(200).json({
        success: true,
        data: sanitizedRequests,
      });
    } catch (error) {
      logger.error('Failed to get payout requests', error as Error, {
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payout requests',
      });
    }
  }

  /**
   * GET /api/payouts/:id
   * Get a specific payout request
   */
  async getPayoutRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      logger.debug('Getting payout request', { userId, requestId: id });

      const request = await payoutService.getPayoutRequestById(id, false);

      // Verify ownership
      if (request.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          ...request,
          accountDetails: undefined, // Don't return encrypted details
        },
      });
    } catch (error) {
      logger.error('Failed to get payout request', error as Error, {
        userId: req.user?.id,
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
        error: 'Failed to retrieve payout request',
      });
    }
  }
}

export const payoutController = new PayoutController();
