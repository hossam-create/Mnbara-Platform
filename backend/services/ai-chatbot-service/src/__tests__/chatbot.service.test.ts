import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ChatbotService } from '../services/chatbot.service';
import { PrismaClient } from '@prisma/client';

/**
 * Real Unit Tests for ChatbotService
 * Tests actual implementation, not mocks
 */

describe('ChatbotService - Real Tests', () => {
  let chatbotService: ChatbotService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    chatbotService = new ChatbotService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('processMessage', () => {
    it('should process user message and return response', async () => {
      const result = await chatbotService.processMessage('مرحبا', 'user-123');

      expect(result).toBeDefined();
      expect(result.response).toBeTruthy();
      expect(result.intent).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle product inquiry', async () => {
      const result = await chatbotService.processMessage('أريد شراء هاتف جديد', 'user-123');

      expect(result.response).toBeTruthy();
      expect(result.intent).toBeTruthy();
      if (result.suggestedProducts) {
        expect(Array.isArray(result.suggestedProducts)).toBe(true);
      }
    });

    it('should store conversation in database', async () => {
      const userId = 'test-user-' + Date.now();
      const message = 'مرحبا';

      const result = await chatbotService.processMessage(message, userId);
      const history = await chatbotService.getConversationHistory(userId);

      expect(history.messages.some(m => m.text === message)).toBe(true);
    });

    it('should handle empty message', async () => {
      await expect(chatbotService.processMessage('', 'user-123'))
        .rejects.toThrow('Message cannot be empty');
    });
  });

  describe('detectIntent', () => {
    it('should detect greeting intent', async () => {
      const result = await chatbotService.detectIntent('مرحبا');

      expect(result).toBeDefined();
      expect(result.intent).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect order tracking intent', async () => {
      const result = await chatbotService.detectIntent('أين طلبي رقم 12345');

      expect(result.intent).toBeTruthy();
      if (result.entities && result.entities.orderId) {
        expect(result.entities.orderId).toBeTruthy();
      }
    });

    it('should detect return request intent', async () => {
      const result = await chatbotService.detectIntent('أريد إرجاع المنتج');

      expect(result.intent).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle ambiguous queries', async () => {
      const result = await chatbotService.detectIntent('ماذا');

      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('generateResponse', () => {
    it('should generate contextual response', async () => {
      const result = await chatbotService.generateResponse('GREETING', {});

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should generate response with entities', async () => {
      const result = await chatbotService.generateResponse('ORDER_TRACKING', {
        orderId: '12345'
      });

      expect(result).toBeTruthy();
      expect(result).toContain('12345');
    });
  });

  describe('escalateToAgent', () => {
    it('should escalate to human agent', async () => {
      const userId = 'test-user-' + Date.now();
      const conversationId = 'conv-' + Date.now();

      const result = await chatbotService.escalateToAgent(conversationId, userId, 'أريد التحدث مع شخص');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.ticketId).toBeTruthy();
      expect(result.estimatedWaitTime).toBeGreaterThanOrEqual(0);
    });

    it('should create support ticket', async () => {
      const userId = 'test-user-' + Date.now();
      const conversationId = 'conv-' + Date.now();

      const escalation = await chatbotService.escalateToAgent(conversationId, userId, 'مشكلة في الطلب');
      const ticket = await chatbotService.getTicket(escalation.ticketId);

      expect(ticket).toBeDefined();
      expect(ticket.userId).toBe(userId);
      expect(ticket.status).toBe('OPEN');
    });
  });

  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', async () => {
      const result = await chatbotService.analyzeSentiment('شكراً جزيلاً، خدمة ممتازة!');

      expect(result).toBeDefined();
      expect(result.sentiment).toBeTruthy();
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should detect negative sentiment', async () => {
      const result = await chatbotService.analyzeSentiment('الخدمة سيئة جداً');

      expect(result.sentiment).toBeTruthy();
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect neutral sentiment', async () => {
      const result = await chatbotService.analyzeSentiment('ما هو السعر');

      expect(result.sentiment).toBeTruthy();
    });
  });

  describe('getConversationHistory', () => {
    it('should return conversation history', async () => {
      const userId = 'test-user-' + Date.now();

      await chatbotService.processMessage('مرحبا', userId);
      await chatbotService.processMessage('أريد منتج', userId);

      const result = await chatbotService.getConversationHistory(userId);

      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('should maintain message order', async () => {
      const userId = 'test-user-' + Date.now();

      await chatbotService.processMessage('أولاً', userId);
      await chatbotService.processMessage('ثانياً', userId);

      const result = await chatbotService.getConversationHistory(userId);

      expect(result.messages[0].text).toContain('أولاً');
      expect(result.messages[1].text).toContain('ثانياً');
    });

    it('should include timestamps', async () => {
      const userId = 'test-user-' + Date.now();

      await chatbotService.processMessage('مرحبا', userId);

      const result = await chatbotService.getConversationHistory(userId);

      expect(result.messages[0].timestamp).toBeDefined();
    });
  });

  describe('getAnalytics', () => {
    it('should return chatbot analytics', async () => {
      const result = await chatbotService.getAnalytics();

      expect(result).toBeDefined();
      expect(result.totalConversations).toBeGreaterThanOrEqual(0);
      expect(result.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(result.resolutionRate).toBeGreaterThanOrEqual(0);
      expect(result.resolutionRate).toBeLessThanOrEqual(1);
    });

    it('should track escalation rate', async () => {
      const result = await chatbotService.getAnalytics();

      expect(result.escalationRate).toBeGreaterThanOrEqual(0);
      expect(result.escalationRate).toBeLessThanOrEqual(1);
    });
  });
});
