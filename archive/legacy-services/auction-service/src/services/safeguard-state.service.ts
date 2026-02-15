// ============================================================
// PHASE 6.1 — Safeguard State Service
//
// Tracks current safeguard state for users, auctions, sellers
// Provides real-time safeguard status and parameters
// ============================================================

import { PrismaClient } from '@prisma/client';
import { SafeguardType } from './safeguard-policy.service';

const prisma = new PrismaClient();

export interface SafeguardState {
  isActive: boolean;
  safeguardType?: SafeguardType;
  parameters?: Record<string, any>;
  activatedAt?: Date;
  liftAt?: Date;
  timeRemainingMinutes?: number;
  reason?: string;
}

export interface UserSafeguardState {
  userId: number;
  activeSafeguards: SafeguardState[];
  totalActiveSafeguards: number;
  escalationRisk: boolean;
}

export interface AuctionSafeguardState {
  auctionId: number;
  activeSafeguards: SafeguardState[];
  totalActiveSafeguards: number;
}

export interface SellerSafeguardState {
  sellerId: number;
  activeSafeguards: SafeguardState[];
  totalActiveSafeguards: number;
  escalationRisk: boolean;
}

// ============================================================
// SAFEGUARD STATE SERVICE
// ============================================================

export class SafeguardStateService {
  // ============================================================
  // GET USER SAFEGUARD STATE
  // ============================================================
  async getUserSafeguardState(userId: number): Promise<UserSafeguardState> {
    const activations = await prisma.safeguardActivation.findMany({
      where: {
        targetUserId: userId,
        status: 'ACTIVE',
      },
      orderBy: { activatedAt: 'desc' },
    });

    const now = new Date();
    const safeguards: SafeguardState[] = activations.map((activation) => {
      const timeRemainingMs = activation.liftAt.getTime() - now.getTime();
      const timeRemainingMinutes = Math.ceil(timeRemainingMs / (1000 * 60));

      return {
        isActive: true,
        safeguardType: activation.safeguardType as SafeguardType,
        parameters: activation.parameters,
        activatedAt: activation.activatedAt,
        liftAt: activation.liftAt,
        timeRemainingMinutes: Math.max(0, timeRemainingMinutes),
        reason: activation.reason,
      };
    });

    // Check escalation risk
    const escalationRisk = await this.checkUserEscalationRisk(userId);

    return {
      userId,
      activeSafeguards: safeguards,
      totalActiveSafeguards: safeguards.length,
      escalationRisk,
    };
  }

  // ============================================================
  // GET AUCTION SAFEGUARD STATE
  // ============================================================
  async getAuctionSafeguardState(auctionId: number): Promise<AuctionSafeguardState> {
    const activations = await prisma.safeguardActivation.findMany({
      where: {
        targetAuctionId: auctionId,
        status: 'ACTIVE',
      },
      orderBy: { activatedAt: 'desc' },
    });

    const now = new Date();
    const safeguards: SafeguardState[] = activations.map((activation) => {
      const timeRemainingMs = activation.liftAt.getTime() - now.getTime();
      const timeRemainingMinutes = Math.ceil(timeRemainingMs / (1000 * 60));

      return {
        isActive: true,
        safeguardType: activation.safeguardType as SafeguardType,
        parameters: activation.parameters,
        activatedAt: activation.activatedAt,
        liftAt: activation.liftAt,
        timeRemainingMinutes: Math.max(0, timeRemainingMinutes),
        reason: activation.reason,
      };
    });

    return {
      auctionId,
      activeSafeguards: safeguards,
      totalActiveSafeguards: safeguards.length,
    };
  }

  // ============================================================
  // GET SELLER SAFEGUARD STATE
  // ============================================================
  async getSellerSafeguardState(sellerId: number): Promise<SellerSafeguardState> {
    const activations = await prisma.safeguardActivation.findMany({
      where: {
        targetSellerId: sellerId,
        status: 'ACTIVE',
      },
      orderBy: { activatedAt: 'desc' },
    });

    const now = new Date();
    const safeguards: SafeguardState[] = activations.map((activation) => {
      const timeRemainingMs = activation.liftAt.getTime() - now.getTime();
      const timeRemainingMinutes = Math.ceil(timeRemainingMs / (1000 * 60));

      return {
        isActive: true,
        safeguardType: activation.safeguardType as SafeguardType,
        parameters: activation.parameters,
        activatedAt: activation.activatedAt,
        liftAt: activation.liftAt,
        timeRemainingMinutes: Math.max(0, timeRemainingMinutes),
        reason: activation.reason,
      };
    });

    // Check escalation risk
    const escalationRisk = await this.checkSellerEscalationRisk(sellerId);

    return {
      sellerId,
      activeSafeguards: safeguards,
      totalActiveSafeguards: safeguards.length,
      escalationRisk,
    };
  }

  // ============================================================
  // CHECK SPECIFIC SAFEGUARD
  // ============================================================
  async checkSafeguard(
    safeguardType: SafeguardType,
    userId?: number,
    auctionId?: number,
    sellerId?: number
  ): Promise<SafeguardState | null> {
    const activation = await prisma.safeguardActivation.findFirst({
      where: {
        safeguardType,
        targetUserId: userId,
        targetAuctionId: auctionId,
        targetSellerId: sellerId,
        status: 'ACTIVE',
      },
    });

    if (!activation) {
      return null;
    }

    const now = new Date();
    const timeRemainingMs = activation.liftAt.getTime() - now.getTime();
    const timeRemainingMinutes = Math.ceil(timeRemainingMs / (1000 * 60));

    return {
      isActive: true,
      safeguardType: activation.safeguardType as SafeguardType,
      parameters: activation.parameters,
      activatedAt: activation.activatedAt,
      liftAt: activation.liftAt,
      timeRemainingMinutes: Math.max(0, timeRemainingMinutes),
      reason: activation.reason,
    };
  }

  // ============================================================
  // APPLY SAFEGUARD LIMIT
  // Check if action should be limited by safeguard
  // ============================================================
  async applySafeguardLimit(
    action: string,
    userId?: number,
    auctionId?: number,
    sellerId?: number
  ): Promise<{ allowed: boolean; reason?: string; delayMs?: number }> {
    // Get active safeguards
    const activations = await prisma.safeguardActivation.findMany({
      where: {
        targetUserId: userId,
        targetAuctionId: auctionId,
        targetSellerId: sellerId,
        status: 'ACTIVE',
      },
    });

    if (activations.length === 0) {
      return { allowed: true };
    }

    // Check each safeguard
    for (const activation of activations) {
      const result = this.checkSafeguardLimit(action, activation);
      if (!result.allowed) {
        return result;
      }
    }

    return { allowed: true };
  }

  // ============================================================
  // CHECK SAFEGUARD LIMIT (INTERNAL)
  // ============================================================
  private checkSafeguardLimit(
    action: string,
    activation: any
  ): { allowed: boolean; reason?: string; delayMs?: number } {
    const params = activation.parameters || {};

    switch (activation.safeguardType) {
      case SafeguardType.BID_RATE_LIMIT:
        if (action === 'BID') {
          return {
            allowed: false,
            reason: `Bid rate limit active: max ${params.maxBidsPerMinute} bids/min`,
          };
        }
        break;

      case SafeguardType.BID_COOLDOWN:
        if (action === 'BID') {
          return {
            allowed: false,
            reason: `Bid cooldown active: ${params.cooldownSeconds}s between bids`,
            delayMs: params.cooldownSeconds * 1000,
          };
        }
        break;

      case SafeguardType.MAX_BID_AMOUNT_CAP:
        if (action === 'BID') {
          return {
            allowed: false,
            reason: `Bid amount capped at $${params.maxBidAmount}`,
          };
        }
        break;

      case SafeguardType.DAILY_BID_COUNT_CAP:
        if (action === 'BID') {
          return {
            allowed: false,
            reason: `Daily bid limit reached: max ${params.maxBidsPerDay} bids/day`,
          };
        }
        break;

      case SafeguardType.AUCTION_JOIN_LIMIT:
        if (action === 'JOIN_AUCTION') {
          return {
            allowed: false,
            reason: `Auction join limit active: max ${params.maxAuctionsPerHour} auctions/hour`,
          };
        }
        break;

      case SafeguardType.TEMP_BID_DELAY:
        if (action === 'BID') {
          return {
            allowed: true,
            delayMs: params.delayMs,
          };
        }
        break;

      case SafeguardType.LISTING_CREATION_RATE_LIMIT:
        if (action === 'CREATE_LISTING') {
          return {
            allowed: false,
            reason: `Listing creation limit active: max ${params.maxListingsPerHour} listings/hour`,
          };
        }
        break;

      case SafeguardType.MAX_ACTIVE_AUCTIONS_SOFT_CAP:
        if (action === 'CREATE_LISTING') {
          return {
            allowed: false,
            reason: `Active auction limit reached: max ${params.maxActiveAuctions} auctions`,
          };
        }
        break;
    }

    return { allowed: true };
  }

  // ============================================================
  // CHECK USER ESCALATION RISK
  // ============================================================
  private async checkUserEscalationRisk(userId: number): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentActivations = await prisma.safeguardActivation.findMany({
      where: {
        targetUserId: userId,
        activatedAt: { gte: twentyFourHoursAgo },
      },
    });

    // Escalate if more than 3 safeguards in 24 hours
    if (recentActivations.length > 3) {
      return true;
    }

    // Escalate if same safeguard activated more than 2 times
    const safeguardCounts = new Map<SafeguardType, number>();
    for (const activation of recentActivations) {
      const count = safeguardCounts.get(activation.safeguardType as SafeguardType) || 0;
      safeguardCounts.set(activation.safeguardType as SafeguardType, count + 1);
    }

    for (const count of safeguardCounts.values()) {
      if (count > 2) {
        return true;
      }
    }

    return false;
  }

  // ============================================================
  // CHECK SELLER ESCALATION RISK
  // ============================================================
  private async checkSellerEscalationRisk(sellerId: number): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentActivations = await prisma.safeguardActivation.findMany({
      where: {
        targetSellerId: sellerId,
        activatedAt: { gte: twentyFourHoursAgo },
      },
    });

    // Escalate if more than 2 safeguards in 24 hours
    if (recentActivations.length > 2) {
      return true;
    }

    // Escalate if same safeguard activated more than 1 time
    const safeguardCounts = new Map<SafeguardType, number>();
    for (const activation of recentActivations) {
      const count = safeguardCounts.get(activation.safeguardType as SafeguardType) || 0;
      safeguardCounts.set(activation.safeguardType as SafeguardType, count + 1);
    }

    for (const count of safeguardCounts.values()) {
      if (count > 1) {
        return true;
      }
    }

    return false;
  }

  // ============================================================
  // GET USER NOTIFICATION
  // Get user-friendly notification about active safeguards
  // ============================================================
  async getUserNotification(userId: number): Promise<string | null> {
    const state = await this.getUserSafeguardState(userId);

    if (state.totalActiveSafeguards === 0) {
      return null;
    }

    const safeguard = state.activeSafeguards[0];
    const timeRemaining = safeguard.timeRemainingMinutes;

    return `You have an active safeguard: ${safeguard.reason}. It will be lifted in ${timeRemaining} minutes.`;
  }
}

// Export singleton instance
export const safeguardStateService = new SafeguardStateService();
