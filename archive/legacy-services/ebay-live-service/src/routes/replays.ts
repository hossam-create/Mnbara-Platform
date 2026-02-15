// Replay Routes

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ReplayManager } from '../replay/ReplayManager';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();
const replayManager = new ReplayManager(prisma, logger);

/**
 * @route   POST /api/replays
 * @desc    Create a replay from a completed stream
 * @access  Private (stream owner)
 */
router.post('/', authMiddleware, validateRequest({
  body: {
    streamId: { type: 'string', required: true },
    title: { type: 'string', required: true, min: 1, max: 200 },
    description: { type: 'string', max: 1000 },
    tags: { type: 'array' },
    isPublic: { type: 'boolean', default: true },
    thumbnailUrl: { type: 'string' },
    duration: { type: 'number', required: true, min: 1 }
  }
}), async (req, res) => {
  try {
    const {
      streamId,
      title,
      description,
      tags,
      isPublic,
      thumbnailUrl,
      duration
    } = req.body;
    const userId = req.user.id;

    // Verify stream ownership and status
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      select: { sellerId: true, status: true, endedAt: true }
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
        error: 'You do not have permission to create a replay for this stream'
      });
    }

    if (stream.status !== 'ENDED') {
      return res.status(400).json({
        success: false,
        error: 'Stream must be ended to create a replay'
      });
    }

    const replay = await replayManager.createReplay({
      streamId,
      title,
      description,
      tags,
      isPublic,
      thumbnailUrl,
      duration,
      creatorId: userId
    });

    res.status(201).json({
      success: true,
      data: replay
    });
  } catch (error) {
    logger.error('Failed to create replay', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create replay'
    });
  }
});

/**
 * @route   GET /api/replays
 * @desc    Get replays with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      creatorId,
      streamId,
      isPublic,
      tags,
      search,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const replays = await replayManager.listReplays({
      creatorId: creatorId as string,
      streamId: streamId as string,
      isPublic: isPublic === 'true',
      tags: tags ? (tags as string).split(',') : undefined,
      search: search as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    });

    res.json({
      success: true,
      data: replays,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: replays.length // This should be total count from manager
      }
    });
  } catch (error) {
    logger.error('Failed to get replays', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get replays'
    });
  }
});

/**
 * @route   GET /api/replays/:id
 * @desc    Get replay by ID
 * @access  Public (if public) or Private (if private and owner)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const replay = await replayManager.getReplay(id, userId);

    res.json({
      success: true,
      data: replay
    });
  } catch (error) {
    logger.error('Failed to get replay', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get replay'
    });
  }
});

/**
 * @route   PUT /api/replays/:id
 * @desc    Update replay details
 * @access  Private (replay owner)
 */
router.put('/:id', authMiddleware, validateRequest({
  body: {
    title: { type: 'string', min: 1, max: 200 },
    description: { type: 'string', max: 1000 },
    tags: { type: 'array' },
    isPublic: { type: 'boolean' },
    thumbnailUrl: { type: 'string' }
  }
}), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify replay ownership
    const replay = await prisma.streamReplay.findUnique({
      where: { id },
      select: { creatorId: true }
    });

    if (!replay) {
      return res.status(404).json({
        success: false,
        error: 'Replay not found'
      });
    }

    if (replay.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this replay'
      });
    }

    const updatedReplay = await replayManager.updateReplay(id, req.body);

    res.json({
      success: true,
      data: updatedReplay
    });
  } catch (error) {
    logger.error('Failed to update replay', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update replay'
    });
  }
});

/**
 * @route   DELETE /api/replays/:id
 * @desc    Delete a replay
 * @access  Private (replay owner)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify replay ownership
    const replay = await prisma.streamReplay.findUnique({
      where: { id },
      select: { creatorId: true }
    });

    if (!replay) {
      return res.status(404).json({
        success: false,
        error: 'Replay not found'
      });
    }

    if (replay.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this replay'
      });
    }

    await replayManager.deleteReplay(id);

    res.json({
      success: true,
      message: 'Replay deleted'
    });
  } catch (error) {
    logger.error('Failed to delete replay', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete replay'
    });
  }
});

/**
 * @route   POST /api/replays/:id/view
 * @desc    Record a replay view
 * @access  Public
 */
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, duration = 0 } = req.body;

    await replayManager.recordView(id, userId, duration);

    res.json({
      success: true,
      message: 'View recorded'
    });
  } catch (error) {
    logger.error('Failed to record replay view', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record replay view'
    });
  }
});

/**
 * @route   GET /api/replays/:id/segments
 * @desc    Get replay segments for streaming
 * @access  Public (if public) or Private (if private and owner)
 */
router.get('/:id/segments', async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime = 0, endTime } = req.query;
    const userId = req.user?.id;

    const segments = await replayManager.getReplaySegments(id, userId, {
      startTime: parseInt(startTime as string),
      endTime: endTime ? parseInt(endTime as string) : undefined
    });

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    logger.error('Failed to get replay segments', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get replay segments'
    });
  }
});

/**
 * @route   GET /api/replays/:id/download
 * @desc    Get download URL for replay
 * @access  Private (replay owner)
 */
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify replay ownership
    const replay = await prisma.streamReplay.findUnique({
      where: { id },
      select: { creatorId: true, videoUrl: true, status: true }
    });

    if (!replay) {
      return res.status(404).json({
        success: false,
        error: 'Replay not found'
      });
    }

    if (replay.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to download this replay'
      });
    }

    if (replay.status !== 'READY') {
      return res.status(400).json({
        success: false,
        error: 'Replay is not ready for download'
      });
    }

    const downloadUrl = await replayManager.getDownloadUrl(id);

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });
  } catch (error) {
    logger.error('Failed to get replay download URL', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get replay download URL'
    });
  }
});

/**
 * @route   POST /api/replays/:id/segments
 * @desc    Upload replay segments
 * @access  Private (stream owner)
 */
router.post('/:id/segments', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { segments } = req.body;
    const userId = req.user.id;

    // Verify replay ownership
    const replay = await prisma.streamReplay.findUnique({
      where: { id },
      select: { creatorId: true, status: true }
    });

    if (!replay) {
      return res.status(404).json({
        success: false,
        error: 'Replay not found'
      });
    }

    if (replay.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to upload segments for this replay'
      });
    }

    if (replay.status !== 'PROCESSING') {
      return res.status(400).json({
        success: false,
        error: 'Replay is not in processing status'
      });
    }

    await replayManager.uploadSegments(id, segments);

    res.json({
      success: true,
      message: 'Segments uploaded'
    });
  } catch (error) {
    logger.error('Failed to upload replay segments', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload replay segments'
    });
  }
});

export default router;