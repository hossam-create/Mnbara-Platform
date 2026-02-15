/**
 * Custom Error Classes & Error Handling
 * 
 * Standardized error handling across the auction service.
 * Provides consistent error codes, messages, and HTTP status codes.
 */

// ============================================================
// ERROR CODES
// ============================================================

export enum ErrorCode {
  // Validation errors (400)
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_ENUM = 'INVALID_ENUM',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_AMOUNT = 'INVALID_AMOUNT',

  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  AUCTION_NOT_FOUND = 'AUCTION_NOT_FOUND',
  BID_NOT_FOUND = 'BID_NOT_FOUND',
  DISPUTE_NOT_FOUND = 'DISPUTE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT = 'CONFLICT',
  AUCTION_ALREADY_STARTED = 'AUCTION_ALREADY_STARTED',
  AUCTION_ALREADY_ENDED = 'AUCTION_ALREADY_ENDED',
  BID_ALREADY_INVALIDATED = 'BID_ALREADY_INVALIDATED',
  SETTLEMENT_BLOCKED = 'SETTLEMENT_BLOCKED',

  // Business logic errors (422)
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  BID_TOO_LOW = 'BID_TOO_LOW',
  RESERVE_NOT_MET = 'RESERVE_NOT_MET',
  AUCTION_EXPIRED = 'AUCTION_EXPIRED',
  CANNOT_INVALIDATE_SETTLED_BID = 'CANNOT_INVALIDATE_SETTLED_BID',
  OPEN_DISPUTES_EXIST = 'OPEN_DISPUTES_EXIST',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
}

// ============================================================
// HTTP STATUS CODES
// ============================================================

const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // 400 Bad Request
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_ENUM]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_DATE_RANGE]: 400,
  [ErrorCode.INVALID_AMOUNT]: 400,

  // 401 Unauthorized
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,

  // 403 Forbidden
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  // 404 Not Found
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.AUCTION_NOT_FOUND]: 404,
  [ErrorCode.BID_NOT_FOUND]: 404,
  [ErrorCode.DISPUTE_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,

  // 409 Conflict
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.AUCTION_ALREADY_STARTED]: 409,
  [ErrorCode.AUCTION_ALREADY_ENDED]: 409,
  [ErrorCode.BID_ALREADY_INVALIDATED]: 409,
  [ErrorCode.SETTLEMENT_BLOCKED]: 409,

  // 422 Unprocessable Entity
  [ErrorCode.BUSINESS_LOGIC_ERROR]: 422,
  [ErrorCode.BID_TOO_LOW]: 422,
  [ErrorCode.RESERVE_NOT_MET]: 422,
  [ErrorCode.AUCTION_EXPIRED]: 422,
  [ErrorCode.CANNOT_INVALIDATE_SETTLED_BID]: 422,
  [ErrorCode.OPEN_DISPUTES_EXIST]: 422,

  // 500 Internal Server Error
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.TRANSACTION_FAILED]: 500,
  [ErrorCode.ENCRYPTION_ERROR]: 500,
};

// ============================================================
// CUSTOM ERROR CLASS
// ============================================================

export class AuctionServiceError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuctionServiceError';
    this.code = code;
    this.statusCode = ERROR_STATUS_CODES[code] || 500;
    this.details = details;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AuctionServiceError.prototype);
  }

  /**
   * Convert error to JSON response
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// ============================================================
// SPECIFIC ERROR CLASSES
// ============================================================

export class ValidationError extends AuctionServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.INVALID_INPUT, message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AuctionServiceError {
  constructor(resource: string, id?: string | number) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AuctionServiceError {
  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, message, details);
    this.name = 'ConflictError';
  }
}

export class BusinessLogicError extends AuctionServiceError {
  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, message, details);
    this.name = 'BusinessLogicError';
  }
}

export class DatabaseError extends AuctionServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.DATABASE_ERROR, message, details);
    this.name = 'DatabaseError';
  }
}

// ============================================================
// ERROR HANDLING UTILITIES
// ============================================================

/**
 * Check if an error is an AuctionServiceError
 */
export function isAuctionServiceError(error: unknown): error is AuctionServiceError {
  return error instanceof AuctionServiceError;
}

/**
 * Convert any error to AuctionServiceError
 */
export function toAuctionServiceError(error: unknown): AuctionServiceError {
  if (isAuctionServiceError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AuctionServiceError(
      ErrorCode.INTERNAL_ERROR,
      error.message,
      { originalError: error.name }
    );
  }

  return new AuctionServiceError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    { error: String(error) }
  );
}

/**
 * Get HTTP status code for error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAuctionServiceError(error)) {
    return error.statusCode;
  }
  return 500;
}
