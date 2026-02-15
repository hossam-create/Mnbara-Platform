import OpenAI from 'openai';
import { Logger } from '@mnbara/shared-utils';
import { 
  AITextGenerationRequest, 
  AITextGenerationResponse, 
  AIImageGenerationRequest, 
  AIImageGenerationResponse,
  ContentRecommendationRequest,
  ContentRecommendationResponse
} from '../types/Personalization.types';

/**
 * AI Content Generation Service
 * Provides AI-powered content generation and recommendations
 */
export class AIContentService {
  private openai: OpenAI;
  private logger: Logger;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.logger = new Logger('AIContentService');
  }

  /**
   * Generate text content using AI
   */
  async generateText(request: AITextGenerationRequest): Promise<AITextGenerationResponse> {
    try {
      this.logger.info(`Generating ${request.length || 'medium'} ${request.tone || 'professional'} text for ${request.contentType}`);

      const prompt = this.buildTextPrompt(request);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a professional content writer. Generate high-quality, engaging content based on the user's requirements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: this.getMaxTokens(request.length),
        temperature: 0.7,
        n: 1,
      });

      const generatedText = completion.choices[0]?.message?.content || '';
      
      // Analyze the generated text
      const analysis = await this.analyzeText(generatedText, request);

      return {
        text: generatedText,
        confidence: completion.choices[0]?.finish_reason === 'stop' ? 0.9 : 0.7,
        tokensUsed: completion.usage?.total_tokens || 0,
        metadata: analysis
      };

    } catch (error) {
      this.logger.error('Failed to generate text content', error);
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  /**
   * Generate image content using AI
   */
  async generateImage(request: AIImageGenerationRequest): Promise<AIImageGenerationResponse> {
    try {
      this.logger.info(`Generating ${request.style || 'photorealistic'} image: ${request.prompt}`);

      const enhancedPrompt = this.enhanceImagePrompt(request);
      
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: this.getImageSize(request.size),
        style: request.style === 'photorealistic' ? 'vivid' : 'natural',
      });

      const imageUrl = response.data[0]?.url;
      const revisedPrompt = response.data[0]?.revised_prompt || request.prompt;

      if (!imageUrl) {
        throw new Error('No image generated');
      }

      // Generate alt text for accessibility
      const altText = await this.generateAltText(revisedPrompt);

      return {
        url: imageUrl,
        altText,
        confidence: 0.85,
        metadata: {
          style: request.style || 'photorealistic',
          colors: this.extractColorsFromPrompt(revisedPrompt),
          dimensions: this.getImageDimensions(request.size)
        }
      };

    } catch (error) {
      this.logger.error('Failed to generate image content', error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Generate content recommendations using AI
   */
  async generateRecommendations(request: ContentRecommendationRequest): Promise<ContentRecommendationResponse> {
    try {
      this.logger.info(`Generating content recommendations for user ${request.userProfile.id}`);

      // Analyze user profile and context
      const userAnalysis = this.analyzeUserProfile(request.userProfile);
      const contextAnalysis = this.analyzeContext(request.context);

      // Build recommendation prompt
      const prompt = this.buildRecommendationPrompt(userAnalysis, contextAnalysis, request);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a content recommendation engine. Analyze user preferences and context to provide personalized content recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.5,
        n: 1,
      });

      const recommendations = this.parseRecommendations(completion.choices[0]?.message?.content || '');

      return {
        recommendations,
        reasoning: this.generateReasoning(userAnalysis, contextAnalysis),
        confidence: this.calculateConfidence(userAnalysis, contextAnalysis),
        diversityScore: this.calculateDiversityScore(recommendations),
        freshnessScore: this.calculateFreshnessScore(recommendations),
        popularityScore: this.calculatePopularityScore(recommendations)
      };

    } catch (error) {
      this.logger.error('Failed to generate recommendations', error);
      throw new Error(`Recommendation generation failed: ${error.message}`);
    }
  }

  /**
   * Generate SEO-optimized content
   */
  async generateSEOContent(
    topic: string,
    keywords: string[],
    targetAudience: string,
    contentLength: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<AITextGenerationResponse> {
    try {
      this.logger.info(`Generating SEO content for topic: ${topic}`);

      const seoPrompt = `
        Generate SEO-optimized content for the following:
        
        Topic: ${topic}
        Keywords: ${keywords.join(', ')}
        Target Audience: ${targetAudience}
        Content Length: ${contentLength}
        
        Requirements:
        - Include the primary keywords naturally in the content
        - Write engaging, informative content
        - Use proper heading structure (H1, H2, H3)
        - Include meta description
        - Optimize for search engines while maintaining readability
        - Include internal linking opportunities
        - Add relevant statistics or data if applicable
      `;

      return await this.generateText({
        prompt: seoPrompt,
        contentType: 'seo-content',
        tone: 'professional',
        length: contentLength,
        targetAudience,
        keywords
      });

    } catch (error) {
      this.logger.error('Failed to generate SEO content', error);
      throw error;
    }
  }

  /**
   * Generate product descriptions
   */
  async generateProductDescription(
    productName: string,
    features: string[],
    targetAudience: string,
    tone: 'formal' | 'casual' | 'persuasive' = 'persuasive'
  ): Promise<AITextGenerationResponse> {
    try {
      this.logger.info(`Generating product description for: ${productName}`);

      const productPrompt = `
        Write a compelling product description for:
        
        Product Name: ${productName}
        Key Features: ${features.join(', ')}
        Target Audience: ${targetAudience}
        Tone: ${tone}
        
        Requirements:
        - Highlight key benefits and features
        - Address customer pain points
        - Include a clear call-to-action
        - Use persuasive language
        - Keep it concise but informative
        - Optimize for conversions
      `;

      return await this.generateText({
        prompt: productPrompt,
        contentType: 'product-description',
        tone,
        targetAudience
      });

    } catch (error) {
      this.logger.error('Failed to generate product description', error);
      throw error;
    }
  }

  /**
   * Generate social media content
   */
  async generateSocialMediaContent(
    topic: string,
    platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin',
    tone: 'casual' | 'professional' | 'fun' = 'casual'
  ): Promise<AITextGenerationResponse> {
    try {
      this.logger.info(`Generating social media content for ${platform}: ${topic}`);

      const platformLimits = {
        twitter: 280,
        facebook: 500,
        instagram: 2200,
        linkedin: 3000
      };

      const socialPrompt = `
        Create engaging social media content for ${platform}:
        
        Topic: ${topic}
        Tone: ${tone}
        Platform: ${platform}
        Character Limit: ${platformLimits[platform]}
        
        Requirements:
        - Write content that fits the platform's character limit
        - Include relevant hashtags
        - Use platform-appropriate language and formatting
        - Include a call-to-action
        - Make it shareable and engaging
      `;

      return await this.generateText({
        prompt: socialPrompt,
        contentType: 'social-media',
        tone,
        maxLength: platformLimits[platform]
      });

    } catch (error) {
      this.logger.error('Failed to generate social media content', error);
      throw error;
    }
  }

  /**
   * Build text generation prompt
   */
  private buildTextPrompt(request: AITextGenerationRequest): string {
    let prompt = request.prompt;

    // Add context
    if (request.context) {
      prompt += `\n\nContext: ${JSON.stringify(request.context)}`;
    }

    // Add length requirement
    if (request.length) {
      const lengthMap = {
        'short': '50-150 words',
        'medium': '200-500 words',
        'long': '800-1500 words'
      };
      prompt += `\n\nLength: ${lengthMap[request.length]}`;
    }

    // Add tone requirement
    if (request.tone) {
      prompt += `\n\nTone: ${request.tone}`;
    }

    // Add target audience
    if (request.targetAudience) {
      prompt += `\n\nTarget Audience: ${request.targetAudience}`;
    }

    // Add keywords
    if (request.keywords && request.keywords.length > 0) {
      prompt += `\n\nKeywords to include: ${request.keywords.join(', ')}`;
    }

    return prompt;
  }

  /**
   * Get max tokens based on content length
   */
  private getMaxTokens(length?: string): number {
    const tokenMap = {
      'short': 200,
      'medium': 800,
      'long': 2000
    };
    return tokenMap[length || 'medium'];
  }

  /**
   * Analyze generated text
   */
  private async analyzeText(text: string, request: AITextGenerationRequest): Promise<any> {
    try {
      const analysisPrompt = `
        Analyze the following text and provide metadata:
        
        Text: "${text.substring(0, 1000)}"
        
        Provide analysis in JSON format with:
        - tone: primary tone of the text
        - readingLevel: estimated reading level
        - sentiment: overall sentiment (positive/negative/neutral)
        - keywords: top 5 keywords found
        - wordCount: approximate word count
        - characterCount: character count
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: analysisPrompt }],
        max_tokens: 200,
        temperature: 0.3,
      });

      const analysisText = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(analysisText);

    } catch (error) {
      this.logger.warn('Failed to analyze text', error);
      return {
        tone: request.tone || 'neutral',
        readingLevel: 'intermediate',
        sentiment: 'neutral',
        keywords: request.keywords || [],
        wordCount: text.split(' ').length,
        characterCount: text.length
      };
    }
  }

  /**
   * Enhance image generation prompt
   */
  private enhanceImagePrompt(request: AIImageGenerationRequest): string {
    let prompt = request.prompt;

    // Add style enhancements
    if (request.style) {
      const styleEnhancements = {
        'photorealistic': 'highly detailed, professional photography, sharp focus, high resolution',
        'illustration': 'digital illustration, artistic, creative, colorful',
        'abstract': 'abstract art, modern, geometric, creative',
        'cartoon': 'cartoon style, colorful, fun, animated',
        'minimalist': 'minimalist design, clean, simple, modern'
      };
      prompt += `, ${styleEnhancements[request.style]}`;
    }

    // Add color scheme
    if (request.colorScheme && request.colorScheme.length > 0) {
      prompt += `, color scheme: ${request.colorScheme.join(', ')}`;
    }

    // Add mood
    if (request.mood) {
      prompt += `, mood: ${request.mood}`;
    }

    return prompt;
  }

  /**
   * Get image size
   */
  private getImageSize(size?: string): "1024x1024" | "1792x1024" | "1024x1792" {
    const sizeMap = {
      'small': '1024x1024',
      'medium': '1024x1024',
      'large': '1792x1024',
      'square': '1024x1024',
      'landscape': '1792x1024',
      'portrait': '1024x1792'
    };
    return sizeMap[size || 'medium'] as "1024x1024" | "1792x1024" | "1024x1792";
  }

  /**
   * Generate alt text for image
   */
  private async generateAltText(prompt: string): Promise<string> {
    try {
      const altPrompt = `Generate a concise, descriptive alt text for an image created with this prompt: "${prompt}". Keep it under 125 characters.`;
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: altPrompt }],
        max_tokens: 50,
        temperature: 0.3,
      });

      return completion.choices[0]?.message?.content || 'Generated image';

    } catch (error) {
      this.logger.warn('Failed to generate alt text', error);
      return 'Generated image';
    }
  }

  /**
   * Extract colors from prompt
   */
  private extractColorsFromPrompt(prompt: string): string[] {
    const colorKeywords = [
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white',
      'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy', 'maroon', 'olive', 'teal', 'silver',
      'gold', 'beige', 'cream', 'tan', 'turquoise', 'violet', 'indigo', 'crimson', 'coral'
    ];
    
    return colorKeywords.filter(color => 
      prompt.toLowerCase().includes(color)
    );
  }

  /**
   * Get image dimensions
   */
  private getImageDimensions(size?: string): { width: number; height: number } {
    const dimensions = {
      '1024x1024': { width: 1024, height: 1024 },
      '1792x1024': { width: 1792, height: 1024 },
      '1024x1792': { width: 1024, height: 1792 }
    };
    return dimensions[this.getImageSize(size)];
  }

  /**
   * Analyze user profile
   */
  private analyzeUserProfile(userProfile: any): any {
    return {
      demographics: userProfile.demographics || {},
      preferences: userProfile.preferences || {},
      interests: userProfile.interests || {},
      behavior: userProfile.behavior || {},
      segments: userProfile.segments || []
    };
  }

  /**
   * Analyze context
   */
  private analyzeContext(context: any): any {
    return {
      timeOfDay: context.timeOfDay,
      dayOfWeek: context.dayOfWeek,
      season: context.season,
      device: context.device,
      location: context.location,
      referrer: context.referrer,
      campaign: context.campaign,
      custom: context.custom || {}
    };
  }

  /**
   * Build recommendation prompt
   */
  private buildRecommendationPrompt(userAnalysis: any, contextAnalysis: any, request: ContentRecommendationRequest): string {
    return `
      Generate personalized content recommendations based on:
      
      User Profile:
      - Demographics: ${JSON.stringify(userAnalysis.demographics)}
      - Interests: ${JSON.stringify(userAnalysis.interests)}
      - Preferences: ${JSON.stringify(userAnalysis.preferences)}
      - Behavior: ${JSON.stringify(userAnalysis.behavior)}
      - Segments: ${userAnalysis.segments.join(', ')}
      
      Context:
      - Time: ${contextAnalysis.timeOfDay}
      - Device: ${JSON.stringify(contextAnalysis.device)}
      - Location: ${JSON.stringify(contextAnalysis.location)}
      - Campaign: ${contextAnalysis.campaign}
      
      Request:
      - Content Type: ${request.contentType || 'any'}
      - Limit: ${request.limit || 10}
      - Exclude: ${request.excludeIds?.join(', ') || 'none'}
      
      Provide recommendations in JSON format with:
      - contentId: unique identifier
      - title: content title
      - description: brief description
      - relevanceScore: 0-1 score
      - reason: why this content is recommended
    `;
  }

  /**
   * Parse recommendations from AI response
   */
  private parseRecommendations(response: string): any[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: parse as plain text recommendations
      return this.parsePlainTextRecommendations(response);
    } catch (error) {
      this.logger.warn('Failed to parse recommendations', error);
      return [];
    }
  }

  /**
   * Parse plain text recommendations
   */
  private parsePlainTextRecommendations(response: string): any[] {
    // Simple parsing logic - can be improved
    const lines = response.split('\n').filter(line => line.trim());
    const recommendations = [];
    
    for (let i = 0; i < lines.length; i += 3) {
      if (lines[i] && lines[i + 1] && lines[i + 2]) {
        recommendations.push({
          contentId: `rec_${i}`,
          title: lines[i].replace(/^\d+\.\s*/, ''),
          description: lines[i + 1],
          relevanceScore: 0.7,
          reason: lines[i + 2]
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Generate reasoning for recommendations
   */
  private generateReasoning(userAnalysis: any, contextAnalysis: any): string[] {
    const reasons = [];
    
    if (userAnalysis.interests.categories?.length > 0) {
      reasons.push(`Based on your interest in ${userAnalysis.interests.categories[0]}`);
    }
    
    if (userAnalysis.behavior.engagementLevel) {
      reasons.push(`Tailored for your ${userAnalysis.behavior.engagementLevel} engagement level`);
    }
    
    if (contextAnalysis.timeOfDay) {
      reasons.push(`Optimized for ${contextAnalysis.timeOfDay} viewing`);
    }
    
    return reasons;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(userAnalysis: any, contextAnalysis: any): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on available data
    if (userAnalysis.interests.categories?.length > 0) confidence += 0.1;
    if (userAnalysis.behavior.engagementLevel) confidence += 0.1;
    if (contextAnalysis.timeOfDay) confidence += 0.05;
    if (contextAnalysis.device) confidence += 0.05;
    if (userAnalysis.segments?.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Calculate diversity score
   */
  private calculateDiversityScore(recommendations: any[]): number {
    if (recommendations.length === 0) return 0;
    
    const categories = new Set(recommendations.map(r => r.category).filter(Boolean));
    const contentTypes = new Set(recommendations.map(r => r.contentType).filter(Boolean));
    
    const categoryDiversity = categories.size / Math.max(recommendations.length, 1);
    const typeDiversity = contentTypes.size / Math.max(recommendations.length, 1);
    
    return (categoryDiversity + typeDiversity) / 2;
  }

  /**
   * Calculate freshness score
   */
  private calculateFreshnessScore(recommendations: any[]): number {
    if (recommendations.length === 0) return 0;
    
    const now = new Date();
    const ages = recommendations.map(r => {
      if (r.createdAt) {
        return (now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24); // Days
      }
      return 30; // Default to 30 days if no date
    });
    
    const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    
    // Score based on average age (newer = higher score)
    return Math.max(0, 1 - (avgAge / 30)); // Normalize to 30 days
  }

  /**
   * Calculate popularity score
   */
  private calculatePopularityScore(recommendations: any[]): number {
    if (recommendations.length === 0) return 0;
    
    const popularityScores = recommendations.map(r => r.popularityScore || 0.5);
    const avgPopularity = popularityScores.reduce((sum, score) => sum + score, 0) / popularityScores.length;
    
    return avgPopularity;
  }
}