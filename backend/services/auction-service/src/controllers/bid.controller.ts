import { Request, Response, NextFunction } from 'express';
import type { Server } from 'socket.io';
import { AuctionService } from '../services/auction.service';

// Socket.io instance will be injected
let socketIO: Server | null = null;

type AuthenticatedRequest = Request & { userId?: number };

export const setSocketIO = (io: Server) => {
  socketIO = io;
};

export class BidController {
  private auctionService: AuctionService;

  constructor() {
    this.auctionService = new AuctionService();
  }

  /**
   * Place a bid on an auction
   */
  placeBid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;
      const { amount } = req.body;

      // TODO: Get userId from JWT middleware
      const bidderId = (req as AuthenticatedRequest).userId ?? 2;

      const listingId = parseInt(auctionId);
      if (!Number.isFinite(listingId)) {
        return res.status(400).json({ success: false, message: 'Invalid auctionId' });
      }

      const bidAmount = typeof amount === 'number' ? amount : parseFloat(amount);
      if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid bid amount' });
      }

      const result = await this.auctionService.placeBid(
        listingId,
        bidderId,
        bidAmount
      );

      // Emit socket events for real-time updates
      if (socketIO) {
        const roomId = `auction:${auctionId}`;

        // Broadcast new bid to all users in the auction room
        socketIO.to(roomId).emit('bid:placed', {
          auctionId: parseInt(auctionId),
          bid: {
            id: result.bid.id,
            amount: result.bid.amount,
            bidderId: result.bid.bidderId,
            bidder: result.bid.bidder,
            createdAt: result.bid.createdAt,
          },
          currentBid: result.auction.currentBid,
          timestamp: new Date(),
        });

        // Notify outbid users
        for (const userId of result.outbidUsers) {
          socketIO.to(`user:${userId}`).emit('bid:outbid', {
            auctionId: parseInt(auctionId),
            newHighestBid: result.auction.currentBid,
            yourBidAmount: result.bid.amount,
          });
        }

        // If auction was extended, broadcast extension event
        if (result.wasExtended && result.extensionInfo) {
          socketIO.to(roomId).emit('auction:extended', {
            auctionId: parseInt(auctionId),
            previousEndTime: result.extensionInfo.previousEndTime,
            newEndTime: result.extensionInfo.newEndTime,
            extensionNumber: result.extensionInfo.extensionNumber,
            triggeredByBidId: result.bid.id,
          });
        }
      }

      // Process proxy bids (automatic outbidding)
      const proxyResult = await this.auctionService.processProxyBids(
        listingId,
        Number(result.auction.currentBid),
        bidderId
      );

      if (proxyResult && socketIO) {
        // Emit proxy bid event
        socketIO.to(`auction:${auctionId}`).emit('bid:proxy', {
          auctionId: parseInt(auctionId),
          bid: proxyResult.bid,
          currentBid: proxyResult.auction.currentBid,
          isProxyBid: true,
        });
      }

      res.status(201).json({
        success: true,
        data: {
          bid: result.bid,
          currentBid: result.auction.currentBid,
          auctionEndsAt: result.auction.auctionEndsAt,
          wasExtended: result.wasExtended,
          extensionInfo: result.extensionInfo,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error.message.includes('Bid must be') ||
          error.message.includes('not found') ||
          error.message.includes('not active') ||
          error.message.includes('has ended') ||
          error.message.includes('cannot bid')
        ) {
          return res.status(400).json({ success: false, message: error.message });
        }
      }
      next(error);
    }
  };

  /**
   * Get bids for an auction
   */
  getBids = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;
      const { limit } = req.query;

      const bids = await this.auctionService.getBids(
        parseInt(auctionId),
        limit ? parseInt(limit as string) : undefined
      );

      res.json({
        success: true,
        data: bids,
        count: bids.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Setup proxy bid (automatic bidding)
   */
  setupProxyBid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;
      const { maxAmount } = req.body;

      // TODO: Get userId from JWT middleware
      const bidderId = (req as AuthenticatedRequest).userId ?? 2;

      const listingId = parseInt(auctionId);
      if (!Number.isFinite(listingId)) {
        return res.status(400).json({ success: false, message: 'Invalid auctionId' });
      }

      const max = typeof maxAmount === 'number' ? maxAmount : parseFloat(maxAmount);
      if (!Number.isFinite(max) || max <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid maxAmount' });
      }

      const proxyBid = await this.auctionService.setupProxyBid(
        listingId,
        bidderId,
        max
      );

      res.status(201).json({
        success: true,
        data: proxyBid,
        message: 'Proxy bid configured successfully',
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('not active') ||
          error.message.includes('must be higher')
        ) {
          return res.status(400).json({ success: false, message: error.message });
        }
      }
      next(error);
    }
  };
}
