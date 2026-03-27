// Escrow Types - Inspired by Smart Contract

/**
 * Escrow Status - من Smart Contract
 * enum Status { Created, Locked, Released, Dispute }
 */
export enum EscrowStatus {
  CREATED = 'CREATED',       // Transaction created
  SIGNED = 'SIGNED',         // Both parties signed
  LOCKED = 'LOCKED',         // Funds locked
  RELEASED = 'RELEASED',     // Funds released to seller
  DISPUTED = 'DISPUTED',     // Dispute initiated
  RESOLVED = 'RESOLVED',     // Dispute resolved
  CANCELLED = 'CANCELLED'    // Transaction cancelled
}

/**
 * Dispute Status
 */
export enum DisputeStatus {
  NONE = 'NONE',
  INITIATED = 'INITIATED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED'
}

/**
 * Signature Type
 */
export interface Signature {
  userId: string;
  role: 'buyer' | 'seller' | 'arbitrator';
  signature: string;
  timestamp: Date;
}

/**
 * Escrow Transaction - من Smart Contract
 * struct Transaction { buyer, seller, arbitrator, amount, status, ... }
 */
export interface EscrowTransaction {
  id: string;
  transactionId: string;      // Unique identifier (like bytes32 in Solidity)
  
  // Parties
  buyerId: string;
  sellerId: string;
  arbitratorId?: string;
  
  // Amount
  amount: number;
  currency: string;
  
  // Status
  status: EscrowStatus;
  disputeStatus: DisputeStatus;
  
  // Signatures
  signatures: Signature[];
  
  // Dispute
  disputeReason?: string;
  disputeDeadline?: Date;
  disputeReasonIPFS?: string;  // Like in Smart Contract
  
  // Resolution
  resolution?: 'BUYER' | 'SELLER';
  resolvedBy?: string;
  resolvedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lockedAt?: Date;
  releasedAt?: Date;
}

/**
 * Create Escrow DTO
 */
export interface CreateEscrowDto {
  buyerId: string;
  sellerId: string;
  arbitratorId?: string;
  amount: number;
  currency?: string;
  description?: string;
}

/**
 * Add Signature DTO
 */
export interface AddSignatureDto {
  userId: string;
  role: 'buyer' | 'seller' | 'arbitrator';
  signature: string;
}

/**
 * Lock Transaction DTO
 */
export interface LockTransactionDto {
  disputeDuration?: number;  // in days
}

/**
 * Initiate Dispute DTO
 */
export interface InitiateDisputeDto {
  userId: string;
  reason: string;
  evidence?: string[];
}

/**
 * Resolve Dispute DTO
 */
export interface ResolveDisputeDto {
  arbitratorId: string;
  resolution: 'BUYER' | 'SELLER';
  notes?: string;
}

/**
 * Escrow Response
 */
export interface EscrowResponse {
  success: boolean;
  data?: EscrowTransaction;
  error?: string;
  message?: string;
}
