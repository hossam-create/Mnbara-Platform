export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface RetryContext {
  attempt: number;
  lastError?: Error;
}

export class RetryStrategy {
  private readonly config: RetryConfig;
  private readonly name: string;

  constructor(name: string, config: RetryConfig) {
    this.name = name;
    this.config = config;
  }

  async execute<T>(
    fn: () => Promise<T>,
    isRetryable: (error: Error) => boolean = () => true
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await fn();
        
        if (attempt > 0) {
          console.log(`[RetryStrategy:${this.name}] Success on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.config.maxRetries) {
          console.error(`[RetryStrategy:${this.name}] Max retries (${this.config.maxRetries}) exceeded`);
          throw error;
        }

        if (!isRetryable(lastError)) {
          console.log(`[RetryStrategy:${this.name}] Error not retryable, failing immediately`);
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        console.log(`[RetryStrategy:${this.name}] Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Retry failed');
  }

  private calculateDelay(attempt: number): number {
    const delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt);
    return Math.min(delay, this.config.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
