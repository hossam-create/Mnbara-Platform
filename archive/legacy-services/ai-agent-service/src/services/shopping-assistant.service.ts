/**
 * Mnbara Shopping Assistant Service
 * 
 * The heart of AI-powered shopping experience
 * Understands Arabic, dreams, and shopping needs
 */

import { PrismaClient } from '@prisma/client';
import recommendationClient from '../clients/recommendation.client';
import searchClient from '../clients/search.client';
import listingClient from '../clients/listing.client';

const prisma = new PrismaClient();

export interface ShoppingContext {
  userId: string;
  message: string;
  conversationHistory?: ConversationMessage[];
  userProfile?: UserProfile;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  previousPurchases?: any[];
  browsingHistory?: any[];
  preferences?: string[];
  budget?: number;
  language?: 'ar' | 'en';
}

export interface AssistantResponse {
  message: string;
  suggestions?: ProductSuggestion[];
  actions?: SuggestedAction[];
  metadata?: any;
}

export interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  image?: string;
  rating?: number;
  reason: string;
}

export interface SuggestedAction {
  type: 'search' | 'view_product' | 'add_to_cart' | 'view_category';
  label: string;
  data: any;
}

export class ShoppingAssistantService {
  /**
   * Main entry point for shopping assistant
   */
  async chat(context: ShoppingContext): Promise<AssistantResponse> {
    // Understand user intent
    const intent = await this.understandIntent(context.message);

    // Get relevant context
    const enrichedContext = await this.enrichContext(context);

    // Generate intelligent response
    const response = await this.generateResponse(intent, enrichedContext);

    // Save conversation
    await this.saveConversation(context.userId, context.message, response.message);

    return response;
  }

  /**
   * Understand what the user wants
   */
  private async understandIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Gift finding
    if (lowerMessage.includes('هدية') || lowerMessage.includes('gift')) {
      return 'gift_finder';
    }

    // Budget planning
    if (lowerMessage.includes('ميزانية') || lowerMessage.includes('budget') || 
        lowerMessage.includes('عندي') || lowerMessage.includes('ريال')) {
      return 'budget_helper';
    }

    // Dream planning
    if (lowerMessage.includes('أحلم') || lowerMessage.includes('dream') ||
        lowerMessage.includes('سفر') || lowerMessage.includes('travel')) {
      return 'dream_planner';
    }

    // Product search
    if (lowerMessage.includes('أبحث') || lowerMessage.includes('search') ||
        lowerMessage.includes('أريد') || lowerMessage.includes('want')) {
      return 'product_search';
    }

    // General help
    return 'general_help';
  }

  /**
   * Enrich context with user data
   */
  private async enrichContext(context: ShoppingContext): Promise<any> {
    // Get user's previous purchases
    const purchases = await this.getUserPurchases(context.userId);

    // Get browsing history
    const browsing = await this.getBrowsingHistory(context.userId);

    // Get user preferences
    const preferences = await this.getUserPreferences(context.userId);

    return {
      ...context,
      purchases,
      browsing,
      preferences
    };
  }

  /**
   * Generate intelligent response based on intent
   */
  private async generateResponse(
    intent: string,
    context: any
  ): Promise<AssistantResponse> {
    switch (intent) {
      case 'gift_finder':
        return this.handleGiftFinder(context);
      
      case 'budget_helper':
        return this.handleBudgetHelper(context);
      
      case 'dream_planner':
        return this.handleDreamPlanner(context);
      
      case 'product_search':
        return this.handleProductSearch(context);
      
      default:
        return this.handleGeneralHelp(context);
    }
  }

  /**
   * Handle gift finding requests
   */
  private async handleGiftFinder(context: any): Promise<AssistantResponse> {
    // Extract gift details from message
    const giftDetails = this.extractGiftDetails(context.message);
    giftDetails.userId = context.userId; // Add userId for personalization

    // Get product recommendations
    const suggestions = await this.getGiftSuggestions(giftDetails);

    return {
      message: `✨ فهمت! دعني أساعدك في إيجاد الهدية المثالية:\n\n` +
               `🎁 وجدت ${suggestions.length} اقتراحات رائعة تناسب ${giftDetails.recipient}`,
      suggestions,
      actions: [
        {
          type: 'view_category',
          label: 'عرض المزيد من الهدايا',
          data: { category: 'gifts' }
        }
      ]
    };
  }

  /**
   * Handle budget planning requests
   */
  private async handleBudgetHelper(context: any): Promise<AssistantResponse> {
    // Extract budget from message
    const budget = this.extractBudget(context.message);

    // Get budget-friendly suggestions
    const suggestions = await this.getBudgetSuggestions(budget, context.userId);

    return {
      message: `💰 خطة ذكية لميزانيتك (${budget} ريال):\n\n` +
               `وجدت ${suggestions.length} منتجات تناسب ميزانيتك تماماً!`,
      suggestions,
      actions: [
        {
          type: 'search',
          label: 'عرض المزيد في نطاق السعر',
          data: { maxPrice: budget }
        }
      ]
    };
  }

  /**
   * Handle dream planning requests
   */
  private async handleDreamPlanner(context: any): Promise<AssistantResponse> {
    // Extract dream details
    const dream = this.extractDreamDetails(context.message);

    // Create dream plan
    const plan = await this.createDreamPlan(dream);

    return {
      message: `🌟 خطة رائعة لتحقيق حلمك!\n\n` +
               `${plan.description}\n\n` +
               `💵 التكلفة الإجمالية: ${plan.totalCost} ريال`,
      suggestions: plan.items,
      actions: [
        {
          type: 'view_product',
          label: 'عرض التفاصيل الكاملة',
          data: { planId: plan.id }
        }
      ]
    };
  }

  /**
   * Handle product search requests
   */
  private async handleProductSearch(context: any): Promise<AssistantResponse> {
    // Extract search query
    const query = this.extractSearchQuery(context.message);

    // Search products using search service
    const suggestions = await this.searchProducts(query, context.userId);

    if (suggestions.length === 0) {
      return {
        message: `🔍 لم أجد نتائج لـ "${query}"\n\n` +
                 `💡 جرب:\n` +
                 `• استخدام كلمات مختلفة\n` +
                 `• تصفح الفئات\n` +
                 `• طلب اقتراحات مني`,
        actions: [
          {
            type: 'view_category',
            label: 'تصفح الفئات',
            data: {}
          }
        ]
      };
    }

    return {
      message: `🔍 وجدت ${suggestions.length} منتجات تطابق بحثك عن "${query}":`,
      suggestions,
      actions: [
        {
          type: 'search',
          label: 'عرض جميع النتائج',
          data: { query }
        }
      ]
    };
  }

  /**
   * Handle general help requests
   */
  private async handleGeneralHelp(context: any): Promise<AssistantResponse> {
    return {
      message: `👋 مرحباً! أنا مساعدك الذكي في منبرة.\n\n` +
               `يمكنني مساعدتك في:\n` +
               `🎁 إيجاد الهدايا المثالية\n` +
               `💰 التخطيط لميزانيتك\n` +
               `🌟 تحقيق أحلامك\n` +
               `🔍 البحث عن المنتجات\n\n` +
               `كيف يمكنني مساعدتك اليوم؟`,
      actions: [
        {
          type: 'search',
          label: 'تصفح المنتجات',
          data: {}
        }
      ]
    };
  }

  // Helper methods
  private extractGiftDetails(message: string): any {
    // TODO: Use NLP to extract recipient, age, interests, etc.
    return {
      recipient: 'أم',
      age: 60,
      interests: ['قراءة']
    };
  }

  private extractBudget(message: string): number {
    // Extract numbers from message
    const numbers = message.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : 500;
  }

  private extractDreamDetails(message: string): any {
    return {
      type: 'travel',
      destination: 'دبي',
      duration: 7
    };
  }

  private extractSearchQuery(message: string): string {
    // Remove common words and extract main query
    return message
      .replace(/أبحث عن|أريد|want|search/gi, '')
      .trim();
  }

  private async getGiftSuggestions(details: any): Promise<ProductSuggestion[]> {
    try {
      // Strategy 1: Try recommendations first
      const recommendations = await recommendationClient.getPersonalizedRecommendations(
        details.userId || 'guest',
        10
      );

      if (recommendations.length > 0) {
        return recommendations.map(rec => ({
          id: rec.productId,
          name: rec.productName,
          price: rec.price,
          image: rec.image,
          rating: rec.rating || 4.5,
          reason: rec.reason || `مناسب لـ ${details.recipient}`
        }));
      }

      // Strategy 2: Fallback to featured listings
      const listings = await listingClient.getFeaturedListings(10);
      if (listings.length > 0) {
        return listings.map(listing => ({
          id: listing.id.toString(),
          name: listing.titleAr || listing.title,
          price: listing.price,
          image: listing.images[0]?.url,
          rating: listing.seller?.rating || 4.5,
          reason: `هدية مميزة من ${listing.seller?.name || 'بائع موثوق'}`
        }));
      }

      // Strategy 3: Last resort - mock data
      return [
        {
          id: '1',
          name: 'كتاب إلكتروني بخط كبير',
          price: 150,
          rating: 4.8,
          reason: 'مثالي للقراءة المريحة'
        },
        {
          id: '2',
          name: 'مصباح قراءة LED',
          price: 120,
          rating: 4.7,
          reason: 'إضاءة مثالية للقراءة'
        }
      ];
    } catch (error) {
      console.error('Failed to get gift suggestions:', error);
      return [];
    }
  }

  private async getBudgetSuggestions(budget: number, userId?: string): Promise<ProductSuggestion[]> {
    try {
      // Strategy 1: Try recommendations first
      const recommendations = await recommendationClient.getRecommendationsByBudget(
        userId || 'guest',
        budget
      );

      if (recommendations.length > 0) {
        return recommendations.map(rec => ({
          id: rec.productId,
          name: rec.productName,
          price: rec.price,
          image: rec.image,
          rating: rec.rating || 4.5,
          reason: `ضمن ميزانيتك (${budget} ريال)`
        }));
      }

      // Strategy 2: Fallback to listings within budget
      const listings = await listingClient.getListingsByPriceRange(0, budget, 10);
      if (listings.length > 0) {
        return listings.map(listing => ({
          id: listing.id.toString(),
          name: listing.titleAr || listing.title,
          price: listing.price,
          image: listing.images[0]?.url,
          rating: listing.seller?.rating || 4.5,
          reason: `${listing.price} ريال - ضمن ميزانيتك`
        }));
      }

      return [];
    } catch (error) {
      console.error('Failed to get budget suggestions:', error);
      return [];
    }
  }

  private async createDreamPlan(dream: any): Promise<any> {
    // TODO: Create comprehensive plan
    return {
      id: '1',
      description: 'رحلة رائعة إلى دبي',
      totalCost: 5300,
      items: []
    };
  }

  private async searchProducts(query: string, userId?: string): Promise<ProductSuggestion[]> {
    try {
      // Strategy 1: Try search service first (fastest)
      const searchResult = await searchClient.searchProducts(
        query,
        { inStock: true },
        { limit: 10 }
      );

      if (searchResult.hits.length > 0) {
        // Track search interaction
        if (userId) {
          await recommendationClient.trackInteraction(
            userId,
            searchResult.hits[0].id,
            'VIEW',
            { searchQuery: query }
          ).catch(() => {});
        }

        return searchResult.hits.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.imageUrl,
          rating: product.rating || 4.5,
          reason: `يطابق بحثك عن "${query}"`
        }));
      }

      // Strategy 2: Fallback to listing service
      const listings = await listingClient.searchListings(query, { limit: 10 });
      if (listings.length > 0) {
        return listings.map(listing => ({
          id: listing.id.toString(),
          name: listing.titleAr || listing.title,
          price: listing.price,
          image: listing.images[0]?.url,
          rating: listing.seller?.rating || 4.5,
          reason: `يطابق بحثك عن "${query}"`
        }));
      }

      return [];
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  }

  private async getUserPurchases(userId: string): Promise<any[]> {
    // TODO: Get from database
    return [];
  }

  private async getBrowsingHistory(userId: string): Promise<any[]> {
    // TODO: Get from analytics
    return [];
  }

  private async getUserPreferences(userId: string): Promise<any> {
    // TODO: Get from user profile
    return {};
  }

  private async saveConversation(
    userId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<void> {
    try {
      // Find or create shopping assistant agent
      let agent = await prisma.agent.findFirst({
        where: { name: 'Shopping Assistant' }
      });

      if (!agent) {
        agent = await prisma.agent.create({
          data: {
            name: 'Shopping Assistant',
            type: 'assistant',
            model: 'gpt-4',
            systemPrompt: 'You are a helpful shopping assistant for mnbarh platform',
            temperature: 0.7,
            maxTokens: 2000,
            isActive: true
          }
        });
      }

      // Find or create conversation for this user
      let conversation = await prisma.conversation.findFirst({
        where: {
          agentId: agent.id,
          userId: userId
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            agentId: agent.id,
            userId: userId,
            sessionId: `session-${Date.now()}`,
            title: 'Shopping Conversation'
          }
        });
      }

      // Add messages
      await prisma.message.createMany({
        data: [
          {
            conversationId: conversation.id,
            role: 'user',
            content: userMessage
          },
          {
            conversationId: conversation.id,
            role: 'assistant',
            content: assistantMessage
          }
        ]
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
      // Don't throw - conversation saving is not critical
    }
  }
}

export default new ShoppingAssistantService();
