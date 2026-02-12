// ============================================
// Resolution Service
// Handles dispute resolution and refunds
// ============================================

import { PrismaClient } from '@prisma/client';
import {
  Dispute,
  DisputeStatus,
  DisputeResolution,
  ResolutionInput,
  ResolutionResult
} from '../types/dispute.types';
import {
  DisputeNotFoundError,
  InvalidDisputeStatusError,
  RefundFailedError,
  InvalidResolutionPercentageError
} from '../errors/DisputeErrors';

const prisma = new PrismaClient();

// Mock Stripe service for now
const stripeService = {
  async createRefund(paymentIntentId: string, amount?: number): Promise<{ id: string; status: string }> {
    console.log(`[Stripe Mock] Creating refund for ${paymentIntentId}, amount: ${amount || 'full'}`);
    return {
      id: `re_${Date.now()}`,
      status: 'succeeded'
    };
  }
};

// Mock Wallet service for now
const walletService = {
  async credit(userId: string, amount: number, currency: string, description: string): Promise<void> {
    console.log(`[Wallet Mock] Crediting ${userId}: ${amount} ${currency} - ${description}`);
  },
  async debit(userId: string, amount: number, currency: string, description: string): Promise<void> {
    console.log(`[Wallet Mock] Debiting ${userId}: ${amount} ${currency} - ${description}`);
  }
};

export class ResolutionService {
  /**
   * Resolve a dispute with a specific resolution
   */
  async resolveDispute(
    disputeId: string,
    input: ResolutionInput,
    adminId: string
  ): Promise<ResolutionResult> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { request: true }
    });

    if (!dispute) {
      throw new DisputeNotFoundError(disputeId);
    }

    if (dispute.status !== DisputeStatus.UNDER_REVIEW) {
      throw new InvalidDisputeStatusError(dispute.status, [DisputeStatus.UNDER_REVIEW]);
    }

    // Validate resolution percentage for partial refund
    if (input.resolution === DisputeResolution.PARTIAL_REFUND) {
      if (input.resolutionPercentage === undefined || input.resolutionPercentage === null) {
        throw new InvalidResolutionPercentageError(0);
      }
      if (input.resolutionPercentage < 0 || input.resolutionPercentage > 100) {
        throw new InvalidResolutionPercentageError(input.resolutionPercentage);
      }
    }

    try {
      switch (input.resolution) {
        case DisputeResolution.REFUND_BUYER:
          await this.refundBuyer(dispute);
          break;
        case DisputeResolution.RELEASE_TO_SELLER:
          await this.releaseToSeller(dispute);
          break;
        case DisputeResolution.PARTIAL_REFUND:
          await this.partialRefund(dispute, input.resolutionPercentage!);
          break;
      }

      // Update dispute status
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution: input.resolution,
          resolutionPercentage: input.resolutionPercentage || null,
          adminNotes: input.adminNotes || null,
          resolvedAt: new Date(),
          resolvedByAdminId: parseInt(adminId)
        }
      });

      // Update request status
      await prisma.request.update({
        where: { id: dispute.requestId },
        data: { status: 'RESOLVED' }
      });

      return {
        success: true,
        dispute: await this.getResolvedDispute(disputeId) || undefined
      };
    } catch (error: any) {
      console.error(`Error resolving dispute ${disputeId}:`, error);
      throw new RefundFailedError(disputeId, error.message);
    }
  }

  /**
   * Refund buyer and release escrow
   */
  private async refundBuyer(dispute: any): Promise<void> {
    const request = dispute.request;

    // Process Stripe refund
    if (request.stripePaymentIntentId) {
      await stripeService.createRefund(request.stripePaymentIntentId);
    }

    // Credit buyer's wallet (store credit)
    await walletService.credit(
      request.buyerId,
      request.amount,
      request.currency,
      `Refund for dispute ${dispute.id}`
    );

    console.log(`[Resolution] Refunded buyer ${request.buyerId} for dispute ${dispute.id}`);
  }

  /**
   * Release funds to seller
   */
  private async releaseToSeller(dispute: any): Promise<void> {
    const request = dispute.request;

    // Release escrow to seller
    await walletService.credit(
      request.sellerId,
      request.amount,
      request.currency,
      `Escrow release for dispute ${dispute.id}`
    );

    console.log(`[Resolution] Released to seller ${request.sellerId} for dispute ${dispute.id}`);
  }

  /**
   * Partial refund - split between buyer and seller
   */
  private async partialRefund(dispute: any, percentage: number): Promise<void> {
    const request = dispute.request;
    const refundAmount = Math.floor((request.amount * percentage) / 100);
    const releaseAmount = request.amount - refundAmount;

    // Process Stripe partial refund
    if (request.stripePaymentIntentId) {
      await stripeService.createRefund(request.stripePaymentIntentId, refundAmount);
    }

    // Credit buyer with partial refund
    await walletService.credit(
      request.buyerId,
      refundAmount,
      request.currency,
      `Partial refund (${percentage}%) for dispute ${dispute.id}`
    );

    // Release remaining to seller
    await walletService.credit(
      request.sellerId,
      releaseAmount,
      request.currency,
      `Partial release (${100 - percentage}%) for dispute ${dispute.id}`
    );

    console.log(`[Resolution] Partial refund: ${refundAmount} to buyer, ${releaseAmount} to seller for dispute ${dispute.id}`);
  }

  /**
   * Get resolved dispute details
   */
  async getResolvedDispute(disputeId: string): Promise<Dispute | null> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId }
    });

    if (!dispute) {
      throw new DisputeNotFoundError(disputeId);
    }

    return {
      id: dispute.id,
      requestId: dispute.requestId,
      openedBy: dispute.openedBy as any,
      reason: dispute.reason as any,
      description: dispute.description,
      evidenceUrls: [],
      status: dispute.status as DisputeStatus,
      resolution: dispute.resolution as DisputeResolution,
      resolutionPercentage: dispute.resolutionPercentage || undefined,
      adminNotes: dispute.adminNotes || undefined,
      openedAt: dispute.openedAt,
      reviewedAt: dispute.reviewedAt || undefined,
      resolvedAt: dispute.resolvedAt || undefined,
      closedAt: dispute.closedAt || undefined,
      reviewedByAdminId: dispute.reviewedByAdminId || undefined,
      resolvedByAdminId: dispute.resolvedByAdminId || undefined,
      stripeRefundId: dispute.stripeRefundId || undefined,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt
    };
  }

  /**
   * Get resolution statistics
   */
  async getResolutionStats(): Promise<any> {
    const [total, refundBuyer, releaseToSeller, partialRefund] = await Promise.all([
      prisma.dispute.count({ where: { status: DisputeStatus.RESOLVED } }),
      prisma.dispute.count({ where: { status: DisputeStatus.RESOLVED, resolution: DisputeResolution.REFUND_BUYER } }),
      prisma.dispute.count({ where: { status: DisputeStatus.RESOLVED, resolution: DisputeResolution.RELEASE_TO_SELLER } }),
      prisma.dispute.count({ where: { status: DisputeStatus.RESOLVED, resolution: DisputeResolution.PARTIAL_REFUND } })
    ]);

    return {
      totalResolved: total,
      refundBuyer,
      releaseToSeller,
      partialRefund,
      buyerWinRate: total > 0 ? (refundBuyer / total * 100).toFixed(2) : 0,
      sellerWinRate: total > 0 ? (releaseToSeller / total * 100).toFixed(2) : 0,
      partialRate: total > 0 ? (partialRefund / total * 100).toFixed(2) : 0
    };
  }
}
