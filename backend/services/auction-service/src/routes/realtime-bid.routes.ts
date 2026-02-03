/**
 * Real-Time Bid Routes
 * Express routes for real-time bidding
 */

import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { RealtimeBidService } from '../services/realtime-bid.service';

let io: SocketIOServer;
const realtimeBidService = new RealtimeBidService();

export function setSocketIO(socketServer: SocketIOServer) {
  io = socketServer;
}

const router = Router();

/**
 * Place a bid on an auction
 * POST /auctions/:auctionId/realtime-bids
 */
router.post('/:auctionId/realtime-bids', async (req: Request, res: Response) => {
  try {
    const auctionId = parseInt(req.params.auctionId);
    const { amount, idempotencyKey } = req.body;
    
    // TODO: Get user ID from authenticated request
    const bidderId = (req as any).user?.id || 1; // Placeholder

    const result = await realtimeBidService.placeBid({
      listingId: auctionId,
      bidderId,
      amount,
      idempotencyKey,
    });

    // Send WebSocket notifications
    if (result.status === 'NEW' && io) {
      // Broadcast bid placed to all watchers
      io.to(`auction-${auctionId}`).emit('bidPlaced', {
        auctionId,
        newPrice: parseFloat(result.bid.amount.toString()),
        bidderName: `${result.bid.bidder.firstName} ${result.bid.bidder.lastName}`,
        bidCount: result.auction._count.bids,
        endTime: result.auction.auctionEndsAt,
        timestamp: new Date(),
      });

      // If auction was extended, broadcast extension
      if (result.extended) {
        io.to(`auction-${auctionId}`).emit('auctionExtended', {
          auctionId,
          newEndTime: result.auction.auctionEndsAt,
          extensionCount: result.auction.extensionCount,
          reason: 'Anti-sniping: Bid placed within threshold',
          timestamp: new Date(),
        });
      }

      // Notify previous bidder they were outbid
      if (result.previousBidderId) {
        io.to(`user-${result.previousBidderId}`).emit('outbid', {
          auctionId,
          auctionTitle: result.auction.title,
          newPrice: parseFloat(result.bid.amount.toString()),
          yourBid: parseFloat(result.auction.currentBid.toString()),
          timestamp: new Date(),
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        bid: {
          id: result.bid.id,
          amount: result.bid.amount,
          createdAt: result.bid.createdAt,
          isWinning: result.bid.isWinning,
        },
        auction: {
          id: result.auction.id,
          currentBid: result.auction.currentBid,
          auctionEndsAt: result.auction.auctionEndsAt,
          extensionCount: result.auction.extensionCount,
          bidCount: result.auction._count.bids,
        },
        extended: result.extended,
        status: result.status,
      },
    });
  } catch (error: any) {
    console.error('Error placing bid:', error);
    res.status(error.name === 'BadRequestError' ? 400 : 500).json({
      success: false,
      error: error.message || 'Failed to place bid',
    });
  }
});

/**
 * Get bid history for an auction
 * GET /auctions/:auctionId/realtime-bids
 */
router.get('/:auctionId/realtime-bids', async (req: Request, res: Response) => {
  try {
    const auctionId = parseInt(req.params.auctionId);
    const bids = await realtimeBidService.getBidHistory(auctionId);

    res.json({
      success: true,
      data: bids.map((bid) => ({
        id: bid.id,
        amount: bid.amount,
        bidder: {
          id: bid.bidder.id,
          name: `${bid.bidder.firstName} ${bid.bidder.lastName}`,
        },
        createdAt: bid.createdAt,
        isWinning: bid.isWinning,
        triggeredExtension: bid.triggeredExtension,
      })),
    });
  } catch (error: any) {
    console.error('Error getting bid history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get bid history',
    });
  }
});

/**
 * Get current winning bid
 * GET /auctions/:auctionId/realtime-bids/winning
 */
router.get('/:auctionId/realtime-bids/winning', async (req: Request, res: Response) => {
  try {
    const auctionId = parseInt(req.params.auctionId);
    const bid = await realtimeBidService.getWinningBid(auctionId);

    if (!bid) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: {
        id: bid.id,
        amount: bid.amount,
        bidder: {
          id: bid.bidder.id,
          name: `${bid.bidder.firstName} ${bid.bidder.lastName}`,
        },
        createdAt: bid.createdAt,
        isWinning: bid.isWinning,
      },
    });
  } catch (error: any) {
    console.error('Error getting winning bid:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get winning bid',
    });
  }
});

export default router;
