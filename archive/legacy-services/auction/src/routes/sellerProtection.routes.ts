import { Router, Request, Response } from 'express';
import { sellerProtectionService } from '../services/SellerProtection.service';
import { SellerProtectionRequest, AutoRelistRequest } from '../types/SellerProtection.types';

/**
 * Seller Protection Routes - BACKEND ONLY
 * 
 * Protects sellers from buyer abuse, failed settlements, and no-shows
 * WITHOUT breaking settlement finality or escrow safety
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority
 * - Seller protection logic is BACKEND ONLY
 * - No automatic wallet or escrow mutations
 * - Auto-relist NEVER happens from frontend
 * - Auto-relist NEVER reuses previous bids
 */

const router = Router();

/**
 * POST /api/v1/auction/seller-protection
 * 
 * Create seller protection for a seller
 * This is an internal endpoint called by settlement system
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const protectionRequest: SellerProtectionRequest = {
      originalAuctionId: req.body.originalAuctionId,
      sellerId: req.body.sellerId,
      buyerId: req.body.buyerId,
      trigger: req.body.trigger,
      triggerData: req.body.triggerData,
      originalAuctionData: req.body.originalAuctionData
    };

    // Validate required fields
    if (!protectionRequest.originalAuctionId || !protectionRequest.sellerId || !protectionRequest.trigger) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: originalAuctionId, sellerId, trigger'
      });
    }

    // Create seller protection
    const result = sellerProtectionService.createSellerProtection(protectionRequest);

    if (result.success) {
      res.status(201).json({
        success: true,
        sellerProtection: result.sellerProtection,
        autoRelistEligible: result.autoRelistEligible,
        autoRelistEligibility: result.autoRelistEligibility
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[SellerProtection] Error creating protection:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create seller protection'
    });
  }
});

/**
 * POST /api/v1/auction/seller-protection/:protectionId/auto-relist
 * 
 * Process auto-relist request
 * This is an internal endpoint for system processes
 */
router.post('/:protectionId/auto-relist', async (req: Request, res: Response) => {
  try {
    const { protectionId } = req.params;
    const autoRelistRequest: AutoRelistRequest = {
      sellerProtectionId: protectionId,
      requireConfirmation: req.body.requireConfirmation,
      startStatus: req.body.startStatus,
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      metadata: req.body.metadata
    };

    // Validate required fields
    if (!autoRelistRequest.sellerProtectionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: sellerProtectionId'
      });
    }

    // Process auto-relist
    const result = sellerProtectionService.processAutoRelist(autoRelistRequest);

    if (result.success) {
      res.json({
        success: true,
        sellerProtection: result.sellerProtection,
        newAuctionId: result.newAuctionId,
        newAuctionData: result.newAuctionData,
        requiresConfirmation: result.requiresConfirmation,
        confirmationDeadline: result.confirmationDeadline
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[SellerProtection] Error processing auto-relist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process auto-relist'
    });
  }
});

/**
 * POST /api/v1/auction/seller-protection/:protectionId/cancel-auto-relist
 * 
 * Cancel auto-relist
 * This is an internal endpoint for system processes
 */
router.post('/:protectionId/cancel-auto-relist', async (req: Request, res: Response) => {
  try {
    const { protectionId } = req.params;
    const result = sellerProtectionService.cancelAutoRelist(protectionId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Auto-relist cancelled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[SellerProtection] Error cancelling auto-relist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel auto-relist'
    });
  }
});

/**
 * GET /api/v1/auction/seller-protection/:protectionId
 * 
 * Get seller protection by ID (admin only)
 */
router.get('/:protectionId', async (req: Request, res: Response) => {
  try {
    const { protectionId } = req.params;
    const protection = sellerProtectionService.getSellerProtection(protectionId);

    if (!protection) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller protection not found'
      });
    }

    res.json({
      success: true,
      protection
    });

  } catch (error) {
    console.error('[SellerProtection] Error getting protection:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve seller protection'
    });
  }
});

/**
 * GET /api/v1/auction/seller-protection/seller/:sellerId
 * 
 * Get protections for seller (admin only)
 */
router.get('/seller/:sellerId', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const protections = sellerProtectionService.getProtectionsForSeller(sellerId);

    res.json({
      success: true,
      protections,
      count: protections.length
    });

  } catch (error) {
    console.error('[SellerProtection] Error getting seller protections:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve seller protections'
    });
  }
});

/**
 * GET /api/v1/auction/seller-protection/auction/:originalAuctionId
 * 
 * Get protection for original auction (admin only)
 */
router.get('/auction/:originalAuctionId', async (req: Request, res: Response) => {
  try {
    const { originalAuctionId } = req.params;
    const protection = sellerProtectionService.getProtectionForAuction(originalAuctionId);

    if (!protection) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Protection not found for this auction'
      });
    }

    res.json({
      success: true,
      protection
    });

  } catch (error) {
    console.error('[SellerProtection] Error getting auction protection:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve auction protection'
    });
  }
});

/**
 * GET /api/v1/auction/seller-protection/:protectionId/auto-relist-eligibility
 * 
 * Check auto-relist eligibility (internal endpoint)
 */
router.get('/:protectionId/auto-relist-eligibility', async (req: Request, res: Response) => {
  try {
    const { protectionId } = req.params;
    const eligibility = sellerProtectionService.checkAutoRelistEligibility(protectionId);

    res.json({
      success: true,
      eligibility
    });

  } catch (error) {
    console.error('[SellerProtection] Error checking auto-relist eligibility:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check auto-relist eligibility'
    });
  }
});

/**
 * GET /api/v1/auction/seller-protection/statistics
 * 
 * Get seller protection statistics (admin only)
 */
router.get('/statistics', async (_req: Request, res: Response) => {
  try {
    const statistics = sellerProtectionService.getStatistics();
    
    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('[SellerProtection] Error getting statistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve seller protection statistics'
    });
  }
});

/**
 * GET /api/v1/auction/seller-protection/events
 * 
 * Get seller protection event log (admin only)
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const events = sellerProtectionService.getEventLog(limit);
    
    res.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('[SellerProtection] Error getting events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve seller protection events'
    });
  }
});

/**
 * GET /api/v1/auction/seller-protection/health
 * 
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const statistics = sellerProtectionService.getStatistics();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      statistics: {
        totalProtections: statistics.totalProtections,
        autoRelisted: statistics.autoRelisted,
        autoRelistSuccessRate: statistics.autoRelistSuccessRate
      }
    });

  } catch (error) {
    console.error('[SellerProtection] Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed'
    });
  }
});

export default router;
