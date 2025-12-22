import { Request, Response, NextFunction } from 'express';
import { BalanceVerificationService } from '../services/balance-verification.service';
import { Decimal } from '@prisma/client/runtime/library';

export class BalanceController {
  /**
   * Check if user has sufficient balance
   */
  async checkBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId || parseInt(req.params.userId);
      const { amount, currency } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a positive number'
        });
      }

      const result = await BalanceVerificationService.checkBalance(
        userId,
        new Decimal(amount),
        currency || 'USD'
      );

      res.json({
        success: true,
        data: {
          hasBalance: result.hasBalance,
          currentBalance: result.currentBalance.toString(),
          requiredAmount: result.requiredAmount.toString(),
          shortfall: result.shortfall.toString(),
          currency: result.currency,
          isLocked: result.isLocked,
          message: result.message
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get detailed balance information
   */
  async getDetailedBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId || parseInt(req.params.userId);

      const result = await BalanceVerificationService.getDetailedBalance(userId);

      res.json({
        success: true,
        data: {
          totalBalance: result.totalBalance.toString(),
          availableBalance: result.availableBalance.toString(),
          reservedBalance: result.reservedBalance.toString(),
          pendingDeposits: result.pendingDeposits.toString(),
          pendingWithdrawals: result.pendingWithdrawals.toString(),
          currency: result.currency,
          isLocked: result.isLocked
        }
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Reserve balance for a pending payment
   */
  async reserveBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId || parseInt(req.params.userId);
      const { amount, orderId } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a positive number'
        });
      }

      const result = await BalanceVerificationService.reserveBalance(
        userId,
        new Decimal(amount),
        orderId
      );

      res.status(201).json({
        success: true,
        data: {
          reservationId: result.reservationId,
          amount: result.amount.toString(),
          expiresAt: result.expiresAt.toISOString(),
          walletId: result.walletId
        }
      });
    } catch (error: any) {
      if (error.code === 'INSUFFICIENT_FUNDS') {
        return res.status(400).json({
          success: false,
          error: 'Insufficient funds',
          details: {
            currentBalance: error.currentBalance.toString(),
            requiredAmount: error.requiredAmount.toString(),
            shortfall: error.shortfall.toString(),
            currency: error.currency
          }
        });
      }
      next(error);
    }
  }

  /**
   * Release a balance reservation
   */
  async releaseReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const { reservationId } = req.params;

      const released = BalanceVerificationService.releaseReservation(reservationId);

      if (!released) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found or already released'
        });
      }

      res.json({
        success: true,
        message: 'Reservation released successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Confirm a reservation and deduct from wallet
   */
  async confirmReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const { reservationId } = req.params;
      const performedBy = (req as any).userId || 1;

      const result = await BalanceVerificationService.confirmReservation(
        reservationId,
        performedBy
      );

      res.json({
        success: true,
        data: {
          ledgerEntryId: result.ledgerEntryId
        }
      });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('expired')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      if (error.code === 'INSUFFICIENT_FUNDS') {
        return res.status(400).json({
          success: false,
          error: 'Insufficient funds',
          details: {
            currentBalance: error.currentBalance.toString(),
            requiredAmount: error.requiredAmount.toString(),
            shortfall: error.shortfall.toString(),
            currency: error.currency
          }
        });
      }
      next(error);
    }
  }

  /**
   * Pre-authorize a payment amount
   */
  async preAuthorize(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId || parseInt(req.params.userId);
      const { amount, orderId, expiryMinutes } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a positive number'
        });
      }

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
      }

      const result = await BalanceVerificationService.preAuthorize(
        userId,
        new Decimal(amount),
        orderId,
        expiryMinutes
      );

      res.status(201).json({
        success: true,
        data: {
          authorizationId: result.authorizationId,
          amount: result.amount.toString(),
          expiresAt: result.expiresAt.toISOString()
        }
      });
    } catch (error: any) {
      if (error.code === 'INSUFFICIENT_FUNDS') {
        return res.status(400).json({
          success: false,
          error: 'Insufficient funds',
          details: {
            currentBalance: error.currentBalance.toString(),
            requiredAmount: error.requiredAmount.toString(),
            shortfall: error.shortfall.toString(),
            currency: error.currency
          }
        });
      }
      if (error.message.includes('locked')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Capture a pre-authorized amount
   */
  async captureAuthorization(req: Request, res: Response, next: NextFunction) {
    try {
      const { authorizationId } = req.params;
      const { amount } = req.body;

      const result = await BalanceVerificationService.captureAuthorization(
        parseInt(authorizationId),
        amount ? new Decimal(amount) : undefined
      );

      res.json({
        success: true,
        data: {
          capturedAmount: result.capturedAmount.toString()
        }
      });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      if (error.message.includes('expired') || error.message.includes('exceeds')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Void a pre-authorization
   */
  async voidAuthorization(req: Request, res: Response, next: NextFunction) {
    try {
      const { authorizationId } = req.params;
      const { reason } = req.body;

      const result = await BalanceVerificationService.voidAuthorization(
        parseInt(authorizationId),
        reason
      );

      res.json({
        success: true,
        data: {
          refundedAmount: result.refundedAmount.toString()
        }
      });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }
}
