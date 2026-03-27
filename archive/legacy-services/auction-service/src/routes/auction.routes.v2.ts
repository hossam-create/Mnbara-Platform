/**
 * PHASE 5.0 — AUCTION ROUTES
 * 
 * REST API routes for auction operations
 */

import { Router } from 'express';
import auctionController from '../controllers/auction.controller.v2';

const router = Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * GET /auctions
 * Get active auctions with filters
 */
router.get('/', (req, res, next) => {
  auctionController.getAuctions(req, res, next);
});

/**
 * GET /auctions/:id
 * Get auction details
 */
router.get('/:id', (req, res, next) => {
  auctionController.getAuction(req, res, next);
});

/**
 * GET /auctions/:id/bids
 * Get bid history
 */
router.get('/:id/bids', (req, res, next) => {
  auctionController.getBidHistory(req, res, next);
});

/**
 * GET /auctions/:id/extensions
 * Get extension history
 */
router.get('/:id/extensions', (req, res, next) => {
  auctionController.getExtensionHistory(req, res, next);
});

// ============================================================
// AUTHENTICATED ROUTES
// TODO: Add authentication middleware
// ============================================================

/**
 * POST /auctions
 * Create a new auction
 */
router.post('/', (req, res, next) => {
  // TODO: Add auth middleware
  auctionController.createAuction(req, res, next);
});

/**
 * POST /auctions/:id/publish
 * Publish auction (DRAFT → SCHEDULED)
 */
router.post('/:id/publish', (req, res, next) => {
  // TODO: Add auth middleware
  auctionController.publishAuction(req, res, next);
});

/**
 * POST /auctions/:id/bids
 * Place a bid
 */
router.post('/:id/bids', (req, res, next) => {
  // TODO: Add auth middleware
  auctionController.placeBid(req, res, next);
});

/**
 * POST /auctions/:id/cancel
 * Cancel auction
 */
router.post('/:id/cancel', (req, res, next) => {
  // TODO: Add auth middleware
  auctionController.cancelAuction(req, res, next);
});

// ============================================================
// CRON ROUTES (Internal only)
// TODO: Add internal service authentication
// ============================================================

/**
 * POST /auctions/cron/start
 * Start scheduled auctions
 */
router.post('/cron/start', (req, res, next) => {
  // TODO: Add internal auth
  auctionController.startScheduledAuctions(req, res, next);
});

/**
 * POST /auctions/cron/end
 * End expired auctions
 */
router.post('/cron/end', (req, res, next) => {
  // TODO: Add internal auth
  auctionController.endExpiredAuctions(req, res, next);
});

export default router;
