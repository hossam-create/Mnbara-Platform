import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express, { Express } from 'express';
import { MarketplaceController } from '../marketplace.controller';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();

describe('Marketplace API Integration Tests', () => {
  let app: Express;
  let controller: MarketplaceController;
  let testUserId: string;
  let testBuyerId: string;
  let testRequestId: string;

  // Mock auth middleware
  const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = { id: testUserId, isAdmin: false };
    next();
  };

  // Validation middleware
  const validateAcceptOffer = [
    body('requestId').isString().notEmpty(),
  ];

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    controller = new MarketplaceController();

    // Setup routes
    app.get('/api/v1/exchange/marketplace', (req, res, next) => {
      controller.browseMarketplace(req, res, next);
    });

    app.post('/api/v1/exchange/marketplace/:requestId/accept', validateAcceptOffer, (req, res, next) => {
      controller.acceptOffer(req, res, next);
    });

    // Create test users
    testUserId = 'test-seller-' + Date.now();
    testBuyerId = 'test-buyer-' + Date.now();

    // Create security deposits for both users
    await prisma.securityDeposit.create({
      data: {
        userId: testUserId,
        amount: 1000,
        currency: 'USD',
        frozenAmount: 0,
      },
    });

    await prisma.securityDeposit.create({
      data: {
        userId: testBuyerId,
        amount: 1000,
        currency: 'EUR',
        frozenAmount: 0,
      },
    });

    // Create trust levels for both users
    await prisma.trustLevel.create({
      data: {
        userId: testUserId,
        level: 'LEVEL_2',
        maxTransactionAmount: 5000,
        successfulExchanges: 5,
        totalExchanges: 6,
      },
    });

    await prisma.trustLevel.create({
      data: {
        userId: testBuyerId,
        level: 'LEVEL_2',
        maxTransactionAmount: 5000,
        successfulExchanges: 3,
        totalExchanges: 4,
      },
    });

    // Create test exchange requests
    const request1 = await prisma.exchangeRequest.create({
      data: {
        userId: testUserId,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: 100,
        toAmount: 92,
        rate: 0.92,
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    testRequestId = request1.id;

    // Create additional requests for filtering/sorting tests
    await prisma.exchangeRequest.create({
      data: {
        userId: testUserId,
        fromCurrency: 'USD',
        toCurrency: 'GBP',
        fromAmount: 200,
        toAmount: 160,
        rate: 0.80,
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    await prisma.exchangeRequest.create({
      data: {
        userId: testUserId,
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        fromAmount: 50,
        toAmount: 55,
        rate: 1.10,
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.exchangeRequest.deleteMany({ where: { userId: testUserId } });
    await prisma.exchangeRequest.deleteMany({ where: { userId: testBuyerId } });
    await prisma.exchangeMatch.deleteMany({ where: { buyerId: testBuyerId } });
    await prisma.securityDeposit.deleteMany({ where: { userId: testUserId } });
    await prisma.securityDeposit.deleteMany({ where: { userId: testBuyerId } });
    await prisma.trustLevel.deleteMany({ where: { userId: testUserId } });
    await prisma.trustLevel.deleteMany({ where: { userId: testBuyerId } });
    await prisma.$disconnect();
  });

  describe('GET /api/v1/exchange/marketplace', () => {
    it('should return all open requests', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.requests)).toBe(true);
      expect(response.body.requests.length).toBeGreaterThan(0);
    });

    it('should filter by fromCurrency', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ fromCurrency: 'USD' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      expect(response.body.requests.every((r: any) => r.fromCurrency === 'USD')).toBe(true);
    });

    it('should filter by toCurrency', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ toCurrency: 'EUR' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      expect(response.body.requests.every((r: any) => r.toCurrency === 'EUR')).toBe(true);
    });

    it('should filter by minAmount', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ minAmount: 100 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      expect(response.body.requests.every((r: any) => r.fromAmount >= 100)).toBe(true);
    });

    it('should filter by maxAmount', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ maxAmount: 150 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      expect(response.body.requests.every((r: any) => r.fromAmount <= 150)).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          minAmount: 50,
          maxAmount: 150,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      expect(response.body.requests.every((r: any) =>
        r.fromCurrency === 'USD' &&
        r.toCurrency === 'EUR' &&
        r.fromAmount >= 50 &&
        r.fromAmount <= 150
      )).toBe(true);
    });

    it('should sort by rate ascending', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ sortBy: 'rate', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      
      // Verify sorting
      for (let i = 1; i < response.body.requests.length; i++) {
        expect(response.body.requests[i].rate).toBeGreaterThanOrEqual(
          response.body.requests[i - 1].rate
        );
      }
    });

    it('should sort by rate descending', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ sortBy: 'rate', sortOrder: 'desc' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
      
      // Verify sorting
      for (let i = 1; i < response.body.requests.length; i++) {
        expect(response.body.requests[i].rate).toBeLessThanOrEqual(
          response.body.requests[i - 1].rate
        );
      }
    });

    it('should sort by amount', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ sortBy: 'amount', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
    });

    it('should sort by createdAt', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.requests.length).toBeLessThanOrEqual(2);
    });

    it('should return correct pagination info', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should return filter info in response', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ fromCurrency: 'USD', toCurrency: 'EUR' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('filters');
      expect(response.body.filters.fromCurrency).toBe('USD');
      expect(response.body.filters.toCurrency).toBe('EUR');
    });

    it('should return sorting info in response', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/marketplace')
        .query({ sortBy: 'rate', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sorting');
      expect(response.body.sorting.sortBy).toBe('rate');
      expect(response.body.sorting.sortOrder).toBe('asc');
    });
  });

  describe('POST /api/v1/exchange/marketplace/:requestId/accept', () => {
    it('should accept an offer successfully', async () => {
      // Update auth middleware to use buyer ID
      const appWithBuyer = express();
      appWithBuyer.use(express.json());
      appWithBuyer.use((req: any, res: any, next: any) => {
        req.user = { id: testBuyerId, isAdmin: false };
        next();
      });

      appWithBuyer.post('/api/v1/exchange/marketplace/:requestId/accept', validateAcceptOffer, (req, res, next) => {
        controller.acceptOffer(req, res, next);
      });

      const response = await request(appWithBuyer)
        .post(`/api/v1/exchange/marketplace/${testRequestId}/accept`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('match');
      expect(response.body.match.buyerId).toBe(testBuyerId);
      expect(response.body.match.sellerId).toBe(testUserId);
    });

    it('should return 404 for non-existent request', async () => {
      const appWithBuyer = express();
      appWithBuyer.use(express.json());
      appWithBuyer.use((req: any, res: any, next: any) => {
        req.user = { id: testBuyerId, isAdmin: false };
        next();
      });

      appWithBuyer.post('/api/v1/exchange/marketplace/:requestId/accept', validateAcceptOffer, (req, res, next) => {
        controller.acceptOffer(req, res, next);
      });

      const response = await request(appWithBuyer)
        .post('/api/v1/exchange/marketplace/non-existent-id/accept');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if request is not OPEN', async () => {
      // Create a matched request
      const matchedRequest = await prisma.exchangeRequest.create({
        data: {
          userId: testUserId,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 92,
          rate: 0.92,
          status: 'MATCHED',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const appWithBuyer = express();
      appWithBuyer.use(express.json());
      appWithBuyer.use((req: any, res: any, next: any) => {
        req.user = { id: testBuyerId, isAdmin: false };
        next();
      });

      appWithBuyer.post('/api/v1/exchange/marketplace/:requestId/accept', validateAcceptOffer, (req, res, next) => {
        controller.acceptOffer(req, res, next);
      });

      const response = await request(appWithBuyer)
        .post(`/api/v1/exchange/marketplace/${matchedRequest.id}/accept`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');

      // Cleanup
      await prisma.exchangeRequest.delete({ where: { id: matchedRequest.id } });
    });

    it('should return 400 if user tries to accept own request', async () => {
      // Create a request by the same user
      const ownRequest = await prisma.exchangeRequest.create({
        data: {
          userId: testBuyerId,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 92,
          rate: 0.92,
          status: 'OPEN',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const appWithBuyer = express();
      appWithBuyer.use(express.json());
      appWithBuyer.use((req: any, res: any, next: any) => {
        req.user = { id: testBuyerId, isAdmin: false };
        next();
      });

      appWithBuyer.post('/api/v1/exchange/marketplace/:requestId/accept', validateAcceptOffer, (req, res, next) => {
        controller.acceptOffer(req, res, next);
      });

      const response = await request(appWithBuyer)
        .post(`/api/v1/exchange/marketplace/${ownRequest.id}/accept`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');

      // Cleanup
      await prisma.exchangeRequest.delete({ where: { id: ownRequest.id } });
    });

    it('should return 400 for insufficient security deposit', async () => {
      // Create a user with no security deposit
      const noDepsitUserId = 'test-user-no-deposit-' + Date.now();

      // Create a request
      const request = await prisma.exchangeRequest.create({
        data: {
          userId: testUserId,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 92,
          rate: 0.92,
          status: 'OPEN',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const appWithNoDeposit = express();
      appWithNoDeposit.use(express.json());
      appWithNoDeposit.use((req: any, res: any, next: any) => {
        req.user = { id: noDepsitUserId, isAdmin: false };
        next();
      });

      appWithNoDeposit.post('/api/v1/exchange/marketplace/:requestId/accept', validateAcceptOffer, (req, res, next) => {
        controller.acceptOffer(req, res, next);
      });

      const response = await request(appWithNoDeposit)
        .post(`/api/v1/exchange/marketplace/${request.id}/accept`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');

      // Cleanup
      await prisma.exchangeRequest.delete({ where: { id: request.id } });
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());

      appNoAuth.post('/api/v1/exchange/marketplace/:requestId/accept', validateAcceptOffer, (req, res, next) => {
        controller.acceptOffer(req, res, next);
      });

      const response = await request(appNoAuth)
        .post(`/api/v1/exchange/marketplace/${testRequestId}/accept`);

      expect(response.status).toBe(401);
    });
  });
});
