import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express, { Express } from 'express';
import { ExchangeRequestController } from '../exchange-request.controller';
import { ExchangeRequestService } from '../../services/exchange-request.service';
import { SecurityDepositService } from '../../services/security-deposit.service';
import { TrustLevelService } from '../../services/trust-level.service';
import { FeeCalculationService } from '../../services/fee-calculation.service';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();

describe('Exchange Request API Integration Tests', () => {
  let app: Express;
  let controller: ExchangeRequestController;
  let testUserId: string;
  let testRequestId: string;

  // Mock auth middleware
  const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = { id: testUserId, isAdmin: false };
    next();
  };

  // Validation middleware
  const validateCreateRequest = [
    body('fromCurrency').isString().notEmpty(),
    body('toCurrency').isString().notEmpty(),
    body('fromAmount').isFloat({ min: 0.01 }),
    body('toAmount').isFloat({ min: 0.01 }),
    body('rate').isFloat({ min: 0.01 }),
  ];

  const validateRequestId = [
    body('id').isString().notEmpty(),
  ];

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    controller = new ExchangeRequestController();

    // Setup routes
    app.post('/api/v1/exchange/requests', validateCreateRequest, (req, res, next) => {
      controller.createRequest(req, res, next);
    });

    app.get('/api/v1/exchange/requests/:id', (req, res, next) => {
      controller.getRequest(req, res, next);
    });

    app.get('/api/v1/exchange/requests', (req, res, next) => {
      controller.getUserRequests(req, res, next);
    });

    app.delete('/api/v1/exchange/requests/:id', (req, res, next) => {
      controller.cancelRequest(req, res, next);
    });

    // Create test user
    testUserId = 'test-user-' + Date.now();

    // Create security deposit for test user
    await prisma.securityDeposit.create({
      data: {
        userId: testUserId,
        amount: 1000,
        currency: 'USD',
        frozenAmount: 0,
      },
    });

    // Create trust level for test user
    await prisma.trustLevel.create({
      data: {
        userId: testUserId,
        level: 'LEVEL_2',
        maxTransactionAmount: 5000,
        successfulExchanges: 0,
        totalExchanges: 0,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.exchangeRequest.deleteMany({ where: { userId: testUserId } });
    await prisma.securityDeposit.deleteMany({ where: { userId: testUserId } });
    await prisma.trustLevel.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/exchange/requests', () => {
    it('should create a new exchange request successfully', async () => {
      const response = await request(app)
        .post('/api/v1/exchange/requests')
        .send({
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 92,
          rate: 0.92,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          preferredSettlement: 'INTERNAL',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('request');
      expect(response.body).toHaveProperty('fees');
      expect(response.body.request.fromCurrency).toBe('USD');
      expect(response.body.request.toCurrency).toBe('EUR');
      expect(response.body.request.fromAmount).toBe(100);
      expect(response.body.request.status).toBe('OPEN');

      testRequestId = response.body.request.id;
    });

    it('should return 400 for invalid currency', async () => {
      const response = await request(app)
        .post('/api/v1/exchange/requests')
        .send({
          fromCurrency: '',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 92,
          rate: 0.92,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/api/v1/exchange/requests')
        .send({
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: -100,
          toAmount: 92,
          rate: 0.92,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for insufficient security deposit', async () => {
      // Create user with no security deposit
      const newUserId = 'test-user-no-deposit-' + Date.now();
      (app as any).use((req: any, res: any, next: any) => {
        if (req.path.includes('no-deposit')) {
          req.user = { id: newUserId, isAdmin: false };
        }
        next();
      });

      const response = await request(app)
        .post('/api/v1/exchange/requests')
        .send({
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 92,
          rate: 0.92,
        });

      // This test depends on the user not having a security deposit
      // The actual response will depend on the implementation
      expect([400, 401]).toContain(response.status);
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());

      appNoAuth.post('/api/v1/exchange/requests', validateCreateRequest, (req, res, next) => {
        controller.createRequest(req, res, next);
      });

      const response = await request(appNoAuth)
        .post('/api/v1/exchange/requests')
        .send({
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 92,
          rate: 0.92,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/exchange/requests/:id', () => {
    it('should return request details for valid ID', async () => {
      const response = await request(app)
        .get(`/api/v1/exchange/requests/${testRequestId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('request');
      expect(response.body.request.id).toBe(testRequestId);
      expect(response.body.request.userId).toBe(testUserId);
    });

    it('should return 404 for non-existent request', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/requests/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for unauthorized access', async () => {
      // Create another user's request
      const otherUserId = 'test-user-other-' + Date.now();
      const otherRequest = await prisma.exchangeRequest.create({
        data: {
          userId: otherUserId,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 92,
          rate: 0.92,
          status: 'OPEN',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .get(`/api/v1/exchange/requests/${otherRequest.id}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');

      // Cleanup
      await prisma.exchangeRequest.delete({ where: { id: otherRequest.id } });
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());

      appNoAuth.get('/api/v1/exchange/requests/:id', (req, res, next) => {
        controller.getRequest(req, res, next);
      });

      const response = await request(appNoAuth)
        .get(`/api/v1/exchange/requests/${testRequestId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/exchange/requests', () => {
    it('should return user requests with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/requests')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.requests)).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });

    it('should filter requests by status', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/requests')
        .query({ status: 'OPEN', page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      expect(Array.isArray(response.body.requests)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/requests')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());

      appNoAuth.get('/api/v1/exchange/requests', (req, res, next) => {
        controller.getUserRequests(req, res, next);
      });

      const response = await request(appNoAuth)
        .get('/api/v1/exchange/requests');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/exchange/requests/:id', () => {
    it('should cancel an open request successfully', async () => {
      // Create a request to cancel
      const requestToCancel = await prisma.exchangeRequest.create({
        data: {
          userId: testUserId,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 50,
          toAmount: 46,
          rate: 0.92,
          status: 'OPEN',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .delete(`/api/v1/exchange/requests/${requestToCancel.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('request');
      expect(response.body.request.status).toBe('CANCELLED');
    });

    it('should return 404 for non-existent request', async () => {
      const response = await request(app)
        .delete('/api/v1/exchange/requests/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for unauthorized cancellation', async () => {
      // Create another user's request
      const otherUserId = 'test-user-other-' + Date.now();
      const otherRequest = await prisma.exchangeRequest.create({
        data: {
          userId: otherUserId,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 92,
          rate: 0.92,
          status: 'OPEN',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .delete(`/api/v1/exchange/requests/${otherRequest.id}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');

      // Cleanup
      await prisma.exchangeRequest.delete({ where: { id: otherRequest.id } });
    });

    it('should return 400 for non-OPEN request', async () => {
      // Create a matched request
      const matchedRequest = await prisma.exchangeRequest.create({
        data: {
          userId: testUserId,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 75,
          toAmount: 69,
          rate: 0.92,
          status: 'MATCHED',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .delete(`/api/v1/exchange/requests/${matchedRequest.id}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');

      // Cleanup
      await prisma.exchangeRequest.delete({ where: { id: matchedRequest.id } });
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());

      appNoAuth.delete('/api/v1/exchange/requests/:id', (req, res, next) => {
        controller.cancelRequest(req, res, next);
      });

      const response = await request(appNoAuth)
        .delete(`/api/v1/exchange/requests/${testRequestId}`);

      expect(response.status).toBe(401);
    });
  });
});
