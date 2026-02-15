// Auction Routes

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { LiveAuctionManager } from '../auction/LiveAuctionManager';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();
const auctionManager = new LiveAuctionManager(prisma, logger);

/**
 * @route   POST /api/auctions
 * @desc    Create a new auction
 * @access  Private (stream owner)
 */
router.post('/', authMiddleware, validateRequest({
  body: {
    streamId: { type: 'string', required: true },
    title: { type: 'string', required: true, min: 1, max: 200 },
    description: { type: 'string', max: 1000 },
    startingPrice: { type: 'number', required: true, min: 0 },
    reservePrice: { type: 'number', min: 0 },
    minBidIncrement: { type: 'number', required: true, min: 0.01 },
    duration: { type: 'number', required: true, min: 1 }, // minutes
    productId: { type: 'string' }
  }
}), async (req, res) => {
  try {
    const {
      streamId,
      title,
      description,
      startingPrice,
      reservePrice,
      minBidIncrement,
      duration,
      productId
    } = req.body;
    const sellerId = req.user.id;

    // Verify stream ownership
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      select: { sellerId: true }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }

    if (stream.sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to create auctions for this stream'
      });
    }

    const auction = await auctionManager.createAuction({
      streamId,
      title,
      description,
      startingPrice,
      reservePrice,
      minBidIncrement,
      duration,
      sellerId,
      productId
    });

    res.status(201).json({
      success: true,
      data: auction
    });
  } catch (error) {
    logger.error('Failed to create auction', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create auction'
    });
  }
});

/**
 * @route   GET /api/auctions
 * @desc    Get all auctions with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      sellerId,
      streamId,
      limit = 20,
      offset = 0
    } = req.query;

    const auctions = await auctionManager.listAuctions({
      status: status as any,
      sellerId: sellerId as string,
      streamId: streamId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: auctions,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: auctions.length // This should be total count from manager
      }
    });
  } catch (error) {
    logger.error('Failed to get auctions', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auctions'
    });
  }
});

/**
 * @route   GET /api/auctions/:id
 * @desc    Get auction by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const auction = await auctionManager.getAuction(id);

    res.json({
      success: true,
      data: auction
    });
  } catch (error) {
    logger.error('Failed to get auction', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get auction'
    });
  }
});

/**
 * @route   PUT /api/auctions/:id/start
 * @desc    Start an auction
 * @access  Private (stream owner)
 */
router.put('/:id/start', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify auction ownership
    const auction = await prisma.liveAuction.findUnique({
      where: { id },
      select: { sellerId: true, status: true }
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }

    if (auction.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to start this auction'
      });
    }

    if (auction.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        error: 'Auction is not in scheduled status'
      });
    }

    const startedAuction = await auctionManager.startAuction(id);

    res.json({
      success: true,
      data: startedAuction
    });
  } catch (error) {
    logger.error('Failed to start auction', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start auction'
    });
  }
});

/**
 * @route   PUT /api/auctions/:id/end
 * @desc    End an auction
 * @access  Private (stream owner)
 */
router.put('/:id/end', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify auction ownership
    const auction = await prisma.liveAuction.findUnique({
      where: { id },
      select: { sellerId: true, status: true }
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }

    if (auction.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to end this auction'
      });
    }

    if (auction.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Auction is not active'
      });
    }

    const endedAuction = await auctionManager.endAuction(id);

    res.json({
      success: true,
      data: endedAuction
    });
  } catch (error) {
    logger.error('Failed to end auction', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end auction'
    });
  }
});

/**
 * @route   DELETE /api/auctions/:id
 * @desc    Cancel an auction
 * @access  Private (stream owner)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify auction ownership
    const auction = await prisma.liveAuction.findUnique({
      where: { id },
      select: { sellerId: true, status: true }
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }

    if (auction.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to cancel this auction'
      });
    }

    if (auction.status === 'ENDED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel ended auction'
      });
    }

    const cancelledAuction = await auctionManager.cancelAuction(id);

    res.json({
      success: true,
      data: cancelledAuction
    });
  } catch (error) {
    logger.error('Failed to cancel auction', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel auction'
    });
  }
});

/**
 * @route   POST /api/auctions/:id/bid
 * @desc    Place a bid on an auction
 * @access  Private
 */
router.post('/:id/bid', authMiddleware, validateRequest({
  body: {
    amount: { type: 'number', required: true, min: 0.01 }
  }
}), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    const bid = await auctionManager.placeBid({
      auctionId: id,
      amount,
      userId,
      userName
    });

    res.status(201).json({
      success: true,
      data: bid
    });
  } catch (error) {
    logger.error('Failed to place bid', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place bid'
    });
  }
});

/**
 * @route   GET /api/auctions/:id/bids
 * @desc    Get all bids for an auction
 * @access  Public
 */
router.get('/:id/bids', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const bids = await prisma.liveBid.findMany({
      where: { auctionId: id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit as string), 100),
      skip: parseInt(offset as string),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: bids,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: await prisma.liveBid.count({ where: { auctionId: id } })
      }
    });
  } catch (error) {
    logger.error('Failed to get bids', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bids'
    });
  }
});

/**
 * @route   GET /api/auctions/:id/stats
 * @desc    Get auction statistics
 * @access  Public
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await auctionManager.getAuctionStats(id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get auction stats', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get auction stats'
    });
  }
});

/**
 * @route   GET /api/auctions/stream/:streamId
 * @desc    Get active auctions for a stream
 * @access  Public
 */
router.get('/stream/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;

    const auctions = await auctionManager.getStreamAuctions(streamId);

    res.json({
      success: true,
      data: auctions
    });
  } catch (error) {
    logger.error('Failed to get stream auctions', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stream auctions'
    });
  }
});

export default router;