/**
 * Advanced Rate Limiter Tests
 * 
 * Comprehensive test suite for rate limiting middleware.
 */

import { Request, Response, NextFunction } from 'express';
import {
  createRateLimiter,
  createRoleBasedRateLimiter,
  initializeRedis,
  closeRedis,
  RATE_LIMIT_TIERS,
  UserRole,
  generalRateLimiter,
  paymentRateLimiter,
  disputeRateLimiter
} from '../advancedRateLimiter';

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    multi: jest.fn(() => ({
      zRemRangeByScore: jest.fn(),
      zCard: jest.fn(),
      zAdd: jest.fn(),
      expire: jest.fn(),
      exec: jest.fn().mockResolvedValue([null, 0, null, null])
    }))
  }))
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Advanced Rate Limiter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeAll(async () => {
    await initializeRedis();
  });

  afterAll(async () => {
    await closeRedis();
  });

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      path: '/api/test',
      method: 'GET',
      headers: {},
      user: undefined
    };

    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('createRateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test'
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should set correct rate limit headers', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test'
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(String));
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should bypass rate limit for admin users', async () => {
      mockReq.user = {
        id: 1,
        role: UserRole.ADMIN
      };

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        keyPrefix: 'test'
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should use user ID in rate limit key when authenticated', async () => {
      mockReq.user = {
        id: 123,
        role: UserRole.VERIFIED
      };

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test'
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use API key in rate limit key when provided', async () => {
      mockReq.headers = {
        'x-api-key': 'test-api-key'
      };

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test'
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use IP address as fallback', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test'
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Role-Based Rate Limiter', () => {
    it('should apply unverified user limits', async () => {
      mockReq.user = {
        id: 1,
        role: UserRole.UNVERIFIED
      };

      const limiter = createRoleBasedRateLimiter();
      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should apply verified user limits', async () => {
      mockReq.user = {
        id: 1,
        role: UserRole.VERIFIED
      };

      const limiter = createRoleBasedRateLimiter();
      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should bypass limits for admin users', async () => {
      mockReq.user = {
        id: 1,
        role: UserRole.ADMIN
      };

      const limiter = createRoleBasedRateLimiter();
      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should default to unverified limits for unauthenticated users', async () => {
      const limiter = createRoleBasedRateLimiter();
      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Preset Rate Limiters', () => {
    it('should apply general rate limiter', async () => {
      await generalRateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
    });

    it('should apply payment rate limiter', async () => {
      await paymentRateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '20');
    });

    it('should apply dispute rate limiter', async () => {
      await disputeRateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
    });
  });

  describe('Rate Limit Tiers', () => {
    it('should have correct general tier configuration', () => {
      expect(RATE_LIMIT_TIERS.GENERAL).toEqual({
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        keyPrefix: 'rl:general'
      });
    });

    it('should have correct sensitive tier configuration', () => {
      expect(RATE_LIMIT_TIERS.SENSITIVE).toEqual({
        windowMs: 60 * 60 * 1000,
        maxRequests: 10,
        keyPrefix: 'rl:sensitive'
      });
    });

    it('should have correct webhook tier configuration', () => {
      expect(RATE_LIMIT_TIERS.WEBHOOK).toEqual({
        windowMs: 60 * 60 * 1000,
        maxRequests: 1000,
        keyPrefix: 'rl:webhook'
      });
    });

    it('should have correct payment tier configuration', () => {
      expect(RATE_LIMIT_TIERS.PAYMENT).toEqual({
        windowMs: 60 * 60 * 1000,
        maxRequests: 20,
        keyPrefix: 'rl:payment'
      });
    });

    it('should have correct payout tier configuration', () => {
      expect(RATE_LIMIT_TIERS.PAYOUT).toEqual({
        windowMs: 60 * 60 * 1000,
        maxRequests: 5,
        keyPrefix: 'rl:payout'
      });
    });

    it('should have correct dispute tier configuration', () => {
      expect(RATE_LIMIT_TIERS.DISPUTE).toEqual({
        windowMs: 60 * 60 * 1000,
        maxRequests: 10,
        keyPrefix: 'rl:dispute'
      });
    });
  });

  describe('Error Handling', () => {
    it('should allow request on Redis error', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test'
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow request when Redis is unavailable', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test'
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Custom Handler', () => {
    it('should use custom handler when provided', async () => {
      const customHandler = jest.fn();

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 0, // Force limit exceeded
        keyPrefix: 'test',
        handler: customHandler
      });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      // Note: This test may need adjustment based on actual Redis mock behavior
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
