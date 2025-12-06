import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'mnbara-backend',
        environment: process.env.NODE_ENV,
      },
      transports: [
        // Console output
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),

        // Error logs
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
        }),

        // Combined logs
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),

        // Blockchain logs
        new DailyRotateFile({
          filename: 'logs/blockchain-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'info',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for blockchain logging
  logTransaction(data: {
    txHash: string;
    contract: string;
    method: string;
    from?: string;
    to?: string;
    value?: string;
    status: 'pending' | 'confirmed' | 'failed';
  }) {
    this.logger.info('Blockchain transaction', {
      category: 'blockchain',
      ...data,
    });
  }

  logEscrow(data: {
    auctionId: number;
    event: string;
    amount?: string;
    buyer?: string;
    seller?: string;
  }) {
    this.logger.info('Escrow operation', {
      category: 'escrow',
      ...data,
    });
  }

  logAPI(data: {
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    userId?: number;
  }) {
    this.logger.info('API request', {
      category: 'api',
      ...data,
    });
  }

  logAuth(data: {
    event: 'login' | 'logout' | 'register' | 'failed_login';
    userId?: number;
    walletAddress?: string;
    method: 'web3' | 'traditional' | '2fa';
  }) {
    this.logger.info('Authentication event', {
      category: 'auth',
      ...data,
    });
  }

  logSecurity(data: {
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: number;
    ipAddress?: string;
    details?: any;
  }) {
    this.logger.warn('Security event', {
      category: 'security',
      ...data,
    });
  }
}
