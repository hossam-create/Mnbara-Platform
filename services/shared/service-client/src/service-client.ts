/**
 * Service Client - Main HTTP client for service-to-service communication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { ServiceConfig, RequestOptions, ServiceResponse, ServiceError } from './types';
import { RetryHandler } from './retry-handler';
import { CircuitBreaker } from './circuit-breaker';

export class ServiceClient {
  private axiosInstance: AxiosInstance;
  private retryHandler: RetryHandler;
  private circuitBreaker: CircuitBreaker;
  private readonly config: ServiceConfig;
  private readonly logger: any;

  constructor(config: ServiceConfig, logger?: any) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
    this.logger = logger || console;

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.retryHandler = new RetryHandler(
      {
        maxRetries: this.config.retries,
        initialDelayMs: this.config.retryDelay,
      },
      this.logger
    );

    this.circuitBreaker = new CircuitBreaker(this.config.name, undefined, this.logger);

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      config => {
        (config as any).metadata = { startTime: Date.now() };
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      response => {
        const metadata = (response.config as any).metadata;
        const duration = metadata ? Date.now() - metadata.startTime : 0;

        this.logger.debug(
          `[${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`
        );

        this.circuitBreaker.recordSuccess();
        return response;
      },
      error => {
        const config = error.config;
        const metadata = config ? (config as any).metadata : undefined;
        const duration = metadata ? Date.now() - metadata.startTime : 0;

        if (error.response) {
          this.logger.error(
            `[${error.response.status}] ${config?.method?.toUpperCase()} ${config?.url} - ${duration}ms`
          );
        } else {
          this.logger.error(`Request failed: ${error.message}`);
        }

        this.circuitBreaker.recordFailure();
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a request to the service
   */
  async request<T = unknown>(options: RequestOptions): Promise<ServiceResponse<T>> {
    // Check circuit breaker
    if (!this.circuitBreaker.canExecute()) {
      const error: ServiceError = {
        code: 'CIRCUIT_BREAKER_OPEN',
        message: `Service ${this.config.name} is temporarily unavailable`,
        service: this.config.name,
      };
      throw error;
    }

    const startTime = Date.now();

    try {
      const response = await this.retryHandler.execute(
        async () => {
          return await this.axiosInstance.request({
            method: options.method,
            url: options.path,
            data: options.body,
            params: options.query,
            headers: options.headers,
            timeout: options.timeout || this.config.timeout,
          });
        },
        `${options.method} ${options.path}`
      );

      const duration = Date.now() - startTime;

      return {
        status: response.status,
        data: response.data as T,
        headers: this.extractHeaders(response.headers),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      throw this.handleError(error, duration);
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(path: string, options?: Partial<RequestOptions>): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'GET',
      path,
      ...options,
    });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    options?: Partial<RequestOptions>
  ): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'POST',
      path,
      body,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    options?: Partial<RequestOptions>
  ): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      path,
      body,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(path: string, options?: Partial<RequestOptions>): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      path,
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    options?: Partial<RequestOptions>
  ): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      path,
      body,
      ...options,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return this.circuitBreaker.getStatus();
  }

  /**
   * Extract headers from response
   */
  private extractHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    if (headers && typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          result[key] = value;
        }
      });
    }
    return result;
  }

  /**
   * Handle errors
   */
  private handleError(error: any, duration: number): ServiceError {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return {
          code: `HTTP_${error.response.status}`,
          message: error.response.statusText || 'HTTP Error',
          status: error.response.status,
          service: this.config.name,
          originalError: error,
        };
      }

      if (error.request) {
        return {
          code: 'SERVICE_UNREACHABLE',
          message: `Service ${this.config.name} is unreachable`,
          service: this.config.name,
          originalError: error,
        };
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'Unknown error occurred',
      service: this.config.name,
      originalError: error,
    };
  }

  /**
   * Get service configuration
   */
  getConfig(): ServiceConfig {
    return { ...this.config };
  }
}

export const createServiceClient = (config: ServiceConfig, logger?: any): ServiceClient => {
  return new ServiceClient(config, logger);
};
