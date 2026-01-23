/**
 * Auction Decision Authority Service
 * Phase 4: Button-Style Integration
 * 
 * RULES:
 * - NO business logic
 * - NO state machine logic
 * - Consumes decisions, never interprets them
 * - Feature-flag driven
 * - Graceful fallback on error
 */

import { PrismaClient, DispositionStatus } from '@prisma/client';
import { DecisionAuthorityClient, AssetType, DecisionStatus } from '../../../shared/clients/DecisionAuthorityClient';
import { getDecisionAuthorityConfig } from '../config/decisionAuthority.config';

const prisma = new PrismaClient();

export class AuctionDecisionAuthorityService {
  private decisionClient: DecisionAuthorityClient;

  constructor() {
    const config = getDecisionAuthorityConfig();
    this.decisionClient = new DecisionAuthorityClient(config);
  }

  /**
   * Request decision for auction activation
   * Returns decision or null if disabled
   */
  async requestAuctionActivationDecision(auctionId: number, metadata?: Record<string, any>): Promise<{
    approved: boolean;
    decisionId?: number;
    decisionRef?: string;
    reason?: string;
  }> {
    if (!this.decisionClient.isEnabled()) {
      // Feature flag OFF → auto-approve (current behavior)
      return { approved: true };
    }

    try {
      const decision = await this.decisionClient.requestDecision({
        assetType: AssetType.AUCTION,
        assetId: auctionId.toString(),
        metadata: metadata || {}
      });

      if (!decision) {
        // Fallback: auto-approve on null response
        console.warn('[AuctionDecisionAuthority] Decision request returned null, auto-approving');
        return { approved: true };
      }

      // Update auction with decision info
      await prisma.listing.update({
        where: { id: auctionId },
        data: {
          decisionId: decision.id,
          decisionRef: decision.decisionRef,
          decisionRequestedAt: new Date(),
          dispositionStatus: this.mapDecisionStatusToDisposition(decision.status),
          decisionDecidedAt: decision.decidedAt ? new Date(decision.decidedAt) : null
        }
      });

      return {
        approved: decision.status === DecisionStatus.APPROVED,
        decisionId: decision.id,
        decisionRef: decision.decisionRef,
        reason: decision.reason
      };
    } catch (error) {
      // Fallback: auto-approve on error (graceful degradation)
      console.error('[AuctionDecisionAuthority] Decision request failed, auto-approving:', error);
      return { approved: true };
    }
  }

  /**
   * Check if auction is approved for activation
   * Returns true if approved or feature flag is OFF
   */
  async isAuctionApproved(auctionId: number): Promise<boolean> {
    if (!this.decisionClient.isEnabled()) {
      // Feature flag OFF → always approved
      return true;
    }

    try {
      const auction = await prisma.listing.findUnique({
        where: { id: auctionId },
        select: { dispositionStatus: true }
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      return auction.dispositionStatus === 'APPROVED';
    } catch (error) {
      console.error('[AuctionDecisionAuthority] Failed to check approval status:', error);
      // Fallback: assume approved on error
      return true;
    }
  }

  /**
   * Update auction disposition status (called by webhook or polling)
   */
  async updateAuctionDispositionStatus(auctionId: number, decisionId: number): Promise<void> {
    if (!this.decisionClient.isEnabled()) {
      return;
    }

    try {
      const decision = await this.decisionClient.getDecision(decisionId);
      if (!decision) {
        return;
      }

      await prisma.listing.update({
        where: { id: auctionId },
        data: {
          dispositionStatus: this.mapDecisionStatusToDisposition(decision.status),
          decisionDecidedAt: decision.decidedAt ? new Date(decision.decidedAt) : null
        }
      });
    } catch (error) {
      console.error('[AuctionDecisionAuthority] Failed to update disposition status:', error);
    }
  }

  /**
   * Map Decision Authority status to Disposition status
   */
  private mapDecisionStatusToDisposition(status: DecisionStatus): DispositionStatus {
    switch (status) {
      case DecisionStatus.PENDING:
        return 'PENDING';
      case DecisionStatus.APPROVED:
        return 'APPROVED';
      case DecisionStatus.REJECTED:
        return 'REJECTED';
      case DecisionStatus.EXPIRED:
        return 'EXPIRED';
      case DecisionStatus.CANCELLED:
        return 'REJECTED'; // Treat cancelled as rejected
      default:
        return 'PENDING';
    }
  }
}
