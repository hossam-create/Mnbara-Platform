/**
 * Auction Decision Authority Service
 * Handles decision authority integration for auction operations
 * Follows the same pattern as Listing Service integration
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
   * Request decision for auction start
   * Called when seller initiates auction
   */
  async requestAuctionDecision(auctionId: number, metadata: any) {
    if (!this.decisionClient.isEnabled()) {
      return null;
    }

    try {
      const decision = await this.decisionClient.requestDecision({
        assetType: AssetType.AUCTION,
        assetId: auctionId,
        metadata,
      });

      if (decision) {
        // Update auction with decision info
        await prisma.listing.update({
          where: { id: auctionId },
          data: {
            decisionId: decision.id,
            decisionRef: decision.decisionRef,
            decisionRequestedAt: new Date(),
            dispositionStatus: this.mapDecisionStatusToDisposition(decision.status),
            decisionDecidedAt: decision.decidedAt ? new Date(decision.decidedAt) : null,
          },
        });

        return decision;
      }
    } catch (error) {
      console.error('[AuctionDecisionAuthorityService] Decision request failed:', error);
      // Fallback: Auto-approve on error
      return null;
    }
  }

  /**
   * Check if auction is approved for bidding
   * Returns true if:
   * - Decision authority is disabled (auto-approve)
   * - Auction has APPROVED disposition status
   */
  async isAuctionApprovedForBidding(auctionId: number): Promise<boolean> {
    if (!this.decisionClient.isEnabled()) {
      return true; // Auto-approve if disabled
    }

    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      select: { dispositionStatus: true },
    });

    if (!auction) {
      return false;
    }

    return auction.dispositionStatus === 'APPROVED';
  }

  /**
   * Check if auction is approved for starting
   * Returns true if:
   * - Decision authority is disabled (auto-approve)
   * - Auction has APPROVED disposition status
   */
  async isAuctionApprovedForStart(auctionId: number): Promise<boolean> {
    if (!this.decisionClient.isEnabled()) {
      return true; // Auto-approve if disabled
    }

    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      select: { dispositionStatus: true },
    });

    if (!auction) {
      return false;
    }

    return auction.dispositionStatus === 'APPROVED';
  }

  /**
   * Update auction disposition status (called by webhook or polling)
   */
  async updateDispositionStatus(auctionId: number, decisionId: number) {
    if (!this.decisionClient.isEnabled()) {
      return null;
    }

    try {
      const decision = await this.decisionClient.getDecision(decisionId);
      if (!decision) {
        return null;
      }

      return prisma.listing.update({
        where: { id: auctionId },
        data: {
          dispositionStatus: this.mapDecisionStatusToDisposition(decision.status),
          decisionDecidedAt: decision.decidedAt ? new Date(decision.decidedAt) : null,
        },
      });
    } catch (error) {
      console.error('[AuctionDecisionAuthorityService] Failed to update disposition status:', error);
      return null;
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

  /**
   * Auto-approve auction (fallback behavior)
   */
  async autoApproveAuction(auctionId: number) {
    return prisma.listing.update({
      where: { id: auctionId },
      data: {
        dispositionStatus: 'APPROVED',
        decisionDecidedAt: new Date(),
      },
    });
  }

  /**
   * Get auction decision status
   */
  async getAuctionDecisionStatus(auctionId: number) {
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      select: {
        dispositionStatus: true,
        decisionId: true,
        decisionRef: true,
        decisionRequestedAt: true,
        decisionDecidedAt: true,
      },
    });

    return auction || null;
  }

  /**
   * Check if decision authority is enabled
   */
  isEnabled(): boolean {
    return this.decisionClient.isEnabled();
  }
}
