import { Request, Response, NextFunction } from 'express';

/**
 * Auth Middleware - PLACEHOLDER ONLY
 * 
 * TODO: Implement actual authentication
 * TODO: Add JWT validation
 * TODO: Add role-based access control
 * TODO: Add user context extraction
 * 
 * Current behavior: Pass-through (no authentication)
 * 
 * Rules:
 * - NO assumptions about auth mechanism
 * - NO RBAC implementation
 * - NO role checks
 * - Empty placeholder only
 */

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implement authentication
  // For now, pass through all requests
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implement authentication requirement
  // For now, pass through all requests
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implement admin authorization
  // For now, pass through all requests
  next();
}
