/**
 * API Gateway Integration Tests
 * Tests service-to-service communication and gateway functionality
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock environment
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Import app after setting env
import app from '../../index';

describe('API Gateway Integration Tests', () => {
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

  describe('Health Endpoints', () => {
    it('should return healthy status on /health', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'api-gateway');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return detailed health on /health/detailed', async () => {
      const response = await request(app).get('/health/detailed');
      
      // May return 200, 207, or 503 depending on service availability
      expect([200, 207, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
      expect(Array.isArray(response.body.services)).toBe(true);
    });
  });

  describe('API Documentation', () => {
    it('should return API info on /api/v1', async () => {
      const response = await request(app).get('/api/v1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'MNBARA API Gateway');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(Array.isArray(response.body.services)).toBe(true);
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without token on protected routes', async () => {
      const response = await request(app).get('/api/v1/orders');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should accept requests with valid token', async () => {
      const token = generateTestToken();
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);
      
      // Will return 502 if service is not running, but auth passed
      expect([200, 502]).toContain(response.status);
    });

    it('should allow public routes without authentication', async () => {
      const response = await request(app).get('/api/v1/listings');
      
      // Will return 502 if service is not running, but no auth required
      expect([200, 502]).toContain(response.status);
    });
  });

  describe('Role-Based Authorization', () => {
    it('should reject non-admin users on admin routes', async () => {
      const token = generateTestToken({ role: 'buyer' });
      const response = await request(app)
        .get('/api/v1/admin')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    it('should allow admin users on admin routes', async () => {
      const token = generateTestToken({ role: 'admin' });
      const response = await request(app)
        .get('/api/v1/admin')
        .set('Authorization', `Bearer ${token}`);
      
      // Will return 502 if service is not running, but auth passed
      expect([200, 502]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers in response', async () => {
      const response = await request(app).get('/api/v1/listings');
      
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Correlation ID', () => {
    it('should generate correlation ID if not provided', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers).toHaveProperty('x-correlation-id');
      expect(response.headers['x-correlation-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should preserve correlation ID if provided', async () => {
      const correlationId = 'test-correlation-id-123';
      const response = await request(app)
        .get('/health')
        .set('X-Correlation-ID', correlationId);
      
      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('availableRoutes', '/api/v1');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/v1/listings')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
