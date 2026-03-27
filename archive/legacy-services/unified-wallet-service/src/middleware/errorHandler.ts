import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Log error details
  logger.error('Error occurred:', {
    error: {
      message: error.message,
      stack: error.stack,
      statusCode,
      code: error.code,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    timestamp: new Date().toISOString(),
  });

  // Don't send stack trace in production
  const response: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
  };

  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.stack = error.stack;
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    response.details = error.message;
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    if (error.code === 'P2002') {
      response.error = 'Unique constraint violation';
      response.details = 'A record with this information already exists';
    } else if (error.code === 'P2025') {
      response.error = 'Record not found';
      response.details = 'The requested record does not exist';
    } else if (error.code === 'P2003') {
      response.error = 'Foreign key constraint failed';
      response.details = 'Referenced record does not exist';
    }
  }

  if (error.name === 'JsonWebTokenError') {
    response.error = 'Invalid token';
    response.details = 'The provided token is invalid or expired';
  }

  if (error.name === 'TokenExpiredError') {
    response.error = 'Token expired';
    response.details = 'The provided token has expired';
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create custom error
export const createError = (message: string, statusCode: number = 500, code?: string): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  if (code) {
    error.code = code;
  }
  error.isOperational = true;
  return error;
};

// Common error creators
export const ValidationError = (message: string) => createError(message, 400, 'VALIDATION_ERROR');
export const UnauthorizedError = (message: string = 'Unauthorized') => createError(message, 401, 'UNAUTHORIZED');
export const ForbiddenError = (message: string = 'Forbidden') => createError(message, 403, 'FORBIDDEN');
export const NotFoundError = (message: string = 'Resource not found') => createError(message, 404, 'NOT_FOUND');
export const ConflictError = (message: string) => createError(message, 409, 'CONFLICT');
export const RateLimitError = (message: string = 'Too many requests') => createError(message, 429, 'RATE_LIMIT');
export const InternalServerError = (message: string = 'Internal server error') => createError(message, 500, 'INTERNAL_ERROR');