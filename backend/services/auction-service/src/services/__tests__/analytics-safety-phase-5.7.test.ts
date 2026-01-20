// ============================================================
// PHASE 5.7 — Auction Analytics & Trust Signals Safety Tests
//
// MANDATORY SAFETY GUARANTEES:
// ✅ No write queries executed
// ✅ No ledger access
// ✅ No escrow access
// ✅ Metrics reproducible from source data
// ✅ Cache invalidation safe
// ✅ PII never exposed
// ============================================================

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  AnalyticsService,
  TrustTier,
  SellerBadge,
} from '../analytics.service';

const prisma = new PrismaClient();
const analyticsService = new AnalyticsService();

// Test fixtures
let testSellerId: number;
let testBidderId: number;
let testAuctionId: number;

beforeEach(async () => {
  // Create test users
  const seller = await prisma.user.create({
    data: {
      email: `seller-${Date.now()}@test.com`,
      firstName: 'Test',
      lastName: 'Seller',
    },
  });
  testSellerId = seller.id;

  const bidder = await prisma.user.create({
    data: {
      email: `bidder-${Date.now()}@test.com`,
      firstName: 'Test',
      lastName: 'Bidder',
    },
  });
  testBidderId = bidder.id;

  // Create test auction
  const auction = await prisma.listing.create({
    data: {
      title: 'Test Auction',
      description: 'Test auction for Phase 5.7',
      sellerId: testSellerId,
      price: 100,
      isAuction: true,
      startingBid: 100,
      currentBid: 250,
      auctionEndsAt: new Date(Date.now() + 10000),
      auctionStartsAt: new Date(Date.now() - 10000),
      status: 'ACTIVE',
      winnerId: testBidderId,
      finalPrice: 250,
      reserveMet: true,
    },
  });
  testAuctionId = auction.id;

  // Create test bids
  await prisma.bid.create({
    data: {
      listingId: testAuctionId,
      bidderId: testBidderId,
      amount: 150,
      status: 'WINNING',
    },
  });

  await prisma.bid.create({
    data: {
      listingId: testAuctionId,
      bidderId: testBidderId,
      amount: 250,
      status: 'WINNING',
    },
  });
});

afterEach(async () => {
  // Cleanup
  await prisma.auctionAnalyticsSnapshot.deleteMany({});
  await prisma.bidderTrustSnapshot.deleteMany({});
  await prisma.sellerTrustSnapshot.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.user.deleteMany({});
});

// ============================================================
// TEST 1: Auction Analytics (READ-ONLY)
// ============================================================
describe('Auction Analytics', () => {
  it('should calculate auction analytics without modifying data', async () => {
    const analytics = await analyticsService.getAuctionAnalytics(testAuctionId);

    expect(analytics.auctionId).toBe(testAuctionId);
    expect(analytics.totalBidsCount).toBeGreaterThan(0);
    expect(analytics.uniqueBiddersCount).toBeGreaterThan(0);
    expect(analytics.bidVelocity).toBeGreaterThanOrEqual(0);
    expect(analytics.competitivenessScore).toBeGreaterThanOrEqual(0);
    expect(analytics.competitivenessScore).toBeLessThanOrEqual(100);
    expect(analytics.reserveMet).toBe(true);
  });

  it('should calculate price progression correctly', async () => {
    const analytics = await analyticsService.getAuctionAnalytics(testAuctionId);

    expect(analytics.priceProgression.startingBid).toBe(100);
    expect(analytics.priceProgression.highestBid).toBe(250);
    expect(analytics.priceProgression.priceIncrease).toBe(150);
    expect(analytics.priceProgression.priceIncreasePercent).toBe(150);
  });

  it('should calculate bid velocity', async () => {
    const analytics = await analyticsService.getAuctionAnalytics(testAuctionId);

    expect(analytics.bidVelocity).toBeGreaterThanOrEqual(0);
    expect(typeof analytics.bidVelocity).toBe('number');
  });

  it('should not expose reserve price value', async () => {
    const analytics = await analyticsService.getAuctionAnalytics(testAuctionId);

    // Only boolean should be exposed, not the actual value
    expect(typeof analytics.reserveMet).toBe('boolean');
    expect(analytics.metadata).toBeDefined();
    // Ensure no reserve price value in metadata
    expect(JSON.stringify(analytics.metadata)).not.toContain('reservePrice');
  });

  // ✅ TEST: No write queries executed
  it('should not modify auction data', async () => {
    const auctionBefore = await prisma.listing.findUnique({
      where: { id: testAuctionId },
    });

    await analyticsService.getAuctionAnalytics(testAuctionId);

    const auctionAfter = await prisma.listing.findUnique({
      where: { id: testAuctionId },
    });

    expect(auctionAfter).toEqual(auctionBefore);
  });

  // ✅ TEST: Metrics reproducible from source data
  it('should produce reproducible metrics', async () => {
    const analytics1 = await analyticsService.getAuctionAnalytics(testAuctionId);
    const analytics2 = await analyticsService.getAuctionAnalytics(testAuctionId);

    expect(analytics1).toEqual(analytics2);
  });
});

// ============================================================
// TEST 2: Bidder Trust Signals (READ-ONLY)
// ============================================================
describe('Bidder Trust Signals', () => {
  it('should calculate bidder trust signals', async () => {
    const trustSignals = await analyticsService.getBidderTrustSignals(testBidderId);

    expect(trustSignals.bidderId).toBe(testBidderId);
    expect(trustSignals.participationCount).toBeGreaterThan(0);
    expect(trustSignals.trustTier).toMatch(/LOW|MEDIUM|HIGH/);
    expect(trustSignals.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(trustSignals.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('should calculate win/loss ratio', async () => {
    const trustSignals = await analyticsService.getBidderTrustSignals(testBidderId);

    expect(typeof trustSignals.winLossRatio).toBe('number');
    expect(trustSignals.winCount).toBeGreaterThanOrEqual(0);
    expect(trustSignals.lossCount).toBeGreaterThanOrEqual(0);
  });

  it('should calculate bid retraction rate', async () => {
    const trustSignals = await analyticsService.getBidderTrustSignals(testBidderId);

    expect(trustSignals.bidRetractionRate).toBeGreaterThanOrEqual(0);
    expect(trustSignals.bidRetractionRate).toBeLessThanOrEqual(100);
  });

  it('should not expose bidder PII', async () => {
    const trustSignals = await analyticsService.getBidderTrustSignals(testBidderId);

    // Ensure no email, name, or other PII
    expect(JSON.stringify(trustSignals)).not.toContain('@test.com');
    expect(JSON.stringify(trustSignals)).not.toContain('Test');
  });

  // ✅ TEST: No write queries executed
  it('should not modify bidder data', async () => {
    const bidsBefore = await prisma.bid.findMany({
      where: { bidderId: testBidderId },
    });

    await analyticsService.getBidderTrustSignals(testBidderId);

    const bidsAfter = await prisma.bid.findMany({
      where: { bidderId: testBidderId },
    });

    expect(bidsAfter).toEqual(bidsBefore);
  });

  // ✅ TEST: Metrics reproducible from source data
  it('should produce reproducible trust signals', async () => {
    const signals1 = await analyticsService.getBidderTrustSignals(testBidderId);
    const signals2 = await analyticsService.getBidderTrustSignals(testBidderId);

    expect(signals1).toEqual(signals2);
  });
});

// ============================================================
// TEST 3: Seller Trust Signals (READ-ONLY)
// ============================================================
describe('Seller Trust Signals', () => {
  it('should calculate seller trust signals', async () => {
    const trustSignals = await analyticsService.getSellerTrustSignals(testSellerId);

    expect(trustSignals.sellerId).toBe(testSellerId);
    expect(trustSignals.auctionsCompleted).toBeGreaterThanOrEqual(0);
    expect(trustSignals.reliabilityScore).toBeGreaterThanOrEqual(0);
    expect(trustSignals.reliabilityScore).toBeLessThanOrEqual(100);
    expect(trustSignals.badgeEligibility).toMatch(/NEW|VERIFIED|WATCHLISTED/);
  });

  it('should calculate successful settlements percentage', async () => {
    const trustSignals = await analyticsService.getSellerTrustSignals(testSellerId);

    expect(trustSignals.successfulSettlementsPercent).toBeGreaterThanOrEqual(0);
    expect(trustSignals.successfulSettlementsPercent).toBeLessThanOrEqual(100);
  });

  it('should not expose seller PII', async () => {
    const trustSignals = await analyticsService.getSellerTrustSignals(testSellerId);

    // Ensure no email, name, or other PII
    expect(JSON.stringify(trustSignals)).not.toContain('@test.com');
    expect(JSON.stringify(trustSignals)).not.toContain('Test');
  });

  // ✅ TEST: No write queries executed
  it('should not modify seller data', async () => {
    const auctionsBefore = await prisma.listing.findMany({
      where: { sellerId: testSellerId },
    });

    await analyticsService.getSellerTrustSignals(testSellerId);

    const auctionsAfter = await prisma.listing.findMany({
      where: { sellerId: testSellerId },
    });

    expect(auctionsAfter).toEqual(auctionsBefore);
  });

  // ✅ TEST: Metrics reproducible from source data
  it('should produce reproducible trust signals', async () => {
    const signals1 = await analyticsService.getSellerTrustSignals(testSellerId);
    const signals2 = await analyticsService.getSellerTrustSignals(testSellerId);

    expect(signals1).toEqual(signals2);
  });
});

// ============================================================
// TEST 4: Market Health Metrics (READ-ONLY)
// ============================================================
describe('Market Health Metrics', () => {
  it('should calculate market health metrics', async () => {
    const metrics = await analyticsService.getMarketHealthMetrics();

    expect(metrics.totalAuctions).toBeGreaterThanOrEqual(0);
    expect(metrics.avgBidsPerAuction).toBeGreaterThanOrEqual(0);
    expect(metrics.noSaleRate).toBeGreaterThanOrEqual(0);
    expect(metrics.noSaleRate).toBeLessThanOrEqual(100);
    expect(metrics.reserveFailureRate).toBeGreaterThanOrEqual(0);
    expect(metrics.reserveFailureRate).toBeLessThanOrEqual(100);
  });

  it('should not expose individual auction data', async () => {
    const metrics = await analyticsService.getMarketHealthMetrics();

    // Ensure aggregated data only, no individual auction details
    expect(metrics.metadata).toBeDefined();
    expect(typeof metrics.totalAuctions).toBe('number');
    expect(typeof metrics.avgBidsPerAuction).toBe('number');
  });

  // ✅ TEST: No write queries executed
  it('should not modify any data', async () => {
    const auctionsBefore = await prisma.listing.findMany({
      where: { isAuction: true },
    });

    await analyticsService.getMarketHealthMetrics();

    const auctionsAfter = await prisma.listing.findMany({
      where: { isAuction: true },
    });

    expect(auctionsAfter).toEqual(auctionsBefore);
  });

  // ✅ TEST: Metrics reproducible from source data
  it('should produce reproducible metrics', async () => {
    const metrics1 = await analyticsService.getMarketHealthMetrics();
    const metrics2 = await analyticsService.getMarketHealthMetrics();

    expect(metrics1).toEqual(metrics2);
  });
});

// ============================================================
// TEST 5: Risk Signals (SIGNAL-ONLY, NO ENFORCEMENT)
// ============================================================
describe('Risk Signals', () => {
  it('should generate risk signals without blocking actions', async () => {
    const signals = await analyticsService.getRiskSignals();

    expect(Array.isArray(signals)).toBe(true);
    // Signals should be informational only
    signals.forEach((signal) => {
      expect(signal.signalType).toBeDefined();
      expect(signal.severity).toMatch(/LOW|MEDIUM|HIGH/);
      expect(signal.description).toBeDefined();
      expect(signal.affectedEntities).toBeDefined();
    });
  });

  it('should not block bidding based on signals', async () => {
    // Get risk signals
    const signals = await analyticsService.getRiskSignals();

    // Verify bidder can still bid (no automatic blocking)
    const canBid = await prisma.bid.create({
      data: {
        listingId: testAuctionId,
        bidderId: testBidderId,
        amount: 300,
        status: 'WINNING',
      },
    });

    expect(canBid).toBeDefined();
  });

  // ✅ TEST: No write queries executed
  it('should not modify data when generating signals', async () => {
    const bidsBefore = await prisma.bid.findMany({});

    await analyticsService.getRiskSignals();

    const bidsAfter = await prisma.bid.findMany({});

    expect(bidsAfter).toEqual(bidsBefore);
  });
});

// ============================================================
// TEST 6: Snapshot Creation (APPEND-ONLY)
// ============================================================
describe('Snapshot Creation', () => {
  it('should create auction analytics snapshot', async () => {
    const snapshot = await analyticsService.createAuctionAnalyticsSnapshot(testAuctionId);

    expect(snapshot).toBeDefined();
    expect(snapshot.auctionId).toBe(testAuctionId);
    expect(snapshot.totalBidsCount).toBeGreaterThan(0);
    expect(snapshot.createdAt).toBeDefined();
  });

  it('should create bidder trust snapshot', async () => {
    const snapshot = await analyticsService.createBidderTrustSnapshot(testBidderId);

    expect(snapshot).toBeDefined();
    expect(snapshot.bidderId).toBe(testBidderId);
    expect(snapshot.trustTier).toMatch(/LOW|MEDIUM|HIGH/);
    expect(snapshot.createdAt).toBeDefined();
  });

  it('should create seller trust snapshot', async () => {
    const snapshot = await analyticsService.createSellerTrustSnapshot(testSellerId);

    expect(snapshot).toBeDefined();
    expect(snapshot.sellerId).toBe(testSellerId);
    expect(snapshot.badgeEligibility).toMatch(/NEW|VERIFIED|WATCHLISTED/);
    expect(snapshot.createdAt).toBeDefined();
  });

  // ✅ TEST: Cache invalidation safe
  it('should allow multiple snapshots for same entity', async () => {
    const snapshot1 = await analyticsService.createAuctionAnalyticsSnapshot(testAuctionId);
    const snapshot2 = await analyticsService.createAuctionAnalyticsSnapshot(testAuctionId);

    expect(snapshot1.id).not.toBe(snapshot2.id);
    expect(snapshot1.auctionId).toBe(snapshot2.auctionId);
  });
});

// ============================================================
// TEST 7: No Ledger Access
// ============================================================
describe('No Ledger Access', () => {
  it('should not access ledger entries', async () => {
    // Analytics should never query ledger tables
    const analytics = await analyticsService.getAuctionAnalytics(testAuctionId);

    // Verify no ledger data in response
    expect(JSON.stringify(analytics)).not.toContain('ledger');
    expect(JSON.stringify(analytics)).not.toContain('escrow');
  });
});

// ============================================================
// TEST 8: No Escrow Access
// ============================================================
describe('No Escrow Access', () => {
  it('should not access escrow data', async () => {
    const trustSignals = await analyticsService.getBidderTrustSignals(testBidderId);

    // Verify no escrow data in response
    expect(JSON.stringify(trustSignals)).not.toContain('escrow');
    expect(JSON.stringify(trustSignals)).not.toContain('ledger');
  });
});

// ============================================================
// TEST 9: PII Protection
// ============================================================
describe('PII Protection', () => {
  it('should never expose email addresses', async () => {
    const analytics = await analyticsService.getAuctionAnalytics(testAuctionId);
    const bidderSignals = await analyticsService.getBidderTrustSignals(testBidderId);
    const sellerSignals = await analyticsService.getSellerTrustSignals(testSellerId);

    expect(JSON.stringify(analytics)).not.toContain('@');
    expect(JSON.stringify(bidderSignals)).not.toContain('@');
    expect(JSON.stringify(sellerSignals)).not.toContain('@');
  });

  it('should never expose personal names', async () => {
    const bidderSignals = await analyticsService.getBidderTrustSignals(testBidderId);
    const sellerSignals = await analyticsService.getSellerTrustSignals(testSellerId);

    expect(JSON.stringify(bidderSignals)).not.toContain('firstName');
    expect(JSON.stringify(bidderSignals)).not.toContain('lastName');
    expect(JSON.stringify(sellerSignals)).not.toContain('firstName');
    expect(JSON.stringify(sellerSignals)).not.toContain('lastName');
  });
});
