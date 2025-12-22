/**
 * Global Market Signals Types
 * READ-ONLY - No Predictions, No Auto-Optimization
 *
 * HARD RULES:
 * - No prediction claims
 * - No auto-optimization
 * - No trading signals
 * - Historical/current data only
 * - Informational purposes only
 */

// ===========================================
// Signal Types
// ===========================================

export type SignalType =
  | 'PRICE_RANGE'
  | 'CORRIDOR_CONGESTION'
  | 'SEASONAL_DEMAND'
  | 'TRAVELER_AVAILABILITY'
  | 'DELIVERY_TIME';

export type SignalStrength = 'WEAK' | 'MODERATE' | 'STRONG';

export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';

// ===========================================
// Price Range Signal
// ===========================================

export interface PriceRangeSignal {
  signalId: string;
  type: 'PRICE_RANGE';
  corridor: string;
  category?: string;
  timestamp: string;
  data: {
    minPrice: number;
    maxPrice: number;
    medianPrice: number;
    averagePrice: number;
    currency: string;
    sampleSize: number;
    periodDays: number;
  };
  context: string;
  disclaimer: MarketSignalDisclaimer;
}

// ===========================================
// Corridor Congestion Signal
// ===========================================

export interface CorridorCongestionSignal {
  signalId: string;
  type: 'CORRIDOR_CONGESTION';
  corridor: string;
  timestamp: string;
  data: {
    congestionLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    activeRequests: number;
    availableTravelers: number;
    ratio: number; // requests per traveler
    averageWaitDays: number;
  };
  context: string;
  disclaimer: MarketSignalDisclaimer;
}

// ===========================================
// Seasonal Demand Signal
// ===========================================

export interface SeasonalDemandSignal {
  signalId: string;
  type: 'SEASONAL_DEMAND';
  corridor: string;
  timestamp: string;
  data: {
    currentDemand: 'LOW' | 'NORMAL' | 'HIGH' | 'PEAK';
    historicalComparison: number; // % vs same period last year
    seasonalFactor: string; // e.g., "Holiday Season", "Back to School"
    peakPeriods: SeasonalPeriod[];
  };
  context: string;
  disclaimer: MarketSignalDisclaimer;
}

export interface SeasonalPeriod {
  name: string;
  startMonth: number;
  endMonth: number;
  demandMultiplier: number;
  description: string;
}

// ===========================================
// Traveler Availability Signal
// ===========================================

export interface TravelerAvailabilitySignal {
  signalId: string;
  type: 'TRAVELER_AVAILABILITY';
  corridor: string;
  timestamp: string;
  data: {
    availabilityLevel: 'SCARCE' | 'LIMITED' | 'ADEQUATE' | 'ABUNDANT';
    activeTravelers: number;
    averageCapacity: number;
    nextAvailableWindow?: string;
  };
  context: string;
  disclaimer: MarketSignalDisclaimer;
}

// ===========================================
// Delivery Time Signal
// ===========================================

export interface DeliveryTimeSignal {
  signalId: string;
  type: 'DELIVERY_TIME';
  corridor: string;
  timestamp: string;
  data: {
    estimatedMinDays: number;
    estimatedMaxDays: number;
    averageDays: number;
    reliabilityScore: number; // 0-100
    sampleSize: number;
  };
  context: string;
  disclaimer: MarketSignalDisclaimer;
}

// ===========================================
// Combined Signal Types
// ===========================================

export type MarketSignal =
  | PriceRangeSignal
  | CorridorCongestionSignal
  | SeasonalDemandSignal
  | TravelerAvailabilitySignal
  | DeliveryTimeSignal;

// ===========================================
// Market Signals Response
// ===========================================

export interface MarketSignalsResponse {
  requestId: string;
  corridor: string;
  timestamp: string;
  signals: MarketSignal[];
  summary: MarketSummary;
  disclaimer: MarketSignalDisclaimer;
}

export interface MarketSummary {
  overallActivity: 'LOW' | 'MODERATE' | 'HIGH';
  keyInsights: string[];
  dataFreshness: string;
  limitations: string[];
}

// ===========================================
// Market Trends Response
// ===========================================

export interface MarketTrendsResponse {
  requestId: string;
  corridor: string;
  timestamp: string;
  periodDays: number;
  trends: MarketTrend[];
  historicalData: HistoricalDataPoint[];
  disclaimer: MarketSignalDisclaimer;
}

export interface MarketTrend {
  metric: string;
  direction: TrendDirection;
  changePercent: number;
  strength: SignalStrength;
  description: string;
  dataPoints: number;
}

export interface HistoricalDataPoint {
  date: string;
  metric: string;
  value: number;
  context?: string;
}

// ===========================================
// Disclaimer (Always Present)
// ===========================================

export interface MarketSignalDisclaimer {
  type: 'MARKET_SIGNAL_ADVISORY';
  text: string;
  isInformationalOnly: true;
  noPredictionClaims: true;
  noAutoOptimization: true;
  noTradingSignals: true;
  historicalDataOnly: true;
  timestamp: string;
}

// ===========================================
// Query Types
// ===========================================

export interface MarketSignalsQuery {
  corridor: string;
  signalTypes?: SignalType[];
  category?: string;
  periodDays?: number;
}

export interface MarketTrendsQuery {
  corridor: string;
  periodDays?: number;
  metrics?: string[];
}

// ===========================================
// Audit Types
// ===========================================

export interface MarketSignalAuditEntry {
  id: string;
  requestId: string;
  action: 'SIGNALS_REQUESTED' | 'TRENDS_REQUESTED';
  corridor: string;
  timestamp: string;
  signalTypes?: SignalType[];
  metadata?: Record<string, unknown>;
}

// ===========================================
// Health Types
// ===========================================

export interface MarketSignalsHealth {
  status: 'healthy' | 'degraded' | 'disabled';
  timestamp: string;
  featureFlags: {
    marketSignalsEnabled: boolean;
    emergencyDisabled: boolean;
  };
  dataFreshness: {
    lastUpdate: string;
    staleness: 'FRESH' | 'STALE' | 'VERY_STALE';
  };
  version: string;
}
