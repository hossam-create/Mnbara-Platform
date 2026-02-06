// Logger Utility
// Simple logger for AI Pricing Service

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  error?: Error;
}

class Logger {
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private currentLevel: LogLevel;

  constructor() {
    this.currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.currentLevel];
  }

  private formatMessage(msg: LogMessage): string {
    const parts = [
      `[${msg.timestamp}]`,
      `[${msg.level.toUpperCase()}]`,
      msg.message,
    ];

    if (msg.data) {
      parts.push(JSON.stringify(msg.data));
    }

    if (msg.error) {
      parts.push(`Error: ${msg.error.message}`);
      if (msg.error.stack) {
        parts.push(msg.error.stack);
      }
    }

    return parts.join(' ');
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      error,
    };

    const formatted = this.formatMessage(logMessage);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: any): void {
    this.log('error', message, data, error);
  }

  // Convenience methods
  startTimer(): () => number {
    const start = Date.now();
    return () => {
      const elapsed = Date.now() - start;
      this.debug(`Timer elapsed: ${elapsed}ms`);
      return elapsed;
    };
  }
}

export const logger = new Logger();
export default logger;
