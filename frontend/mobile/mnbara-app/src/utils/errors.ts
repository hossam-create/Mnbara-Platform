/**
 * Centralized Error Handling for MNBARA Mobile App
 * Provides custom error classes, error mapping, and user-friendly messages
 */

// ============ CUSTOM ERROR CLASSES ============

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, string[]>;
  isRetryable: boolean;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, string[]>,
    isRetryable = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.isRetryable = isRetryable;
  }
}

export class NetworkError extends Error {
  isRetryable = true;

  constructor(message = 'Network error. Please check your internet connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Your session has expired. Please log in again.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  fields: Record<string, string[]>;

  constructor(fields: Record<string, string[]>, message = 'Please check your input and try again.') {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class RateLimitError extends Error {
  retryAfter?: number;

  constructor(retryAfter?: number) {
    const message = retryAfter
      ? `Too many requests. Please try again in ${retryAfter} seconds.`
      : 'Too many requests. Please try again later.';
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class OfflineError extends Error {
  constructor(message = 'You are offline. Please check your connection.') {
    super(message);
    this.name = 'OfflineError';
  }
}

// ============ ERROR CODE MAPPING ============

const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication. Please log in again.',
  ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  ACCOUNT_NOT_VERIFIED: 'Please verify your email to continue.',
  MFA_REQUIRED: 'Verification code required.',
  MFA_INVALID: 'Invalid verification code.',

  // User errors
  USER_NOT_FOUND: 'User not found.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  PHONE_ALREADY_EXISTS: 'An account with this phone already exists.',

  // Product/Listing errors
  PRODUCT_NOT_FOUND: 'Product not found.',
  LISTING_EXPIRED: 'This listing has expired.',
  INSUFFICIENT_STOCK: 'Not enough items in stock.',

  // Auction errors
  AUCTION_NOT_FOUND: 'Auction not found.',
  AUCTION_ENDED: 'This auction has ended.',
  BID_TOO_LOW: 'Your bid must be higher than the current bid.',
  OUTBID: 'You have been outbid.',

  // Order errors
  ORDER_NOT_FOUND: 'Order not found.',
  ORDER_CANNOT_CANCEL: 'This order cannot be cancelled.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  INSUFFICIENT_FUNDS: 'Insufficient funds.',

  // Traveler errors
  TRIP_NOT_FOUND: 'Trip not found.',
  KYC_REQUIRED: 'KYC verification required.',
  KYC_PENDING: 'KYC verification pending.',

  // Generic errors
  VALIDATION_ERROR: 'Please check your input.',
  RATE_LIMITED: 'Too many requests. Please wait.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network error. Check your connection.',
  OFFLINE: 'You are offline.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// ============ HTTP STATUS MAPPING ============

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request.',
  401: 'Please log in to continue.',
  403: 'You do not have permission.',
  404: 'Not found.',
  409: 'A conflict occurred.',
  422: 'Please check your input.',
  429: 'Too many requests.',
  500: 'Server error. Please try again.',
  502: 'Service unavailable.',
  503: 'Service unavailable.',
  504: 'Request timed out.',
};

// ============ ERROR PARSING ============

export interface ParsedError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string[]>;
  isRetryable: boolean;
  isOffline: boolean;
}

/**
 * Parse any error into a standardized format
 */
export function parseError(error: unknown): ParsedError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
      isRetryable: error.isRetryable,
      isOffline: false,
    };
  }

  if (error instanceof NetworkError) {
    return {
      message: error.message,
      code: 'NETWORK_ERROR',
      status: 0,
      isRetryable: true,
      isOffline: false,
    };
  }

  if (error instanceof OfflineError) {
    return {
      message: error.message,
      code: 'OFFLINE',
      status: 0,
      isRetryable: true,
      isOffline: true,
    };
  }

  if (error instanceof RateLimitError) {
    return {
      message: error.message,
      code: 'RATE_LIMITED',
      status: 429,
      isRetryable: true,
      isOffline: false,
    };
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
      status: 422,
      details: error.fields,
      isRetryable: false,
      isOffline: false,
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      message: error.message,
      code: 'TOKEN_EXPIRED',
      status: 401,
      isRetryable: false,
      isOffline: false,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
      status: 0,
      isRetryable: false,
      isOffline: false,
    };
  }

  return {
    message: 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
    status: 0,
    isRetryable: false,
    isOffline: false,
  };
}

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Get user-friendly error message from HTTP status
 */
export function getHttpStatusMessage(status: number): string {
  return HTTP_STATUS_MESSAGES[status] || HTTP_STATUS_MESSAGES[500];
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const parsed = parseError(error);
  return parsed.isRetryable;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(details: Record<string, string[]>): string {
  const messages: string[] = [];
  for (const [field, errors] of Object.entries(details)) {
    errors.forEach((err) => {
      messages.push(`${formatFieldName(field)}: ${err}`);
    });
  }
  return messages.join('\n');
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}
