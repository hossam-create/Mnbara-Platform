// Dynamic Pricing Engine Service
// Smart pricing algorithms, supply/demand analysis, competitive price suggestions

import { PrismaClient } from '@prisma/client';
import * as simpleStatistics from 'simple-statistics';

const prisma = new PrismaClient();

// Types for pricing
type PricingAction = 
  | 'SET_FIXED' 
  | 'SET_PERCENTAGE' 
  | 'INCREASE_PERCENTAGE' 
  | 'DECREASE_PERCENTAGE' 
  | 'MATCH_LOWEST' 
  | 'BEAT_LOWEST' 
  | 'ADD_MARGIN' 
  | 'SET_PSYCHOLOGICAL';

type OptimizationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'CANCELLED' | 'EXPIRED';

interface PriceInput {
  productId: string;
  basePrice: number;
  costPrice?: number;
  categoryId?: string;
  brandId?: string;
  inventoryLevel?: number;
  targetMargin?: number;
}

interface DemandData {
  historicalSales: { date: Date; quantity: number; price: number }[];
  currentDemandScore: number;
  demandTrend: 'rising' | 'stable' | 'falling';
  demandVelocity: number;
}

interface CompetitionData {
  ourPrice: number;
  lowestCompetitor: number;
  highestCompetitor: number;
  avgMarketPrice: number;
  marketShare: number;
  competitorCount: number;
}

interface PriceScenario {
  price: number;
  expectedDemand: number;
  expectedRevenue: number;
  conversionRate: number;
  margin: number;
  competitiveness: number;
}

interface OptimizationResult {
  productId: string;
  currentPrice: number;
  recommendedPrice: number;
  expectedDemand: number;
  expectedRevenue: number;
  confidence: number;
  priceChange: number;
  priceChangePercent: number;
  reasoning: string;
  scenarios: PriceScenario[];
  factors: {
    demandFactor: number;
    competitionFactor: number;
    inventoryFactor: number;
    marginFactor: number;
    trendFactor: number;
  };
}

export class DynamicPricingService {
  // ==========================================
  // PRICE OPTIMIZATION
  // ==========================================

  /**
   * Main price optimization function
   */
  async optimizePrice(input: PriceInput): Promise<OptimizationResult> {
    const [demandData, competitionData, priceHistory, inventoryLevel] = await Promise.all([
      this.getDemandData(input.productId),
      this.getCompetitionData(input.productId, input.basePrice),
      this.getPriceHistory(input.productId),
      this.getInventoryData(input.productId),
    ]);

    // Calculate price elasticity from history
    const elasticity = this.calculatePriceElasticity(priceHistory);

    // Calculate optimal price scenarios
    const scenarios = this.generatePriceScenarios(
      input.basePrice,
      input.costPrice || 0,
      elasticity,
      demandData,
      competitionData,
      inventoryLevel
    );

    // Select best scenario
    const bestScenario = this.selectOptimalScenario(scenarios, input.targetMargin);

    // Calculate factors
    const factors = this.calculatePricingFactors(
      demandData,
      competitionData,
      inventoryLevel,
      input.costPrice || 0
    );

    // Generate reasoning
    const reasoning = this.generatePricingReasoning(bestScenario, factors);

    return {
      productId: input.productId,
      currentPrice: input.basePrice,
      recommendedPrice: bestScenario.price,
      expectedDemand: bestScenario.expectedDemand,
      expectedRevenue: bestScenario.expectedRevenue,
      confidence: this.calculateConfidence(priceHistory),
      priceChange: bestScenario.price - input.basePrice,
      priceChangePercent: ((bestScenario.price - input.basePrice) / input.basePrice) * 100,
      reasoning,
      scenarios: scenarios.slice(0, 5),
      factors,
    };
  }

  /**
   * Batch optimize prices for multiple products
   */
  async batchOptimizePrices(
    inputs: PriceInput[],
    options: { maxConcurrent?: number } = {}
  ): Promise<OptimizationResult[]> {
    const maxConcurrent = options.maxConcurrent || 10;
    const results: OptimizationResult[] = [];

    // Process in batches
    for (let i = 0; i < inputs.length; i += maxConcurrent) {
      const batch = inputs.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(input => this.optimizePrice(input))
      );
      results.push(...batchResults);
    }

    return results;
  }

  // ==========================================
  // DEMAND ANALYSIS
  // ==========================================

  private async getDemandData(productId: string): Promise<DemandData> {
    // Get historical sales data
    const salesHistory = await prisma.salesHistory?.findMany({
      where: { productId },
      orderBy: { date: 'desc' },
      take: 90,
    }) || [];

    // Calculate demand metrics
    const recentSales = salesHistory.slice(0, 30);
    const olderSales = salesHistory.slice(30, 60);

    const recentAvg = recentSales.length > 0
      ? simpleStatistics.mean(recentSales.map(s => s.quantity))
      : 0;
    const olderAvg = olderSales.length > 0
      ? simpleStatistics.mean(olderSales.map(s => s.quantity))
      : recentAvg;

    // Calculate demand trend
    let demandTrend: 'rising' | 'stable' | 'falling' = 'stable';
    if (recentAvg > olderAvg * 1.1) demandTrend = 'rising';
    else if (recentAvg < olderAvg * 0.9) demandTrend = 'falling';

    // Calculate demand velocity (sales per day)
    const demandVelocity = recentAvg / 30;

    // Calculate demand score (0-1)
    const demandScore = Math.min(1, recentAvg / 100);

    return {
      historicalSales: salesHistory.map(s => ({
        date: new Date(s.date),
        quantity: s.quantity,
        price: s.avgPrice,
      })),
      currentDemandScore: demandScore,
      demandTrend,
      demandVelocity,
    };
  }

  // ==========================================
  // COMPETITIVE ANALYSIS
  // ==========================================

  private async getCompetitionData(
    productId: string,
    ourPrice: number
  ): Promise<CompetitionData> {
    // Get price history for market data
    const priceHistory = await prisma.priceHistory?.findMany({
      where: { productId },
      orderBy: { recordedAt: 'desc' },
      take: 30,
    }) || [];

    // Calculate market averages
    const competitorPrices = priceHistory
      .filter(h => h.competitorPrice && h.competitorPrice > 0)
      .map(h => h.competitorPrice as number);

    const lowestCompetitor = competitorPrices.length > 0
      ? Math.min(...competitorPrices)
      : ourPrice * 0.95;

    const highestCompetitor = competitorPrices.length > 0
      ? Math.max(...competitorPrices)
      : ourPrice * 1.1;

    const avgMarketPrice = competitorPrices.length > 0
      ? simpleStatistics.mean(competitorPrices)
      : ourPrice;

    // Estimate market share (simplified)
    const marketShare = this.estimateMarketShare(ourPrice, avgMarketPrice, lowestCompetitor);

    // Count competitors
    const competitorCount = new Set(
      priceHistory.map(h => h.competitorSource).filter(Boolean)
    ).size;

    return {
      ourPrice,
      lowestCompetitor,
      highestCompetitor,
      avgMarketPrice,
      marketShare,
      competitorCount,
    };
  }

  private estimateMarketShare(
    ourPrice: number,
    avgMarketPrice: number,
    lowestCompetitor: number
  ): number {
    // Simplified market share estimation based on price positioning
    if (ourPrice <= lowestCompetitor) return 0.5; // Competitive
    
    const priceRatio = ourPrice / lowestCompetitor;
    
    if (priceRatio < 1.1) return 0.4;
    if (priceRatio < 1.2) return 0.3;
    if (priceRatio < 1.3) return 0.2;
    return 0.1;
  }

  // ==========================================
  // PRICE ELASTICITY
  // ==========================================

  private calculatePriceElasticity(
    priceHistory: any[]
  ): number {
    if (priceHistory.length < 14) {
      return -1.0; // Default elasticity (unit elastic)
    }

    // Group by price ranges
    const priceGroups = new Map<number, number[]>();
    
    priceHistory.forEach(h => {
      const priceKey = Math.round((h.sellingPrice || h.basePrice) / 5) * 5;
      if (!priceGroups.has(priceKey)) {
        priceGroups.set(priceKey, []);
      }
      priceGroups.get(priceKey)!.push(h.quantity || 1);
    });

    // Calculate average demand per price point
    const pricePoints: { price: number; demand: number }[] = [];
    priceGroups.forEach((demands, price) => {
      pricePoints.push({
        price,
        demand: simpleStatistics.mean(demands),
      });
    });

    if (pricePoints.length < 2) {
      return -1.0;
    }

    // Sort by price
    pricePoints.sort((a, b) => a.price - b.price);

    // Calculate elasticity using midpoint method
    let totalElasticity = 0;
    let count = 0;

    for (let i = 1; i < pricePoints.length; i++) {
      const p1 = pricePoints[i - 1];
      const p2 = pricePoints[i];

      const pctPriceChange = (p2.price - p1.price) / ((p2.price + p1.price) / 2);
      const pctDemandChange = (p2.demand - p1.demand) / ((p2.demand + p1.demand) / 2);

      if (pctPriceChange !== 0 && Math.abs(pctDemandChange) > 0.001) {
        totalElasticity += pctDemandChange / pctPriceChange;
        count++;
      }
    }

    // Average elasticity
    const elasticity = count > 0 ? totalElasticity / count : -1.0;

    // Clamp to reasonable range
    return Math.max(-3, Math.min(-0.1, elasticity));
  }

  // ==========================================
  // PRICE SCENARIOS
  // ==========================================

  private generatePriceScenarios(
    basePrice: number,
    costPrice: number,
    elasticity: number,
    demandData: DemandData,
    competitionData: CompetitionData,
    inventoryLevel: number
  ): PriceScenario[] {
    const scenarios: PriceScenario[] = [];
    const baseDemand = 100; // Normalized demand unit

    // Test prices from -20% to +20% of base price
    const priceRange = basePrice * 0.2;
    const step = priceRange / 10;

    for (let pct = -20; pct <= 20; pct += 2) {
      const testPrice = basePrice * (1 + pct / 100);
      
      // Calculate expected demand using elasticity
      const priceRatio = testPrice / basePrice;
      const expectedDemand = baseDemand * Math.pow(priceRatio, elasticity);
      
      // Calculate expected revenue
      const expectedRevenue = testPrice * expectedDemand;
      
      // Calculate conversion rate (simplified)
      const conversionRate = this.calculateConversionRate(
        testPrice,
        competitionData.lowestCompetitor,
        demandData.currentDemandScore
      );
      
      // Calculate margin
      const margin = testPrice - costPrice;
      const marginPercent = costPrice > 0 ? (margin / costPrice) * 100 : 0;
      
      // Calculate competitiveness score
      const competitiveness = this.calculateCompetitiveness(
        testPrice,
        competitionData.lowestCompetitor,
        competitionData.avgMarketPrice
      );

      scenarios.push({
        price: Math.round(testPrice * 100) / 100,
        expectedDemand: Math.round(expectedDemand),
        expectedRevenue: Math.round(expectedRevenue * 100) / 100,
        conversionRate,
        margin: Math.round(margin * 100) / 100,
        competitiveness,
      });
    }

    // Sort by revenue
    return scenarios.sort((a, b) => b.expectedRevenue - a.expectedRevenue);
  }

  private calculateConversionRate(
    price: number,
    competitorLow: number,
    demandScore: number
  ): number {
    // Base conversion rate based on price competitiveness
    let conversionRate = 0.05; // Base 5%

    // Adjust for price vs competitor
    if (price <= competitorLow) {
      conversionRate += 0.1; // +10% for being competitive
    } else if (price < competitorLow * 1.1) {
      conversionRate += 0.05;
    } else if (price > competitorLow * 1.2) {
      conversionRate -= 0.05;
    }

    // Adjust for demand
    conversionRate *= (0.5 + demandScore);

    // Clamp between 1% and 30%
    return Math.max(0.01, Math.min(0.3, conversionRate));
  }

  private calculateCompetitiveness(
    price: number,
    lowestCompetitor: number,
    avgMarketPrice: number
  ): number {
    if (price <= lowestCompetitor) return 1.0;
    
    const premium = (price - lowestCompetitor) / lowestCompetitor;
    const marketPremium = (avgMarketPrice - lowestCompetitor) / lowestCompetitor;
    
    if (marketPremium === 0) return 1 - premium;
    
    return Math.max(0, 1 - (premium / marketPremium));
  }

  private selectOptimalScenario(
    scenarios: PriceScenario[],
    targetMargin?: number
  ): PriceScenario {
    // If target margin specified, prefer scenarios meeting margin
    if (targetMargin && targetMargin > 0) {
      const marginScenarios = scenarios.filter(s => {
        const marginPercent = (s.margin / (s.price - s.margin)) * 100;
        return marginPercent >= targetMargin;
      });
      
      if (marginScenarios.length > 0) {
        // Return highest revenue among margin-compliant scenarios
        return marginScenarios.reduce((best, current) =>
          current.expectedRevenue > best.expectedRevenue ? current : best
        );
      }
    }

    // Otherwise, return highest revenue scenario
    return scenarios[0];
  }

  // ==========================================
  // PRICING FACTORS
  // ==========================================

  private calculatePricingFactors(
    demandData: DemandData,
    competitionData: CompetitionData,
    inventoryLevel: number,
    costPrice: number
  ): {
    demandFactor: number;
    competitionFactor: number;
    inventoryFactor: number;
    marginFactor: number;
    trendFactor: number;
  } {
    // Demand factor (0-1, higher = stronger demand)
    const demandFactor = demandData.currentDemandScore;

    // Competition factor (0-1, higher = more competitive)
    const competitionFactor = this.calculateCompetitiveness(
      competitionData.ourPrice,
      competitionData.lowestCompetitor,
      competitionData.avgMarketPrice
    );

    // Inventory factor (0-1, higher = more stock)
    const inventoryFactor = Math.min(1, inventoryLevel / 100);

    // Margin factor (0-1, higher = better margin)
    const marginFactor = costPrice > 0
      ? Math.min(1, (competitionData.ourPrice - costPrice) / competitionData.ourPrice / 0.5)
      : 0.5;

    // Trend factor (0-1, higher = positive trend)
    const trendFactor = demandData.demandTrend === 'rising' ? 0.8
      : demandData.demandTrend === 'falling' ? 0.2
      : 0.5;

    return {
      demandFactor,
      competitionFactor,
      inventoryFactor,
      marginFactor,
      trendFactor,
    };
  }

  private generatePricingReasoning(
    scenario: PriceScenario,
    factors: any
  ): string {
    const reasons: string[] = [];

    if (scenario.price > 0) {
      const margin = scenario.expectedDemand * (scenario.price - scenario.price * 0.7);
      reasons.push(`Expected demand: ${scenario.expectedDemand} units`);
      reasons.push(`Expected revenue: $${scenario.expectedRevenue.toFixed(2)}`);
    }

    if (factors.demandFactor > 0.7) {
      reasons.push('Strong demand supports premium pricing');
    } else if (factors.demandFactor < 0.3) {
      reasons.push('Weak demand suggests competitive pricing');
    }

    if (factors.competitionFactor > 0.8) {
      reasons.push('Highly competitive price position');
    } else if (factors.competitionFactor < 0.4) {
      reasons.push('Above market average - consider price review');
    }

    if (factors.inventoryFactor > 0.8) {
      reasons.push('High inventory - consider promotional pricing');
    } else if (factors.inventoryFactor < 0.2) {
      reasons.push('Low inventory - premium pricing possible');
    }

    return reasons.join('. ');
  }

  private calculateConfidence(priceHistory: any[]): number {
    // More data = higher confidence
    const baseConfidence = 0.5;
    const dataBoost = Math.min(0.4, priceHistory.length * 0.01);
    return Math.round((baseConfidence + dataBoost) * 100) / 100;
  }

  // ==========================================
  // INVENTORY DATA
  // ==========================================

  private async getInventoryData(productId: string): Promise<number> {
    // This would integrate with inventory service
    // Mock implementation
    return 50; // Default 50 units
  }

  // ==========================================
  // PRICE HISTORY
  // ==========================================

  private async getPriceHistory(productId: string): Promise<any[]> {
    return prisma.priceHistory?.findMany({
      where: { productId },
      orderBy: { recordedAt: 'desc' },
      take: 90,
    }) || [];
  }

  // ==========================================
  // COMPETITIVE PRICE SUGGESTIONS
  // ==========================================

  /**
   * Get competitive price suggestions for sellers
   */
  async getCompetitiveSuggestion(
    productId: string,
    costPrice: number,
    strategy: 'maximize_revenue' | 'maximize_sales' | 'clear_inventory' = 'maximize_revenue'
  ): Promise<{
    suggestedPrice: number;
    floorPrice: number;
    ceilingPrice: number;
    strategy: string;
    reasoning: string;
  }> {
    const competitionData = await this.getCompetitionData(productId, costPrice);
    const demandData = await this.getDemandData(productId);

    let suggestedPrice: number;
    let reasoning: string;

    switch (strategy) {
      case 'maximize_revenue':
        suggestedPrice = this.calculateRevenueOptimalPrice(
          costPrice,
          competitionData,
          demandData
        );
        reasoning = 'This price maximizes expected revenue based on demand elasticity.';
        break;

      case 'maximize_sales':
        suggestedPrice = this.calculateSalesOptimalPrice(
          costPrice,
          competitionData,
          demandData
        );
        reasoning = 'This price is optimized for sales volume and market share.';
        break;

      case 'clear_inventory':
        suggestedPrice = this.calculateClearancePrice(
          costPrice,
          competitionData,
          demandData
        );
        reasoning = 'This aggressive pricing helps clear excess inventory quickly.';
        break;

      default:
        suggestedPrice = competitionData.avgMarketPrice;
        reasoning = 'Market average pricing for balanced approach.';
    }

    // Calculate floor and ceiling
    const floorPrice = Math.max(costPrice * 1.05, competitionData.lowestCompetitor * 0.98);
    const ceilingPrice = competitionData.highestCompetitor * 1.05;

    return {
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      floorPrice: Math.round(floorPrice * 100) / 100,
      ceilingPrice: Math.round(ceilingPrice * 100) / 100,
      strategy,
      reasoning,
    };
  }

  private calculateRevenueOptimalPrice(
    costPrice: number,
    competitionData: CompetitionData,
    demandData: DemandData
  ): number {
    // Revenue optimal is typically just below average market price
    // adjusting for demand
    const marketAvg = competitionData.avgMarketPrice;
    const demandAdjustment = 1 + (demandData.currentDemandScore - 0.5) * 0.1;
    
    return marketAvg * demandAdjustment;
  }

  private calculateSalesOptimalPrice(
    costPrice: number,
    competitionData: CompetitionData,
    demandData: DemandData
  ): number {
    // Sales optimal is typically at or slightly below lowest competitor
    const targetPrice = competitionData.lowestCompetitor * 0.99;
    return Math.max(costPrice, targetPrice);
  }

  private calculateClearancePrice(
    costPrice: number,
    competitionData: CompetitionData,
    demandData: DemandData
  ): number {
    // Clearance is aggressive - below lowest competitor
    const baseClearance = competitionData.lowestCompetitor * 0.9;
    const demandDiscount = demandData.currentDemandScore < 0.3 ? 0.85 : 0.92;
    
    return Math.max(costPrice * 0.9, baseClearance * demandDiscount);
  }

  // ==========================================
  // PRICE RULES ENGINE
  // ==========================================

  /**
   * Apply pricing rules to calculate final price
   */
  async applyPricingRules(
    productId: string,
    basePrice: number,
    context: {
      categoryId?: string;
      brandId?: string;
      inventoryLevel?: number;
      isHoliday?: boolean;
      userSegment?: string;
    }
  ): Promise<{
    finalPrice: number;
    appliedRules: { ruleId: string; action: string; adjustment: number }[];
    ruleBreakdown: string[];
  }> {
    // Get active pricing rules
    const rules = await this.getActivePricingRules(productId, context);

    let currentPrice = basePrice;
    const appliedRules: { ruleId: string; action: string; adjustment: number }[] = [];
    const ruleBreakdown: string[] = [];

    // Sort rules by priority
    rules.sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      if (this.evaluateRuleConditions(rule, context, currentPrice)) {
        const adjustment = this.calculateRuleAdjustment(rule, currentPrice);
        
        currentPrice = this.applyAdjustment(currentPrice, rule.actionType, adjustment);
        
        appliedRules.push({
          ruleId: rule.id,
          action: rule.actionType,
          adjustment: currentPrice - basePrice,
        });
        
        ruleBreakdown.push(`${rule.ruleType}: ${rule.actionType} by ${adjustment}%`);
      }
    }

    return {
      finalPrice: Math.round(currentPrice * 100) / 100,
      appliedRules,
      ruleBreakdown,
    };
  }

  private async getActivePricingRules(
    productId: string,
    context: any
  ): Promise<any[]> {
    return prisma.pricingRule?.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        validTo: { gte: new Date() },
      },
      orderBy: { priority: 'desc' },
    }) || [];
  }

  private evaluateRuleConditions(
    rule: any,
    context: any,
    currentPrice: number
  ): boolean {
    const conditions = rule.conditions as any[];
    
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      switch (condition.type) {
        case 'CATEGORY':
          if (context.categoryId !== condition.value) return false;
          break;
        case 'BRAND':
          if (context.brandId !== condition.value) return false;
          break;
        case 'INVENTORY':
          if (!this.checkInventoryCondition(condition, context.inventoryLevel)) return false;
          break;
        case 'PRICE_RANGE':
          if (!this.checkPriceCondition(condition, currentPrice)) return false;
          break;
        case 'TIME':
          if (!this.checkTimeCondition(condition)) return false;
          break;
      }
    }

    return true;
  }

  private checkInventoryCondition(condition: any, inventoryLevel: number): boolean {
    switch (condition.operator) {
      case 'lt': return inventoryLevel < condition.value;
      case 'lte': return inventoryLevel <= condition.value;
      case 'gt': return inventoryLevel > condition.value;
      case 'gte': return inventoryLevel >= condition.value;
      default: return true;
    }
  }

  private checkPriceCondition(condition: any, price: number): boolean {
    switch (condition.operator) {
      case 'lt': return price < condition.value;
      case 'lte': return price <= condition.value;
      case 'gt': return price > condition.value;
      case 'gte': return price >= condition.value;
      case 'between': return price >= condition.min && price <= condition.max;
      default: return true;
    }
  }

  private checkTimeCondition(condition: any): boolean {
    const now = new Date();
    
    if (condition.hour) {
      const hour = now.getHours();
      if (condition.hour.includes && !condition.hour.includes(hour)) return false;
    }
    
    if (condition.dayOfWeek) {
      const day = now.getDay();
      if (condition.dayOfWeek.includes && !condition.dayOfWeek.includes(day)) return false;
    }
    
    return true;
  }

  private calculateRuleAdjustment(rule: any, currentPrice: number): number {
    switch (rule.actionType) {
      case 'SET_FIXED':
        return rule.actionValue - currentPrice;
      case 'SET_PERCENTAGE':
        return currentPrice * (rule.actionValue / 100);
      case 'INCREASE_PERCENTAGE':
      case 'DECREASE_PERCENTAGE':
        return rule.actionValue;
      case 'ADD_MARGIN':
        return currentPrice * ((rule.actionValue / 100));
      default:
        return 0;
    }
  }

  private applyAdjustment(
    price: number,
    actionType: string,
    adjustment: number
  ): number {
    let newPrice = price;

    switch (actionType) {
      case 'SET_FIXED':
        newPrice = adjustment;
        break;
      case 'SET_PERCENTAGE':
        newPrice = price + adjustment;
        break;
      case 'INCREASE_PERCENTAGE':
        newPrice = price * (1 + adjustment / 100);
        break;
      case 'DECREASE_PERCENTAGE':
        newPrice = price * (1 - adjustment / 100);
        break;
      case 'ADD_MARGIN':
        newPrice = price + adjustment;
        break;
      case 'MATCH_LOWEST':
        newPrice = Math.min(price, adjustment);
        break;
      case 'BEAT_LOWEST':
        newPrice = adjustment * 0.98; // 2% below matched price
        break;
      case 'SET_PSYCHOLOGICAL':
        newPrice = this.calculatePsychologicalPrice(adjustment);
        break;
    }

    return Math.max(0.01, newPrice);
  }

  private calculatePsychologicalPrice(basePrice: number): number {
    // Round to psychological price (e.g., 9.99, 19.99, 99.99)
    const rounded = Math.round(basePrice);
    
    if (rounded >= 100) {
      return Math.round(rounded / 10) * 10 - 1;
    } else if (rounded >= 10) {
      return Math.round(rounded / 1) - 0.01;
    } else {
      return Math.round(rounded * 10) / 10 - 0.01;
    }
  }

  // ==========================================
  // PRICE OPTIMIZATION STORAGE
  // ==========================================

  async saveOptimization(
    productId: string,
    optimization: OptimizationResult
  ): Promise<void> {
    await prisma.priceOptimization.create({
      data: {
        productId,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currentPrice: optimization.currentPrice,
        currentDemand: optimization.expectedDemand,
        optimalPrice: optimization.recommendedPrice,
        expectedDemand: optimization.expectedDemand,
        expectedRevenue: optimization.expectedRevenue,
        priceElasticity: optimization.factors.demandFactor,
        confidence: optimization.confidence,
        scenarios: optimization.scenarios as any,
        recommendation: this.mapRecommendation(optimization.priceChangePercent),
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private mapRecommendation(priceChangePercent: number): string {
    if (priceChangePercent > 10) return 'PREMIUM';
    if (priceChangePercent > 3) return 'INCREASE_PRICE';
    if (priceChangePercent < -10) return 'DYNAMIC_ADJUST';
    if (priceChangePercent < -3) return 'DECREASE_PRICE';
    return 'MAINTAIN_PRICE';
  }

  async getProductOptimizations(
    productId: string,
    status?: OptimizationStatus
  ): Promise<any[]> {
    return prisma.priceOptimization?.findMany({
      where: {
        productId,
        ...(status && { status }),
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    }) || [];
  }

  async applyOptimization(optimizationId: string): Promise<void> {
    await prisma.priceOptimization.update({
      where: { id: optimizationId },
      data: {
        status: 'APPLIED',
        appliedAt: new Date(),
      },
    });
  }
}

export const dynamicPricingService = new DynamicPricingService();
