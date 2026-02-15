// ============================================================
// Settlement Coordinator Service
// Handles internal and external settlement coordination
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  SettlementMethod,
  SettlementStatus,
  MatchStatus,
  ExchangeStatus,
} from '../types/enums';
import {
  Settlement,
  InitiateSettlementInput,
  PSPWebhookPayload,
  SettlementResult,
} from '../types/settlement.types';
import {
  SettlementNotFoundError,
  SettlementTimeoutError,
  InvalidSettlementStatusError,
} from '../errors/ExchangeErrors';

export class SettlementCoordinatorService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Initiate settlement for a match
   */
  async initiateSettlement(input: InitiateSettlementInput): Promise<Settlement> {
    const { matchId } = input;

    // Get match details
    const match = await this.prisma.exchangeMatch.findUnique({
      where: { id: matchId },
      include: {
        request: true,
        counterRequest: true,
      },
    });

    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Verify match is in correct status
    if (match.status !== MatchStatus.ESCROWED) {
      throw new Error(
        `Match ${matchId} must be in ESCROWED status to initiate settlement`
      );
    }

    // Create settlement record
    const settlement = await this.prisma.settlement.create({
      data: {
        matchId,
        method: match.settlementMethod,
        status: SettlementStatus.PENDING,
      },
    });

    // Update match status
    await this.prisma.exchangeMatch.update({
      where: { id: matchId },
      data: { status: MatchStatus.SETTLING },
    });

    // Process based on settlement method
    if (match.settlementMethod === SettlementMethod.INTERNAL) {
      // Process internal settlement immediately
      await this.processInternalSettlement(matchId);
    } else {
      // Process external settlement
      await this.processExternalSettlement(
        matchId,
        input.externalEscrowProvider || 'tatum'
      );
    }

    return this.mapToSettlement(settlement);
  }

  /**
   * Process internal settlement (netting)
   */
  async processInternalSettlement(matchId: number): Promise<void> {
    const match = await this.prisma.exchangeMatch.findUnique({
      where: { id: matchId },
      include: {
        request: true,
        counterRequest: true,
        settlement: true,
      },
    });

    if (!match || !match.settlement) {
      throw new Error(`Match ${matchId} or settlement not found`);
    }

    try {
      // Internal netting: Update wallet balances
      await this.prisma.$transaction(async (tx) => {
        // User 1: Debit fromCurrency, Credit toCurrency
        // User 2: Debit fromCurrency, Credit toCurrency
        // This is handled by the internal-ledger-service

        // For now, we'll just mark as completed
        // TODO: Integrate with internal-ledger-service WalletService

        // Update settlement status
        await tx.settlement.update({
          where: { id: match.settlement!.id },
          data: {
            status: SettlementStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        // Update match status
        await tx.exchangeMatch.update({
          where: { id: matchId },
          data: { status: MatchStatus.COMPLETED },
        });

        // Update request statuses
        await tx.exchangeRequest.update({
          where: { id: match.requestId },
          data: {
            status: ExchangeStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        await tx.exchangeRequest.update({
          where: { id: match.counterRequestId },
          data: {
            status: ExchangeStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
      });

      // TODO: Notify both users
      // TODO: Update trust levels
      // TODO: Release security deposits
    } catch (error) {
      await this.failSettlement(
        match.settlement.id,
        `Internal settlement failed: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Process external settlement (PSP or external escrow)
   */
  async processExternalSettlement(
    matchId: number,
    provider: string
  ): Promise<void> {
    const match = await this.prisma.exchangeMatch.findUnique({
      where: { id: matchId },
      include: {
        request: true,
        counterRequest: true,
        settlement: true,
      },
    });

    if (!match || !match.settlement) {
      throw new Error(`Match ${matchId} or settlement not found`);
    }

    try {
      // Update settlement with provider info
      await this.prisma.settlement.update({
        where: { id: match.settlement.id },
        data: {
          status: SettlementStatus.PSP_PROCESSING,
          externalEscrowProvider: provider,
        },
      });

      // TODO: Integrate with external escrow provider
      // For now, simulate external processing
      // In production, this would call the ExternalEscrowService

      // Simulate async processing
      // The actual completion will be triggered by webhook
    } catch (error) {
      await this.failSettlement(
        match.settlement.id,
        `External settlement failed: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Handle PSP webhook
   */
  async handlePSPWebhook(
    provider: string,
    payload: PSPWebhookPayload
  ): Promise<void> {
    const { transactionId, status, metadata } = payload;

    // Find settlement by PSP transaction ID
    const settlement = await this.prisma.settlement.findFirst({
      where: {
        pspTransactionId: transactionId,
        pspProvider: provider,
      },
      include: {
        match: true,
      },
    });

    if (!settlement) {
      console.warn(`Settlement not found for PSP transaction ${transactionId}`);
      return;
    }

    // Handle based on PSP status
    switch (status) {
      case 'completed':
      case 'succeeded':
        await this.completeSettlement(settlement.id);
        break;

      case 'failed':
      case 'canceled':
        await this.failSettlement(
          settlement.id,
          metadata?.failureReason || 'PSP transaction failed'
        );
        break;

      case 'pending':
      case 'processing':
        // Update status but don't complete
        await this.prisma.settlement.update({
          where: { id: settlement.id },
          data: {
            pspStatus: status,
          },
        });
        break;

      default:
        console.warn(`Unknown PSP status: ${status}`);
    }
  }

  /**
   * Retry failed settlement
   */
  async retrySettlement(settlementId: number): Promise<void> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        match: {
          include: {
            request: true,
            counterRequest: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new SettlementNotFoundError(settlementId);
    }

    // Check if settlement can be retried
    if (settlement.status !== SettlementStatus.FAILED) {
      throw new InvalidSettlementStatusError(
        settlementId,
        settlement.status,
        'FAILED'
      );
    }

    // Check retry limit
    if (settlement.retryCount >= 3) {
      throw new Error(`Settlement ${settlementId} has exceeded retry limit`);
    }

    // Update retry count and status
    await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: SettlementStatus.PENDING,
        retryCount: settlement.retryCount + 1,
        failureReason: null,
        failedAt: null,
      },
    });

    // Retry based on method
    if (settlement.method === SettlementMethod.INTERNAL) {
      await this.processInternalSettlement(settlement.matchId);
    } else {
      await this.processExternalSettlement(
        settlement.matchId,
        settlement.externalEscrowProvider || 'tatum'
      );
    }
  }

  /**
   * Complete settlement
   */
  async completeSettlement(settlementId: number): Promise<void> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        match: {
          include: {
            request: true,
            counterRequest: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new SettlementNotFoundError(settlementId);
    }

    await this.prisma.$transaction(async (tx) => {
      // Update settlement status
      await tx.settlement.update({
        where: { id: settlementId },
        data: {
          status: SettlementStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Update match status
      await tx.exchangeMatch.update({
        where: { id: settlement.matchId },
        data: { status: MatchStatus.COMPLETED },
      });

      // Update request statuses
      await tx.exchangeRequest.update({
        where: { id: settlement.match.requestId },
        data: {
          status: ExchangeStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await tx.exchangeRequest.update({
        where: { id: settlement.match.counterRequestId },
        data: {
          status: ExchangeStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    });

    // TODO: Notify both users
    // TODO: Update trust levels
    // TODO: Release security deposits
    // TODO: Log event
  }

  /**
   * Fail settlement
   */
  async failSettlement(settlementId: number, reason: string): Promise<void> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        match: true,
      },
    });

    if (!settlement) {
      throw new SettlementNotFoundError(settlementId);
    }

    await this.prisma.$transaction(async (tx) => {
      // Update settlement status
      await tx.settlement.update({
        where: { id: settlementId },
        data: {
          status: SettlementStatus.FAILED,
          failedAt: new Date(),
          failureReason: reason,
        },
      });

      // Update match status
      await tx.exchangeMatch.update({
        where: { id: settlement.matchId },
        data: { status: MatchStatus.FAILED },
      });

      // Update request statuses to DISPUTED
      await tx.exchangeRequest.update({
        where: { id: settlement.match.requestId },
        data: { status: ExchangeStatus.DISPUTED },
      });

      await tx.exchangeRequest.update({
        where: { id: settlement.match.counterRequestId },
        data: { status: ExchangeStatus.DISPUTED },
      });
    });

    // TODO: Notify both users
    // TODO: Create dispute
    // TODO: Refund escrow
    // TODO: Log event
  }

  /**
   * Get settlement by ID
   */
  async getSettlement(settlementId: number): Promise<Settlement> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        match: {
          include: {
            request: true,
            counterRequest: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new SettlementNotFoundError(settlementId);
    }

    return this.mapToSettlement(settlement);
  }

  /**
   * Get settlement by match ID
   */
  async getSettlementByMatchId(matchId: number): Promise<Settlement | null> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { matchId },
    });

    if (!settlement) {
      return null;
    }

    return this.mapToSettlement(settlement);
  }

  /**
   * Check for settlement timeouts
   */
  async checkSettlementTimeouts(): Promise<void> {
    const timeoutThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    const timedOutSettlements = await this.prisma.settlement.findMany({
      where: {
        status: {
          in: [SettlementStatus.PENDING, SettlementStatus.PSP_PROCESSING],
        },
        initiatedAt: { lte: timeoutThreshold },
      },
    });

    for (const settlement of timedOutSettlements) {
      await this.prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          status: SettlementStatus.TIMEOUT,
          failedAt: new Date(),
          failureReason: 'Settlement timed out after 24 hours',
        },
      });

      // TODO: Notify users
      // TODO: Create dispute
      // TODO: Refund escrow
    }
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private mapToSettlement(data: any): Settlement {
    return {
      id: data.id,
      matchId: data.matchId,
      method: data.method,
      pspProvider: data.pspProvider,
      pspTransactionId: data.pspTransactionId,
      pspStatus: data.pspStatus,
      externalEscrowProvider: data.externalEscrowProvider,
      externalEscrowId: data.externalEscrowId,
      status: data.status,
      initiatedAt: data.initiatedAt,
      completedAt: data.completedAt,
      failedAt: data.failedAt,
      failureReason: data.failureReason,
      retryCount: data.retryCount,
    };
  }
}
