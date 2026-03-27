/**
 * Retry Handler - Implements exponential backoff retry logic
 */

import { RetryConfig } from './types';

export class RetryHandler {
  private readonly config: RetryConfig;
  private readonly logger: any;

  constructor(config: Partial<RetryConfig> = {}, logger?: any) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      initialDelayMs: config.initialDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 30000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
    };
    this.logger = logger || console;
  }

  /**
   * Calculate delay for retry attempt
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt);
    const delayWithJitter = exponentialDelay * (0.5 + Math.random() * 0.5);
    return Math.min(delayWithJitter, this.config.maxDelayMs);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: any): boolean {
    // Retry on network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // Retry on 5xx errors
    if (error.response?.status >= 500) {
      return true;
    }

    // Retry on 429 (Too Many Requests)
    if (error.response?.status === 429) {
      return true;
    }

    // Don't retry on 4xx errors (except 429)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false;
    }

    return true;
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(fn: () => Promise<T>, operationName: string = 'operation'): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === this.config.maxRetries) {
          this.logger.error(`${operationName} failed after ${this.config.maxRetries} retries`, error);
          throw error;
        }

        if (!this.isRetryable(error)) {
          this.logger.error(`${operationName} failed with non-retryable error`, error);
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        this.logger.warn(
          `${operationName} failed (attempt ${attempt + 1}/${this.config.maxRetries + 1}), retrying in ${delay}ms`,
          error.message
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Get current retry configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

export const createRetryHandler = (config?: Partial<RetryConfig>, logger?: any): RetryHandler => {
  return new RetryHandler(config, logger);
};
