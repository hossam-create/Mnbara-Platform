// Chatbot Service - خدمة الدردشة الآلية
// AI-powered conversation handling

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

type Sentiment = 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE';
type IntentCategory = 'GREETING' | 'FAREWELL' | 'ORDER_STATUS' | 'PRODUCT_INFO' | 'SHIPPING' | 'RETURNS' | 'PAYMENT' | 'ACCOUNT' | 'COMPLAINT' | 'FEEDBACK' | 'FAQ' | 'ESCALATION' | 'OTHER';

interface ProcessedMessage {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  sentiment: Sentiment;
  response: string;
  responseAr: string;
  shouldEscalate: boolean;
}

export class ChatbotService {
  // ==========================================
  // 💬 CONVERSATION MANAGEMENT
  // ==========================================

  async createConversation(data: {
    userId?: string;
    sessionId: string;
    channel?: 'WEB' | 'MOBILE' | 'WHATSAPP' | 'FACEBOOK' | 'INSTAGRAM' | 'EMAIL';
    language?: string;
  }) {
    const conversation = await prisma.conversation.create({
      data: {
        ...data,
        channel: data.channel || 'WEB',
        language: data.language || 'ar',
      },
    });

    // Send greeting
    const config = await this.getBotConfig();
    const greeting = data.language === 'en' ? config.greetingMessage : config.greetingMessageAr;

    await this.addMessage(conversation.id, {
      senderType: 'BOT',
      content: greeting,
      isAutoResponse: true,
    });

    return conversation;
  }

  async getConversation(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async getUserConversations(userId: string, page: number = 1, limit: number = 20) {
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      }),
      prisma.conversation.count({ where: { userId } }),
    ]);

    return { conversations, total, page, limit };
  }

  // ==========================================
  // 📝 MESSAGE PROCESSING
  // ==========================================

  async processMessage(conversationId: string, content: string, language: string = 'ar'): Promise<ProcessedMessage> {
    const startTime = Date.now();

    // Analyze message
    const intent = await this.detectIntent(content, language);
    const sentiment = this.analyzeSentiment(content);
    const entities = this.extractEntities(content, intent.name);

    // Check if should escalate
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    const failedAttempts = await this.getFailedAttempts(conversationId);
    const config = await this.getBotConfig();
    const shouldEscalate = intent.confidence < 0.5 && failedAttempts >= config.autoEscalateAfter;

    // Generate response
    let response: { en: string; ar: string };
    if (shouldEscalate) {
      response = {
        en: config.escalationMessage,
        ar: config.escalationMessageAr,
      };
    } else if (intent.confidence >= intent.minConfidence) {
      response = await this.generateResponse(intent.name, entities, language);
    } else {
      response = {
        en: config.fallbackMessage,
        ar: config.fallbackMessageAr,
      };
      await this.incrementFailedAttempts(conversationId);
    }

    // Save user message
    await this.addMessage(conversationId, {
      senderType: 'USER',
      content,
      intent: intent.name,
      confidence: intent.confidence,
      entities,
      sentiment,
    });

    // Save bot response
    await this.addMessage(conversationId, {
      senderType: 'BOT',
      content: language === 'en' ? response.en : response.ar,
      isAutoResponse: true,
      responseTime: Date.now() - startTime,
    });

    // Update analytics
    await this.updateAnalytics(intent.name, sentiment);

    return {
      intent: intent.name,
      confidence: intent.confidence,
      entities,
      sentiment,
      response: response.en,
      responseAr: response.ar,
      shouldEscalate,
    };
  }

  private async addMessage(conversationId: string, data: {
    senderType: 'USER' | 'BOT' | 'AGENT';
    senderId?: string;
    content: string;
    contentType?: string;
    intent?: string;
    confidence?: number;
    entities?: any;
    sentiment?: Sentiment;
    isAutoResponse?: boolean;
    responseTime?: number;
  }) {
    const message = await prisma.message.create({
      data: { conversationId, ...data },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { messageCount: { increment: 1 }, updatedAt: new Date() },
    });

    return message;
  }

  // ==========================================
  // 🎯 INTENT DETECTION
  // ==========================================

  private async detectIntent(content: string, language: string): Promise<{ name: string; confidence: number; minConfidence: number }> {
    const intents = await prisma.intent.findMany({ where: { isEnabled: true } });
    const lowerContent = content.toLowerCase();

    let bestMatch = { name: 'unknown', confidence: 0, minConfidence: 0.7 };

    for (const intent of intents) {
      const phrases = language === 'ar' ? intent.trainingPhrasesAr : intent.trainingPhrases;
      
      for (const phrase of phrases) {
        const similarity = this.calculateSimilarity(lowerContent, phrase.toLowerCase());
        if (similarity > bestMatch.confidence) {
          bestMatch = { name: intent.name, confidence: similarity, minConfidence: intent.minConfidence };
        }
      }
    }

    // Update intent match count
    if (bestMatch.confidence >= bestMatch.minConfidence) {
      await prisma.intent.update({
        where: { name: bestMatch.name },
        data: { matchCount: { increment: 1 } },
      });
    }

    return bestMatch;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple word overlap similarity
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    let overlap = 0;
    words1.forEach(word => {
      if (words2.has(word)) overlap++;
    });

    return overlap / Math.max(words1.size, words2.size);
  }

  // ==========================================
  // 😊 SENTIMENT ANALYSIS
  // ==========================================

  private analyzeSentiment(content: string): Sentiment {
    const positiveWords = ['شكرا', 'ممتاز', 'رائع', 'جميل', 'thank', 'great', 'excellent', 'good', 'love'];
    const negativeWords = ['سيء', 'مشكلة', 'غضب', 'bad', 'problem', 'angry', 'terrible', 'hate', 'worst'];

    const lowerContent = content.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) score++;
    });

    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) score--;
    });

    if (score >= 2) return 'VERY_POSITIVE';
    if (score === 1) return 'POSITIVE';
    if (score === -1) return 'NEGATIVE';
    if (score <= -2) return 'VERY_NEGATIVE';
    return 'NEUTRAL';
  }

  // ==========================================
  // 🔍 ENTITY EXTRACTION
  // ==========================================

  private extractEntities(content: string, intent: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Order number pattern
    const orderMatch = content.match(/(?:order|طلب|#)\s*(\d{6,})/i);
    if (orderMatch) entities.orderId = orderMatch[1];

    // Product ID pattern
    const productMatch = content.match(/(?:product|منتج|item)\s*(\d+)/i);
    if (productMatch) entities.productId = productMatch[1];

    // Email pattern
    const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) entities.email = emailMatch[0];

    // Phone pattern
    const phoneMatch = content.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) entities.phone = phoneMatch[0];

    return entities;
  }

  // ==========================================
  // 💬 RESPONSE GENERATION
  // ==========================================

  private async generateResponse(intentName: string, entities: Record<string, any>, language: string): Promise<{ en: string; ar: string }> {
    const intent = await prisma.intent.findUnique({
      where: { name: intentName },
      include: { responses: { orderBy: { priority: 'desc' } } },
    });

    if (!intent || intent.responses.length === 0) {
      return {
        en: "I'm not sure how to help with that. Would you like to speak with a human agent?",
        ar: 'لست متأكداً كيف أساعدك في ذلك. هل تريد التحدث مع موظف؟',
      };
    }

    // Select best response based on conditions
    let selectedResponse = intent.responses[0];
    for (const response of intent.responses) {
      if (response.conditions) {
        const conditions = response.conditions as Record<string, any>;
        let matches = true;
        for (const [key, value] of Object.entries(conditions)) {
          if (entities[key] !== value) {
            matches = false;
            break;
          }
        }
        if (matches) {
          selectedResponse = response;
          break;
        }
      }
    }

    // Replace placeholders with entities
    let responseEn = selectedResponse.response;
    let responseAr = selectedResponse.responseAr;

    for (const [key, value] of Object.entries(entities)) {
      responseEn = responseEn.replace(`{${key}}`, String(value));
      responseAr = responseAr.replace(`{${key}}`, String(value));
    }

    return { en: responseEn, ar: responseAr };
  }

  // ==========================================
  // 🔧 HELPERS
  // ==========================================

  private async getBotConfig() {
    let config = await prisma.botConfig.findFirst();
    if (!config) {
      config = await prisma.botConfig.create({
        data: {
          greetingMessage: 'Hello! How can I help you today?',
          greetingMessageAr: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
          fallbackMessage: "I'm sorry, I didn't understand that. Could you please rephrase?",
          fallbackMessageAr: 'عذراً، لم أفهم ذلك. هل يمكنك إعادة الصياغة؟',
          escalationMessage: "I'll connect you with a human agent who can better assist you.",
          escalationMessageAr: 'سأقوم بتوصيلك بموظف يمكنه مساعدتك بشكل أفضل.',
        },
      });
    }
    return config;
  }

  private async getFailedAttempts(conversationId: string): Promise<number> {
    const key = `chatbot:failed:${conversationId}`;
    const count = await redis.get(key);
    return count ? parseInt(count) : 0;
  }

  private async incrementFailedAttempts(conversationId: string): Promise<void> {
    const key = `chatbot:failed:${conversationId}`;
    await redis.incr(key);
    await redis.expire(key, 3600); // Reset after 1 hour
  }

  // ==========================================
  // 📊 ANALYTICS
  // ==========================================

  private async updateAnalytics(intent: string, sentiment: Sentiment) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentimentField = sentiment.includes('POSITIVE') ? 'positiveSentiment' : sentiment.includes('NEGATIVE') ? 'negativeSentiment' : 'neutralSentiment';

    await prisma.chatAnalytics.upsert({
      where: { date: today },
      update: {
        totalMessages: { increment: 1 },
        [sentimentField]: { increment: 1 },
      },
      create: {
        date: today,
        totalMessages: 1,
        [sentimentField]: 1,
      },
    });
  }

  async getAnalytics(startDate: Date, endDate: Date) {
    return prisma.chatAnalytics.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats, activeConversations, onlineAgents] = await Promise.all([
      prisma.chatAnalytics.findUnique({ where: { date: today } }),
      prisma.conversation.count({ where: { status: 'ACTIVE' } }),
      prisma.agent.count({ where: { status: 'ONLINE' } }),
    ]);

    return { today: todayStats, activeConversations, onlineAgents };
  }
}

export const chatbotService = new ChatbotService();
