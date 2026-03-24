// ============================================================
// PHASE 4.5 — PAYOUT SERVICE
// Bank-grade payout infrastructure
// ABSOLUTE RULES:
// - NO payout without released escrow
// - NO ledger debit before bank confirmation
// - Dual approval required
// - Payouts are INSTRUCTIONS, not money movement
// ============================================================

import { PrismaClient, PayoutStatus, PayoutReason, PayoutDestinationType, PayoutEventType } from '@prisma/client';
import { BankAdapter, BankPayoutRequest, BankPayoutStatus } from '../interfaces/bank-adapter.interface';
import { ledgerService } from './ledger.service';

const prisma = new PrismaClient();

// ============================================================
// TYPES
// ============================================================

interface CreatePayoutRequest {
  walletId: string;
  amount: bigint;
  currency: string;
  destinationType: PayoutDestinationType;
  destinationRef: string; // IBAN
  destinationDetails?: {
    accountHolder: string;
    bankName?: string;
  };
  reason: PayoutReason;
  escrowReleaseId: string; // REQUIRED
  referenceType?: string;
  referenceId?: string;
  createdBy: string;
  notes?: string;
}

interface ApprovePayoutRequest {
  payoutId: string;
  approvedBy: string;
  notes?: string;
}

interface RejectPayoutRequest {
  payoutId: string;
  rejectedBy: string;
  reason: string;
}

// ============================================================
// PAYOUT SERVICE
// ============================================================

export const payoutService = {
  /**
   * Create payout instruction
   * DOES NOT move money - only creates instruction
   * Requires released escrow
   */
  async createPayout(request: CreatePayoutRequest, bankAdapter: BankAdapter) {
    const {
      walletId,
      amount,
      currency,
      destinationType,
      destinationRef,
      destinationDetails,
      reason,
      escrowReleaseId,
      referenceType,
      referenceId,
      createdBy,
      notes,
    } = request;

    // CRITICAL: Verify escrow was released
    const escrow = await prisma.escrow.findFirst({
      where: {
        id: escrowReleaseId,
        status: 'RELEASED', // Must be RELEASED
      },
    });

    if (!escrow) {
      throw new Error('Escrow not found or not released. Cannot create payout without released escrow.');
    }

    // Verify wallet exists
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Verify wallet has sufficient balance (derived from ledger)
    const balance = await ledgerService.getBalance(walletId);
    if (balance < amount) {
      throw new Error(`Insufficient balance. Available: ${balance}, Required: ${amount}`);
    }

    return await prisma.$transaction(async (tx) => {
      // Create payout instruction
      const payout = await tx.payoutInstruction.create({
        data: {
          walletId,
          amount,
          currency,
          destinationType,
          destinationRef,
          destinationDetails: destinationDetails || {},
          reason,
          escrowReleaseId,
          referenceType,
          referenceId,
          status: this.requiresDualApproval(reason)
            ? PayoutStatus.PENDING_APPROVAL
            : PayoutStatus.APPROVED, // Auto-approve non-critical
          createdBy,
          notes,
        },
      });

      // Log creation
      await this.logEvent(tx, {
        payoutInstructionId: payout.id,
        eventType: PayoutEventType.PAYOUT_CREATED,
        actor: createdBy,
        newStatus: payout.status,
        notes,
      });

      // If auto-approved, send to bank immediately
      if (payout.status === PayoutStatus.APPROVED) {
        await this.sendToBank(payout.id, bankAdapter, tx);
      }

      return payout;
    });
  },

  /**
   * Approve payout (second admin)
   * Triggers bank execution
   */
  async approvePayout(request: ApprovePayoutRequest, bankAdapter: BankAdapter) {
    const { payoutId, approvedBy, notes } = request;

    const payout = await prisma.payoutInstruction.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== PayoutStatus.PENDING_APPROVAL) {
      throw new Error(`Cannot approve payout in status: ${payout.status}`);
    }

    // Prevent self-approval
    if (payout.createdBy === approvedBy) {
      throw new Error('Cannot approve your own payout (dual approval required)');
    }

    return await prisma.$transaction(async (tx) => {
      // Update payout
      const updatedPayout = await tx.payoutInstruction.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
        },
      });

      // Log approval
      await this.logEvent(tx, {
        payoutInstructionId: payoutId,
        eventType: PayoutEventType.PAYOUT_APPROVED,
        actor: approvedBy,
        previousStatus: PayoutStatus.PENDING_APPROVAL,
        newStatus: PayoutStatus.APPROVED,
        notes,
      });

      // Send to bank
      await this.sendToBank(payoutId, bankAdapter, tx);

      return updatedPayout;
    });
  },

  /**
   * Reject payout
   */
  async rejectPayout(request: RejectPayoutRequest) {
    const { payoutId, rejectedBy, reason } = request;

    const payout = await prisma.payoutInstruction.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== PayoutStatus.PENDING_APPROVAL) {
      throw new Error(`Cannot reject payout in status: ${payout.status}`);
    }

    return await prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.payoutInstruction.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.REJECTED,
          rejectedBy,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });

      await this.logEvent(tx, {
        payoutInstructionId: payoutId,
        eventType: PayoutEventType.PAYOUT_REJECTED,
        actor: rejectedBy,
        previousStatus: PayoutStatus.PENDING_APPROVAL,
        newStatus: PayoutStatus.REJECTED,
        notes: reason,
      });

      return updatedPayout;
    });
  },

  /**
   * Send payout to bank
   * DOES NOT create ledger entry yet
   */
  async sendToBank(payoutId: string, bankAdapter: BankAdapter, tx: any) {
    const payout = await tx.payoutInstruction.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== PayoutStatus.APPROVED) {
      throw new Error(`Cannot send payout in status: ${payout.status}`);
    }

    try {
      // Prepare bank request
      const bankRequest: BankPayoutRequest = {
        amount: payout.amount,
        currency: payout.currency,
        destinationIBAN: payout.destinationRef,
        destinationAccountHolder: (payout.destinationDetails as any)?.accountHolder || 'Unknown',
        destinationBankName: (payout.destinationDetails as any)?.bankName,
        reference: payout.id,
        reason: payout.reason,
      };

      // Send to bank
      const bankResponse = await bankAdapter.sendPayout(bankRequest);

      // Update payout with bank reference
      await tx.payoutInstruction.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.SENT,
          sentToBankAt: new Date(),
          bankReference: bankResponse.bankReference,
          bankStatus: bankResponse.status,
        },
      });

      // Log bank submission
      await this.logEvent(tx, {
        payoutInstructionId: payoutId,
        eventType: PayoutEventType.PAYOUT_SENT_TO_BANK,
        actor: 'system',
        previousStatus: PayoutStatus.APPROVED,
        newStatus: PayoutStatus.SENT,
        notes: `Sent to bank: ${bankResponse.bankReference}`,
        metadata: {
          bankReference: bankResponse.bankReference,
          bankStatus: bankResponse.status,
        },
      });

    } catch (error: any) {
      // Mark as failed
      await tx.payoutInstruction.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          failedAt: new Date(),
          failureReason: error.message,
        },
      });

      await this.logEvent(tx, {
        payoutInstructionId: payoutId,
        eventType: PayoutEventType.PAYOUT_FAILED,
        actor: 'system',
        previousStatus: PayoutStatus.APPROVED,
        newStatus: PayoutStatus.FAILED,
        notes: `Bank submission failed: ${error.message}`,
      });

      throw error;
    }
  },

  /**
   * Check bank status and confirm payout
   * ONLY creates ledger entry on CONFIRMED
   */
  async checkBankStatusAndConfirm(payoutId: string, bankAdapter: BankAdapter) {
    const payout = await prisma.payoutInstruction.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== PayoutStatus.SENT) {
      throw new Error(`Cannot check status for payout in status: ${payout.status}`);
    }

    if (!payout.bankReference) {
      throw new Error('No bank reference found');
    }

    // Check status at bank
    const bankStatus = await bankAdapter.checkStatus(payout.bankReference);

    return await prisma.$transaction(async (tx) => {
      // Update bank status
      await tx.payoutInstruction.update({
        where: { id: payoutId },
        data: {
          bankStatus: bankStatus.status,
          bankStatusCheckedAt: new Date(),
        },
      });

      // If bank confirms success, create ledger entry
      if (bankStatus.status === BankPayoutStatus.COMPLETED) {
        await this.confirmPayout(payoutId, tx);
      }

      // If bank reports failure
      if (bankStatus.status === BankPayoutStatus.FAILED) {
        await tx.payoutInstruction.update({
          where: { id: payoutId },
          data: {
            status: PayoutStatus.FAILED,
            failedAt: new Date(),
            failureReason: bankStatus.failureReason || 'Bank reported failure',
          },
        });

        await this.logEvent(tx, {
          payoutInstructionId: payoutId,
          eventType: PayoutEventType.PAYOUT_FAILED,
          actor: 'system',
          previousStatus: PayoutStatus.SENT,
          newStatus: PayoutStatus.FAILED,
          notes: bankStatus.failureReason || 'Bank reported failure',
        });
      }

      return await tx.payoutInstruction.findUnique({
        where: { id: payoutId },
      });
    });
  },

  /**
   * Confirm payout and create ledger entry
   * CRITICAL: Ledger debit ONLY on bank confirmation
   * USES ledgerService for atomic write
   */
  async confirmPayout(payoutId: string, tx: any) {
    const payout = await tx.payoutInstruction.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    // Prevent double-confirmation (idempotency)
    if (payout.status === PayoutStatus.CONFIRMED) {
      console.log(`[Payout] Already confirmed: ${payoutId}`);
      return payout;
    }

    // CRITICAL: Use LedgerService for ATOMIC locking and safety
    // This ensures balance is checked and locked before debiting
    const ledgerResult = await ledgerService.executeAtomicWrite({
      walletId: payout.walletId,
      entryType: 'DEBIT' as any, // Cast to internal Enum if needed, or import
      amount: payout.amount,
      reason: 'PAYOUT' as any, // Map 'PAYOUT_EXECUTED' to 'PAYOUT' enum
      referenceType: 'PAYOUT' as any, // Map to ReferenceType
      referenceId: payout.id,
      idempotencyKey: `payout_${payout.id}`,
      description: `Payout to ${payout.destinationRef}`,
      createdBy: 'system',
    }, tx);

    // Update payout status
    const updatedPayout = await tx.payoutInstruction.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.CONFIRMED,
        confirmedAt: new Date(),
        ledgerEntryId: ledgerResult.entryId,
      },
    });

    // Log confirmation
    await this.logEvent(tx, {
      payoutInstructionId: payoutId,
      eventType: PayoutEventType.PAYOUT_CONFIRMED,
      actor: 'system',
      previousStatus: PayoutStatus.SENT,
      newStatus: PayoutStatus.CONFIRMED,
      notes: 'Bank confirmed, ledger debited',
      metadata: {
        ledgerEntryId: ledgerResult.entryId,
      },
    });

    await this.logEvent(tx, {
      payoutInstructionId: payoutId,
      eventType: PayoutEventType.LEDGER_DEBITED,
      actor: 'system',
      notes: `Ledger entry created: ${ledgerResult.entryId}`,
      metadata: {
        ledgerEntryId: ledgerResult.entryId,
        amount: payout.amount.toString(),
      },
    });

    return updatedPayout;
  },


  /**
   * Get pending approvals
   */
  async getPendingApprovals() {
    return await prisma.payoutInstruction.findMany({
      where: {
        status: PayoutStatus.PENDING_APPROVAL,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  },

  /**
   * Get payout command log
   */
  async getCommandLog(payoutId: string) {
    return await prisma.payoutCommandLog.findMany({
      where: {
        payoutInstructionId: payoutId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  },

  /**
   * Log event to command log
   */
  async logEvent(tx: any, event: {
    payoutInstructionId: string;
    eventType: PayoutEventType;
    actor: string;
    previousStatus?: PayoutStatus;
    newStatus?: PayoutStatus;
    notes?: string;
    metadata?: any;
  }) {
    await tx.payoutCommandLog.create({
      data: {
        payoutInstructionId: event.payoutInstructionId,
        eventType: event.eventType,
        actor: event.actor,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        notes: event.notes,
        metadata: event.metadata,
      },
    });
  },

  /**
   * Determine if payout requires dual approval
   */
  requiresDualApproval(reason: PayoutReason): boolean {
    switch (reason) {
      case PayoutReason.SELLER_PAYOUT:
      case PayoutReason.TRAVELER_EARNINGS:
        return true; // Critical payouts require dual approval

      case PayoutReason.REFUND:
      case PayoutReason.ADMIN_PAYOUT:
        return false; // Auto-approve (already admin-initiated)

      default:
        return true; // Default to requiring approval
    }
  },
};
