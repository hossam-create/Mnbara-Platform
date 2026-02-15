/**
 * Plugin Logger
 * 
 * Logging utility for MNBara plugins
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  pluginId?: string;
  pluginName?: string;
  version?: string;
  environment?: string;
  [key: string]: any;
}

export interface PluginLogger {
  log: (level: string, message: string, context?: any) => void;
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  setContext: (context: LogContext) => void;
  getContext: () => LogContext;
}

export class DefaultPluginLogger implements PluginLogger {
  private context: LogContext = {};

  constructor(context?: LogContext) {
    if (context) {
      this.context = context;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.ERROR, message, context);
  }

  log(level: string, message: string, context?: any): void {
    const logLevel = Object.values(LogLevel).includes(level as LogLevel) ? level as LogLevel : LogLevel.INFO;
    this.writeLog(logLevel, message, context);
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): LogContext {
    return { ...this.context };
  }

  private writeLog(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logContext = { ...this.context, ...context };
    
    const logEntry = {
      timestamp,
      level,
      message,
      context: logContext
    };

    // In a real implementation, this would use a proper logging library
    // For now, we'll use console.log
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      console.log(logMessage, JSON.stringify(context, null, 2));
    } else {
      console.log(logMessage);
    }
  }
}