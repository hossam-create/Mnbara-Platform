// ============================================================
// PHASE 4.1 — Control Center Controller
// Read-only endpoints for admin finance dashboard
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { controlCenterService } from '../services/control-center.service';
import { WalletError } from '../errors/wallet.errors';
import { OwnerType, WalletStatus, EntryType, LedgerReason, ReferenceType } from '../types';

/**
 * Control Center Controller
 * 
 * READ-ONLY endpoints for /control-center/finance integration.
 * No mutation operations allowed.
 */
export const controlCenterController = {
  // ============================================================
  // LIST ALL WALLETS
  // GET /api/v2/control-center/wallets
  // ============================================================

  async listWallets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        ownerType: req.query.ownerType as OwnerType | undefined,
        status: req.query.status as WalletStatus | undefined,
        currency: req.query.currency as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };

      const result = await controlCenterService.listWallets(filters);

      res.json({
        success: true,
        data: result.wallets,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // WALLET BALANCE SNAPSHOT
  // GET /api/v2/control-center/wallets/:id/snapshot
  // ============================================================

  async getWalletSnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const snapshot = await controlCenterService.getWalletSnapshot(id);

      res.json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // LEDGER TRAIL
  // GET /api/v2/control-center/ledger
  // ============================================================

  async getLedgerTrail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        walletId: req.query.walletId as string | undefined,
        ownerType: req.query.ownerType as OwnerType | undefined,
        entryType: req.query.entryType as EntryType | undefined,
        reason: req.query.reason as LedgerReason | undefined,
        referenceType: req.query.referenceType as ReferenceType | undefined,
        referenceId: req.query.referenceId as string | undefined,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };

      const result = await controlCenterService.getLedgerTrail(filters);

      res.json({
        success: true,
        data: result.entries,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // SYSTEM TOTALS
  // GET /api/v2/control-center/totals
  // ============================================================

  async getSystemTotals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const totals = await controlCenterService.getSystemTotals();

      res.json({
        success: true,
        data: totals,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // DAILY TRANSACTION SUMMARY
  // GET /api/v2/control-center/daily-summary
  // ============================================================

  async getDailySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

      const summary = await controlCenterService.getDailyTransactionSummary(days);

      res.json({
        success: true,
        data: summary,
        period: {
          days,
          from: summary[0]?.date,
          to: summary[summary.length - 1]?.date,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // ESCROW READ ENDPOINTS
  // ============================================================
  
  async listEscrows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        status: req.query.status as any,
        referenceType: req.query.referenceType as any,
        search: req.query.search as string,
        minAmount: req.query.minAmount ? BigInt(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? BigInt(req.query.maxAmount as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };
      
      const result = await controlCenterService.listEscrows(filters);
      
      res.json({
        success: true,
        data: result.escrows,
        pagination: result.pagination,
      });
    } catch (error) { next(error); }
  },

  async getEscrowDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await controlCenterService.getEscrowDetails(req.params.id);
      if (!result) {
         res.status(404).json({ success: false, message: 'Not found' });
         return;
      }
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async getEscrowTotals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await controlCenterService.getEscrowTotals();
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },
  
  async getWalletEscrowExposure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await controlCenterService.getWalletEscrowExposure(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },
};

// ============================================================
// ERROR HANDLER
// ============================================================

export function controlCenterErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Control Center Error]', error);

  if (error instanceof WalletError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
