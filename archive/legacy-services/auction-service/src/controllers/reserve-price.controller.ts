// ============================================================
// PHASE 5.3 — Reserve Price Controller
// Control Center & Admin endpoints for reserve price management
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { reservePriceService, AuctionEndReason } from '../services/reserve-price.service';

type AuthenticatedRequest = Request & { userId?: string; userRole?: string };

export class ReservePriceController {
  // ============================================================
  // SET RESERVE PRICE
  // POST /api/v1/auctions/:auctionId/reserve-price
  // ONLY at auction creation (DRAFT state)
  // ============================================================
  setReservePrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;
      const { reservePrice } = req.body;

      // Validate required fields
      if (!reservePrice) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: reservePrice',
        });
      }

      // Validate reserve price is a positive number
      const reserve = typeof reservePrice === 'number' ? reservePrice : parseFloat(reservePrice);
      if (!Number.isFinite(reserve) || reserve <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Reserve price must be a positive number',
        });
      }

      await reservePriceService.setReservePrice({
        auctionId: parseInt(auctionId),
        reservePrice: reserve,
        encryptionKey: process.env.RESERVE_ENCRYPTION_KEY || 'default-key',
      });

      res.json({
        success: true,
        message: 'Reserve price set successfully (encrypted)',
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('FORBIDDEN') || error.message.includes('not found')) {
          return res.status(400).json({ success: false, error: error.message });
        }
      }
      next(error);
    }
  };

  // ============================================================
  // GET SETTLEMENT OUTCOME
  // GET /api/v1/auctions/:auctionId/settlement-outcome
  // Admin/Control Center only
  // ============================================================
  getSettlementOutcome = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;

      const outcome = await reservePriceService.getSettlementOutcomeLog(parseInt(auctionId));

      if (!outcome) {
        return res.status(404).json({
          success: false,
          error: 'Settlement outcome not found',
        });
      }

      res.json({
        success: true,
        data: {
          auctionId: outcome.auctionId,
          reserveMet: outcome.reserveMet,
          endedReason: outcome.endedReason,
          winnerId: outcome.winnerId,
          finalPrice: outcome.finalPrice,
          invalidatedBidsCount: outcome.invalidatedBidsCount,
          totalBidsCount: outcome.totalBidsCount,
          escrowsReleasedCount: outcome.escrowsReleasedCount,
          createdAt: outcome.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // GET ESCROW RELEASE LOGS
  // GET /api/v1/auctions/:auctionId/escrow-releases
  // Admin/Control Center only
  // ============================================================
  getEscrowReleaseLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;

      const logs = await reservePriceService.getEscrowReleaseLogs(parseInt(auctionId));

      res.json({
        success: true,
        data: logs.map((log) => ({
          bidId: log.bidId,
          bidderId: log.bidderId,
          escrowAmount: log.escrowAmount.toString(),
          releaseReason: log.releaseReason,
          releasedAt: log.releasedAt,
        })),
        count: logs.length,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // RESTART AUCTION
  // POST /api/v1/auctions/:auctionId/restart
  // Only for ENDED_UNMET_RESERVE auctions
  // ============================================================
  restartAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;
      const restartedBy = (req as AuthenticatedRequest).userId || 'ADMIN';

      const newAuctionId = await reservePriceService.restartAuction(parseInt(auctionId), restartedBy);

      res.status(201).json({
        success: true,
        data: {
          originalAuctionId: parseInt(auctionId),
          newAuctionId,
          message: 'Auction restarted with new ID. Reserve price copied.',
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('Cannot restart') || error.message.includes('not found')) {
          return res.status(400).json({ success: false, error: error.message });
        }
      }
      next(error);
    }
  };

  // ============================================================
  // VERIFY NO RESERVE LEAKS
  // GET /api/v1/auctions/:auctionId/verify-security
  // Security audit endpoint
  // ============================================================
  verifyNoReserveLeaks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;

      const isSecure = await reservePriceService.verifyNoReserveLeaks(parseInt(auctionId));

      res.json({
        success: true,
        data: {
          auctionId: parseInt(auctionId),
          isSecure,
          message: isSecure ? 'No reserve price leaks detected' : 'SECURITY WARNING: Reserve price may be exposed',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const reservePriceController = new ReservePriceController();
