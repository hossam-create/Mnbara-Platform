/**
 * Centralized Error Handling for MNBARA Web Application
 * Provides custom error classes, error mapping, and user-friendly messages
 */

import { AxiosError } from 'axios';

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

export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'The requested resource was not found.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends Error {
  isRetryable = true;

  constructor(message = 'Something went wrong on our end. Please try again later.') {
    super(message);
    this.name = 'ServerError';
  }
}

// ============ ERROR CODE MAPPING ============

const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication token. Please log in again.',
  ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  ACCOUNT_NOT_VERIFIED: 'Please verify your email address to continue.',
  MFA_REQUIRED: 'Multi-factor authentication is required.',
  MFA_INVALID: 'Invalid verification code. Please try again.',

  // User errors
  USER_NOT_FOUND: 'User not found.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  PHONE_ALREADY_EXISTS: 'An account with this phone number already exists.',
  INVALID_PASSWORD: 'Password does not meet requirements.',

  // Product/Listing errors
  PRODUCT_NOT_FOUND: 'Product not found or no longer available.',
  LISTING_EXPIRED: 'This listing has expired.',
  INSUFFICIENT_STOCK: 'Not enough items in stock.',

  // Auction errors
  AUCTION_NOT_FOUND: 'Auction not found.',
  AUCTION_ENDED: 'This auction has ended.',
  BID_TOO_LOW: 'Your bid must be higher than the current bid.',
  OUTBID: 'You have been outbid.',
  RESERVE_NOT_MET: 'Reserve price has not been met.',

  // Order errors
  ORDER_NOT_FOUND: 'Order not found.',
  ORDER_CANNOT_CANCEL: 'This order cannot be cancelled.',
  PAYMENT_FAILED: 'Payment failed. Please try again or use a different payment method.',
  INSUFFICIENT_FUNDS: 'Insufficient funds in your wallet.',

  // Escrow errors
  ESCROW_NOT_FOUND: 'Escrow not found.',
  ESCROW_ALREADY_RELEASED: 'Escrow has already been released.',
  ESCROW_DISPUTED: 'This escrow is under dispute.',

  // Traveler errors
  TRIP_NOT_FOUND: 'Trip not found.',
  REQUEST_NOT_FOUND: 'Request not found.',
  MATCH_NOT_FOUND: 'Match not found.',
  KYC_REQUIRED: 'KYC verification is required to perform this action.',
  KYC_PENDING: 'Your KYC verification is still pending.',
  KYC_REJECTED: 'Your KYC verification was rejected. Please resubmit.',

  // Generic errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// ============ HTTP STATUS MAPPING ============

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Please log in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. Please refresh and try again.',
  422: 'Please check your input and try again.',
  429: 'Too many requests. Please try again later.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service temporarily unavailable. Please try again.',
  504: 'Request timed out. Please try again.',
};

// ============ ERROR HANDLER ============

export interface ParsedError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string[]>;
  isRetryable: boolean;
  originalError: Error;
}

/**
 * Parse any error into a standardized format
 */
export function parseError(error: unknown): ParsedError {
  // Already a custom error
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
      isRetryable: error.isRetryable,
      originalError: error,
    };
  }

  if (error instanceof NetworkError) {
    return {
      message: error.message,
      code: 'NETWORK_ERROR',
      status: 0,
      isRetryable: true,
      originalError: error,
    };
  }

  if (error instanceof RateLimitError) {
    return {
      message: error.message,
      code: 'RATE_LIMITED',
      status: 429,
      isRetryable: true,
      originalError: error,
    };
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
      status: 422,
      details: error.fields,
      isRetryable: false,
      originalError: error,
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      message: error.message,
      code: 'TOKEN_EXPIRED',
      status: 401,
      isRetryable: false,
      originalError: error,
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      message: error.message,
      code: 'FORBIDDEN',
      status: 403,
      isRetryable: false,
      originalError: error,
    };
  }

  if (error instanceof NotFoundError) {
    return {
      message: error.message,
      code: 'NOT_FOUND',
      status: 404,
      isRetryable: false,
      originalError: error,
    };
  }

  if (error instanceof ServerError) {
    return {
      message: error.message,
      code: 'SERVER_ERROR',
      status: 500,
      isRetryable: true,
      originalError: error,
    };
  }

  // Axios error
  if (isAxiosError(error)) {
    return parseAxiosError(error);
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
      status: 0,
      isRetryable: false,
      originalError: error,
    };
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
    status: 0,
    isRetryable: false,
    originalError: new Error(String(error)),
  };
}

/**
 * Parse Axios errors into standardized format
 */
function parseAxiosError(error: AxiosError): ParsedError {
  type ErrorResponseData = { code?: string; message?: string; details?: Record<string, string[]> };
  const responseData = error.response?.data as ErrorResponseData | undefined;
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
        status: 0,
        isRetryable: true,
        originalError: error,
      };
    }
    return {
      message: 'Network error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      status: 0,
      isRetryable: true,
      originalError: error,
    };
  }

  const { status } = error.response;
  const serverCode = responseData?.code || `HTTP_${status}`;
  const serverMessage = responseData?.message;
  const details = responseData?.details;

  // Get user-friendly message
  const message = serverMessage 
    || ERROR_MESSAGES[serverCode] 
    || HTTP_STATUS_MESSAGES[status] 
    || 'An unexpected error occurred.';

  // Determine if retryable
  const isRetryable = status >= 500 || status === 429 || status === 408;

  return {
    message,
    code: serverCode,
    status,
    details,
    isRetryable,
    originalError: error,
  };
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError)?.isAxiosError === true;
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
export function formatValidationErrors(details: Record<string, string[]>): string[] {
  const messages: string[] = [];
  for (const [field, errors] of Object.entries(details)) {
    errors.forEach((err) => {
      messages.push(`${formatFieldName(field)}: ${err}`);
    });
  }
  return messages;
}

/**
 * Convert field name to human-readable format
 */
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}
