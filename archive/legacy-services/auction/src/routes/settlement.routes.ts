import { Router, Request, Response } from 'express';
import { settlementService } from '../services/Settlement.service';
import { SettlementRequest, AppealRequest } from '../types/Settlement.types';

/**
 * Settlement Routes - READ ONLY for appeals
 * 
 * Frontend has ZERO authority - all decisions made in backend
 * Settlement is IMMUTABLE once finalized
 * Appeals are READ-ONLY signals that require manual review
 */

const router = Router();

/**
 * POST /api/v1/auction/settlement
 * 
 * Create a new auction settlement
 * This is an internal endpoint called by auction service
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const settlementRequest: SettlementRequest = {
      auctionId: req.body.auctionId,
      sellerId: req.body.sellerId,
      winnerId: req.body.winnerId,
      winningBidId: req.body.winningBidId,
      winningAmount: req.body.winningAmount,
      settlementMethod: req.body.settlementMethod,
      metadata: req.body.metadata
    };

    // Validate required fields
    if (!settlementRequest.auctionId || !settlementRequest.sellerId || !settlementRequest.winningAmount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: auctionId, sellerId, winningAmount'
      });
    }

    // Create settlement
    const result = await settlementService.createSettlement(settlementRequest);

    if (result.success) {
      res.status(201).json({
        success: true,
        settlement: result.settlement,
        appealWindow: result.appealWindow
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Settlement] Error creating settlement:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create settlement'
    });
  }
});

/**
 * POST /api/v1/auction/settlement/:settlementId/appeal
 * 
 * Create an appeal against a settlement
 * Appeals are READ-ONLY signals that require manual review
 */
router.post('/:settlementId/appeal', async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const appealRequest: AppealRequest = {
      settlementId,
      appellantId: req.body.appellantId,
      appellantRole: req.body.appellantRole,
      reason: req.body.reason,
      description: req.body.description,
      evidence: req.body.evidence
    };

    // Validate required fields
    if (!appealRequest.appellantId || !appealRequest.appellantRole || !appealRequest.reason || !appealRequest.description) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: appellantId, appellantRole, reason, description'
      });
    }

    // Create appeal
    const result = await settlementService.createAppeal(appealRequest);

    if (result.success) {
      res.status(201).json({
        success: true,
        appeal: result.appeal,
        canAppeal: result.canAppeal,
        appealWindow: result.appealWindow
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        canAppeal: result.canAppeal,
        appealWindow: result.appealWindow
      });
    }

  } catch (error) {
    console.error('[Settlement] Error creating appeal:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create appeal'
    });
  }
});

/**
 * GET /api/v1/auction/settlement/:settlementId
 * 
 * Get settlement by ID
 */
router.get('/:settlementId', async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const settlement = settlementService.getSettlement(settlementId);

    if (!settlement) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Settlement not found'
      });
    }

    res.json({
      success: true,
      settlement
    });

  } catch (error) {
    console.error('[Settlement] Error getting settlement:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve settlement'
    });
  }
});

/**
 * GET /api/v1/auction/settlement/auction/:auctionId
 * 
 * Get settlement by auction ID
 */
router.get('/auction/:auctionId', async (req: Request, res: Response) => {
  try {
    const { auctionId } = req.params;
    const settlement = settlementService.getSettlementByAuctionId(auctionId);

    if (!settlement) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Settlement not found for this auction'
      });
    }

    res.json({
      success: true,
      settlement
    });

  } catch (error) {
    console.error('[Settlement] Error getting settlement by auction:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve settlement'
    });
  }
});

/**
 * GET /api/v1/auction/settlement/:settlementId/appeal-eligibility/:userId
 * 
 * Check if a user can appeal a settlement
 */
router.get('/:settlementId/appeal-eligibility/:userId', async (req: Request, res: Response) => {
  try {
    const { settlementId, userId } = req.params;
    const userRole = req.query.role as 'BUYER' | 'SELLER' | 'OBSERVER';

    if (!userRole) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User role is required'
      });
    }

    const eligibility = settlementService.checkAppealEligibility(settlementId, userId, userRole);

    res.json({
      success: true,
      eligibility
    });

  } catch (error) {
    console.error('[Settlement] Error checking appeal eligibility:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check appeal eligibility'
    });
  }
});

/**
 * GET /api/v1/auction/settlement/:settlementId/appeals
 * 
 * Get all appeals for a settlement (admin only)
 */
router.get('/:settlementId/appeals', async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const appeals = settlementService.getAppealsForSettlement(settlementId);

    res.json({
      success: true,
      appeals,
      count: appeals.length
    });

  } catch (error) {
    console.error('[Settlement] Error getting appeals:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve appeals'
    });
  }
});

/**
 * GET /api/v1/auction/settlement/:settlementId/appeal-window
 * 
 * Get appeal window for a settlement
 */
router.get('/:settlementId/appeal-window', async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const appealWindow = settlementService.getAppealWindow(settlementId);

    if (!appealWindow) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Appeal window not found'
      });
    }

    res.json({
      success: true,
      appealWindow
    });

  } catch (error) {
    console.error('[Settlement] Error getting appeal window:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve appeal window'
    });
  }
});

/**
 * POST /api/v1/auction/settlement/:settlementId/finalize
 * 
 * Finalize a settlement (make it immutable)
 * This is an internal endpoint for system processes
 */
router.post('/:settlementId/finalize', async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const result = settlementService.finalizeSettlement(settlementId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Settlement finalized successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Settlement] Error finalizing settlement:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to finalize settlement'
    });
  }
});

/**
 * GET /api/v1/auction/settlement/statistics
 * 
 * Get settlement statistics (admin only)
 */
router.get('/statistics', async (_req: Request, res: Response) => {
  try {
    const statistics = settlementService.getStatistics();
    
    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('[Settlement] Error getting statistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve settlement statistics'
    });
  }
});

/**
 * GET /api/v1/auction/settlement/events
 * 
 * Get settlement event log (admin only)
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const events = settlementService.getEventLog(limit);
    
    res.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('[Settlement] Error getting events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve settlement events'
    });
  }
});

/**
 * POST /api/v1/auction/settlement/process-expired-windows
 * 
 * Process expired appeal windows (internal endpoint)
 */
router.post('/process-expired-windows', async (_req: Request, res: Response) => {
  try {
    settlementService.processExpiredAppealWindows();
    
    res.json({
      success: true,
      message: 'Expired appeal windows processed'
    });

  } catch (error) {
    console.error('[Settlement] Error processing expired windows:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process expired appeal windows'
    });
  }
});

/**
 * GET /api/v1/auction/settlement/health
 * 
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const statistics = settlementService.getStatistics();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      statistics: {
        totalSettlements: statistics.totalSettlements,
        totalAppeals: statistics.totalAppeals,
        pendingAppeals: statistics.pendingAppeals
      }
    });

  } catch (error) {
    console.error('[Settlement] Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed'
    });
  }
});

export default router;
