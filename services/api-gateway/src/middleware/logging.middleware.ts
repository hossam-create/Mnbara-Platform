import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export interface LoggedRequest extends Request {
  requestId?: string;
  startTime?: number;
  body?: Record<string, unknown>;
}

const redactSensitiveData = (obj: Record<string, unknown>): Record<string, unknown> => {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv'];
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

export const loggingMiddleware = (
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void => {
  const request = req as any;
  request.requestId = request.headers['x-request-id'] || uuidv4();
  request.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', request.requestId);

  const originalEnd = res.end;
  let responseBody: unknown;

  res.end = function (chunk: unknown, encoding?: unknown): Response {
    responseBody = chunk;
    return originalEnd.call(this, chunk, encoding);
  };

  // Log request
  const requestLog: Record<string, unknown> = {
    requestId: request.requestId,
    method: request.method,
    path: request.path,
    query: request.query,
    headers: {
      'content-type': request.headers['content-type'],
      'user-agent': request.headers['user-agent'],
      'x-request-id': request.requestId,
    },
    ip: request.ip,
    userId: request.user?.id,
  };

  if (req.body && Object.keys(req.body).length > 0) {
    (requestLog as any).body = redactSensitiveData(req.body);
  }

  logger.info('Incoming request', requestLog);

  // Log response on finish
  res.on('finish', () => {
    const request = req as any;
    const duration = Date.now() - (request.startTime || 0);
    const responseLog: Record<string, unknown> = {
      requestId: request.requestId,
      method: request.method,
      path: request.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: request.user?.id,
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', responseLog);
    } else {
      logger.info('Request completed successfully', responseLog);
    }
  });

  next();
};

export const requestLogger = logger;

export default loggingMiddleware;
