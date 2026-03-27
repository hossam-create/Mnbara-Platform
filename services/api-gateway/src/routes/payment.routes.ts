import { Router, Request, Response } from 'express';
import { httpClient } from '../services/http-client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

export const paymentRouter = Router();

// Create payment
paymentRouter.post('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('payment', {
    method: 'POST',
    path: '/api/payments',
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get all payments for user
paymentRouter.get('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('payment', {
    method: 'GET',
    path: '/api/payments',
    query: request.query,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get payment by ID
paymentRouter.get('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('payment', {
    method: 'GET',
    path: `/api/payments/${request.params.id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Process payment
paymentRouter.post('/:id/process', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('payment', {
    method: 'POST',
    path: `/api/payments/${request.params.id}/process`,
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Refund payment
paymentRouter.post('/:id/refund', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('payment', {
    method: 'POST',
    path: `/api/payments/${request.params.id}/refund`,
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Get payment methods
paymentRouter.get('/methods', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('payment', {
    method: 'GET',
    path: '/api/payments/methods',
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Add payment method
paymentRouter.post('/methods', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('payment', {
    method: 'POST',
    path: '/api/payments/methods',
    body: request.body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

// Delete payment method
paymentRouter.delete('/methods/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = req as any;
  const response = await httpClient.proxy('payment', {
    method: 'DELETE',
    path: `/api/payments/methods/${request.params.id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization || '',
    },
  });
  res.status(response.status).json(response.data);
}));

export default paymentRouter;
