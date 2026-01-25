/**
 * Disputes & Refunds System - Custom Error Classes
 * 
 * This file contains all custom error classes for the dispute system.
 * Each error provides specific context and error codes for better debugging.
 */

import { DisputeStatus } from '../types/dispute.types';

/**
 * Base error class for all dispute-related errors
 */
export class DisputeError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = 'DisputeError';
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when dispute window has expired
 */
export class DisputeWindowExpiredError extends DisputeError {
  constructor(deliveredAt: Date) {
    const hoursElapsed = Math.floor(
      (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60)
    );
    super(
      `Dispute window expired. ${hoursElapsed} hours have passed since delivery. Disputes must be opened within 48 hours.`,
      'DISPUTE_WINDOW_EXPIRED',
      400
    );
    this.name = 'DisputeWindowExpiredError';
  }
}

/**
 * Error thrown when a duplicate dispute is attempted
 */
export class DuplicateDisputeError extends DisputeError {
  constructor(requestId: string) {
    super(
      `A dispute already exists for request #${requestId}`,
      'DUPLICATE_DISPUTE',
      409
    );
    this.name = 'DuplicateDisputeError';
  }
}

/**
 * Error thrown when dispute status is invalid for the requested action
 */
export class InvalidDisputeStatusError extends DisputeError {
  constructor(currentStatus: DisputeStatus, action: string) {
    super(
      `Cannot ${action} dispute in status: ${currentStatus}`,
      'INVALID_DISPUTE_STATUS',
      400
    );
    this.name = 'InvalidDisputeStatusError';
  }
}

/**
 * Error thrown when refund processing fails
 */
export class RefundFailedError extends DisputeError {
  constructor(reason: string) {
    super(
      `Refund failed: ${reason}`,
      'REFUND_FAILED',
      500
    );
    this.name = 'RefundFailedError';
  }
}

/**
 * Error thrown when file type is invalid
 */
export class InvalidFileTypeError extends DisputeError {
  constructor(mimetype: string, allowedTypes?: string[]) {
    const allowed = allowedTypes?.join(', ') || 'JPG, PNG, PDF';
    super(
      `Invalid file type: ${mimetype}. Allowed types: ${allowed}`,
      'INVALID_FILE_TYPE',
      400
    );
    this.name = 'InvalidFileTypeError';
  }
}

/**
 * Error thrown when file size exceeds limit
 */
export class FileTooLargeError extends DisputeError {
  constructor(size: number, maxSize: number) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    super(
      `File too large: ${sizeMB}MB. Maximum size: ${maxSizeMB}MB`,
      'FILE_TOO_LARGE',
      400
    );
    this.name = 'FileTooLargeError';
  }
}

/**
 * Error thrown when too many files are uploaded
 */
export class TooManyFilesError extends DisputeError {
  constructor(count: number, maxCount: number) {
    super(
      `Too many files: ${count}. Maximum allowed: ${maxCount}`,
      'TOO_MANY_FILES',
      400
    );
    this.name = 'TooManyFilesError';
  }
}

/**
 * Error thrown when dispute is not found
 */
export class DisputeNotFoundError extends DisputeError {
  constructor(disputeId: string) {
    super(
      `Dispute not found: ${disputeId}`,
      'DISPUTE_NOT_FOUND',
      404
    );
    this.name = 'DisputeNotFoundError';
  }
}

/**
 * Error thrown when request is not found
 */
export class RequestNotFoundError extends DisputeError {
  constructor(requestId: string) {
    super(
      `Request not found: ${requestId}`,
      'REQUEST_NOT_FOUND',
      404
    );
    this.name = 'RequestNotFoundError';
  }
}

/**
 * Error thrown when request status is invalid for disputes
 */
export class InvalidRequestStatusError extends DisputeError {
  constructor(currentStatus: string) {
    super(
      `Cannot open dispute for request in status: ${currentStatus}. Request must be in DELIVERED status.`,
      'INVALID_REQUEST_STATUS',
      400
    );
    this.name = 'InvalidRequestStatusError';
  }
}

/**
 * Error thrown when user is not authorized to access dispute
 */
export class UnauthorizedAccessError extends DisputeError {
  constructor(message: string = 'You are not authorized to access this dispute') {
    super(message, 'UNAUTHORIZED_ACCESS', 403);
    this.name = 'UnauthorizedAccessError';
  }
}

/**
 * Error thrown when evidence limit is reached
 */
export class EvidenceLimitReachedError extends DisputeError {
  constructor(currentCount: number, maxCount: number) {
    super(
      `Evidence limit reached: ${currentCount}/${maxCount}. Cannot add more evidence.`,
      'EVIDENCE_LIMIT_REACHED',
      400
    );
    this.name = 'EvidenceLimitReachedError';
  }
}

/**
 * Error thrown when resolution percentage is invalid
 */
export class InvalidResolutionPercentageError extends DisputeError {
  constructor(percentage: number) {
    super(
      `Invalid resolution percentage: ${percentage}. Must be between 0 and 100.`,
      'INVALID_RESOLUTION_PERCENTAGE',
      400
    );
    this.name = 'InvalidResolutionPercentageError';
  }
}

/**
 * Error thrown when wallet operation fails
 */
export class WalletOperationError extends DisputeError {
  constructor(operation: string, reason: string) {
    super(
      `Wallet operation failed (${operation}): ${reason}`,
      'WALLET_OPERATION_FAILED',
      500
    );
    this.name = 'WalletOperationError';
  }
}

/**
 * Error thrown when escrow operation fails
 */
export class EscrowOperationError extends DisputeError {
  constructor(operation: string, reason: string) {
    super(
      `Escrow operation failed (${operation}): ${reason}`,
      'ESCROW_OPERATION_FAILED',
      500
    );
    this.name = 'EscrowOperationError';
  }
}

/**
 * Error thrown when file upload fails
 */
export class FileUploadError extends DisputeError {
  constructor(filename: string, reason: string) {
    super(
      `File upload failed (${filename}): ${reason}`,
      'FILE_UPLOAD_FAILED',
      500
    );
    this.name = 'FileUploadError';
  }
}

/**
 * Error thrown when malware is detected in uploaded file
 */
export class MalwareDetectedError extends DisputeError {
  constructor(filename: string) {
    super(
      `Malware detected in file: ${filename}. Upload rejected for security reasons.`,
      'MALWARE_DETECTED',
      400
    );
    this.name = 'MalwareDetectedError';
  }
}

/**
 * Error thrown when notification sending fails
 */
export class NotificationError extends DisputeError {
  constructor(type: string, reason: string) {
    super(
      `Notification failed (${type}): ${reason}`,
      'NOTIFICATION_FAILED',
      500
    );
    this.name = 'NotificationError';
  }
}

/**
 * Error thrown when webhook delivery fails
 */
export class WebhookError extends DisputeError {
  constructor(url: string, reason: string) {
    super(
      `Webhook delivery failed (${url}): ${reason}`,
      'WEBHOOK_FAILED',
      500
    );
    this.name = 'WebhookError';
  }
}

