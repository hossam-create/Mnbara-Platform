/**
 * Service-to-service communication types
 */

export interface ServiceConfig {
  name: string;
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ServiceRegistry {
  [serviceName: string]: ServiceConfig;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  timeout?: number;
}

export interface ServiceResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
  duration: number;
}

export interface ServiceError {
  code: string;
  message: string;
  status?: number;
  service?: string;
  originalError?: Error;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface HealthCheckResult {
  service: string;
  healthy: boolean;
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

export interface ServiceDiscoveryConfig {
  enableHealthChecks: boolean;
  healthCheckInterval: number;
  healthCheckTimeout: number;
}
