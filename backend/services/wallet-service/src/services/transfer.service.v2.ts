// ============================================================
// PHASE 4.1 — Transfer Service
// Atomic wallet-to-wallet transfers
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client';
import {
  LedgerEntry,
  EntryType,
  LedgerReason,
  ReferenceType,
  WalletStatus,
} from '../types';
import {
  WalletNotFoundError,
  WalletFrozenError,
  WalletClosedError,
  InsufficientBalanceError,
  InvalidAmountError,
  CurrencyMismatchError,
  DuplicateOperationError,
  ValidationError,
} from '../errors/wallet.errors';
import { generateIdempotencyKey, isPositiveAmount } from '../utils/money';

const prisma = new PrismaClient();

/**
 * Transfer Request
 */
export interface TransferRequest {
  fromWalletId: string;
  toWalletId: string;
  amount: bigint;
  reason: LedgerReason;
  referenceType: ReferenceType;
  referenceId?: string;
  description?: string;
  requestId?: string; // Idempotency key
  createdBy: string;
}

/**
 * Transfer Response
 */
export interface TransferResponse {
  transferId: string;
  fromEntry: {
    entryId: string;
    walletId: string;
    balanceBefore: string;
    balanceAfter: string;
  };
  toEntry: {
    entryId: string;
    walletId: string;
    balanceBefore: string;
    balanceAfter: string;
  };
  amount: string;
  currency: string;
  reason: LedgerReason;
  referenceType: ReferenceType;
  referenceId: string | null;
  idempotencyKey: string;
  createdAt: string;
  isIdempotent: boolean;
}

/**
 * Transfer Service
 * 
 * Implements atomic wallet-to-wallet transfers with:
 * - Single transaction (all or nothing)
 * - Double-entry bookkeeping (debit + credit)
 * - Currency validation
 * - Rollback on any failure
 */
export const transferService = {
  // ============================================================
  // TRANSFER FUNDS
  // Atomic wallet-to-wallet transfer
  // ============================================================

  /**
   * Transfer funds between wallets atomically
   * 
   * @param request - Transfer request
   * @returns Transfer result with both ledger entries
   * 
   * Transaction Flow:
   * 1. Lock both wallets (in consistent order to prevent deadlock)
   * 2. Validate both wallets active
   * 3. Validate currency match
   * 4. Validate source has sufficient balance
   * 5. Create DEBIT entry on source wallet
   * 6. Create CREDIT entry on destination wallet
   * 7. Commit transaction
   * 
   * On any failure: Full rollback, no money moves
   */
  async transferFunds(request: TransferRequest): Promise<TransferResponse> {
    // Validate amount
    if (!isPositiveAmount(request.amount)) {
      throw new InvalidAmountError('Amount must be greater than 0');
    }

    // Cannot transfer to same wallet
    if (request.fromWalletId === request.toWalletId) {
      throw new ValidationError(
        'Cannot transfer to the same wallet',
        'لا يمكن التحويل إلى نفس المحفظة'
      );
    }

    // Generate transfer ID and idempotency key
    const transferId = crypto.randomUUID();
    const idempotencyKey = request.requestId || generateIdempotencyKey(
      `transfer_${request.reason}`,
      request.referenceId || transferId,
      request.amount
    );

    // Check for existing transfer (idempotency)
    const existingTransfer = await this.findByIdempotencyKey(
      request.fromWalletId,
      `transfer_out:${idempotencyKey}`
    );
    if (existingTransfer) {
      return this.reconstructTransferResponse(existingTransfer, true);
    }

    // Execute atomic transfer
    return await this.executeAtomicTransfer({
      ...request,
      transferId,
      idempotencyKey,
    });
  },

  // ============================================================
  // ATOMIC TRANSFER EXECUTION
  // Single transaction with double-entry
  // ============================================================

  async executeAtomicTransfer(
    request: {
      fromWalletId: string;
      toWalletId: string;
      amount: bigint;
      reason: LedgerReason;
      referenceType: ReferenceType;
      referenceId?: string;
      description?: string;
      transferId: string;
      idempotencyKey: string;
      createdBy: string;
    },
    externalTx?: Prisma.TransactionClient // Optional external transaction
  ): Promise<TransferResponse> {

    // Definition of the transfer work
    const transferWork = async (tx: Prisma.TransactionClient) => {
      // --------------------------------------------------------
      // STEP 1: Lock both wallets in consistent order
      // Always lock lower ID first to prevent deadlocks
      // --------------------------------------------------------
      const walletIds = [request.fromWalletId, request.toWalletId].sort();
      
      const walletRows = await tx.$queryRaw<Array<{
        id: string;
        status: string;
        currency: string;
        owner_type: string;
        owner_id: string;
      }>>`
        SELECT id, status, currency, owner_type, owner_id
        FROM wallet 
        WHERE id IN (${walletIds[0]}::uuid, ${walletIds[1]}::uuid)
        ORDER BY id
        FOR UPDATE
      `;

      if (walletRows.length !== 2) {
        // Find which wallet is missing
        const foundIds = walletRows.map(w => w.id);
        if (!foundIds.includes(request.fromWalletId)) {
          throw new WalletNotFoundError(request.fromWalletId);
        }
        throw new WalletNotFoundError(request.toWalletId);
      }

      // Map wallets by ID
      const fromWallet = walletRows.find(w => w.id === request.fromWalletId)!;
      const toWallet = walletRows.find(w => w.id === request.toWalletId)!;

      // --------------------------------------------------------
      // STEP 2: Validate wallet statuses
      // --------------------------------------------------------
      if (fromWallet.status === 'FROZEN') {
        throw new WalletFrozenError(request.fromWalletId);
      }
      if (fromWallet.status === 'CLOSED') {
        throw new WalletClosedError(request.fromWalletId);
      }
      if (toWallet.status === 'FROZEN') {
        throw new WalletFrozenError(request.toWalletId);
      }
      if (toWallet.status === 'CLOSED') {
        throw new WalletClosedError(request.toWalletId);
      }

      // --------------------------------------------------------
      // STEP 3: Validate currency match
      // --------------------------------------------------------
      if (fromWallet.currency !== toWallet.currency) {
        throw new CurrencyMismatchError(fromWallet.currency, toWallet.currency);
      }

      const currency = fromWallet.currency;

      // --------------------------------------------------------
      // STEP 4: Get current balances
      // --------------------------------------------------------
      const fromBalanceRow = await tx.$queryRaw<Array<{ balance_after: bigint }>>`
        SELECT balance_after FROM ledger_entry 
        WHERE wallet_id = ${request.fromWalletId}::uuid
        ORDER BY created_at DESC LIMIT 1
      `;
      const fromCurrentBalance = fromBalanceRow.length > 0 
        ? BigInt(fromBalanceRow[0].balance_after) 
        : BigInt(0);

      const toBalanceRow = await tx.$queryRaw<Array<{ balance_after: bigint }>>`
        SELECT balance_after FROM ledger_entry 
        WHERE wallet_id = ${request.toWalletId}::uuid
        ORDER BY created_at DESC LIMIT 1
      `;
      const toCurrentBalance = toBalanceRow.length > 0 
        ? BigInt(toBalanceRow[0].balance_after) 
        : BigInt(0);

      // --------------------------------------------------------
      // STEP 5: Validate sufficient balance
      // --------------------------------------------------------
      if (fromCurrentBalance < request.amount) {
        throw new InsufficientBalanceError(fromCurrentBalance, request.amount);
      }

      // --------------------------------------------------------
      // STEP 6: Calculate new balances
      // --------------------------------------------------------
      const fromNewBalance = fromCurrentBalance - request.amount;
      const toNewBalance = toCurrentBalance + request.amount;

      // --------------------------------------------------------
      // STEP 7: Create DEBIT entry (source wallet)
      // --------------------------------------------------------
      const debitEntryId = crypto.randomUUID();
      const now = new Date();
      const debitDescription = request.description || 
        `Transfer to ${toWallet.owner_type}:${toWallet.owner_id}`;

      try {
        await tx.$executeRaw`
          INSERT INTO ledger_entry (
            id, wallet_id, entry_type, amount, reason, description,
            reference_type, reference_id, idempotency_key, balance_after,
            created_at, created_by
          ) VALUES (
            ${debitEntryId}::uuid,
            ${request.fromWalletId}::uuid,
            'DEBIT'::"entry_type",
            ${request.amount}::bigint,
            ${LedgerReason.TRANSFER_OUT}::"ledger_reason",
            ${debitDescription},
            ${request.referenceType}::"reference_type",
            ${request.transferId},
            ${'transfer_out:' + request.idempotencyKey},
            ${fromNewBalance}::bigint,
            ${now},
            ${request.createdBy}
          )
        `;
      } catch (error: any) {
        if (error.code === 'P2002' || error.message?.includes('unique constraint')) {
          throw new DuplicateOperationError(request.idempotencyKey);
        }
        throw error;
      }

      // --------------------------------------------------------
      // STEP 8: Create CREDIT entry (destination wallet)
      // --------------------------------------------------------
      const creditEntryId = crypto.randomUUID();
      const creditDescription = request.description || 
        `Transfer from ${fromWallet.owner_type}:${fromWallet.owner_id}`;

      await tx.$executeRaw`
        INSERT INTO ledger_entry (
          id, wallet_id, entry_type, amount, reason, description,
          reference_type, reference_id, idempotency_key, balance_after,
          created_at, created_by
        ) VALUES (
          ${creditEntryId}::uuid,
          ${request.toWalletId}::uuid,
          'CREDIT'::"entry_type",
          ${request.amount}::bigint,
          ${LedgerReason.TRANSFER_IN}::"ledger_reason",
          ${creditDescription},
          ${request.referenceType}::"reference_type",
          ${request.transferId},
          ${'transfer_in:' + request.idempotencyKey},
          ${toNewBalance}::bigint,
          ${now},
          ${request.createdBy}
        )
      `;

      // --------------------------------------------------------
      // STEP 9: Update wallet timestamps
      // --------------------------------------------------------
      await tx.$executeRaw`
        UPDATE wallet SET updated_at = ${now}
        WHERE id IN (${request.fromWalletId}::uuid, ${request.toWalletId}::uuid)
      `;

      // --------------------------------------------------------
      // STEP 10: Return result
      // --------------------------------------------------------
      return {
        transferId: request.transferId,
        fromEntry: {
          entryId: debitEntryId,
          walletId: request.fromWalletId,
          balanceBefore: fromCurrentBalance,
          balanceAfter: fromNewBalance,
        },
        toEntry: {
          entryId: creditEntryId,
          walletId: request.toWalletId,
          balanceBefore: toCurrentBalance,
          balanceAfter: toNewBalance,
        },
        amount: request.amount,
        currency,
        reason: request.reason,
        referenceType: request.referenceType,
        referenceId: request.referenceId || null,
        idempotencyKey: request.idempotencyKey,
        createdAt: now,
      };
    };

    // Execute logic using provided transaction or new one
    let result;
    if (externalTx) {
      result = await transferWork(externalTx);
    } else {
      result = await prisma.$transaction(transferWork, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15000,
      });
    }

    return {
      transferId: result.transferId,
      fromEntry: {
        entryId: result.fromEntry.entryId,
        walletId: result.fromEntry.walletId,
        balanceBefore: result.fromEntry.balanceBefore.toString(),
        balanceAfter: result.fromEntry.balanceAfter.toString(),
      },
      toEntry: {
        entryId: result.toEntry.entryId,
        walletId: result.toEntry.walletId,
        balanceBefore: result.toEntry.balanceBefore.toString(),
        balanceAfter: result.toEntry.balanceAfter.toString(),
      },
      amount: result.amount.toString(),
      currency: result.currency,
      reason: result.reason,
      referenceType: result.referenceType,
      referenceId: result.referenceId,
      idempotencyKey: result.idempotencyKey,
      createdAt: result.createdAt.toISOString(),
      isIdempotent: false,
    };
  },

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  /**
   * Find transfer by idempotency key
   */
  async findByIdempotencyKey(walletId: string, idempotencyKey: string): Promise<LedgerEntry | null> {
    const entry = await prisma.ledgerEntry.findFirst({
      where: {
        walletId,
        idempotencyKey,
      },
    });

    if (!entry) return null;

    return {
      id: entry.id,
      walletId: entry.walletId,
      entryType: entry.entryType as EntryType,
      amount: BigInt(entry.amount),
      reason: entry.reason as LedgerReason,
      description: entry.description,
      referenceType: entry.referenceType as ReferenceType,
      referenceId: entry.referenceId,
      idempotencyKey: entry.idempotencyKey,
      balanceAfter: BigInt(entry.balanceAfter),
      createdAt: entry.createdAt,
      createdBy: entry.createdBy,
    };
  },

  /**
   * Reconstruct transfer response from existing entry (idempotent return)
   */
  async reconstructTransferResponse(
    debitEntry: LedgerEntry,
    isIdempotent: boolean
  ): Promise<TransferResponse> {
    // Find the matching credit entry
    const transferId = debitEntry.referenceId!;
    
    const creditEntry = await prisma.ledgerEntry.findFirst({
      where: {
        referenceId: transferId,
        entryType: 'CREDIT',
        reason: 'TRANSFER_IN',
      },
    });

    if (!creditEntry) {
      throw new Error('Transfer credit entry not found - data inconsistency');
    }

    // Get wallet currency
    const wallet = await prisma.wallet.findUnique({
      where: { id: debitEntry.walletId },
      select: { currency: true },
    });

    return {
      transferId,
      fromEntry: {
        entryId: debitEntry.id,
        walletId: debitEntry.walletId,
        balanceBefore: (debitEntry.balanceAfter + debitEntry.amount).toString(),
        balanceAfter: debitEntry.balanceAfter.toString(),
      },
      toEntry: {
        entryId: creditEntry.id,
        walletId: creditEntry.walletId,
        balanceBefore: (BigInt(creditEntry.balanceAfter) - BigInt(creditEntry.amount)).toString(),
        balanceAfter: creditEntry.balanceAfter.toString(),
      },
      amount: debitEntry.amount.toString(),
      currency: wallet?.currency || 'EGP',
      reason: debitEntry.reason,
      referenceType: debitEntry.referenceType,
      referenceId: debitEntry.referenceId,
      idempotencyKey: debitEntry.idempotencyKey.replace('transfer_out:', ''),
      createdAt: debitEntry.createdAt.toISOString(),
      isIdempotent,
    };
  },
};
