// ============================================================
// PHASE 4.1 — Ledger Controller
// REST endpoints for credit/debit operations
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ledgerService } from '../services/ledger.service';
import { CreditWalletDto, DebitWalletDto, LedgerValidation } from '../dto/ledger.dto';
import { LedgerReason, ReferenceType } from '../types';
import { WalletError, ValidationError } from '../errors/wallet.errors';
import { toMinorUnits, formatMoney } from '../utils/money';

/**
 * Ledger Controller
 * 
 * SECURITY:
 * - Only POST endpoints (append-only)
 * - No UPDATE or DELETE operations
 * - All writes create immutable ledger entries
 * - Audit fields (created_by) required
 */
export const ledgerController = {
  // ============================================================
  // CREDIT WALLET
  // POST /api/v2/ledger/credit
  // ============================================================

  async creditWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreditWalletDto = {
        walletId: req.body.walletId,
        amount: req.body.amount,
        reason: req.body.reason,
        referenceType: req.body.referenceType,
        referenceId: req.body.referenceId,
        description: req.body.description,
        requestId: req.body.requestId || req.headers['x-request-id'] as string,
      };

      // Validate request
      const validationErrors = LedgerValidation.validateCreditRequest(dto);
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

      // Execute credit
      const result = await ledgerService.creditWallet({
        walletId: dto.walletId,
        amount: amountMinor,
        reason: dto.reason,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        description: dto.description,
        requestId: dto.requestId,
        createdBy,
      });

      // Format response
      const currency = 'EGP'; // TODO: Get from wallet
      
      res.status(result.isIdempotent ? 200 : 201).json({
        success: true,
        data: {
          entryId: result.entryId,
          walletId: result.walletId,
          entryType: result.entryType,
          amount: result.amount,
          amountFormatted: formatMoney(BigInt(result.amount), currency),
          reason: result.reason,
          balanceBefore: result.balanceBefore,
          balanceBeforeFormatted: formatMoney(BigInt(result.balanceBefore), currency),
          balanceAfter: result.balanceAfter,
          balanceAfterFormatted: formatMoney(BigInt(result.balanceAfter), currency),
          idempotencyKey: result.idempotencyKey,
          createdAt: result.createdAt,
          isIdempotent: result.isIdempotent,
        },
        message: result.isIdempotent 
          ? 'Duplicate request - returning existing entry'
          : 'Credit applied successfully',
        messageAr: result.isIdempotent
          ? 'طلب مكرر - إرجاع القيد الموجود'
          : 'تم إضافة الرصيد بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // DEBIT WALLET
  // POST /api/v2/ledger/debit
  // ============================================================

  async debitWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: DebitWalletDto = {
        walletId: req.body.walletId,
        amount: req.body.amount,
        reason: req.body.reason,
        referenceType: req.body.referenceType,
        referenceId: req.body.referenceId,
        description: req.body.description,
        requestId: req.body.requestId || req.headers['x-request-id'] as string,
      };

      // Validate request
      const validationErrors = LedgerValidation.validateDebitRequest(dto);
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

      // Execute debit
      const result = await ledgerService.debitWallet({
        walletId: dto.walletId,
        amount: amountMinor,
        reason: dto.reason,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        description: dto.description,
        requestId: dto.requestId,
        createdBy,
      });

      // Format response
      const currency = 'EGP'; // TODO: Get from wallet

      res.status(result.isIdempotent ? 200 : 201).json({
        success: true,
        data: {
          entryId: result.entryId,
          walletId: result.walletId,
          entryType: result.entryType,
          amount: result.amount,
          amountFormatted: formatMoney(BigInt(result.amount), currency),
          reason: result.reason,
          balanceBefore: result.balanceBefore,
          balanceBeforeFormatted: formatMoney(BigInt(result.balanceBefore), currency),
          balanceAfter: result.balanceAfter,
          balanceAfterFormatted: formatMoney(BigInt(result.balanceAfter), currency),
          idempotencyKey: result.idempotencyKey,
          createdAt: result.createdAt,
          isIdempotent: result.isIdempotent,
        },
        message: result.isIdempotent
          ? 'Duplicate request - returning existing entry'
          : 'Debit applied successfully',
        messageAr: result.isIdempotent
          ? 'طلب مكرر - إرجاع القيد الموجود'
          : 'تم خصم الرصيد بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },
};

// ============================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================

export function ledgerErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Ledger Error]', {
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
      message: 'An unexpected error occurred',
      messageAr: 'حدث خطأ غير متوقع',
    },
  });
}
