// ============================================================
// PHASE 5.6 — Seller Protections & Auto-Relist Service
//
// CRITICAL RULES:
// ❌ DO NOT:
// - Modify or delete bids
// - Auto-insert bids
// - Change auction outcome post-finality
// - Release or re-hold escrow automatically
// - Create ledger entries
// - Trust frontend inputs
// - Restart auctions silently
// - Bypass reserve price logic (Phase 5.3)
//
// ✅ MUST:
// - Treat seller protection as POST-OUTCOME logic
// - Keep ALL actions auditable and append-only
// - Require explicit seller or admin intent
// - Keep buyer funds safe at all times
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Enums
export enum SellerProtectionDecision {
  ELIGIBLE_FOR_RELIST = 'ELIGIBLE_FOR_RELIST',
  ELIGIBLE_FOR_MANUAL_REVIEW = 'ELIGIBLE_FOR_MANUAL_REVIEW',
  FINAL_NO_ACTION = 'FINAL_NO_ACTION',
}

export enum SellerProtectionTrigger {
  NO_SALE = 'NO_SALE',
  RESERVE_NOT_MET = 'RESERVE_NOT_MET',
  ZERO_BIDS = 'ZERO_BIDS',
  WINNER_INVALIDATED = 'WINNER_INVALIDATED',
  PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',
  APPEAL_RESOLVED_AGAINST_BUYER = 'APPEAL_RESOLVED_AGAINST_BUYER',
}

export enum RelistStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  EXECUTED = 'EXECUTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum SellerPreferenceType {
  AUTO_RELIST_ENABLED = 'AUTO_RELIST_ENABLED',
  MAX_RELIST_ATTEMPTS = 'MAX_RELIST_ATTEMPTS',
  RELIST_COOLDOWN_MS = 'RELIST_COOLDOWN_MS',
  RELIST_MODE = 'RELIST_MODE', // 'AUTOMATIC' | 'MANUAL'
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  ENDED_UNMET_RESERVE = 'ENDED_UNMET_RESERVE',
  ENDED_AWAITING_SETTLEMENT = 'ENDED_AWAITING_SETTLEMENT',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
  DELETED = 'DELETED',
}

// Type for Prisma transaction client
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// ============================================================
// INTERFACES
// ============================================================

export interface SellerProtectionEvaluation {
  auctionId: number;
  sellerId: number;
  decision: SellerProtectionDecision;
  triggers: SellerProtectionTrigger[];
  eligibleForAutoRelist: boolean;
  reason: string;
  metadata?: Record<string, any>;
}

export interface AutoRelistRequest {
  auctionId: number;
  sellerId: number;
  approvedBy?: string; // Admin ID if manual approval
}

export interface SellerPreference {
  sellerId: number;
  preferenceType: SellerPreferenceType;
  value: string | number | boolean;
}

// ============================================================
// SELLER PROTECTION SERVICE
// ============================================================

export class SellerProtectionService {
  // Default seller preferences
  private static readonly DEFAULT_PREFERENCES = {
    AUTO_RELIST_ENABLED: false, // Opt-in only
    MAX_RELIST_ATTEMPTS: 3,
    RELIST_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 hours
    RELIST_MODE: 'MANUAL', // Default to manual
  };

  // ============================================================
  // EVALUATE AUCTION FOR SELLER PROTECTION
  // Called after auction settlement
  // ============================================================
  async evaluateAuctionForProtection(
    auctionId: number
  ): Promise<SellerProtectionEvaluation> {
    // 1. Get auction with settlement data
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          where: { status: { notIn: ['INVALIDATED', 'CANCELLED'] } },
        },
        settlementOutcomeLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        appeals: {
          where: { status: 'OPEN' },
        },
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    const triggers: SellerProtectionTrigger[] = [];
    let eligibleForAutoRelist = false;

    // 2. Evaluate triggers
    // Trigger 1: No sale (reserve not met or no bids)
    if (
      auction.status === ListingStatus.ENDED_UNMET_RESERVE ||
      auction.status === ListingStatus.ENDED_AWAITING_SETTLEMENT
    ) {
      triggers.push(SellerProtectionTrigger.NO_SALE);
      eligibleForAutoRelist = true;
    }

    // Trigger 2: Reserve not met
    const settlementLog = auction.settlementOutcomeLogs[0];
    if (settlementLog && !settlementLog.reserveMet) {
      triggers.push(SellerProtectionTrigger.RESERVE_NOT_MET);
      eligibleForAutoRelist = true;
    }

    // Trigger 3: Zero valid bids
    if (auction.bids.length === 0) {
      triggers.push(SellerProtectionTrigger.ZERO_BIDS);
      eligibleForAutoRelist = true;
    }

    // Trigger 4: Winner invalidated (Phase 5.2)
    if (auction.winnerId && auction.status === ListingStatus.SETTLED) {
      const winningBid = await prisma.bid.findFirst({
        where: {
          listingId: auctionId,
          bidderId: auction.winnerId,
        },
      });

      if (winningBid && winningBid.status === 'INVALIDATED') {
        triggers.push(SellerProtectionTrigger.WINNER_INVALIDATED);
        eligibleForAutoRelist = true;
      }
    }

    // Trigger 5: Open appeals (blocks relist)
    if (auction.appeals.length > 0) {
      // Appeals block relist
      eligibleForAutoRelist = false;
    }

    // 3. Determine decision
    let decision: SellerProtectionDecision;
    let reason: string;

    if (triggers.length === 0) {
      decision = SellerProtectionDecision.FINAL_NO_ACTION;
      reason = 'Auction settled successfully. No seller protection needed.';
    } else if (auction.appeals.length > 0) {
      decision = SellerProtectionDecision.ELIGIBLE_FOR_MANUAL_REVIEW;
      reason = 'Auction has open appeals. Manual review required before relist.';
    } else if (eligibleForAutoRelist) {
      decision = SellerProtectionDecision.ELIGIBLE_FOR_RELIST;
      reason = `Auction eligible for relist. Triggers: ${triggers.join(', ')}`;
    } else {
      decision = SellerProtectionDecision.ELIGIBLE_FOR_MANUAL_REVIEW;
      reason = 'Auction requires manual review for seller protection.';
    }

    return {
      auctionId,
      sellerId: auction.sellerId,
      decision,
      triggers,
      eligibleForAutoRelist,
      reason,
      metadata: {
        auctionStatus: auction.status,
        winnerId: auction.winnerId,
        finalPrice: auction.finalPrice?.toString(),
        bidCount: auction.bids.length,
        openAppeals: auction.appeals.length,
      },
    };
  }

  // ============================================================
  // SET SELLER PREFERENCE
  // Seller configures protection preferences
  // ============================================================
  async setSellerPreference(
    sellerId: number,
    preferenceType: SellerPreferenceType,
    value: string | number | boolean
  ): Promise<any> {
    // Validate preference type
    if (!Object.values(SellerPreferenceType).includes(preferenceType)) {
      throw new Error(`Invalid preference type: ${preferenceType}`);
    }

    // Validate values
    if (preferenceType === SellerPreferenceType.AUTO_RELIST_ENABLED) {
      if (typeof value !== 'boolean') {
        throw new Error('AUTO_RELIST_ENABLED must be boolean');
      }
    }

    if (preferenceType === SellerPreferenceType.MAX_RELIST_ATTEMPTS) {
      const numValue = Number(value);
      if (!Number.isInteger(numValue) || numValue < 1 || numValue > 10) {
        throw new Error('MAX_RELIST_ATTEMPTS must be integer between 1 and 10');
      }
    }

    if (preferenceType === SellerPreferenceType.RELIST_COOLDOWN_MS) {
      const numValue = Number(value);
      if (!Number.isFinite(numValue) || numValue < 0) {
        throw new Error('RELIST_COOLDOWN_MS must be non-negative number');
      }
    }

    if (preferenceType === SellerPreferenceType.RELIST_MODE) {
      if (!['AUTOMATIC', 'MANUAL'].includes(String(value))) {
        throw new Error('RELIST_MODE must be AUTOMATIC or MANUAL');
      }
    }

    // Upsert preference
    return prisma.sellerPreference.upsert({
      where: {
        sellerId_preferenceType: {
          sellerId,
          preferenceType,
        },
      },
      create: {
        sellerId,
        preferenceType,
        value: String(value),
      },
      update: {
        value: String(value),
      },
    });
  }

  // ============================================================
  // GET SELLER PREFERENCES
  // ============================================================
  async getSellerPreferences(sellerId: number): Promise<Record<string, any>> {
    const prefs = await prisma.sellerPreference.findMany({
      where: { sellerId },
    });

    const result: Record<string, any> = {
      ...SellerProtectionService.DEFAULT_PREFERENCES,
    };

    prefs.forEach((pref) => {
      if (pref.preferenceType === SellerPreferenceType.AUTO_RELIST_ENABLED) {
        result[pref.preferenceType] = pref.value === 'true';
      } else if (
        pref.preferenceType === SellerPreferenceType.MAX_RELIST_ATTEMPTS ||
        pref.preferenceType === SellerPreferenceType.RELIST_COOLDOWN_MS
      ) {
        result[pref.preferenceType] = Number(pref.value);
      } else {
        result[pref.preferenceType] = pref.value;
      }
    });

    return result;
  }

  // ============================================================
  // EXECUTE AUTO-RELIST
  // Creates new auction, preserves audit linkage
  // ❌ NEVER reuses bids, escrow, or settlement data
  // ============================================================
  async executeAutoRelist(params: AutoRelistRequest): Promise<any> {
    const { auctionId, sellerId, approvedBy } = params;

    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get original auction
      const originalAuction = await tx.listing.findUnique({
        where: { id: auctionId },
        include: {
          seller: true,
        },
      });

      if (!originalAuction) {
        throw new Error('Original auction not found');
      }

      // 2. Verify seller ownership
      if (originalAuction.sellerId !== sellerId) {
        throw new Error('Seller does not own this auction');
      }

      // 3. ❌ CRITICAL: Verify auction is NOT finalized
      if (originalAuction.status === ListingStatus.SETTLED) {
        throw new Error(
          'Cannot relist finalized auction. Settlement is immutable.'
        );
      }

      // 4. Get seller preferences
      const prefs = await this.getSellerPreferences(sellerId);

      // 5. Check relist attempt count
      const relistCount = await tx.relistAuditLog.count({
        where: {
          originalAuctionId: auctionId,
          status: RelistStatus.EXECUTED,
        },
      });

      if (relistCount >= prefs.MAX_RELIST_ATTEMPTS) {
        throw new Error(
          `Maximum relist attempts (${prefs.MAX_RELIST_ATTEMPTS}) reached`
        );
      }

      // 6. Check cooldown period
      const lastRelist = await tx.relistAuditLog.findFirst({
        where: {
          originalAuctionId: auctionId,
          status: RelistStatus.EXECUTED,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastRelist) {
        const timeSinceLastRelist = Date.now() - lastRelist.createdAt.getTime();
        if (timeSinceLastRelist < prefs.RELIST_COOLDOWN_MS) {
          throw new Error(
            `Cooldown period not met. Next relist available in ${Math.ceil(
              (prefs.RELIST_COOLDOWN_MS - timeSinceLastRelist) / 1000 / 60
            )} minutes`
          );
        }
      }

      // 7. ✅ Create NEW auction (NEVER reuse original)
      // Copy metadata ONLY, reset everything else
      const newAuction = await tx.listing.create({
        data: {
          title: originalAuction.title,
          description: originalAuction.description,
          sellerId: originalAuction.sellerId,
          price: originalAuction.startingBid || originalAuction.price,
          currency: originalAuction.currency,
          isAuction: true,
          startingBid: originalAuction.startingBid,
          reservePrice: originalAuction.reservePrice, // ✅ Preserve reserve
          buyNowPrice: originalAuction.buyNowPrice,
          currentBid: originalAuction.startingBid,
          auctionEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          auctionStartsAt: new Date(),
          originalEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          autoExtendEnabled: originalAuction.autoExtendEnabled,
          autoExtendThresholdMs: originalAuction.autoExtendThresholdMs,
          autoExtendDurationMs: originalAuction.autoExtendDurationMs,
          maxExtensions: originalAuction.maxExtensions,
          extensionCount: 0, // ✅ Reset
          minBidIncrement: originalAuction.minBidIncrement,
          winnerId: null, // ✅ Reset
          finalPrice: null, // ✅ Reset
          reservePriceEncrypted: originalAuction.reservePriceEncrypted,
          reservePriceIV: originalAuction.reservePriceIV,
          reserveMet: null, // ✅ Reset
          status: 'ACTIVE',
          isActive: true,
        },
      });

      // 8. Create relist audit log (APPEND-ONLY)
      const relistLog = await tx.relistAuditLog.create({
        data: {
          originalAuctionId: auctionId,
          relistedAuctionId: newAuction.id,
          sellerId,
          status: RelistStatus.EXECUTED,
          approvedBy: approvedBy || 'SYSTEM',
          relistAttemptNumber: relistCount + 1,
          metadata: {
            originalStatus: originalAuction.status,
            originalWinnerId: originalAuction.winnerId,
            originalFinalPrice: originalAuction.finalPrice?.toString(),
            newAuctionStartTime: newAuction.auctionStartsAt?.toISOString(),
            newAuctionEndTime: newAuction.auctionEndsAt?.toISOString(),
          },
        },
      });

      console.log(`[AUTO_RELIST] Auction ${auctionId} relisted as ${newAuction.id}:`, {
        originalStatus: originalAuction.status,
        newAuctionId: newAuction.id,
        relistAttempt: relistCount + 1,
        approvedBy,
      });

      return {
        originalAuctionId: auctionId,
        newAuctionId: newAuction.id,
        relistLog,
        newAuction,
      };
    });
  }

  // ============================================================
  // GET RELIST HISTORY
  // ============================================================
  async getRelistHistory(auctionId: number) {
    return prisma.relistAuditLog.findMany({
      where: { originalAuctionId: auctionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ============================================================
  // GET SELLER PROTECTION LOG
  // ============================================================
  async getSellerProtectionLog(auctionId: number) {
    return prisma.sellerProtectionLog.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // CREATE SELLER PROTECTION LOG ENTRY
  // Called after evaluation
  // ============================================================
  async logSellerProtectionDecision(
    evaluation: SellerProtectionEvaluation
  ): Promise<any> {
    return prisma.sellerProtectionLog.create({
      data: {
        auctionId: evaluation.auctionId,
        sellerId: evaluation.sellerId,
        decision: evaluation.decision,
        triggerReasons: evaluation.triggers,
        reason: evaluation.reason,
        metadata: evaluation.metadata,
      },
    });
  }

  // ============================================================
  // CHECK IF RELIST IS ALLOWED
  // Verify all conditions before relist
  // ============================================================
  async canRelistAuction(auctionId: number, sellerId: number): Promise<{
    canRelist: boolean;
    reason: string;
    blockers: string[];
  }> {
    const blockers: string[] = [];

    // 1. Get auction
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      include: {
        appeals: {
          where: { status: 'OPEN' },
        },
      },
    });

    if (!auction) {
      return {
        canRelist: false,
        reason: 'Auction not found',
        blockers: ['Auction not found'],
      };
    }

    // 2. Verify seller ownership
    if (auction.sellerId !== sellerId) {
      blockers.push('Seller does not own this auction');
    }

    // 3. Check if finalized
    if (auction.status === ListingStatus.SETTLED) {
      blockers.push('Auction is finalized. Settlement is immutable.');
    }

    // 4. Check for open appeals
    if (auction.appeals.length > 0) {
      blockers.push(`${auction.appeals.length} open appeal(s) block relist`);
    }

    // 5. Get seller preferences
    const prefs = await this.getSellerPreferences(sellerId);

    if (!prefs.AUTO_RELIST_ENABLED) {
      blockers.push('Auto-relist is disabled in seller preferences');
    }

    // 6. Check relist attempts
    const relistCount = await prisma.relistAuditLog.count({
      where: {
        originalAuctionId: auctionId,
        status: RelistStatus.EXECUTED,
      },
    });

    if (relistCount >= prefs.MAX_RELIST_ATTEMPTS) {
      blockers.push(
        `Maximum relist attempts (${prefs.MAX_RELIST_ATTEMPTS}) reached`
      );
    }

    // 7. Check cooldown
    const lastRelist = await prisma.relistAuditLog.findFirst({
      where: {
        originalAuctionId: auctionId,
        status: RelistStatus.EXECUTED,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastRelist) {
      const timeSinceLastRelist = Date.now() - lastRelist.createdAt.getTime();
      if (timeSinceLastRelist < prefs.RELIST_COOLDOWN_MS) {
        blockers.push(
          `Cooldown period not met. Next relist available in ${Math.ceil(
            (prefs.RELIST_COOLDOWN_MS - timeSinceLastRelist) / 1000 / 60
          )} minutes`
        );
      }
    }

    const canRelist = blockers.length === 0;
    const reason = canRelist
      ? 'Auction is eligible for relist'
      : `Cannot relist: ${blockers.join('; ')}`;

    return {
      canRelist,
      reason,
      blockers,
    };
  }

  // ============================================================
  // GET SELLER PROTECTION STATUS FOR AUCTION
  // ============================================================
  async getSellerProtectionStatus(auctionId: number): Promise<any> {
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      include: {
        protectionLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        relistLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    const latestLog = auction.protectionLogs[0];
    const relistHistory = auction.relistLogs;

    return {
      auctionId,
      sellerId: auction.sellerId,
      auctionStatus: auction.status,
      latestProtectionDecision: latestLog?.decision,
      latestProtectionReason: latestLog?.reason,
      relistCount: relistHistory.length,
      relistHistory: relistHistory.map((log) => ({
        originalAuctionId: log.originalAuctionId,
        relistedAuctionId: log.relistedAuctionId,
        status: log.status,
        attemptNumber: log.relistAttemptNumber,
        createdAt: log.createdAt,
      })),
    };
  }
}

// Export singleton instance
export const sellerProtectionService = new SellerProtectionService();
