// ============================================================
// PHASE 4.1 — Wallet DTOs
// ============================================================

import { OwnerType, WalletStatus, EntryType, LedgerReason, ReferenceType } from '../types';

/**
 * Create wallet request
 */
export interface CreateWalletDto {
  ownerType: OwnerType;
  ownerId: string;
  currency?: string; // Defaults to 'EGP'
}

/**
 * Wallet response (for API)
 */
export interface WalletResponseDto {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  currency: string;
  status: WalletStatus;
  balance: string; // String representation of bigint for JSON
  balanceFormatted: string; // Human-readable format (e.g., "10.00 EGP")
  createdAt: string;
  updatedAt: string;
}

/**
 * Ledger entry response (for API)
 */
export interface LedgerEntryResponseDto {
  id: string;
  walletId: string;
  entryType: EntryType;
  amount: string; // String representation of bigint
  amountFormatted: string; // Human-readable format
  reason: LedgerReason;
  description: string | null;
  referenceType: ReferenceType;
  referenceId: string | null;
  balanceAfter: string;
  balanceAfterFormatted: string;
  createdAt: string;
  createdBy: string;
}

/**
 * Ledger list query params
 */
export interface ListLedgerQueryDto {
  entryType?: EntryType;
  reason?: LedgerReason;
  referenceType?: ReferenceType;
  referenceId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Validation helpers
 */
export const WalletValidation = {
  isValidOwnerType(value: string): value is OwnerType {
    return Object.values(OwnerType).includes(value as OwnerType);
  },

  isValidCurrency(value: string): boolean {
    // Initially only EGP, can be extended
    const supportedCurrencies = ['EGP'];
    return supportedCurrencies.includes(value.toUpperCase());
  },

  isValidEntryType(value: string): value is EntryType {
    return Object.values(EntryType).includes(value as EntryType);
  },

  isValidLedgerReason(value: string): value is LedgerReason {
    return Object.values(LedgerReason).includes(value as LedgerReason);
  },

  isValidReferenceType(value: string): value is ReferenceType {
    return Object.values(ReferenceType).includes(value as ReferenceType);
  },
};
