// ============================================================
// PHASE 5.6 — Seller Protection Controller
// ============================================================

import { Request, Response } from 'express';
import {
  SellerProtectionService,
  SellerPreferenceType,
} from '../services/seller-protection.service';

const sellerProtectionService = new SellerProtectionService();

// ============================================================
// EVALUATE AUCTION FOR SELLER PROTECTION
// GET /seller-protection/:auctionId/evaluate
// ============================================================
export async function evaluateAuctionForProtection(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const evaluation = await sellerProtectionService.evaluateAuctionForProtection(
      parseInt(auctionId)
    );

    return res.status(200).json({
      success: true,
      evaluation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// SET SELLER PREFERENCE
// POST /seller-protection/preferences
// ============================================================
export async function setSellerPreference(req: Request, res: Response) {
  try {
    const { sellerId, preferenceType, value } = req.body;

    if (!sellerId || !preferenceType || value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: sellerId, preferenceType, value',
      });
    }

    const preference = await sellerProtectionService.setSellerPreference(
      sellerId,
      preferenceType,
      value
    );

    return res.status(201).json({
      success: true,
      preference,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET SELLER PREFERENCES
// GET /seller-protection/preferences/:sellerId
// ============================================================
export async function getSellerPreferences(req: Request, res: Response) {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ error: 'Missing sellerId' });
    }

    const preferences = await sellerProtectionService.getSellerPreferences(
      parseInt(sellerId)
    );

    return res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// EXECUTE AUTO-RELIST
// POST /seller-protection/:auctionId/relist
// ============================================================
export async function executeAutoRelist(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;
    const { sellerId, approvedBy } = req.body;

    if (!auctionId || !sellerId) {
      return res.status(400).json({
        error: 'Missing required fields: auctionId, sellerId',
      });
    }

    const result = await sellerProtectionService.executeAutoRelist({
      auctionId: parseInt(auctionId),
      sellerId,
      approvedBy,
    });

    return res.status(201).json({
      success: true,
      originalAuctionId: result.originalAuctionId,
      newAuctionId: result.newAuctionId,
      relistLog: result.relistLog,
      message: 'Auction relisted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// CHECK RELIST ELIGIBILITY
// GET /seller-protection/:auctionId/can-relist/:sellerId
// ============================================================
export async function canRelistAuction(req: Request, res: Response) {
  try {
    const { auctionId, sellerId } = req.params;

    if (!auctionId || !sellerId) {
      return res.status(400).json({
        error: 'Missing required fields: auctionId, sellerId',
      });
    }

    const result = await sellerProtectionService.canRelistAuction(
      parseInt(auctionId),
      parseInt(sellerId)
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET RELIST HISTORY
// GET /seller-protection/:auctionId/relist-history
// ============================================================
export async function getRelistHistory(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const history = await sellerProtectionService.getRelistHistory(
      parseInt(auctionId)
    );

    return res.status(200).json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET SELLER PROTECTION LOG
// GET /seller-protection/:auctionId/log
// ============================================================
export async function getSellerProtectionLog(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const log = await sellerProtectionService.getSellerProtectionLog(
      parseInt(auctionId)
    );

    return res.status(200).json({
      success: true,
      log,
      count: log.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET SELLER PROTECTION STATUS
// GET /seller-protection/:auctionId/status
// ============================================================
export async function getSellerProtectionStatus(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const status = await sellerProtectionService.getSellerProtectionStatus(
      parseInt(auctionId)
    );

    return res.status(200).json({
      success: true,
      status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}
