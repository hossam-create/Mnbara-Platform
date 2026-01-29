import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express, { Express } from 'express';
import { SecurityController } from '../security.controller';
import { CommunicationController } from '../communication.controller';
import { AdminExchangeController } from '../admin-exchange.controller';
import { body } from 'express-validator';

const prisma = new PrismaClient();

describe('Security, Communication & Admin API Integration Tests', () => {
  let app: Express;
  let securityController: SecurityController;
  let communicationController: CommunicationController;
  let adminController: AdminExchangeController;
  let testUserId: string;
  let testMatchId: string;

  const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = { id: req.query.userId || testUserId, isAdmin: req.query.isAdmin === 'true' };
    next();
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    securityController = new SecurityController();
    communicationController = new CommunicationController();
    adminController = new AdminExchangeController();

    testUserId = 'test-user-' + Date.now();

    // Security endpoints
    app.get('/api/v1/exchange/security-deposit', (req, res, next) => {
      securityController.getSecurityDeposit(req, res, next);
    });

    app.post('/api/v1/exchange/security-deposit/add', (req, res, next) => {
      securityController.addToSecurityDeposit(req, res, next);
    });

    app.get('/api/v1/exchange/trust-level', (req, res, next) => {
      securityController.getTrustLevel(req, res, next);
    });

    app.get('/api/v1/exchange/external-escrow-providers', (req, res, next) => {
      securityController.getEscrowProviders(req, res, next);
    });

    // Communication endpoints
    app.post('/api/v1/exchange/matches/:matchId/messages', (req, res, next) => {
      communicationController.sendMessage(req, res, next);
    });

    app.get('/api/v1/exchange/matches/:matchId/messages', (req, res, next) => {
      communicationController.getMessages(req, res, next);
    });

    // Admin endpoints
    app.get('/api/v1/admin/exchange/requests', (req, res, next) => {
      adminController.listRequests(req, res, next);
    });

    app.get('/api/v1/admin/exchange/proofs/pending', (req, res, next) => {
      adminController.getPendingProofs(req, res, next);
    });

    app.get('/api/v1/admin/exchange/statistics', (req, res, next) => {
      adminController.getStatistics(req, res, next);
    });

    // Create test data
    await prisma.securityDeposit.create({
      data: {
        userId: testUserId,
        amount: 1000,
        currency: 'USD',
        frozenAmount: 0,
      },
    });

    await prisma.trustLevel.create({
      data: {
        userId: testUserId,
        level: 'LEVEL_2',
        maxTransactionAmount: 5000,
        successfulExchanges: 5,
        totalExchanges: 6,
      },
    });

    const match = await prisma.exchangeMatch.create({
      data: {
        sellerId: testUserId,
        buyerId: 'buyer-1',
        sellerRequestId: 'req-1',
        buyerRequestId: 'req-2',
        sellerAmount: 100,
        buyerAmount: 92,
        status: 'ACCEPTED',
      },
    });

    testMatchId = match.id;
  });

  afterAll(async () => {
    await prisma.securityDeposit.deleteMany({ where: { userId: testUserId } });
    await prisma.trustLevel.deleteMany({ where: { userId: testUserId } });
    await prisma.exchangeMatch.deleteMany({ where: { sellerId: testUserId } });
    await prisma.$disconnect();
  });

  describe('Security API Tests', () => {
    describe('GET /api/v1/exchange/security-deposit', () => {
      it('should return security deposit info', async () => {
        const response = await request(app)
          .get('/api/v1/exchange/security-deposit')
          .query({ userId: testUserId });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('deposit');
        expect(response.body.deposit.amount).toBe(1000);
      });

      it('should return 401 if not authenticated', async () => {
        const appNoAuth = express();
        appNoAuth.use(express.json());
        appNoAuth.get('/api/v1/exchange/security-deposit', (req, res, next) => {
          securityController.getSecurityDeposit(req, res, next);
        });

        const response = await request(appNoAuth)
          .get('/api/v1/exchange/security-deposit');

        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/v1/exchange/security-deposit/add', () => {
      it('should add to security deposit', async () => {
        const response = await request(app)
          .post('/api/v1/exchange/security-deposit/add')
          .query({ userId: testUserId })
          .send({
            amount: 500,
            currency: 'USD',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('deposit');
      });

      it('should reject invalid amount', async () => {
        const response = await request(app)
          .post('/api/v1/exchange/security-deposit/add')
          .query({ userId: testUserId })
          .send({
            amount: -100,
            currency: 'USD',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/exchange/trust-level', () => {
      it('should return trust level', async () => {
        const response = await request(app)
          .get('/api/v1/exchange/trust-level')
          .query({ userId: testUserId });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('trustLevel');
        expect(response.body.trustLevel.level).toBe('LEVEL_2');
      });
    });

    describe('GET /api/v1/exchange/external-escrow-providers', () => {
      it('should return escrow providers', async () => {
        const response = await request(app)
          .get('/api/v1/exchange/external-escrow-providers');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('providers');
        expect(Array.isArray(response.body.providers)).toBe(true);
      });
    });
  });

  describe('Communication API Tests', () => {
    describe('POST /api/v1/exchange/matches/:matchId/messages', () => {
      it('should send message successfully', async () => {
        const response = await request(app)
          .post(`/api/v1/exchange/matches/${testMatchId}/messages`)
          .query({ userId: testUserId })
          .send({
            content: 'Hello, I have sent the payment',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 404 for non-existent match', async () => {
        const response = await request(app)
          .post('/api/v1/exchange/matches/non-existent/messages')
          .query({ userId: testUserId })
          .send({
            content: 'Test message',
          });

        expect(response.status).toBe(404);
      });

      it('should return 403 for unauthorized user', async () => {
        const response = await request(app)
          .post(`/api/v1/exchange/matches/${testMatchId}/messages`)
          .query({ userId: 'unauthorized-user' })
          .send({
            content: 'Test message',
          });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/v1/exchange/matches/:matchId/messages', () => {
      it('should return messages with pagination', async () => {
        const response = await request(app)
          .get(`/api/v1/exchange/matches/${testMatchId}/messages`)
          .query({ userId: testUserId, page: 1, limit: 50 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('messages');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.messages)).toBe(true);
      });

      it('should return 404 for non-existent match', async () => {
        const response = await request(app)
          .get('/api/v1/exchange/matches/non-existent/messages')
          .query({ userId: testUserId });

        expect(response.status).toBe(404);
      });
    });
  });

  describe('Admin API Tests', () => {
    describe('GET /api/v1/admin/exchange/requests', () => {
      it('should list all requests', async () => {
        const response = await request(app)
          .get('/api/v1/admin/exchange/requests')
          .query({ userId: 'admin-user', isAdmin: 'true' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('requests');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.requests)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/api/v1/admin/exchange/requests')
          .query({ userId: 'admin-user', isAdmin: 'true', status: 'OPEN' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('requests');
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/v1/admin/exchange/requests')
          .query({ userId: 'admin-user', isAdmin: 'true', page: 1, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(10);
      });
    });

    describe('GET /api/v1/admin/exchange/proofs/pending', () => {
      it('should return pending proofs', async () => {
        const response = await request(app)
          .get('/api/v1/admin/exchange/proofs/pending')
          .query({ userId: 'admin-user', isAdmin: 'true' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('proofs');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.proofs)).toBe(true);
      });
    });

    describe('GET /api/v1/admin/exchange/statistics', () => {
      it('should return statistics for 24h period', async () => {
        const response = await request(app)
          .get('/api/v1/admin/exchange/statistics')
          .query({ userId: 'admin-user', isAdmin: 'true', period: '24h' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('statistics');
        expect(response.body.statistics).toHaveProperty('totalRequests');
        expect(response.body.statistics).toHaveProperty('totalMatches');
        expect(response.body.statistics).toHaveProperty('successRate');
      });

      it('should support different time periods', async () => {
        const periods = ['24h', '7d', '30d'];

        for (const period of periods) {
          const response = await request(app)
            .get('/api/v1/admin/exchange/statistics')
            .query({ userId: 'admin-user', isAdmin: 'true', period });

          expect(response.status).toBe(200);
          expect(response.body.period).toBe(period);
        }
      });
    });
  });
});
