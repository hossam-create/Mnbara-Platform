// Winston Logger Configuration
// Configuration du logger Winston

import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_FILE_PATH || './logs';
const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase().padEnd(7)}] ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'security-service' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 10
    }),
    // Security-specific logs
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'info',
      maxsize: 10485760,
      maxFiles: 30
    }),
    // Audit logs
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      level: 'info',
      maxsize: 10485760,
      maxFiles: 100
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// Helper methods for specific log types
export const securityLogger = {
  info: (message: string, meta?: Record<string, unknown>) => 
    logger.info(`[SECURITY] ${message}`, meta),
  
  warn: (message: string, meta?: Record<string, unknown>) => 
    logger.warn(`[SECURITY] ${message}`, meta),
  
  error: (message: string, meta?: Record<string, unknown>) => 
    logger.error(`[SECURITY] ${message}`, meta),
  
  audit: (message: string, meta?: Record<string, unknown>) => 
    logger.info(`[AUDIT] ${message}`, meta),
  
  alert: (message: string, meta?: Record<string, unknown>) => 
    logger.error(`[ALERT] ${message}`, meta)
};

export const watermarkLogger = {
  info: (message: string, meta?: Record<string, unknown>) => 
    logger.info(`[WATERMARK] ${message}`, meta),
  
  warn: (message: string, meta?: Record<string, unknown>) => 
    logger.warn(`[WATERMARK] ${message}`, meta),
  
  error: (message: string, meta?: Record<string, unknown>) => 
    logger.error(`[WATERMARK] ${message}`, meta),
  
  leak: (message: string, meta?: Record<string, unknown>) => 
    logger.warn(`[LEAK DETECTED] ${message}`, meta)
};

export const vulnerabilityLogger = {
  info: (message: string, meta?: Record<string, unknown>) => 
    logger.info(`[VULN] ${message}`, meta),
  
  critical: (vulnId: string, details: Record<string, unknown>) => 
    logger.error(`[CRITICAL VULNERABILITY] ${vulnId}`, details),
  
  scan: (target: string, status: string, meta?: Record<string, unknown>) => 
    logger.info(`[SCAN] ${target} - ${status}`, meta)
};

export const patchLogger = {
  info: (message: string, meta?: Record<string, unknown>) => 
    logger.info(`[PATCH] ${message}`, meta),
  
  critical: (patchId: string, details: Record<string, unknown>) => 
    logger.error(`[CRITICAL PATCH] ${patchId}`, details),
  
  deployment: (patchId: string, env: string, status: string) => 
    logger.info(`[DEPLOYMENT] Patch ${patchId} to ${env}: ${status}`)
};

export default logger;
