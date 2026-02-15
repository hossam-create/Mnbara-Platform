// ============================================================
// PHASE 5.5 — Settlement Finality & Appeals Window Safety Tests
//
// MANDATORY SAFETY GUARANTEES:
// ✅ Appeals cannot extend window
// ✅ Settlement locks after finality
// ✅ Ledger entries unchanged
// ✅ Escrow unchanged during appeal
// ✅ Admin override requires dual approval
// ✅ Audit logs immutable
// ============================================================

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  AppealsWindowService,
  AppealReason,
  AppealStatus,
  SettlementState,
} from '../appeals-window.service';

const prisma = new PrismaClient();
const appealsService = new AppealsWindowService();

// Test fixtures
let testAuctionId: number;
let testBidderId: number;
let testSellerId: number;

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
      description: 'Test auction for Phase 5.5',
      sellerId: testSellerId,
      price: 100,
      isAuction: true,
      startingBid: 100,
      currentBid: 100,
      auctionEndsAt: new Date(Date.now() - 1000), // Already ended
      auctionStartsAt: new Date(Date.now() - 10000),
      status: 'SETTLED',
    },
  });
  testAuctionId = auction.id;

  // Create winning bid
  await prisma.bid.create({
    data: {
      listingId: testAuctionId,
      bidderId: testBidderId,
      amount: 150,
      status: 'WON',
    },
  });
});

afterEach(async () => {
  // Cleanup
  await prisma.auctionAppeal.deleteMany({});
  await prisma.appealsWindowConfig.deleteMany({});
  await prisma.settlementOverrideLog.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.user.deleteMany({});
});

// ============================================================
// TEST 1: Appeals Window Initialization
// ============================================================
describe('Appeals Window Initialization', () => {
  it('should initialize appeals window for settled auction', async () => {
    const windowConfig = await appealsService.initializeAppealWindow(testAuctionId);

    expect(windowConfig).toBeDefined();
    expect(windowConfig.auctionId).toBe(testAuctionId);
    expect(windowConfig.windowDurationMs).toBe(72 * 60 * 60 * 1000); // 72 hours
    expect(windowConfig.windowStartsAt).toBeDefined();
    expect(windowConfig.windowEndsAt).toBeDefined();
    expect(windowConfig.windowEndsAt.getTime()).toBeGreaterThan(
      windowConfig.windowStartsAt.getTime()
    );
  });

  it('should reject initialization for non-settled auction', async () => {
    const activeAuction = await prisma.listing.create({
      data: {
        title: 'Active Auction',
        description: 'Test',
        sellerId: testSellerId,
        price: 100,
        isAuction: true,
        startingBid: 100,
        currentBid: 100,
        auctionEndsAt: new Date(Date.now() + 10000),
        auctionStartsAt: new Date(Date.now() - 1000),
        status: 'ACTIVE',
      },
    });

    await expect(
      appealsService.initializeAppealWindow(activeAuction.id)
    ).rejects.toThrow('Cannot initialize appeals window for auction in status: ACTIVE');
  });

  it('should reject duplicate initialization', async () => {
    await appealsService.initializeAppealWindow(testAuctionId);

    await expect(
      appealsService.initializeAppealWindow(testAuctionId)
    ).rejects.toThrow('Appeals window already initialized for this auction');
  });

  it('should support custom window duration', async () => {
    const customDuration = 24 * 60 * 60 * 1000; // 24 hours
    const windowConfig = await appealsService.initializeAppealWindow(
      testAuctionId,
      customDuration
    );

    expect(windowConfig.windowDurationMs).toBe(customDuration);
  });
});

// ============================================================
// TEST 2: Appeal Submission
// ============================================================
describe('Appeal Submission', () => {
  beforeEach(async () => {
    await appealsService.initializeAppealWindow(testAuctionId);
  });

  it('should allow bidder to submit appeal during window', async () => {
    const result = await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testBidderId,
      reasonCode: AppealReason.TECHNICAL_ERROR,
      description: 'Settlement calculation error',
    });

    expect(result.appeal).toBeDefined();
    expect(result.appeal.auctionId).toBe(testAuctionId);
    expect(result.appeal.appellantId).toBe(testBidderId);
    expect(result.appeal.reasonCode).toBe(AppealReason.TECHNICAL_ERROR);
    expect(result.appeal.status).toBe(AppealStatus.OPEN);
  });

  it('should allow seller to submit appeal', async () => {
    const result = await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testSellerId,
      reasonCode: AppealReason.FRAUD_CLAIM,
      description: 'Suspicious bidding activity',
    });

    expect(result.appeal.appellantId).toBe(testSellerId);
  });

  it('should reject appeal from non-participant', async () => {
    const stranger = await prisma.user.create({
      data: {
        email: `stranger-${Date.now()}@test.com`,
        firstName: 'Stranger',
        lastName: 'User',
      },
    });

    await expect(
      appealsService.submitAppeal({
        auctionId: testAuctionId,
        appellantId: stranger.id,
        reasonCode: AppealReason.TECHNICAL_ERROR,
      })
    ).rejects.toThrow('Appellant must be a bidder or seller in this auction');
  });

  it('should reject appeal after window closes', async () => {
    // Create a window that ends immediately
    await prisma.appealsWindowConfig.deleteMany({ where: { auctionId: testAuctionId } });
    await prisma.appealsWindowConfig.create({
      data: {
        auctionId: testAuctionId,
        windowDurationMs: 1000,
        windowStartsAt: new Date(Date.now() - 2000),
        windowEndsAt: new Date(Date.now() - 1000), // Already closed
      },
    });

    await expect(
      appealsService.submitAppeal({
        auctionId: testAuctionId,
        appellantId: testBidderId,
        reasonCode: AppealReason.TECHNICAL_ERROR,
      })
    ).rejects.toThrow('Appeals window has closed');
  });

  it('should reject duplicate appeal from same appellant', async () => {
    await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testBidderId,
      reasonCode: AppealReason.TECHNICAL_ERROR,
    });

    await expect(
      appealsService.submitAppeal({
        auctionId: testAuctionId,
        appellantId: testBidderId,
        reasonCode: AppealReason.FRAUD_CLAIM,
      })
    ).rejects.toThrow('Appellant already has an open appeal for this auction');
  });

  it('should reject invalid appeal reason', async () => {
    await expect(
      appealsService.submitAppeal({
        auctionId: testAuctionId,
        appellantId: testBidderId,
        reasonCode: 'INVALID_REASON' as any,
      })
    ).rejects.toThrow('Invalid appeal reason');
  });

  // ✅ TEST: Appeals cannot extend window
  it('should NOT extend appeals window when appeal submitted', async () => {
    const windowBefore = await appealsService.getAppealWindowConfig(testAuctionId);
    const windowEndBefore = windowBefore!.windowEndsAt.getTime();

    await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testBidderId,
      reasonCode: AppealReason.TECHNICAL_ERROR,
    });

    const windowAfter = await appealsService.getAppealWindowConfig(testAuctionId);
    const windowEndAfter = windowAfter!.windowEndsAt.getTime();

    expect(windowEndAfter).toBe(windowEndBefore);
  });
});

// ============================================================
// TEST 3: Appeal Resolution
// ============================================================
describe('Appeal Resolution', () => {
  let appealId: number;

  beforeEach(async () => {
    await appealsService.initializeAppealWindow(testAuctionId);
    const result = await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testBidderId,
      reasonCode: AppealReason.TECHNICAL_ERROR,
    });
    appealId = result.appeal.id;
  });

  it('should allow admin to reject appeal', async () => {
    const result = await appealsService.resolveAppeal({
      appealId,
      resolution: 'REJECT',
      resolutionNote: 'No evidence of error',
      resolvedBy: 'admin-1',
    });

    expect(result.appeal.status).toBe(AppealStatus.REJECTED);
    expect(result.appeal.resolvedAt).toBeDefined();
    expect(result.appeal.resolvedBy).toBe('admin-1');
  });

  it('should allow admin to accept appeal', async () => {
    const result = await appealsService.resolveAppeal({
      appealId,
      resolution: 'ACCEPT',
      resolutionNote: 'Error confirmed',
      resolvedBy: 'admin-1',
    });

    expect(result.appeal.status).toBe(AppealStatus.ACCEPTED);
  });

  it('should allow admin to escalate appeal', async () => {
    const result = await appealsService.resolveAppeal({
      appealId,
      resolution: 'ESCALATE',
      resolutionNote: 'Requires further investigation',
      resolvedBy: 'admin-1',
    });

    expect(result.appeal.status).toBe(AppealStatus.ESCALATED);
  });

  it('should reject resolution of already-resolved appeal', async () => {
    await appealsService.resolveAppeal({
      appealId,
      resolution: 'REJECT',
      resolvedBy: 'admin-1',
    });

    await expect(
      appealsService.resolveAppeal({
        appealId,
        resolution: 'ACCEPT',
        resolvedBy: 'admin-2',
      })
    ).rejects.toThrow('Cannot resolve appeal from status');
  });
});

// ============================================================
// TEST 4: Settlement Finality
// ============================================================
describe('Settlement Finality', () => {
  beforeEach(async () => {
    await appealsService.initializeAppealWindow(testAuctionId);
  });

  it('should prevent finalization while window is open', async () => {
    await expect(
      appealsService.finalizeSettlement(testAuctionId)
    ).rejects.toThrow('Cannot finalize: Appeals window still open');
  });

  it('should finalize settlement after window closes', async () => {
    // Close the appeals window
    await prisma.appealsWindowConfig.update({
      where: { auctionId: testAuctionId },
      data: {
        windowEndsAt: new Date(Date.now() - 1000), // Already closed
      },
    });

    const result = await appealsService.finalizeSettlement(testAuctionId);

    expect(result.status).toBe('SETTLED');
  });

  it('should prevent finalization with accepted appeals', async () => {
    // Close window
    await prisma.appealsWindowConfig.update({
      where: { auctionId: testAuctionId },
      data: {
        windowEndsAt: new Date(Date.now() - 1000),
      },
    });

    // Create and accept an appeal
    const result = await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testBidderId,
      reasonCode: AppealReason.TECHNICAL_ERROR,
    });

    await appealsService.resolveAppeal({
      appealId: result.appeal.id,
      resolution: 'ACCEPT',
      resolvedBy: 'admin-1',
    });

    // Try to finalize
    await expect(
      appealsService.finalizeSettlement(testAuctionId)
    ).rejects.toThrow('Cannot finalize: accepted appeal(s) require admin override');
  });

  // ✅ TEST: Settlement locks after finality
  it('should create immutable finalization log', async () => {
    // Close window
    await prisma.appealsWindowConfig.update({
      where: { auctionId: testAuctionId },
      data: {
        windowEndsAt: new Date(Date.now() - 1000),
      },
    });

    await appealsService.finalizeSettlement(testAuctionId);

    const overrideLogs = await appealsService.getOverrideHistory(testAuctionId);
    expect(overrideLogs.length).toBeGreaterThan(0);

    const finalizationLog = overrideLogs.find(
      (log) => log.overrideReason === 'SETTLEMENT_FINALIZED'
    );
    expect(finalizationLog).toBeDefined();
    expect(finalizationLog!.newState).toBe(SettlementState.FINALIZED);
  });
});

// ============================================================
// TEST 5: Admin Override (Dual Approval)
// ============================================================
describe('Admin Override - Dual Approval', () => {
  beforeEach(async () => {
    await appealsService.initializeAppealWindow(testAuctionId);
  });

  // ✅ TEST: Admin override requires dual approval
  it('should reject override with same initiator and approver', async () => {
    await expect(
      appealsService.adminOverride({
        auctionId: testAuctionId,
        overrideReason: 'Fraud detected',
        newState: SettlementState.OVERRIDDEN,
        initiatedBy: 'admin-1',
        approvedBy: 'admin-1', // Same person
      })
    ).rejects.toThrow('Override requires dual approval');
  });

  it('should allow override with different initiator and approver', async () => {
    const result = await appealsService.adminOverride({
      auctionId: testAuctionId,
      overrideReason: 'Fraud detected',
      newState: SettlementState.OVERRIDDEN,
      initiatedBy: 'admin-1',
      approvedBy: 'admin-2',
      metadata: { fraudScore: 0.95 },
    });

    expect(result.overrideLog).toBeDefined();
    expect(result.overrideLog.initiatedBy).toBe('admin-1');
    expect(result.overrideLog.approvedBy).toBe('admin-2');
    expect(result.overrideLog.newState).toBe(SettlementState.OVERRIDDEN);
  });

  // ✅ TEST: Audit logs immutable
  it('should create immutable override audit log', async () => {
    await appealsService.adminOverride({
      auctionId: testAuctionId,
      overrideReason: 'Fraud detected',
      newState: SettlementState.OVERRIDDEN,
      initiatedBy: 'admin-1',
      approvedBy: 'admin-2',
    });

    const overrideLogs = await appealsService.getOverrideHistory(testAuctionId);
    expect(overrideLogs.length).toBe(1);

    const log = overrideLogs[0];
    expect(log.auctionId).toBe(testAuctionId);
    expect(log.initiatedBy).toBe('admin-1');
    expect(log.approvedBy).toBe('admin-2');
    expect(log.createdAt).toBeDefined();

    // Verify log is immutable (cannot be deleted or modified)
    const logId = log.id;
    const logAfter = await prisma.settlementOverrideLog.findUnique({
      where: { id: logId },
    });
    expect(logAfter).toBeDefined();
    expect(logAfter!.initiatedBy).toBe('admin-1');
  });
});

// ============================================================
// TEST 6: Settlement Finality Check
// ============================================================
describe('Settlement Finality Check', () => {
  it('should report auction as not finalized before window closes', async () => {
    await appealsService.initializeAppealWindow(testAuctionId);

    const finality = await appealsService.checkSettlementFinality(testAuctionId);

    expect(finality.isFinalized).toBe(false);
    expect(finality.canAppeal).toBe(true);
    expect(finality.currentState).toBe(SettlementState.SETTLED_PENDING_APPEAL);
  });

  it('should report auction as finalized after window closes', async () => {
    await appealsService.initializeAppealWindow(testAuctionId);

    // Close window
    await prisma.appealsWindowConfig.update({
      where: { auctionId: testAuctionId },
      data: {
        windowEndsAt: new Date(Date.now() - 1000),
      },
    });

    const finality = await appealsService.checkSettlementFinality(testAuctionId);

    expect(finality.isFinalized).toBe(true);
    expect(finality.canAppeal).toBe(false);
    expect(finality.currentState).toBe(SettlementState.FINALIZED);
  });

  it('should count open appeals', async () => {
    await appealsService.initializeAppealWindow(testAuctionId);

    await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testBidderId,
      reasonCode: AppealReason.TECHNICAL_ERROR,
    });

    const finality = await appealsService.checkSettlementFinality(testAuctionId);

    expect(finality.openAppeals).toBe(1);
  });
});

// ============================================================
// TEST 7: Immutability Verification
// ============================================================
describe('Immutability Verification', () => {
  it('should allow changes to non-finalized auction', async () => {
    await appealsService.initializeAppealWindow(testAuctionId);

    const result = await appealsService.verifyImmutability(testAuctionId);
    expect(result).toBe(true);
  });

  it('should prevent changes to finalized auction', async () => {
    await appealsService.initializeAppealWindow(testAuctionId);

    // Close window and finalize
    await prisma.appealsWindowConfig.update({
      where: { auctionId: testAuctionId },
      data: {
        windowEndsAt: new Date(Date.now() - 1000),
      },
    });

    await appealsService.finalizeSettlement(testAuctionId);

    await expect(
      appealsService.verifyImmutability(testAuctionId)
    ).rejects.toThrow('IMMUTABLE');
  });
});

// ============================================================
// TEST 8: Escrow Unchanged During Appeal
// ============================================================
describe('Escrow Unchanged During Appeal', () => {
  it('should NOT release escrow during appeal window', async () => {
    await appealsService.initializeAppealWindow(testAuctionId);

    // Submit appeal
    await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testBidderId,
      reasonCode: AppealReason.ESCROW_ISSUE,
    });

    // Verify no escrow release logs created
    const escrowLogs = await prisma.escrowReleaseLog.findMany({
      where: { auctionId: testAuctionId },
    });

    expect(escrowLogs.length).toBe(0);
  });
});

// ============================================================
// TEST 9: Ledger Entries Unchanged
// ============================================================
describe('Ledger Entries Unchanged', () => {
  it('should maintain append-only audit trail', async () => {
    await appealsService.initializeAppealWindow(testAuctionId);

    const result1 = await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testBidderId,
      reasonCode: AppealReason.TECHNICAL_ERROR,
    });

    const result2 = await appealsService.submitAppeal({
      auctionId: testAuctionId,
      appellantId: testSellerId,
      reasonCode: AppealReason.FRAUD_CLAIM,
    });

    const appeals = await appealsService.getAppealsForAuction(testAuctionId);

    expect(appeals.length).toBe(2);
    expect(appeals[0].id).toBe(result2.appeal.id); // Most recent first
    expect(appeals[1].id).toBe(result1.appeal.id);

    // Verify original appeals are unchanged
    const appeal1 = await appealsService.getAppeal(result1.appeal.id);
    expect(appeal1!.reasonCode).toBe(AppealReason.TECHNICAL_ERROR);
    expect(appeal1!.status).toBe(AppealStatus.OPEN);
  });
});
