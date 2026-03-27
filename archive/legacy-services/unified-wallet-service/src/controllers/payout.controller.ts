import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PayoutService } from '../services/payout.service';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/audit';

const payoutService = new PayoutService();

export class PayoutController {
  /**
   * Create a payout request
   */
  async createPayoutRequest(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        walletId,
        amount,
        currency,
        method,
        accountDetails,
        description,
        referenceId,
        metadata,
      } = req.body;

      // Validate required fields
      if (!walletId || !amount || !currency || !method || !accountDetails) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Missing required fields: walletId, amount, currency, method, accountDetails',
        });
      }

      // Validate user authentication
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User authentication required',
        });
      }

      // Validate account details
      if (!accountDetails.accountHolder || !accountDetails.accountNumber) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Account details must include accountHolder and accountNumber',
        });
      }

      const payout = await payoutService.createPayoutRequest({
        userId,
        walletId,
        amount,
        currency,
        method,
        accountDetails,
        description,
        referenceId,
        metadata,
      });

      // Create audit log
      await createAuditLog({
        userId: userId!,
        action: 'PAYOUT_REQUEST_CREATED',
        resourceType: 'PAYOUT_REQUEST',
        resourceId: payout.id,
        metadata: {
          amount,
          currency,
          method,
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          id: payout.id,
          walletId: payout.walletId,
          amount: payout.amount,
          currency: payout.currency,
          method: payout.method,
          status: payout.status,
          createdAt: payout.createdAt,
        },
      });
    } catch (error) {
      logger.error('Error creating payout request:', error);
      return res.status(400).json({
        error: 'Payout request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's payout requests
   */
  async getMyPayoutRequests(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { status, method, currency, startDate, endDate, minAmount, maxAmount } = req.query;

      const filters: any = {
        userId,
        status: status as string,
        method: method as string,
        currency: currency as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const payouts = await payoutService.getPayoutRequests(filters);

      return res.json({
        success: true,
        data: payouts.map(payout => ({
          id: payout.id,
          walletId: payout.walletId,
          amount: payout.amount,
          currency: payout.currency,
          method: payout.method,
          status: payout.status,
          referenceId: payout.referenceId,
          createdAt: payout.createdAt,
          processedAt: payout.processedAt,
          failureReason: payout.failureReason,
        })),
      });
    } catch (error) {
      logger.error('Error getting payout requests:', error);
      return res.status(500).json({
        error: 'Failed to get payout requests',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get a specific payout request
   */
  async getPayoutRequest(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Payout request ID is required',
        });
      }



      const payout = await payoutService.getPayoutRequest(id, userId);

      return res.json({
        success: true,
        data: {
          id: payout.id,
          walletId: payout.walletId,
          amount: payout.amount,
          currency: payout.currency,
          method: payout.method,
          status: payout.status,
          referenceId: payout.referenceId,
          metadata: payout.metadata,
          createdAt: payout.createdAt,
          processedAt: payout.processedAt,
          processedBy: payout.processedBy,
          failureReason: payout.failureReason,
        },
      });
    } catch (error) {
      logger.error('Error getting payout request:', error);
      return res.status(404).json({
        error: 'Payout request not found',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Process a payout request (admin only)
   */
  async processPayout(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const processedBy = req.user?.id;

      if (!id) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Payout request ID is required',
        });
      }

      if (!processedBy) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User authentication required',
        });
      }

      const payout = await payoutService.processPayout(id, processedBy);

      // Create audit log
      await createAuditLog({
        userId: processedBy!,
        action: 'PAYOUT_PROCESSED',
        resourceType: 'PAYOUT_REQUEST',
        resourceId: id,
        metadata: {
          amount: payout.amount.toString(),
          currency: payout.currency,
          method: payout.method,
        },
      });

      return res.json({
        success: true,
        data: {
          id: payout.id,
          status: payout.status,
          processedAt: payout.processedAt,
          processedBy: payout.processedBy,
        },
      });
    } catch (error) {
      logger.error('Error processing payout:', error);
      return res.status(400).json({
        error: 'Payout processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}