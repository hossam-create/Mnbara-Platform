// ============================================================
// Internal Ledger System - TypeScript Types
// ============================================================

import { Decimal } from '@prisma/client/runtime/library';

// ============================================================
// ENUMS
// ============================================================

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  ESCROW_LOCK = 'ESCROW_LOCK',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  FEE_DEDUCTION = 'FEE_DEDUCTION',
  PAYOUT = 'PAYOUT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum EscrowStatus {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}

// ============================================================
// WALLET TYPES
// ============================================================

export interface Wallet {
  id: number;
  userId: number;
  currency: string;
  availableBalance: Decimal;
  lockedBalance: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWalletInput {
  userId: number;
  currency?: string;
}

export interface UpdateWalletBalanceInput {
  walletId: number;
  availableBalance?: Decimal;
  lockedBalance?: Decimal;
}

// ============================================================
// WALLET TRANSACTION TYPES
// ============================================================

export interface WalletTransaction {
  id: number;
  walletId: number;
  transactionType: TransactionType;
  amount: Decimal;
  referenceType?: string;
  referenceId?: number;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateTransactionInput {
  walletId: number;
  transactionType: TransactionType;
  amount: Decimal;
  referenceType?: string;
  referenceId?: number;
  metadata?: Record<string, any>;
}

export interface UpdateTransactionStatusInput {
  transactionId: number;
  status: TransactionStatus;
}

// ============================================================
// ESCROW HOLD TYPES
// ============================================================

export interface EscrowHold {
  id: number;
  requestId: number;
  buyerWalletId: number;
  sellerWalletId: number;
  amount: Decimal;
  platformFee: Decimal;
  status: EscrowStatus;
  heldAt: Date;
  releasedAt?: Date;
  expiresAt?: Date;
  releaseConditions?: Record<string, any>;
}

export interface CreateEscrowHoldInput {
  requestId: number;
  buyerWalletId: number;
  sellerWalletId: number;
  amount: Decimal;
  platformFee: Decimal;
  expiresAt?: Date;
  releaseConditions?: Record<string, any>;
}

export interface ReleaseEscrowInput {
  escrowHoldId: number;
  status: EscrowStatus.RELEASED | EscrowStatus.REFUNDED;
}

// ============================================================
// SERVICE RESPONSE TYPES
// ============================================================

export interface WalletBalance {
  availableBalance: Decimal;
  lockedBalance: Decimal;
  totalBalance: Decimal;
}

export interface TransactionResult {
  success: boolean;
  transaction?: WalletTransaction;
  error?: string;
}

export interface EscrowResult {
  success: boolean;
  escrowHold?: EscrowHold;
  error?: string;
}
