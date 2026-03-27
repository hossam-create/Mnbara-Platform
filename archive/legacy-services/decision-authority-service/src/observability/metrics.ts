export interface MetricLabels {
  decision_source?: string;
  decision_status?: string;
  operation?: string;
  outcome?: string;
}

export interface Histogram {
  observe(value: number, labels?: MetricLabels): void;
}

export interface Counter {
  inc(value?: number, labels?: MetricLabels): void;
}

export interface Gauge {
  set(value: number, labels?: MetricLabels): void;
  inc(value?: number, labels?: MetricLabels): void;
  dec(value?: number, labels?: MetricLabels): void;
}

export interface MetricsCollector {
  histogram(name: string, help: string, labelNames?: string[]): Histogram;
  counter(name: string, help: string, labelNames?: string[]): Counter;
  gauge(name: string, help: string, labelNames?: string[]): Gauge;
  getMetrics(): string;
}

class InMemoryHistogram implements Histogram {
  private observations: Array<{ value: number; labels: MetricLabels; timestamp: number }> = [];

  constructor(private name: string, private labelNames: string[] = []) {}

  observe(value: number, labels: MetricLabels = {}): void {
    this.observations.push({ value, labels, timestamp: Date.now() });
  }

  getObservations() {
    return this.observations;
  }

  getName() {
    return this.name;
  }
}

class InMemoryCounter implements Counter {
  private value = 0;
  private labeledValues: Map<string, number> = new Map();

  constructor(private name: string, private labelNames: string[] = []) {}

  inc(value = 1, labels: MetricLabels = {}): void {
    if (Object.keys(labels).length === 0) {
      this.value += value;
    } else {
      const key = this.serializeLabels(labels);
      this.labeledValues.set(key, (this.labeledValues.get(key) || 0) + value);
    }
  }

  private serializeLabels(labels: MetricLabels): string {
    return JSON.stringify(labels);
  }

  getValue(labels?: MetricLabels): number {
    if (!labels || Object.keys(labels).length === 0) {
      return this.value;
    }
    return this.labeledValues.get(this.serializeLabels(labels)) || 0;
  }

  getName() {
    return this.name;
  }
}

class InMemoryGauge implements Gauge {
  private value = 0;
  private labeledValues: Map<string, number> = new Map();

  constructor(private name: string, private labelNames: string[] = []) {}

  set(value: number, labels: MetricLabels = {}): void {
    if (Object.keys(labels).length === 0) {
      this.value = value;
    } else {
      const key = this.serializeLabels(labels);
      this.labeledValues.set(key, value);
    }
  }

  inc(value = 1, labels: MetricLabels = {}): void {
    if (Object.keys(labels).length === 0) {
      this.value += value;
    } else {
      const key = this.serializeLabels(labels);
      this.labeledValues.set(key, (this.labeledValues.get(key) || 0) + value);
    }
  }

  dec(value = 1, labels: MetricLabels = {}): void {
    if (Object.keys(labels).length === 0) {
      this.value -= value;
    } else {
      const key = this.serializeLabels(labels);
      this.labeledValues.set(key, (this.labeledValues.get(key) || 0) - value);
    }
  }

  private serializeLabels(labels: MetricLabels): string {
    return JSON.stringify(labels);
  }

  getValue(labels?: MetricLabels): number {
    if (!labels || Object.keys(labels).length === 0) {
      return this.value;
    }
    return this.labeledValues.get(this.serializeLabels(labels)) || 0;
  }

  getName() {
    return this.name;
  }
}

class InMemoryMetricsCollector implements MetricsCollector {
  private histograms: Map<string, InMemoryHistogram> = new Map();
  private counters: Map<string, InMemoryCounter> = new Map();
  private gauges: Map<string, InMemoryGauge> = new Map();

  histogram(name: string, help: string, labelNames: string[] = []): Histogram {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new InMemoryHistogram(name, labelNames));
    }
    return this.histograms.get(name)!;
  }

  counter(name: string, help: string, labelNames: string[] = []): Counter {
    if (!this.counters.has(name)) {
      this.counters.set(name, new InMemoryCounter(name, labelNames));
    }
    return this.counters.get(name)!;
  }

  gauge(name: string, help: string, labelNames: string[] = []): Gauge {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new InMemoryGauge(name, labelNames));
    }
    return this.gauges.get(name)!;
  }

  getMetrics(): string {
    const lines: string[] = [];

    this.counters.forEach((counter) => {
      lines.push(`${counter.getName()} ${counter.getValue()}`);
    });

    this.gauges.forEach((gauge) => {
      lines.push(`${gauge.getName()} ${gauge.getValue()}`);
    });

    this.histograms.forEach((histogram) => {
      const observations = histogram.getObservations();
      if (observations.length > 0) {
        const sum = observations.reduce((acc, obs) => acc + obs.value, 0);
        const count = observations.length;
        lines.push(`${histogram.getName()}_sum ${sum}`);
        lines.push(`${histogram.getName()}_count ${count}`);
      }
    });

    return lines.join('\n');
  }

  reset(): void {
    this.histograms.clear();
    this.counters.clear();
    this.gauges.clear();
  }
}

export const metricsCollector = new InMemoryMetricsCollector();

export const decisionRequestLatency = metricsCollector.histogram(
  'decision_request_latency_ms',
  'Decision request latency in milliseconds',
  ['decision_source', 'decision_status']
);

export const decisionResolutionLatency = metricsCollector.histogram(
  'decision_resolution_latency_ms',
  'Decision resolution latency in milliseconds',
  ['decision_source', 'decision_status']
);

export const externalDecisionLatency = metricsCollector.histogram(
  'external_decision_latency_ms',
  'External decision API latency in milliseconds',
  ['operation', 'outcome']
);

export const decisionFailures = metricsCollector.counter(
  'decision_failures_total',
  'Total number of decision failures',
  ['decision_source', 'outcome']
);

export const circuitBreakerState = metricsCollector.gauge(
  'circuit_breaker_state',
  'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
  ['decision_source']
);

export const retryAttempts = metricsCollector.counter(
  'retry_attempts_total',
  'Total number of retry attempts',
  ['decision_source', 'outcome']
);

export const pollingBacklogSize = metricsCollector.gauge(
  'polling_backlog_size',
  'Number of decisions in polling backlog'
);

export const deadDecisionCleanupCount = metricsCollector.counter(
  'dead_decision_cleanup_total',
  'Total number of dead decisions cleaned up'
);

export const decisionsRequested = metricsCollector.counter(
  'decisions_requested_total',
  'Total number of decisions requested',
  ['decision_source']
);

export const decisionsApproved = metricsCollector.counter(
  'decisions_approved_total',
  'Total number of decisions approved',
  ['decision_source']
);

export const decisionsRejected = metricsCollector.counter(
  'decisions_rejected_total',
  'Total number of decisions rejected',
  ['decision_source']
);

export const decisionsExpired = metricsCollector.counter(
  'decisions_expired_total',
  'Total number of decisions expired',
  ['decision_source']
);
