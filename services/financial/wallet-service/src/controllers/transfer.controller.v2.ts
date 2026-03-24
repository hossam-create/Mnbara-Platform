// ============================================================
// PHASE 4.1 — Transfer Controller
// REST endpoint for wallet-to-wallet transfers
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { transferService } from '../services/transfer.service.v2';
import { TransferFundsDto, TransferValidation } from '../dto/transfer.dto';
import { WalletError } from '../errors/wallet.errors';
import { toMinorUnits, formatMoney } from '../utils/money';

/**
 * Transfer Controller
 * 
 * Single endpoint for atomic wallet-to-wallet transfers.
 * No external payment integration - internal ledger only.
 */
export const transferController = {
  // ============================================================
  // TRANSFER FUNDS
  // POST /api/v2/transfer
  // ============================================================

  async transferFunds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: TransferFundsDto = {
        fromWalletId: req.body.fromWalletId,
        toWalletId: req.body.toWalletId,
        amount: req.body.amount,
        reason: req.body.reason,
        referenceType: req.body.referenceType,
        referenceId: req.body.referenceId,
        description: req.body.description,
        requestId: req.body.requestId || req.headers['x-request-id'] as string,
      };

      // Validate request
      const validationErrors = TransferValidation.validateTransferRequest(dto);
      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationErrors.join('; '),
            messageAr: 'خطأ في التحقق من البيانات',
            details: validationErrors,
          },
        });
        return;
      }

      // Get user from auth (placeholder)
      const createdBy = (req as any).user?.id || 'system';

      // Convert to minor units
      const amountMinor = toMinorUnits(dto.amount);

      // Execute transfer
      const result = await transferService.transferFunds({
        fromWalletId: dto.fromWalletId,
        toWalletId: dto.toWalletId,
        amount: amountMinor,
        reason: dto.reason,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        description: dto.description,
        requestId: dto.requestId,
        createdBy,
      });

      // Format response
      const currency = result.currency;

      res.status(result.isIdempotent ? 200 : 201).json({
        success: true,
        data: {
          transferId: result.transferId,
          fromEntry: {
            entryId: result.fromEntry.entryId,
            walletId: result.fromEntry.walletId,
            balanceBefore: result.fromEntry.balanceBefore,
            balanceBeforeFormatted: formatMoney(BigInt(result.fromEntry.balanceBefore), currency),
            balanceAfter: result.fromEntry.balanceAfter,
            balanceAfterFormatted: formatMoney(BigInt(result.fromEntry.balanceAfter), currency),
          },
          toEntry: {
            entryId: result.toEntry.entryId,
            walletId: result.toEntry.walletId,
            balanceBefore: result.toEntry.balanceBefore,
            balanceBeforeFormatted: formatMoney(BigInt(result.toEntry.balanceBefore), currency),
            balanceAfter: result.toEntry.balanceAfter,
            balanceAfterFormatted: formatMoney(BigInt(result.toEntry.balanceAfter), currency),
          },
          amount: result.amount,
          amountFormatted: formatMoney(BigInt(result.amount), currency),
          currency,
          reason: result.reason,
          referenceType: result.referenceType,
          referenceId: result.referenceId,
          idempotencyKey: result.idempotencyKey,
          createdAt: result.createdAt,
          isIdempotent: result.isIdempotent,
        },
        message: result.isIdempotent
          ? 'Duplicate request - returning existing transfer'
          : 'Transfer completed successfully',
        messageAr: result.isIdempotent
          ? 'طلب مكرر - إرجاع التحويل الموجود'
          : 'تم التحويل بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },
};

// ============================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================

export function transferErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Transfer Error]', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  if (error instanceof WalletError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        messageAr: error.messageAr,
      },
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during transfer',
      messageAr: 'حدث خطأ غير متوقع أثناء التحويل',
    },
  });
}
