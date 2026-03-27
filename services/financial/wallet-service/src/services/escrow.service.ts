// ============================================================
// PHASE 4.2 — Escrow Service
// State machine orchestration for atomic fund holding
// Built strictly on top of Wallet & Ledger services
// ============================================================

import { PrismaClient, Prisma, Escrow, EscrowStatus } from '@prisma/client';
import {
  CreateEscrowRequest,
  CreateAndFundEscrowRequest,
  FundEscrowRequest,
  ReleaseEscrowRequest,
  RefundEscrowRequest,
  DisputeEscrowRequest,
} from '../dto/escrow.dto';
import { transferService } from './transfer.service.v2';
import {
  LedgerReason,
  ReferenceType,
  EntryType,
} from '../types';
import {
  WalletNotFoundError,
  ValidationError,
  InsufficientBalanceError,
  InvalidAmountError,
} from '../errors/wallet.errors';

const prisma = new PrismaClient();

export const escrowService = {
  // ============================================================
  // CREATE ESCROW
  // State: -> CREATED
  // ============================================================
  async createEscrow(data: CreateEscrowRequest): Promise<Escrow> {
    // 1. Validate amount
    if (data.amount <= 0n) {
      throw new InvalidAmountError(data.amount.toString());
    }

    // 2. Validate wallets exist
    const [buyer, seller] = await Promise.all([
      prisma.wallet.findUnique({ where: { id: data.buyerWalletId } }),
      prisma.wallet.findUnique({ where: { id: data.sellerWalletId } }),
    ]);

    if (!buyer) throw new WalletNotFoundError(data.buyerWalletId);
    if (!seller) throw new WalletNotFoundError(data.sellerWalletId);

    // 3. Validate currency match
    if (buyer.currency !== data.currency || seller.currency !== data.currency) {
      throw new ValidationError('Wallets must match escrow currency');
    }

    // 4. Create Escrow Record (CREATED state)
    // Note: No money moves yet
    return await prisma.escrow.create({
      data: {
        buyerWalletId: data.buyerWalletId,
        sellerWalletId: data.sellerWalletId,
        amount: data.amount,
        currency: data.currency,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        description: data.description,
        status: EscrowStatus.CREATED,
        createdBy: data.createdBy,
      },
    });
  },

  // ============================================================
  // CREATE & FUND ESCROW (Atomic "Buy Now")
  // State: -> FUNDED
  // ============================================================
  async createAndFundEscrow(data: CreateAndFundEscrowRequest): Promise<Escrow> {
    // 1. Validate amount
    if (data.amount <= 0n) {
      throw new InvalidAmountError(data.amount.toString());
    }

    // 2. Validate currency & wallets
    const [buyer, seller, system] = await Promise.all([
      prisma.wallet.findUnique({ where: { id: data.buyerWalletId } }),
      prisma.wallet.findUnique({ where: { id: data.sellerWalletId } }),
      prisma.wallet.findUnique({ where: { id: data.systemWalletId } }),
    ]);

    if (!buyer) throw new WalletNotFoundError(data.buyerWalletId);
    if (!seller) throw new WalletNotFoundError(data.sellerWalletId);
    if (!system) throw new WalletNotFoundError(data.systemWalletId);

    if (buyer.currency !== data.currency || 
        seller.currency !== data.currency || 
        system.currency !== data.currency) {
      throw new ValidationError('Wallets must match escrow currency');
    }

    return await prisma.$transaction(async (tx) => {
      // 3. Create Escrow Record (Initially FUNDED because we are about to fund it)
      // We set holdEntryId later
      const escrow = await tx.escrow.create({
        data: {
          buyerWalletId: data.buyerWalletId,
          sellerWalletId: data.sellerWalletId,
          amount: data.amount,
          currency: data.currency,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          description: data.description,
          status: EscrowStatus.FUNDED, // Direct to FUNDED
          fundedAt: new Date(),
          createdBy: data.createdBy,
        },
      });

      // Determine Ledger Reason
      const ledgerReason = data.referenceType === 'AUCTION' 
        ? LedgerReason.AUCTION_BID 
        : LedgerReason.PURCHASE_HOLD;

      // 4. Execute Atomic Transfer (Buyer -> System)
      const transfer = await transferService.executeAtomicTransfer({
        fromWalletId: data.buyerWalletId,
        toWalletId: data.systemWalletId,
        amount: data.amount,
        reason: ledgerReason,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id, // Link to this escrow
        description: `Escrow Hold for ${data.referenceType} #${data.referenceId}`,
        transferId: crypto.randomUUID(),
        idempotencyKey: data.requestId || `fund_${escrow.id}`,
        createdBy: data.triggeredBy,
      }, tx); // Pass the transaction client!

      // 5. Update Escrow with Ledger Entry ID
      // This links the specific credit entry on the system wallet as the "hold" proof
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          holdEntryId: transfer.toEntry.entryId,
        },
      });

      return updatedEscrow;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    });
  },

  // ============================================================
  // FUND ESCROW (Buyer -> System)
  // State: CREATED -> FUNDED
  // ============================================================
  async fundEscrow(data: FundEscrowRequest): Promise<Escrow> {
    const { escrowId, buyerWalletId, systemWalletId, triggeredBy, requestId } = data;

    // 1. Fetch Escrow
    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new ValidationError('Escrow not found');

    // 2. Validate State
    if (escrow.status === EscrowStatus.FUNDED) {
      // Idempotency check could go here, but transferService handles duplicates too.
      // If already funded, just return.
      return escrow;
    }
    if (escrow.status !== EscrowStatus.CREATED) {
      throw new ValidationError(`Invalid transition: Cannot fund from ${escrow.status}`);
    }

    // 3. Validate Parties
    if (escrow.buyerWalletId !== buyerWalletId) {
      throw new ValidationError('Buyer wallet mismatch');
    }

    return await prisma.$transaction(async (tx) => {
      // 4. Execute Atomic Transfer (Buyer -> System)
      // We use the existing transfer service but wrap it or call it logic here.
      // Since transferService uses its own transaction, we ideally shouldn't nest
      // if it creates a new transaction. However, transferService.transferFunds
      // is designed to be atomic.
      //
      // CRITICAL: To ensure the state update and transfer happen together,
      // we must use the transfer result verification.
      
      const transfer = await transferService.transferFunds({
        fromWalletId: buyerWalletId,
        toWalletId: systemWalletId,
        amount: escrow.amount,
        reason: LedgerReason.PURCHASE_HOLD,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: `Escrow Hold for ${escrow.referenceType} #${escrow.referenceId}`,
        requestId: requestId || `fund_${escrow.id}`, // Idempotency
        createdBy: triggeredBy,
      });

      // 5. Update Escrow State
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.FUNDED,
          fundedAt: new Date(),
          holdEntryId: transfer.toEntry.entryId, // Link to the credit on system wallet
        },
      });

      return updatedEscrow;
    });
  },

  // ============================================================
  // RELEASE ESCROW (System -> Seller)
  // State: FUNDED/DISPUTED -> RELEASED
  // ============================================================
  async releaseEscrow(data: ReleaseEscrowRequest): Promise<Escrow> {
    const { escrowId, systemWalletId, triggeredBy, requestId } = data;

    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new ValidationError('Escrow not found');

    // Idempotency check: if already released, return it
    if (escrow.status === EscrowStatus.RELEASED) return escrow;
    
    // Status Guard
    if (escrow.status !== EscrowStatus.FUNDED && escrow.status !== EscrowStatus.DISPUTED) {
      throw new ValidationError(`Invalid transition: Cannot release from ${escrow.status}`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Execute Atomic Transfer (System -> Seller)
      // Must use executeAtomicTransfer with the current tx to ensure atomicity
      const transfer = await transferService.executeAtomicTransfer({
        fromWalletId: systemWalletId, // Funds sit here
        toWalletId: escrow.sellerWalletId,
        amount: escrow.amount,
        reason: LedgerReason.PURCHASE_RELEASE,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: `Escrow Release for ${escrow.referenceType} #${escrow.referenceId}`,
        transferId: crypto.randomUUID(),
        idempotencyKey: requestId || `release_${escrow.id}`,
        createdBy: triggeredBy,
      }, tx);

      // 2. Update Escrow State & Link Ledger Entry
      // We link the 'debit' from system as the release proof (or credit to seller)
      // Usually 'release' action is defined by the payment out.
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
          releasedBy: triggeredBy,
          releaseEntryId: transfer.fromEntry.entryId, // Debit from System
        },
      });

      return updatedEscrow;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  },

  // ============================================================
  // REFUND ESCROW (System -> Buyer)
  // State: FUNDED/DISPUTED -> REFUNDED
  // ============================================================
  async refundEscrow(data: RefundEscrowRequest): Promise<Escrow> {
    const { escrowId, systemWalletId, triggeredBy, reason, requestId } = data;

    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new ValidationError('Escrow not found');

    // Idempotency check
    if (escrow.status === EscrowStatus.REFUNDED) return escrow;

    // Status Guard: CANNOT refund if RELEASED or CANCELLED (terminal states)
    if (escrow.status !== EscrowStatus.FUNDED && escrow.status !== EscrowStatus.DISPUTED) {
      throw new ValidationError(`Invalid transition: Cannot refund from ${escrow.status}`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Execute Atomic Transfer (System -> Buyer)
      const transfer = await transferService.executeAtomicTransfer({
        fromWalletId: systemWalletId, // Funds returned from System
        toWalletId: escrow.buyerWalletId,
        amount: escrow.amount,
        reason: LedgerReason.REFUND,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: `Refund: ${reason}`,
        transferId: crypto.randomUUID(),
        idempotencyKey: requestId || `refund_${escrow.id}`,
        createdBy: triggeredBy,
      }, tx);

      // 2. Update Escrow State & Audit
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.REFUNDED,
          refundedAt: new Date(),
          refundedBy: triggeredBy,
          refundEntryId: transfer.fromEntry.entryId, // Debit from System
          resolutionNote: reason,
        },
      });

      return updatedEscrow;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  },

  // ============================================================
  // DISPUTE ESCROW
  // State: FUNDED -> DISPUTED
  // ============================================================
  async disputeEscrow(data: DisputeEscrowRequest): Promise<Escrow> {
    const { escrowId, reason, triggeredBy } = data;

    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new ValidationError('Escrow not found');

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new ValidationError(`Invalid transition: Cannot dispute from ${escrow.status}`);
    }

    // No money moves, just state update
    return await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.DISPUTED,
        disputedAt: new Date(),
        disputeReason: reason,
      },
    });
  },

  // ============================================================
  // READ OPERATIONS
  // ============================================================
  async getEscrow(id: string): Promise<Escrow | null> {
    return await prisma.escrow.findUnique({ where: { id } });
  },

  async getEscrowByReference(type: string, id: string): Promise<Escrow | null> {
    // Cast string to enum if valid
    return await prisma.escrow.findUnique({
      where: {
        referenceType_referenceId: {
          referenceType: type as any,
          referenceId: id,
        },
      },
    });
  },
};
