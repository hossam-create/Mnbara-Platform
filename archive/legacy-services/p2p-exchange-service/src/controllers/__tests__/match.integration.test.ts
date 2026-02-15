import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express, { Express } from 'express';
import { MatchController } from '../match.controller';
import { body } from 'express-validator';

const prisma = new PrismaClient();

describe('Match API Integration Tests', () => {
  let app: Express;
  let controller: MatchController;
  let testSellerId: string;
  let testBuyerId: string;
  let testMatchId: string;

  const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = { id: req.query.userId || testSellerId, isAdmin: false };
    next();
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    controller = new MatchController();

    app.get('/api/v1/exchange/matches/:id', (req, res, next) => {
      controller.getMatch(req, res, next);
    });

    app.post('/api/v1/exchange/matches/:id/initiate-payment', (req, res, next) => {
      controller.initiatePayment(req, res, next);
    });

    app.post('/api/v1/exchange/matches/:id/upload-proof', (req, res, next) => {
      controller.uploadProof(req, res, next);
    });

    app.post('/api/v1/exchange/matches/:id/confirm-receipt', (req, res, next) => {
      controller.confirmReceipt(req, res, next);
    });

    testSellerId = 'test-seller-' + Date.now();
    testBuyerId = 'test-buyer-' + Date.now();

    // Create test match
    const sellerRequest = await prisma.exchangeRequest.create({
      data: {
        userId: testSellerId,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: 100,
        toAmount: 92,
        rate: 0.92,
        status: 'MATCHED',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    const buyerRequest = await prisma.exchangeRequest.create({
      data: {
        userId: testBuyerId,
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        fromAmount: 92,
        toAmount: 100,
        rate: 0.92,
        status: 'MATCHED',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    const match = await prisma.exchangeMatch.create({
      data: {
        sellerId: testSellerId,
        buyerId: testBuyerId,
        sellerRequestId: sellerRequest.id,
        buyerRequestId: buyerRequest.id,
        sellerAmount: 100,
        buyerAmount: 92,
        status: 'ACCEPTED',
      },
    });

    testMatchId = match.id;
  });

  afterAll(async () => {
    await prisma.exchangeMatch.deleteMany({ where: { sellerId: testSellerId } });
    await prisma.exchangeRequest.deleteMany({ where: { userId: testSellerId } });
    await prisma.exchangeRequest.deleteMany({ where: { userId: testBuyerId } });
    await prisma.$disconnect();
  });

  describe('GET /api/v1/exchange/matches/:id', () => {
    it('should return match details for seller', async () => {
      const response = await request(app)
        .get(`/api/v1/exchange/matches/${testMatchId}`)
        .query({ userId: testSellerId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('match');
      expect(response.body.match.id).toBe(testMatchId);
    });

    it('should return match details for buyer', async () => {
      const response = await request(app)
        .get(`/api/v1/exchange/matches/${testMatchId}`)
        .query({ userId: testBuyerId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('match');
    });

    it('should return 404 for non-existent match', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/matches/non-existent')
        .query({ userId: testSellerId });

      expect(response.status).toBe(404);
    });

    it('should return 403 for unauthorized user', async () => {
      const response = await request(app)
        .get(`/api/v1/exchange/matches/${testMatchId}`)
        .query({ userId: 'unauthorized-user' });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/exchange/matches/:id/initiate-payment', () => {
    it('should initiate payment successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/exchange/matches/${testMatchId}/initiate-payment`)
        .query({ userId: testBuyerId })
        .send({
          paymentMethod: 'STRIPE',
          externalEscrowProviderId: null,
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('settlement');
    });

    it('should return 403 if not buyer', async () => {
      const response = await request(app)
        .post(`/api/v1/exchange/matches/${testMatchId}/initiate-payment`)
        .query({ userId: testSellerId })
        .send({
          paymentMethod: 'STRIPE',
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent match', async () => {
      const response = await request(app)
        .post('/api/v1/exchange/matches/non-existent/initiate-payment')
        .query({ userId: testBuyerId })
        .send({
          paymentMethod: 'STRIPE',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/exchange/matches/:id/upload-proof', () => {
    it('should upload proof successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/exchange/matches/${testMatchId}/upload-proof`)
        .query({ userId: testBuyerId })
        .send({
          proofType: 'BANK_TRANSFER',
          proofData: 'base64encodeddata',
          description: 'Bank transfer receipt',
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('proof');
    });

    it('should return 403 if not buyer', async () => {
      const response = await request(app)
        .post(`/api/v1/exchange/matches/${testMatchId}/upload-proof`)
        .query({ userId: testSellerId })
        .send({
          proofType: 'BANK_TRANSFER',
          proofData: 'data',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/exchange/matches/:id/confirm-receipt', () => {
    it('should confirm receipt successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/exchange/matches/${testMatchId}/confirm-receipt`)
        .query({ userId: testSellerId });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('match');
    });

    it('should return 403 if not seller', async () => {
      const response = await request(app)
        .post(`/api/v1/exchange/matches/${testMatchId}/confirm-receipt`)
        .query({ userId: testBuyerId });

      expect(response.status).toBe(403);
    });
  });
});
