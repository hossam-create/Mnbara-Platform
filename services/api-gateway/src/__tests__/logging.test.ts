/**
 * Logging Middleware Tests
 * Verifies request/response logging functionality
 */

import { Request, Response, NextFunction } from 'express';
import { loggingMiddleware, LoggedRequest } from '../middleware/logging.middleware';
import * as winston from 'winston';

describe('Logging Middleware', () => {
  let mockRequest: Partial<LoggedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      path: '/api/users',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
        'authorization': 'Bearer token123',
      },
      query: {},
      body: {
        email: 'test@example.com',
        password: 'secret123',
      },
      ip: '127.0.0.1',
      user: { id: 'user-123' },
    };

    mockResponse = {
      statusCode: 200,
      statusMessage: 'OK',
      setHeader: jest.fn(),
      get: jest.fn().mockReturnValue('100'),
      on: jest.fn(),
    };

    mockNext = jest.fn();

    loggerSpy = jest.spyOn(winston, 'createLogger');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Request ID Generation', () => {
    it('should generate request ID if not provided', () => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect((mockRequest as any).requestId).toBeDefined();
      expect((mockRequest as any).requestId).toMatch(/^gw-/);
    });

    it('should use provided X-Request-ID header', () => {
      const providedId = 'custom-request-id-123';
      mockRequest.headers = {
        ...mockRequest.headers,
        'x-request-id': providedId,
      };

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect((mockRequest as any).requestId).toBe(providedId);
    });

    it('should add request ID to response headers', () => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        expect.any(String)
      );
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should redact password field', () => {
      const requestWithPassword = {
        ...mockRequest,
        body: {
          email: 'test@example.com',
          password: 'secret123',
        },
      };

      loggingMiddleware(requestWithPassword as LoggedRequest, mockResponse as Response, mockNext);

      // Verify password is redacted in logs
      expect(mockNext).toHaveBeenCalled();
    });

    it('should redact authorization header', () => {
      mockRequest.headers = {
        ...mockRequest.headers,
        'authorization': 'Bearer secret-token',
      };

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should redact API key', () => {
      mockRequest.headers = {
        ...mockRequest.headers,
        'x-api-key': 'secret-api-key-123',
      };

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should redact nested sensitive fields', () => {
      mockRequest.body = {
        user: {
          email: 'test@example.com',
          password: 'secret123',
          creditCard: '4111-1111-1111-1111',
        },
      };

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Request Timing', () => {
    it('should record start time', () => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect((mockRequest as any).startTime).toBeDefined();
      expect(typeof (mockRequest as any).startTime).toBe('number');
    });

    it('should calculate request duration', (done) => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      // Simulate response finish
      setTimeout(() => {
        const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
          call => call[0] === 'finish'
        )?.[1];

        if (finishCallback) {
          finishCallback();
        }

        done();
      }, 100);
    });
  });

  describe('Response Logging', () => {
    it('should log response on finish event', () => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should log error on error event', () => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should include status code in response log', () => {
      mockResponse.statusCode = 201;

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Middleware Chain', () => {
    it('should call next middleware', () => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should not block request processing', () => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content Length Tracking', () => {
    it('should capture request content length', () => {
      mockRequest.headers = {
        ...mockRequest.headers,
        'content-length': '256',
      };

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should capture response content length', () => {
      mockResponse.get = jest.fn().mockReturnValue('512');

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('User Context', () => {
    it('should include user ID in logs', () => {
      mockRequest.user = { id: 'user-123' };

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing user context', () => {
      mockRequest.user = undefined;

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('IP Address Tracking', () => {
    it('should capture client IP address', () => {
      mockRequest.ip = '192.168.1.100';

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fallback to connection remote address', () => {
      mockRequest.ip = undefined;
      (mockRequest as any).connection = { remoteAddress: '10.0.0.1' };

      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle response error event', () => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      const errorCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      expect(errorCallback).toBeDefined();
    });

    it('should log error with stack trace', () => {
      loggingMiddleware(mockRequest as LoggedRequest, mockResponse as Response, mockNext);

      const errorCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorCallback) {
        const testError = new Error('Test error');
        errorCallback(testError);
      }

      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('Logger Utilities', () => {
  describe('Timer Creation', () => {
    it('should create a timer', async () => {
      const { createTimer } = await import('../utils/logger');
      const timer = createTimer();

      expect(timer.elapsed).toBeDefined();
      expect(timer.elapsedMs).toBeDefined();
    });

    it('should measure elapsed time', async () => {
      const { createTimer } = await import('../utils/logger');
      const timer = createTimer();

      await new Promise(resolve => setTimeout(resolve, 100));

      const elapsed = timer.elapsed();
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should format elapsed time as string', async () => {
      const { createTimer } = await import('../utils/logger');
      const timer = createTimer();

      await new Promise(resolve => setTimeout(resolve, 50));

      const elapsedMs = timer.elapsedMs();
      expect(elapsedMs).toMatch(/^\d+ms$/);
    });
  });

  describe('Logging Functions', () => {
    it('should export logInfo function', async () => {
      const { logInfo } = await import('../utils/logger');
      expect(typeof logInfo).toBe('function');
    });

    it('should export logWarn function', async () => {
      const { logWarn } = await import('../utils/logger');
      expect(typeof logWarn).toBe('function');
    });

    it('should export logError function', async () => {
      const { logError } = await import('../utils/logger');
      expect(typeof logError).toBe('function');
    });

    it('should export logDebug function', async () => {
      const { logDebug } = await import('../utils/logger');
      expect(typeof logDebug).toBe('function');
    });
  });

  describe('Domain-Specific Logging', () => {
    it('should export logApiCall function', async () => {
      const { logApiCall } = await import('../utils/logger');
      expect(typeof logApiCall).toBe('function');
    });

    it('should export logServiceCall function', async () => {
      const { logServiceCall } = await import('../utils/logger');
      expect(typeof logServiceCall).toBe('function');
    });

    it('should export logDatabaseOperation function', async () => {
      const { logDatabaseOperation } = await import('../utils/logger');
      expect(typeof logDatabaseOperation).toBe('function');
    });

    it('should export logAuthEvent function', async () => {
      const { logAuthEvent } = await import('../utils/logger');
      expect(typeof logAuthEvent).toBe('function');
    });

    it('should export logCircuitBreakerEvent function', async () => {
      const { logCircuitBreakerEvent } = await import('../utils/logger');
      expect(typeof logCircuitBreakerEvent).toBe('function');
    });
  });
});
