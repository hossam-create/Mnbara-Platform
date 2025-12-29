// Mnbara AI Assistant Service - Like Siri for Shopping & Travel
// خدمة مساعد منبرة الذكي - مثل سيري للتسوق والسفر

import { PrismaClient, DataCategory } from '@prisma/client';
import { HfInference } from '@huggingface/inference';
import { modelService } from './model.service';
import { knowledgeService } from './knowledge.service';

const prisma = new PrismaClient();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Mnbara AI Personality
const MNBARA_PERSONALITY = {
  name: 'Mnbara AI',
  nameAr: 'ذكاء منبرة',
  greeting: {
    en: "Hi! I'm Mnbara AI, your personal shopping and travel assistant. How can I help you today?",
    ar: 'مرحباً! أنا ذكاء منبرة، مساعدك الشخصي للتسوق والسفر. كيف يمكنني مساعدتك اليوم؟'
  },
  traits: [
    'Friendly and helpful',
    'Expert in shopping and travel',
    'Multilingual (50+ languages)',
    'Remembers user preferences',
    'Proactive suggestions'
  ]
};

// System prompts for different contexts
const SYSTEM_PROMPTS = {
  SHOPPING: `You are Mnbara AI (ذكاء منبرة), a friendly and knowledgeable shopping assistant for the Mnbara marketplace. 
You help users find products, compare prices, negotiate deals, and make informed purchasing decisions.
You speak Arabic and English fluently, and can help in 50+ languages.
Be helpful, friendly, and proactive in suggesting products and deals.
Always consider the user's budget and preferences.`,

  TRAVEL: `You are Mnbara AI (ذكاء منبرة), an expert travel assistant specializing in crowdshipping and international shopping.
You help travelers understand customs regulations, prohibited items, and shopping opportunities in different countries.
You provide practical advice about what to buy, where to buy, and how to bring items back safely.
Be informative about local markets, duty-free limits, and cultural shopping tips.`,

  GENERAL: `You are Mnbara AI (ذكاء منبرة), a friendly AI assistant for the Mnbara platform.
Mnbara is a marketplace that combines e-commerce with crowdshipping - travelers can earn money by delivering items.
You help with shopping, travel planning, order tracking, and general questions about the platform.
Be warm, helpful, and speak naturally in the user's preferred language.`
};

interface ConversationContext {
  userId?: string;
  sessionId: string;
  language: string;
  category: DataCategory;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  userProfile?: any;
}

export class AssistantService {
  // Process user message
  async chat(data: {
    sessionId: string;
    userId?: string;
    message: string;
    language?: string;
    context?: any;
  }) {
    const startTime = Date.now();

    // Detect language if not provided
    const language = data.language || await this.detectLanguage(data.message);

    // Detect intent and category
    const intent = await this.detectIntent(data.message);

    // Get user profile if available
    let userProfile = null;
    if (data.userId) {
      userProfile = await this.getUserLearning(data.userId);
    }

    // Get relevant knowledge
    const knowledge = await knowledgeService.searchRelevantKnowledge(data.message, intent.category);

    // Build conversation context
    const systemPrompt = this.buildSystemPrompt(intent.category, language, knowledge, userProfile);

    // Generate response
    const response = await this.generateResponse(systemPrompt, data.message, language);

    // Learn from interaction
    if (data.userId) {
      await this.learnFromInteraction(data.userId, data.message, response, intent);
    }

    // Log inference
    const latency = Date.now() - startTime;

    return {
      sessionId: data.sessionId,
      response: response.text,
      responseAr: language === 'ar' ? response.text : response.textAr,
      intent: intent,
      language,
      latency,
      suggestions: response.suggestions,
      actions: response.actions
    };
  }

  // Detect language
  private async detectLanguage(text: string): Promise<string> {
    // Arabic detection
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(text)) return 'ar';

    // Chinese
    const chinesePattern = /[\u4E00-\u9FFF]/;
    if (chinesePattern.test(text)) return 'zh';

    // Japanese
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    if (japanesePattern.test(text)) return 'ja';

    // Korean
    const koreanPattern = /[\uAC00-\uD7AF]/;
    if (koreanPattern.test(text)) return 'ko';

    // Default to English
    return 'en';
  }

  // Detect intent
  private async detectIntent(message: string): Promise<{
    category: DataCategory;
    intent: string;
    confidence: number;
    entities: any;
  }> {
    const lowerMessage = message.toLowerCase();

    // Shopping intents
    if (this.matchesPatterns(lowerMessage, ['buy', 'purchase', 'shop', 'product', 'price', 'اشتري', 'سعر', 'منتج'])) {
      return { category: 'SHOPPING_ASSISTANT', intent: 'shopping', confidence: 0.9, entities: {} };
    }

    // Product search
    if (this.matchesPatterns(lowerMessage, ['find', 'search', 'looking for', 'where can i', 'ابحث', 'اين اجد'])) {
      return { category: 'PRODUCT_SEARCH', intent: 'search', confidence: 0.9, entities: {} };
    }

    // Price negotiation
    if (this.matchesPatterns(lowerMessage, ['negotiate', 'discount', 'cheaper', 'best price', 'خصم', 'تخفيض', 'ارخص'])) {
      return { category: 'PRICE_NEGOTIATION', intent: 'negotiate', confidence: 0.85, entities: {} };
    }

    // Order tracking
    if (this.matchesPatterns(lowerMessage, ['track', 'order', 'delivery', 'where is my', 'تتبع', 'طلبي', 'التوصيل'])) {
      return { category: 'ORDER_TRACKING', intent: 'track', confidence: 0.9, entities: {} };
    }

    // Travel planning
    if (this.matchesPatterns(lowerMessage, ['travel', 'trip', 'visit', 'country', 'سفر', 'رحلة', 'زيارة', 'بلد'])) {
      return { category: 'TRAVEL_PLANNING', intent: 'travel', confidence: 0.85, entities: {} };
    }

    // Customs info
    if (this.matchesPatterns(lowerMessage, ['customs', 'duty', 'prohibited', 'allowed', 'جمارك', 'ممنوع', 'مسموح'])) {
      return { category: 'CUSTOMS_INFO', intent: 'customs', confidence: 0.9, entities: {} };
    }

    // Shipping help
    if (this.matchesPatterns(lowerMessage, ['ship', 'shipping', 'deliver', 'crowdship', 'شحن', 'توصيل'])) {
      return { category: 'SHIPPING_HELP', intent: 'shipping', confidence: 0.85, entities: {} };
    }

    // Payment help
    if (this.matchesPatterns(lowerMessage, ['pay', 'payment', 'card', 'wallet', 'دفع', 'بطاقة', 'محفظة'])) {
      return { category: 'PAYMENT_HELP', intent: 'payment', confidence: 0.85, entities: {} };
    }

    // Complaint
    if (this.matchesPatterns(lowerMessage, ['problem', 'issue', 'complaint', 'refund', 'مشكلة', 'شكوى', 'استرداد'])) {
      return { category: 'COMPLAINT_HANDLING', intent: 'complaint', confidence: 0.9, entities: {} };
    }

    // Default to general chat
    return { category: 'GENERAL_CHAT', intent: 'general', confidence: 0.7, entities: {} };
  }

  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }


  // Build system prompt with context
  private buildSystemPrompt(
    category: DataCategory,
    language: string,
    knowledge: any[],
    userProfile: any
  ): string {
    let basePrompt = SYSTEM_PROMPTS.GENERAL;

    if (['SHOPPING_ASSISTANT', 'PRODUCT_SEARCH', 'PRICE_NEGOTIATION'].includes(category)) {
      basePrompt = SYSTEM_PROMPTS.SHOPPING;
    } else if (['TRAVEL_PLANNING', 'CUSTOMS_INFO', 'SHIPPING_HELP'].includes(category)) {
      basePrompt = SYSTEM_PROMPTS.TRAVEL;
    }

    // Add language instruction
    const langInstruction = language === 'ar' 
      ? '\nRespond in Arabic (العربية). Be natural and friendly.'
      : `\nRespond in ${language}. Be natural and friendly.`;

    // Add knowledge context
    let knowledgeContext = '';
    if (knowledge.length > 0) {
      knowledgeContext = '\n\nRelevant information:\n' + 
        knowledge.map(k => `- ${k.content}`).join('\n');
    }

    // Add user preferences
    let userContext = '';
    if (userProfile) {
      userContext = `\n\nUser preferences:
- Preferred language: ${userProfile.preferredLanguage}
- Favorite categories: ${userProfile.favoriteCategories?.join(', ') || 'Not set'}
- Price preference: ${userProfile.pricePreference || 'Not set'}
- Travel style: ${userProfile.travelStyle || 'Not set'}`;
    }

    return basePrompt + langInstruction + knowledgeContext + userContext;
  }

  // Generate response using AI model
  private async generateResponse(
    systemPrompt: string,
    userMessage: string,
    language: string
  ): Promise<{
    text: string;
    textAr?: string;
    suggestions: string[];
    actions: any[];
  }> {
    try {
      // Use Hugging Face Inference API
      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${systemPrompt}\n\nUser: ${userMessage} [/INST]`,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false
        }
      });

      const text = response.generated_text.trim();

      // Extract suggestions from response
      const suggestions = this.extractSuggestions(text);

      // Extract actions
      const actions = this.extractActions(text);

      // Generate Arabic translation if needed
      let textAr: string | undefined;
      if (language !== 'ar') {
        textAr = await this.translateToArabic(text);
      }

      return { text, textAr, suggestions, actions };
    } catch (error) {
      console.error('Generation error:', error);
      
      // Fallback response
      return {
        text: language === 'ar' 
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : 'Sorry, an error occurred. Please try again.',
        suggestions: [],
        actions: []
      };
    }
  }

  // Extract suggestions from response
  private extractSuggestions(text: string): string[] {
    const suggestions: string[] = [];
    
    // Look for suggestion patterns
    const patterns = [
      /you might also like (.+)/gi,
      /I recommend (.+)/gi,
      /consider (.+)/gi,
      /أقترح (.+)/gi,
      /قد يعجبك (.+)/gi
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        suggestions.push(match[1].trim());
      }
    }

    return suggestions.slice(0, 3);
  }

  // Extract actions from response
  private extractActions(text: string): any[] {
    const actions: any[] = [];

    // Product search action
    if (text.includes('search for') || text.includes('ابحث عن')) {
      actions.push({ type: 'SEARCH', label: 'Search Products' });
    }

    // View order action
    if (text.includes('track your order') || text.includes('تتبع طلبك')) {
      actions.push({ type: 'TRACK_ORDER', label: 'Track Order' });
    }

    // Contact support action
    if (text.includes('contact support') || text.includes('تواصل مع الدعم')) {
      actions.push({ type: 'CONTACT_SUPPORT', label: 'Contact Support' });
    }

    return actions;
  }

  // Translate to Arabic
  private async translateToArabic(text: string): Promise<string> {
    try {
      const response = await hf.translation({
        model: 'Helsinki-NLP/opus-mt-en-ar',
        inputs: text
      });
      return response.translation_text;
    } catch {
      return text;
    }
  }

  // Get user learning profile
  private async getUserLearning(userId: string) {
    return prisma.aIUserLearning.findUnique({
      where: { userId }
    });
  }

  // Learn from interaction
  private async learnFromInteraction(
    userId: string,
    message: string,
    response: any,
    intent: any
  ) {
    // Get or create user learning profile
    let profile = await prisma.aIUserLearning.findUnique({
      where: { userId }
    });

    if (!profile) {
      profile = await prisma.aIUserLearning.create({
        data: {
          userId,
          preferredLanguage: await this.detectLanguage(message),
          totalInteractions: 1
        }
      });
    } else {
      // Update interaction count
      await prisma.aIUserLearning.update({
        where: { userId },
        data: {
          totalInteractions: { increment: 1 },
          updatedAt: new Date()
        }
      });
    }

    // Extract and learn preferences from message
    await this.extractAndLearnPreferences(userId, message, intent);
  }

  // Extract preferences from message
  private async extractAndLearnPreferences(userId: string, message: string, intent: any) {
    const profile = await prisma.aIUserLearning.findUnique({
      where: { userId }
    });

    if (!profile) return;

    const updates: any = {};

    // Learn category preferences
    if (intent.category === 'SHOPPING_ASSISTANT' || intent.category === 'PRODUCT_SEARCH') {
      // Extract category mentions
      const categories = ['electronics', 'fashion', 'home', 'beauty', 'sports'];
      const mentioned = categories.filter(c => message.toLowerCase().includes(c));
      
      if (mentioned.length > 0) {
        const currentCategories = profile.favoriteCategories || [];
        updates.favoriteCategories = [...new Set([...currentCategories, ...mentioned])];
      }
    }

    // Learn price preferences
    if (message.includes('budget') || message.includes('cheap') || message.includes('رخيص')) {
      updates.pricePreference = 'budget';
    } else if (message.includes('premium') || message.includes('luxury') || message.includes('فاخر')) {
      updates.pricePreference = 'premium';
    }

    // Learn travel preferences
    if (intent.category === 'TRAVEL_PLANNING') {
      if (message.includes('adventure') || message.includes('مغامرة')) {
        updates.travelStyle = 'adventure';
      } else if (message.includes('luxury') || message.includes('فاخر')) {
        updates.travelStyle = 'luxury';
      } else if (message.includes('family') || message.includes('عائلة')) {
        updates.travelStyle = 'family';
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.aIUserLearning.update({
        where: { userId },
        data: updates
      });
    }
  }

  // Get greeting
  async getGreeting(language = 'ar') {
    return {
      name: MNBARA_PERSONALITY.name,
      nameAr: MNBARA_PERSONALITY.nameAr,
      greeting: language === 'ar' 
        ? MNBARA_PERSONALITY.greeting.ar 
        : MNBARA_PERSONALITY.greeting.en
    };
  }

  // Rate response
  async rateResponse(inferenceId: string, rating: number, feedback?: string) {
    return prisma.aIInference.update({
      where: { id: inferenceId },
      data: { userRating: rating, feedback }
    });
  }
}

export const assistantService = new AssistantService();
