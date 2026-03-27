// Predictive Buying AI Service
// User behavior analysis, need prediction, proactive suggestions

import { PrismaClient, TargetType, TriggerType, Urgency, PredictionStatus, PurchaseResult } from '@prisma/client';
import * as simpleStatistics from 'simple-statistics';

const prisma = new PrismaClient();

interface UserBehaviorData {
  userId: string;
  purchaseHistory: PurchaseEvent[];
  browsingHistory: BrowsingEvent[];
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  searchQueries: SearchQuery[];
}

interface PurchaseEvent {
  productId: string;
  categoryId: string;
  brandId?: string;
  price: number;
  quantity: number;
  purchasedAt: Date;
  daysSinceLastPurchase?: number;
}

interface BrowsingEvent {
  productId: string;
  categoryId: string;
  viewedAt: Date;
  duration: number;
  sessions: number;
}

interface CartItem {
  productId: string;
  categoryId: string;
  price: number;
  addedAt: Date;
  daysInCart: number;
}

interface WishlistItem {
  productId: string;
  categoryId: string;
  price: number;
  addedAt: Date;
  notifyOnDrop: boolean;
}

interface SearchQuery {
  query: string;
  categoryId?: string;
  searchedAt: Date;
  resultCount: number;
  clickedProductIds: string[];
}

interface NeedPrediction {
  userId: string;
  targetType: TargetType;
  targetId: string;
  targetName: string;
  needScore: number;
  urgency: Urgency;
  confidence: number;
  predictedPurchaseDate?: Date;
  optimalPurchaseWindow?: Date;
  purchaseDeadline?: Date;
  triggerType?: TriggerType;
  triggerDetails?: Record<string, any>;
  recommendation: string;
}

interface PurchaseSuggestion {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  reason: string;
  urgency: Urgency;
  estimatedPrice: number;
  confidence: number;
  optimalTiming: string;
  savingsPotential?: number;
}

export class PredictiveBuyingService {
  private readonly PURCHASE_INTERVAL_WEIGHT = 0.3;
  private readonly BROWSE_FREQUENCY_WEIGHT = 0.2;
  private readonly CART_ACTIVITY_WEIGHT = 0.25;
  private readonly SEARCH_INTENT_WEIGHT = 0.15;
  private readonly WISHLIST_ACTIVITY_WEIGHT = 0.1;

  // ==========================================
  // USER BEHAVIOR ANALYSIS
  // ==========================================

  /**
   * Build comprehensive user behavior profile
   */
  async buildUserProfile(userId: string): Promise<any> {
    const [
      purchases,
      browsing,
      cartItems,
      wishlistItems,
      searchQueries,
    ] = await Promise.all([
      this.getPurchaseHistory(userId),
      this.getBrowsingHistory(userId),
      this.getCartItems(userId),
      this.getWishlistItems(userId),
      this.getSearchHistory(userId),
    ]);

    // Calculate purchase patterns
    const purchasePatterns = this.analyzePurchasePatterns(purchases);
    
    // Calculate category preferences
    const categoryPreferences = this.analyzeCategoryPreferences(purchases, browsing, cartItems, wishlistItems);
    
    // Calculate price sensitivity
    const priceRange = this.calculatePriceRange(purchases, cartItems);
    
    // Calculate timing preferences
    const timingPreferences = this.analyzeTimingPreferences(purchases);
    
    // Calculate engagement metrics
    const engagementMetrics = this.calculateEngagementMetrics(purchases, browsing, cartItems);
    
    // Build seasonal patterns
    const seasonalPatterns = this.buildSeasonalPatterns(purchases);

    // Calculate behavior score
    const behaviorScore = this.calculateBehaviorScore(engagementMetrics);

    // Predict lifetime value
    const predictedLTV = this.predictLifetimeValue(purchases, engagementMetrics);

    // Upsert profile
    const profile = await prisma.userBehaviorProfile.upsert({
      where: { userId },
      update: {
        avgPurchaseInterval: purchasePatterns.avgInterval,
        preferredCategories: categoryPreferences.topCategories,
        priceRangeMin: priceRange.min,
        priceRangeMax: priceRange.max,
        preferredDaysOfWeek: timingPreferences.topDays,
        preferredHours: timingPreferences.topHours,
        totalSessions: engagementMetrics.totalSessions,
        avgSessionDuration: engagementMetrics.avgSessionDuration,
        cartAbandonmentRate: engagementMetrics.cartAbandonmentRate,
        wishlistConversionRate: engagementMetrics.wishlistConversionRate,
        behaviorScore,
        predictedLTV,
        seasonalMultiplier: seasonalPatterns as any,
      },
      create: {
        userId,
        avgPurchaseInterval: purchasePatterns.avgInterval,
        preferredCategories: categoryPreferences.topCategories,
        priceRangeMin: priceRange.min,
        priceRangeMax: priceRange.max,
        preferredDaysOfWeek: timingPreferences.topDays,
        preferredHours: timingPreferences.topHours,
        totalSessions: engagementMetrics.totalSessions,
        avgSessionDuration: engagementMetrics.avgSessionDuration,
        cartAbandonmentRate: engagementMetrics.cartAbandonmentRate,
        wishlistConversionRate: engagementMetrics.wishlistConversionRate,
        behaviorScore,
        predictedLTV,
        seasonalMultiplier: seasonalPatterns as any,
      },
    });

    return profile;
  }

  private async getPurchaseHistory(userId: string): Promise<PurchaseEvent[]> {
    // This would integrate with order service
    // Mock implementation
    return [];
  }

  private async getBrowsingHistory(userId: string): Promise<BrowsingEvent[]> {
    // This would integrate with analytics service
    return [];
  }

  private async getCartItems(userId: string): Promise<CartItem[]> {
    // This would integrate with cart service
    return [];
  }

  private async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    // This would integrate with product/wishlist service
    return [];
  }

  private async getSearchHistory(userId: string): Promise<SearchQuery[]> {
    // This would integrate with search service
    return [];
  }

  // ==========================================
  // PURCHASE PATTERN ANALYSIS
  // ==========================================

  private analyzePurchasePatterns(purchases: PurchaseEvent[]): {
    avgInterval: number;
    intervalVariance: number;
    purchaseFrequency: Record<string, number>;
  } {
    if (purchases.length < 2) {
      return { avgInterval: 30, intervalVariance: 0, purchaseFrequency: {} };
    }

    // Sort by date
    const sorted = [...purchases].sort((a, b) => 
      new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
    );

    // Calculate intervals
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.floor(
        (new Date(sorted[i].purchasedAt).getTime() - new Date(sorted[i-1].purchasedAt).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      if (days > 0 && days < 365) intervals.push(days);
    }

    if (intervals.length === 0) {
      return { avgInterval: 30, intervalVariance: 0, purchaseFrequency: {} };
    }

    // Calculate frequency by category
    const purchaseFrequency: Record<string, number> = {};
    sorted.forEach(p => {
      purchaseFrequency[p.categoryId] = (purchaseFrequency[p.categoryId] || 0) + 1;
    });

    return {
      avgInterval: simpleStatistics.mean(intervals),
      intervalVariance: simpleStatistics.variance(intervals),
      purchaseFrequency,
    };
  }

  private analyzeCategoryPreferences(
    purchases: PurchaseEvent[],
    browsing: BrowsingEvent[],
    cart: CartItem[],
    wishlist: WishlistItem[]
  ): { topCategories: string[]; categoryScores: Record<string, number> } {
    const categoryScores: Record<string, number> = {};

    // Weight purchases highest
    purchases.forEach(p => {
      categoryScores[p.categoryId] = (categoryScores[p.categoryId] || 0) + 10;
    });

    // Weight cart items
    cart.forEach(c => {
      categoryScores[c.categoryId] = (categoryScores[c.categoryId] || 0) + 5;
    });

    // Weight wishlist
    wishlist.forEach(w => {
      categoryScores[w.categoryId] = (categoryScores[w.categoryId] || 0) + 3;
    });

    // Weight browsing
    browsing.forEach(b => {
      categoryScores[b.categoryId] = (categoryScores[b.categoryId] || 0) + 1;
    });

    // Sort and return top categories
    const sorted = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      topCategories: sorted.map(([cat]) => cat),
      categoryScores,
    };
  }

  private calculatePriceRange(purchases: PurchaseEvent[], cart: CartItem[]): {
    min: number;
    max: number;
    avg: number;
  } {
    const prices: number[] = [];

    purchases.forEach(p => prices.push(p.price));
    cart.forEach(c => prices.push(c.price));

    if (prices.length === 0) {
      return { min: 0, max: 100, avg: 50 };
    }

    return {
      min: simpleStatistics.min(prices),
      max: simpleStatistics.max(prices),
      avg: simpleStatistics.mean(prices),
    };
  }

  private analyzeTimingPreferences(purchases: PurchaseEvent[]): {
    topDays: number[];
    topHours: number[];
    dayScores: number[];
    hourScores: number[];
  } {
    const dayScores = new Array(7).fill(0);
    const hourScores = new Array(24).fill(0);

    purchases.forEach(p => {
      const date = new Date(p.purchasedAt);
      dayScores[date.getDay()] += 1;
      hourScores[date.getHours()] += 1;
    });

    // Get top 3 days and hours
    const topDays = dayScores
      .map((score, day) => ({ score, day }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(d => d.day);

    const topHours = hourScores
      .map((score, hour) => ({ score, hour }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(h => h.hour);

    return { topDays, topHours, dayScores, hourScores };
  }

  private calculateEngagementMetrics(
    purchases: PurchaseEvent[],
    browsing: BrowsingEvent[],
    cart: CartItem[],
    wishlist: WishlistItem[]
  ): {
    totalSessions: number;
    avgSessionDuration: number;
    cartAbandonmentRate: number;
    wishlistConversionRate: number;
  } {
    // Calculate cart abandonment
    const totalCarts = cart.length;
    const completedCarts = purchases.length;
    const cartAbandonmentRate = totalCarts > 0 
      ? 1 - (completedCarts / (completedCarts + totalCarts))
      : 0;

    // Calculate wishlist conversion
    const wishlistCount = wishlist.length;
    const wishlistPurchased = purchases.filter(p => 
      wishlist.some(w => w.productId === p.productId)
    ).length;
    const wishlistConversionRate = wishlistCount > 0
      ? wishlistPurchased / wishlistCount
      : 0;

    return {
      totalSessions: browsing.length,
      avgSessionDuration: browsing.length > 0
        ? simpleStatistics.mean(browsing.map(b => b.duration))
        : 0,
      cartAbandonmentRate,
      wishlistConversionRate,
    };
  }

  private buildSeasonalPatterns(purchases: PurchaseEvent[]): Record<string, number> {
    const monthlyPurchases = new Array(12).fill(0);
    
    purchases.forEach(p => {
      const month = new Date(p.purchasedAt).getMonth();
      monthlyPurchases[month]++;
    });

    const avg = simpleStatistics.mean(monthlyPurchases);
    const patterns: Record<string, number> = {};

    if (avg > 0) {
      monthlyPurchases.forEach((count, month) => {
        patterns[month.toString()] = count / avg;
      });
    }

    return patterns;
  }

  private calculateBehaviorScore(metrics: any): number {
    // Normalize and weight metrics
    const sessionScore = Math.min(1, metrics.totalSessions / 100) * 0.2;
    const durationScore = Math.min(1, metrics.avgSessionDuration / 1800) * 0.2; // 30 min max
    const cartScore = (1 - metrics.cartAbandonmentRate) * 0.3;
    const wishlistScore = metrics.wishlistConversionRate * 0.3;

    return Math.min(1, sessionScore + durationScore + cartScore + wishlistScore);
  }

  private predictLifetimeValue(purchases: PurchaseEvent[], metrics: any): number {
    if (purchases.length === 0) return 0;

    const totalRevenue = purchases.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const avgPurchaseValue = totalRevenue / purchases.length;
    const purchaseFrequency = metrics.totalSessions > 0 
      ? purchases.length / metrics.totalSessions 
      : 0;

    // Simple LTV estimate: avg purchase * purchases per year * 3 years
    const yearlyPurchases = purchaseFrequency * 12;
    return avgPurchaseValue * yearlyPurchases * 3;
  }

  // ==========================================
  // NEED PREDICTION ALGORITHMS
  // ==========================================

  /**
   * Predict user purchase needs
   */
  async predictUserNeeds(userId: string): Promise<NeedPrediction[]> {
    const profile = await this.buildUserProfile(userId);
    const [cartItems, wishlistItems, recentPurchases] = await Promise.all([
      this.getCartItems(userId),
      this.getWishlistItems(userId),
      this.getRecentPurchases(userId),
    ]);

    const predictions: NeedPrediction[] = [];

    // 1. Replenishment predictions (running out of consumables)
    const replenishmentNeeds = await this.predictReplenishmentNeeds(
      userId,
      profile,
      recentPurchases
    );
    predictions.push(...replenishmentNeeds);

    // 2. Cart-based predictions
    const cartPredictions = this.analyzeCartForNeeds(userId, cartItems, profile);
    predictions.push(...cartPredictions);

    // 3. Wishlist predictions
    const wishlistPredictions = this.analyzeWishlistForNeeds(
      userId,
      wishlistItems,
      profile
    );
    predictions.push(...wishlistPredictions);

    // 4. Seasonal predictions
    const seasonalPredictions = await this.predictSeasonalNeeds(
      userId,
      profile,
      recentPurchases
    );
    predictions.push(...seasonalPredictions);

    // 5. Trend-based predictions
    const trendPredictions = await this.predictTrendBasedNeeds(
      userId,
      profile,
      wishlistItems
    );
    predictions.push(...trendPredictions);

    // Save predictions
    for (const prediction of predictions) {
      await this.savePrediction(prediction);
    }

    // Sort by need score and return top predictions
    return predictions
      .sort((a, b) => b.needScore - a.needScore)
      .slice(0, 20);
  }

  private async getRecentPurchases(userId: string): Promise<PurchaseEvent[]> {
    // Mock implementation
    return [];
  }

  private async predictReplenishmentNeeds(
    userId: string,
    profile: any,
    purchases: PurchaseEvent[]
  ): Promise<NeedPrediction[]> {
    const needs: NeedPrediction[] = [];

    // Group purchases by product
    const productPurchases = new Map<string, PurchaseEvent[]>();
    purchases.forEach(p => {
      const list = productPurchases.get(p.productId) || [];
      list.push(p);
      productPurchases.set(p.productId, list);
    });

    // Calculate replenishment needs
    for (const [productId, productPurchasesList] of productPurchases) {
      if (productPurchasesList.length < 2) continue;

      // Sort by date
      const sorted = productPurchasesList.sort((a, b) =>
        new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
      );

      const lastPurchase = sorted[0];
      const avgInterval = profile.avgPurchaseInterval || 30;
      
      // Calculate days since last purchase
      const daysSinceLast = Math.floor(
        (Date.now() - new Date(lastPurchase.purchasedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Predict if running out
      if (daysSinceLast > avgInterval * 0.7) {
        const urgency = daysSinceLast > avgInterval ? Urgency.HIGH : Urgency.MEDIUM;
        const needScore = Math.min(1, daysSinceLast / avgInterval);
        
        const predictedPurchaseDate = new Date(
          Date.now() + (avgInterval - daysSinceLast) * 24 * 60 * 60 * 1000
        );

        needs.push({
          userId,
          targetType: TargetType.PRODUCT,
          targetId: productId,
          targetName: lastPurchase.productId, // Would fetch product name
          needScore,
          urgency,
          confidence: 0.7,
          predictedPurchaseDate,
          optimalPurchaseWindow: predictedPurchaseDate,
          triggerType: TriggerType.REPLENISHMENT,
          triggerDetails: {
            avgInterval,
            daysSinceLast,
            lastQuantity: lastPurchase.quantity,
          },
          recommendation: `You may be running low on this item. Consider reordering soon.`,
        });
      }
    }

    return needs;
  }

  private analyzeCartForNeeds(
    userId: string,
    cartItems: CartItem[],
    profile: any
  ): NeedPrediction[] {
    return cartItems.map(item => {
      const daysInCart = item.daysInCart;
      const needScore = Math.min(1, daysInCart / 14); // Max 14 days
      
      let urgency = Urgency.LOW;
      if (daysInCart > 10) urgency = Urgency.HIGH;
      else if (daysInCart > 7) urgency = Urgency.MEDIUM;
      else if (daysInCart > 3) urgency = Urgency.LOW;

      // Calculate optimal purchase window based on user preferences
      const optimalWindow = this.calculateOptimalPurchaseWindow(profile);

      return {
        userId,
        targetType: TargetType.PRODUCT,
        targetId: item.productId,
        targetName: item.productId,
        needScore,
        urgency,
        confidence: 0.6 + (1 - needScore) * 0.2,
        predictedPurchaseDate: optimalWindow,
        optimalPurchaseWindow: optimalWindow,
        triggerType: TriggerType.CART_REMINDER,
        triggerDetails: {
          daysInCart,
          currentPrice: item.price,
        },
        recommendation: `Complete your purchase for better value.`,
      };
    });
  }

  private analyzeWishlistForNeeds(
    userId: string,
    wishlistItems: WishlistItem[],
    profile: any
  ): NeedPrediction[] {
    return wishlistItems
      .filter(item => item.notifyOnDrop)
      .map(item => {
        const daysOnWishlist = Math.floor(
          (Date.now() - new Date(item.addedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const needScore = Math.min(0.8, daysOnWishlist / 60);
        const urgency = daysOnWishlist > 30 ? Urgency.MEDIUM : Urgency.LOW;

        return {
          userId,
          targetType: TargetType.PRODUCT,
          targetId: item.productId,
          targetName: item.productId,
          needScore,
          urgency,
          confidence: 0.5 + needScore * 0.3,
          triggerType: TriggerType.WISHLIST,
          triggerDetails: {
            daysOnWishlist,
            targetPrice: item.price,
          },
          recommendation: `This item has been on your wishlist. Consider purchasing if the price is right.`,
        };
      });
  }

  private async predictSeasonalNeeds(
    userId: string,
    profile: any,
    purchases: PurchaseEvent[]
  ): Promise<NeedPrediction[]> {
    const needs: NeedPrediction[] = [];
    const seasonalMultiplier = profile.seasonalMultiplier || {};
    const currentMonth = new Date().getMonth();

    // Check for seasonal patterns
    for (const [monthStr, multiplier] of Object.entries(seasonalMultiplier)) {
      const month = parseInt(monthStr);
      const monthsUntilSeason = (month - currentMonth + 12) % 12;

      // If within 2 months of seasonal spike
      if (monthsUntilSeason <= 2 && monthsUntilSeason > 0) {
        // Get top categories from this period last year
        const seasonalCategories = await this.getSeasonalCategories(
          userId,
          month,
          purchases
        );

        for (const category of seasonalCategories.slice(0, 3)) {
          needs.push({
            userId,
            targetType: TargetType.CATEGORY,
            targetId: category.categoryId,
            targetName: category.categoryName,
            needScore: (multiplier as number) * 0.7,
            urgency: monthsUntilSeason === 1 ? Urgency.MEDIUM : Urgency.LOW,
            confidence: 0.6,
            predictedPurchaseDate: new Date(
              Date.now() + monthsUntilSeason * 30 * 24 * 60 * 60 * 1000
            ),
            triggerType: TriggerType.SEASONAL,
            triggerDetails: {
              seasonalMultiplier: multiplier,
              monthsUntilSeason,
            },
            recommendation: `Seasonal demand for ${category.categoryName} is coming up.`,
          });
        }
      }
    }

    return needs;
  }

  private async getSeasonalCategories(
    userId: string,
    targetMonth: number,
    purchases: PurchaseEvent[]
  ): Promise<{ categoryId: string; categoryName: string; count: number }[]> {
    // Filter purchases from target month
    const monthlyPurchases = purchases.filter(p => {
      const month = new Date(p.purchasedAt).getMonth();
      return month === targetMonth;
    });

    // Group by category
    const categoryCounts = new Map<string, number>();
    monthlyPurchases.forEach(p => {
      categoryCounts.set(p.categoryId, (categoryCounts.get(p.categoryId) || 0) + 1);
    });

    return Array.from(categoryCounts.entries())
      .map(([categoryId, count]) => ({ categoryId, categoryName: categoryId, count }))
      .sort((a, b) => b.count - a.count);
  }

  private async predictTrendBasedNeeds(
    userId: string,
    profile: any,
    wishlistItems: WishlistItem[]
  ): Promise<NeedPrediction[]> {
    // This would integrate with market intelligence service
    // Mock implementation
    return [];
  }

  private calculateOptimalPurchaseWindow(profile: any): Date {
    const preferredDays = profile.preferredDaysOfWeek || [0, 6]; // Default to weekend
    const preferredHours = profile.preferredHours || [10, 11, 14, 15, 20, 21];

    const now = new Date();
    let targetDate = new Date(now);

    // Find next preferred day
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      
      if (preferredDays.includes(checkDate.getDay())) {
        targetDate = checkDate;
        break;
      }
    }

    // Set to preferred hour
    const preferredHour = preferredHours[0] || 10;
    targetDate.setHours(preferredHour, 0, 0, 0);

    return targetDate;
  }

  private async savePrediction(prediction: NeedPrediction): Promise<void> {
    await prisma.purchaseNeed.create({
      data: {
        userId: prediction.userId,
        targetType: prediction.targetType,
        targetId: prediction.targetId,
        targetName: prediction.targetName,
        needScore: prediction.needScore,
        urgency: prediction.urgency,
        confidence: prediction.confidence,
        predictedPurchaseDate: prediction.predictedPurchaseDate,
        optimalPurchaseWindow: prediction.optimalPurchaseWindow,
        triggerType: prediction.triggerType,
        triggerDetails: prediction.triggerDetails as any,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ==========================================
  // PROACTIVE SUGGESTIONS
  // ==========================================

  /**
   * Generate proactive purchase suggestions
   */
  async generateProactiveSuggestions(userId: string): Promise<PurchaseSuggestion[]> {
    const [predictions, profile, marketTrends] = await Promise.all([
      this.predictUserNeeds(userId),
      this.getUserProfile(userId),
      this.getMarketTrends(),
    ]);

    const suggestions: PurchaseSuggestion[] = [];

    for (const prediction of predictions.slice(0, 10)) {
      const suggestion: PurchaseSuggestion = {
        productId: prediction.targetId,
        productName: prediction.targetName,
        categoryId: '',
        categoryName: '',
        reason: prediction.recommendation,
        urgency: prediction.urgency,
        estimatedPrice: prediction.predictedPurchaseDate 
          ? await this.estimatePrice(prediction.targetId) 
          : 0,
        confidence: prediction.confidence,
        optimalTiming: this.formatOptimalTiming(prediction),
      };

      // Calculate savings potential
      if (marketTrends.priceDrops && marketTrends.priceDrops.includes(prediction.targetId)) {
        suggestion.savingsPotential = await this.calculateSavingsPotential(prediction.targetId);
      }

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  private async getUserProfile(userId: string): Promise<any> {
    return prisma.userBehaviorProfile.findUnique({ where: { userId } });
  }

  private async getMarketTrends(): Promise<any> {
    // This would integrate with market intelligence service
    return {};
  }

  private async estimatePrice(productId: string): Promise<number> {
    // This would use historical data
    return 0;
  }

  private formatOptimalTiming(prediction: NeedPrediction): string {
    if (!prediction.optimalPurchaseWindow) {
      return 'Now';
    }

    const now = new Date();
    const optimal = new Date(prediction.optimalPurchaseWindow);
    const diff = optimal.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Now';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
    
    return `In ${Math.floor(days / 30)} months`;
  }

  private async calculateSavingsPotential(productId: string): Promise<number> {
    // This would calculate potential savings based on price history
    return 0;
  }

  // ==========================================
  // PURCHASE TIMING OPTIMIZATION
  // ==========================================

  /**
   * Calculate optimal purchase timing for a product
   */
  async optimizePurchaseTiming(userId: string, productId: string): Promise<{
    recommendedDate: Date;
    confidence: number;
    reasoning: string;
    priceForecast: { date: Date; predictedPrice: number; confidence: number }[];
  }> {
    const [profile, priceHistory, marketData] = await Promise.all([
      this.getUserProfile(userId),
      this.getPriceHistory(productId),
      this.getMarketData(productId),
    ]);

    // Analyze price patterns
    const pricePatterns = this.analyzePricePatterns(priceHistory);
    
    // Calculate best time to buy
    const bestDate = this.findOptimalPurchaseDate(pricePatterns, profile, marketData);
    
    // Generate price forecast
    const priceForecast = this.generatePriceForecast(pricePatterns, marketData);

    return {
      recommendedDate: bestDate,
      confidence: pricePatterns.confidence,
      reasoning: this.generateTimingReasoning(bestDate, pricePatterns),
      priceForecast,
    };
  }

  private async getPriceHistory(productId: string): Promise<any[]> {
    return prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { recordedAt: 'desc' },
      take: 90,
    });
  }

  private async getMarketData(productId: string): Promise<any> {
    // This would integrate with market intelligence
    return {};
  }

  private analyzePricePatterns(priceHistory: any[]): {
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    trend: 'rising' | 'falling' | 'stable';
    volatility: number;
    seasonalLowMonths: number[];
    confidence: number;
  } {
    if (priceHistory.length === 0) {
      return {
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        trend: 'stable',
        volatility: 0,
        seasonalLowMonths: [],
        confidence: 0.3,
      };
    }

    const prices = priceHistory.map(h => h.sellingPrice);

    // Calculate metrics
    const avgPrice = simpleStatistics.mean(prices);
    const minPrice = simpleStatistics.min(prices);
    const maxPrice = simpleStatistics.max(prices);
    const volatility = prices.length > 1 
      ? simpleStatistics.standardDeviation(prices) / avgPrice 
      : 0;

    // Calculate trend
    const recentPrices = prices.slice(0, Math.min(30, prices.length));
    const trend = this.calculatePriceTrend(recentPrices);

    // Calculate confidence based on data points
    const confidence = Math.min(0.95, 0.3 + priceHistory.length * 0.02);

    return {
      avgPrice,
      minPrice,
      maxPrice,
      trend,
      volatility,
      seasonalLowMonths: [],
      confidence,
    };
  }

  private calculatePriceTrend(prices: number[]): 'rising' | 'falling' | 'stable' {
    if (prices.length < 2) return 'stable';

    const n = prices.length;
    const slope = this.calculateSlope(prices);
    const avgPrice = simpleStatistics.mean(prices);
    const percentChange = (slope / avgPrice) * 100;

    if (percentChange > 2) return 'rising';
    if (percentChange < -2) return 'falling';
    return 'stable';
  }

  private calculateSlope(values: number[]): number {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private findOptimalPurchaseDate(
    patterns: any,
    profile: any,
    marketData: any
  ): Date {
    const now = new Date();

    // If price is trending down, wait
    if (patterns.trend === 'falling' && patterns.volatility > 0.05) {
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
    }

    // If price is at historical low, buy now
    const currentPrice = marketData.currentPrice || patterns.avgPrice;
    if (currentPrice <= patterns.minPrice * 1.05) {
      return now;
    }

    // Consider user's preferred timing
    const preferredDays = profile?.preferredDaysOfWeek || [0, 6];
    const preferredHours = profile?.preferredHours || [10, 11, 14, 15, 20, 21];

    let targetDate = new Date(now);
    
    // Find next preferred day
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      
      if (preferredDays.includes(checkDate.getDay())) {
        targetDate = checkDate;
        break;
      }
    }

    return targetDate;
  }

  private generatePriceForecast(
    patterns: any,
    marketData: any
  ): { date: Date; predictedPrice: number; confidence: number }[] {
    const forecast: { date: Date; predictedPrice: number; confidence: number }[] = [];
    const now = new Date();
    let price = marketData.currentPrice || patterns.avgPrice;

    // Generate 30-day forecast
    for (let i = 1; i <= 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      // Apply trend adjustment
      if (patterns.trend === 'rising') {
        price *= 1.001; // 0.1% daily increase
      } else if (patterns.trend === 'falling') {
        price *= 0.999; // 0.1% daily decrease
      }

      // Decrease confidence over time
      const confidence = Math.max(0.4, patterns.confidence - i * 0.01);

      forecast.push({
        date,
        predictedPrice: Math.round(price * 100) / 100,
        confidence,
      });
    }

    return forecast;
  }

  private generateTimingReasoning(bestDate: Date, patterns: any): string {
    const daysUntil = Math.floor(
      (bestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil <= 0) {
      return 'Prices are currently favorable. Recommended to purchase now.';
    }

    if (patterns.trend === 'falling') {
      return `Prices are trending down. Waiting ${daysUntil} days could result in savings.`;
    }

    if (patterns.volatility > 0.1) {
      return `High price volatility detected. Consider purchasing within the next ${daysUntil} days.`;
    }

    return `Based on your preferences and market conditions, the next ${daysUntil} days offer optimal timing.`;
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  async getUserPredictions(userId: string, status?: PredictionStatus): Promise<any[]> {
    return prisma.purchaseNeed.findMany({
      where: {
        userId,
        ...(status && { status }),
        expiresAt: { gt: new Date() },
      },
      orderBy: { needScore: 'desc' },
    });
  }

  async acknowledgePrediction(predictionId: string): Promise<void> {
    await prisma.purchaseNeed.update({
      where: { id: predictionId },
      data: { status: PredictionStatus.ACKNOWLEDGED },
    });
  }

  async recordPredictionResult(
    predictionId: string,
    result: PurchaseResult,
    purchaseDate?: Date
  ): Promise<void> {
    await prisma.purchaseNeed.update({
      where: { id: predictionId },
      data: {
        status: PredictionStatus.PURCHASED,
        result,
        actualPurchaseDate: purchaseDate,
      },
    });
  }
}

export const predictiveBuyingService = new PredictiveBuyingService();
