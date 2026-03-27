import { Counter, Histogram, Gauge, register } from 'prom-client';

// Decision request counter
export const decisionRequestsTotal = new Counter({
  name: 'decision_requests_total',
  help: 'Total number of decision requests',
  labelNames: ['asset_type', 'source'],
});

// Decision request duration histogram
export const decisionRequestDuration = new Histogram({
  name: 'decision_requests_duration_ms',
  help: 'Decision request duration in milliseconds',
  labelNames: ['asset_type', 'status'],
  buckets: [10, 50, 100, 500, 1000, 2000, 5000, 10000],
});

// Decision status distribution gauge
export const decisionStatusDistribution = new Gauge({
  name: 'decision_status_distribution',
  help: 'Distribution of decision statuses',
  labelNames: ['status'],
});

// Decision errors counter
export const decisionErrorsTotal = new Counter({
  name: 'decision_errors_total',
  help: 'Total number of decision errors',
  labelNames: ['error_type', 'asset_type'],
});

// Custodii API errors counter
export const custodiiApiErrorsTotal = new Counter({
  name: 'custodii_api_errors_total',
  help: 'Total number of Custodii API errors',
  labelNames: ['error_type', 'status_code'],
});

// Decision polling counter
export const decisionPollingTotal = new Counter({
  name: 'decision_polling_total',
  help: 'Total number of decision polling attempts',
  labelNames: ['status'],
});

// Active decisions gauge
export const activeDecisionsGauge = new Gauge({
  name: 'active_decisions',
  help: 'Number of active pending decisions',
  labelNames: ['asset_type'],
});

// Database query duration histogram
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_ms',
  help: 'Database query duration in milliseconds',
  labelNames: ['operation', 'table'],
  buckets: [1, 5, 10, 50, 100, 500, 1000],
});

// Cache hit rate gauge
export const cacheHitRate = new Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_type'],
});

// Metrics collection functions
export const metrics = {
  // Record decision request
  recordDecisionRequest: (assetType: string, source: string) => {
    decisionRequestsTotal.labels(assetType, source).inc();
  },

  // Record decision duration
  recordDecisionDuration: (assetType: string, status: string, duration: number) => {
    decisionRequestDuration.labels(assetType, status).observe(duration);
  },

  // Update decision status distribution
  updateStatusDistribution: (status: string, count: number) => {
    decisionStatusDistribution.labels(status).set(count);
  },

  // Record decision error
  recordDecisionError: (errorType: string, assetType: string) => {
    decisionErrorsTotal.labels(errorType, assetType).inc();
  },

  // Record Custodii API error
  recordCustodiiApiError: (errorType: string, statusCode: string) => {
    custodiiApiErrorsTotal.labels(errorType, statusCode).inc();
  },

  // Record polling attempt
  recordPollingAttempt: (status: string) => {
    decisionPollingTotal.labels(status).inc();
  },

  // Update active decisions
  updateActiveDecisions: (assetType: string, count: number) => {
    activeDecisionsGauge.labels(assetType).set(count);
  },

  // Record database query
  recordDbQuery: (operation: string, table: string, duration: number) => {
    dbQueryDuration.labels(operation, table).observe(duration);
  },

  // Update cache hit rate
  updateCacheHitRate: (cacheType: string, rate: number) => {
    cacheHitRate.labels(cacheType).set(rate);
  },

  // Get all metrics
  getMetrics: async () => {
    return register.metrics();
  },

  // Get metrics as JSON
  getMetricsJson: async () => {
    const metrics = await register.metrics();
    return metrics;
  },
};

export default metrics;
