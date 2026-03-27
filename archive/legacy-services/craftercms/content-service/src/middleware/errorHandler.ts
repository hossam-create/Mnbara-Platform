import { Request, Response, NextFunction } from 'express';
import { Logger } from '@mnbara/shared-utils';

const logger = new Logger('ErrorHandler');

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', error);

  // Default error response
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An internal server error occurred';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = 'Access denied';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = error.message;
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = error.message;
  } else if (error.name === 'RateLimitError') {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = 'Too many requests';
  } else if (error.code) {
    // Handle custom error codes
    errorCode = error.code;
    message = error.message;
    
    // Map known error codes to status codes
    switch (error.code) {
      case 'CONTENT_NOT_FOUND':
      case 'SITE_NOT_FOUND':
      case 'USER_NOT_FOUND':
        statusCode = 404;
        break;
      case 'CONTENT_LOCKED':
      case 'INVALID_CONTENT_TYPE':
      case 'VALIDATION_ERROR':
        statusCode = 400;
        break;
      case 'PUBLISHING_FAILED':
      case 'WORKFLOW_ERROR':
        statusCode = 422;
        break;
      case 'PERMISSION_DENIED':
        statusCode = 403;
        break;
      case 'RATE_LIMIT_EXCEEDED':
        statusCode = 429;
        break;
      case 'SERVICE_UNAVAILABLE':
        statusCode = 503;
        break;
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.details,
      }),
    },
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error classes
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}