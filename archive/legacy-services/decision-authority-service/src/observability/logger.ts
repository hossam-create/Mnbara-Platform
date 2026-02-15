export interface StructuredLogFields {
  correlationId?: string;
  decisionId?: string;
  source?: string;
  operation?: string;
  outcome?: string;
  durationMs?: number;
  error?: string;
  [key: string]: any;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface Logger {
  debug(message: string, fields?: StructuredLogFields): void;
  info(message: string, fields?: StructuredLogFields): void;
  warn(message: string, fields?: StructuredLogFields): void;
  error(message: string, fields?: StructuredLogFields): void;
}

class StructuredLogger implements Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private log(level: LogLevel, message: string, fields: StructuredLogFields = {}): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'decision-authority-service',
      ...fields
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, fields?: StructuredLogFields): void {
    this.log(LogLevel.DEBUG, message, fields);
  }

  info(message: string, fields?: StructuredLogFields): void {
    this.log(LogLevel.INFO, message, fields);
  }

  warn(message: string, fields?: StructuredLogFields): void {
    this.log(LogLevel.WARN, message, fields);
  }

  error(message: string, fields?: StructuredLogFields): void {
    this.log(LogLevel.ERROR, message, fields);
  }
}

export const logger = new StructuredLogger(
  (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
);
