// ============================================================
// PHASE 4.1 — Ledger Service (CRITICAL)
// Append-only ledger with atomic operations
// ============================================================

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  LedgerEntry,
  EntryType,
  LedgerReason,
  ReferenceType,
} from '../types';
import { generateIdempotencyKey, isPositiveAmount } from '../utils/money';

/**
 * Credit/Debit Request
 */
export interface LedgerWriteRequest {
  walletId: string;
  amount: bigint;
  reason: LedgerReason;
  referenceType: ReferenceType;
  referenceId?: string;
  description?: string;
  requestId?: string; // Idempotency key from client
  createdBy: string;
}

/**
 * Ledger Write Response
 */
export interface LedgerWriteResponse {
  entryId: string;
  walletId: string;
  entryType: EntryType;
  amount: string;
  reason: LedgerReason;
  balanceBefore: string;
  balanceAfter: string;
  idempotencyKey: string;
  createdAt: string;
  isIdempotent: boolean; // True if this was a duplicate request
}

/**
 * Ledger Service
 * 
 * CRITICAL: All money movement MUST go through this service.
 * 
 * Key guarantees:
 * 1. Atomic operations with row-level locking
 * 2. Idempotency via unique constraint
 * 3. Append-only (no update/delete)
 * 4. Race-condition safe via SELECT FOR UPDATE
 */
@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREDIT WALLET
  // Add funds to wallet
  // ============================================================

  /**
   * Credit wallet - Add funds
   * 
   * @param request - Credit request with amount and reason
   * @returns Ledger entry created
   * 
   * Race-Condition Handling:
   * 1. Transaction starts with SERIALIZABLE isolation
   * 2. Wallet row locked with SELECT FOR UPDATE
   * 3. Balance computed within transaction
   * 4. Entry inserted atomically
   * 5. Unique constraint on idempotency_key prevents duplicates
   */
  async creditWallet(
    request: LedgerWriteRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerWriteResponse> {
    // Validate amount
    if (!isPositiveAmount(request.amount)) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Generate idempotency key
    const idempotencyKey =
      request.requestId ||
      generateIdempotencyKey(
        `credit_${request.reason}`,
        request.referenceId || `${Date.now()}`,
        request.amount,
      );

    // Check for existing entry (idempotency)
    const existingEntry = await this.findByIdempotencyKey(request.walletId, idempotencyKey);
    if (existingEntry) {
      return this.toWriteResponse(existingEntry, true);
    }

    // Execute atomic credit operation
    return await this.executeAtomicWrite(
      {
        ...request,
        entryType: EntryType.CREDIT,
        idempotencyKey,
      },
      tx,
    );
  }

  // ============================================================
  // DEBIT WALLET
  // Remove funds from wallet
  // ============================================================

  /**
   * Debit wallet - Remove funds
   * 
   * @param request - Debit request with amount and reason
   * @returns Ledger entry created
   * @throws BadRequestException if balance too low
   * 
   * Race-Condition Handling:
   * Uses same atomic pattern as credit, plus balance check
   * within the locked transaction to prevent overdraft.
   */
  async debitWallet(
    request: LedgerWriteRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerWriteResponse> {
    // Validate amount
    if (!isPositiveAmount(request.amount)) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Generate idempotency key
    const idempotencyKey =
      request.requestId ||
      generateIdempotencyKey(
        `debit_${request.reason}`,
        request.referenceId || `${Date.now()}`,
        request.amount,
      );

    // Check for existing entry (idempotency)
    const existingEntry = await this.findByIdempotencyKey(request.walletId, idempotencyKey);
    if (existingEntry) {
      return this.toWriteResponse(existingEntry, true);
    }

    // Execute atomic debit operation
    return await this.executeAtomicWrite(
      {
        ...request,
        entryType: EntryType.DEBIT,
        idempotencyKey,
      },
      tx,
    );
  }

  // ============================================================
  // ATOMIC WRITE OPERATION
  // Core transaction with row-level locking
  // ============================================================

  /**
   * Execute atomic ledger write with proper locking
   * 
   * This is the CRITICAL section that handles race conditions:
   * 
   * 1. Uses Prisma's interactive transaction
   * 2. Locks wallet row with FOR UPDATE (prevents concurrent modifications)
   * 3. Computes balance from last entry within the lock
   * 4. Validates debit doesn't exceed balance
   * 5. Inserts entry with computed balance_after
   * 6. Releases lock on commit
   * 
   * If two requests arrive simultaneously:
   * - First acquires lock, computes balance, inserts entry
   * - Second waits for lock, then sees updated balance
   * - This ensures consistency without race conditions
   */
  private async executeAtomicWrite(
    request: {
      walletId: string;
      entryType: EntryType;
      amount: bigint;
      reason: LedgerReason;
      referenceType: ReferenceType;
      referenceId?: string;
      description?: string;
      idempotencyKey: string;
      createdBy: string;
    },
    externalTx?: Prisma.TransactionClient,
  ): Promise<LedgerWriteResponse> {
    // Define the unit of work
    const work = async (tx: Prisma.TransactionClient) => {
      // --------------------------------------------------------
      // STEP 1: Lock wallet row and validate status
      // FOR UPDATE ensures exclusive access during transaction
      // --------------------------------------------------------
      const walletRows = await tx.$queryRaw<
        Array<{
          id: string;
          status: string;
          currency: string;
        }>
      >`
        SELECT id, status, currency 
        FROM wallet 
        WHERE id = ${request.walletId}::uuid
        FOR UPDATE
      `;

      if (walletRows.length === 0) {
        throw new NotFoundException(`Wallet ${request.walletId} not found`);
      }

      const wallet = walletRows[0];

      // Validate wallet status
      if (wallet.status === 'FROZEN') {
        throw new BadRequestException(`Wallet ${request.walletId} is frozen`);
      }
      if (wallet.status === 'CLOSED') {
        throw new BadRequestException(`Wallet ${request.walletId} is closed`);
      }

      // --------------------------------------------------------
      // STEP 1.5: CHECK GLOBAL KILL SWITCH
      // Must happen inside the transaction to ensure atomic compliance
      // --------------------------------------------------------
      const systemControl = await tx.$queryRaw<Array<{ value: string }>>`
        SELECT value 
        FROM system_control 
        WHERE key = 'SYSTEM_FINANCIAL_MODE'
      `;

      if (systemControl.length > 0 && systemControl[0].value === 'PAUSED') {
        throw new BadRequestException(
          'SYSTEM_FINANCIAL_MODE_PAUSED: All money movement is currently halted.',
        );
      }

      // --------------------------------------------------------
      // STEP 2: Get current balance from last ledger entry
      // This is computed within the lock, ensuring consistency
      // --------------------------------------------------------
      const lastEntryRows = await tx.$queryRaw<
        Array<{
          balance_after: bigint;
        }>
      >`
        SELECT balance_after 
        FROM ledger_entry 
        WHERE wallet_id = ${request.walletId}::uuid
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const currentBalance =
        lastEntryRows.length > 0 ? BigInt(lastEntryRows[0].balance_after) : BigInt(0);

      // --------------------------------------------------------
      // STEP 3: Calculate new balance
      // --------------------------------------------------------
      let newBalance: bigint;

      if (request.entryType === EntryType.CREDIT) {
        newBalance = currentBalance + request.amount;
      } else {
        // DEBIT: Check sufficient balance
        if (currentBalance < request.amount) {
          throw new BadRequestException(
            `Insufficient balance: ${currentBalance} < ${request.amount}`,
          );
        }
        newBalance = currentBalance - request.amount;
      }

      // --------------------------------------------------------
      // STEP 4: Insert ledger entry
      // Unique constraint on (wallet_id, idempotency_key) 
      // provides final protection against duplicates
      // --------------------------------------------------------
      const entryId = crypto.randomUUID();
      const now = new Date();

      try {
        await tx.$executeRaw`
          INSERT INTO ledger_entry (
            id, wallet_id, entry_type, amount, reason, description,
            reference_type, reference_id, idempotency_key, balance_after,
            created_at, created_by
          ) VALUES (
            ${entryId}::uuid,
            ${request.walletId}::uuid,
            ${request.entryType}::"entry_type",
            ${request.amount}::bigint,
            ${request.reason}::"ledger_reason",
            ${request.description || null},
            ${request.referenceType}::"reference_type",
            ${request.referenceId || null},
            ${request.idempotencyKey},
            ${newBalance}::bigint,
            ${now},
            ${request.createdBy}
          )
        `;
      } catch (error: any) {
        // Handle unique constraint violation (idempotency)
        if (error.code === 'P2002' || error.message?.includes('unique constraint')) {
          throw new BadRequestException(`Duplicate operation: ${request.idempotencyKey}`);
        }
        throw error;
      }

      // --------------------------------------------------------
      // STEP 5: Update wallet timestamp
      // --------------------------------------------------------
      await tx.$executeRaw`
        UPDATE wallet 
        SET updated_at = ${now}
        WHERE id = ${request.walletId}::uuid
      `;

      // --------------------------------------------------------
      // STEP 6: Return result
      // --------------------------------------------------------
      return {
        entryId,
        walletId: request.walletId,
        entryType: request.entryType,
        amount: request.amount,
        reason: request.reason,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        idempotencyKey: request.idempotencyKey,
        createdAt: now,
      };
    };

    // Use interactive transaction with isolation level if NO externalTx provided
    let result;
    if (externalTx) {
      result = await work(externalTx);
    } else {
      result = await this.prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      });
    }

    this.logger.log(
      `Ledger ${result.entryType}: ${result.amount} for wallet ${result.walletId}`,
    );

    return {
      entryId: result.entryId,
      walletId: result.walletId,
      entryType: result.entryType,
      amount: result.amount.toString(),
      reason: result.reason,
      balanceBefore: result.balanceBefore.toString(),
      balanceAfter: result.balanceAfter.toString(),
      idempotencyKey: result.idempotencyKey,
      createdAt: result.createdAt.toISOString(),
      isIdempotent: false,
    };
  }

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  /**
   * Find entry by idempotency key (for duplicate detection)
   */
  private async findByIdempotencyKey(
    walletId: string,
    idempotencyKey: string,
  ): Promise<LedgerEntry | null> {
    const entry = await this.prisma.ledgerEntry.findFirst({
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
  }

  /**
   * Get current wallet balance from ledger
   */
  async getBalance(walletId: string): Promise<bigint> {
    const lastEntry = await this.prisma.ledgerEntry.findFirst({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfter: true },
    });

    return lastEntry ? BigInt(lastEntry.balanceAfter) : BigInt(0);
  }

  private toWriteResponse(entry: LedgerEntry, isIdempotent: boolean): LedgerWriteResponse {
    const balanceBefore =
      entry.entryType === EntryType.CREDIT
        ? entry.balanceAfter - entry.amount
        : entry.balanceAfter + entry.amount;

    return {
      entryId: entry.id,
      walletId: entry.walletId,
      entryType: entry.entryType,
      amount: entry.amount.toString(),
      reason: entry.reason,
      balanceBefore: balanceBefore.toString(),
      balanceAfter: entry.balanceAfter.toString(),
      idempotencyKey: entry.idempotencyKey,
      createdAt: entry.createdAt.toISOString(),
      isIdempotent,
    };
  }
}
