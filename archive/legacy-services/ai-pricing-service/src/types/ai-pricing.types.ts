// AI Pricing Service Types
// Shared types for the AI Pricing Service

// ==========================================
// ENUMS (mirrored from Prisma schema)
// ==========================================

export enum TargetType {
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  BRAND = 'BRAND',
  REGION = 'REGION',
  STORE = 'STORE',
  OVERALL = 'OVERALL',
}

export enum TriggerType {
  REPLENISHMENT = 'REPLENISHMENT',
  SEASONAL = 'SEASONAL',
  TREND = 'TREND',
  PRICE_DROP = 'PRICE_DROP',
  SOCIAL_PROOF = 'SOCIAL_PROOF',
  CART_REMINDER = 'CART_REMINDER',
  WISHLIST = 'WISHLIST',
  RECURRING = 'RECURRING',
  EVENT = 'EVENT',
  LIFESTYLE = 'LIFESTYLE',
}

export enum Urgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum PredictionStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PURCHASED = 'PURCHASED',
  EXPIRED = 'EXPIRED',
  DISMISSED = 'DISMISSED',
}

export enum PurchaseResult {
  PURCHASED = 'PURCHASED',
  NOT_PURCHASED = 'NOT_PURCHASED',
  PURCHASED_ELSEWHERE = 'PURCHASED_ELSEWHERE',
}

export enum TrendType {
  DEMAND_TREND = 'DEMAND_TREND',
  PRICE_TREND = 'PRICE_TREND',
  SALES_TREND = 'SALES_TREND',
  SEARCH_TREND = 'SEARCH_TREND',
  SOCIAL_TREND = 'SOCIAL_TREND',
}

export enum TrendDirection {
  RISING = 'RISING',
  STABLE = 'STABLE',
  FALLING = 'FALLING',
  VOLATILE = 'VOLATILE',
}

export enum PeriodType {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum InsightType {
  PRICE_DROP = 'PRICE_DROP',
  DEMAND_SPIKE = 'DEMAND_SPIKE',
  SUPPLY_ISSUE = 'SUPPLY_ISSUE',
  TREND_ALERT = 'TREND_ALERT',
  COMPETITOR_MOVE = 'COMPETITOR_MOVE',
  SEASONAL_OPPORTUNITY = 'SEASONAL_OPPORTUNITY',
  MARKET_ENTRY = 'MARKET_ENTRY',
  NEW_COMPETITOR = 'NEW_COMPETITOR',
  REGULATORY_CHANGE = 'REGULATORY_CHANGE',
  ECONOMIC_INDICATOR = 'ECONOMIC_INDICATOR',
}

export enum ImpactLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum PriceAlertType {
  PRICE_DROP = 'PRICE_DROP',
  PRICE_INCREASE = 'PRICE_INCREASE',
  TARGET_PRICE_REACHED = 'TARGET_PRICE_REACHED',
  DISCOUNT_AVAILABLE = 'DISCOUNT_AVAILABLE',
  PRICE_BACK_IN_STOCK = 'PRICE_BACK_IN_STOCK',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  NOTIFIED = 'NOTIFIED',
  EXPIRED = 'EXPIRED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}

export enum PricingRuleType {
  DEMAND_BASED = 'DEMAND_BASED',
  COMPETITION_BASED = 'COMPETITION_BASED',
  TIME_BASED = 'TIME_BASED',
  INVENTORY_BASED = 'INVENTORY_BASED',
  MARGIN_BASED = 'MARGIN_BASED',
  PROMOTIONAL = 'PROMOTIONAL',
  CLEARANCE = 'CLEARANCE',
  PREMIUM = 'PREMIUM',
  PSYCHOLOGICAL = 'PSYCHOLOGICAL',
}

export enum PricingAction {
  SET_FIXED = 'SET_FIXED',
  SET_PERCENTAGE = 'SET_PERCENTAGE',
  INCREASE_PERCENTAGE = 'INCREASE_PERCENTAGE',
  DECREASE_PERCENTAGE = 'DECREASE_PERCENTAGE',
  MATCH_LOWEST = 'MATCH_LOWEST',
  BEAT_LOWEST = 'BEAT_LOWEST',
  ADD_MARGIN = 'ADD_MARGIN',
  SET_PSYCHOLOGICAL = 'SET_PSYCHOLOGICAL',
}

export enum OptimizationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  APPLIED = 'APPLIED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PriceRecommendation {
  INCREASE_PRICE = 'INCREASE_PRICE',
  DECREASE_PRICE = 'DECREASE_PRICE',
  MAINTAIN_PRICE = 'MAINTAIN_PRICE',
  DYNAMIC_ADJUST = 'DYNAMIC_ADJUST',
  NO_DATA = 'NO_DATA',
}

export enum ExperimentStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ==========================================
// PREDICTIVE BUYING TYPES
// ==========================================

export interface UserBehaviorProfile {
  id: string;
  userId: string;
  avgPurchaseInterval: number;
  preferredCategories: string[];
  priceRangeMin: number;
  priceRangeMax: number;
  preferredDaysOfWeek: number[];
  preferredHours: number[];
  totalSessions: number;
  avgSessionDuration: number;
  cartAbandonmentRate: number;
  wishlistConversionRate: number;
  behaviorScore: number;
  predictedLTV?: number;
  seasonalMultiplier?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseNeed {
  id: string;
  userId: string;
  targetType: TargetType;
  targetId: string;
  targetName: string;
  needScore: number;
  urgency: Urgency;
  predictedPrice?: number;
  confidence: number;
  predictedPurchaseDate?: Date;
  optimalPurchaseWindow?: Date;
  purchaseDeadline?: Date;
  triggerType?: TriggerType;
  triggerDetails?: Record<string, any>;
  status: PredictionStatus;
  result?: PurchaseResult;
  actualPurchaseDate?: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface PurchaseSuggestion {
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

export interface PurchaseTimingResult {
  recommendedDate: Date;
  confidence: number;
  reasoning: string;
  priceForecast: {
    date: Date;
    predictedPrice: number;
    confidence: number;
  }[];
}

// ==========================================
// DYNAMIC PRICING TYPES
// ==========================================

export interface PriceInput {
  productId: string;
  basePrice: number;
  costPrice?: number;
  categoryId?: string;
  brandId?: string;
  inventoryLevel?: number;
  targetMargin?: number;
}

export interface PriceScenario {
  price: number;
  expectedDemand: number;
  expectedRevenue: number;
  conversionRate: number;
  margin: number;
  competitiveness: number;
}

export interface OptimizationResult {
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

export interface CompetitiveSuggestion {
  suggestedPrice: number;
  floorPrice: number;
  ceilingPrice: number;
  strategy: string;
  reasoning: string;
}

export interface PriceRule {
  id: string;
  ruleType: PricingRuleType;
  targetType: TargetType;
  targetId?: string;
  conditions: RuleCondition[];
  actionType: PricingAction;
  actionValue: number;
  actionMax?: number;
  minPrice?: number;
  maxPrice?: number;
  priority: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export interface RuleCondition {
  type: string;
  operator: string;
  value: any;
  min?: number;
  max?: number;
}

// ==========================================
// MARKET INTELLIGENCE TYPES
// ==========================================

export interface MarketTrend {
  id: string;
  targetType: TargetType;
  targetId: string;
  targetName: string;
  trendType: TrendType;
  direction: TrendDirection;
  strength: number;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  keyDrivers?: string[];
  sentimentScore?: number;
}

export interface PriceIndex {
  id: string;
  categoryId?: string;
  categoryName?: string;
  indexValue: number;
  indexChange: number;
  avgPrice: number;
  avgPriceChange: number;
  priceVariance: number;
  totalVolume?: number;
  competitionIndex?: number;
  periodDate: Date;
}

export interface DemandForecast {
  id: string;
  targetType: TargetType;
  targetId: string;
  targetName: string;
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  predictedDemand: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  modelVersion: string;
  features: Record<string, any>;
  actualDemand?: number;
  accuracy?: number;
}

export interface MarketInsight {
  id: string;
  insightType: InsightType;
  title: string;
  description: string;
  targetType?: TargetType;
  targetId?: string;
  targetName?: string;
  impactLevel: ImpactLevel;
  affectedUsers?: number;
  action?: string;
  actionUrl?: string;
  data?: Record<string, any>;
  expiresAt: Date;
}

export interface MarketOverview {
  marketSize: number;
  marketGrowth: number;
  avgPrice: number;
  priceChange: number;
  topSellers: any[];
  topCategories: any[];
  demandIndex: number;
  competitionLevel: number;
}

export interface PriceStats {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  avgDiscount: number;
  volatility: number;
  trend: 'rising' | 'stable' | 'falling';
}

// ==========================================
// API REQUEST/RESPONSE TYPES
// ==========================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

export interface PriceAlertRequest {
  userId: string;
  productId: string;
  alertType: PriceAlertType;
  targetPrice?: number;
  discountPercentage?: number;
}

export interface TrendAnalysisRequest {
  targetType: TargetType;
  targetId: string;
  trendTypes?: TrendType[];
  periodType?: PeriodType;
  limit?: number;
}

export interface DemandForecastRequest {
  targetType: TargetType;
  targetId: string;
  targetName: string;
  periodType: PeriodType;
  periods?: number;
}
