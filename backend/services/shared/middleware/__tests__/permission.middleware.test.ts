/**
 * Security Compliance Tests - Access Control Policies
 * Requirements: 19.1 - Test access control policies
 * Task: 31.5 Write security compliance tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  checkPermission,
  checkOwnership,
  authorizeRoles,
  adminOnly,
  superAdminOnly,
  selfOrAdmin,
  kycVerified,
} from '../permission.middleware';
import { UserRole, ResourceType, PermissionAction, AuthenticatedUser } from '../permission.types';

// Mock request, response, and next function
const mockRequest = (user?: Partial<AuthenticatedUser> | null, params?: Record<string, string>): Partial<Request> => ({
  user: user as AuthenticatedUser | undefined,
  params: params || {},
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res) as any;
  res.json = jest.fn().mockReturnValue(res) as any;
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Permission Middleware - Security Compliance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Enforcement', () => {
    it('should reject requests without authentication', () => {
      const req = mockRequest(undefined);
      const res = mockResponse();
      const middleware = checkPermission('listing', 'read');

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'AUTH_REQUIRED',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject null user object', () => {
      const req = mockRequest(null);
      const res = mockResponse();
      const middleware = adminOnly;

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    const testCases: Array<{
      role: UserRole;
      resource: ResourceType;
      action: PermissionAction;
      shouldAllow: boolean;
    }> = [
      // BUYER permissions
      { role: 'BUYER', resource: 'listing', action: 'read', shouldAllow: true },
      { role: 'BUYER', resource: 'listing', action: 'create', shouldAllow: false },
      { role: 'BUYER', resource: 'order', action: 'create', shouldAllow: true },
      { role: 'BUYER', resource: 'user', action: 'delete', shouldAllow: false },

      // SELLER permissions
      { role: 'SELLER', resource: 'listing', action: 'create', shouldAllow: true },
      { role: 'SELLER', resource: 'listing', action: 'update', shouldAllow: true },
      { role: 'SELLER', resource: 'user', action: 'delete', shouldAllow: false },

      // TRAVELER permissions
      { role: 'TRAVELER', resource: 'trip', action: 'create', shouldAllow: true },
      { role: 'TRAVELER', resource: 'delivery', action: 'update', shouldAllow: true },
      { role: 'TRAVELER', resource: 'user', action: 'delete', shouldAllow: false },

      // ADMIN permissions
      { role: 'ADMIN', resource: 'user', action: 'read', shouldAllow: true },
      { role: 'ADMIN', resource: 'user', action: 'update', shouldAllow: true },
      { role: 'ADMIN', resource: 'dispute', action: 'update', shouldAllow: true },

      // SUPER_ADMIN permissions
      { role: 'SUPER_ADMIN', resource: 'user', action: 'delete', shouldAllow: true },
      { role: 'SUPER_ADMIN', resource: 'settings', action: 'update', shouldAllow: true },
    ];

    testCases.forEach(({ role, resource, action, shouldAllow }) => {
      it(`should ${shouldAllow ? 'allow' : 'deny'} ${role} to ${action} ${resource}`, () => {
        const req = mockRequest({ id: 1, role, email: 'test@test.com' });
        const res = mockResponse();
        const middleware = checkPermission(resource, action);

        middleware(req as Request, res as Response, mockNext);

        if (shouldAllow) {
          expect(mockNext).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
        } else {
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              code: 'PERMISSION_DENIED',
            })
          );
          expect(mockNext).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('Admin Access Control', () => {
    it('should allow ADMIN role through adminOnly middleware', () => {
      const req = mockRequest({ id: 1, role: 'ADMIN', email: 'admin@test.com' });
      const res = mockResponse();

      adminOnly(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow SUPER_ADMIN role through adminOnly middleware', () => {
      const req = mockRequest({ id: 1, role: 'SUPER_ADMIN', email: 'superadmin@test.com' });
      const res = mockResponse();

      adminOnly(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny BUYER role through adminOnly middleware', () => {
      const req = mockRequest({ id: 1, role: 'BUYER', email: 'buyer@test.com' });
      const res = mockResponse();

      adminOnly(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ADMIN_REQUIRED',
        })
      );
    });

    it('should deny SELLER role through adminOnly middleware', () => {
      const req = mockRequest({ id: 1, role: 'SELLER', email: 'seller@test.com' });
      const res = mockResponse();

      adminOnly(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should deny TRAVELER role through adminOnly middleware', () => {
      const req = mockRequest({ id: 1, role: 'TRAVELER', email: 'traveler@test.com' });
      const res = mockResponse();

      adminOnly(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Super Admin Access Control', () => {
    it('should allow only SUPER_ADMIN through superAdminOnly middleware', () => {
      const req = mockRequest({ id: 1, role: 'SUPER_ADMIN', email: 'superadmin@test.com' });
      const res = mockResponse();

      superAdminOnly(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny ADMIN through superAdminOnly middleware', () => {
      const req = mockRequest({ id: 1, role: 'ADMIN', email: 'admin@test.com' });
      const res = mockResponse();

      superAdminOnly(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SUPER_ADMIN_REQUIRED',
        })
      );
    });
  });

  describe('Role Authorization', () => {
    it('should allow user with any of the specified roles', () => {
      const req = mockRequest({ id: 1, role: 'SELLER', email: 'seller@test.com' });
      const res = mockResponse();
      const middleware = authorizeRoles('SELLER', 'ADMIN');

      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny user without any of the specified roles', () => {
      const req = mockRequest({ id: 1, role: 'BUYER', email: 'buyer@test.com' });
      const res = mockResponse();
      const middleware = authorizeRoles('SELLER', 'ADMIN');

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ROLE_REQUIRED',
          requiredRoles: ['SELLER', 'ADMIN'],
        })
      );
    });
  });

  describe('Self or Admin Access', () => {
    it('should allow user to access their own resource', () => {
      const req = mockRequest({ id: 123, role: 'BUYER', email: 'buyer@test.com' }, { userId: '123' });
      const res = mockResponse();
      const middleware = selfOrAdmin('userId');

      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow admin to access any user resource', () => {
      const req = mockRequest({ id: 1, role: 'ADMIN', email: 'admin@test.com' }, { userId: '999' });
      const res = mockResponse();
      const middleware = selfOrAdmin('userId');

      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny user from accessing another user resource', () => {
      const req = mockRequest({ id: 123, role: 'BUYER', email: 'buyer@test.com' }, { userId: '456' });
      const res = mockResponse();
      const middleware = selfOrAdmin('userId');

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SELF_OR_ADMIN_REQUIRED',
        })
      );
    });
  });

  describe('Resource Ownership', () => {
    it('should allow owner to access their resource', async () => {
      const mockGetResource = jest.fn<() => Promise<{ id: string; userId: number } | null>>()
        .mockResolvedValue({ id: '1', userId: 123 });
      const req = mockRequest({ id: 123, role: 'BUYER', email: 'buyer@test.com' }, { id: '1' });
      const res = mockResponse();
      const middleware = checkOwnership({
        getResource: mockGetResource,
        ownerField: 'userId',
      });

      await middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny non-owner from accessing resource', async () => {
      const mockGetResource = jest.fn<() => Promise<{ id: string; userId: number } | null>>()
        .mockResolvedValue({ id: '1', userId: 456 });
      const req = mockRequest({ id: 123, role: 'BUYER', email: 'buyer@test.com' }, { id: '1' });
      const res = mockResponse();
      const middleware = checkOwnership({
        getResource: mockGetResource,
        ownerField: 'userId',
      });

      await middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'OWNERSHIP_REQUIRED',
        })
      );
    });

    it('should allow admin to bypass ownership check when configured', async () => {
      const mockGetResource = jest.fn<() => Promise<{ id: string; userId: number } | null>>()
        .mockResolvedValue({ id: '1', userId: 456 });
      const req = mockRequest({ id: 1, role: 'ADMIN', email: 'admin@test.com' }, { id: '1' });
      const res = mockResponse();
      const middleware = checkOwnership({
        getResource: mockGetResource,
        ownerField: 'userId',
        allowAdmin: true,
      });

      await middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetResource).not.toHaveBeenCalled(); // Admin bypasses resource fetch
    });

    it('should return 404 for non-existent resource', async () => {
      const mockGetResource = jest.fn<() => Promise<{ id: string; userId: number } | null>>()
        .mockResolvedValue(null);
      const req = mockRequest({ id: 123, role: 'BUYER', email: 'buyer@test.com' }, { id: '999' });
      const res = mockResponse();
      const middleware = checkOwnership({
        getResource: mockGetResource,
        ownerField: 'userId',
      });

      await middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'RESOURCE_NOT_FOUND',
        })
      );
    });

    it('should return 400 when resource ID is missing', async () => {
      const mockGetResource = jest.fn<() => Promise<{ id: string; userId: number } | null>>();
      const req = mockRequest({ id: 123, role: 'BUYER', email: 'buyer@test.com' }, {});
      const res = mockResponse();
      const middleware = checkOwnership({
        getResource: mockGetResource,
        ownerField: 'userId',
      });

      await middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'RESOURCE_ID_REQUIRED',
        })
      );
    });
  });

  describe('KYC Verification', () => {
    it('should allow KYC-verified user', async () => {
      const mockCheckKycStatus = jest.fn<(userId: number) => Promise<boolean>>()
        .mockResolvedValue(true);
      const req = mockRequest({ id: 123, role: 'TRAVELER', email: 'traveler@test.com' });
      const res = mockResponse();
      const middleware = kycVerified(mockCheckKycStatus);

      await middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockCheckKycStatus).toHaveBeenCalledWith(123);
    });

    it('should deny non-KYC-verified user', async () => {
      const mockCheckKycStatus = jest.fn<(userId: number) => Promise<boolean>>()
        .mockResolvedValue(false);
      const req = mockRequest({ id: 123, role: 'TRAVELER', email: 'traveler@test.com' });
      const res = mockResponse();
      const middleware = kycVerified(mockCheckKycStatus);

      await middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'KYC_REQUIRED',
        })
      );
    });

    it('should handle KYC check errors gracefully', async () => {
      const mockCheckKycStatus = jest.fn<(userId: number) => Promise<boolean>>()
        .mockRejectedValue(new Error('Database error'));
      const req = mockRequest({ id: 123, role: 'TRAVELER', email: 'traveler@test.com' });
      const res = mockResponse();
      const middleware = kycVerified(mockCheckKycStatus);

      await middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'KYC_CHECK_ERROR',
        })
      );
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle role injection attempts', () => {
      // Attempt to inject admin role via request manipulation
      const req = mockRequest({ id: 1, role: 'BUYER', email: 'buyer@test.com' });
      (req as any).body = { role: 'ADMIN' }; // Attempted injection
      const res = mockResponse();

      adminOnly(req as Request, res as Response, mockNext);

      // Should still use the authenticated user's role, not the injected one
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle undefined role gracefully', () => {
      const req = mockRequest({ id: 1, role: undefined as any, email: 'test@test.com' });
      const res = mockResponse();
      const middleware = checkPermission('listing', 'read');

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle invalid role string', () => {
      const req = mockRequest({ id: 1, role: 'INVALID_ROLE' as UserRole, email: 'test@test.com' });
      const res = mockResponse();
      const middleware = checkPermission('listing', 'read');

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
