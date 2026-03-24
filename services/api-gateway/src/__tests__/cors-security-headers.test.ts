import { Request, Response, NextFunction } from 'express';
import { corsMiddleware, corsErrorHandler } from '../middleware/cors.middleware';
import { securityHeadersMiddleware } from '../middleware/security-headers.middleware';

describe('CORS Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('CORS Configuration', () => {
    it('should export corsMiddleware function', () => {
      expect(typeof corsMiddleware).toBe('function');
    });

    it('should export corsErrorHandler function', () => {
      expect(typeof corsErrorHandler).toBe('function');
    });

    it('corsMiddleware should return a function', () => {
      const middleware = corsMiddleware();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('CORS Error Handler', () => {
    it('should handle CORS policy errors', () => {
      const error = new Error('CORS policy: origin http://example.com is not allowed');
      corsErrorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CORS Error',
          message: expect.stringContaining('CORS policy'),
        })
      );
    });

    it('should pass non-CORS errors to next middleware', () => {
      const error = new Error('Some other error');
      corsErrorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

describe('Security Headers Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('Security Headers Configuration', () => {
    it('should export securityHeadersMiddleware function', () => {
      expect(typeof securityHeadersMiddleware).toBe('function');
    });

    it('should set X-Frame-Options header', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should set X-Content-Type-Options header', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('should set X-XSS-Protection header', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    });

    it('should set Strict-Transport-Security header', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const calls = (mockRes.setHeader as jest.Mock).mock.calls;
      const hstsCall = calls.find(call => call[0] === 'Strict-Transport-Security');
      expect(hstsCall).toBeDefined();
      expect(hstsCall[1]).toContain('max-age=');
    });

    it('should set Referrer-Policy header', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      );
    });

    it('should set Permissions-Policy header', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const calls = (mockRes.setHeader as jest.Mock).mock.calls;
      const permissionsCall = calls.find(call => call[0] === 'Permissions-Policy');
      expect(permissionsCall).toBeDefined();
      expect(permissionsCall[1]).toContain('accelerometer=()');
    });

    it('should set custom Server header', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Server', 'Mnbara-API-Gateway');
    });

    it('should set X-Permitted-Cross-Domain-Policies header', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Permitted-Cross-Domain-Policies', 'none');
    });

    it('should remove Server header before setting custom one', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.removeHeader).toHaveBeenCalledWith('Server');
    });

    it('should call next middleware', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Security Headers Completeness', () => {
    it('should set all required security headers', () => {
      securityHeadersMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const calls = (mockRes.setHeader as jest.Mock).mock.calls;
      const headerNames = calls.map(call => call[0]);

      expect(headerNames).toContain('X-Frame-Options');
      expect(headerNames).toContain('X-Content-Type-Options');
      expect(headerNames).toContain('X-XSS-Protection');
      expect(headerNames).toContain('Strict-Transport-Security');
      expect(headerNames).toContain('Referrer-Policy');
      expect(headerNames).toContain('Permissions-Policy');
      expect(headerNames).toContain('X-Permitted-Cross-Domain-Policies');
      expect(headerNames).toContain('Server');
    });
  });
});
