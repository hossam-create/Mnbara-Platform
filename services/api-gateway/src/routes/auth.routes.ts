import { Router, Request, Response } from 'express';
import { httpClient } from '../services/http-client';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rate-limit.middleware';
import { asyncHandler } from '../middleware/error.middleware';

export const authRouter = Router();

// Public routes (rate limited)
authRouter.post('/register', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/register',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': req.ip || '',
    },
  });
  res.status(response.status).json(response.data);
}));

authRouter.post('/login', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/login',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': req.ip || '',
    },
  });
  res.status(response.status).json(response.data);
}));

authRouter.post('/logout', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/logout',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

authRouter.post('/refresh', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/refresh',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  res.status(response.status).json(response.data);
}));

// Protected routes
authRouter.get('/profile', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'GET',
    path: '/api/auth/profile',
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

authRouter.put('/profile', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'PUT',
    path: '/api/auth/profile',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

authRouter.post('/change-password', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/change-password',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Email verification
authRouter.post('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/verify-email',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  res.status(response.status).json(response.data);
}));

authRouter.get('/verify-email/:token', asyncHandler(async (req: Request, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'GET',
    path: `/api/auth/verify-email/${req.params.token}`,
  });
  res.status(response.status).json(response.data);
}));

// Password reset
authRouter.post('/forgot-password', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/forgot-password',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  res.status(response.status).json(response.data);
}));

authRouter.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/reset-password',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  res.status(response.status).json(response.data);
}));

// 2FA
authRouter.post('/enable-2fa', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/enable-2fa',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

authRouter.post('/verify-2fa', asyncHandler(async (req: Request, res: Response) => {
  const response = await httpClient.proxy('auth', {
    method: 'POST',
    path: '/api/auth/verify-2fa',
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  res.status(response.status).json(response.data);
}));

export default authRouter;
