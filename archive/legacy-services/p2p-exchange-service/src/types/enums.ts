// ============================================================
// P2P Exchange Service - Enums
// Match Prisma schema enums
// ============================================================

// Exchange Request Status
export enum ExchangeStatus {
  OPEN = 'OPEN',                     // Request created, waiting for match
  MATCHED = 'MATCHED',               // Matched with counter-party
  PAYMENT_INITIATED = 'PAYMENT_INITIATED', // User initiated payment
  PROOF_UPLOADED = 'PROOF_UPLOADED', // Proof of payment uploaded
  CONFIRMING = 'CONFIRMING',         // Waiting for confirmation
  COMPLETED = 'COMPLETED',           // Exchange completed successfully
  CANCELLED = 'CANCELLED',           // Cancelled by user
  EXPIRED = 'EXPIRED',               // Expired without match
  DISPUTED = 'DISPUTED',             // Under dispute
  REFUNDED = 'REFUNDED',             // Refunded to user
}

// Match Type
export enum MatchType {
  AUTOMATIC = 'AUTOMATIC',           // Matched by matching engine
  MANUAL = 'MANUAL',                 // User manually accepted offer
}

// Match Status
export enum MatchStatus {
  PENDING = 'PENDING',               // Match created, waiting for escrow
  ESCROWED = 'ESCROWED',             // Funds locked in escrow
  SETTLING = 'SETTLING',             // Settlement in progress
  COMPLETED = 'COMPLETED',           // Settlement completed
  FAILED = 'FAILED',                 // Settlement failed
  DISPUTED = 'DISPUTED',             // Under dispute
}

// Settlement Method
export enum SettlementMethod {
  INTERNAL = 'INTERNAL',             // Internal netting only
  EXTERNAL_OPTIONAL = 'EXTERNAL_OPTIONAL', // External escrow (user opted in)
  EXTERNAL_MANDATORY = 'EXTERNAL_MANDATORY', // External escrow (required for amount)
}

// Settlement Status
export enum SettlementStatus {
  PENDING = 'PENDING',               // Settlement initiated
  PSP_PROCESSING = 'PSP_PROCESSING', // PSP processing transfer
  ESCROW_RELEASING = 'ESCROW_RELEASING', // External escrow releasing funds
  COMPLETED = 'COMPLETED',           // Settlement completed
  FAILED = 'FAILED',                 // Settlement failed
  TIMEOUT = 'TIMEOUT',               // Settlement timed out
}

// Verification Status (Proof of Payment)
export enum VerificationStatus {
  PENDING = 'PENDING',               // Awaiting verification
  VERIFIED = 'VERIFIED',             // Verified by admin
  REJECTED = 'REJECTED',             // Rejected by admin
  FLAGGED = 'FLAGGED',               // Flagged as suspicious
}

// Alias for Proof of Payment Status
export const ProofStatus = VerificationStatus;

// Deposit Source (Security Deposit)
export enum DepositSource {
  TRANSACTION_HISTORY = 'TRANSACTION_HISTORY', // Built from successful transactions
  PLATFORM_FEES = 'PLATFORM_FEES',   // Accumulated from fees
  CASH_DEPOSIT = 'CASH_DEPOSIT',     // Direct cash deposit
  INITIAL_DEPOSIT = 'INITIAL_DEPOSIT', // Initial security deposit
}

// Deposit Status (Security Deposit)
export enum DepositStatus {
  ACTIVE = 'ACTIVE',                 // Available for use
  FROZEN = 'FROZEN',                 // Frozen due to suspicious activity
  DEDUCTED = 'DEDUCTED',             // Deducted for compensation
  REFUNDED = 'REFUNDED',             // Refunded to user
}

// Provider Type (External Escrow)
export enum ProviderType {
  BLOCKCHAIN = 'BLOCKCHAIN',         // Tatum.io, blockchain-based
  MOBILE_WALLET = 'MOBILE_WALLET',   // Vodafone Cash, STC Pay, etc.
  BANK = 'BANK',                     // Traditional bank escrow
  PAYMENT_PROCESSOR = 'PAYMENT_PROCESSOR', // Stripe, PayPal, etc.
}

// Trust Levels
export enum TrustLevel {
  LEVEL_1 = 1,                       // New user, max $100
  LEVEL_2 = 2,                       // After 5 exchanges, max $500
  LEVEL_3 = 3,                       // After 20 exchanges, max $2000
  VIP = 4,                           // After 100 exchanges, max $10000
}

// Transaction Classification
export enum TransactionClass {
  SMALL = 'SMALL',                   // < $300
  MEDIUM = 'MEDIUM',                 // $300 - $1000
  LARGE = 'LARGE',                   // > $1000
}
