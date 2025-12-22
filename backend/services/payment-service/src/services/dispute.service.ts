import { PrismaClient, DisputeReason, DisputeStatus, EscrowStatus } from '@prisma/client';
import { EscrowService } from './escrow.service';

const prisma = new PrismaClient();

export class DisputeService {
  /**
   * Buyer opens a dispute for an order/escrow.
   */
  static async openDispute(params: {
    orderId: number;
    escrowId: number;
    buyerId: number;
    travelerId?: number;
    reason: DisputeReason;
    message?: string;
    evidenceUrls?: string[];
  }) {
    const { orderId, escrowId, buyerId, travelerId, reason, message, evidenceUrls = [] } = params;

    return prisma.$transaction(async (tx) => {
      const escrow = await tx.escrow.findUnique({ where: { id: escrowId } });
      if (!escrow || escrow.orderId !== orderId) {
        throw new Error('Escrow not found for this order');
      }

      // Ensure only one active dispute per order
      const existing = await tx.dispute.findFirst({
        where: {
          orderId,
          status: { in: ['OPEN', 'UNDER_REVIEW'] },
        },
      });
      if (existing) {
        throw new Error('A dispute is already active for this order');
      }

      const dispute = await tx.dispute.create({
        data: {
          orderId,
          escrowId,
          buyerId,
          travelerId: travelerId ?? escrow.travelerId ?? null,
          reason,
          buyerMessage: message ?? null,
          buyerEvidenceUrls: evidenceUrls,
          status: DisputeStatus.OPEN,
        },
      });

      // Set order & escrow to DISPUTED, block release
      await tx.escrow.update({
        where: { id: escrowId },
        data: { status: EscrowStatus.DISPUTED },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'DISPUTED' },
      });

      return dispute;
    });
  }

  /**
   * Traveler responds with message / evidence.
   */
  static async travelerRespond(params: {
    disputeId: number;
    travelerId: number;
    message?: string;
    evidenceUrls?: string[];
  }) {
    const { disputeId, travelerId, message, evidenceUrls = [] } = params;
    return prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      if (!dispute) throw new Error('Dispute not found');
      if (dispute.travelerId !== travelerId) {
        throw new Error('Traveler not authorized for this dispute');
      }

      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          travelerMessage: message ?? null,
          travelerEvidenceUrls: evidenceUrls,
          status: DisputeStatus.UNDER_REVIEW,
        },
      });

      return updated;
    });
  }

  /**
   * Admin resolves dispute in favor of buyer: refund escrow.
   */
  static async resolveForBuyer(params: { disputeId: number; adminId: number; reason?: string }) {
    const { disputeId, adminId, reason } = params;

    return prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      if (!dispute) throw new Error('Dispute not found');
      if (dispute.status === DisputeStatus.RESOLVED_BUYER || dispute.status === DisputeStatus.RESOLVED_TRAVELER) {
        return dispute;
      }

      // Refund escrow via EscrowService (wallet + ledger)
      await EscrowService.refundFunds({
        escrowId: dispute.escrowId,
        systemUserId: adminId,
        reason: reason || 'Dispute resolved for buyer',
        metadata: { disputeId },
      });

      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED_BUYER,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      });

      // Update order status after refund
      await tx.order.update({
        where: { id: dispute.orderId },
        data: { status: 'CANCELLED' },
      });

      return updated;
    });
  }

  /**
   * Admin resolves dispute in favor of traveler: release escrow.
   */
  static async resolveForTraveler(params: { disputeId: number; adminId: number; reason?: string }) {
    const { disputeId, adminId, reason } = params;

    return prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      if (!dispute) throw new Error('Dispute not found');
      if (dispute.status === DisputeStatus.RESOLVED_BUYER || dispute.status === DisputeStatus.RESOLVED_TRAVELER) {
        return dispute;
      }

      const escrow = await tx.escrow.findUnique({ where: { id: dispute.escrowId } });
      if (!escrow) throw new Error('Escrow not found');

      const recipient = escrow.travelerId || escrow.sellerId;
      if (!recipient) throw new Error('No recipient for escrow release');

      await EscrowService.releaseFunds({
        escrowId: dispute.escrowId,
        recipientUserId: recipient,
        systemUserId: adminId,
        reason: reason || 'Dispute resolved for traveler',
        metadata: { disputeId },
      });

      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED_TRAVELER,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      });

      // Update order status after release
      await tx.order.update({
        where: { id: dispute.orderId },
        data: { status: 'COMPLETED' },
      });

      return updated;
    });
  }
}






