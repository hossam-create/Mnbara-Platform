/**
 * Correlation ID Middleware
 * Adds correlation IDs for request tracing across microservices
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithCorrelation extends Request {
  correlationId: string;
}

const CORRELATION_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generate or extract correlation ID
 */
export const correlationMiddleware = (
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
): void => {
  // Check for existing correlation ID from upstream
  let correlationId = req.headers[CORRELATION_HEADER] as string;

  // Generate new one if not present
  if (!correlationId) {
    correlationId = uuidv4();
  }

  // Generate request ID for this specific request
  const requestId = uuidv4();

  // Attach to request object
  req.correlationId = correlationId;

  // Set headers for downstream services
  req.headers[CORRELATION_HEADER] = correlationId;
  req.headers[REQUEST_ID_HEADER] = requestId;

  // Set response headers for client
  res.setHeader(CORRELATION_HEADER, correlationId);
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
};

/**
 * Get correlation ID from request
 */
export const getCorrelationId = (req: Request): string => {
  return (req as RequestWithCorrelation).correlationId || 
         req.headers[CORRELATION_HEADER] as string || 
         'unknown';
};
