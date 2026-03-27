/**
 * Listing Webhook Controller
 * Handles decision authority status updates via webhook
 */

import { Request, Response, NextFunction } from 'express';
import { ListingService } from '../services/listing.service';
import { Logger } from '../utils/logger';

const logger = new Logger('ListingWebhookController');

export class ListingWebhookController {
  private listingService: ListingService;

  constructor() {
    this.listingService = new ListingService();
  }

  /**
   * Handle decision status update webhook from Decision Authority Service
   * POST /api/v1/webhooks/decisions
   */
  handleDecisionStatusUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { decisionId, assetId, status, reason, expiresAt } = req.body;

      logger.info(`Received decision update: ${decisionId} -> ${status} for asset ${assetId}`);

      // Validate required fields
      if (!decisionId || !assetId || !status) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: decisionId, assetId, status'
        });
      }

      // Update listing with new decision status
      const updatedListing = await this.listingService.updateDispositionStatus(
        assetId,
        parseInt(decisionId)
      );

      if (!updatedListing) {
        logger.warn(`Listing not found for asset ${assetId}`);
        return res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
      }

      logger.info(`Successfully updated listing ${assetId} to status ${status}`);

      res.json({
        success: true,
        data: updatedListing
      });
    } catch (error) {
      logger.error('Failed to handle decision update', error);
      next(error);
    }
  };

  /**
   * Get decision status for a listing
   * GET /api/v1/listings/:id/decision
   */
  getListingDecisionStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const listing = await this.listingService.getListing(id);

      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
      }

      res.json({
        success: true,
        data: {
          listingId: listing.id,
          dispositionStatus: listing.dispositionStatus,
          decisionId: listing.decisionId,
          decisionRef: listing.decisionRef,
          requestedAt: listing.decisionRequestedAt,
          decidedAt: listing.decisionDecidedAt
        }
      });
    } catch (error) {
      logger.error('Failed to get decision status', error);
      next(error);
    }
  };
}
