/**
 * Immutable Ledger Types
 * 
 * Defines types for the append-only transaction ledger with
 * cryptographic integrity verification.
 */

// Ledger entry types
export enum LedgerEntryType {
  // Financial transactions
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  ESCROW_HOLD = 'ESCROW_HOLD',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
  FEE = 'FEE',
  REWARD = 'REWARD',
  
  // Swap transactions
  SWAP_INITIATED = 'SWAP_INITIATED',
  SWAP_COMPLETED = 'SWAP_COMPLETED',
  SWAP_CANCELLED = 'SWAP_CANCELLED',
  
  // Order transactions
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  
  // Auction transactions
  BID_PLACED = 'BID_PLACED',
  AUCTION_WON = 'AUCTION_WON',
  
  // System events
  SYSTEM_ADJUSTMENT = 'SYSTEM_ADJUSTMENT',
  MIGRATION = 'MIGRATION'
}

// Ledger entry status
export enum LedgerEntryStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED'
}

// Input for creating a ledger entry
export interface CreateLedgerEntryInput {
  entryType: LedgerEntryType;
  
  // Participants
  fromUserId?: number;
  toUserId?: number;
  
  // Amount
  amount: number;
  currency: string;
  
  // References
  orderId?: number;
  escrowId?: number;
  swapId?: number;
  auctionId?: number;
  transactionRef?: string;
  
  // Description
  description: string;
  
  // Additional data
  metadata?: Record<string, any>;
}

// Ledger entry response
export interface LedgerEntryResponse {
  id: number;
  entryNumber: string;
  entryType: LedgerEntryType;
  status: LedgerEntryStatus;
  
  fromUserId?: number;
  toUserId?: number;
  
  amount: number;
  currency: string;
  
  orderId?: number;
  escrowId?: number;
  swapId?: number;
  auctionId?: number;
  transactionRef?: string;
  
  description: string;
  metadata?: Record<string, any>;
  
  // Cryptographic chain
  previousHash: string;
  entryHash: string;
  
  // Timestamps
  createdAt: Date;
  confirmedAt?: Date;
}

// Ledger verification result
export interface LedgerVerificationResult {
  isValid: boolean;
  totalEntries: number;
  verifiedEntries: number;
  invalidEntries: LedgerInvalidEntry[];
  verificationTime: number;
}

// Invalid entry details
export interface LedgerInvalidEntry {
  entryId: number;
  entryNumber: string;
  expectedHash: string;
  actualHash: string;
  reason: string;
}

// Query filters
export interface LedgerQueryFilters {
  entryType?: LedgerEntryType;
  status?: LedgerEntryStatus;
  fromUserId?: number;
  toUserId?: number;
  orderId?: number;
  escrowId?: number;
  swapId?: number;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

// Ledger summary
export interface LedgerSummary {
  totalEntries: number;
  totalVolume: number;
  byType: Record<string, { count: number; volume: number }>;
  byStatus: Record<string, number>;
  lastEntryAt?: Date;
  chainIntegrity: boolean;
}
