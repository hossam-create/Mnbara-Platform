/**
 * PHASE 5.0 — AUCTION CONTROLLER
 * 
 * REST API for auction operations
 * NO payment integration
 */

import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service.v2';

const auctionService = new AuctionService();

// Extend Request type for authenticated requests
interface AuthRequest extends Request {
  userId?: string;
  userName?: string;
}

export class AuctionController {
  
  /**
   * POST /auctions
   * Create a new auction
   */
  async createAuction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId || 'anonymous';
      const userName = req.userName;

      const {
        title,
        description,
        startingBid,
        reservePrice,
        buyNowPrice,
        startsAt,
        endsAt,
        currency,
        category,
        images,
        tags,
        minBidIncrement,
        autoExtendConfig
      } = req.body;

      // Validation
      if (!title || !description || !startingBid || !startsAt || !endsAt) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const auction = await auctionService.createAuction({
        title,
        description,
        sellerId: userId,
        sellerName: userName,
        startingBid: parseInt(startingBid),
        reservePrice: reservePrice ? parseInt(reservePrice) : undefined,
        buyNowPrice: buyNowPrice ? parseInt(buyNowPrice) : undefined,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        currency,
        category,
        images,
        tags,
        minBidIncrement: minBidIncrement ? parseInt(minBidIncrement) : undefined,
        autoExtendConfig
      });

      res.status(201).json({
        success: true,
        data: auction
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /auctions/:id/publish
   * Publish auction (DRAFT → SCHEDULED)
   */
  async publishAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const auction = await auctionService.publishAuction(id);

      res.json({
        success: true,
        data: auction
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message.includes('Only DRAFT')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /auctions/:id
   * Get auction details
   */
  async getAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const auction = await auctionService.getAuction(id);

      if (!auction) {
        return res.status(404).json({
          success: false,
          error: 'Auction not found'
        });
      }

      res.json({
        success: true,
        data: auction
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /auctions
   * Get active auctions with filters
   */
  async getAuctions(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        category,
        status,
        endingSoon,
        limit,
        offset
      } = req.query;

      const auctions = await auctionService.getActiveAuctions({
        category: category as string,
        status: status ? (status as string).split(',') : undefined,
        endingSoon: endingSoon === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: auctions,
        count: auctions.length
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /auctions/:id/bids
   * Place a bid
   * 
   * PHASE 5.0: NO payment processing
   */
  async placeBid(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const userId = req.userId || 'anonymous';
      const userName = req.userName;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid bid amount'
        });
      }

      const result = await auctionService.placeBid({
        auctionId: id,
        bidderId: userId,
        bidderName: userName,
        amount: parseInt(amount)
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /auctions/:id/bids
   * Get bid history
   */
  async getBidHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      const history = await auctionService.getBidHistory(
        id,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /auctions/:id/cancel
   * Cancel auction
   */
  async cancelAuction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const auction = await auctionService.cancelAuction(id, reason);

      res.json({
        success: true,
        data: auction
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message.includes('cannot be cancelled') || error.message.includes('require admin')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /auctions/:id/extensions
   * Get extension history
   */
  async getExtensionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const extensions = await auctionService.getExtensionHistory(id);

      res.json({
        success: true,
        data: extensions
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /auctions/cron/start
   * Start scheduled auctions (cron job)
   */
  async startScheduledAuctions(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await auctionService.startScheduledAuctions();

      res.json({
        success: true,
        message: `Started ${count} auctions`
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /auctions/cron/end
   * End expired auctions (cron job)
   */
  async endExpiredAuctions(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await auctionService.endExpiredAuctions();

      res.json({
        success: true,
        message: `Ended ${count} auctions`
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new AuctionController();
