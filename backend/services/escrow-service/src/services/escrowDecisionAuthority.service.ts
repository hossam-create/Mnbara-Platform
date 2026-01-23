/**
 * Escrow Decision Authority Service
 * Phase 4: Button-Style Integration
 * 
 * HARD RULE (NON-NEGOTIABLE):
 * ❌ Escrow MUST NEVER release funds without an explicit APPROVED decision
 * ❌ NO fallback auto-approve for escrow release
 * ❌ On error → block release with retriable error
 * 
 * RULES:
 * - NO business logic
 * - NO retries inside this service
 * - Decision Authority is single source of truth
 * - All blocked releases logged to audit trail
 */

import { PrismaClient } from '@prisma/client';
import { DecisionAuthorityClient, AssetType, DecisionStatus } from '../../../shared/clients/DecisionAuthorityClient';
import { getDecisionAuthorityConfig } from '../config/decisionAuthority.config';

const prisma = new PrismaClient();

export class EscrowReleaseBlockedError extends Error {
  constructor(
    message: string,
    public readonly reason: 'PENDING' | 'REJECTED' | 'NOT_FOUND' | 'ERROR',
    public readonly decisionId?: number,
    public readonly decisionRef?: string
  ) {
    super(message);
    this.name = 'EscrowReleaseBlockedError';
  }
}

export class EscrowDecisionAuthorityService {
  private decisionClient: DecisionAuthorityClient;

  constructor() {
    const config = getDecisionAuthorityConfig();
    this.decisionClient = new DecisionAuthorityClient(config);
  }

  /**
   * Check if escrow release is approved
   * 
   * HARD RULE: ONLY returns true if:
   * 1. Feature flag is OFF (legacy behavior), OR
   * 2. Decision exists AND status === APPROVED
   * 
   * Otherwise: throws EscrowReleaseBlockedError
   */
  async canReleaseEscrow(escrowId: string, orderId: string): Promise<boolean> {
    if (!this.decisionClient.isEnabled()) {
      // Feature flag OFF → preserve existing behavior
      return true;
    }

    try {
      // Fetch decision for this escrow release
      const decisions = await this.decisionClient.getDecisionsByAsset(
        AssetType.ESCROW_RELEASE,
        escrowId
      );

      if (!decisions || decisions.length === 0) {
        // No decision found → block release
        await this.logBlockedRelease(escrowId, orderId, 'NOT_FOUND', 'No decision found for escrow release');
        throw new EscrowReleaseBlockedError(
          'Escrow release blocked: No decision found',
          'NOT_FOUND'
        );
      }

      // Get most recent decision
      const decision = decisions[0];

      if (decision.status === DecisionStatus.APPROVED) {
        // APPROVED → allow release
        await this.logApprovedRelease(escrowId, orderId, decision.id, decision.decisionRef);
        return true;
      }

      if (decision.status === DecisionStatus.PENDING) {
        // PENDING → block release
        await this.logBlockedRelease(escrowId, orderId, 'PENDING', 'Decision is pending', decision.id, decision.decisionRef);
        throw new EscrowReleaseBlockedError(
          'Escrow release blocked: Decision is pending',
          'PENDING',
          decision.id,
          decision.decisionRef
        );
      }

      if (decision.status === DecisionStatus.REJECTED) {
        // REJECTED → block release
        await this.logBlockedRelease(escrowId, orderId, 'REJECTED', decision.reason || 'Decision rejected', decision.id, decision.decisionRef);
        throw new EscrowReleaseBlockedError(
          `Escrow release blocked: ${decision.reason || 'Decision rejected'}`,
          'REJECTED',
          decision.id,
          decision.decisionRef
        );
      }

      // EXPIRED or other status → block release
      await this.logBlockedRelease(escrowId, orderId, 'REJECTED', `Decision status: ${decision.status}`, decision.id, decision.decisionRef);
      throw new EscrowReleaseBlockedError(
        `Escrow release blocked: Decision status is ${decision.status}`,
        'REJECTED',
        decision.id,
        decision.decisionRef
      );
    } catch (error) {
      if (error instanceof EscrowReleaseBlockedError) {
        throw error;
      }

      // Network error or timeout → DO NOT release escrow
      await this.logBlockedRelease(escrowId, orderId, 'ERROR', `Decision Authority error: ${error.message}`);
      throw new EscrowReleaseBlockedError(
        'Escrow release blocked: Decision Authority service error (retriable)',
        'ERROR'
      );
    }
  }

  /**
   * Request decision for escrow release
   * Returns decision or throws error
   */
  async requestEscrowReleaseDecision(escrowId: string, metadata?: Record<string, any>): Promise<{
    decisionId: number;
    decisionRef?: string;
    status: DecisionStatus;
  }> {
    if (!this.decisionClient.isEnabled()) {
      // Feature flag OFF → no decision needed
      throw new Error('Decision Authority is disabled');
    }

    try {
      const decision = await this.decisionClient.requestDecision({
        assetType: AssetType.ESCROW_RELEASE,
        assetId: escrowId,
        metadata: metadata || {}
      });

      if (!decision) {
        throw new Error('Decision request returned null');
      }

      return {
        decisionId: decision.id,
        decisionRef: decision.decisionRef,
        status: decision.status as DecisionStatus
      };
    } catch (error) {
      console.error('[EscrowDecisionAuthority] Failed to request decision:', error);
      throw error;
    }
  }

  /**
   * Log blocked release to audit trail
   */
  private async logBlockedRelease(
    escrowId: string,
    orderId: string,
    reason: string,
    details: string,
    decisionId?: number,
    decisionRef?: string
  ): Promise<void> {
    try {
      // Log to escrow timeline
      await prisma.timelineEvent.create({
        data: {
          escrowTransactionId: escrowId,
          event: 'RELEASE_BLOCKED',
          description: `Escrow release blocked: ${details}`,
          descriptionAr: `تم حظر تحرير الضمان: ${details}`,
          actorRole: 'system',
          metadata: {
            reason,
            decisionId,
            decisionRef,
            orderId
          }
        }
      });
    } catch (error) {
      console.error('[EscrowDecisionAuthority] Failed to log blocked release:', error);
    }
  }

  /**
   * Log approved release to audit trail
   */
  private async logApprovedRelease(
    escrowId: string,
    orderId: string,
    decisionId: number,
    decisionRef?: string
  ): Promise<void> {
    try {
      await prisma.timelineEvent.create({
        data: {
          escrowTransactionId: escrowId,
          event: 'RELEASE_APPROVED',
          description: 'Escrow release approved by Decision Authority',
          descriptionAr: 'تمت الموافقة على تحرير الضمان من قبل سلطة القرار',
          actorRole: 'system',
          metadata: {
            decisionId,
            decisionRef,
            orderId
          }
        }
      });
    } catch (error) {
      console.error('[EscrowDecisionAuthority] Failed to log approved release:', error);
    }
  }
}
