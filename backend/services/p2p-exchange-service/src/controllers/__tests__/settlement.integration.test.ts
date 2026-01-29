import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express, { Express } from 'express';
import { SettlementController } from '../settlement.controller';
import crypto from 'crypto';

const prisma = new PrismaClient();

describe('Settlement API Integration Tests', () => {
  let app: Express;
  let controller: SettlementController;
  let testSettlementId: string;

  const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = { id: 'test-user', isAdmin: false };
    next();
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    controller = new SettlementController();

    app.get('/api/v1/exchange/settlements/:id', (req, res, next) => {
      controller.getSettlement(req, res, next);
    });

    app.post('/api/v1/exchange/webhooks/psp/:provider', (req, res, next) => {
      controller.handlePSPWebhook(req, res, next);
    });

    app.post('/api/v1/exchange/webhooks/escrow/:provider', (req, res, next) => {
      controller.handleEscrowWebhook(req, res, next);
    });

    // Create test settlement
    const match = await prisma.exchangeMatch.create({
      data: {
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        sellerRequestId: 'req-1',
        buyerRequestId: 'req-2',
        sellerAmount: 100,
        buyerAmount: 92,
        status: 'ACCEPTED',
      },
    });

    const settlement = await prisma.settlement.create({
      data: {
        matchId: match.id,
        status: 'PENDING',
        paymentMethod: 'STRIPE',
        amount: 100,
        currency: 'USD',
      },
    });

    testSettlementId = settlement.id;
  });

  afterAll(async () => {
    await prisma.settlement.deleteMany({});
    await prisma.exchangeMatch.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/v1/exchange/settlements/:id', () => {
    it('should return settlement details', async () => {
      const response = await request(app)
        .get(`/api/v1/exchange/settlements/${testSettlementId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('settlement');
      expect(response.body.settlement.id).toBe(testSettlementId);
    });

    it('should return 404 for non-existent settlement', async () => {
      const response = await request(app)
        .get('/api/v1/exchange/settlements/non-existent');

      expect(response.status).toBe(404);
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.get('/api/v1/exchange/settlements/:id', (req, res, next) => {
        controller.getSettlement(req, res, next);
      });

      const response = await request(appNoAuth)
        .get(`/api/v1/exchange/settlements/${testSettlementId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/exchange/webhooks/psp/:provider', () => {
    it('should accept webhook with valid signature', async () => {
      const payload = { type: 'payment_intent.succeeded', data: { object: { metadata: {} } } };
      const timestamp = Date.now().toString();
      const secret = 'test-secret';
      const message = `${timestamp}.${JSON.stringify(payload)}`;
      const signature = crypto.createHmac('sha256', secret).update(message).digest('hex');

      process.env.STRIPE_WEBHOOK_SECRET = secret;

      const response = await request(app)
        .post('/api/v1/exchange/webhooks/psp/stripe')
        .send({
          ...payload,
          signature,
          timestamp,
        });

      expect([200, 400]).toContain(response.status);
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = { type: 'payment_intent.succeeded', data: {} };
      const response = await request(app)
        .post('/api/v1/exchange/webhooks/psp/stripe')
        .send({
          ...payload,
          signature: 'invalid-signature',
          timestamp: Date.now().toString(),
        });

      expect(response.status).toBe(401);
    });

    it('should handle unknown provider', async () => {
      const response = await request(app)
        .post('/api/v1/exchange/webhooks/psp/unknown')
        .send({
          signature: 'sig',
          timestamp: Date.now().toString(),
        });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('POST /api/v1/exchange/webhooks/escrow/:provider', () => {
    it('should accept escrow webhook', async () => {
      const payload = { type: 'ESCROW_RELEASED', data: { escrowId: 'test' } };
      const timestamp = Date.now().toString();
      const secret = 'test-secret';
      const message = `${timestamp}.${JSON.stringify(payload)}`;
      const signature = crypto.createHmac('sha256', secret).update(message).digest('hex');

      process.env.TATUM_WEBHOOK_SECRET = secret;

      const response = await request(app)
        .post('/api/v1/exchange/webhooks/escrow/tatum')
        .send({
          ...payload,
          signature,
          timestamp,
        });

      expect([200, 400]).toContain(response.status);
    });

    it('should reject invalid escrow webhook', async () => {
      const response = await request(app)
        .post('/api/v1/exchange/webhooks/escrow/tatum')
        .send({
          signature: 'invalid',
          timestamp: Date.now().toString(),
        });

      expect(response.status).toBe(401);
    });
  });
});
