import { Request, Response, NextFunction } from 'express';
import {
  InsufficientSecurityDepositError,
  ExceedsTransactionLimitError,
  InvalidProofError,
  SettlementTimeoutError,
} from '../errors/ExchangeErrors';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Handle custom errors
  if (error instanceof InsufficientSecurityDepositError) {
    res.status(400).json({
      error: 'InsufficientSecurityDeposit',
      message: error.message,
    });
    return;
  }

  if (error instanceof ExceedsTransactionLimitError) {
    res.status(400).json({
      error: 'ExceedsTransactionLimit',
      message: error.message,
    });
    return;
  }

  if (error instanceof InvalidProofError) {
    res.status(400).json({
      error: 'InvalidProof',
      message: error.message,
    });
    return;
  }

  if (error instanceof SettlementTimeoutError) {
    res.status(408).json({
      error: 'SettlementTimeout',
      message: error.message,
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      error: 'DatabaseError',
      message: 'A database error occurred',
    });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'ValidationError',
      message: error.message,
    });
    return;
  }

  // Default error
  res.status(500).json({
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
  });
};
