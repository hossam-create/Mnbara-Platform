// ============================================================
// PHASE 4.2 — Escrow Controller
// API endpoints for Escrow management
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { escrowService } from '../services/escrow.service';
import { ValidationError } from '../errors/wallet.errors';

export const escrowController = {
  // ============================================================
  // CREATE ESCROW
  // POST /api/v2/escrow
  // ============================================================
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        buyerWalletId, sellerWalletId, amount, currency, 
        referenceType, referenceId, description 
      } = req.body;

      if (!buyerWalletId || !sellerWalletId || !amount || !referenceType || !referenceId) {
        throw new ValidationError('Missing required fields');
      }

      // User ID from auth middleware (placeholder)
      const createdBy = req.headers['x-user-id'] as string || 'system';

      const escrow = await escrowService.createEscrow({
        buyerWalletId,
        sellerWalletId,
        amount: BigInt(amount),
        currency: currency || 'EGP',
        referenceType,
        referenceId,
        description,
        createdBy,
      });

      res.status(201).json({
        success: true,
        data: {
          ...escrow,
          amount: escrow.amount.toString(), // BigInt to string
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // CREATE AND FUND ESCROW (ATOMIC)
  // POST /api/v2/escrow/create-held
  // ============================================================
  async createAndFund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        buyerWalletId, sellerWalletId, systemWalletId, amount, currency, 
        referenceType, referenceId, description 
      } = req.body;

      if (!buyerWalletId || !sellerWalletId || !systemWalletId || !amount || !referenceType || !referenceId) {
        throw new ValidationError('Missing required fields (including systemWalletId)');
      }

      const triggeredBy = req.headers['x-user-id'] as string || 'system';
      const requestId = req.headers['x-request-id'] as string;

      const escrow = await escrowService.createAndFundEscrow({
        buyerWalletId,
        sellerWalletId,
        systemWalletId,
        amount: BigInt(amount),
        currency: currency || 'EGP',
        referenceType,
        referenceId,
        description,
        createdBy: triggeredBy,
        triggeredBy,
        requestId,
      });

      res.status(201).json({
        success: true,
        data: {
          ...escrow,
          amount: escrow.amount.toString(),
        },
        message: 'Escrow created and funded successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // FUND ESCROW
  // POST /api/v2/escrow/:id/fund
  // ============================================================
  async fund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { buyerWalletId, systemWalletId } = req.body;
      const triggeredBy = req.headers['x-user-id'] as string || 'unknown';
      const requestId = req.headers['x-request-id'] as string;

      if (!buyerWalletId || !systemWalletId) {
        throw new ValidationError('Missing buyerWalletId or systemWalletId');
      }

      const escrow = await escrowService.fundEscrow({
        escrowId: id,
        buyerWalletId,
        systemWalletId,
        triggeredBy,
        requestId,
      });

      res.json({
        success: true,
        data: {
          ...escrow,
          amount: escrow.amount.toString(),
        },
        message: 'Escrow funded successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // RELEASE ESCROW
  // POST /api/v2/escrow/:id/release
  // ============================================================
  async release(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { systemWalletId } = req.body;
      const triggeredBy = req.headers['x-user-id'] as string || 'admin';
      const requestId = req.headers['x-request-id'] as string;

      if (!systemWalletId) {
        throw new ValidationError('Missing systemWalletId');
      }

      const escrow = await escrowService.releaseEscrow({
        escrowId: id,
        systemWalletId,
        triggeredBy,
        requestId,
      });

      res.json({
        success: true,
        data: {
          ...escrow,
          amount: escrow.amount.toString(),
        },
        message: 'Funds released to seller',
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // REFUND ESCROW
  // POST /api/v2/escrow/:id/refund
  // ============================================================
  async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { systemWalletId, reason } = req.body;
      const triggeredBy = req.headers['x-user-id'] as string || 'admin';
      const requestId = req.headers['x-request-id'] as string;

      if (!systemWalletId || !reason) {
        throw new ValidationError('Missing systemWalletId or reason');
      }

      const escrow = await escrowService.refundEscrow({
        escrowId: id,
        systemWalletId,
        reason,
        triggeredBy,
        requestId,
      });

      res.json({
        success: true,
        data: {
          ...escrow,
          amount: escrow.amount.toString(),
        },
        message: 'Funds refunded to buyer',
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // DISPUTE ESCROW
  // POST /api/v2/escrow/:id/dispute
  // ============================================================
  async dispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const triggeredBy = req.headers['x-user-id'] as string || 'user';

      if (!reason) {
        throw new ValidationError('Dispute reason required');
      }

      const escrow = await escrowService.disputeEscrow({
        escrowId: id,
        reason,
        triggeredBy,
      });

      res.json({
        success: true,
        data: {
          ...escrow,
          amount: escrow.amount.toString(),
        },
        message: 'Escrow dispute opened',
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================================
  // GET ESCROW
  // GET /api/v2/escrow/:id
  // ============================================================
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const escrow = await escrowService.getEscrow(id);

      if (!escrow) {
        res.status(404).json({ success: false, message: 'Escrow not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          ...escrow,
          amount: escrow.amount.toString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
