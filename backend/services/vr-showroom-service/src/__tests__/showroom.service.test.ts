import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ShowroomService } from '../services/showroom.service';
import { PrismaClient } from '@prisma/client';

/**
 * Real Unit Tests for VRShowroomService
 * Tests actual implementation, not mocks
 */

describe('VRShowroomService - Real Tests', () => {
  let showroomService: ShowroomService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    showroomService = new ShowroomService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('createShowroom', () => {
    it('should create a new VR showroom', async () => {
      const result = await showroomService.createShowroom({
        name: 'Electronics Store',
        description: 'Latest gadgets',
        capacity: 50,
        theme: 'modern'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.name).toBe('Electronics Store');
      expect(result.capacity).toBe(50);
      expect(result.theme).toBe('modern');
      expect(result.createdAt).toBeDefined();
    });

    it('should validate capacity', async () => {
      await expect(showroomService.createShowroom({
        name: 'Test',
        description: 'Test',
        capacity: 0,
        theme: 'modern'
      })).rejects.toThrow('Capacity must be greater than 0');
    });

    it('should store showroom in database', async () => {
      const created = await showroomService.createShowroom({
        name: 'Test Showroom',
        description: 'Test',
        capacity: 30,
        theme: 'modern'
      });

      const retrieved = await showroomService.getShowroom(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Showroom');
    });
  });

  describe('joinSession', () => {
    it('should allow user to join showroom', async () => {
      const showroom = await showroomService.createShowroom({
        name: 'Test Showroom',
        description: 'Test',
        capacity: 50,
        theme: 'modern'
      });

      const userId = 'test-user-' + Date.now();
      const result = await showroomService.joinSession(showroom.id, userId);

      expect(result).toBeDefined();
      expect(result.sessionId).toBeTruthy();
      expect(result.showroomId).toBe(showroom.id);
      expect(result.userId).toBe(userId);
      expect(result.avatar).toBeDefined();
      expect(result.position).toBeDefined();
    });

    it('should reject when showroom is full', async () => {
      const showroom = await showroomService.createShowroom({
        name: 'Small Showroom',
        description: 'Test',
        capacity: 1,
        theme: 'modern'
      });

      await showroomService.joinSession(showroom.id, 'user-1');

      await expect(showroomService.joinSession(showroom.id, 'user-2'))
        .rejects.toThrow('Showroom is full');
    });

    it('should track active sessions', async () => {
      const showroom = await showroomService.createShowroom({
        name: 'Test Showroom',
        description: 'Test',
        capacity: 50,
        theme: 'modern'
      });

      const session1 = await showroomService.joinSession(showroom.id, 'user-1');
      const session2 = await showroomService.joinSession(showroom.id, 'user-2');

      const sessions = await showroomService.getActiveSessions(showroom.id);

      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getShowrooms', () => {
    it('should return list of active showrooms', async () => {
      const result = await showroomService.getShowrooms();

      expect(Array.isArray(result.showrooms)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);

      if (result.showrooms.length > 0) {
        expect(result.showrooms[0]).toHaveProperty('id');
        expect(result.showrooms[0]).toHaveProperty('name');
        expect(result.showrooms[0]).toHaveProperty('visitors');
      }
    });

    it('should filter by theme', async () => {
      const result = await showroomService.getShowrooms({ theme: 'modern' });

      result.showrooms.forEach(showroom => {
        expect(showroom.theme).toBe('modern');
      });
    });
  });

  describe('updateAvatar', () => {
    it('should update user avatar', async () => {
      const showroom = await showroomService.createShowroom({
        name: 'Test Showroom',
        description: 'Test',
        capacity: 50,
        theme: 'modern'
      });

      const userId = 'test-user-' + Date.now();
      await showroomService.joinSession(showroom.id, userId);

      const result = await showroomService.updateAvatar(userId, {
        model: 'custom',
        color: '#EF4444',
        accessories: ['hat']
      });

      expect(result.success).toBe(true);
      expect(result.avatar.color).toBe('#EF4444');
      expect(result.avatar.accessories).toContain('hat');
    });

    it('should validate color format', async () => {
      const userId = 'test-user-' + Date.now();

      await expect(showroomService.updateAvatar(userId, {
        model: 'custom',
        color: 'invalid-color',
        accessories: []
      })).rejects.toThrow('Invalid color format');
    });
  });

  describe('sendMessage', () => {
    it('should send chat message in showroom', async () => {
      const showroom = await showroomService.createShowroom({
        name: 'Test Showroom',
        description: 'Test',
        capacity: 50,
        theme: 'modern'
      });

      const userId = 'test-user-' + Date.now();
      await showroomService.joinSession(showroom.id, userId);

      const result = await showroomService.sendMessage(showroom.id, userId, 'Hello everyone!');

      expect(result).toBeDefined();
      expect(result.messageId).toBeTruthy();
      expect(result.userId).toBe(userId);
      expect(result.text).toBe('Hello everyone!');
      expect(result.timestamp).toBeDefined();
    });

    it('should store messages in database', async () => {
      const showroom = await showroomService.createShowroom({
        name: 'Test Showroom',
        description: 'Test',
        capacity: 50,
        theme: 'modern'
      });

      const userId = 'test-user-' + Date.now();
      await showroomService.joinSession(showroom.id, userId);

      const message = await showroomService.sendMessage(showroom.id, userId, 'Test message');
      const messages = await showroomService.getMessages(showroom.id);

      expect(messages.some(m => m.messageId === message.messageId)).toBe(true);
    });
  });

  describe('getProducts', () => {
    it('should return products in showroom', async () => {
      const showroom = await showroomService.createShowroom({
        name: 'Test Showroom',
        description: 'Test',
        capacity: 50,
        theme: 'modern'
      });

      const result = await showroomService.getProducts(showroom.id);

      expect(Array.isArray(result.products)).toBe(true);

      if (result.products.length > 0) {
        expect(result.products[0]).toHaveProperty('id');
        expect(result.products[0]).toHaveProperty('name');
        expect(result.products[0]).toHaveProperty('price');
        expect(result.products[0]).toHaveProperty('position');
      }
    });

    it('should track product interactions', async () => {
      const showroom = await showroomService.createShowroom({
        name: 'Test Showroom',
        description: 'Test',
        capacity: 50,
        theme: 'modern'
      });

      const userId = 'test-user-' + Date.now();
      await showroomService.joinSession(showroom.id, userId);

      const products = await showroomService.getProducts(showroom.id);

      if (products.products.length > 0) {
        const interaction = await showroomService.trackProductInteraction(
          userId,
          products.products[0].id,
          'view'
        );

        expect(interaction).toBeDefined();
        expect(interaction.action).toBe('view');
      }
    });
  });

  describe('getAnalytics', () => {
    it('should return showroom analytics', async () => {
      const result = await showroomService.getAnalytics();

      expect(result).toBeDefined();
      expect(result.totalSessions).toBeGreaterThanOrEqual(0);
      expect(result.avgDuration).toBeGreaterThanOrEqual(0);
      expect(result.totalVisitors).toBeGreaterThanOrEqual(0);
    });
  });
});
