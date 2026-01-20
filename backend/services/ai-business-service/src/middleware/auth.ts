import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Extract roles and permissions
    const roles = user.roles.map(ur => ur.role.name);
    const permissions = user.roles.flatMap(ur => ur.role.permissions);

    req.user = {
      id: user.id,
      email: user.email,
      roles,
      permissions
    };

    logger.info(`User authenticated: ${user.email}`, { userId: user.id, roles });
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authenticateToken = authMiddleware;

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = allowedRoles.some(role => req.user!.roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.roles
      });
    }

    next();
  };
};
