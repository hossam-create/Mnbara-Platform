// Voice Service - خدمة الصوت
// Speech-to-Text, Text-to-Speech, Intent Recognition

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Types
type CommandIntent = 'SEARCH_PRODUCT' | 'ADD_TO_CART' | 'REMOVE_FROM_CART' | 'VIEW_CART' | 'CHECKOUT' | 'TRACK_ORDER' | 'GET_RECOMMENDATIONS' | 'ASK_PRICE' | 'ASK_AVAILABILITY' | 'COMPARE_PRODUCTS' | 'GET_HELP' | 'NAVIGATE' | 'UNKNOWN';

interface TranscriptionResult {
  transcript: string;
  confidence: number;
  language: string;
}

interface IntentResult {
  intent: CommandIntent;
  confidence: number;
  entities: Record<string, any>;
}

interface VoiceCommandResult {
  commandId: string;
  transcript: string;
  intent: CommandIntent;
  entities: Record<string, any>;
  response: string;
  responseAr: string;
  audioUrl?: string;
  actionTaken?: string;
}

// Intent patterns for Arabic and English
const INTENT_PATTERNS: Record<CommandIntent, { en: RegExp[]; ar: RegExp[] }> = {
  SEARCH_PRODUCT: {
    en: [/search for (.+)/i, /find (.+)/i, /look for (.+)/i, /show me (.+)/i, /i want (.+)/i],
    ar: [/ابحث عن (.+)/i, /دور على (.+)/i, /ابي (.+)/i, /عرض (.+)/i, /اريد (.+)/i],
  },
  ADD_TO_CART: {
    en: [/add (.+) to cart/i, /add to cart/i, /buy (.+)/i, /i'll take (.+)/i],
    ar: [/اضف (.+) للسلة/i, /اضف للسلة/i, /اشتري (.+)/i, /خذ (.+)/i],
  },
  REMOVE_FROM_CART: {
    en: [/remove (.+) from cart/i, /delete (.+)/i, /take out (.+)/i],
    ar: [/احذف (.+) من السلة/i, /شيل (.+)/i, /امسح (.+)/i],
  },
  VIEW_CART: {
    en: [/show cart/i, /view cart/i, /what's in my cart/i, /my cart/i],
    ar: [/عرض السلة/i, /شوف السلة/i, /ايش في السلة/i, /سلتي/i],
  },
  CHECKOUT: {
    en: [/checkout/i, /pay now/i, /complete order/i, /place order/i],
    ar: [/اتمام الشراء/i, /ادفع/i, /اكمل الطلب/i, /اطلب/i],
  },
  TRACK_ORDER: {
    en: [/track order/i, /where is my order/i, /order status/i],
    ar: [/تتبع الطلب/i, /وين طلبي/i, /حالة الطلب/i],
  },
  GET_RECOMMENDATIONS: {
    en: [/recommend/i, /suggest/i, /what do you recommend/i],
    ar: [/اقترح/i, /نصحني/i, /ايش تنصح/i],
  },
  ASK_PRICE: {
    en: [/how much/i, /what's the price/i, /price of (.+)/i],
    ar: [/كم سعر/i, /بكم/i, /سعر (.+)/i],
  },
  ASK_AVAILABILITY: {
    en: [/is (.+) available/i, /do you have (.+)/i, /in stock/i],
    ar: [/هل (.+) متوفر/i, /عندكم (.+)/i, /موجود/i],
  },
  COMPARE_PRODUCTS: {
    en: [/compare (.+) with (.+)/i, /difference between/i],
    ar: [/قارن (.+) مع (.+)/i, /الفرق بين/i],
  },
  GET_HELP: {
    en: [/help/i, /support/i, /how do i/i, /what can you do/i],
    ar: [/مساعدة/i, /ساعدني/i, /كيف/i, /ايش تقدر تسوي/i],
  },
  NAVIGATE: {
    en: [/go to (.+)/i, /open (.+)/i, /show (.+) page/i],
    ar: [/روح (.+)/i, /افتح (.+)/i, /صفحة (.+)/i],
  },
  UNKNOWN: { en: [], ar: [] },
};

export class VoiceService {
  // ==========================================
  // 🎤 SPEECH TO TEXT
  // ==========================================

  async transcribeAudio(audioBuffer: Buffer, language: string = 'ar-SA'): Promise<TranscriptionResult> {
    // In production, use Google Cloud Speech-to-Text
    // const speech = require('@google-cloud/speech');
    // const client = new speech.SpeechClient();
    
    // For now, simulate transcription
    // This would be replaced with actual Google Cloud Speech API call
    
    const mockTranscripts: Record<string, string> = {
      'ar-SA': 'ابحث عن ايفون 15',
      'en-US': 'search for iPhone 15',
    };

    return {
      transcript: mockTranscripts[language] || mockTranscripts['ar-SA'],
      confidence: 0.95,
      language,
    };
  }

  // ==========================================
  // 🧠 INTENT RECOGNITION
  // ==========================================

  async recognizeIntent(transcript: string, language: string = 'ar-SA'): Promise<IntentResult> {
    const isArabic = language.startsWith('ar');
    const patterns = isArabic ? 'ar' : 'en';
    
    let bestMatch: { intent: CommandIntent; confidence: number; entities: Record<string, any> } = {
      intent: 'UNKNOWN',
      confidence: 0,
      entities: {},
    };

    for (const [intent, patternSet] of Object.entries(INTENT_PATTERNS)) {
      const intentPatterns = patternSet[patterns];
      
      for (const pattern of intentPatterns) {
        const match = transcript.match(pattern);
        if (match) {
          const confidence = 0.9; // Base confidence for pattern match
          
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              intent: intent as CommandIntent,
              confidence,
              entities: this.extractEntities(match, intent as CommandIntent),
            };
          }
        }
      }
    }

    // If no pattern matched, try keyword matching
    if (bestMatch.intent === 'UNKNOWN') {
      bestMatch = await this.keywordMatch(transcript, isArabic);
    }

    return bestMatch;
  }

  private extractEntities(match: RegExpMatchArray, intent: CommandIntent): Record<string, any> {
    const entities: Record<string, any> = {};

    switch (intent) {
      case 'SEARCH_PRODUCT':
      case 'ADD_TO_CART':
      case 'ASK_PRICE':
      case 'ASK_AVAILABILITY':
        if (match[1]) entities.product = match[1].trim();
        break;
      case 'COMPARE_PRODUCTS':
        if (match[1]) entities.product1 = match[1].trim();
        if (match[2]) entities.product2 = match[2].trim();
        break;
      case 'NAVIGATE':
        if (match[1]) entities.destination = match[1].trim();
        break;
    }

    return entities;
  }

  private async keywordMatch(transcript: string, isArabic: boolean): Promise<IntentResult> {
    const keywords: Record<CommandIntent, { en: string[]; ar: string[] }> = {
      SEARCH_PRODUCT: { en: ['search', 'find', 'look'], ar: ['بحث', 'دور', 'ابي'] },
      ADD_TO_CART: { en: ['add', 'cart', 'buy'], ar: ['اضف', 'سلة', 'اشتري'] },
      VIEW_CART: { en: ['cart', 'basket'], ar: ['سلة', 'سلتي'] },
      CHECKOUT: { en: ['checkout', 'pay', 'order'], ar: ['دفع', 'اطلب', 'شراء'] },
      GET_HELP: { en: ['help', 'support'], ar: ['مساعدة', 'ساعد'] },
      TRACK_ORDER: { en: ['track', 'where', 'status'], ar: ['تتبع', 'وين', 'حالة'] },
      GET_RECOMMENDATIONS: { en: ['recommend', 'suggest'], ar: ['اقترح', 'نصح'] },
      ASK_PRICE: { en: ['price', 'cost', 'how much'], ar: ['سعر', 'كم', 'بكم'] },
      ASK_AVAILABILITY: { en: ['available', 'stock', 'have'], ar: ['متوفر', 'موجود', 'عندكم'] },
      COMPARE_PRODUCTS: { en: ['compare', 'difference'], ar: ['قارن', 'فرق'] },
      REMOVE_FROM_CART: { en: ['remove', 'delete'], ar: ['احذف', 'شيل'] },
      NAVIGATE: { en: ['go', 'open', 'page'], ar: ['روح', 'افتح', 'صفحة'] },
      UNKNOWN: { en: [], ar: [] },
    };

    const lang = isArabic ? 'ar' : 'en';
    const lowerTranscript = transcript.toLowerCase();

    for (const [intent, kw] of Object.entries(keywords)) {
      const intentKeywords = kw[lang];
      for (const keyword of intentKeywords) {
        if (lowerTranscript.includes(keyword)) {
          return {
            intent: intent as CommandIntent,
            confidence: 0.7,
            entities: { rawQuery: transcript },
          };
        }
      }
    }

    return { intent: 'UNKNOWN', confidence: 0, entities: {} };
  }

  // ==========================================
  // 🔊 TEXT TO SPEECH
  // ==========================================

  async synthesizeSpeech(text: string, language: string = 'ar-SA'): Promise<string> {
    // In production, use Google Cloud Text-to-Speech
    // const textToSpeech = require('@google-cloud/text-to-speech');
    // const client = new textToSpeech.TextToSpeechClient();

    // For now, return a placeholder URL
    // This would be replaced with actual audio generation
    return `https://storage.mnbara.com/voice/response_${Date.now()}.mp3`;
  }

  // ==========================================
  // 🎯 PROCESS VOICE COMMAND
  // ==========================================

  async processVoiceCommand(
    userId: string,
    audioBuffer: Buffer,
    language: string = 'ar-SA',
    sessionId?: string
  ): Promise<VoiceCommandResult> {
    const startTime = Date.now();

    // Get or create session
    let session = sessionId
      ? await prisma.voiceSession.findUnique({ where: { id: sessionId } })
      : null;

    if (!session) {
      session = await prisma.voiceSession.create({
        data: { userId, language },
      });
    }

    // Transcribe audio
    const transcription = await this.transcribeAudio(audioBuffer, language);

    // Recognize intent
    const intentResult = await this.recognizeIntent(transcription.transcript, language);

    // Generate response
    const response = await this.generateResponse(intentResult, language);

    // Execute action
    const actionResult = await this.executeAction(userId, intentResult);

    // Generate audio response
    const audioUrl = await this.synthesizeSpeech(
      language.startsWith('ar') ? response.ar : response.en,
      language
    );

    // Save command
    const command = await prisma.voiceCommand.create({
      data: {
        sessionId: session.id,
        userId,
        transcript: transcription.transcript,
        confidence: transcription.confidence,
        intent: intentResult.intent,
        entities: intentResult.entities,
        processingTime: Date.now() - startTime,
        responseText: response.en,
        responseTextAr: response.ar,
        responseAudioUrl: audioUrl,
        status: 'COMPLETED',
        actionType: actionResult?.type,
        actionData: actionResult?.data,
      },
    });

    // Update session stats
    await prisma.voiceSession.update({
      where: { id: session.id },
      data: {
        commandCount: { increment: 1 },
        successCount: { increment: intentResult.intent !== 'UNKNOWN' ? 1 : 0 },
      },
    });

    // Update analytics
    await this.updateAnalytics(intentResult.intent, language);

    return {
      commandId: command.id,
      transcript: transcription.transcript,
      intent: intentResult.intent,
      entities: intentResult.entities,
      response: response.en,
      responseAr: response.ar,
      audioUrl,
      actionTaken: actionResult?.type,
    };
  }

  // ==========================================
  // 💬 RESPONSE GENERATION
  // ==========================================

  private async generateResponse(
    intentResult: IntentResult,
    language: string
  ): Promise<{ en: string; ar: string }> {
    const responses: Record<CommandIntent, { en: string; ar: string }> = {
      SEARCH_PRODUCT: {
        en: `Searching for ${intentResult.entities.product || 'products'}...`,
        ar: `جاري البحث عن ${intentResult.entities.product || 'المنتجات'}...`,
      },
      ADD_TO_CART: {
        en: `Adding ${intentResult.entities.product || 'item'} to your cart.`,
        ar: `جاري إضافة ${intentResult.entities.product || 'المنتج'} للسلة.`,
      },
      REMOVE_FROM_CART: {
        en: `Removing ${intentResult.entities.product || 'item'} from your cart.`,
        ar: `جاري حذف ${intentResult.entities.product || 'المنتج'} من السلة.`,
      },
      VIEW_CART: {
        en: 'Here is your shopping cart.',
        ar: 'هذه سلة التسوق الخاصة بك.',
      },
      CHECKOUT: {
        en: 'Taking you to checkout. Please confirm your order.',
        ar: 'جاري الانتقال للدفع. يرجى تأكيد طلبك.',
      },
      TRACK_ORDER: {
        en: 'Let me check your order status.',
        ar: 'دعني أتحقق من حالة طلبك.',
      },
      GET_RECOMMENDATIONS: {
        en: 'Here are some products you might like.',
        ar: 'إليك بعض المنتجات التي قد تعجبك.',
      },
      ASK_PRICE: {
        en: `Let me find the price for ${intentResult.entities.product || 'that'}.`,
        ar: `دعني أجد سعر ${intentResult.entities.product || 'ذلك'}.`,
      },
      ASK_AVAILABILITY: {
        en: `Checking availability for ${intentResult.entities.product || 'that item'}.`,
        ar: `جاري التحقق من توفر ${intentResult.entities.product || 'المنتج'}.`,
      },
      COMPARE_PRODUCTS: {
        en: 'Comparing the products for you.',
        ar: 'جاري مقارنة المنتجات لك.',
      },
      GET_HELP: {
        en: 'I can help you search for products, add items to cart, checkout, and track orders. What would you like to do?',
        ar: 'يمكنني مساعدتك في البحث عن المنتجات، إضافة منتجات للسلة، إتمام الشراء، وتتبع الطلبات. ماذا تريد أن تفعل؟',
      },
      NAVIGATE: {
        en: `Taking you to ${intentResult.entities.destination || 'the page'}.`,
        ar: `جاري الانتقال إلى ${intentResult.entities.destination || 'الصفحة'}.`,
      },
      UNKNOWN: {
        en: "I didn't understand that. Could you please repeat?",
        ar: 'لم أفهم ذلك. هل يمكنك التكرار؟',
      },
    };

    return responses[intentResult.intent] || responses.UNKNOWN;
  }

  // ==========================================
  // ⚡ ACTION EXECUTION
  // ==========================================

  private async executeAction(
    userId: string,
    intentResult: IntentResult
  ): Promise<{ type: string; data: any } | null> {
    // In production, these would call actual services
    switch (intentResult.intent) {
      case 'SEARCH_PRODUCT':
        return {
          type: 'search',
          data: { query: intentResult.entities.product, results: [] },
        };
      case 'ADD_TO_CART':
        return {
          type: 'add_to_cart',
          data: { product: intentResult.entities.product },
        };
      case 'VIEW_CART':
        return {
          type: 'view_cart',
          data: { items: [] },
        };
      case 'CHECKOUT':
        return {
          type: 'checkout',
          data: { redirectUrl: '/checkout' },
        };
      default:
        return null;
    }
  }

  // ==========================================
  // 📊 ANALYTICS
  // ==========================================

  private async updateAnalytics(intent: CommandIntent, language: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isArabic = language.startsWith('ar');
    const isEnglish = language.startsWith('en');

    const intentField = {
      SEARCH_PRODUCT: 'searchCount',
      ADD_TO_CART: 'cartCount',
      VIEW_CART: 'cartCount',
      CHECKOUT: 'checkoutCount',
      GET_HELP: 'helpCount',
    }[intent];

    await prisma.voiceAnalytics.upsert({
      where: { date: today },
      update: {
        totalCommands: { increment: 1 },
        ...(intentField && { [intentField]: { increment: 1 } }),
        ...(isArabic && { arabicCount: { increment: 1 } }),
        ...(isEnglish && { englishCount: { increment: 1 } }),
        ...(!isArabic && !isEnglish && { otherCount: { increment: 1 } }),
      },
      create: {
        date: today,
        totalCommands: 1,
        ...(intentField && { [intentField]: 1 }),
        arabicCount: isArabic ? 1 : 0,
        englishCount: isEnglish ? 1 : 0,
        otherCount: !isArabic && !isEnglish ? 1 : 0,
      },
    });
  }

  // ==========================================
  // 👤 USER PREFERENCES
  // ==========================================

  async getUserPreferences(userId: string) {
    let prefs = await prisma.userVoicePreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.userVoicePreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updateUserPreferences(userId: string, data: {
    preferredLanguage?: string;
    voiceSpeed?: number;
    voicePitch?: number;
    voiceGender?: string;
    confirmBeforeAction?: boolean;
    readProductDetails?: boolean;
  }) {
    return prisma.userVoicePreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  // ==========================================
  // 📈 GET ANALYTICS
  // ==========================================

  async getAnalytics(startDate: Date, endDate: Date) {
    return prisma.voiceAnalytics.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayStats, weekStats] = await Promise.all([
      prisma.voiceAnalytics.findUnique({ where: { date: today } }),
      prisma.voiceAnalytics.aggregate({
        where: { date: { gte: weekAgo } },
        _sum: {
          totalCommands: true,
          searchCount: true,
          cartCount: true,
          checkoutCount: true,
          voiceOrders: true,
          voiceRevenue: true,
        },
        _avg: {
          successRate: true,
          avgProcessingTime: true,
        },
      }),
    ]);

    return { today: todayStats, week: weekStats };
  }
}

export const voiceService = new VoiceService();
