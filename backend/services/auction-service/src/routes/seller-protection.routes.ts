// ============================================================
// PHASE 5.6 — Seller Protection Routes
// ============================================================

import { Router } from 'express';
import * as sellerProtectionController from '../controllers/seller-protection.controller';

const router = Router();

// ============================================================
// SELLER ENDPOINTS
// ============================================================

// Evaluate auction for seller protection
router.get('/:auctionId/evaluate', sellerProtectionController.evaluateAuctionForProtection);

// Set seller preference
router.post('/preferences', sellerProtectionController.setSellerPreference);

// Get seller preferences
router.get('/preferences/:sellerId', sellerProtectionController.getSellerPreferences);

// Check relist eligibility
router.get('/:auctionId/can-relist/:sellerId', sellerProtectionController.canRelistAuction);

// Get relist history
router.get('/:auctionId/relist-history', sellerProtectionController.getRelistHistory);

// Get protection log
router.get('/:auctionId/log', sellerProtectionController.getSellerProtectionLog);

// Get protection status
router.get('/:auctionId/status', sellerProtectionController.getSellerProtectionStatus);

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

// Execute auto-relist (admin or seller)
router.post('/:auctionId/relist', sellerProtectionController.executeAutoRelist);

export default router;
