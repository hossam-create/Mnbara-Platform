import { CrafterCMSClient } from './CrafterCMSClient';
import { Logger } from '@mnbara/shared-utils';
import { UserProfile, PersonalizationRule, PersonalizedContent, PersonalizationContext } from '../types/Personalization.types';
import { CacheService } from '../services/CacheService';

/**
 * Personalization Engine - Handles content personalization based on user profiles and rules
 */
export class PersonalizationEngine {
  private crafterClient: CrafterCMSClient;
  private cacheService: CacheService;
  private logger: Logger;
  private rules: Map<string, PersonalizationRule[]>;

  constructor(crafterClient: CrafterCMSClient, cacheService: CacheService) {
    this.crafterClient = crafterClient;
    this.cacheService = cacheService;
    this.logger = new Logger('PersonalizationEngine');
    this.rules = new Map();
    
    // Load default personalization rules
    this.loadDefaultRules();
  }

  /**
   * Personalize content for a specific user
   */
  async personalizeContent(
    siteId: string, 
    contentId: string, 
    userProfile: UserProfile,
    context: PersonalizationContext = {}
  ): Promise<PersonalizedContent> {
    const cacheKey = `personalized:${siteId}:${contentId}:${userProfile.id}:${this.getProfileHash(userProfile)}`;

    try {
      // Check cache
      const cachedContent = await this.cacheService.get<PersonalizedContent>(cacheKey);
      if (cachedContent) {
        this.logger.debug(`Cache hit for personalized content: ${contentId} for user: ${userProfile.id}`);
        return cachedContent;
      }

      // Get base content
      const baseContent = await this.crafterClient.getContentByPath(siteId, contentId);
      if (!baseContent) {
        throw new Error(`Content not found: ${contentId}`);
      }

      // Apply personalization rules
      const personalizedContent = await this.applyPersonalizationRules(baseContent, userProfile, context);

      // Cache result
      await this.cacheService.set(cacheKey, personalizedContent, 300); // 5 minutes cache

      return personalizedContent;
    } catch (error) {
      this.logger.error(`Failed to personalize content: ${contentId} for user: ${userProfile.id}`, error);
      throw error;
    }
  }

  /**
   * Get personalized content recommendations
   */
  async getPersonalizedRecommendations(
    siteId: string, 
    userProfile: UserProfile, 
    options: {
      limit?: number;
      contentTypes?: string[];
      excludeIds?: string[];
      context?: PersonalizationContext;
    } = {}
  ): Promise<PersonalizedContent[]> {
    const cacheKey = `recommendations:${siteId}:${userProfile.id}:${this.getProfileHash(userProfile)}:${JSON.stringify(options)}`;

    try {
      // Check cache
      const cachedRecommendations = await this.cacheService.get<PersonalizedContent[]>(cacheKey);
      if (cachedRecommendations) {
        this.logger.debug(`Cache hit for recommendations for user: ${userProfile.id}`);
        return cachedRecommendations;
      }

      // Get user preferences and behavior
      const userPreferences = this.extractUserPreferences(userProfile);
      const userBehavior = await this.getUserBehavior(siteId, userProfile.id);

      // Build recommendation query
      const recommendationQuery = this.buildRecommendationQuery(userPreferences, userBehavior, options);

      // Search for relevant content
      const searchResults = await this.crafterClient.searchContent(recommendationQuery);

      // Personalize each result
      const personalizedResults = await Promise.all(
        searchResults.items.map(async (content) => {
          return await this.personalizeContent(siteId, content.path, userProfile, options.context);
        })
      );

      // Filter and rank results
      const rankedResults = this.rankRecommendations(personalizedResults, userProfile, userBehavior);

      // Apply limit
      const finalResults = rankedResults.slice(0, options.limit || 10);

      // Cache result
      await this.cacheService.set(cacheKey, finalResults, 600); // 10 minutes cache

      return finalResults;
    } catch (error) {
      this.logger.error(`Failed to get personalized recommendations for user: ${userProfile.id}`, error);
      throw error;
    }
  }

  /**
   * Create personalization rule
   */
  async createPersonalizationRule(siteId: string, rule: PersonalizationRule): Promise<string> {
    try {
      const ruleId = this.generateRuleId();
      rule.id = ruleId;
      rule.createdAt = new Date();
      rule.updatedAt = new Date();

      if (!this.rules.has(siteId)) {
        this.rules.set(siteId, []);
      }

      this.rules.get(siteId)!.push(rule);

      this.logger.info(`Created personalization rule: ${ruleId} for site: ${siteId}`);
      return ruleId;
    } catch (error) {
      this.logger.error(`Failed to create personalization rule`, error);
      throw error;
    }
  }

  /**
   * Update personalization rule
   */
  async updatePersonalizationRule(siteId: string, ruleId: string, updates: Partial<PersonalizationRule>): Promise<void> {
    try {
      const siteRules = this.rules.get(siteId);
      if (!siteRules) {
        throw new Error(`No rules found for site: ${siteId}`);
      }

      const ruleIndex = siteRules.findIndex(r => r.id === ruleId);
      if (ruleIndex === -1) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      siteRules[ruleIndex] = {
        ...siteRules[ruleIndex],
        ...updates,
        updatedAt: new Date()
      };

      // Clear cache for affected users
      await this.clearPersonalizationCache(siteId);

      this.logger.info(`Updated personalization rule: ${ruleId} for site: ${siteId}`);
    } catch (error) {
      this.logger.error(`Failed to update personalization rule: ${ruleId}`, error);
      throw error;
    }
  }

  /**
   * Delete personalization rule
   */
  async deletePersonalizationRule(siteId: string, ruleId: string): Promise<void> {
    try {
      const siteRules = this.rules.get(siteId);
      if (!siteRules) {
        throw new Error(`No rules found for site: ${siteId}`);
      }

      const ruleIndex = siteRules.findIndex(r => r.id === ruleId);
      if (ruleIndex === -1) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      siteRules.splice(ruleIndex, 1);

      // Clear cache for affected users
      await this.clearPersonalizationCache(siteId);

      this.logger.info(`Deleted personalization rule: ${ruleId} from site: ${siteId}`);
    } catch (error) {
      this.logger.error(`Failed to delete personalization rule: ${ruleId}`, error);
      throw error;
    }

  /**
   * Get personalization rules for a site
   */
  async getPersonalizationRules(siteId: string): Promise<PersonalizationRule[]> {
    return this.rules.get(siteId) || [];
  }

  /**
   * Test personalization rule
   */
  async testPersonalizationRule(
    siteId: string, 
    ruleId: string, 
    userProfile: UserProfile
  ): Promise<boolean> {
    try {
      const siteRules = this.rules.get(siteId);
      if (!siteRules) {
        return false;
      }

      const rule = siteRules.find(r => r.id === ruleId);
      if (!rule) {
        return false;
      }

      return this.evaluateRule(rule, userProfile);
    } catch (error) {
      this.logger.error(`Failed to test personalization rule: ${ruleId}`, error);
      return false;
    }
  }

  /**
   * Apply personalization rules to content
   */
  private async applyPersonalizationRules(
    content: any, 
    userProfile: UserProfile, 
    context: PersonalizationContext
  ): Promise<PersonalizedContent> {
    const siteId = content.siteId || 'default';
    const rules = this.rules.get(siteId) || [];

    let personalizedContent: PersonalizedContent = {
      ...content,
      personalization: {
        applied: false,
        rules: [],
        modifications: {},
        userSegments: []
      }
    };

    // Evaluate each rule
    for (const rule of rules) {
      if (this.evaluateRule(rule, userProfile, context)) {
        personalizedContent = this.applyRuleModifications(personalizedContent, rule);
        personalizedContent.personalization.applied = true;
        personalizedContent.personalization.rules.push(rule.id);
        personalizedContent.personalization.userSegments.push(...rule.segments);
      }
    }

    // Apply dynamic content variations
    personalizedContent = await this.applyDynamicVariations(personalizedContent, userProfile, context);

    return personalizedContent;
  }

  /**
   * Evaluate personalization rule
   */
  private evaluateRule(
    rule: PersonalizationRule, 
    userProfile: UserProfile, 
    context: PersonalizationContext = {}
  ): boolean {
    try {
      // Check if rule is active
      if (!rule.enabled) {
        return false;
      }

      // Check time-based conditions
      if (rule.schedule) {
        const now = new Date();
        if (rule.schedule.startDate && now < new Date(rule.schedule.startDate)) {
          return false;
        }
        if (rule.schedule.endDate && now > new Date(rule.schedule.endDate)) {
          return false;
        }
      }

      // Evaluate conditions
      return this.evaluateConditions(rule.conditions, userProfile, context);
    } catch (error) {
      this.logger.error(`Failed to evaluate rule: ${rule.id}`, error);
      return false;
    }
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateConditions(
    conditions: any[], 
    userProfile: UserProfile, 
    context: PersonalizationContext
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    // Simple AND logic for now - can be extended to support OR, NOT, etc.
    return conditions.every(condition => {
      return this.evaluateCondition(condition, userProfile, context);
    });
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    condition: any, 
    userProfile: UserProfile, 
    context: PersonalizationContext
  ): boolean {
    const { field, operator, value } = condition;

    switch (field) {
      case 'user.segment':
        return this.evaluateSegmentCondition(userProfile, operator, value);
      
      case 'user.location':
        return this.evaluateLocationCondition(userProfile, operator, value);
      
      case 'user.device':
        return this.evaluateDeviceCondition(userProfile, operator, value);
      
      case 'user.behavior':
        return this.evaluateBehaviorCondition(userProfile, operator, value);
      
      case 'context.time':
        return this.evaluateTimeCondition(context, operator, value);
      
      case 'context.referrer':
        return this.evaluateReferrerCondition(context, operator, value);
      
      default:
        return false;
    }
  }

  /**
   * Apply rule modifications to content
   */
  private applyRuleModifications(content: PersonalizedContent, rule: PersonalizationRule): PersonalizedContent {
    if (!rule.modifications) {
      return content;
    }

    const modifiedContent = { ...content };

    // Apply field modifications
    if (rule.modifications.fields) {
      for (const [field, value] of Object.entries(rule.modifications.fields)) {
        this.setNestedProperty(modifiedContent, field, value);
      }
    }

    // Apply content variations
    if (rule.modifications.content) {
      for (const [key, variation] of Object.entries(rule.modifications.content)) {
        if (modifiedContent.content && modifiedContent.content[key]) {
          modifiedContent.content[key] = variation;
        }
      }
    }

    // Apply layout modifications
    if (rule.modifications.layout) {
      modifiedContent.layout = {
        ...modifiedContent.layout,
        ...rule.modifications.layout
      };
    }

    return modifiedContent;
  }

  /**
   * Extract user preferences from profile
   */
  private extractUserPreferences(userProfile: UserProfile): Record<string, any> {
    const preferences: Record<string, any> = {};

    // Extract preferences from profile
    if (userProfile.preferences) {
      Object.assign(preferences, userProfile.preferences);
    }

    // Extract from demographics
    if (userProfile.demographics) {
      preferences.ageGroup = this.getAgeGroup(userProfile.demographics.age);
      preferences.language = userProfile.demographics.language;
      preferences.location = userProfile.demographics.location;
    }

    // Extract from interests
    if (userProfile.interests) {
      preferences.categories = userProfile.interests.categories;
      preferences.tags = userProfile.interests.tags;
    }

    return preferences;
  }

  /**
   * Get user behavior data
   */
  private async getUserBehavior(siteId: string, userId: string): Promise<any> {
    // This would typically come from analytics or user tracking service
    // For now, return mock data
    return {
      viewedContent: [],
      clickedContent: [],
      purchasedContent: [],
      searchHistory: [],
      sessionData: {
        duration: 0,
        pageViews: 0,
        bounceRate: 0
      }
    };
  }

  /**
   * Build recommendation query
   */
  private buildRecommendationQuery(
    preferences: Record<string, any>, 
    behavior: any, 
    options: any
  ): any {
    const query: any = {
      query: '',
      filters: {},
      sort: [{ field: 'lastModifiedOn', order: 'desc' }],
      limit: options.limit || 10,
      offset: 0
    };

    // Build query based on preferences
    if (preferences.categories && preferences.categories.length > 0) {
      query.filters.category = preferences.categories;
    }

    if (preferences.tags && preferences.tags.length > 0) {
      query.filters.tags = preferences.tags;
    }

    if (preferences.language) {
      query.filters.locale = preferences.language;
    }

    return query;
  }

  /**
   * Rank recommendations
   */
  private rankRecommendations(
    recommendations: PersonalizedContent[], 
    userProfile: UserProfile, 
    behavior: any
  ): PersonalizedContent[] {
    // Simple ranking based on relevance score
    return recommendations.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, userProfile, behavior);
      const scoreB = this.calculateRelevanceScore(b, userProfile, behavior);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(
    content: PersonalizedContent, 
    userProfile: UserProfile, 
    behavior: any
  ): number {
    let score = 0;

    // Base score from personalization
    if (content.personalization.applied) {
      score += 10;
    }

    // Category matching
    if (userProfile.interests?.categories) {
      // Implementation would depend on content structure
      score += 5;
    }

    return score;
  }

  /**
   * Apply dynamic content variations
   */
  private async applyDynamicVariations(
    content: PersonalizedContent, 
    userProfile: UserProfile, 
    context: PersonalizationContext
  ): Promise<PersonalizedContent> {
    // Apply time-based variations
    if (context.timeOfDay) {
      content = this.applyTimeBasedVariations(content, context.timeOfDay);
    }

    // Apply location-based variations
    if (userProfile.demographics?.location) {
      content = this.applyLocationBasedVariations(content, userProfile.demographics.location);
    }

    return content;
  }

  /**
   * Load default personalization rules
   */
  private loadDefaultRules(): void {
    // Example default rules
    const defaultRules: PersonalizationRule[] = [
      {
        id: 'new-user-welcome',
        name: 'New User Welcome',
        description: 'Show welcome content to new users',
        enabled: true,
        priority: 100,
        segments: ['new-users'],
        conditions: [
          {
            field: 'user.behavior',
            operator: 'equals',
            value: 'new-user'
          }
        ],
        modifications: {
          content: {
            welcomeMessage: 'Welcome to our platform!',
            showTutorial: true
          }
        },
        schedule: {
          startDate: new Date(),
          endDate: null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'returning-user',
        name: 'Returning User',
        description: 'Personalized content for returning users',
        enabled: true,
        priority: 90,
        segments: ['returning-users'],
        conditions: [
          {
            field: 'user.behavior',
            operator: 'equals',
            value: 'returning-user'
          }
        ],
        modifications: {
          content: {
            showRecentActivity: true,
            personalizedGreeting: 'Welcome back!'
          }
        },
        schedule: {
          startDate: new Date(),
          endDate: null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.rules.set('default', defaultRules);
  }

  /**
   * Utility methods for condition evaluation
   */
  private evaluateSegmentCondition(userProfile: UserProfile, operator: string, value: string): boolean {
    // Implementation would depend on segment structure
    return true;
  }

  private evaluateLocationCondition(userProfile: UserProfile, operator: string, value: string): boolean {
    if (!userProfile.demographics?.location) {
      return false;
    }
    // Simple string matching for now
    return operator === 'equals' && userProfile.demographics.location === value;
  }

  private evaluateDeviceCondition(userProfile: UserProfile, operator: string, value: string): boolean {
    if (!userProfile.device) {
      return false;
    }
    return operator === 'equals' && userProfile.device.type === value;
  }

  private evaluateBehaviorCondition(userProfile: UserProfile, operator: string, value: string): boolean {
    // Implementation would depend on behavior tracking
    return operator === 'equals' && userProfile.behavior === value;
  }

  private evaluateTimeCondition(context: PersonalizationContext, operator: string, value: string): boolean {
    if (!context.timeOfDay) {
      return false;
    }
    return operator === 'equals' && context.timeOfDay === value;
  }

  private evaluateReferrerCondition(context: PersonalizationContext, operator: string, value: string): boolean {
    if (!context.referrer) {
      return false;
    }
    return operator === 'contains' && context.referrer.includes(value);
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return 'under-18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65-plus';
  }

  private generateRuleId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getProfileHash(userProfile: UserProfile): string {
    // Simple hash based on key profile attributes
    const keyAttrs = [
      userProfile.id,
      userProfile.demographics?.age,
      userProfile.demographics?.location,
      userProfile.device?.type
    ].join(':');
    
    return Buffer.from(keyAttrs).toString('base64').slice(0, 8);
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private applyTimeBasedVariations(content: PersonalizedContent, timeOfDay: string): PersonalizedContent {
    // Apply time-based content variations
    return content;
  }

  private applyLocationBasedVariations(content: PersonalizedContent, location: string): PersonalizedContent {
    // Apply location-based content variations
    return content;
  }

  private async clearPersonalizationCache(siteId: string): Promise<void> {
    const cachePattern = `personalized:${siteId}:*`;
    await this.cacheService.deletePattern(cachePattern);
    
    const recommendationsPattern = `recommendations:${siteId}:*`;
    await this.cacheService.deletePattern(recommendationsPattern);
    
    this.logger.info(`Cleared personalization cache for site: ${siteId}`);
  }
}