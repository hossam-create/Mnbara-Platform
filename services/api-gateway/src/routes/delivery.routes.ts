import { Router, Request, Response } from 'express';
import { httpClient } from '../services/http-client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

export const deliveryRouter = Router();

// Create delivery
deliveryRouter.post('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('delivery', {
    method: 'POST',
    path: '/api/delivery',
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get all deliveries for user
deliveryRouter.get('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('delivery', {
    method: 'GET',
    path: '/api/delivery',
    query: request.query,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get delivery by ID
deliveryRouter.get('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('delivery', {
    method: 'GET',
    path: `/api/delivery/${request.params.id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Update delivery status
deliveryRouter.put('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('delivery', {
    method: 'PUT',
    path: `/api/delivery/${request.params.id}`,
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Update delivery location
deliveryRouter.post('/:id/location', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('delivery', {
    method: 'POST',
    path: `/api/delivery/${request.params.id}/location`,
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get delivery tracking info
deliveryRouter.get('/:id/track', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('delivery', {
    method: 'GET',
    path: `/api/delivery/${request.params.id}/track`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get delivery history
deliveryRouter.get('/:id/history', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('delivery', {
    method: 'GET',
    path: `/api/delivery/${request.params.id}/history`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Cancel delivery
deliveryRouter.post('/:id/cancel', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('delivery', {
    method: 'POST',
    path: `/api/delivery/${request.params.id}/cancel`,
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

export default deliveryRouter;
