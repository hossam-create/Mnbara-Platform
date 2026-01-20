// ============================================================
// PHASE 4.1 — Ledger DTOs
// ============================================================

import { LedgerReason, ReferenceType, EntryType } from '../types';

/**
 * Credit wallet request
 */
export interface CreditWalletDto {
  walletId: string;
  amount: number;            // Major units (e.g., 10.50)
  reason: LedgerReason;
  referenceType: ReferenceType;
  referenceId?: string;
  description?: string;
  requestId?: string;        // Idempotency key (optional, auto-generated if missing)
}

/**
 * Debit wallet request
 */
export interface DebitWalletDto {
  walletId: string;
  amount: number;            // Major units (e.g., 10.50)
  reason: LedgerReason;
  referenceType: ReferenceType;
  referenceId?: string;
  description?: string;
  requestId?: string;        // Idempotency key (optional, auto-generated if missing)
}

/**
 * Ledger write response
 */
export interface LedgerWriteResponseDto {
  success: boolean;
  data: {
    entryId: string;
    walletId: string;
    entryType: EntryType;
    amount: string;
    amountFormatted: string;
    reason: LedgerReason;
    balanceBefore: string;
    balanceBeforeFormatted: string;
    balanceAfter: string;
    balanceAfterFormatted: string;
    idempotencyKey: string;
    createdAt: string;
    isIdempotent: boolean;
  };
  message: string;
  messageAr: string;
}

/**
 * Validation for ledger DTOs
 */
export const LedgerValidation = {
  validateCreditRequest(dto: CreditWalletDto): string[] {
    const errors: string[] = [];

    if (!dto.walletId || dto.walletId.trim().length === 0) {
      errors.push('walletId is required');
    }

    if (typeof dto.amount !== 'number' || dto.amount <= 0) {
      errors.push('amount must be a positive number');
    }

    if (!dto.reason || !Object.values(LedgerReason).includes(dto.reason)) {
      errors.push(`reason must be one of: ${Object.values(LedgerReason).join(', ')}`);
    }

    if (!dto.referenceType || !Object.values(ReferenceType).includes(dto.referenceType)) {
      errors.push(`referenceType must be one of: ${Object.values(ReferenceType).join(', ')}`);
    }

    // Validate reason matches credit operation
    const validCreditReasons: LedgerReason[] = [
      LedgerReason.DEPOSIT,
      LedgerReason.REFUND,
      LedgerReason.PAYOUT,
      LedgerReason.TRANSFER_IN,
      LedgerReason.PURCHASE_RELEASE,
      LedgerReason.ADJUSTMENT,
    ];

    if (dto.reason && !validCreditReasons.includes(dto.reason)) {
      errors.push(`reason '${dto.reason}' is not valid for credit operation`);
    }

    return errors;
  },

  validateDebitRequest(dto: DebitWalletDto): string[] {
    const errors: string[] = [];

    if (!dto.walletId || dto.walletId.trim().length === 0) {
      errors.push('walletId is required');
    }

    if (typeof dto.amount !== 'number' || dto.amount <= 0) {
      errors.push('amount must be a positive number');
    }

    if (!dto.reason || !Object.values(LedgerReason).includes(dto.reason)) {
      errors.push(`reason must be one of: ${Object.values(LedgerReason).join(', ')}`);
    }

    if (!dto.referenceType || !Object.values(ReferenceType).includes(dto.referenceType)) {
      errors.push(`referenceType must be one of: ${Object.values(ReferenceType).join(', ')}`);
    }

    // Validate reason matches debit operation
    const validDebitReasons: LedgerReason[] = [
      LedgerReason.WITHDRAWAL,
      LedgerReason.PURCHASE_HOLD,
      LedgerReason.FEE,
      LedgerReason.TRANSFER_OUT,
      LedgerReason.ADJUSTMENT,
    ];

    if (dto.reason && !validDebitReasons.includes(dto.reason)) {
      errors.push(`reason '${dto.reason}' is not valid for debit operation`);
    }

    return errors;
  },
};
