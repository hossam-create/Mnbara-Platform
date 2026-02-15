import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { VoiceService } from '../services/voice.service';
import { PrismaClient } from '@prisma/client';

/**
 * Real Unit Tests for VoiceService
 * Tests actual implementation, not mocks
 */

describe('VoiceService - Real Tests', () => {
  let voiceService: VoiceService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    voiceService = new VoiceService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('speechToText', () => {
    it('should convert Arabic speech to text with confidence score', async () => {
      // Arrange
      const audioBuffer = Buffer.from('mock-audio-data');
      
      // Act
      const result = await voiceService.speechToText(audioBuffer, 'ar-SA');
      
      // Assert
      expect(result).toBeDefined();
      expect(result.transcript).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.language).toBe('ar-SA');
    });

    it('should handle empty audio buffer', async () => {
      const emptyBuffer = Buffer.from('');
      
      await expect(voiceService.speechToText(emptyBuffer, 'ar-SA'))
        .rejects.toThrow('Audio buffer cannot be empty');
    });

    it('should support multiple languages', async () => {
      const audioBuffer = Buffer.from('mock-audio-data');
      
      const arResult = await voiceService.speechToText(audioBuffer, 'ar-SA');
      const enResult = await voiceService.speechToText(audioBuffer, 'en-US');
      
      expect(arResult.language).toBe('ar-SA');
      expect(enResult.language).toBe('en-US');
    });
  });

  describe('detectIntent', () => {
    it('should detect SEARCH_PRODUCT intent', async () => {
      const result = await voiceService.detectIntent('ابحث عن آيفون');
      
      expect(result.intent).toBe('SEARCH_PRODUCT');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.entities).toBeDefined();
      expect(result.entities.product).toBeTruthy();
    });

    it('should detect ADD_TO_CART intent', async () => {
      const result = await voiceService.detectIntent('أضف للسلة');
      
      expect(result.intent).toBe('ADD_TO_CART');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect CHECKOUT intent', async () => {
      const result = await voiceService.detectIntent('أريد الدفع');
      
      expect(result.intent).toBe('CHECKOUT');
    });

    it('should return low confidence for ambiguous queries', async () => {
      const result = await voiceService.detectIntent('ماذا');
      
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('searchProducts', () => {
    it('should return products matching voice query', async () => {
      const result = await voiceService.searchProducts('آيفون');
      
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
      
      if (result.products.length > 0) {
        expect(result.products[0]).toHaveProperty('id');
        expect(result.products[0]).toHaveProperty('name');
        expect(result.products[0]).toHaveProperty('price');
      }
    });

    it('should handle empty search results', async () => {
      const result = await voiceService.searchProducts('منتج غير موجود xyz123');
      
      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should filter by price range', async () => {
      const result = await voiceService.searchProducts('هاتف', {
        minPrice: 100,
        maxPrice: 500
      });
      
      result.products.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(100);
        expect(product.price).toBeLessThanOrEqual(500);
      });
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to audio URL', async () => {
      const result = await voiceService.textToSpeech('مرحباً بك', 'ar-SA');
      
      expect(result.audioUrl).toBeTruthy();
      expect(result.audioUrl).toMatch(/^https?:\/\//);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle long text', async () => {
      const longText = 'مرحباً بك في منبرة. نحن نوفر أفضل الخدمات للتسوق الإلكتروني';
      const result = await voiceService.textToSpeech(longText, 'ar-SA');
      
      expect(result.audioUrl).toBeTruthy();
      expect(result.duration).toBeGreaterThan(2);
    });
  });

  describe('createSession', () => {
    it('should create voice session for user', async () => {
      const userId = 'test-user-123';
      
      const session = await voiceService.createSession(userId);
      
      expect(session).toBeDefined();
      expect(session.sessionId).toBeTruthy();
      expect(session.userId).toBe(userId);
      expect(session.createdAt).toBeDefined();
      expect(session.status).toBe('ACTIVE');
    });

    it('should store session in database', async () => {
      const userId = 'test-user-456';
      
      const session = await voiceService.createSession(userId);
      const retrievedSession = await voiceService.getSession(session.sessionId);
      
      expect(retrievedSession.sessionId).toBe(session.sessionId);
      expect(retrievedSession.userId).toBe(userId);
    });
  });

  describe('getAnalytics', () => {
    it('should return voice analytics', async () => {
      const analytics = await voiceService.getAnalytics();
      
      expect(analytics).toBeDefined();
      expect(analytics.totalSessions).toBeGreaterThanOrEqual(0);
      expect(analytics.avgDuration).toBeGreaterThanOrEqual(0);
      expect(analytics.conversionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.conversionRate).toBeLessThanOrEqual(1);
    });

    it('should return analytics for specific date range', async () => {
      const startDate = new Date('2025-12-01');
      const endDate = new Date('2025-12-31');
      
      const analytics = await voiceService.getAnalytics(startDate, endDate);
      
      expect(analytics).toBeDefined();
      expect(analytics.totalSessions).toBeGreaterThanOrEqual(0);
    });
  });
});
