// ============================================================
// PHASE 5.7 — Analytics Controller (READ-ONLY)
// ============================================================

import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

const analyticsService = new AnalyticsService();

// ============================================================
// GET AUCTION ANALYTICS
// GET /api/v1/auctions/:auctionId/analytics
// ============================================================
export async function getAuctionAnalytics(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    const analytics = await analyticsService.getAuctionAnalytics(parseInt(auctionId));

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET AUCTION TRUST SIGNALS
// GET /api/v1/auctions/:auctionId/trust-signals
// ============================================================
export async function getAuctionTrustSignals(req: Request, res: Response) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'Missing auctionId' });
    }

    // Get auction with bidder trust signals
    const auction = await prisma.listing.findUnique({
      where: { id: parseInt(auctionId) },
      select: { winnerId: true },
    });

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    let bidderTrustSignals = null;
    if (auction.winnerId) {
      bidderTrustSignals = await analyticsService.getBidderTrustSignals(auction.winnerId);
    }

    return res.status(200).json({
      success: true,
      trustSignals: {
        winnerTrustSignals: bidderTrustSignals,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET BIDDER TRUST SIGNALS
// GET /api/v1/bidders/:bidderId/trust
// ============================================================
export async function getBidderTrust(req: Request, res: Response) {
  try {
    const { bidderId } = req.params;

    if (!bidderId) {
      return res.status(400).json({ error: 'Missing bidderId' });
    }

    const trustSignals = await analyticsService.getBidderTrustSignals(parseInt(bidderId));

    return res.status(200).json({
      success: true,
      trustSignals,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET SELLER TRUST SIGNALS
// GET /api/v1/sellers/:sellerId/trust
// ============================================================
export async function getSellerTrust(req: Request, res: Response) {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ error: 'Missing sellerId' });
    }

    const trustSignals = await analyticsService.getSellerTrustSignals(parseInt(sellerId));

    return res.status(200).json({
      success: true,
      trustSignals,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET MARKET HEALTH (ADMIN ONLY)
// GET /admin/analytics/market-health
// ============================================================
export async function getMarketHealth(req: Request, res: Response) {
  try {
    const metrics = await analyticsService.getMarketHealthMetrics();

    return res.status(200).json({
      success: true,
      metrics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// ============================================================
// GET RISK SIGNALS (ADMIN ONLY)
// GET /admin/analytics/risk-signals
// ============================================================
export async function getRiskSignals(req: Request, res: Response) {
  try {
    const signals = await analyticsService.getRiskSignals();

    return res.status(200).json({
      success: true,
      signals,
      count: signals.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
}

// Import Prisma for auction lookup
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
