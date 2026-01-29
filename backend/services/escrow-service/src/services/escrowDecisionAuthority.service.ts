/**
 * Escrow Decision Authority Service
 * Handles decision authority integration for escrow operations
 * CRITICAL: Escrow NEVER releases funds without APPROVED decision
 * Follows the same pattern as Listing and Auction Service integration
 */

import { PrismaClient, DispositionStatus } from '@prisma/client';
import { DecisionAuthorityClient, AssetType, DecisionStatus } from '../../../shared/clients/DecisionAuthorityClient';
import { getDecisionAuthorityConfig } from '../config/decisionAuthority.config';

const prisma = new PrismaClient();

export class EscrowDecisionAuthorityService {
  private decisionClient: DecisionAuthorityClient;

  constructor() {
    const config = getDecisionAuthorityConfig();
    this.decisionClient = new DecisionAuthorityClient(config);
  }

  /**
   * Request decision for escrow release
   * Called when seller requests escrow release
   * CRITICAL: Escrow release MUST have APPROVED decision
   */
  async requestEscrowReleaseDecision(escrowId: number, metadata: any) {
    if (!this.decisionClient.isEnabled()) {
      return null;
    }

    try {
      const decision = await this.decisionClient.requestDecision({
        assetType: AssetType.ESCROW_RELEASE,
        assetId: escrowId,
        metadata,
      });

      if (decision) {
        // Update escrow with decision info
        await prisma.escrowHold.update({
          where: { id: escrowId },
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
      console.error('[EscrowDecisionAuthorityService] Decision request failed:', error);
      // Fallback: Auto-approve on error
      return null;
    }
  }

  /**
   * Check if escrow is approved for release
   * CRITICAL: Returns false if decision authority enabled but not APPROVED
   * Returns true if:
   * - Decision authority is disabled (auto-approve)
   * - Escrow has APPROVED disposition status
   */
  async isEscrowApprovedForRelease(escrowId: number): Promise<boolean> {
    if (!this.decisionClient.isEnabled()) {
      return true; // Auto-approve if disabled
    }

    const escrow = await prisma.escrowHold.findUnique({
      where: { id: escrowId },
      select: { dispositionStatus: true },
    });

    if (!escrow) {
      return false;
    }

    return escrow.dispositionStatus === 'APPROVED';
  }

  /**
   * Update escrow disposition status (called by webhook or polling)
   */
  async updateDispositionStatus(escrowId: number, decisionId: number) {
    if (!this.decisionClient.isEnabled()) {
      return null;
    }

    try {
      const decision = await this.decisionClient.getDecision(decisionId);
      if (!decision) {
        return null;
      }

      return prisma.escrowHold.update({
        where: { id: escrowId },
        data: {
          dispositionStatus: this.mapDecisionStatusToDisposition(decision.status),
          decisionDecidedAt: decision.decidedAt ? new Date(decision.decidedAt) : null,
        },
      });
    } catch (error) {
      console.error('[EscrowDecisionAuthorityService] Failed to update disposition status:', error);
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
   * Auto-approve escrow (fallback behavior)
   */
  async autoApproveEscrow(escrowId: number) {
    return prisma.escrowHold.update({
      where: { id: escrowId },
      data: {
        dispositionStatus: 'APPROVED',
        decisionDecidedAt: new Date(),
      },
    });
  }

  /**
   * Get escrow decision status
   */
  async getEscrowDecisionStatus(escrowId: number) {
    const escrow = await prisma.escrowHold.findUnique({
      where: { id: escrowId },
      select: {
        dispositionStatus: true,
        decisionId: true,
        decisionRef: true,
        decisionRequestedAt: true,
        decisionDecidedAt: true,
      },
    });

    return escrow || null;
  }

  /**
   * Check if decision authority is enabled
   */
  isEnabled(): boolean {
    return this.decisionClient.isEnabled();
  }

  /**
   * Get all pending escrow releases (waiting for decision)
   */
  async getPendingEscrowReleases() {
    if (!this.decisionClient.isEnabled()) {
      return [];
    }

    return prisma.escrowHold.findMany({
      where: {
        dispositionStatus: 'PENDING',
      },
      orderBy: { decisionRequestedAt: 'asc' },
    });
  }

  /**
   * Get all rejected escrow releases
   */
  async getRejectedEscrowReleases() {
    if (!this.decisionClient.isEnabled()) {
      return [];
    }

    return prisma.escrowHold.findMany({
      where: {
        dispositionStatus: 'REJECTED',
      },
      orderBy: { decisionDecidedAt: 'desc' },
    });
  }
}
