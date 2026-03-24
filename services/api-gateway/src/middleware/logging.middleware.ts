import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'api-gateway.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: winston.format.json(),
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'api-gateway-error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: winston.format.json(),
    }),
    // File transport for request/response logs
    new winston.transports.File({
      filename: path.join(logsDir, 'api-gateway-requests.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: winston.format.json(),
    }),
  ],
});

export interface LoggedRequest extends Request {
  requestId?: string;
  startTime?: number;
  body?: Record<string, unknown>;
  responseTime?: number;
}

interface RequestLogData {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  query?: Record<string, unknown>;
  headers: Record<string, unknown>;
  ip: string;
  userId?: string;
  body?: Record<string, unknown>;
  contentLength?: number;
}

interface ResponseLogData {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  statusMessage?: string;
  duration: number;
  userId?: string;
  responseSize?: number;
  headers?: Record<string, unknown>;
}

const redactSensitiveData = (obj: Record<string, unknown>): Record<string, unknown> => {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'cvv',
    'authorization',
    'x-api-key',
    'x-auth-token',
    'cookie',
    'set-cookie',
  ];
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

const getContentLength = (obj: unknown): number => {
  try {
    return JSON.stringify(obj).length;
  } catch {
    return 0;
  }
};

export const loggingMiddleware = (
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void => {
  const request = req as any;
  request.requestId = request.headers['x-request-id'] || `gw-${uuidv4()}`;
  request.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', request.requestId);

  // Capture request headers (redacted)
  const requestHeaders = redactSensitiveData(
    Object.fromEntries(
      Object.entries(request.headers).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.substring(0, 100) : value,
      ])
    ) as Record<string, unknown>
  );

  // Log incoming request
  const requestLogData: RequestLogData = {
    requestId: request.requestId,
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.path,
    query: Object.keys(request.query).length > 0 ? request.query : undefined,
    headers: requestHeaders,
    ip: request.ip || request.connection.remoteAddress,
    userId: request.user?.id,
    contentLength: request.headers['content-length']
      ? parseInt(request.headers['content-length'], 10)
      : undefined,
  };

  if (req.body && Object.keys(req.body).length > 0) {
    requestLogData.body = redactSensitiveData(req.body);
  }

  logger.info('Incoming request', requestLogData);

  // Capture response
  const originalJson = res.json;
  const originalSend = res.send;
  let responseBody: unknown;
  let responseSize = 0;

  res.json = function (body: unknown): Response {
    responseBody = body;
    responseSize = getContentLength(body);
    return originalJson.call(this, body);
  };

  res.send = function (body: unknown): Response {
    responseBody = body;
    responseSize = typeof body === 'string' ? body.length : getContentLength(body);
    return originalSend.call(this, body);
  };

  // Log response on finish
  res.on('finish', () => {
    const request = req as any;
    const duration = Date.now() - (request.startTime || 0);

    const responseLogData: ResponseLogData = {
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration,
      userId: request.user?.id,
      responseSize: responseSize || res.get('content-length')
        ? parseInt(res.get('content-length') || '0', 10)
        : 0,
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', responseLogData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', responseLogData);
    } else if (duration > 1000) {
      logger.warn('Request completed with slow response', responseLogData);
    } else {
      logger.info('Request completed successfully', responseLogData);
    }
  });

  // Log on error
  res.on('error', (error: Error) => {
    const request = req as any;
    const duration = Date.now() - (request.startTime || 0);

    logger.error('Request error', {
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
      duration,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  });

  next();
};

export const requestLogger = logger;

export default loggingMiddleware;
