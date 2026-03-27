/**
 * Global Market Signals Service
 * READ-ONLY - No Predictions, No Auto-Optimization
 *
 * HARD RULES:
 * - No prediction claims
 * - No auto-optimization
 * - No trading signals
 * - Historical/current data only
 * - Informational purposes only
 */

import { createHash, randomUUID } from 'crypto';
import { getFeatureFlags } from '../config/feature-flags';
import {
  SignalType,
  MarketSignal,
  PriceRangeSignal,
  CorridorCongestionSignal,
  SeasonalDemandSignal,
  TravelerAvailabilitySignal,
  DeliveryTimeSignal,
  MarketSignalsResponse,
  MarketTrendsResponse,
  MarketTrend,
  HistoricalDataPoint,
  MarketSignalDisclaimer,
  MarketSignalsQuery,
  MarketTrendsQuery,
  MarketSignalAuditEntry,
  MarketSignalsHealth,
  SeasonalPeriod,
} from '../types/market-signals.types';

// ===============================