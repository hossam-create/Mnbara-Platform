// Chat Routes

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ChatManager } from '../chat/ChatManager';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const chatManager = new ChatManager(prisma, redis, logger);

/**
 * @route   POST /api/chat/messages
 * @desc    Send a chat message
 * @access  Private
 */
router.post('/messages', authMiddleware, validateRequest({
  body: {
    streamId: { type: 'string', required: true },
    content: { type: 'string', required: true, min: 1, max: 500 },
    messageType: { type: 'string', enum: ['text', 'emoji', 'system', 'auction'] },
    metadata: { type: 'object' }
  }
}), async (req, res) => {
  try {
    const { streamId, content, messageType, metadata } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    const message = await chatManager.sendMessage({
      streamId,
      userId,
      userName,
      content,
      messageType: messageType || 'text',
      metadata
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error('Failed to send message', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
});

/**
 * @route   GET /api/chat/messages
 * @desc    Get chat messages for a stream
 * @access  Public
 */
router.get('/messages', async (req, res) => {
  try {
    const {
      streamId,
      limit = 50,
      offset = 0,
      messageType,
      userId
    } = req.query;

    if (!streamId) {
      return res.status(400).json({
        success: false,
        error: 'streamId is required'
      });
    }

    const messages = await chatManager.getMessages({
      streamId: streamId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      messageType: messageType as string,
      userId: userId as string
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error('Failed to get messages', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages'
    });
  }
});

/**
 * @route   DELETE /api/chat/messages/:id
 * @desc    Delete a chat message
 * @access  Private (message owner or moderator)
 */
router.delete('/messages/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

    await chatManager.deleteMessage(id, userId, isModerator);

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    logger.error('Failed to delete message', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete message'
    });
  }
});

/**
 * @route   PUT /api/chat/messages/:id/pin
 * @desc    Pin a chat message
 * @access  Private (stream owner or moderator)
 */
router.put('/messages/:id/pin', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await chatManager.pinMessage(id, userId);

    res.json({
      success: true,
      message: 'Message pinned'
    });
  } catch (error) {
    logger.error('Failed to pin message', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pin message'
    });
  }
});

/**
 * @route   POST /api/chat/users/:userId/mute
 * @desc    Mute a user in a stream
 * @access  Private (stream owner or moderator)
 */
router.post('/users/:userId/mute', authMiddleware, validateRequest({
  body: {
    streamId: { type: 'string', required: true },
    duration: { type: 'number', min: 60, max: 86400 } // 1 minute to 24 hours
  }
}), async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { streamId, duration = 300 } = req.body; // Default 5 minutes
    const moderatorId = req.user.id;

    // Verify moderator permissions
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

    const isStreamOwner = stream.sellerId === moderatorId;
    const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

    if (!isStreamOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to mute users in this stream'
      });
    }

    await chatManager.muteUser(streamId, targetUserId, duration);

    res.json({
      success: true,
      message: `User muted for ${duration} seconds`
    });
  } catch (error) {
    logger.error('Failed to mute user', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mute user'
    });
  }
});

/**
 * @route   DELETE /api/chat/users/:userId/mute
 * @desc    Unmute a user in a stream
 * @access  Private (stream owner or moderator)
 */
router.delete('/users/:userId/mute', authMiddleware, validateRequest({
  body: {
    streamId: { type: 'string', required: true }
  }
}), async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { streamId } = req.body;
    const moderatorId = req.user.id;

    // Verify moderator permissions
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

    const isStreamOwner = stream.sellerId === moderatorId;
    const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

    if (!isStreamOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to unmute users in this stream'
      });
    }

    await chatManager.unmuteUser(streamId, targetUserId);

    res.json({
      success: true,
      message: 'User unmuted'
    });
  } catch (error) {
    logger.error('Failed to unmute user', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unmute user'
    });
  }
});

/**
 * @route   GET /api/chat/stats/:streamId
 * @desc    Get chat statistics for a stream
 * @access  Public
 */
router.get('/stats/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;

    const stats = await chatManager.getRoomStats(streamId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get chat stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat stats'
    });
  }
});

/**
 * @route   POST /api/chat/rooms/:streamId/moderation
 * @desc    Enable/disable chat moderation for a stream
 * @access  Private (stream owner)
 */
router.post('/rooms/:streamId/moderation', authMiddleware, validateRequest({
  body: {
    enabled: { type: 'boolean', required: true }
  }
}), async (req, res) => {
  try {
    const { streamId } = req.params;
    const { enabled } = req.body;
    const userId = req.user.id;

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

    if (stream.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to modify chat settings for this stream'
      });
    }

    await chatManager.setRoomModeration(streamId, enabled);

    res.json({
      success: true,
      message: `Chat moderation ${enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    logger.error('Failed to set chat moderation', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to set chat moderation'
    });
  }
});

export default router;