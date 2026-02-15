/**
 * Plugin Metrics
 * 
 * Metrics collection and analysis for MNBara plugins
 */

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
  RATE = 'rate'
}

export interface MetricValue {
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface MetricData {
  name: string;
  type: MetricType;
  values: MetricValue[];
  labels?: Record<string, string>;
  description?: string;
  unit?: string;
}

export interface MetricAggregation {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
  stddev: number;
}

export interface PluginMetricsCollector {
  // Basic metrics
  counter: (name: string, value?: number, tags?: Record<string, string>) => void;
  gauge: (name: string, value: number, tags?: Record<string, string>) => void;
  histogram: (name: string, value: number, tags?: Record<string, string>) => void;
  timer: (name: string, duration: number, tags?: Record<string, string>) => void;
  rate: (name: string, value: number, tags?: Record<string, string>) => void;
  
  // Timer helpers
  startTimer: (name: string, tags?: Record<string, string>) => Timer;
  time: <T>(name: string, fn: () => T | Promise<T>, tags?: Record<string, string>) => Promise<T>;
  
  // Metric management
  getMetric: (name: string) => MetricData | undefined;
  getAllMetrics: () => MetricData[];
  getMetricNames: () => string[];
  
  // Aggregation
  getAggregation: (name: string, window?: number) => MetricAggregation | undefined;
  getAggregations: (window?: number) => Record<string, MetricAggregation>;
  
  // Export/Import
  export: () => Record<string, any>;
  import: (data: Record<string, any>) => void;
  
  // Cleanup
  clear: (name?: string) => void;
  reset: () => void;
  
  // Configuration
  configure: (options: MetricsConfig) => void;
  getConfig: () => MetricsConfig;
}

export interface Timer {
  end: (tags?: Record<string, string>) => number;
  getDuration: () => number;
}

export interface MetricsConfig {
  enabled: boolean;
  bufferSize: number;
  flushInterval: number;
  aggregationWindow: number;
  retentionPeriod: number;
  maxMetrics: number;
  tags: Record<string, string>;
}

export class DefaultPluginMetricsCollector implements PluginMetricsCollector {
  private metrics: Map<string, MetricData> = new Map();
  private config: MetricsConfig;
  private timers: Map<string, Timer> = new Map();

  constructor(config?: Partial<MetricsConfig>) {
    this.config = {
      enabled: true,
      bufferSize: 1000,
      flushInterval: 60000, // 1 minute
      aggregationWindow: 300000, // 5 minutes
      retentionPeriod: 3600000, // 1 hour
      maxMetrics: 10000,
      tags: {},
      ...config
    };
  }

  counter(name: string, value: number = 1, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;
    this.addMetricValue(name, MetricType.COUNTER, value, tags);
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;
    this.addMetricValue(name, MetricType.GAUGE, value, tags);
  }

  histogram(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;
    this.addMetricValue(name, MetricType.HISTOGRAM, value, tags);
  }

  timer(name: string, duration: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;
    this.addMetricValue(name, MetricType.TIMER, duration, tags);
  }

  rate(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;
    this.addMetricValue(name, MetricType.RATE, value, tags);
  }

  startTimer(name: string, tags?: Record<string, string>): Timer {
    const startTime = Date.now();
    const timerId = `${name}_${startTime}`;
    
    const timer: Timer = {
      end: (endTags?: Record<string, string>) => {
        const duration = Date.now() - startTime;
        const finalTags = { ...tags, ...endTags };
        this.timer(name, duration, finalTags);
        this.timers.delete(timerId);
        return duration;
      },
      getDuration: () => Date.now() - startTime
    };

    this.timers.set(timerId, timer);
    return timer;
  }

  async time<T>(name: string, fn: () => T | Promise<T>, tags?: Record<string, string>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.timer(name, duration, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.timer(`${name}_error`, duration, tags);
      throw error;
    }
  }

  getMetric(name: string): MetricData | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): MetricData[] {
    return Array.from(this.metrics.values());
  }

  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  getAggregation(name: string, window: number = this.config.aggregationWindow): MetricAggregation | undefined {
    const metric = this.metrics.get(name);
    if (!metric) {
      return undefined;
    }

    const now = Date.now();
    const cutoff = now - window;
    const values = metric.values
      .filter(value => value.timestamp.getTime() >= cutoff)
      .map(value => value.value);

    if (values.length === 0) {
      return undefined;
    }

    return this.calculateAggregation(values);
  }

  getAggregations(window: number = this.config.aggregationWindow): Record<string, MetricAggregation> {
    const aggregations: Record<string, MetricAggregation> = {};
    
    for (const name of this.metrics.keys()) {
      const aggregation = this.getAggregation(name, window);
      if (aggregation) {
        aggregations[name] = aggregation;
      }
    }

    return aggregations;
  }

  export(): Record<string, any> {
    const data: Record<string, any> = {
      config: this.config,
      metrics: {}
    };

    for (const [name, metric] of this.metrics.entries()) {
      data.metrics[name] = {
        ...metric,
        values: metric.values.map(value => ({
          ...value,
          timestamp: value.timestamp.toISOString()
        }))
      };
    }

    return data;
  }

  import(data: Record<string, any>): void {
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }

    if (data.metrics) {
      for (const [name, metricData] of Object.entries(data.metrics)) {
        const metric = metricData as MetricData;
        metric.values = metric.values.map(value => ({
          ...value,
          timestamp: new Date(value.timestamp)
        }));
        this.metrics.set(name, metric);
      }
    }
  }

  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  reset(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  configure(options: MetricsConfig): void {
    this.config = options;
  }

  getConfig(): MetricsConfig {
    return { ...this.config };
  }

  private addMetricValue(name: string, type: MetricType, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;

    let metric = this.metrics.get(name);
    if (!metric) {
      metric = {
        name,
        type,
        values: [],
        labels: { ...this.config.tags, ...tags }
      };
      this.metrics.set(name, metric);
    }

    const metricValue: MetricValue = {
      value,
      timestamp: new Date(),
      tags: { ...this.config.tags, ...tags }
    };

    metric.values.push(metricValue);

    // Limit buffer size
    if (metric.values.length > this.config.bufferSize) {
      metric.values = metric.values.slice(-this.config.bufferSize);
    }

    // Limit total metrics
    if (this.metrics.size > this.config.maxMetrics) {
      const oldestMetric = Array.from(this.metrics.keys())[0];
      this.metrics.delete(oldestMetric);
    }
  }

  private calculateAggregation(values: number[]): MetricAggregation {
    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    
    const median = count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];
    
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];
    
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / count;
    const stddev = Math.sqrt(variance);

    return {
      count,
      sum,
      min,
      max,
      avg,
      median,
      p95,
      p99,
      stddev
    };
  }
}