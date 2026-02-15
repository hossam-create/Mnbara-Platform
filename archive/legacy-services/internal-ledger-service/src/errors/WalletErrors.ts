// ============================================================
// Custom Wallet Errors
// ============================================================

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InsufficientFundsError extends WalletError {
  constructor(
    public userId: number,
    public currency: string,
    public required: string,
    public available: string
  ) {
    super(
      `Insufficient funds for user ${userId} in ${currency}. Required: ${required}, Available: ${available}`
    );
    this.name = 'InsufficientFundsError';
  }
}

export class WalletNotFoundError extends WalletError {
  constructor(public userId: number, public currency: string) {
    super(`Wallet not found for user ${userId} with currency ${currency}`);
    this.name = 'WalletNotFoundError';
  }
}

export class InvalidAmountError extends WalletError {
  constructor(public amount: string) {
    super(`Invalid amount: ${amount}. Amount must be positive.`);
    this.name = 'InvalidAmountError';
  }
}

export class EscrowAlreadyExistsError extends WalletError {
  constructor(public requestId: number) {
    super(`Escrow already exists for request ${requestId}`);
    this.name = 'EscrowAlreadyExistsError';
  }
}

export class EscrowNotFoundError extends WalletError {
  constructor(public requestId: number) {
    super(`Escrow not found for request ${requestId}`);
    this.name = 'EscrowNotFoundError';
  }
}

export class InvalidEscrowStatusError extends WalletError {
  constructor(public requestId: number, public currentStatus: string) {
    super(
      `Invalid escrow status for request ${requestId}. Current status: ${currentStatus}`
    );
    this.name = 'InvalidEscrowStatusError';
  }
}

export class PayoutError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'PayoutError';
  }
}

export class InsufficientBalanceError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}
