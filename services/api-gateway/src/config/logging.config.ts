/**
 * Logging Configuration
 * Centralized logging setup for the API Gateway
 */

export interface LoggingConfig {
  level: string;
  format: string;
  transports: {
    console: boolean;
    file: boolean;
    errorFile: boolean;
    requestFile: boolean;
  };
  files: {
    general: string;
    error: string;
    requests: string;
  };
  maxFileSize: number;
  maxFiles: number;
  redactedFields: string[];
  logRequestBody: boolean;
  logResponseBody: boolean;
  logHeaders: boolean;
  slowRequestThreshold: number;
}

export const loggingConfig: LoggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  transports: {
    console: true,
    file: true,
    errorFile: true,
    requestFile: true,
  },
  files: {
    general: 'logs/api-gateway.log',
    error: 'logs/api-gateway-error.log',
    requests: 'logs/api-gateway-requests.log',
  },
  maxFileSize: 10485760, // 10MB
  maxFiles: 5,
  redactedFields: [
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
    'bearer',
    'jwt',
  ],
  logRequestBody: process.env.LOG_REQUEST_BODY !== 'false',
  logResponseBody: process.env.LOG_RESPONSE_BODY !== 'false',
  logHeaders: process.env.LOG_HEADERS !== 'false',
  slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000', 10),
};

export default loggingConfig;
