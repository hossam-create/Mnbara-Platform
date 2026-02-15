// ============================================================
// PHASE 6.1 — Safeguard Execution Service
//
// CRITICAL RULES:
// - Safeguards are PREVENTIVE, not punitive
// - Safeguards are TIME-BOUND (auto-lift)
// - Safeguards are REVERSIBLE
// - Safeguards are TRANSPARENT to user
// - Safeguards are LOGGED immutably
// - Safeguards NEVER block access completely
// ============================================================

import { PrismaClient } from '@prisma/client';
import { SafeguardType, SafeguardScope } from './safeguard-policy.service';

const prisma = new PrismaClient();

export enum SafeguardStatus {
  ACTIVE = 'ACTIVE',
  LIFTED = 'LIFTED',
  ESCALATED = 'ESCALATED',
}

export interface SafeguardActivationRequest {
  targetUserId?: number;
  targetAuctionId?: number;
  targetSellerId?: number;
  safeguardType: SafeguardType;
  scope: SafeguardScope;
  durationMinutes: number;
  parameters: Record<string, any>;
  reason: string;
  confidence: number;
}

export interface SafeguardLiftRequest {
  activationId: number;
  reason: string;
}

// ============================================================
// SAFEGUARD EXECUTION SERVICE
// ============================================================

export class SafeguardExecutionService {
  // ============================================================
  // ACTIVATE SAFEGUARD
  // Auto-execute safeguard (no approval needed)
  // ============================================================
  async activateSafeguard(
    params: SafeguardActivationRequest
  ): Promise<any> {
    // 1. Check if safeguard already active for target
    const existingActivation = await prisma.safeguardActivation.findFirst({
      where: {
        targetUserId: params.targetUserId,
        targetAuctionId: params.targetAuctionId,
        targetSellerId: params.targetSellerId,
        safeguardType: params.safeguardType,
        status: SafeguardStatus.ACTIVE,
      },
    });

    if (existingActivation) {
      // Extend existing safeguard
      return await this.extendSafeguard(existingActivation.id, params.durationMinutes);
    }

    // 2. Create safeguard activation (APPEND-ONLY)
    const liftAt = new Date(Date.now() + params.durationMinutes * 60 * 1000);

    const activation = await prisma.safeguardActivation.create({
      data: {
        targetUserId: params.targetUserId,
        targetAuctionId: params.targetAuctionId,
        targetSellerId: params.targetSellerId,
        safeguardType: params.safeguardType,
        scope: params.scope,
        status: SafeguardStatus.ACTIVE,
        durationMinutes: params.durationMinutes,
        parameters: params.parameters,
        reason: params.reason,
        confidence: params.confidence,
        activatedAt: new Date(),
        liftAt,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      },
    });

    // 3. Create audit log (APPEND-ONLY)
    await prisma.safeguardAuditLog.create({
      data: {
        activationId: activation.id,
        action: 'ACTIVATED',
        metadata: {
          safeguardType: params.safeguardType,
          scope: params.scope,
          durationMinutes: params.durationMinutes,
          reason: params.reason,
          confidence: params.confidence,
        },
      },
    });

    console.log(`[SAFEGUARD_ACTIVATED] ${params.safeguardType}:`, {
      targetUserId: params.targetUserId,
      targetAuctionId: params.targetAuctionId,
      targetSellerId: params.targetSellerId,
      durationMinutes: params.durationMinutes,
      liftAt: liftAt.toISOString(),
    });

    return activation;
  }

  // ============================================================
  // EXTEND SAFEGUARD
  // Extend existing safeguard duration
  // ============================================================
  async extendSafeguard(activationId: number, additionalMinutes: number): Promise<any> {
    const activation = await prisma.safeguardActivation.findUnique({
      where: { id: activationId },
    });

    if (!activation) {
      throw new Error('Safeguard activation not found');
    }

    if (activation.status !== SafeguardStatus.ACTIVE) {
      throw new Error(`Cannot extend safeguard in status: ${activation.status}`);
    }

    // Calculate new lift time
    const newLiftAt = new Date(
      activation.liftAt.getTime() + additionalMinutes * 60 * 1000
    );

    const updated = await prisma.safeguardActivation.update({
      where: { id: activationId },
      data: {
        durationMinutes: activation.durationMinutes + additionalMinutes,
        liftAt: newLiftAt,
      },
    });

    // Create audit log
    await prisma.safeguardAuditLog.create({
      data: {
        activationId,
        action: 'EXTENDED',
        metadata: {
          additionalMinutes,
          newLiftAt: newLiftAt.toISOString(),
        },
      },
    });

    return updated;
  }

  // ============================================================
  // LIFT SAFEGUARD
  // Manually lift safeguard before auto-lift
  // ============================================================
  async liftSafeguard(params: SafeguardLiftRequest): Promise<any> {
    const activation = await prisma.safeguardActivation.findUnique({
      where: { id: params.activationId },
    });

    if (!activation) {
      throw new Error('Safeguard activation not found');
    }

    if (activation.status !== SafeguardStatus.ACTIVE) {
      throw new Error(`Cannot lift safeguard in status: ${activation.status}`);
    }

    // Update status to LIFTED
    const lifted = await prisma.safeguardActivation.update({
      where: { id: params.activationId },
      data: {
        status: SafeguardStatus.LIFTED,
        liftedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.safeguardAuditLog.create({
      data: {
        activationId: params.activationId,
        action: 'LIFTED',
        metadata: {
          reason: params.reason,
          liftedAt: new Date().toISOString(),
        },
      },
    });

    // Create lift event (APPEND-ONLY)
    await prisma.safeguardLiftEvent.create({
      data: {
        activationId: params.activationId,
        reason: params.reason,
        liftedAt: new Date(),
      },
    });

    console.log(`[SAFEGUARD_LIFTED] Activation ${params.activationId}:`, {
      reason: params.reason,
    });

    return lifted;
  }

  // ============================================================
  // AUTO-LIFT EXPIRED SAFEGUARDS
  // Called periodically to lift expired safeguards
  // ============================================================
  async autoLiftExpiredSafeguards(): Promise<number> {
    const now = new Date();

    // Find all active safeguards that have expired
    const expiredSafeguards = await prisma.safeguardActivation.findMany({
      where: {
        status: SafeguardStatus.ACTIVE,
        liftAt: { lte: now },
      },
    });

    let liftedCount = 0;

    for (const safeguard of expiredSafeguards) {
      await this.liftSafeguard({
        activationId: safeguard.id,
        reason: 'Auto-lift: Safeguard duration expired',
      });
      liftedCount++;
    }

    if (liftedCount > 0) {
      console.log(`[SAFEGUARD_AUTO_LIFT] Lifted ${liftedCount} expired safeguards`);
    }

    return liftedCount;
  }

  // ============================================================
  // GET ACTIVE SAFEGUARDS FOR USER
  // ============================================================
  async getActiveSafeguardsForUser(userId: number): Promise<any[]> {
    return await prisma.safeguardActivation.findMany({
      where: {
        targetUserId: userId,
        status: SafeguardStatus.ACTIVE,
      },
      orderBy: { activatedAt: 'desc' },
    });
  }

  // ============================================================
  // GET ACTIVE SAFEGUARDS FOR AUCTION
  // ============================================================
  async getActiveSafeguardsForAuction(auctionId: number): Promise<any[]> {
    return await prisma.safeguardActivation.findMany({
      where: {
        targetAuctionId: auctionId,
        status: SafeguardStatus.ACTIVE,
      },
      orderBy: { activatedAt: 'desc' },
    });
  }

  // ============================================================
  // GET ACTIVE SAFEGUARDS FOR SELLER
  // ============================================================
  async getActiveSafeguardsForSeller(sellerId: number): Promise<any[]> {
    return await prisma.safeguardActivation.findMany({
      where: {
        targetSellerId: sellerId,
        status: SafeguardStatus.ACTIVE,
      },
      orderBy: { activatedAt: 'desc' },
    });
  }

  // ============================================================
  // CHECK IF SAFEGUARD IS ACTIVE
  // ============================================================
  async isSafeguardActive(
    safeguardType: SafeguardType,
    targetUserId?: number,
    targetAuctionId?: number,
    targetSellerId?: number
  ): Promise<boolean> {
    const activation = await prisma.safeguardActivation.findFirst({
      where: {
        safeguardType,
        targetUserId,
        targetAuctionId,
        targetSellerId,
        status: SafeguardStatus.ACTIVE,
      },
    });

    return !!activation;
  }

  // ============================================================
  // GET SAFEGUARD DETAILS
  // ============================================================
  async getSafeguardDetails(activationId: number): Promise<any> {
    return await prisma.safeguardActivation.findUnique({
      where: { id: activationId },
      include: {
        auditLogs: { orderBy: { createdAt: 'desc' } },
        liftEvent: true,
      },
    });
  }

  // ============================================================
  // GET SAFEGUARD HISTORY
  // ============================================================
  async getSafeguardHistory(
    targetUserId?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<any> {
    const where: any = {};
    if (targetUserId) where.targetUserId = targetUserId;

    const [activations, total] = await Promise.all([
      prisma.safeguardActivation.findMany({
        where,
        orderBy: { activatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 3 },
          liftEvent: true,
        },
      }),
      prisma.safeguardActivation.count({ where }),
    ]);

    return {
      activations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + activations.length < total,
      },
    };
  }

  // ============================================================
  // CHECK ESCALATION RISK
  // Check if safeguard should escalate to Phase 6.0
  // ============================================================
  async checkEscalationRisk(
    targetUserId?: number,
    targetAuctionId?: number,
    targetSellerId?: number
  ): Promise<boolean> {
    // Get recent safeguard activations (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentActivations = await prisma.safeguardActivation.findMany({
      where: {
        targetUserId,
        targetAuctionId,
        targetSellerId,
        activatedAt: { gte: twentyFourHoursAgo },
      },
    });

    // Escalate if:
    // - More than 3 safeguards in 24 hours
    // - Same safeguard activated more than 2 times
    if (recentActivations.length > 3) {
      return true;
    }

    const safeguardCounts = new Map<SafeguardType, number>();
    for (const activation of recentActivations) {
      const count = safeguardCounts.get(activation.safeguardType) || 0;
      safeguardCounts.set(activation.safeguardType, count + 1);
    }

    for (const count of safeguardCounts.values()) {
      if (count > 2) {
        return true;
      }
    }

    return false;
  }

  // ============================================================
  // CREATE ESCALATION REVIEW
  // Create Phase 6.0 review if escalation risk detected
  // ============================================================
  async createEscalationReview(
    targetUserId?: number,
    targetAuctionId?: number,
    targetSellerId?: number,
    reason: string = 'Escalation from safeguard system'
  ): Promise<any> {
    // This would create a Phase 6.0 enforcement review
    // For now, just log it
    console.log(`[SAFEGUARD_ESCALATION] Creating Phase 6.0 review:`, {
      targetUserId,
      targetAuctionId,
      targetSellerId,
      reason,
    });

    // In production, this would call TrustEnforcementService.createEnforcementReview()
    return {
      escalated: true,
      reason,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const safeguardExecutionService = new SafeguardExecutionService();
