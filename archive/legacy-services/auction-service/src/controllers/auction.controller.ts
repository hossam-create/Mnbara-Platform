import { Request, Response, NextFunction } from 'express';
import { AuctionService, AutoExtendConfig } from '../services/auction.service';

type AuthenticatedRequest = Request & { userId?: number };

export class AuctionController {
  private auctionService: AuctionService;

  constructor() {
    this.auctionService = new AuctionService();
  }

  /**
   * Create a new auction
   */
  createAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Get userId from JWT middleware
      const sellerId = (req as AuthenticatedRequest).userId ?? 1;

      const {
        title,
        description,
        startingBid,
        reservePrice,
        buyNowPrice,
        auctionEndsAt,
        auctionStartsAt,
        currency,
        autoExtendEnabled,
        autoExtendThresholdMs,
        autoExtendDurationMs,
        maxExtensions,
        minBidIncrement,
      } = req.body;

      // Build auto-extend config if any options provided
      const autoExtendConfig: Partial<AutoExtendConfig> = {};
      if (autoExtendEnabled !== undefined) autoExtendConfig.enabled = autoExtendEnabled;
      if (autoExtendThresholdMs) autoExtendConfig.thresholdMs = autoExtendThresholdMs;
      if (autoExtendDurationMs) autoExtendConfig.durationMs = autoExtendDurationMs;
      if (maxExtensions) autoExtendConfig.maxExtensions = maxExtensions;

      const result = await this.auctionService.createAuction({
        title,
        description,
        sellerId,
        startingBid: parseFloat(startingBid),
        reservePrice: reservePrice ? parseFloat(reservePrice) : undefined,
        buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : undefined,
        auctionEndsAt: new Date(auctionEndsAt),
        auctionStartsAt: auctionStartsAt ? new Date(auctionStartsAt) : undefined,
        currency,
        autoExtendConfig: Object.keys(autoExtendConfig).length > 0 ? autoExtendConfig : undefined,
        minBidIncrement: minBidIncrement ? parseFloat(minBidIncrement) : undefined,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Get auction by ID
   */
  getAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.auctionService.getAuction(parseInt(id));

      if (!result) {
        return res.status(404).json({ success: false, message: 'Auction not found' });
      }

      // Add computed fields
      const now = new Date();
      const timeRemaining = result.auctionEndsAt 
        ? Math.max(0, result.auctionEndsAt.getTime() - now.getTime())
        : 0;

      res.json({
        success: true,
        data: {
          ...result,
          timeRemainingMs: timeRemaining,
          isEnding: timeRemaining > 0 && timeRemaining < 120000, // Within 2 minutes
          hasEnded: timeRemaining === 0,
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Get active auctions with filters
   */
  getAuctions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        categoryId,
        minPrice,
        maxPrice,
        endingSoon,
        limit,
        offset,
      } = req.query;

      const result = await this.auctionService.getActiveAuctions({
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        endingSoon: endingSoon === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: result,
        count: result.length,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Start an auction (change status from SCHEDULED to ACTIVE)
   */
  startAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.auctionService.startAuction(parseInt(id));

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : null;
      if (
        err?.message.includes('not found') ||
        err?.message.includes('cannot be started') ||
        err?.message.includes('start time') ||
        err?.message.includes('not an auction')
      ) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next(error);
    }
  };

  /**
   * End an auction manually
   */
  endAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.auctionService.endAuction(parseInt(id));

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('not active'))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  };

  /**
   * Update auto-extend configuration
   */
  updateAutoExtendConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { enabled, thresholdMs, durationMs, maxExtensions } = req.body;

      const result = await this.auctionService.updateAutoExtendConfig(parseInt(id), {
        enabled,
        thresholdMs,
        durationMs,
        maxExtensions,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Get extension history for an auction
   */
  getExtensionHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.auctionService.getExtensionHistory(parseInt(id));

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
