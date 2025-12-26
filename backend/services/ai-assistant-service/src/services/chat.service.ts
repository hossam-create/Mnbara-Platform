// Chat Service - Gen 10 AI Intelligent Assistant
// خدمة المحادثة الذكية - الجيل العاشر

import { PrismaClient, ConversationType, ConversationStatus, MessageRole } from '@prisma/client';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System prompts for different conversation types
const SYSTEM_PROMPTS: Record<ConversationType, { en: string; ar: string }> = {
  GENERAL: {
    en: 'You are Mnbara AI Assistant, a helpful and friendly assistant for the Mnbara marketplace. Help users with any questions about shopping, selling, or using the platform.',
    ar: 'أنت مساعد منبرة الذكي، مساعد ودود ومفيد لسوق منبرة. ساعد المستخدمين في أي أسئلة حول التسوق أو البيع أو استخدام المنصة.'
  },
  SHOPPING: {
    en: 'You are a shopping assistant helping users find the best products, compare prices, and make informed purchasing decisions.',
    ar: 'أنت مساعد تسوق يساعد المستخدمين في العثور على أفضل المنتجات ومقارنة الأسعار واتخاذ قرارات شراء مدروسة.'
  },
  SUPPORT: {
    en: 'You are a customer support specialist. Help resolve issues quickly and professionally while maintaining a friendly tone.',
    ar: 'أنت متخصص في دعم العملاء. ساعد في حل المشكلات بسرعة واحترافية مع الحفاظ على نبرة ودية.'
  },
  ORDER: {
    en: 'You are an order specialist helping users track, modify, or resolve issues with their orders.',
    ar: 'أنت متخصص في الطلبات تساعد المستخدمين في تتبع طلباتهم أو تعديلها أو حل مشاكلها.'
  },
  PAYMENT: {
    en: 'You are a payment specialist helping users with payment methods, transactions, and billing inquiries.',
    ar: 'أنت متخصص في المدفوعات تساعد المستخدمين في طرق الدفع والمعاملات واستفسارات الفواتير.'
  },
  SHIPPING: {
    en: 'You are a shipping specialist helping users with delivery tracking, shipping options, and logistics.',
    ar: 'أنت متخصص في الشحن تساعد المستخدمين في تتبع التوصيل وخيارات الشحن والخدمات اللوجستية.'
  },
  RETURNS: {
    en: 'You are a returns specialist helping users with return policies, refund processes, and exchanges.',
    ar: 'أنت متخصص في المرتجعات تساعد المستخدمين في سياسات الإرجاع وعمليات الاسترداد والاستبدال.'
  },
  PRODUCT_INQUIRY: {
    en: 'You are a product expert helping users understand product features, specifications, and comparisons.',
    ar: 'أنت خبير منتجات تساعد المستخدمين في فهم ميزات المنتجات ومواصفاتها ومقارناتها.'
  },
  PRICE_NEGOTIATION: {
    en: 'You are a negotiation assistant helping users get the best deals while maintaining fair pricing.',
    ar: 'أنت مساعد تفاوض يساعد المستخدمين في الحصول على أفضل الصفقات مع الحفاظ على أسعار عادلة.'
  },
  COMPLAINT: {
    en: 'You are a complaint resolution specialist. Listen empathetically, apologize when appropriate, and work to resolve issues.',
    ar: 'أنت متخصص في حل الشكاوى. استمع بتعاطف واعتذر عند الحاجة واعمل على حل المشكلات.'
  }
};

// Supported languages
const SUPPORTED_LANGUAGES = [
  'ar', 'en', 'fr', 'de', 'es', 'pt', 'it', 'nl', 'ru', 'zh',
  'ja', 'ko', 'hi', 'bn', 'tr', 'vi', 'th', 'id', 'ms', 'tl',
  'pl', 'uk', 'cs', 'ro', 'hu', 'el', 'sv', 'da', 'no', 'fi',
  'he', 'fa', 'ur', 'sw', 'am', 'ha', 'yo', 'ig', 'zu', 'af',
  'ta', 'te', 'ml', 'kn', 'mr', 'gu', 'pa', 'ne', 'si', 'my'
];

export class ChatService {
  // Create new conversation
  async createConversation(data: {
    userId: string;
    type?: ConversationType;
    language?: string;
    context?: any;
  }) {
    const language = data.language && SUPPORTED_LANGUAGES.includes(data.language) 
      ? data.language 
      : 'ar';

    const conversation = await prisma.aIConversation.create({
      data: {
        userId: data.userId,
        type: data.type || 'GENERAL',
        language,
        context: data.context || {},
        status: 'ACTIVE'
      }
    });

    // Create welcome message
    const welcomeMessage = await this.generateWelcomeMessage(conversation.type, language);
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: welcomeMessage.en,
        contentAr: welcomeMessage.ar,
        confidence: 1.0
      }
    });

    return conversation;
  }

  // Send message and get AI response
  async sendMessage(data: {
    conversationId: string;
    userId: string;
    content: string;
  }) {
    const startTime = Date.now();

    // Get conversation
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: data.conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Detect language
    const detectedLanguage = await this.detectLanguage(data.content);

    // Analyze user message
    const analysis = await this.analyzeMessage(data.content);

    // Save user message
    const userMessage = await prisma.aIMessage.create({
      data: {
        conversationId: data.conversationId,
        role: 'USER',
        content: data.content,
        intent: analysis.intent,
        entities: analysis.entities,
        sentiment: analysis.sentiment
      }
    });

    // Build conversation history for context
    const messages = this.buildConversationHistory(conversation, data.content);

    // Generate AI response
    const aiResponse = await this.generateResponse(messages, conversation.type, conversation.language);

    // Save AI response
    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId: data.conversationId,
        role: 'ASSISTANT',
        content: aiResponse.content,
        contentAr: aiResponse.contentAr,
        suggestedActions: aiResponse.suggestedActions,
        confidence: aiResponse.confidence,
        tokens: aiResponse.tokens,
        processingTime: Date.now() - startTime,
        model: 'gpt-4-turbo'
      }
    });

    // Update conversation sentiment
    await this.updateConversationSentiment(data.conversationId);

    return {
      userMessage,
      assistantMessage,
      processingTime: Date.now() - startTime
    };
  }


  // Generate AI response using OpenAI
  private async generateResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    type: ConversationType,
    language: string
  ) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokens = completion.usage?.total_tokens || 0;

      // Generate Arabic translation if needed
      let contentAr = null;
      if (language === 'ar' || language !== 'en') {
        contentAr = await this.translateToArabic(content);
      }

      // Extract suggested actions
      const suggestedActions = this.extractSuggestedActions(content);

      return {
        content,
        contentAr,
        suggestedActions,
        confidence: 0.95,
        tokens
      };
    } catch (error) {
      console.error('OpenAI Error:', error);
      return {
        content: 'I apologize, but I encountered an issue. Please try again.',
        contentAr: 'أعتذر، لقد واجهت مشكلة. يرجى المحاولة مرة أخرى.',
        suggestedActions: [],
        confidence: 0,
        tokens: 0
      };
    }
  }

  // Build conversation history for context
  private buildConversationHistory(conversation: any, newMessage: string) {
    const systemPrompt = SYSTEM_PROMPTS[conversation.type as ConversationType];
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt.en }
    ];

    // Add context if available
    if (conversation.context) {
      messages.push({
        role: 'system',
        content: `Context: ${JSON.stringify(conversation.context)}`
      });
    }

    // Add previous messages
    for (const msg of conversation.messages) {
      messages.push({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content
      });
    }

    // Add new message
    messages.push({ role: 'user', content: newMessage });

    return messages;
  }

  // Analyze message for intent and entities
  private async analyzeMessage(content: string) {
    try {
      const analysis = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Analyze the following message and extract: intent, entities, and sentiment (-1 to 1). Return JSON only.'
          },
          { role: 'user', content }
        ],
        temperature: 0,
        max_tokens: 200
      });

      const result = JSON.parse(analysis.choices[0]?.message?.content || '{}');
      return {
        intent: result.intent || 'unknown',
        entities: result.entities || {},
        sentiment: result.sentiment || 0
      };
    } catch {
      return { intent: 'unknown', entities: {}, sentiment: 0 };
    }
  }

  // Detect language
  private async detectLanguage(text: string): Promise<string> {
    // Simple detection based on character ranges
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4E00-\u9FFF]/;
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    const koreanPattern = /[\uAC00-\uD7AF]/;

    if (arabicPattern.test(text)) return 'ar';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (koreanPattern.test(text)) return 'ko';
    return 'en';
  }

  // Translate to Arabic
  private async translateToArabic(text: string): Promise<string> {
    try {
      const translation = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Translate the following text to Arabic. Return only the translation.' },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
      return translation.choices[0]?.message?.content || text;
    } catch {
      return text;
    }
  }

  // Extract suggested actions from response
  private extractSuggestedActions(content: string): string[] {
    const actions: string[] = [];
    const actionPatterns = [
      /view (?:the |your )?(\w+)/gi,
      /check (?:the |your )?(\w+)/gi,
      /browse (?:the |our )?(\w+)/gi,
      /contact (?:our )?(\w+)/gi
    ];

    for (const pattern of actionPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        actions.push(match[0]);
      }
    }

    return actions.slice(0, 5);
  }

  // Generate welcome message
  private async generateWelcomeMessage(type: ConversationType, language: string) {
    const welcomeMessages: Record<ConversationType, { en: string; ar: string }> = {
      GENERAL: {
        en: 'Hello! I\'m your Mnbara AI Assistant. How can I help you today?',
        ar: 'مرحباً! أنا مساعد منبرة الذكي. كيف يمكنني مساعدتك اليوم؟'
      },
      SHOPPING: {
        en: 'Hi! I\'m here to help you find the perfect products. What are you looking for?',
        ar: 'مرحباً! أنا هنا لمساعدتك في العثور على المنتجات المثالية. ماذا تبحث عنه؟'
      },
      SUPPORT: {
        en: 'Hello! I\'m your support assistant. How can I help resolve your issue?',
        ar: 'مرحباً! أنا مساعد الدعم الخاص بك. كيف يمكنني المساعدة في حل مشكلتك؟'
      },
      ORDER: {
        en: 'Hi! I can help you with your orders. What would you like to know?',
        ar: 'مرحباً! يمكنني مساعدتك في طلباتك. ماذا تريد أن تعرف؟'
      },
      PAYMENT: {
        en: 'Hello! I\'m here to assist with payment-related questions. How can I help?',
        ar: 'مرحباً! أنا هنا للمساعدة في الأسئلة المتعلقة بالدفع. كيف يمكنني المساعدة؟'
      },
      SHIPPING: {
        en: 'Hi! I can help you track shipments and answer delivery questions.',
        ar: 'مرحباً! يمكنني مساعدتك في تتبع الشحنات والإجابة على أسئلة التوصيل.'
      },
      RETURNS: {
        en: 'Hello! I\'m here to help with returns and refunds. What do you need?',
        ar: 'مرحباً! أنا هنا للمساعدة في المرتجعات والاستردادات. ماذا تحتاج؟'
      },
      PRODUCT_INQUIRY: {
        en: 'Hi! I\'m a product expert. Ask me anything about our products!',
        ar: 'مرحباً! أنا خبير منتجات. اسألني أي شيء عن منتجاتنا!'
      },
      PRICE_NEGOTIATION: {
        en: 'Hello! Let\'s find you the best deal. What product are you interested in?',
        ar: 'مرحباً! دعنا نجد لك أفضل صفقة. ما المنتج الذي تهتم به؟'
      },
      COMPLAINT: {
        en: 'I\'m sorry to hear you\'re having an issue. I\'m here to help resolve it.',
        ar: 'أنا آسف لسماع أنك تواجه مشكلة. أنا هنا للمساعدة في حلها.'
      }
    };

    return welcomeMessages[type] || welcomeMessages.GENERAL;
  }

  // Update conversation sentiment
  private async updateConversationSentiment(conversationId: string) {
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId, role: 'USER' },
      select: { sentiment: true }
    });

    const sentiments = messages.filter(m => m.sentiment !== null).map(m => m.sentiment as number);
    if (sentiments.length > 0) {
      const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { overallSentiment: avgSentiment }
      });
    }
  }

  // Get conversation history
  async getConversation(conversationId: string) {
    return prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
  }

  // Get user conversations
  async getUserConversations(userId: string, limit = 20) {
    return prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } }
    });
  }

  // End conversation
  async endConversation(conversationId: string, resolved = true) {
    return prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        status: 'CLOSED',
        resolved,
        resolvedBy: 'AI',
        endedAt: new Date()
      }
    });
  }

  // Escalate to human
  async escalateToHuman(conversationId: string, reason: string) {
    return prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        status: 'ESCALATED',
        context: { escalationReason: reason }
      }
    });
  }
}

export const chatService = new ChatService();
