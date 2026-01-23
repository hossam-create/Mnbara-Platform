import { Request, Response, NextFunction } from 'express';

// Mock user interface - would be replaced with actual user model
interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'REQUESTER' | 'TRAVELER' | 'ADMIN';
  isVerified: boolean;
}

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Mock authentication - in real implementation:
    // 1. Extract JWT token from Authorization header
    // 2. Verify token signature
    // 3. Fetch user from database
    // 4. Attach user to request object
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Mock token verification
    if (token === 'mock-valid-token') {
      req.user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        role: 'REQUESTER',
        isVerified: true
      };
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({ error: 'Account verification required' });
    return;
  }

  next();
};
