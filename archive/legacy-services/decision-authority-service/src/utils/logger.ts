import winston from 'winston';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// JSON formatter for structured logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console formatter for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: jsonFormat,
  defaultMeta: { service: 'decision-authority-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
    }),
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: jsonFormat,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: jsonFormat,
    }),
  ],
});

// Structured logging methods
export const log = {
  // Info level
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },

  // Debug level
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },

  // Warning level
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },

  // Error level
  error: (message: string, error?: Error | Record<string, any>, meta?: Record<string, any>) => {
    if (error instanceof Error) {
      logger.error(message, {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        ...meta,
      });
    } else {
      logger.error(message, { ...error, ...meta });
    }
  },

  // Decision request logging
  decisionRequest: (decisionId: string, assetType: string, assetId: string, meta?: Record<string, any>) => {
    logger.info('Decision request received', {
      decisionId,
      assetType,
      assetId,
      ...meta,
    });
  },

  // Decision response logging
  decisionResponse: (decisionId: string, status: string, duration: number, meta?: Record<string, any>) => {
    logger.info('Decision response sent', {
      decisionId,
      status,
      durationMs: duration,
      ...meta,
    });
  },

  // Decision error logging
  decisionError: (decisionId: string, error: Error | string, meta?: Record<string, any>) => {
    const errorMsg = error instanceof Error ? error.message : error;
    logger.error('Decision error', {
      decisionId,
      error: errorMsg,
      ...meta,
    });
  },

  // Audit log
  audit: (action: string, actor: string, resource: string, meta?: Record<string, any>) => {
    logger.info('Audit event', {
      action,
      actor,
      resource,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },

  // Performance logging
  performance: (operation: string, duration: number, meta?: Record<string, any>) => {
    logger.info('Performance metric', {
      operation,
      durationMs: duration,
      ...meta,
    });
  },

  // Health check logging
  health: (status: string, meta?: Record<string, any>) => {
    logger.info('Health check', {
      status,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },
};

export default logger;
