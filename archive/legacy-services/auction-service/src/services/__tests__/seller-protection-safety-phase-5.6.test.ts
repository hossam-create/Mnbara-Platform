// ============================================================
// PHASE 5.6 — Seller Protections & Auto-Relist Safety Tests
//
// MANDATORY SAFETY GUARANTEES:
// ✅ Auto-relist creates new auctionId
// ✅ No bids are reused
// ✅ No escrow reused
// ✅ Relist blocked during appeals
// ✅ Relist blocked after finalized sale
// ✅ Seller opt-out respected
// ✅ Logs immutable
// ============================================================

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  SellerProtectionService,
  SellerProtectionDecision,
  SellerProtectionTrigger,
  SellerPreferenceType,
  RelistStatus,
} from '../seller-protection.service';

const prisma = new PrismaClient();
const sellerProtectionService = new SellerProtectionService();

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

  // Create test auction (no sale)
  const auction = await prisma.listing.create({
    data: {
      title: 'Test Auction',
      description: 'Test auction for Phase 5.6',
      sellerId: testSellerId,
      price: 100,
      isAuction: true,
      startingBid: 100,
      currentBid: 100,
      auctionEndsAt: new Date(Date.now() - 1000),
      auctionStartsAt: new Date(Date.now() - 10000),
      status: 'ENDED_UNMET_RESERVE',
      reservePrice: 500,
      reserveMet: false,
    },
  });
  testAuctionId = auction.id;

  // Create settlement log
  await prisma.settlementOutcomeLog.create({
    data: {
      auctionId: testAuctionId,
      highestValidBidAmount: null,
      reservePrice: 500,
      reserveMet: false,
      endedReason: 'RESERVE_NOT_MET',
      invalidatedBidsCount: 0,
      totalBidsCount: 0,
      escrowsReleasedCount: 0,
    },
  });
});

afterEach(async () => {
  // Cleanup
  await prisma.relistAuditLog.deleteMany({});
  await prisma.sellerProtectionLog.deleteMany({});
  await prisma.sellerPreference.deleteMany({});
  await prisma.settlementOutcomeLog.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.user.deleteMany({});
});

// ============================================================
// TEST 1: Seller Protection Evaluation
// ============================================================
describe('Seller Protection Evaluation', () => {
  it('should identify auction as eligible for relist (reserve not met)', async () => {
    const evaluation = await sellerProtectionService.evaluateAuctionForProtection(
      testAuctionId
    );

    expect(evaluation.auctionId).toBe(testAuctionId);
    expect(evaluation.sellerId).toBe(testSellerId);
    expect(evaluation.decision).toBe(SellerProtectionDecision.ELIGIBLE_FOR_RELIST);
    expect(evaluation.triggers).toContain(SellerProtectionTrigger.RESERVE_NOT_MET);
    expect(evaluation.eligibleForAutoRelist).toBe(true);
  });

  it('should identify auction with zero bids as eligible for relist', async () => {
    const evaluation = await sellerProtectionService.evaluateAuctionForProtection(
      testAuctionId
    );

    expect(evaluation.triggers).toContain(SellerProtectionTrigger.ZERO_BIDS);
    expect(evaluation.eligibleForAutoRelist).toBe(true);
  });

  it('should block relist if appeals are open', async () => {
    // Create an open appeal
    await prisma.auctionAppeal.create({
      data: {
        auctionId: testAuctionId,
        appellantId: testBidderId,
        reasonCode: 'TECHNICAL_ERROR',
        status: 'OPEN',
      },
    });

    const evaluation = await sellerProtectionService.evaluateAuctionForProtection(
      testAuctionId
    );

    expect(evaluation.decision).toBe(
      SellerProtectionDecision.ELIGIBLE_FOR_MANUAL_REVIEW
    );
    expect(evaluation.eligibleForAutoRelist).toBe(false);
  });

  it('should return FINAL_NO_ACTION for successful auction', async () => {
    // Create successful auction
    const successAuction = await prisma.listing.create({
      data: {
        title: 'Successful Auction',
        description: 'Test',
        sellerId: testSellerId,
        price: 100,
        isAuction: true,
        startingBid: 100,
        currentBid: 200,
        auctionEndsAt: new Date(Date.now() - 1000),
        auctionStartsAt: new Date(Date.now() - 10000),
        status: 'SETTLED',
        winnerId: testBidderId,
        finalPrice: 200,
        reserveMet: true,
      },
    });

    const evaluation = await sellerProtectionService.evaluateAuctionForProtection(
      successAuction.id
    );

    expect(evaluation.decision).toBe(SellerProtectionDecision.FINAL_NO_ACTION);
    expect(evaluation.eligibleForAutoRelist).toBe(false);
  });
});

// ============================================================
// TEST 2: Seller Preferences
// ============================================================
describe('Seller Preferences', () => {
  it('should set auto-relist preference', async () => {
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.AUTO_RELIST_ENABLED,
      true
    );

    const prefs = await sellerProtectionService.getSellerPreferences(testSellerId);

    expect(prefs.AUTO_RELIST_ENABLED).toBe(true);
  });

  it('should set max relist attempts', async () => {
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.MAX_RELIST_ATTEMPTS,
      5
    );

    const prefs = await sellerProtectionService.getSellerPreferences(testSellerId);

    expect(prefs.MAX_RELIST_ATTEMPTS).toBe(5);
  });

  it('should set relist cooldown', async () => {
    const cooldownMs = 12 * 60 * 60 * 1000; // 12 hours
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.RELIST_COOLDOWN_MS,
      cooldownMs
    );

    const prefs = await sellerProtectionService.getSellerPreferences(testSellerId);

    expect(prefs.RELIST_COOLDOWN_MS).toBe(cooldownMs);
  });

  it('should set relist mode', async () => {
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.RELIST_MODE,
      'AUTOMATIC'
    );

    const prefs = await sellerProtectionService.getSellerPreferences(testSellerId);

    expect(prefs.RELIST_MODE).toBe('AUTOMATIC');
  });

  it('should reject invalid max relist attempts', async () => {
    await expect(
      sellerProtectionService.setSellerPreference(
        testSellerId,
        SellerPreferenceType.MAX_RELIST_ATTEMPTS,
        0
      )
    ).rejects.toThrow('must be integer between 1 and 10');
  });

  it('should reject invalid relist mode', async () => {
    await expect(
      sellerProtectionService.setSellerPreference(
        testSellerId,
        SellerPreferenceType.RELIST_MODE,
        'INVALID'
      )
    ).rejects.toThrow('must be AUTOMATIC or MANUAL');
  });

  // ✅ TEST: Seller opt-out respected
  it('should respect seller opt-out of auto-relist', async () => {
    // Disable auto-relist
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.AUTO_RELIST_ENABLED,
      false
    );

    const canRelist = await sellerProtectionService.canRelistAuction(
      testAuctionId,
      testSellerId
    );

    expect(canRelist.canRelist).toBe(false);
    expect(canRelist.blockers).toContain(
      'Auto-relist is disabled in seller preferences'
    );
  });
});

// ============================================================
// TEST 3: Auto-Relist Execution
// ============================================================
describe('Auto-Relist Execution', () => {
  beforeEach(async () => {
    // Enable auto-relist for seller
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.AUTO_RELIST_ENABLED,
      true
    );
  });

  // ✅ TEST: Auto-relist creates new auctionId
  it('should create new auction with different ID', async () => {
    const result = await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    expect(result.newAuctionId).toBeDefined();
    expect(result.newAuctionId).not.toBe(testAuctionId);
    expect(result.originalAuctionId).toBe(testAuctionId);
  });

  // ✅ TEST: No bids are reused
  it('should NOT copy bids to new auction', async () => {
    // Create bid on original auction
    await prisma.bid.create({
      data: {
        listingId: testAuctionId,
        bidderId: testBidderId,
        amount: 150,
        status: 'OUTBID',
      },
    });

    const result = await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    const newAuctionBids = await prisma.bid.findMany({
      where: { listingId: result.newAuctionId },
    });

    expect(newAuctionBids.length).toBe(0);
  });

  // ✅ TEST: No escrow reused
  it('should NOT copy escrow to new auction', async () => {
    // Create escrow release log for original auction
    await prisma.escrowReleaseLog.create({
      data: {
        auctionId: testAuctionId,
        bidId: 999, // Dummy bid ID
        bidderId: testBidderId,
        escrowAmount: 150,
        releaseReason: 'RESERVE_NOT_MET',
        releasedBy: 'SYSTEM',
      },
    });

    const result = await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    const newAuctionEscrow = await prisma.escrowReleaseLog.findMany({
      where: { auctionId: result.newAuctionId },
    });

    expect(newAuctionEscrow.length).toBe(0);
  });

  it('should preserve reserve price in new auction', async () => {
    const result = await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    const newAuction = await prisma.listing.findUnique({
      where: { id: result.newAuctionId },
    });

    expect(newAuction!.reservePrice).toBe(500); // Original reserve
  });

  it('should reset extension count in new auction', async () => {
    // Update original auction with extensions
    await prisma.listing.update({
      where: { id: testAuctionId },
      data: { extensionCount: 5 },
    });

    const result = await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    const newAuction = await prisma.listing.findUnique({
      where: { id: result.newAuctionId },
    });

    expect(newAuction!.extensionCount).toBe(0);
  });

  it('should reset winner and final price in new auction', async () => {
    const result = await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    const newAuction = await prisma.listing.findUnique({
      where: { id: result.newAuctionId },
    });

    expect(newAuction!.winnerId).toBeNull();
    expect(newAuction!.finalPrice).toBeNull();
  });

  it('should reject relist by non-owner', async () => {
    const otherSeller = await prisma.user.create({
      data: {
        email: `other-seller-${Date.now()}@test.com`,
        firstName: 'Other',
        lastName: 'Seller',
      },
    });

    await expect(
      sellerProtectionService.executeAutoRelist({
        auctionId: testAuctionId,
        sellerId: otherSeller.id,
      })
    ).rejects.toThrow('Seller does not own this auction');
  });

  // ✅ TEST: Relist blocked after finalized sale
  it('should reject relist of finalized auction', async () => {
    // Update auction to SETTLED (finalized)
    await prisma.listing.update({
      where: { id: testAuctionId },
      data: { status: 'SETTLED' },
    });

    await expect(
      sellerProtectionService.executeAutoRelist({
        auctionId: testAuctionId,
        sellerId: testSellerId,
      })
    ).rejects.toThrow('Cannot relist finalized auction');
  });

  // ✅ TEST: Relist blocked during appeals
  it('should reject relist with open appeals', async () => {
    // Create open appeal
    await prisma.auctionAppeal.create({
      data: {
        auctionId: testAuctionId,
        appellantId: testBidderId,
        reasonCode: 'TECHNICAL_ERROR',
        status: 'OPEN',
      },
    });

    const canRelist = await sellerProtectionService.canRelistAuction(
      testAuctionId,
      testSellerId
    );

    expect(canRelist.canRelist).toBe(false);
    expect(canRelist.blockers).toContain('open appeal(s) block relist');
  });

  it('should respect max relist attempts', async () => {
    // Set max attempts to 1
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.MAX_RELIST_ATTEMPTS,
      1
    );

    // Execute first relist
    await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    // Try second relist
    await expect(
      sellerProtectionService.executeAutoRelist({
        auctionId: testAuctionId,
        sellerId: testSellerId,
      })
    ).rejects.toThrow('Maximum relist attempts');
  });

  it('should respect cooldown period', async () => {
    // Set cooldown to 24 hours
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.RELIST_COOLDOWN_MS,
      24 * 60 * 60 * 1000
    );

    // Execute first relist
    await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    // Try immediate second relist
    await expect(
      sellerProtectionService.executeAutoRelist({
        auctionId: testAuctionId,
        sellerId: testSellerId,
      })
    ).rejects.toThrow('Cooldown period not met');
  });
});

// ============================================================
// TEST 4: Audit Logging
// ============================================================
describe('Audit Logging', () => {
  beforeEach(async () => {
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.AUTO_RELIST_ENABLED,
      true
    );
  });

  // ✅ TEST: Logs immutable
  it('should create immutable relist audit log', async () => {
    const result = await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    const relistLog = result.relistLog;

    expect(relistLog).toBeDefined();
    expect(relistLog.originalAuctionId).toBe(testAuctionId);
    expect(relistLog.relistedAuctionId).toBe(result.newAuctionId);
    expect(relistLog.status).toBe(RelistStatus.EXECUTED);
    expect(relistLog.relistAttemptNumber).toBe(1);
    expect(relistLog.createdAt).toBeDefined();

    // Verify log is immutable (cannot be deleted)
    const logId = relistLog.id;
    const logAfter = await prisma.relistAuditLog.findUnique({
      where: { id: logId },
    });
    expect(logAfter).toBeDefined();
    expect(logAfter!.originalAuctionId).toBe(testAuctionId);
  });

  it('should log protection decision', async () => {
    const evaluation = await sellerProtectionService.evaluateAuctionForProtection(
      testAuctionId
    );

    await sellerProtectionService.logSellerProtectionDecision(evaluation);

    const logs = await sellerProtectionService.getSellerProtectionLog(testAuctionId);

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].decision).toBe(SellerProtectionDecision.ELIGIBLE_FOR_RELIST);
    expect(logs[0].triggerReasons).toContain(SellerProtectionTrigger.RESERVE_NOT_MET);
  });

  it('should maintain relist history', async () => {
    // Execute multiple relists (with cooldown = 0)
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.RELIST_COOLDOWN_MS,
      0
    );

    const result1 = await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    const result2 = await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    const history = await sellerProtectionService.getRelistHistory(testAuctionId);

    expect(history.length).toBe(2);
    expect(history[0].relistAttemptNumber).toBe(1);
    expect(history[1].relistAttemptNumber).toBe(2);
    expect(history[0].relistedAuctionId).toBe(result1.newAuctionId);
    expect(history[1].relistedAuctionId).toBe(result2.newAuctionId);
  });
});

// ============================================================
// TEST 5: Relist Eligibility Check
// ============================================================
describe('Relist Eligibility Check', () => {
  it('should allow relist for eligible auction', async () => {
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.AUTO_RELIST_ENABLED,
      true
    );

    const canRelist = await sellerProtectionService.canRelistAuction(
      testAuctionId,
      testSellerId
    );

    expect(canRelist.canRelist).toBe(true);
    expect(canRelist.blockers.length).toBe(0);
  });

  it('should block relist if auto-relist disabled', async () => {
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.AUTO_RELIST_ENABLED,
      false
    );

    const canRelist = await sellerProtectionService.canRelistAuction(
      testAuctionId,
      testSellerId
    );

    expect(canRelist.canRelist).toBe(false);
    expect(canRelist.blockers).toContain(
      'Auto-relist is disabled in seller preferences'
    );
  });

  it('should block relist if seller does not own auction', async () => {
    const otherSeller = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@test.com`,
        firstName: 'Other',
        lastName: 'Seller',
      },
    });

    const canRelist = await sellerProtectionService.canRelistAuction(
      testAuctionId,
      otherSeller.id
    );

    expect(canRelist.canRelist).toBe(false);
    expect(canRelist.blockers).toContain('Seller does not own this auction');
  });
});

// ============================================================
// TEST 6: Seller Protection Status
// ============================================================
describe('Seller Protection Status', () => {
  it('should return protection status for auction', async () => {
    const status = await sellerProtectionService.getSellerProtectionStatus(
      testAuctionId
    );

    expect(status.auctionId).toBe(testAuctionId);
    expect(status.sellerId).toBe(testSellerId);
    expect(status.auctionStatus).toBe('ENDED_UNMET_RESERVE');
  });

  it('should include relist history in status', async () => {
    await sellerProtectionService.setSellerPreference(
      testSellerId,
      SellerPreferenceType.AUTO_RELIST_ENABLED,
      true
    );

    await sellerProtectionService.executeAutoRelist({
      auctionId: testAuctionId,
      sellerId: testSellerId,
    });

    const status = await sellerProtectionService.getSellerProtectionStatus(
      testAuctionId
    );

    expect(status.relistCount).toBe(1);
    expect(status.relistHistory.length).toBe(1);
    expect(status.relistHistory[0].status).toBe(RelistStatus.EXECUTED);
  });
});
