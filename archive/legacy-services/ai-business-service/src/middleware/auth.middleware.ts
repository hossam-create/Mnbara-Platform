import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    businessAccountId?: string;
  };
}

// Rate limiting function
export const rateLimit = (options: {
  windowMs: number;
  max: number;
  message: any;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false
  });
};

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user has admin role
    const user = await prisma.businessUser.findUnique({
      where: { id: decoded.userId },
      include: {
        businessAccount: true
      }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.userId, // In real implementation, this would be user email
      role: user.role,
      businessAccountId: user.businessAccountId
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
}

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user exists
    const user = await prisma.businessUser.findUnique({
      where: { id: decoded.userId },
      include: {
        businessAccount: true
      }
    });

    if (!user) {
      return res.status(403).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.userId, // In real implementation, this would be user email
      role: user.role,
      businessAccountId: user.businessAccountId
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // In real implementation, check user permissions
    // For now, assume admin has all permissions
    const userPermissions = JSON.parse(user.permissions || '[]');
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: `Permission '${permission}' required`,
        code: 'PERMISSION_REQUIRED'
      });
    }

    next();
  };
}
