import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { logger } from '../utils/logger';

// Permission levels hierarchy
const PERMISSION_HIERARCHY: Record<string, number> = {
  'business:create': 100,
  'business:read': 50,
  'business:update': 75,
  'business:delete': 100,
  'accounts:create': 75,
  'accounts:read': 50,
  'accounts:update': 75,
  'accounts:delete': 100,
  'transactions:create': 50,
  'transactions:read': 25,
  'transactions:update': 75,
  'transactions:delete': 100,
  'invoices:create': 75,
  'invoices:read': 50,
  'invoices:update': 75,
  'invoices:delete': 100,
  'expenses:create': 75,
  'expenses:read': 50,
  'expenses:update': 75,
  'expenses:delete': 100,
  'ai:create': 75,
  'ai:read': 50,
  'ai:update': 75,
  'ai:delete': 100,
  'reports:create': 75,
  'reports:read': 50,
  'reports:update': 75,
  'reports:delete': 100,
  'finance:*': 100,
  'analytics:*': 75
};

export const rbacMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has admin privileges
    if (user.permissions.includes('*:*')) {
      logger.info(`Admin user granted access: ${user.email}`);
      return next();
    }

    // Check for role-based access
    const requiredPermissions = getRequiredPermissions(req.method, req.path);
    
    if (!requiredPermissions) {
      // No specific permissions required for this endpoint
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      user.permissions.includes(permission) ||
      user.permissions.some(userPerm => {
        // Check for wildcard permissions (e.g., 'business:*')
        if (userPerm.endsWith(':*')) {
          const prefix = userPerm.slice(0, -2);
          return permission.startsWith(prefix);
        }
        return false;
      })
    );

    if (!hasPermission) {
      logger.warn(`Access denied for user ${user.email}`, {
        requiredPermissions,
        userPermissions: user.permissions,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredPermissions
      });
    }

    logger.info(`Access granted for user ${user.email}`, {
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('RBAC middleware error:', error);
    return res.status(500).json({ error: 'Authorization error' });
  }
};

function getRequiredPermissions(method: string, path: string): string[] | null {
  const endpoint = `${method} ${path}`;
  
  // Define permission requirements for different endpoints
  const permissionMap: Record<string, string[]> = {
    'GET /api/internal/business': ['business:read'],
    'POST /api/internal/business': ['business:create'],
    'PUT /api/internal/business': ['business:update'],
    'DELETE /api/internal/business': ['business:delete'],
    
    'GET /api/internal/accounts': ['accounts:read'],
    'POST /api/internal/accounts': ['accounts:create'],
    'PUT /api/internal/accounts': ['accounts:update'],
    'DELETE /api/internal/accounts': ['accounts:delete'],
    
    'GET /api/internal/transactions': ['transactions:read'],
    'POST /api/internal/transactions': ['transactions:create'],
    'PUT /api/internal/transactions': ['transactions:update'],
    'DELETE /api/internal/transactions': ['transactions:delete'],
    
    'GET /api/internal/invoices': ['invoices:read'],
    'POST /api/internal/invoices': ['invoices:create'],
    'PUT /api/internal/invoices': ['invoices:update'],
    'DELETE /api/internal/invoices': ['invoices:delete'],
    
    'GET /api/internal/expenses': ['expenses:read'],
    'POST /api/internal/expenses': ['expenses:create'],
    'PUT /api/internal/expenses': ['expenses:update'],
    'DELETE /api/internal/expenses': ['expenses:delete'],
    
    'GET /api/internal/ai': ['ai:read'],
    'POST /api/internal/ai': ['ai:create'],
    'PUT /api/internal/ai': ['ai:update'],
    'DELETE /api/internal/ai': ['ai:delete'],
    
    'GET /api/internal/reports': ['reports:read'],
    'POST /api/internal/reports': ['reports:create'],
    'PUT /api/internal/reports': ['reports:update'],
    'DELETE /api/internal/reports': ['reports:delete']
  };

  // Check for exact match
  if (permissionMap[endpoint]) {
    return permissionMap[endpoint];
  }

  // Check for pattern matching (e.g., GET /api/internal/business/:id)
  for (const [pattern, permissions] of Object.entries(permissionMap)) {
    if (matchesPattern(endpoint, pattern)) {
      return permissions;
    }
  }

  return null;
}

function matchesPattern(endpoint: string, pattern: string): boolean {
  const endpointParts = endpoint.split(' ');
  const patternParts = pattern.split(' ');
  
  if (endpointParts[0] !== patternParts[0]) {
    return false;
  }
  
  const endpointPath = endpointParts[1];
  const patternPath = patternParts[1];
  
  // Simple pattern matching for now - can be enhanced
  if (patternPath.includes(':')) {
    const patternRegex = new RegExp(patternPath.replace(/:[^/]+/g, '[^/]+'));
    return patternRegex.test(endpointPath);
  }
  
  return endpointPath === patternPath;
}
