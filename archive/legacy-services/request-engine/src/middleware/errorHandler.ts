/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the application.
 * Converts errors to appropriate HTTP responses.
 */

import { Request, Response, NextFunction } from 'express';
import { DisputeError } from '../errors/DisputeErrors';
import { logger } from '../utils/logger';

/**
 * Error handler middleware
 * Catches all errors and returns appropriate responses
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Handle DisputeError (custom errors)
  if (error instanceof DisputeError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    });
    return;
  }

  // Handle Multer errors (file upload)
  if (error.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: `File upload error: ${error.message}`,
      code: 'FILE_UPLOAD_ERROR'
    });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR'
    });
    return;
  }

  // Handle database errors
  if (error.name === 'QueryFailedError' || error.message.includes('database')) {
    res.status(500).json({
      success: false,
      error: 'Database error occurred',
      code: 'DATABASE_ERROR'
    });
    return;
  }

  // Handle generic errors
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

/**
 * Not found handler
 * Returns 404 for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND'
  });
};
