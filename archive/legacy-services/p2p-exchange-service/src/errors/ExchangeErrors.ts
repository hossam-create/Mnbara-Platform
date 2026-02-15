// ============================================================
// P2P Exchange Service - Custom Errors
// ============================================================

// Base Exchange Error
export class ExchangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExchangeError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================
// Security Deposit Errors
// ============================================================

export class InsufficientSecurityDepositError extends ExchangeError {
  constructor(
    public userId: number,
    public currency: string,
    public required: string,
    public available: string
  ) {
    super(
      `Insufficient security deposit for user ${userId} in ${currency}. Required: ${required}, Available: ${available}`
    );
    this.name = 'InsufficientSecurityDepositError';
  }
}

export class SecurityDepositNotFoundError extends ExchangeError {
  constructor(public userId: number, public currency: string) {
    super(`Security deposit not found for user ${userId} with currency ${currency}`);
    this.name = 'SecurityDepositNotFoundError';
  }
}

export class SecurityDepositFrozenError extends ExchangeError {
  constructor(public userId: number, public currency: string, public reason: string) {
    super(
      `Security deposit frozen for user ${userId} in ${currency}. Reason: ${reason}`
    );
    this.name = 'SecurityDepositFrozenError';
  }
}

// ============================================================
// Trust Level Errors
// ============================================================

export class ExceedsTransactionLimitError extends ExchangeError {
  constructor(
    public userId: number,
    public trustLevel: number,
    public requestedAmount: string,
    public maxAmount: string
  ) {
    super(
      `Transaction amount ${requestedAmount} exceeds limit for trust level ${trustLevel}. Max allowed: ${maxAmount}`
    );
    this.name = 'ExceedsTransactionLimitError';
  }
}

export class TrustLevelNotFoundError extends ExchangeError {
  constructor(public userId: number) {
    super(`Trust level not found for user ${userId}`);
    this.name = 'TrustLevelNotFoundError';
  }
}

export class InsufficientTrustLevelError extends ExchangeError {
  constructor(
    public userId: number,
    public currentLevel: number,
    public requiredLevel: number
  ) {
    super(
      `Insufficient trust level for user ${userId}. Current: ${currentLevel}, Required: ${requiredLevel}`
    );
    this.name = 'InsufficientTrustLevelError';
  }
}

// ============================================================
// Exchange Request Errors
// ============================================================

export class ExchangeRequestNotFoundError extends ExchangeError {
  constructor(public requestId: number) {
    super(`Exchange request ${requestId} not found`);
    this.name = 'ExchangeRequestNotFoundError';
  }
}

export class InvalidExchangeStatusError extends ExchangeError {
  constructor(
    public requestId: number,
    public currentStatus: string,
    public expectedStatus: string
  ) {
    super(
      `Invalid exchange status for request ${requestId}. Current: ${currentStatus}, Expected: ${expectedStatus}`
    );
    this.name = 'InvalidExchangeStatusError';
  }
}

export class ExchangeRequestExpiredError extends ExchangeError {
  constructor(public requestId: number, public expiresAt: Date) {
    super(`Exchange request ${requestId} expired at ${expiresAt.toISOString()}`);
    this.name = 'ExchangeRequestExpiredError';
  }
}

export class InvalidCurrencyPairError extends ExchangeError {
  constructor(public fromCurrency: string, public toCurrency: string) {
    super(`Invalid currency pair: ${fromCurrency} -> ${toCurrency}`);
    this.name = 'InvalidCurrencyPairError';
  }
}

export class InvalidAmountError extends ExchangeError {
  constructor(public amount: string, public reason: string) {
    super(`Invalid amount: ${amount}. Reason: ${reason}`);
    this.name = 'InvalidAmountError';
  }
}

export class InvalidRateError extends ExchangeError {
  constructor(public rate: string, public marketRate: string, public reason: string) {
    super(
      `Invalid rate: ${rate}. Market rate: ${marketRate}. Reason: ${reason}`
    );
    this.name = 'InvalidRateError';
  }
}

// ============================================================
// Matching Errors
// ============================================================

export class MatchNotFoundError extends ExchangeError {
  constructor(public matchId: number) {
    super(`Match ${matchId} not found`);
    this.name = 'MatchNotFoundError';
  }
}

export class IncompatibleRequestsError extends ExchangeError {
  constructor(public requestId: number, public counterRequestId: number, public reason: string) {
    super(
      `Requests ${requestId} and ${counterRequestId} are incompatible. Reason: ${reason}`
    );
    this.name = 'IncompatibleRequestsError';
  }
}

export class MatchAlreadyExistsError extends ExchangeError {
  constructor(public requestId: number) {
    super(`Match already exists for request ${requestId}`);
    this.name = 'MatchAlreadyExistsError';
  }
}

export class InvalidMatchStatusError extends ExchangeError {
  constructor(
    public matchId: number,
    public currentStatus: string,
    public expectedStatus: string
  ) {
    super(
      `Invalid match status for match ${matchId}. Current: ${currentStatus}, Expected: ${expectedStatus}`
    );
    this.name = 'InvalidMatchStatusError';
  }
}

// ============================================================
// Proof of Payment Errors
// ============================================================

export class InvalidProofError extends ExchangeError {
  constructor(public proofId: number, public reason: string) {
    super(`Invalid proof ${proofId}. Reason: ${reason}`);
    this.name = 'InvalidProofError';
  }
}

export class ProofNotFoundError extends ExchangeError {
  constructor(public proofId: number) {
    super(`Proof ${proofId} not found`);
    this.name = 'ProofNotFoundError';
  }
}

export class ProofAlreadyExistsError extends ExchangeError {
  constructor(public requestId: number) {
    super(`Proof already exists for request ${requestId}`);
    this.name = 'ProofAlreadyExistsError';
  }
}

export class ProofVerificationFailedError extends ExchangeError {
  constructor(public proofId: number, public reason: string) {
    super(`Proof verification failed for proof ${proofId}. Reason: ${reason}`);
    this.name = 'ProofVerificationFailedError';
  }
}

export class InvalidProofStatusError extends ExchangeError {
  constructor(
    public proofId: number,
    public currentStatus: string,
    public expectedStatus: string
  ) {
    super(
      `Invalid proof status for proof ${proofId}. Current: ${currentStatus}, Expected: ${expectedStatus}`
    );
    this.name = 'InvalidProofStatusError';
  }
}

export class UnauthorizedProofAccessError extends ExchangeError {
  constructor(public userId: number, public matchId: number) {
    super(`User ${userId} is not authorized to access proofs for match ${matchId}`);
    this.name = 'UnauthorizedProofAccessError';
  }
}

// ============================================================
// Settlement Errors
// ============================================================

export class SettlementNotFoundError extends ExchangeError {
  constructor(public settlementId: number) {
    super(`Settlement ${settlementId} not found`);
    this.name = 'SettlementNotFoundError';
  }
}

export class SettlementTimeoutError extends ExchangeError {
  constructor(public settlementId: number, public timeoutMinutes: number) {
    super(
      `Settlement ${settlementId} timed out after ${timeoutMinutes} minutes`
    );
    this.name = 'SettlementTimeoutError';
  }
}

export class SettlementFailedError extends ExchangeError {
  constructor(public settlementId: number, public reason: string) {
    super(`Settlement ${settlementId} failed. Reason: ${reason}`);
    this.name = 'SettlementFailedError';
  }
}

export class InvalidSettlementStatusError extends ExchangeError {
  constructor(
    public settlementId: number,
    public currentStatus: string,
    public expectedStatus: string
  ) {
    super(
      `Invalid settlement status for settlement ${settlementId}. Current: ${currentStatus}, Expected: ${expectedStatus}`
    );
    this.name = 'InvalidSettlementStatusError';
  }
}

export class PSPIntegrationError extends ExchangeError {
  constructor(public provider: string, public reason: string) {
    super(`PSP integration error with ${provider}. Reason: ${reason}`);
    this.name = 'PSPIntegrationError';
  }
}

export class ExternalEscrowError extends ExchangeError {
  constructor(public provider: string, public reason: string) {
    super(`External escrow error with ${provider}. Reason: ${reason}`);
    this.name = 'ExternalEscrowError';
  }
}

// ============================================================
// Communication Errors
// ============================================================

export class ExternalContactDetectedError extends ExchangeError {
  constructor(public matchId: number, public detectedPatterns: string[]) {
    super(
      `External contact information detected in match ${matchId}. Patterns: ${detectedPatterns.join(', ')}`
    );
    this.name = 'ExternalContactDetectedError';
  }
}

export class MessageFlaggedError extends ExchangeError {
  constructor(public messageId: number, public reason: string) {
    super(`Message ${messageId} flagged. Reason: ${reason}`);
    this.name = 'MessageFlaggedError';
  }
}

// ============================================================
// Provider Errors
// ============================================================

export class ProviderNotFoundError extends ExchangeError {
  constructor(public providerId: number) {
    super(`Provider ${providerId} not found`);
    this.name = 'ProviderNotFoundError';
  }
}

export class NoAvailableProvidersError extends ExchangeError {
  constructor(public amount: string, public currency: string, public country?: string) {
    const location = country ? ` in ${country}` : '';
    super(
      `No available providers for ${amount} ${currency}${location}`
    );
    this.name = 'NoAvailableProvidersError';
  }
}

export class ProviderNotActiveError extends ExchangeError {
  constructor(public providerId: number, public providerName: string) {
    super(`Provider ${providerName} (${providerId}) is not active`);
    this.name = 'ProviderNotActiveError';
  }
}

// ============================================================
// FX Rate Errors
// ============================================================

export class FXRateNotFoundError extends ExchangeError {
  constructor(public baseCurrency: string, public quoteCurrency: string) {
    super(`FX rate not found for ${baseCurrency}/${quoteCurrency}`);
    this.name = 'FXRateNotFoundError';
  }
}

export class FXProviderError extends ExchangeError {
  constructor(public provider: string, public reason: string) {
    super(`FX provider error with ${provider}. Reason: ${reason}`);
    this.name = 'FXProviderError';
  }
}

// ============================================================
// Authorization Errors
// ============================================================

export class UnauthorizedAccessError extends ExchangeError {
  constructor(public userId: number, public resource: string) {
    super(`User ${userId} is not authorized to access ${resource}`);
    this.name = 'UnauthorizedAccessError';
  }
}

export class AccountSuspendedError extends ExchangeError {
  constructor(public userId: number, public reason: string) {
    super(`Account ${userId} is suspended. Reason: ${reason}`);
    this.name = 'AccountSuspendedError';
  }
}
