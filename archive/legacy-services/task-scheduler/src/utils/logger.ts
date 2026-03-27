import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'task-scheduler' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

export default logger;

// Create execution-specific logger
export function createExecutionLogger(executionId: string) {
  const logs: string[] = [];
  
  return {
    info: (message: string) => {
      const log = `[INFO] ${message}`;
      logs.push(log);
      logger.info(`[${executionId}] ${message}`);
    },
    warn: (message: string) => {
      const log = `[WARN] ${message}`;
      logs.push(log);
      logger.warn(`[${executionId}] ${message}`);
    },
    error: (message: string) => {
      const log = `[ERROR] ${message}`;
      logs.push(log);
      logger.error(`[${executionId}] ${message}`);
    },
    debug: (message: string) => {
      const log = `[DEBUG] ${message}`;
      logs.push(log);
      logger.debug(`[${executionId}] ${message}`);
    },
    getLogs: () => logs.join('\n')
  };
}
