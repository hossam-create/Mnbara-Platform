import { Request, Response } from 'express';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a Registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// ============================================================
// HTTP METRICS
// ============================================================

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// ============================================================
// EXCHANGE REQUEST METRICS
// ============================================================

export const exchangeRequestsCreated = new Counter({
  name: 'exchange_requests_created_total',
  help: 'Total number of exchange requests created',
  labelNames: ['from_currency', 'to_currency'],
  registers: [register],
});

export const exchangeRequestsCompleted = new Counter({
  name: 'exchange_requests_completed_total',
  help: 'Total number of exchange requests completed',
  labelNames: ['from_currency', 'to_currency', 'status'],
  registers: [register],
});

export const exchangeRequestDuration = new Histogram({
  name: 'exchange_request_duration_seconds',
  help: 'Duration from request creation to completion',
  labelNames: ['from_currency', 'to_currency'],
  buckets: [60, 300, 600, 1800, 3600, 7200, 14400, 28800, 86400], // 1min to 24h
  registers: [register],
});

export const exchangeRequestAmount = new Histogram({
  name: 'exchange_request_amount',
  help: 'Amount of exchange requests',
  labelNames: ['from_currency', 'to_currency'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [register],
});

export const activeExchangeRequests = new Gauge({
  name: 'active_exchange_requests',
  help: 'Number of active exchange requests',
  labelNames: ['status'],
  registers: [register],
});

// ============================================================
// MATCHING ENGINE METRICS
// ============================================================

export const matchesCreated = new Counter({
  name: 'matches_created_total',
  help: 'Total number of matches created',
  labelNames: ['match_type'],
  registers: [register],
});

export const matchingEngineDuration = new Histogram({
  name: 'matching_engine_duration_seconds',
  help: 'Duration of matching engine execution',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

export const matchScore = new Histogram({
  name: 'match_score',
  help: 'Match score distribution',
  buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [register],
});

export const activeMatches = new Gauge({
  name: 'active_matches',
  help: 'Number of active matches',
  labelNames: ['status'],
  registers: [register],
});

// ============================================================
// SETTLEMENT METRICS
// ============================================================

export const settlementsInitiated = new Counter({
  name: 'settlements_initiated_total',
  help: 'Total number of settlements initiated',
  labelNames: ['method', 'provider'],
  registers: [register],
});

export const settlementsCompleted = new Counter({
  name: 'settlements_completed_total',
  help: 'Total number of settlements completed',
  labelNames: ['method', 'provider', 'status'],
  registers: [register],
});

export const settlementDuration = new Histogram({
  name: 'settlement_duration_seconds',
  help: 'Duration of settlement process',
  labelNames: ['method', 'provider'],
  buckets: [60, 300, 600, 1800, 3600, 7200, 14400], // 1min to 4h
  registers: [register],
});

export const settlementRetries = new Counter({
  name: 'settlement_retries_total',
  help: 'Total number of settlement retries',
  labelNames: ['provider'],
  registers: [register],
});

// ============================================================
// SECURITY METRICS
// ============================================================

export const securityDepositsCreated = new Counter({
  name: 'security_deposits_created_total',
  help: 'Total number of security deposits created',
  labelNames: ['currency'],
  registers: [register],
});

export const securityDepositsFrozen = new Counter({
  name: 'security_deposits_frozen_total',
  help: 'Total number of security deposits frozen',
  labelNames: ['reason'],
  registers: [register],
});

export const trustLevelUpgrades = new Counter({
  name: 'trust_level_upgrades_total',
  help: 'Total number of trust level upgrades',
  labelNames: ['from_level', 'to_level'],
  registers: [register],
});

export const trustLevelDowngrades = new Counter({
  name: 'trust_level_downgrades_total',
  help: 'Total number of trust level downgrades',
  labelNames: ['from_level', 'to_level'],
  registers: [register],
});

export const fraudDetections = new Counter({
  name: 'fraud_detections_total',
  help: 'Total number of fraud detections',
  labelNames: ['type'],
  registers: [register],
});

// ============================================================
// COMMUNICATION METRICS
// ============================================================

export const messagesExchanged = new Counter({
  name: 'messages_exchanged_total',
  help: 'Total number of messages exchanged',
  registers: [register],
});

export const messagesFlagged = new Counter({
  name: 'messages_flagged_total',
  help: 'Total number of messages flagged',
  labelNames: ['reason'],
  registers: [register],
});

export const externalContactDetections = new Counter({
  name: 'external_contact_detections_total',
  help: 'Total number of external contact detections',
  registers: [register],
});

// ============================================================
// EXTERNAL PROVIDER METRICS
// ============================================================

export const externalProviderCalls = new Counter({
  name: 'external_provider_calls_total',
  help: 'Total number of external provider API calls',
  labelNames: ['provider', 'endpoint', 'status'],
  registers: [register],
});

export const externalProviderDuration = new Histogram({
  name: 'external_provider_duration_seconds',
  help: 'Duration of external provider API calls',
  labelNames: ['provider', 'endpoint'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const externalProviderErrors = new Counter({
  name: 'external_provider_errors_total',
  help: 'Total number of external provider errors',
  labelNames: ['provider', 'error_type'],
  registers: [register],
});

// ============================================================
// BUSINESS METRICS
// ============================================================

export const totalVolume = new Counter({
  name: 'total_volume',
  help: 'Total exchange volume',
  labelNames: ['currency'],
  registers: [register],
});

export const platformFees = new Counter({
  name: 'platform_fees_total',
  help: 'Total platform fees collected',
  labelNames: ['currency'],
  registers: [register],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  labelNames: ['period'],
  registers: [register],
});

// ============================================================
// METRICS ENDPOINT
// ============================================================

export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const recordHttpRequest = (method: string, route: string, statusCode: number, duration: number) => {
  httpRequestTotal.inc({ method, route, status_code: statusCode });
  httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
};

export const recordExchangeRequest = (fromCurrency: string, toCurrency: string, amount: number) => {
  exchangeRequestsCreated.inc({ from_currency: fromCurrency, to_currency: toCurrency });
  exchangeRequestAmount.observe({ from_currency: fromCurrency, to_currency: toCurrency }, amount);
};

export const recordMatch = (matchType: string, score: number) => {
  matchesCreated.inc({ match_type: matchType });
  matchScore.observe({}, score);
};

export const recordSettlement = (method: string, provider: string, duration: number, status: string) => {
  settlementsCompleted.inc({ method, provider, status });
  settlementDuration.observe({ method, provider }, duration);
};

export const recordFraudDetection = (type: string) => {
  fraudDetections.inc({ type });
};

export const recordExternalProviderCall = (
  provider: string,
  endpoint: string,
  status: string,
  duration: number
) => {
  externalProviderCalls.inc({ provider, endpoint, status });
  externalProviderDuration.observe({ provider, endpoint }, duration);
};
