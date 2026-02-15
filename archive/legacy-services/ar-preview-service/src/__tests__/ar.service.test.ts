import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ARService } from '../services/ar.service';
import { PrismaClient } from '@prisma/client';

/**
 * Real Unit Tests for ARService
 * Tests actual implementation, not mocks
 */

describe('ARService - Real Tests', () => {
  let arService: ARService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    arService = new ARService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('createSession', () => {
    it('should create a new AR session', async () => {
      const userId = 'test-user-' + Date.now();
      const productId = 'test-product-' + Date.now();

      const result = await arService.createSession(userId, productId);

      expect(result).toBeDefined();
      expect(result.sessionId).toBeTruthy();
      expect(result.userId).toBe(userId);
      expect(result.productId).toBe(productId);
      expect(result.createdAt).toBeDefined();
      expect(result.status).toBe('ACTIVE');
    });

    it('should store session in database', async () => {
      const userId = 'test-user-' + Date.now();
      const productId = 'test-product-' + Date.now();

      const session = await arService.createSession(userId, productId);
      const retrieved = await arService.getSession(session.sessionId);

      expect(retrieved.sessionId).toBe(session.sessionId);
      expect(retrieved.userId).toBe(userId);
    });

    it('should handle invalid user ID', async () => {
      await expect(arService.createSession('', 'product-123'))
        .rejects.toThrow('User ID cannot be empty');
    });
  });

  describe('loadModel', () => {
    it('should load 3D model for product', async () => {
      const result = await arService.loadModel('product-123');

      expect(result).toBeDefined();
      expect(result.modelUrl).toBeTruthy();
      expect(result.format).toMatch(/^(GLB|USDZ)$/);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should support GLB format for Android', async () => {
      const result = await arService.loadModel('product-123', 'android');

      expect(result.format).toBe('GLB');
      expect(result.modelUrl).toContain('.glb');
    });

    it('should support USDZ format for iOS', async () => {
      const result = await arService.loadModel('product-123', 'ios');

      expect(result.format).toBe('USDZ');
      expect(result.modelUrl).toContain('.usdz');
    });

    it('should return thumbnail URL', async () => {
      const result = await arService.loadModel('product-123');

      expect(result.thumbnail).toBeTruthy();
      expect(result.thumbnail).toMatch(/\.(jpg|png)$/);
    });

    it('should handle non-existent product', async () => {
      await expect(arService.loadModel('non-existent-product-xyz'))
        .rejects.toThrow('Product not found');
    });
  });

  describe('captureScreenshot', () => {
    it('should capture AR screenshot', async () => {
      const userId = 'test-user-' + Date.now();
      const productId = 'test-product-' + Date.now();
      const session = await arService.createSession(userId, productId);

      const result = await arService.captureScreenshot(session.sessionId);

      expect(result).toBeDefined();
      expect(result.imageUrl).toBeTruthy();
      expect(result.imageUrl).toMatch(/\.(png|jpg)$/);
      expect(result.sessionId).toBe(session.sessionId);
      expect(result.timestamp).toBeDefined();
    });

    it('should store screenshot in database', async () => {
      const userId = 'test-user-' + Date.now();
      const productId = 'test-product-' + Date.now();
      const session = await arService.createSession(userId, productId);

      const screenshot = await arService.captureScreenshot(session.sessionId);
      const retrieved = await arService.getScreenshot(screenshot.imageUrl);

      expect(retrieved).toBeDefined();
      expect(retrieved.sessionId).toBe(session.sessionId);
    });

    it('should handle invalid session ID', async () => {
      await expect(arService.captureScreenshot('invalid-session-id'))
        .rejects.toThrow('Session not found');
    });
  });

  describe('updateModelPosition', () => {
    it('should update model position and rotation', async () => {
      const userId = 'test-user-' + Date.now();
      const productId = 'test-product-' + Date.now();
      const session = await arService.createSession(userId, productId);

      const result = await arService.updateModelPosition(session.sessionId, {
        position: { x: 1.5, y: 0, z: -2 },
        rotation: { x: 0, y: 45, z: 0 },
        scale: 1.2
      });

      expect(result.success).toBe(true);
      expect(result.position.x).toBe(1.5);
      expect(result.position.y).toBe(0);
      expect(result.position.z).toBe(-2);
      expect(result.rotation.y).toBe(45);
      expect(result.scale).toBe(1.2);
    });

    it('should validate scale range', async () => {
      const userId = 'test-user-' + Date.now();
      const productId = 'test-product-' + Date.now();
      const session = await arService.createSession(userId, productId);

      await expect(arService.updateModelPosition(session.sessionId, {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 10 // Too large
      })).rejects.toThrow('Scale must be between 0.1 and 5');
    });

    it('should handle invalid session', async () => {
      await expect(arService.updateModelPosition('invalid-session', {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1
      })).rejects.toThrow('Session not found');
    });
  });

  describe('getAnalytics', () => {
    it('should return AR session analytics', async () => {
      const result = await arService.getAnalytics();

      expect(result).toBeDefined();
      expect(result.totalSessions).toBeGreaterThanOrEqual(0);
      expect(result.avgDuration).toBeGreaterThanOrEqual(0);
      expect(result.conversionRate).toBeGreaterThanOrEqual(0);
      expect(result.conversionRate).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.topProducts)).toBe(true);
    });

    it('should return analytics for specific date range', async () => {
      const startDate = new Date('2025-12-01');
      const endDate = new Date('2025-12-31');

      const result = await arService.getAnalytics(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.totalSessions).toBeGreaterThanOrEqual(0);
    });

    it('should track device types', async () => {
      const result = await arService.getAnalytics();

      expect(result.deviceBreakdown).toBeDefined();
      expect(result.deviceBreakdown.ios).toBeGreaterThanOrEqual(0);
      expect(result.deviceBreakdown.android).toBeGreaterThanOrEqual(0);
      expect(result.deviceBreakdown.web).toBeGreaterThanOrEqual(0);
    });
  });

  describe('shareSession', () => {
    it('should generate shareable link', async () => {
      const userId = 'test-user-' + Date.now();
      const productId = 'test-product-' + Date.now();
      const session = await arService.createSession(userId, productId);

      const result = await arService.shareSession(session.sessionId);

      expect(result.shareUrl).toBeTruthy();
      expect(result.shareUrl).toMatch(/^https?:\/\//);
      expect(result.expiresAt).toBeDefined();
    });

    it('should track share analytics', async () => {
      const userId = 'test-user-' + Date.now();
      const productId = 'test-product-' + Date.now();
      const session = await arService.createSession(userId, productId);

      await arService.shareSession(session.sessionId);
      const analytics = await arService.getAnalytics();

      expect(analytics.totalShares).toBeGreaterThanOrEqual(0);
    });
  });
});
