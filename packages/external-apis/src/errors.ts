/**
 * Error Handling for External APIs
 */

import { ApiError } from './types';

export class ExternalApiError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ExternalApiError';
    this.code = error.code;
    this.statusCode = error.statusCode;
    this.details = error.details;
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class RateLimitError extends ExternalApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super({
      code: 'RATE_LIMIT_EXCEEDED',
      message,
      statusCode: 429,
    });
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends ExternalApiError {
  constructor(message: string = 'Authentication failed') {
    super({
      code: 'AUTHENTICATION_FAILED',
      message,
      statusCode: 401,
    });
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends ExternalApiError {
  constructor(message: string, details?: any) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      statusCode: 400,
      details,
    });
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends ExternalApiError {
  constructor(message: string = 'Request timeout') {
    super({
      code: 'TIMEOUT',
      message,
      statusCode: 408,
    });
    this.name = 'TimeoutError';
  }
}

export class ServiceUnavailableError extends ExternalApiError {
  constructor(message: string = 'Service unavailable') {
    super({
      code: 'SERVICE_UNAVAILABLE',
      message,
      statusCode: 503,
    });
    this.name = 'ServiceUnavailableError';
  }
}

export function handleApiError(error: any): ExternalApiError {
  if (error instanceof ExternalApiError) {
    return error;
  }

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;

    if (status === 429) {
      return new RateLimitError(message);
    }
    if (status === 401 || status === 403) {
      return new AuthenticationError(message);
    }
    if (status === 400) {
      return new ValidationError(message, error.response.data);
    }
    if (status >= 500) {
      return new ServiceUnavailableError(message);
    }

    return new ExternalApiError({
      code: 'API_ERROR',
      message,
      statusCode: status,
      details: error.response.data,
    });
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new TimeoutError(error.message);
  }

  return new ExternalApiError({
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    details: error,
  });
}
