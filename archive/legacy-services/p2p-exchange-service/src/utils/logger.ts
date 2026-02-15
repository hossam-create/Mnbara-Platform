import { createLogger, format, transports, Logger } from 'winston';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Define development format (pretty print)
const devFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Create logger instance
const logger: Logger = createLogger({
  level: level(),
  levels,
  format: process.env.NODE_ENV === 'production' ? logFormat : devFormat,
  transports: [
    // Console transport
    new transports.Console(),
    
    // Error log file
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

// Add colors to winston
import winston from 'winston';
winston.addColors(colors);

// Helper functions for structured logging
export const logExchangeRequest = (action: string, data: any) => {
  logger.info('Exchange Request', {
    action,
    service: 'p2p-exchange',
    component: 'exchange-request',
    ...data,
  });
};

export const logMatch = (action: string, data: any) => {
  logger.info('Match', {
    action,
    service: 'p2p-exchange',
    component: 'matching-engine',
    ...data,
  });
};

export const logSettlement = (action: string, data: any) => {
  logger.info('Settlement', {
    action,
    service: 'p2p-exchange',
    component: 'settlement',
    ...data,
  });
};

export const logSecurity = (action: string, data: any) => {
  logger.warn('Security Event', {
    action,
    service: 'p2p-exchange',
    component: 'security',
    ...data,
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Error', {
    service: 'p2p-exchange',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

export const logPerformance = (operation: string, duration: number, data?: any) => {
  logger.http('Performance', {
    service: 'p2p-exchange',
    operation,
    duration,
    ...data,
  });
};

export default logger;
