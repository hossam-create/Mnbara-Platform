// ============================================================
// Error Handler Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ExchangeError } from '../errors/ExchangeErrors';

export interface ErrorResponse {
  error: {
    name: string;
    message: string;
    statusCode: number;
    details?: any;
  };
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  console.error('[Error]', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known exchange errors
  if (err instanceof ExchangeError) {
    const statusCode = getStatusCodeForError(err);
    const response: ErrorResponse = {
      error: {
        name: err.name,
        message: err.message,
        statusCode,
        details: getErrorDetails(err),
      },
    };
    res.status(statusCode).json(response);
    return;
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    error: {
      name: 'InternalServerError',
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
  };
  res.status(500).json(response);
};

function getStatusCodeForError(err: ExchangeError): number {
  const errorStatusMap: Record<string, number> = {
    // 400 - Bad Request
    InvalidAmountError: 400,
    InvalidRateError: 400,
    InvalidCurrencyPairError: 400,
    InvalidProofError: 400,
    IncompatibleRequestsError: 400,
    ExternalContactDetectedError: 400,

    // 401 - Unauthorized
    UnauthorizedAccessError: 401,

    // 403 - Forbidden
    InsufficientSecurityDepositError: 403,
    ExceedsTransactionLimitError: 403,
    InsufficientTrustLevelError: 403,
    SecurityDepositFrozenError: 403,
    AccountSuspendedError: 403,

    // 404 - Not Found
    ExchangeRequestNotFoundError: 404,
    MatchNotFoundError: 404,
    ProofNotFoundError: 404,
    SettlementNotFoundError: 404,
    ProviderNotFoundError: 404,
    TrustLevelNotFoundError: 404,
    SecurityDepositNotFoundError: 404,
    FXRateNotFoundError: 404,

    // 409 - Conflict
    MatchAlreadyExistsError: 409,
    ProofAlreadyExistsError: 409,
    InvalidExchangeStatusError: 409,
    InvalidMatchStatusError: 409,

    // 410 - Gone
    ExchangeRequestExpiredError: 410,

    // 422 - Unprocessable Entity
    ProofVerificationFailedError: 422,
    NoAvailableProvidersError: 422,
    ProviderNotActiveError: 422,

    // 500 - Internal Server Error
    SettlementFailedError: 500,
    PSPIntegrationError: 500,
    ExternalEscrowError: 500,
    FXProviderError: 500,

    // 504 - Gateway Timeout
    SettlementTimeoutError: 504,
  };

  return errorStatusMap[err.name] || 500;
}

function getErrorDetails(err: ExchangeError): any {
  // Extract additional details from error properties
  const details: any = {};

  // Add all enumerable properties except standard Error properties
  for (const key of Object.keys(err)) {
    if (!['name', 'message', 'stack'].includes(key)) {
      details[key] = (err as any)[key];
    }
  }

  return Object.keys(details).length > 0 ? details : undefined;
}
