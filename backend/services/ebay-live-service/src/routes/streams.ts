// Stream Routes

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { LiveStreamManager } from '../streaming/LiveStreamManager';
import { RTMPServer } from '../streaming/RTMPServer';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();
const rtmpServer = new RTMPServer(logger);
const streamManager = new LiveStreamManager(prisma, rtmpServer, logger);

/**
 * @route   POST /api/streams
 * @desc    Create a new live stream
 * @access  Private
 */
router.post('/', authMiddleware, validateRequest({
  body: {
    title: { type: 'string', required: true, min: 1, max: 200 },
    description: { type: 'string', max: 1000 },
    scheduledStart: { type: 'date', required: true },
    category: { type: 'string', max: 50 },
    tags: { type: 'array', items: { type: 'string', max: 30 } }
  }
}), async (req, res) => {
  try {
    const { title, description, scheduledStart, category, tags } = req.body;
    const sellerId = req.user.id;

    const stream = await streamManager.createStream({
      title,
      description,
      scheduledStart: new Date(scheduledStart),
      sellerId,
      category,
      tags
    });

    res.status(201).json({
      success: true,
      data: stream
    });
  } catch (error) {
    logger.error('Failed to create stream', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stream'
    });
  }
});

/**
 * @route   GET /api/streams
 * @desc    Get all streams with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      sellerId,
      category,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};
    
    if (status) where.status = status;
    if (sellerId) where.sellerId = sellerId;
    if (category) where.category = category;

    const streams = await prisma.liveStream.findMany({
      where,
      orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
      take: Math.min(parseInt(limit as string), 100),
      skip: parseInt(offset as string),
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true
          }
        },
        auctions: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            currentPrice: true,
            endTime: true
          }
        },
        _count: {
          select: {
            messages: true,
            viewers: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: streams,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: await prisma.liveStream.count({ where })
      }
    });
  } catch (error) {
    logger.error('Failed to get streams', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get streams'
    });
  }
});

/**
 * @route   GET /api/streams/:id
 * @desc    Get stream by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const stream = await prisma.liveStream.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true,
            bio: true,
            followers: true
          }
        },
        auctions: {
          where: { status: 'ACTIVE' },
          include: {
            bids: {
              orderBy: { amount: 'desc' },
              take: 1
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        viewers: {
          where: { status: 'ACTIVE' },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }

    res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    logger.error('Failed to get stream', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stream'
    });
  }
});

/**
 * @route   PUT /api/streams/:id/start
 * @desc    Start a stream
 * @access  Private (stream owner)
 */
router.put('/:id/start', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify stream ownership
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      select: { sellerId: true, status: true }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }

    if (stream.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to start this stream'
      });
    }

    if (stream.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        error: 'Stream is not in scheduled status'
      });
    }

    const startedStream = await streamManager.startStream(id);

    res.json({
      success: true,
      data: startedStream
    });
  } catch (error) {
    logger.error('Failed to start stream', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start stream'
    });
  }
});

/**
 * @route   PUT /api/streams/:id/end
 * @desc    End a stream
 * @access  Private (stream owner)
 */
router.put('/:id/end', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify stream ownership
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      select: { sellerId: true, status: true }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }

    if (stream.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to end this stream'
      });
    }

    if (stream.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Stream is not active'
      });
    }

    const endedStream = await streamManager.endStream(id);

    res.json({
      success: true,
      data: endedStream
    });
  } catch (error) {
    logger.error('Failed to end stream', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end stream'
    });
  }
});

/**
 * @route   POST /api/streams/:id/validate
 * @desc    Validate stream key (called by RTMP server)
 * @access  Private (RTMP server)
 */
router.post('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const { streamKey } = req.body;

    const stream = await prisma.liveStream.findUnique({
      where: { id },
      select: { streamKey: true, status: true }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }

    if (stream.streamKey !== streamKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid stream key'
      });
    }

    if (stream.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Stream is not active'
      });
    }

    res.json({
      success: true,
      message: 'Stream key validated'
    });
  } catch (error) {
    logger.error('Failed to validate stream', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate stream'
    });
  }
});

/**
 * @route   POST /api/streams/:id/end
 * @desc    Stream ended (called by RTMP server)
 * @access  Private (RTMP server)
 */
router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;

    const stream = await prisma.liveStream.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }

    if (stream.status === 'ACTIVE') {
      await streamManager.endStream(id);
    }

    res.json({
      success: true,
      message: 'Stream ended'
    });
  } catch (error) {
    logger.error('Failed to end stream', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end stream'
    });
  }
});

/**
 * @route   GET /api/streams/:id/playback
 * @desc    Get stream playback URL
 * @access  Public
 */
router.get('/:id/playback', async (req, res) => {
  try {
    const { id } = req.params;

    const stream = await prisma.liveStream.findUnique({
      where: { id },
      select: { status: true, hlsUrl: true, rtmpUrl: true }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }

    res.json({
      success: true,
      data: {
        hlsUrl: stream.hlsUrl,
        rtmpUrl: stream.rtmpUrl,
        status: stream.status
      }
    });
  } catch (error) {
    logger.error('Failed to get playback URL', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get playback URL'
    });
  }
});

export default router;