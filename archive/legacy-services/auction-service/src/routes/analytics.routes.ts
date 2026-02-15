// ============================================================
// PHASE 5.7 — Analytics Routes (READ-ONLY)
// ============================================================

import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

// ============================================================
// PUBLIC ENDPOINTS
// ============================================================

// Get auction analytics
router.get('/auctions/:auctionId/analytics', analyticsController.getAuctionAnalytics);

// Get auction trust signals
router.get('/auctions/:auctionId/trust-signals', analyticsController.getAuctionTrustSignals);

// Get bidder trust signals
router.get('/bidders/:bidderId/trust', analyticsController.getBidderTrust);

// Get seller trust signals
router.get('/sellers/:sellerId/trust', analyticsController.getSellerTrust);

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

// Get market health metrics
router.get('/admin/market-health', analyticsController.getMarketHealth);

// Get risk signals
router.get('/admin/risk-signals', analyticsController.getRiskSignals);

export default router;
