/**
 * Base API Client
 * Shared HTTP client with retry logic, caching, and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiConfig, ApiResponse } from './types';
import { handleApiError } from './errors';
import { cache } from './cache';

export class BaseApiClient {
  protected client: AxiosInstance;
  protected config: ApiConfig;
  protected serviceName: string;

  constructor(serviceName: string, config: ApiConfig) {
    this.serviceName = serviceName;
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add API key to headers or params based on service
        if (this.config.apiKey) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        // Retry logic
        if (!config || !config.retry) {
          config.retry = 0;
        }

        const maxRetries = this.config.retryAttempts || 3;
        
        if (config.retry < maxRetries && this.shouldRetry(error)) {
          config.retry += 1;
          
          // Exponential backoff
          const delay = Math.pow(2, config.retry) * 1000;
          await this.sleep(delay);
          
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    if (!error.response) {
      return true; // Network error
    }

    const status = error.response.status;
    return status === 429 || status >= 500;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected async request<T>(
    config: AxiosRequestConfig,
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<ApiResponse<T>> {
    try {
      // Check cache
      if (cacheKey && this.config.cacheTTL) {
        const cached = cache.get<T>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            cached: true,
            timestamp: new Date(),
          };
        }
      }

      // Make request
      const response: AxiosResponse<T> = await this.client.request(config);

      // Cache response
      if (cacheKey && (cacheTTL || this.config.cacheTTL)) {
        cache.set(cacheKey, response.data, cacheTTL || this.config.cacheTTL!);
      }

      return {
        success: true,
        data: response.data,
        cached: false,
        timestamp: new Date(),
      };
    } catch (error) {
      const apiError = handleApiError(error);
      return {
        success: false,
        error: apiError.toJSON(),
        timestamp: new Date(),
      };
    }
  }

  protected async get<T>(
    url: string,
    params?: any,
    cacheKey?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      { method: 'GET', url, params },
      cacheKey
    );
  }

  protected async post<T>(
    url: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data });
  }

  protected async put<T>(
    url: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  protected async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
