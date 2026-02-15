import { EventBus } from '@mnbara/event-bus';
import { Logger } from '@mnbara/shared-utils';
import { CacheService } from './CacheService';

/**
 * A/B Testing Service
 * Manages A/B tests, experiments, and statistical analysis
 */
export class ABTestingService {
  private eventBus: EventBus;
  private cacheService: CacheService;
  private logger: Logger;
  private activeTests: Map<string, ABTest>;

  constructor(eventBus: EventBus, cacheService: CacheService) {
    this.eventBus = eventBus;
    this.cacheService = cacheService;
    this.logger = new Logger('ABTestingService');
    this.activeTests = new Map();
  }

  /**
   * Create a new A/B test
   */
  async createTest(test: ABTest): Promise<string> {
    try {
      const testId = this.generateTestId();
      test.id = testId;
      test.createdAt = new Date();
      test.updatedAt = new Date();
      test.status = 'draft';
      
      // Validate test configuration
      this.validateTestConfiguration(test);

      // Store test
      await this.storeTest(test);
      
      this.logger.info(`Created A/B test: ${testId}`);
      return testId;
    } catch (error) {
      this.logger.error('Failed to create A/B test', error);
      throw error;
    }
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error(`Test not found: ${testId}`);
      }

      if (test.status !== 'draft') {
        throw new Error(`Test cannot be started. Current status: ${test.status}`);
      }

      // Update test status
      test.status = 'running';
      test.startedAt = new Date();
      test.updatedAt = new Date();

      await this.storeTest(test);
      
      // Add to active tests
      this.activeTests.set(testId, test);

      // Publish test started event
      await this.eventBus.publish({
        type: 'abtest.started',
        source: 'ab-testing-service',
        data: {
          testId,
          name: test.name,
          variants: test.variants.length,
          timestamp: new Date().toISOString()
        }
      });

      this.logger.info(`Started A/B test: ${testId}`);
    } catch (error) {
      this.logger.error(`Failed to start A/B test: ${testId}`, error);
      throw error;
    }
  }

  /**
   * Stop an A/B test
   */
  async stopTest(testId: string): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error(`Test not found: ${testId}`);
      }

      if (test.status !== 'running') {
        throw new Error(`Test cannot be stopped. Current status: ${test.status}`);
      }

      // Update test status
      test.status = 'stopped';
      test.endedAt = new Date();
      test.updatedAt = new Date();

      await this.storeTest(test);
      
      // Remove from active tests
      this.activeTests.delete(testId);

      // Calculate final results
      const results = await this.calculateTestResults(testId);
      
      // Publish test stopped event
      await this.eventBus.publish({
        type: 'abtest.stopped',
        source: 'ab-testing-service',
        data: {
          testId,
          name: test.name,
          results,
          timestamp: new Date().toISOString()
        }
      });

      this.logger.info(`Stopped A/B test: ${testId}`);
    } catch (error) {
      this.logger.error(`Failed to stop A/B test: ${testId}`, error);
      throw error;
    }
  }

  /**
   * Assign variant to user
   */
  async assignVariant(testId: string, userId: string): Promise<string> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Active test not found: ${testId}`);
      }

      // Check if user is eligible
      if (!this.isUserEligible(test, userId)) {
        throw new Error(`User not eligible for test: ${testId}`);
      }

      // Check if user already has assignment
      const cacheKey = `abtest:${testId}:${userId}`;
      let assignedVariant = await this.cacheService.get<string>(cacheKey);

      if (assignedVariant) {
        return assignedVariant;
      }

      // Assign variant based on distribution
      assignedVariant = this.selectVariant(test);

      // Store assignment
      await this.cacheService.set(cacheKey, assignedVariant, 86400); // 24 hours

      // Track assignment
      await this.trackAssignment(testId, userId, assignedVariant);

      this.logger.debug(`Assigned variant ${assignedVariant} to user ${userId} for test ${testId}`);
      return assignedVariant;
    } catch (error) {
      this.logger.error(`Failed to assign variant for test: ${testId}`, error);
      throw error;
    }
  }

  /**
   * Track conversion event
   */
  async trackConversion(testId: string, userId: string, event: string, value?: number): Promise<void> {
    try {
      // Get user's assigned variant
      const cacheKey = `abtest:${testId}:${userId}`;
      const variant = await this.cacheService.get<string>(cacheKey);

      if (!variant) {
        this.logger.warn(`No variant assignment found for user ${userId} in test ${testId}`);
        return;
      }

      // Track conversion
      await this.recordConversion(testId, userId, variant, event, value);

      // Publish conversion event
      await this.eventBus.publish({
        type: 'abtest.conversion',
        source: 'ab-testing-service',
        data: {
          testId,
          userId,
          variant,
          event,
          value,
          timestamp: new Date().toISOString()
        }
      });

      this.logger.debug(`Tracked conversion for user ${userId} in test ${testId}, variant ${variant}`);
    } catch (error) {
      this.logger.error(`Failed to track conversion for test: ${testId}`, error);
      throw error;
    }
  }

  /**
   * Get test results
   */
  async getTestResults(testId: string): Promise<ABTestResults> {
    try {
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error(`Test not found: ${testId}`);
      }

      return await this.calculateTestResults(testId);
    } catch (error) {
      this.logger.error(`Failed to get test results: ${testId}`, error);
      throw error;
    }
  }

  /**
   * Get active tests for user
   */
  async getActiveTestsForUser(userId: string, contentId?: string): Promise<ABTest[]> {
    try {
      const eligibleTests: ABTest[] = [];

      for (const test of this.activeTests.values()) {
        if (this.isUserEligible(test, userId)) {
          if (!contentId || this.isContentRelevant(test, contentId)) {
            eligibleTests.push(test);
          }
        }
      }

      return eligibleTests;
    } catch (error) {
      this.logger.error(`Failed to get active tests for user: ${userId}`, error);
      throw error;
    }
  }

  /**
   * Calculate test results
   */
  private async calculateTestResults(testId: string): Promise<ABTestResults> {
    try {
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error(`Test not found: ${testId}`);
      }

      // Get conversion data
      const conversionData = await this.getConversionData(testId);
      
      // Calculate statistics for each variant
      const variantResults: VariantResult[] = [];
      
      for (const variant of test.variants) {
        const assignments = conversionData.assignments[variant.id] || 0;
        const conversions = conversionData.conversions[variant.id] || 0;
        const conversionRate = assignments > 0 ? conversions / assignments : 0;
        
        variantResults.push({
          variantId: variant.id,
          name: variant.name,
          assignments,
          conversions,
          conversionRate,
          confidenceInterval: this.calculateConfidenceInterval(conversions, assignments),
          statisticalSignificance: this.calculateStatisticalSignificance(
            conversions, 
            assignments, 
            conversionData.totalConversions, 
            conversionData.totalAssignments
          )
        });
      }

      // Determine winner
      const winner = this.determineWinner(variantResults);

      return {
        testId,
        testName: test.name,
        status: test.status,
        totalAssignments: conversionData.totalAssignments,
        totalConversions: conversionData.totalConversions,
        overallConversionRate: conversionData.totalAssignments > 0 
          ? conversionData.totalConversions / conversionData.totalAssignments 
          : 0,
        variantResults,
        winner,
        confidenceLevel: 0.95,
        calculatedAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to calculate test results: ${testId}`, error);
      throw error;
    }
  }

  /**
   * Select variant based on distribution
   */
  private selectVariant(test: ABTest): string {
    const random = Math.random();
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.distribution;
      if (random <= cumulative) {
        return variant.id;
      }
    }

    // Fallback to last variant
    return test.variants[test.variants.length - 1].id;
  }

  /**
   * Check if user is eligible for test
   */
  private isUserEligible(test: ABTest, userId: string): boolean {
    // Check targeting criteria
    if (test.targeting) {
      // Geographic targeting
      if (test.targeting.geographic && !this.checkGeographicTargeting(test.targeting.geographic, userId)) {
        return false;
      }

      // Demographic targeting
      if (test.targeting.demographic && !this.checkDemographicTargeting(test.targeting.demographic, userId)) {
        return false;
      }

      // Behavioral targeting
      if (test.targeting.behavioral && !this.checkBehavioralTargeting(test.targeting.behavioral, userId)) {
        return false;
      }

      // Device targeting
      if (test.targeting.device && !this.checkDeviceTargeting(test.targeting.device, userId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if content is relevant to test
   */
  private isContentRelevant(test: ABTest, contentId: string): boolean {
    if (!test.contentIds || test.contentIds.length === 0) {
      return true; // Test applies to all content
    }

    return test.contentIds.includes(contentId);
  }

  /**
   * Check geographic targeting
   */
  private checkGeographicTargeting(geographic: any, userId: string): boolean {
    // Implementation would check user's geographic location
    return true;
  }

  /**
   * Check demographic targeting
   */
  private checkDemographicTargeting(demographic: any, userId: string): boolean {
    // Implementation would check user's demographic data
    return true;
  }

  /**
   * Check behavioral targeting
   */
  private checkBehavioralTargeting(behavioral: any, userId: string): boolean {
    // Implementation would check user's behavioral data
    return true;
  }

  /**
   * Check device targeting
   */
  private checkDeviceTargeting(device: any, userId: string): boolean {
    // Implementation would check user's device information
    return true;
  }

  /**
   * Validate test configuration
   */
  private validateTestConfiguration(test: ABTest): void {
    if (!test.name || test.name.trim().length === 0) {
      throw new Error('Test name is required');
    }

    if (!test.variants || test.variants.length < 2) {
      throw new Error('At least 2 variants are required');
    }

    // Check distribution sums to 1
    const totalDistribution = test.variants.reduce((sum, variant) => sum + variant.distribution, 0);
    if (Math.abs(totalDistribution - 1) > 0.001) {
      throw new Error('Variant distributions must sum to 1');
    }

    // Check variant IDs are unique
    const variantIds = test.variants.map(v => v.id);
    const uniqueIds = new Set(variantIds);
    if (variantIds.length !== uniqueIds.size) {
      throw new Error('Variant IDs must be unique');
    }
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(conversions: number, assignments: number): ConfidenceInterval {
    if (assignments === 0) {
      return { lower: 0, upper: 0 };
    }

    const rate = conversions / assignments;
    const z = 1.96; // 95% confidence level
    const margin = z * Math.sqrt((rate * (1 - rate)) / assignments);

    return {
      lower: Math.max(0, rate - margin),
      upper: Math.min(1, rate + margin)
    };
  }

  /**
   * Calculate statistical significance
   */
  private calculateStatisticalSignificance(
    conversions: number, 
    assignments: number, 
    totalConversions: number, 
    totalAssignments: number
  ): number {
    // Simplified chi-square test
    // In production, use proper statistical libraries
    
    if (assignments === 0 || totalAssignments === 0) {
      return 0;
    }

    const expectedRate = totalConversions / totalAssignments;
    const expectedConversions = assignments * expectedRate;
    
    if (expectedConversions === 0) {
      return 0;
    }

    // Chi-square statistic
    const chiSquare = Math.pow(conversions - expectedConversions, 2) / expectedConversions;
    
    // Convert to p-value (simplified)
    const pValue = Math.exp(-chiSquare / 2);
    
    return 1 - pValue; // Return significance level
  }

  /**
   * Determine winner
   */
  private determineWinner(variantResults: VariantResult[]): string | null {
    if (variantResults.length === 0) {
      return null;
    }

    // Find variant with highest conversion rate and statistical significance
    let winner = variantResults[0];
    
    for (const result of variantResults) {
      if (result.conversionRate > winner.conversionRate && 
          result.statisticalSignificance > 0.95) {
        winner = result;
      }
    }

    return winner.conversionRate > 0 && winner.statisticalSignificance > 0.95 
      ? winner.variantId 
      : null;
  }

  /**
   * Store test
   */
  private async storeTest(test: ABTest): Promise<void> {
    const cacheKey = `abtest:${test.id}`;
    await this.cacheService.set(cacheKey, test, 86400 * 30); // 30 days
  }

  /**
   * Get test
   */
  private async getTest(testId: string): Promise<ABTest | null> {
    const cacheKey = `abtest:${testId}`;
    return await this.cacheService.get<ABTest>(cacheKey);
  }

  /**
   * Track assignment
   */
  private async trackAssignment(testId: string, userId: string, variant: string): Promise<void> {
    const assignmentKey = `abtest_assignment:${testId}:${variant}:${new Date().toISOString().slice(0, 10)}`;
    await this.cacheService.incr(assignmentKey);
  }

  /**
   * Record conversion
   */
  private async recordConversion(testId: string, userId: string, variant: string, event: string, value?: number): Promise<void> {
    const conversionKey = `abtest_conversion:${testId}:${variant}:${event}:${new Date().toISOString().slice(0, 10)}`;
    await this.cacheService.incr(conversionKey);
    
    if (value) {
      const valueKey = `abtest_value:${testId}:${variant}:${event}:${new Date().toISOString().slice(0, 10)}`;
      await this.cacheService.incrby(valueKey, Math.round(value));
    }
  }

  /**
   * Get conversion data
   */
  private async getConversionData(testId: string): Promise<any> {
    // Implementation would aggregate conversion data from cache/database
    return {
      assignments: {},
      conversions: {},
      totalAssignments: 0,
      totalConversions: 0
    };
  }

  /**
   * Generate test ID
   */
  private generateTestId(): string {
    return `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Types
export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'stopped' | 'completed';
  variants: ABTestVariant[];
  targeting?: ABTestTargeting;
  contentIds?: string[];
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  createdBy: string;
  minimumSampleSize?: number;
  confidenceLevel?: number;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  distribution: number; // 0-1
  content?: any;
  metadata?: Record<string, any>;
}

export interface ABTestTargeting {
  geographic?: {
    countries?: string[];
    regions?: string[];
    cities?: string[];
    exclude?: boolean;
  };
  demographic?: {
    ageRange?: { min?: number; max?: number };
    gender?: string[];
    language?: string[];
  };
  behavioral?: {
    newUsers?: boolean;
    returningUsers?: boolean;
    engagementLevel?: 'low' | 'medium' | 'high'[];
    purchaseHistory?: boolean;
  };
  device?: {
    types?: ('desktop' | 'mobile' | 'tablet')[];
    os?: string[];
    browsers?: string[];
  };
}

export interface ABTestResults {
  testId: string;
  testName: string;
  status: string;
  totalAssignments: number;
  totalConversions: number;
  overallConversionRate: number;
  variantResults: VariantResult[];
  winner: string | null;
  confidenceLevel: number;
  calculatedAt: Date;
}

export interface VariantResult {
  variantId: string;
  name: string;
  assignments: number;
  conversions: number;
  conversionRate: number;
  confidenceInterval: ConfidenceInterval;
  statisticalSignificance: number;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
}