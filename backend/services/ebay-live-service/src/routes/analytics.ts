// Analytics Routes

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalyticsManager } from '../analytics/AnalyticsManager';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const analyticsManager = new AnalyticsManager(prisma, redis, logger);

/**
 * @route   GET /api/analytics/stream/:streamId
 * @desc    Get stream analytics
 * @access  Private (stream owner)
 */
router.get('/stream/:streamId', authMiddleware, async (req, res) => {
  try {
    const { streamId } = req.params;
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

    if (stream.sellerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view analytics for this stream'
      });
    }

    const stats = await analyticsManager.getStreamStats(streamId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get stream analytics', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stream analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/stream/:streamId/timeseries
 * @desc    Get time-series analytics data for a stream
 * @access  Private (stream owner)
 */
router.get('/stream/:streamId/timeseries', authMiddleware, validateRequest({
  query: {
    duration: { type: 'number', min: 60, max: 86400, default: 3600 } // 1 hour to 24 hours
  }
}), async (req, res) => {
  try {
    const { streamId } = req.params;
    const { duration = 3600 } = req.query;
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

    if (stream.sellerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view analytics for this stream'
      });
    }

    const timeseriesData = await analyticsManager.getTimeSeriesData(
      streamId,
      parseInt(duration as string)
    );

    res.json({
      success: true,
      data: timeseriesData
    });
  } catch (error) {
    logger.error('Failed to get time-series analytics', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get time-series analytics'
    });
  }
});

/**
 * @route   GET /api/analytics
 * @desc    Get analytics data with filters
 * @access  Private
 */
router.get('/', authMiddleware, validateRequest({
  query: {
    streamId: { type: 'string' },
    dateFrom: { type: 'date' },
    dateTo: { type: 'date' },
    groupBy: { type: 'string', enum: ['hour', 'day', 'week', 'month'] }
  }
}), async (req, res) => {
  try {
    const { streamId, dateFrom, dateTo, groupBy } = req.query;
    const userId = req.user.id;

    // If specific stream is requested, verify ownership
    if (streamId) {
      const stream = await prisma.liveStream.findUnique({
        where: { id: streamId as string },
        select: { sellerId: true }
      });

      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found'
        });
      }

      if (stream.sellerId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view analytics for this stream'
        });
      }
    }

    const filters = {
      streamId: streamId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      groupBy: groupBy as any
    };

    const analytics = await analyticsManager.getAnalytics(filters);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Failed to get analytics', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

/**
 * @route   POST /api/analytics/events
 * @desc    Track an analytics event
 * @access  Public
 */
router.post('/events', validateRequest({
  body: {
    streamId: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    eventType: { type: 'string', required: true, enum: ['join', 'leave', 'heartbeat'] },
    metadata: { type: 'object' }
  }
}), async (req, res) => {
  try {
    const { streamId, userId, eventType, metadata } = req.body;

    await analyticsManager.trackViewerEvent({
      streamId,
      userId,
      eventType,
      timestamp: new Date(),
      metadata
    });

    res.json({
      success: true,
      message: 'Event tracked'
    });
  } catch (error) {
    logger.error('Failed to track event', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event'
    });
  }
});

/**
 * @route   GET /api/analytics/viewer-count/:streamId
 * @desc    Get current viewer count for a stream
 * @access  Public
 */
router.get('/viewer-count/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;

    const viewerCount = await analyticsManager.getCurrentViewers(streamId);

    res.json({
      success: true,
      data: {
        streamId,
        currentViewers: viewerCount
      }
    });
  } catch (error) {
    logger.error('Failed to get viewer count', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get viewer count'
    });
  }
});

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics summary
 * @access  Private
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateFrom, dateTo } = req.query;

    // Get user's streams
    const streams = await prisma.liveStream.findMany({
      where: {
        sellerId: userId,
        createdAt: {
          gte: dateFrom ? new Date(dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          lte: dateTo ? new Date(dateTo as string) : new Date()
        }
      },
      select: { id: true, title: true, status: true, createdAt: true }
    });

    // Get analytics for all streams
    const streamIds = streams.map(s => s.id);
    const analytics = await prisma.streamAnalytic.findMany({
      where: {
        streamId: { in: streamIds }
      }
    });

    // Calculate summary statistics
    const totalViewers = analytics.filter(a => a.eventType === 'VIEW').length;
    const uniqueViewers = new Set(analytics.filter(a => a.eventType === 'VIEW').map(a => a.userId)).size;
    const totalWatchTime = analytics.filter(a => a.eventType === 'VIEW').reduce((sum, a) => sum + (a.duration || 0), 0);
    const totalMessages = await prisma.streamMessage.count({
      where: {
        streamId: { in: streamIds }
      }
    });

    res.json({
      success: true,
      data: {
        totalStreams: streams.length,
        totalViewers,
        uniqueViewers,
        totalWatchTime,
        totalMessages,
        averageWatchTime: totalViewers > 0 ? Math.floor(totalWatchTime / totalViewers) : 0,
        streams: streams.map(stream => ({
          id: stream.id,
          title: stream.title,
          status: stream.status,
          createdAt: stream.createdAt
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to get dashboard analytics', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard analytics'
    });
  }
});

export default router;