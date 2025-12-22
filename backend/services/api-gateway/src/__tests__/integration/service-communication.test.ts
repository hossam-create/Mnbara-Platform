/**
 * Service-to-Service Communication Tests
 * Validates that the gateway correctly routes requests to microservices
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import nock from 'nock';

// Mock environment
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.AUTH_SERVICE_URL = 'http://auth-service:3001';
process.env.LISTING_SERVICE_URL = 'http://listing-service:3002';
process.env.AUCTION_SERVICE_URL = 'http://auction-service:3003';
process.env.PAYMENT_SERVICE_URL = 'http://payment-service:3004';
process.env.ORDERS_SERVICE_URL = 'http://orders-service:3009';

// Import app after setting env
import app from '../../index';

describe('Service-to-Service Communication', () => {
  const generateTestToken = (payload: object = {}) => {
    return jwt.sign(
      {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'buyer',
        ...payload,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  };

  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  describe('Auth Service Routes', () => {
    it('should proxy login requests to auth service', async () => {
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '123', email: 'test@example.com' },
      };

      nock('http://auth-service:3001')
        .post('/api/v1/auth/login')
        .reply(200, mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should proxy registration requests to auth service', async () => {
      const mockResponse = {
        message: 'Registration successful',
        user: { id: '123', email: 'newuser@example.com' },
      };

      nock('http://auth-service:3001')
        .post('/api/v1/auth/register')
        .reply(201, mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          fullName: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('Listing Service Routes', () => {
    it('should proxy product listing requests', async () => {
      const mockProducts = {
        data: [
          { id: '1', title: 'Product 1', price: 100 },
          { id: '2', title: 'Product 2', price: 200 },
        ],
        total: 2,
        page: 1,
      };

      nock('http://listing-service:3002')
        .get('/api/v1/listings')
        .query(true)
        .reply(200, mockProducts);

      const response = await request(app).get('/api/v1/listings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProducts);
    });

    it('should proxy search requests', async () => {
      const mockResults = {
        data: [{ id: '1', title: 'Search Result' }],
        total: 1,
      };

      nock('http://listing-service:3002')
        .get('/api/v1/search')
        .query({ q: 'test' })
        .reply(200, mockResults);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
    });
  });

  describe('Auction Service Routes', () => {
    it('should proxy auction listing requests', async () => {
      const mockAuctions = {
        data: [
          { id: '1', title: 'Auction 1', currentBid: 100 },
        ],
        total: 1,
      };

      nock('http://auction-service:3003')
        .get('/api/v1/auctions')
        .query(true)
        .reply(200, mockAuctions);

      const response = await request(app).get('/api/v1/auctions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAuctions);
    });

    it('should require auth for bid submission', async () => {
      const response = await request(app)
        .post('/api/v1/bids')
        .send({ auctionId: '123', amount: 150 });

      expect(response.status).toBe(401);
    });

    it('should proxy bid requests with valid auth', async () => {
      const token = generateTestToken();
      const mockBidResponse = {
        success: true,
        bid: { id: 'bid-1', amount: 150 },
      };

      nock('http://auction-service:3003')
        .post('/api/v1/bids')
        .reply(200, mockBidResponse);

      const response = await request(app)
        .post('/api/v1/bids')
        .set('Authorization', `Bearer ${token}`)
        .send({ auctionId: '123', amount: 150 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBidResponse);
    });
  });

  describe('Orders Service Routes', () => {
    it('should require auth for order routes', async () => {
      const response = await request(app).get('/api/v1/orders');

      expect(response.status).toBe(401);
    });

    it('should proxy order requests with valid auth', async () => {
      const token = generateTestToken();
      const mockOrders = {
        data: [{ id: 'order-1', status: 'pending' }],
        total: 1,
      };

      nock('http://orders-service:3009')
        .get('/api/v1/orders')
        .reply(200, mockOrders);

      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrders);
    });
  });

  describe('Payment Service Routes', () => {
    it('should require auth for payment routes', async () => {
      const response = await request(app).get('/api/v1/payments');

      expect(response.status).toBe(401);
    });

    it('should allow webhook endpoints without auth', async () => {
      const mockWebhookResponse = { received: true };

      nock('http://payment-service:3004')
        .post('/api/v1/webhooks/stripe')
        .reply(200, mockWebhookResponse);

      const response = await request(app)
        .post('/api/v1/webhooks/stripe')
        .send({ type: 'payment_intent.succeeded' });

      expect(response.status).toBe(200);
    });
  });

  describe('Header Forwarding', () => {
    it('should forward correlation ID to downstream services', async () => {
      const correlationId = 'test-correlation-123';

      nock('http://listing-service:3002')
        .get('/api/v1/listings')
        .matchHeader('x-correlation-id', correlationId)
        .reply(200, { data: [] });

      const response = await request(app)
        .get('/api/v1/listings')
        .set('X-Correlation-ID', correlationId);

      expect(response.status).toBe(200);
    });

    it('should forward user info headers when authenticated', async () => {
      const token = generateTestToken({
        id: 'user-123',
        email: 'test@example.com',
        role: 'buyer',
      });

      nock('http://orders-service:3009')
        .get('/api/v1/orders')
        .matchHeader('x-user-id', 'user-123')
        .matchHeader('x-user-email', 'test@example.com')
        .matchHeader('x-user-role', 'buyer')
        .reply(200, { data: [] });

      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 502 when downstream service is unavailable', async () => {
      nock('http://listing-service:3002')
        .get('/api/v1/listings')
        .replyWithError('Connection refused');

      const response = await request(app).get('/api/v1/listings');

      expect(response.status).toBe(502);
      expect(response.body).toHaveProperty('error', 'Bad Gateway');
    });

    it('should forward error responses from downstream services', async () => {
      const errorResponse = {
        error: 'Not Found',
        message: 'Product not found',
      };

      nock('http://listing-service:3002')
        .get('/api/v1/listings/nonexistent')
        .reply(404, errorResponse);

      const response = await request(app).get('/api/v1/listings/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual(errorResponse);
    });
  });
});
