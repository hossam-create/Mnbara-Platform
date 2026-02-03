// AI Recommendation Service
// Adapted from awesome-llm-apps/ai_investment_agent

import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  UserBehavior,
  ProductRecommendation,
  RecommendationRequest,
  RecommendationResponse,
  AIConfig
} from '../types/recommendation.types';
import { logger } from '../utils/logger';

export class RecommendationService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private config: AIConfig;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.config = {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    };
  }

  /**
   * Get product recommendations for a user
   * Main entry point - adapted from ai_investment_agent
   */
  async getRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();

    try {
      logger.info(`Getting recommendations for user: ${request.userId}`);

      // 1. Analyze user behavior
      const userBehavior = await this.analyzeUserBehavior(request.userId);

      // 2. Generate recommendations using AI
      const recommendations = await this.generateRecommendations(
        userBehavior,
        request.context
      );

      // 3. Rank and filter recommendations
      const rankedRecommendations = this.rankRecommendations(
        recommendations,
        request.context?.limit || 10
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        recommendations: rankedRecommendations,
        metadata: {
          model: this.config.model,
          timestamp: new Date(),
          processingTime
        }
      };
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Analyze user behavior
   * Adapted from ai_investment_agent/analysis_logic.py
   */
  private async analyzeUserBehavior(userId: string): Promise<UserBehavior> {
    // TODO: Fetch from database
    // For now, return mock data
    return {
      userId,
      viewedProducts: [],
      purchasedProducts: [],
      searchQueries: [],
      categories: ['electronics', 'fashion'],
      priceRange: { min: 100, max: 1000 },
      lastActivity: new Date()
    };
  }

  /**
   * Generate recommendations using AI
   * Core logic from ai_investment_agent
   */
  private async generateRecommendations(
    userBehavior: UserBehavior,
    context?: any
  ): Promise<ProductRecommendation[]> {
    const prompt = this.buildPrompt(userBehavior, context);

    if (this.config.provider === 'openai') {
      return this.generateWithOpenAI(prompt);
    } else {
      return this.generateWithAnthropic(prompt);
    }
  }

  /**
   * Build AI prompt
   */
  private buildPrompt(userBehavior: UserBehavior, context?: any): string {
    return `
You are an expert product recommendation system for an e-commerce marketplace.

User Profile:
- User ID: ${userBehavior.userId}
- Viewed Products: ${userBehavior.viewedProducts.length}
- Purchased Products: ${userBehavior.purchasedProducts.length}
- Preferred Categories: ${userBehavior.categories.join(', ')}
- Price Range: $${userBehavior.priceRange.min} - $${userBehavior.priceRange.max}

${context?.category ? `Context: User is browsing ${context.category} category` : ''}

Task: Recommend 10 products that match this user's interests and behavior.

For each recommendation, provide:
1. Product name
2. Category
3. Estimated price
4. Reason for recommendation
5. Confidence score (0-1)

Format your response as JSON array:
[
  {
    "productName": "...",
    "category": "...",
    "price": 0,
    "reason": "...",
    "confidence": 0.0
  }
]
    `.trim();
  }

  /**
   * Generate with OpenAI
   */
  private async generateWithOpenAI(
    prompt: string
  ): Promise<ProductRecommendation[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert product recommendation AI.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Parse JSON response
      const recommendations = JSON.parse(content);
      
      return recommendations.map((rec: any, index: number) => ({
        productId: `product_${index + 1}`,
        productName: rec.productName,
        category: rec.category,
        price: rec.price,
        score: rec.confidence,
        reason: rec.reason,
        confidence: rec.confidence
      }));
    } catch (error) {
      logger.error('OpenAI generation error:', error);
      throw error;
    }
  }

  /**
   * Generate with Anthropic Claude
   */
  private async generateWithAnthropic(
    prompt: string
  ): Promise<ProductRecommendation[]> {
    try {
      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      // Parse JSON response
      const recommendations = JSON.parse(content.text);
      
      return recommendations.map((rec: any, index: number) => ({
        productId: `product_${index + 1}`,
        productName: rec.productName,
        category: rec.category,
        price: rec.price,
        score: rec.confidence,
        reason: rec.reason,
        confidence: rec.confidence
      }));
    } catch (error) {
      logger.error('Anthropic generation error:', error);
      throw error;
    }
  }

  /**
   * Rank recommendations by score
   */
  private rankRecommendations(
    recommendations: ProductRecommendation[],
    limit: number
  ): ProductRecommendation[] {
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
