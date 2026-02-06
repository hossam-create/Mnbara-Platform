/**
 * Payment & Escrow Integration Service
 * Integrates escrow, wallet, and payment services with internal ledger
 */

import { PrismaClient } from '@prisma/client';
import { enhancedEscrowService } from '../../escrow-service/src/services/enhanced-escrow.service';
import { enhancedWalletService } from '../../wallet-service/src/services/enhanced-wallet.service';
import { idempotentPaymentService } from './idempotent-payment.service';

const prisma = new PrismaClient();

export interface ProcessOrderPaymentInput {
  userId: string;
  orderId: string;
  tripId?: string;
  amount: number;
  currency: string;
  travelerId: string;
  arbitratorId?: string;
  paymentProvider: 'stripe' | 'paypal' | 'paymob';
  metadata?: Record<string, any>;
}

export interface EscrowReleaseInput {
  escrowId: string;
  orderId: string;
  releasedBy: 'buyer' | 'seller' | 'auto';
  reason?: string;
}

export interface CompleteTravelTransactionInput {
  orderId: string;
  userId: string;
  tripCompletedAt: Date;
  deliveryProof?: Record<string, any>;
}

/**
 * Integration Service for Payment & Escrow
 * Coordinates between wallet, escrow, and payment services
 */
export class PaymentEscrowIntegrationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Process order payment and create escrow
   * 1. Create payment
   * 2. On success, create escrow hold
   */
  async processOrderPayment(input: ProcessOrderPaymentInput): Promise<any> {
    const { userId, orderId, tripId, amount, currency, travelerId, arbitratorId, paymentProvider, metadata } = input;

    return await this.prisma.$transaction(async (tx: any) => {
      // Step 1: Create payment with idempotency
      const paymentResult = await idempotentPaymentService.createPayment({
        userId,
        orderId,
        amount,
        currency,
        provider: paymentProvider,
        description: `Order ${orderId} payment`,
        metadata: {
          tripId,
          travelerId,
          ...metadata,
        },
      });

      if (!paymentResult.success) {
        throw new Error(`Payment failed: ${paymentResult.error}`);
      }

      // Step 2: Create escrow hold (will be activated on webhook confirmation)
      const escrow = await enhancedEscrowService.createEscrow({
        buyerId: userId,
        sellerId: travelerId,
        arbitratorId,
        amount,
        currency,
        orderId,
        tripId,
        metadata: {
          paymentIntentId: paymentResult.payment?.id,
          paymentProvider,
        },
      });

      // Step 3: Create internal ledger entry
      await tx.ledgerEntry.create({
        data: {
          type: 'ESCROW_HOLD',
          userId,
          amount: -amount,
          currency,
          referenceType: 'Order',
          referenceId: orderId,
          metadata: {
            escrowId: escrow.id,
            paymentIntentId: paymentResult.payment?.id,
          },
        },
      });

      // Step 4: Create audit log
      await tx.auditLog.create({
        data: {
          action: 'ORDER_PAYMENT_ESCROW_CREATED',
          userId,
          entityType: 'Order',
          entityId: orderId,
          metadata: {
            paymentIntentId: paymentResult.payment?.id,
            escrowId: escrow.id,
            amount,
            currency,
          },
        },
      });

      return {
        success: true,
        payment: paymentResult.payment,
        escrow,
        orderId,
      };
    });
  }

  /**
   * Confirm payment and activate escrow
   * Called when payment webhook confirms success
   */
  async confirmPaymentAndActivateEscrow(paymentIntentId: string): Promise<any> {
    const paymentRecord = await prisma.paymentRecord.findFirst({
      where: { stripePaymentId: paymentIntentId },
    });

    if (!paymentRecord) {
      throw new Error('Payment record not found');
    }

    // Find escrow by payment intent ID
    const escrow = await prisma.escrow.findFirst({
      where: {
        metadata: {
          path: ['paymentIntentId'],
          equals: paymentIntentId,
        },
      },
    });

    if (!escrow) {
      throw new Error('Escrow not found for this payment');
    }

    // Activate escrow
    const activatedEscrow = await enhancedEscrowService.holdFunds(escrow.id, 'system');

    // Update internal ledger
    await prisma.ledgerEntry.create({
      data: {
        type: 'ESCROW_ACTIVATED',
        userId: paymentRecord.userId,
        amount: -Number(paymentRecord.amount),
        currency: paymentRecord.currency,
        referenceType: 'Order',
        referenceId: paymentRecord.orderId,
        metadata: {
          escrowId: escrow.id,
          paymentIntentId,
        },
      },
    });

    return {
      success: true,
      escrow: activatedEscrow,
      paymentIntentId,
    };
  }

  /**
   * Release escrow to traveler (seller)
   */
  async releaseEscrowToSeller(input: EscrowReleaseInput): Promise<any> {
    const { escrowId, orderId, releasedBy, reason } = input;

    return await this.prisma.$transaction(async (tx: any) => {
      // Get escrow details
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== 'LOCKED') {
        throw new Error('Escrow must be LOCKED to release');
      }

      // Release escrow
      const releasedEscrow = await enhancedEscrowService.releaseEscrow({
        escrowId,
        releasedBy,
        reason,
      });

      // Calculate platform fee (e.g., 5%)
      const platformFeeRate = 0.05;
      const platformFee = Number(escrow.amount) * platformFeeRate;
      const sellerAmount = Number(escrow.amount) - platformFee;

      // Update seller wallet (in real implementation, would call wallet service)
      // For now, create ledger entries
      await tx.ledgerEntry.createMany({
        data: [
          {
            type: 'ESCROW_RELEASE',
            userId: escrow.buyerId,
            amount: -Number(escrow.amount),
            currency: escrow.currency,
            referenceType: 'Order',
            referenceId: orderId,
            metadata: { escrowId, releasedBy },
          },
          {
            type: 'SELLER_PAYOUT',
            userId: escrow.sellerId,
            amount: sellerAmount,
            currency: escrow.currency,
            referenceType: 'Order',
            referenceId: orderId,
            metadata: { escrowId, platformFee },
          },
          {
            type: 'PLATFORM_FEE',
            userId: 'platform',
            amount: platformFee,
            currency: escrow.currency,
            referenceType: 'Order',
            referenceId: orderId,
            metadata: { escrowId, platformFeeRate },
          },
        ],
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'ESCROW_RELEASED',
          userId: escrow.buyerId,
          entityType: 'Order',
          entityId: orderId,
          metadata: {
            escrowId,
            releasedBy,
            sellerAmount,
            platformFee,
          },
        },
      });

      return {
        success: true,
        escrow: releasedEscrow,
        sellerAmount,
        platformFee,
      };
    });
  }

  /**
   * Process refund to buyer
   */
  async processRefund(escrowId: string, buyerId: string, reason: string): Promise<any> {
    return await this.prisma.$transaction(async (tx: any) => {
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== 'LOCKED') {
        throw new Error('Escrow must be LOCKED to refund');
      }

      // Request refund
      const refundRequest = await enhancedEscrowService.requestRefund({
        escrowId,
        requestedBy: buyerId,
        reason,
        approverRole: 'system',
      });

      // Approve refund
      const result = await enhancedEscrowService.approveRefund(refundRequest.id, 'system');

      // Create ledger entries
      await tx.ledgerEntry.create({
        data: {
          type: 'REFUND',
          userId: buyerId,
          amount: Number(escrow.amount),
          currency: escrow.currency,
          referenceType: 'Order',
          referenceId: escrow.orderId || escrowId,
          metadata: {
            escrowId,
            reason,
            refundRequestId: refundRequest.id,
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'REFUND_PROCESSED',
          userId: buyerId,
          entityType: 'Escrow',
          entityId: escrowId,
          metadata: {
            reason,
            amount: Number(escrow.amount),
          },
        },
      });

      return {
        success: true,
        refund: result.refund,
        escrow: result.escrow,
      };
    });
  }

  /**
   * Initiate dispute
   */
  async initiateDispute(
    escrowId: string,
    initiatorId: string,
    reason: string,
    evidence?: Record<string, any>
  ): Promise<any> {
    return await enhancedEscrowService.initiateDispute({
      escrowId,
      initiatorId,
      reason,
      evidence,
      desiredResolution: 'full_refund',
    });
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    escrowId: string,
    resolverId: string,
    resolution: 'buyer_wins' | 'seller_wins' | 'split',
    reason?: string
  ): Promise<any> {
    return await enhancedEscrowService.resolveDispute({
      escrowId,
      resolverId,
      resolution,
      reason,
    });
  }

  /**
   * Get complete transaction audit trail
   */
  async getTransactionAuditTrail(orderId: string): Promise<any> {
    const escrow = await prisma.escrow.findFirst({
      where: { orderId },
      include: {
        events: { orderBy: { createdAt: 'asc' } },
        disputes: true,
        refundRequests: true,
      },
    });

    const paymentRecord = await prisma.paymentRecord.findFirst({
      where: { orderId },
    });

    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: {
        referenceId: orderId,
        referenceType: 'Order',
      },
      orderBy: { createdAt: 'asc' },
    });

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityId: orderId,
        entityType: 'Order',
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      orderId,
      escrow,
      payment: paymentRecord,
      ledgerEntries,
      auditLogs,
    };
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(userId: string): Promise<any> {
    const wallet = await enhancedWalletService.getWallet(userId);
    const transactions = await enhancedWalletService.getTransactionHistory(userId, { limit: 10 });
    const auditLogs = await enhancedWalletService.getAuditLog(userId, 10);

    const activeEscrows = await prisma.escrow.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: { in: ['CREATED', 'LOCKED', 'DISPUTED'] },
      },
      include: {
        disputes: { where: { status: 'OPEN' } },
      },
    });

    return {
      wallet,
      recentTransactions: transactions.transactions,
      recentActivity: auditLogs.logs,
      activeEscrows,
    };
  }
}

export const paymentEscrowIntegrationService = new PaymentEscrowIntegrationService();
