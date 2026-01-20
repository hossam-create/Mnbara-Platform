// ============================================================
// PHASE 4.1 — Transfer DTOs
// ============================================================

import { LedgerReason, ReferenceType } from '../types';

/**
 * Internal transfer request
 */
export interface TransferFundsDto {
  fromWalletId: string;
  toWalletId: string;
  amount: number;            // Major units (e.g., 10.50)
  reason: LedgerReason;
  referenceType: ReferenceType;
  referenceId?: string;
  description?: string;
  requestId?: string;        // Idempotency key
}

/**
 * Transfer response
 */
export interface TransferResponseDto {
  success: boolean;
  data: {
    transferId: string;
    fromEntry: {
      entryId: string;
      walletId: string;
      balanceBefore: string;
      balanceBeforeFormatted: string;
      balanceAfter: string;
      balanceAfterFormatted: string;
    };
    toEntry: {
      entryId: string;
      walletId: string;
      balanceBefore: string;
      balanceBeforeFormatted: string;
      balanceAfter: string;
      balanceAfterFormatted: string;
    };
    amount: string;
    amountFormatted: string;
    currency: string;
    reason: LedgerReason;
    referenceType: ReferenceType;
    referenceId: string | null;
    idempotencyKey: string;
    createdAt: string;
    isIdempotent: boolean;
  };
  message: string;
  messageAr: string;
}

/**
 * Validation for transfer DTOs
 */
export const TransferValidation = {
  validateTransferRequest(dto: TransferFundsDto): string[] {
    const errors: string[] = [];

    if (!dto.fromWalletId || dto.fromWalletId.trim().length === 0) {
      errors.push('fromWalletId is required');
    }

    if (!dto.toWalletId || dto.toWalletId.trim().length === 0) {
      errors.push('toWalletId is required');
    }

    if (dto.fromWalletId && dto.toWalletId && dto.fromWalletId === dto.toWalletId) {
      errors.push('Cannot transfer to the same wallet');
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

    return errors;
  },
};
