/**
 * Structured Logger Service
 * Sprint 3: Market Hardening & Go-Live Safety
 *
 * Provides structured logging with:
 * - requestId correlation
 * - corridor context
 * - intent classification
 * - risk level
 *
 * CONSTRAINTS:
 * - No PII in logs
 * - Deterministic output format
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  version: string;
  environment: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  corridor?: string;
  intent?: string;
  riskLevel?: string;
  trustLevel?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Service metadata
const SERVICE_NAME = 'crowdship-service';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Log buffer for batch processing (production: send to log aggregator)
const logBuffer: StructuredLogEntry[] = [];
const MAX_BUFFER_SIZE = 1000;

/**
 * Create a structured log entry
 */
export function structuredLog(
  level: LogLevel,
  message: string,
  context?: Partial<Omit<StructuredLogEntry, 'timestamp' | 'level' | 'message' | 'service' | 'version' | 'environment'>>
): StructuredLogEntry {
  const entry: StructuredLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    environment: ENVIRONMENT,
    ...context,
  };

  // Sanitize PII
  if (entry.metadata) {
    entry.metadata = sanitizeMetadata(entry.metadata);
  }

  // Add to buffer
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Output to console in structured format
  const output = JSON.stringify(entry);
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(output);
      break;
    case LogLevel.INFO:
      console.info(output);
      break;
    case LogLevel.WARN:
      console.warn(output);
      break;
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(output);
      break;
  }

  return entry;
}

/**
 * Sanitize metadata to remove PII
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'email', 'phone', 'ssn', 'creditCard', 'address'];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some((f) => lowerKey.includes(f))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Create a request-scoped logger
 */
export class RequestLogger {
  private requestId: string;
  private correlationId?: string;
  private userId?: string;
  private corridor?: string;
  private startTime: number;

  constructor(requestId: string, options?: { correlationId?: string; userId?: string; corridor?: string }) {
    this.requestId = requestId;
    this.correlationId = options?.correlationId;
    this.userId = options?.userId;
    this.corridor = options?.corridor;
    this.startTime = Date.now();
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): StructuredLogEntry {
    return structuredLog(level, message, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      userId: this.userId,
      corridor: this.corridor,
      durationMs: Date.now() - this.startTime,
      metadata,
    });
  }

  debug(message: string, metadata?: Record<string, unknown>): StructuredLogEntry {
    return this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): StructuredLogEntry {
    return this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): StructuredLogEntry {
    return this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): StructuredLogEntry {
    return structuredLog(LogLevel.ERROR, message, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      userId: this.userId,
      corridor: this.corridor,
      durationMs: Date.now() - this.startTime,
      metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: ENVIRONMENT === 'development' ? error.stack : undefined,
          }
        : undefined,
    });
  }

  /**
   * Log corridor advisory request
   */
  logCorridorAdvisory(data: { corridor: string; intent?: string; riskLevel?: string; trustLevel?: string; action?: string }): StructuredLogEntry {
    this.corridor = data.corridor;
    return structuredLog(LogLevel.INFO, 'Corridor advisory processed', {
      requestId: this.requestId,
      correlationId: this.correlationId,
      userId: this.userId,
      corridor: data.corridor,
      intent: data.intent,
      riskLevel: data.riskLevel,
      trustLevel: data.trustLevel,
      durationMs: Date.now() - this.startTime,
      metadata: { action: data.action },
    });
  }

  /**
   * Log human confirmation checkpoint
   */
  logConfirmation(checkpointType: string, confirmed: boolean): StructuredLogEntry {
    return this.log(LogLevel.INFO, 'Human confirmation recorded', {
      checkpointType,
      confirmed,
    });
  }
}

/**
 * Get recent logs (for debugging/monitoring)
 */
export function getRecentLogs(options?: { level?: LogLevel; limit?: number; requestId?: string }): StructuredLogEntry[] {
  let logs = [...logBuffer];

  if (options?.level) {
    const levelOrder = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const minLevel = levelOrder.indexOf(options.level);
    logs = logs.filter((l) => levelOrder.indexOf(l.level) >= minLevel);
  }

  if (options?.requestId) {
    logs = logs.filter((l) => l.requestId === options.requestId);
  }

  return logs.slice(-(options?.limit || 100));
}

/**
 * Clear log buffer (for testing)
 */
export function clearLogBuffer(): void {
  logBuffer.length = 0;
}

export default {
  structuredLog,
  RequestLogger,
  getRecentLogs,
  clearLogBuffer,
  LogLevel,
};
