// ============================================================
// PHASE 4.1 — Wallet Controller (v2)
// REST API endpoints - READ-ONLY + CREATE
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { walletServiceV2 } from '../services/wallet.service.v2';
import { CreateWalletDto, ListLedgerQueryDto, WalletValidation } from '../dto/wallet.dto';
import { WalletError } from '../errors/wallet.errors';
import { OwnerType, EntryType, LedgerReason, ReferenceType } from '../types';

/**
 * Wallet Controller - Phase 4.1
 * 
 * Endpoints:
 * - POST /wallets - Create new wallet
 * - GET /wallets/:id - Get wallet by ID
 * - GET /wallets/:id/balance - Get wallet balance
 * - GET /wallets/:id/ledger - List ledger entries
 * - GET /wallets/owner/:ownerType/:ownerId - Get wallet by owner
 */
export const walletControllerV2 = {
  // ============================================================
  // CREATE WALLET
  // POST /wallets
  // ============================================================

  async createWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateWalletDto = {
        ownerType: req.body.ownerType,
        ownerId: req.body.ownerId,
        currency: req.body.currency,
      };

      const wallet = await walletServiceV2.createWallet(dto);

      res.status(201).json({
        success: true,
        data: wallet,
        message: 'Wallet created successfully',
        messageAr: 'تم إنشاء المحفظة بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // GET WALLET BY ID
  // GET /wallets/:id
  // ============================================================

  async getWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const wallet = await walletServiceV2.getWallet(id);

      res.json({
        success: true,
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // GET WALLET BY OWNER
  // GET /wallets/owner/:ownerType/:ownerId
  // ============================================================

  async getWalletByOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ownerType, ownerId } = req.params;
      const currency = (req.query.currency as string) || 'EGP';

      // Validate owner type
      if (!WalletValidation.isValidOwnerType(ownerType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OWNER_TYPE',
            message: `Invalid owner type: ${ownerType}`,
            messageAr: 'نوع المالك غير صالح',
          },
        });
        return;
      }

      const wallet = await walletServiceV2.getWalletByOwner(
        ownerType as OwnerType,
        ownerId,
        currency
      );

      if (!wallet) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Wallet not found for this owner',
            messageAr: 'المحفظة غير موجودة لهذا المالك',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // GET WALLET BALANCE
  // GET /wallets/:id/balance
  // ============================================================

  async getWalletBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const balance = await walletServiceV2.getWalletBalance(id);

      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // LIST LEDGER ENTRIES
  // GET /wallets/:id/ledger
  // ============================================================

  async listLedgerEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const query = req.query as ListLedgerQueryDto;

      // Parse and validate query params
      const options = {
        entryType: query.entryType && WalletValidation.isValidEntryType(query.entryType)
          ? query.entryType as EntryType
          : undefined,
        reason: query.reason && WalletValidation.isValidLedgerReason(query.reason)
          ? query.reason as LedgerReason
          : undefined,
        referenceType: query.referenceType && WalletValidation.isValidReferenceType(query.referenceType)
          ? query.referenceType as ReferenceType
          : undefined,
        referenceId: query.referenceId,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
        limit: query.limit ? parseInt(String(query.limit), 10) : 20,
        offset: query.offset ? parseInt(String(query.offset), 10) : 0,
      };

      const result = await walletServiceV2.listWalletLedgers(id, options);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // VERIFY BALANCE INTEGRITY
  // GET /wallets/:id/verify
  // ============================================================

  async verifyBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await walletServiceV2.verifyBalanceIntegrity(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

// ============================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================

export function walletErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Wallet Error]', error);

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
