// ============================================================
// PHASE 4.1 — Custom Error Classes
// ============================================================

export class WalletError extends Error {
  public readonly code: string;
  public readonly messageAr: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, messageAr: string, statusCode: number = 400) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.messageAr = messageAr;
    this.statusCode = statusCode;
  }
}

export class WalletNotFoundError extends WalletError {
  constructor(walletId: string) {
    super(
      'WALLET_NOT_FOUND',
      `Wallet not found: ${walletId}`,
      'المحفظة غير موجودة',
      404
    );
  }
}

export class WalletAlreadyExistsError extends WalletError {
  constructor(ownerType: string, ownerId: string, currency: string) {
    super(
      'WALLET_ALREADY_EXISTS',
      `Wallet already exists for ${ownerType}:${ownerId} in ${currency}`,
      'المحفظة موجودة بالفعل',
      409
    );
  }
}

export class WalletFrozenError extends WalletError {
  constructor(walletId: string) {
    super(
      'WALLET_FROZEN',
      `Wallet is frozen: ${walletId}`,
      'المحفظة مجمدة',
      403
    );
  }
}

export class WalletClosedError extends WalletError {
  constructor(walletId: string) {
    super(
      'WALLET_CLOSED',
      `Wallet is closed: ${walletId}`,
      'المحفظة مغلقة',
      403
    );
  }
}

export class InsufficientBalanceError extends WalletError {
  constructor(currentBalance: bigint, requestedAmount: bigint) {
    super(
      'INSUFFICIENT_BALANCE',
      `Insufficient balance. Current: ${currentBalance}, Requested: ${requestedAmount}`,
      'الرصيد غير كافٍ',
      400
    );
  }
}

export class InvalidCurrencyError extends WalletError {
  constructor(currency: string) {
    super(
      'INVALID_CURRENCY',
      `Currency not supported: ${currency}`,
      'العملة غير مدعومة',
      400
    );
  }
}

export class CurrencyMismatchError extends WalletError {
  constructor(expected: string, received: string) {
    super(
      'CURRENCY_MISMATCH',
      `Currency mismatch. Wallet currency: ${expected}, Requested: ${received}`,
      'عدم تطابق العملة',
      400
    );
  }
}

export class InvalidAmountError extends WalletError {
  constructor(reason: string) {
    super(
      'INVALID_AMOUNT',
      `Invalid amount: ${reason}`,
      'المبلغ غير صالح',
      400
    );
  }
}

export class DuplicateOperationError extends WalletError {
  constructor(idempotencyKey: string) {
    super(
      'DUPLICATE_OPERATION',
      `Duplicate operation detected: ${idempotencyKey}`,
      'عملية مكررة',
      409
    );
  }
}

export class ValidationError extends WalletError {
  constructor(message: string, messageAr: string = 'خطأ في التحقق') {
    super('VALIDATION_ERROR', message, messageAr, 400);
  }
}
