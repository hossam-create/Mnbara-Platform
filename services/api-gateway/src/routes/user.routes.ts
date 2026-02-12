import { Router, Request, Response } from 'express';
import { httpClient } from '../services/http-client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

export const userRouter = Router();

// Get all users (admin only)
userRouter.get('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('user', {
    method: 'GET',
    path: '/api/users',
    query: req.query as Record<string, string>,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get user by ID
userRouter.get('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('user', {
    method: 'GET',
    path: `/api/users/${req.params.id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Update user
userRouter.put('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('user', {
    method: 'PUT',
    path: `/api/users/${req.params.id}`,
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Delete user (admin only)
userRouter.delete('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('user', {
    method: 'DELETE',
    path: `/api/users/${req.params.id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get user preferences
userRouter.get('/:id/preferences', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('user', {
    method: 'GET',
    path: `/api/users/${req.params.id}/preferences`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Update user preferences
userRouter.put('/:id/preferences', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('user', {
    method: 'PUT',
    path: `/api/users/${req.params.id}/preferences`,
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get user addresses
userRouter.get('/:id/addresses', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('user', {
    method: 'GET',
    path: `/api/users/${req.params.id}/addresses`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Add user address
userRouter.post('/:id/addresses', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('user', {
    method: 'POST',
    path: `/api/users/${req.params.id}/addresses`,
    body: req.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Delete user address
userRouter.delete('/:id/addresses/:addressId', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await httpClient.proxy('user', {
    method: 'DELETE',
    path: `/api/users/${req.params.id}/addresses/${req.params.addressId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

export default userRouter;
