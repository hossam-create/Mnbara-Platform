export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  rollingWindowMs: number;
}

interface CircuitBreakerStats {
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastStateChange: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private stats: CircuitBreakerStats = {
    failures: 0,
    successes: 0,
    lastStateChange: Date.now()
  };
  private readonly config: CircuitBreakerConfig;
  private readonly name: string;

  constructor(name: string, config: CircuitBreakerConfig) {
    this.name = name;
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error(`Circuit breaker [${this.name}] is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.stats.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.stats.successes++;
      if (this.stats.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  private onFailure(): void {
    this.stats.failures++;
    this.stats.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      if (this.stats.failures >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  private shouldAttemptReset(): boolean {
    const now = Date.now();
    const timeSinceOpen = now - this.stats.lastStateChange;
    return timeSinceOpen >= this.config.timeout;
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.stats.lastStateChange = Date.now();

    if (newState === CircuitState.CLOSED) {
      this.stats.failures = 0;
      this.stats.successes = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.stats.successes = 0;
    }

    console.log(`[CircuitBreaker:${this.name}] State transition: ${oldState} → ${newState}`);
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): Readonly<CircuitBreakerStats> {
    return { ...this.stats };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.stats = {
      failures: 0,
      successes: 0,
      lastStateChange: Date.now()
    };
  }
}
