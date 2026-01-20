// ============================================================
// PHASE 4.2 — Escrow DTOs
// Validation for Escrow operations
// ============================================================

import { EscrowReferenceType, EscrowStatus } from '@prisma/client';

/**
 * Create Escrow Request
 */
export interface CreateEscrowRequest {
  buyerWalletId: string;
  sellerWalletId: string;
  amount: bigint;
  currency: string;
  referenceType: EscrowReferenceType;
  referenceId: string; // Order ID, Auction ID, etc.
  description?: string;
  createdBy: string;
}

/**
 * Create AND Fund Escrow Request (Atomic "Buy Now")
 */
export interface CreateAndFundEscrowRequest extends CreateEscrowRequest {
  systemWalletId: string;
  triggeredBy: string;
  requestId?: string;
}


/**
 * Fund Escrow Request (Buyer -> System)
 */
export interface FundEscrowRequest {
  escrowId: string;
  buyerWalletId: string; // Must match escrow.buyerWalletId
  systemWalletId: string; // The holding wallet
  requestId?: string; // Idempotency key
  triggeredBy: string; // User ID
}

/**
 * Release Escrow Request (System -> Seller)
 */
export interface ReleaseEscrowRequest {
  escrowId: string;
  systemWalletId: string; // The holding wallet
  requestId?: string; // Idempotency key
  triggeredBy: string; // Admin or System ID
}

/**
 * Refund Escrow Request (System -> Buyer)
 */
export interface RefundEscrowRequest {
  escrowId: string;
  systemWalletId: string; // The holding wallet
  reason: string;
  requestId?: string; // Idempotency key
  triggeredBy: string; // Admin or System ID
}

/**
 * Dispute Escrow Request
 */
export interface DisputeEscrowRequest {
  escrowId: string;
  reason: string;
  triggeredBy: string;
}

/**
 * Escrow Response DTO
 */
export interface EscrowResponseDto {
  id: string;
  buyerWalletId: string;
  sellerWalletId: string;
  amount: string;
  currency: string;
  status: EscrowStatus;
  referenceType: EscrowReferenceType;
  referenceId: string;
  createdAt: Date;
  updatedAt: Date;
  fundedAt?: Date | null;
  releasedAt?: Date | null;
  refundedAt?: Date | null;
  disputedAt?: Date | null;
}
