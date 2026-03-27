import { Router, Request, Response } from 'express';
import { bidThrottling } from '../services/BidThrottling.service';
import { BidThrottlingRequest } from '../types/BidThrottling.types';

/**
 * Bid Throttling Routes
 * 
 * Anti-fraud bid throttling endpoints
 * Frontend has ZERO authority - all decisions made in backend
 */

const router = Router();

/**
 * POST /api/v1/auction/bid-throttling/evaluate
 * 
 * Evaluate bid request for throttling
 * This endpoint is called BEFORE bid validation
 */
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const throttlingRequest: BidThrottlingRequest = {
      userId: req.body.userId,
      auctionId: req.body.auctionId,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      bidAmount: req.body.bidAmount,
      timestamp: new Date(req.body.timestamp || Date.now()),
      userAgent: req.get('User-Agent'),
      sessionId: req.body.sessionId
    };

    // Validate required fields
    if (!throttlingRequest.userId || !throttlingRequest.auctionId || !throttlingRequest.bidAmount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: userId, auctionId, bidAmount'
      });
    }

    // Evaluate bid for throttling
    const result = await bidThrottling.evaluateBid(throttlingRequest);

    // Return throttling decision
    res.json({
      success: true,
      decision: result.decision,
      reason: result.reason,
      message: result.message,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('[BidThrottling] Error evaluating bid:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to evaluate bid for throttling'
    });
  }
});

/**
 * GET /api/v1/auction/bid-throttling/statistics
 * 
 * Get throttling statistics (admin only)
 */
router.get('/statistics', async (_req: Request, res: Response) => {
  try {
    const statistics = bidThrottling.getStatistics();
    
    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('[BidThrottling] Error getting statistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve throttling statistics'
    });
  }
});

/**
 * GET /api/v1/auction/bid-throttling/events
 * 
 * Get throttling event log (admin only)
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const events = bidThrottling.getEventLog(limit);
    
    res.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('[BidThrottling] Error getting events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve throttling events'
    });
  }
});

/**
 * POST /api/v1/auction/bid-throttling/cleanup
 * 
 * Clean old data (admin only)
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const olderThanHours = req.body.olderThanHours || 24;
    
    bidThrottling.clearOldData(olderThanHours);
    
    res.json({
      success: true,
      message: `Cleaned data older than ${olderThanHours} hours`
    });

  } catch (error) {
    console.error('[BidThrottling] Error during cleanup:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cleanup old data'
    });
  }
});

/**
 * GET /api/v1/auction/bid-throttling/health
 * 
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const statistics = bidThrottling.getStatistics();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      statistics: {
        totalRequests: statistics.totalRequests,
        averageResponseTime: statistics.averageResponseTime
      }
    });

  } catch (error) {
    console.error('[BidThrottling] Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed'
    });
  }
});

export default router;
