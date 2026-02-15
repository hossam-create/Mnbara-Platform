import { Request, Response, NextFunction } from 'express';
import {
  AuctionServiceError,
  isAuctionServiceError,
  toAuctionServiceError,
  getErrorStatusCode,
} from '../lib/errors';

/**
 * Global error handler middleware
 * 
 * MANDATORY SECURITY REQUIREMENTS:
 * - Generic error messages to users
 * - No technical details exposed
 * - No database structure revealed
 * - No stack traces in responses
 * - No server paths exposed
 * - All technical details logged securely server-side
 */

export const errorHandler = (
  err: Error | unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Convert to AuctionServiceError if needed
  const error = isAuctionServiceError(err) ? err : toAuctionServiceError(err);

  // Prepare secure log context (for server logs only)
  const logContext = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: error.statusCode,
    errorCode: error.code,
    message: error.message,
    userId: (req as any).userId || 'anonymous',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    // Include details for debugging
    ...(error.details && { details: error.details }),
  };

  // Log error securely (server-side only)
  if (error.statusCode >= 500) {
    console.error('[ERROR]', logContext);
  } else {
    console.warn('[WARN]', logContext);
  }

  // MANDATORY: Generic error message for client (no technical details)
  const clientResponse: any = {
    success: false,
    error: {
      code: error.code,
      // Generic message - never expose technical details
      message: getGenericErrorMessage(error.statusCode),
      statusCode: error.statusCode,
      // Only include timestamp for user reference
      timestamp: new Date().toISOString(),
    },
  };

  // MANDATORY: Never expose these in production
  if (process.env.NODE_ENV === 'development') {
    (clientResponse.error as any).details = error.message;
  }

  // Send error response
  res.status(error.statusCode).json(clientResponse);
};

/**
 * Get generic error message (MANDATORY - no technical details)
 */
function getGenericErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication failed. Please log in and try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'The request conflicts with the current state. Please try again.';
    case 422:
      return 'The request could not be processed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'An unexpected error occurred. Please try again later.';
    case 503:
      return 'The service is temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again later.';
  }
}
