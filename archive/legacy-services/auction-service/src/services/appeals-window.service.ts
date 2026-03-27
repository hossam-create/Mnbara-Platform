// ============================================================
// PHASE 5.5 — Settlement Finality & Appeals Window Service
//
// CRITICAL RULES:
// ❌ DO NOT:
// - Reopen settled auctions automatically
// - Reverse ledger entries
// - Modify bids after auction end
// - Release escrow during appeals
// - Trust frontend timing
// - Allow infinite disputes
//
// ✅ MUST:
// - Enforce a finite appeals window
// - Lock settlement after finality
// - Log every appeal & decision
// - Require admin/system authority for overrides
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Enums (matching Prisma schema)
export enum AppealReason {
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  FRAUD_CLAIM = 'FRAUD_CLAIM',
  DISPUTE_UNRESOLVED = 'DISPUTE_UNRESOLVED',
  ESCROW_ISSUE = 'ESCROW_ISSUE',
  SETTLEMENT_ERROR = 'SETTLEMENT_ERROR',
  OTHER = 'OTHER',
}

export enum AppealStatus {
  OPEN = 'OPEN',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
  ESCALATED = 'ESCALATED',
}

export enum SettlementState {
  ENDED = 'ENDED',
  SETTLED_PENDING_APPEAL = 'SETTLED_PENDING_APPEAL',
  FINALIZED = 'FINALIZED',
  OVERRIDDEN = 'OVERRIDDEN',
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

// Valid appeal reasons (NO custom free-text allowed)
const VALID_APPEAL_REASONS = Object.values(AppealReason);

// ============================================================
// INTERFACES
// ============================================================

export interface CreateAppealParams {
  auctionId: number;
  appellantId: number;
  reasonCode: AppealReason;
  description?: string;
}

export interface ResolveAppealParams {
  appealId: number;
  resolution: 'REJECT' | 'ACCEPT' | 'ESCALATE';
  resolutionNote?: string;
  resolvedBy: string;
}

export interface AdminOverrideParams {
  auctionId: number;
  overrideReason: string;
  newState: SettlementState;
  initiatedBy: string;
  approvedBy: string;
  metadata?: Record<string, any>;
}

export interface AppealResult {
  appeal: any;
  auction: any;
  windowConfig: any;
}

export interface SettlementFinalityCheck {
  auctionId: number;
  currentState: SettlementState;
  isFinalized: boolean;
  canAppeal: boolean;
  appealWindowEndsAt?: Date;
  openAppeals: number;
  errors: string[];
}

// ============================================================
// APPEALS WINDOW SERVICE
// ============================================================

export class AppealsWindowService {
  // Default appeals window duration: 72 hours
  private static readonly DEFAULT_WINDOW_DURATION_MS = 72 * 60 * 60 * 1000;

  // ============================================================
  // INITIALIZE APPEALS WINDOW
  // Called immediately after settlement
  // ============================================================
  async initializeAppealWindow(
    auctionId: number,
    windowDurationMs: number = AppealsWindowService.DEFAULT_WINDOW_DURATION_MS
  ): Promise<any> {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get auction
      const auction = await tx.listing.findUnique({
        where: { id: auctionId },
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      // 2. Verify auction is in SETTLED state (not yet finalized)
      if (auction.status !== ListingStatus.SETTLED) {
        throw new Error(
          `Cannot initialize appeals window for auction in status: ${auction.status}. ` +
          `Auction must be SETTLED first.`
        );
      }

      // 3. Check if appeals window already exists
      const existingWindow = await tx.appealsWindowConfig.findUnique({
        where: { auctionId },
      });

      if (existingWindow) {
        throw new Error('Appeals window already initialized for this auction');
      }

      // 4. Calculate window boundaries
      const now = new Date();
      const windowEndsAt = new Date(now.getTime() + windowDurationMs);

      // 5. Create appeals window config (IMMUTABLE once created)
      const windowConfig = await tx.appealsWindowConfig.create({
        data: {
          auctionId,
          windowDurationMs,
          windowStartsAt: now,
          windowEndsAt,
        },
      });

      console.log(`[APPEALS_WINDOW] Initialized for auction ${auctionId}:`, {
        windowStartsAt: now.toISOString(),
        windowEndsAt: windowEndsAt.toISOString(),
        durationHours: windowDurationMs / (60 * 60 * 1000),
      });

      return windowConfig;
    });
  }

  // ============================================================
  // SUBMIT APPEAL
  // Bidders can submit appeals during the window
  // ============================================================
  async submitAppeal(params: CreateAppealParams): Promise<AppealResult> {
    const { auctionId, appellantId, reasonCode, description } = params;

    // Validate reason
    if (!VALID_APPEAL_REASONS.includes(reasonCode)) {
      throw new Error(
        `Invalid appeal reason. Must be one of: ${VALID_APPEAL_REASONS.join(', ')}`
      );
    }

    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get auction with appeals window
      const auction = await tx.listing.findUnique({
        where: { id: auctionId },
        include: {
          appealsWindowConfig: true,
        },
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      // 2. Verify auction is in SETTLED_PENDING_APPEAL state
      if (auction.status !== ListingStatus.SETTLED) {
        throw new Error(
          `Cannot submit appeal for auction in status: ${auction.status}. ` +
          `Auction must be SETTLED and within appeals window.`
        );
      }

      // 3. Get appeals window config
      const windowConfig = auction.appealsWindowConfig;
      if (!windowConfig) {
        throw new Error('Appeals window not initialized for this auction');
      }

      // 4. ❌ CRITICAL: Verify appeal window is still open
      const now = new Date();
      if (now > windowConfig.windowEndsAt) {
        throw new Error(
          `Appeals window has closed. Window ended at ${windowConfig.windowEndsAt.toISOString()}`
        );
      }

      // 5. Verify appellant is a valid participant (bidder or seller)
      const isParticipant = await tx.bid.findFirst({
        where: {
          listingId: auctionId,
          bidderId: appellantId,
        },
      });

      if (!isParticipant && auction.sellerId !== appellantId) {
        throw new Error('Appellant must be a bidder or seller in this auction');
      }

      // 6. Check for duplicate appeals from same appellant
      const existingAppeal = await tx.auctionAppeal.findFirst({
        where: {
          auctionId,
          appellantId,
          status: AppealStatus.OPEN,
        },
      });

      if (existingAppeal) {
        throw new Error('Appellant already has an open appeal for this auction');
      }

      // 7. Create appeal record (APPEND-ONLY)
      const appeal = await tx.auctionAppeal.create({
        data: {
          auctionId,
          appellantId,
          reasonCode,
          description,
          status: AppealStatus.OPEN,
        },
      });

      console.log(`[APPEAL_SUBMITTED] Auction ${auctionId}, Appellant ${appellantId}:`, {
        appealId: appeal.id,
        reason: reasonCode,
        windowEndsAt: windowConfig.windowEndsAt.toISOString(),
      });

      return {
        appeal,
        auction,
        windowConfig,
      };
    });
  }

  // ============================================================
  // RESOLVE APPEAL
  // Admin-only action to accept/reject/escalate appeals
  // ============================================================
  async resolveAppeal(params: ResolveAppealParams): Promise<AppealResult> {
    const { appealId, resolution, resolutionNote, resolvedBy } = params;

    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get appeal with auction
      const appeal = await tx.auctionAppeal.findUnique({
        where: { id: appealId },
        include: {
          auction: {
            include: {
              appealsWindowConfig: true,
            },
          },
        },
      });

      if (!appeal) {
        throw new Error('Appeal not found');
      }

      // 2. Verify appeal is OPEN
      if (appeal.status !== AppealStatus.OPEN) {
        throw new Error(`Cannot resolve appeal from status: ${appeal.status}`);
      }

      // 3. Verify auction is still in SETTLED state (not yet finalized)
      if (appeal.auction.status !== ListingStatus.SETTLED) {
        throw new Error(
          `Cannot resolve appeal for auction in status: ${appeal.auction.status}`
        );
      }

      // 4. Map resolution to appeal status
      let newStatus: AppealStatus;
      if (resolution === 'REJECT') {
        newStatus = AppealStatus.REJECTED;
      } else if (resolution === 'ACCEPT') {
        newStatus = AppealStatus.ACCEPTED;
      } else if (resolution === 'ESCALATE') {
        newStatus = AppealStatus.ESCALATED;
      } else {
        throw new Error(`Invalid resolution: ${resolution}`);
      }

      // 5. Update appeal (APPEND resolution, don't delete)
      const updatedAppeal = await tx.auctionAppeal.update({
        where: { id: appealId },
        data: {
          status: newStatus,
          resolvedAt: new Date(),
          resolvedBy,
          resolutionNote,
        },
      });

      console.log(`[APPEAL_RESOLVED] Appeal ${appealId}:`, {
        auctionId: appeal.auctionId,
        resolution: newStatus,
        resolvedBy,
      });

      return {
        appeal: updatedAppeal,
        auction: appeal.auction,
        windowConfig: appeal.auction.appealsWindowConfig,
      };
    });
  }

  // ============================================================
  // FINALIZE SETTLEMENT
  // Transition from SETTLED_PENDING_APPEAL -> FINALIZED
  // After this, NO changes allowed
  // ============================================================
  async finalizeSettlement(auctionId: number): Promise<any> {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get auction with appeals window and appeals
      const auction = await tx.listing.findUnique({
        where: { id: auctionId },
        include: {
          appealsWindowConfig: true,
          appeals: true,
        },
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      // 2. Verify auction is in SETTLED state
      if (auction.status !== ListingStatus.SETTLED) {
        throw new Error(
          `Cannot finalize auction in status: ${auction.status}. ` +
          `Auction must be SETTLED first.`
        );
      }

      // 3. Get appeals window
      const windowConfig = auction.appealsWindowConfig;
      if (!windowConfig) {
        throw new Error('Appeals window not initialized for this auction');
      }

      // 4. ❌ CRITICAL: Verify appeals window has closed
      const now = new Date();
      if (now < windowConfig.windowEndsAt) {
        throw new Error(
          `Cannot finalize: Appeals window still open until ${windowConfig.windowEndsAt.toISOString()}`
        );
      }

      // 5. Check for ACCEPTED appeals (must be escalated to override)
      const acceptedAppeals = auction.appeals.filter(
        (a) => a.status === AppealStatus.ACCEPTED
      );

      if (acceptedAppeals.length > 0) {
        throw new Error(
          `Cannot finalize: ${acceptedAppeals.length} accepted appeal(s) require admin override. ` +
          `Use adminOverride() instead.`
        );
      }

      // 6. ✅ FINALIZE: Mark auction as FINALIZED (IMMUTABLE)
      const finalizedAuction = await tx.listing.update({
        where: { id: auctionId },
        data: {
          status: ListingStatus.SETTLED, // Keep SETTLED but mark as finalized via log
        },
      });

      // 7. Create finalization log (APPEND-ONLY audit trail)
      await tx.settlementOverrideLog.create({
        data: {
          auctionId,
          overrideReason: 'SETTLEMENT_FINALIZED',
          previousState: SettlementState.SETTLED_PENDING_APPEAL,
          newState: SettlementState.FINALIZED,
          initiatedBy: 'SYSTEM',
          approvedBy: 'SYSTEM',
          metadata: {
            windowEndsAt: windowConfig.windowEndsAt.toISOString(),
            openAppeals: auction.appeals.filter((a) => a.status === AppealStatus.OPEN)
              .length,
            rejectedAppeals: auction.appeals.filter((a) => a.status === AppealStatus.REJECTED)
              .length,
          },
        },
      });

      console.log(`[SETTLEMENT_FINALIZED] Auction ${auctionId}:`, {
        finalizedAt: now.toISOString(),
        windowEndsAt: windowConfig.windowEndsAt.toISOString(),
      });

      return finalizedAuction;
    });
  }

  // ============================================================
  // ADMIN OVERRIDE
  // Requires dual approval + audit log
  // Can only override ACCEPTED appeals
  // ============================================================
  async adminOverride(params: AdminOverrideParams): Promise<any> {
    const { auctionId, overrideReason, newState, initiatedBy, approvedBy, metadata } =
      params;

    // Validate new state
    if (!Object.values(SettlementState).includes(newState)) {
      throw new Error(`Invalid settlement state: ${newState}`);
    }

    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get auction with appeals
      const auction = await tx.listing.findUnique({
        where: { id: auctionId },
        include: {
          appeals: true,
        },
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      // 2. Verify auction is in SETTLED state
      if (auction.status !== ListingStatus.SETTLED) {
        throw new Error(
          `Cannot override auction in status: ${auction.status}. ` +
          `Auction must be SETTLED first.`
        );
      }

      // 3. ❌ CRITICAL: Verify initiatedBy !== approvedBy (dual approval)
      if (initiatedBy === approvedBy) {
        throw new Error(
          'SECURITY: Override requires dual approval. Initiator and approver must be different.'
        );
      }

      // 4. Check for ACCEPTED appeals
      const acceptedAppeals = auction.appeals.filter(
        (a) => a.status === AppealStatus.ACCEPTED
      );

      if (acceptedAppeals.length === 0 && newState === SettlementState.OVERRIDDEN) {
        throw new Error(
          'Cannot override: No accepted appeals to override. ' +
          'Use finalizeSettlement() instead.'
        );
      }

      // 5. Create override log (APPEND-ONLY, immutable)
      const overrideLog = await tx.settlementOverrideLog.create({
        data: {
          auctionId,
          overrideReason,
          previousState: SettlementState.SETTLED_PENDING_APPEAL,
          newState,
          initiatedBy,
          approvedBy,
          metadata: {
            ...metadata,
            acceptedAppealsCount: acceptedAppeals.length,
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.log(`[ADMIN_OVERRIDE] Auction ${auctionId}:`, {
        overrideReason,
        newState,
        initiatedBy,
        approvedBy,
        acceptedAppealsCount: acceptedAppeals.length,
      });

      return {
        auction,
        overrideLog,
      };
    });
  }

  // ============================================================
  // CHECK SETTLEMENT FINALITY
  // Verify if auction is finalized and immutable
  // ============================================================
  async checkSettlementFinality(auctionId: number): Promise<SettlementFinalityCheck> {
    const errors: string[] = [];

    // 1. Get auction with appeals window and appeals
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      include: {
        appealsWindowConfig: true,
        appeals: true,
      },
    });

    if (!auction) {
      return {
        auctionId,
        currentState: SettlementState.ENDED,
        isFinalized: false,
        canAppeal: false,
        openAppeals: 0,
        errors: ['Auction not found'],
      };
    }

    // 2. Determine current settlement state
    let currentState = SettlementState.ENDED;
    let isFinalized = false;
    let canAppeal = false;
    let appealWindowEndsAt: Date | undefined;

    if (auction.status === ListingStatus.SETTLED) {
      const windowConfig = auction.appealsWindowConfig;

      if (!windowConfig) {
        // No appeals window = already finalized
        currentState = SettlementState.FINALIZED;
        isFinalized = true;
      } else {
        const now = new Date();
        appealWindowEndsAt = windowConfig.windowEndsAt;

        if (now < windowConfig.windowEndsAt) {
          // Window still open
          currentState = SettlementState.SETTLED_PENDING_APPEAL;
          canAppeal = true;
        } else {
          // Window closed
          currentState = SettlementState.FINALIZED;
          isFinalized = true;
        }
      }
    }

    // 3. Count open appeals
    const openAppeals = auction.appeals.filter(
      (a) => a.status === AppealStatus.OPEN
    ).length;

    // 4. Verify immutability if finalized
    if (isFinalized) {
      // Check if any override logs exist
      const overrideLogs = await prisma.settlementOverrideLog.findMany({
        where: { auctionId },
      });

      if (overrideLogs.length > 0) {
        errors.push('Auction has been overridden by admin');
      }
    }

    return {
      auctionId,
      currentState,
      isFinalized,
      canAppeal,
      appealWindowEndsAt,
      openAppeals,
      errors,
    };
  }

  // ============================================================
  // GET APPEAL
  // ============================================================
  async getAppeal(appealId: number) {
    return prisma.auctionAppeal.findUnique({
      where: { id: appealId },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            status: true,
            winnerId: true,
            finalPrice: true,
          },
        },
      },
    });
  }

  // ============================================================
  // GET APPEALS FOR AUCTION
  // ============================================================
  async getAppealsForAuction(auctionId: number, status?: AppealStatus) {
    const where: any = { auctionId };
    if (status) {
      where.status = status;
    }

    return prisma.auctionAppeal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // GET APPEALS WINDOW CONFIG
  // ============================================================
  async getAppealWindowConfig(auctionId: number) {
    return prisma.appealsWindowConfig.findUnique({
      where: { auctionId },
    });
  }

  // ============================================================
  // GET OVERRIDE HISTORY
  // ============================================================
  async getOverrideHistory(auctionId: number) {
    return prisma.settlementOverrideLog.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // GET ALL OPEN APPEALS (Admin/Control Center)
  // ============================================================
  async getAllOpenAppeals(limit: number = 50, offset: number = 0) {
    const [appeals, total] = await Promise.all([
      prisma.auctionAppeal.findMany({
        where: { status: AppealStatus.OPEN },
        include: {
          auction: {
            select: {
              id: true,
              title: true,
              status: true,
              winnerId: true,
              finalPrice: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Oldest first
        take: limit,
        skip: offset,
      }),
      prisma.auctionAppeal.count({
        where: { status: AppealStatus.OPEN },
      }),
    ]);

    return {
      appeals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + appeals.length < total,
      },
    };
  }

  // ============================================================
  // VERIFY IMMUTABILITY
  // Prevent any changes to finalized auctions
  // ============================================================
  async verifyImmutability(auctionId: number): Promise<boolean> {
    const finality = await this.checkSettlementFinality(auctionId);

    if (finality.isFinalized) {
      throw new Error(
        `IMMUTABLE: Auction ${auctionId} is finalized. No changes allowed.`
      );
    }

    return true;
  }
}

// Export singleton instance
export const appealsWindowService = new AppealsWindowService();
