import { Router, Request, Response } from 'express';
import { httpClient } from '../services/http-client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

export const orderRouter = Router();

// Create new order
orderRouter.post('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('order', {
    method: 'POST',
    path: '/api/orders',
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get all orders for user
orderRouter.get('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('order', {
    method: 'GET',
    path: '/api/orders',
    query: request.query,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get order by ID
orderRouter.get('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('order', {
    method: 'GET',
    path: `/api/orders/${request.params.id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Update order
orderRouter.put('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('order', {
    method: 'PUT',
    path: `/api/orders/${request.params.id}`,
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Cancel order
orderRouter.post('/:id/cancel', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('order', {
    method: 'POST',
    path: `/api/orders/${request.params.id}/cancel`,
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get order items
orderRouter.get('/:id/items', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('order', {
    method: 'GET',
    path: `/api/orders/${request.params.id}/items`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get order status history
orderRouter.get('/:id/history', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('order', {
    method: 'GET',
    path: `/api/orders/${request.params.id}/history`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

export default orderRouter;
