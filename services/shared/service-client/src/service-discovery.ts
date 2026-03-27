/**
 * Service Discovery - Manages service health checks and availability
 */

import { ServiceClient } from './service-client';
import { ServiceRegistry, HealthCheckResult, ServiceDiscoveryConfig } from './types';

export class ServiceDiscovery {
  private clients: Map<string, ServiceClient> = new Map();
  private healthCheckResults: Map<string, HealthCheckResult> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly config: ServiceDiscoveryConfig;
  private readonly logger: any;

  constructor(config: Partial<ServiceDiscoveryConfig> = {}, logger?: any) {
    this.config = {
      enableHealthChecks: config.enableHealthChecks ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
      healthCheckTimeout: config.healthCheckTimeout ?? 5000,
    };
    this.logger = logger || console;
  }

  /**
   * Register a service client
   */
  registerClient(serviceName: string, client: ServiceClient): void {
    this.clients.set(serviceName, client);

    if (this.config.enableHealthChecks) {
      this.startHealthCheck(serviceName);
    }

    this.logger.info(`Service client registered: ${serviceName}`);
  }

  /**
   * Get a service client
   */
  getClient(serviceName: string): ServiceClient | undefined {
    return this.clients.get(serviceName);
  }

  /**
   * Get all service clients
   */
  getAllClients(): Map<string, ServiceClient> {
    return new Map(this.clients);
  }

  /**
   * Start health check for a service
   */
  private startHealthCheck(serviceName: string): void {
    // Clear existing interval if any
    if (this.healthCheckIntervals.has(serviceName)) {
      clearInterval(this.healthCheckIntervals.get(serviceName));
    }

    // Perform initial health check
    this.performHealthCheck(serviceName);

    // Set up periodic health checks
    const interval = setInterval(() => {
      this.performHealthCheck(serviceName);
    }, this.config.healthCheckInterval);

    this.healthCheckIntervals.set(serviceName, interval);
  }

  /**
   * Perform a health check for a service
   */
  private async performHealthCheck(serviceName: string): Promise<void> {
    const client = this.clients.get(serviceName);
    if (!client) {
      return;
    }

    const startTime = Date.now();

    try {
      const healthy = await client.healthCheck();
      const responseTime = Date.now() - startTime;

      this.healthCheckResults.set(serviceName, {
        service: serviceName,
        healthy,
        responseTime,
        lastCheck: new Date(),
      });

      if (!healthy) {
        this.logger.warn(`Health check failed for ${serviceName}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.healthCheckResults.set(serviceName, {
        service: serviceName,
        healthy: false,
        responseTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.logger.error(`Health check error for ${serviceName}:`, error);
    }
  }

  /**
   * Get health check result for a service
   */
  getHealthCheckResult(serviceName: string): HealthCheckResult | undefined {
    return this.healthCheckResults.get(serviceName);
  }

  /**
   * Get all health check results
   */
  getAllHealthCheckResults(): HealthCheckResult[] {
    return Array.from(this.healthCheckResults.values());
  }

  /**
   * Check if a service is healthy
   */
  isServiceHealthy(serviceName: string): boolean {
    const result = this.healthCheckResults.get(serviceName);
    return result?.healthy ?? false;
  }

  /**
   * Get all healthy services
   */
  getHealthyServices(): string[] {
    return Array.from(this.healthCheckResults.entries())
      .filter(([, result]) => result.healthy)
      .map(([serviceName]) => serviceName);
  }

  /**
   * Get all unhealthy services
   */
  getUnhealthyServices(): string[] {
    return Array.from(this.healthCheckResults.entries())
      .filter(([, result]) => !result.healthy)
      .map(([serviceName]) => serviceName);
  }

  /**
   * Stop health checks for a service
   */
  stopHealthCheck(serviceName: string): void {
    const interval = this.healthCheckIntervals.get(serviceName);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(serviceName);
      this.logger.info(`Health check stopped for ${serviceName}`);
    }
  }

  /**
   * Stop all health checks
   */
  stopAllHealthChecks(): void {
    this.healthCheckIntervals.forEach(interval => clearInterval(interval));
    this.healthCheckIntervals.clear();
    this.logger.info('All health checks stopped');
  }

  /**
   * Unregister a service
   */
  unregisterClient(serviceName: string): void {
    this.stopHealthCheck(serviceName);
    this.clients.delete(serviceName);
    this.healthCheckResults.delete(serviceName);
    this.logger.info(`Service client unregistered: ${serviceName}`);
  }

  /**
   * Get discovery status
   */
  getStatus(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    services: HealthCheckResult[];
  } {
    const results = this.getAllHealthCheckResults();
    return {
      totalServices: this.clients.size,
      healthyServices: results.filter(r => r.healthy).length,
      unhealthyServices: results.filter(r => !r.healthy).length,
      services: results,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAllHealthChecks();
    this.clients.clear();
    this.healthCheckResults.clear();
    this.logger.info('Service discovery destroyed');
  }
}

export const createServiceDiscovery = (config?: Partial<ServiceDiscoveryConfig>, logger?: any): ServiceDiscovery => {
  return new ServiceDiscovery(config, logger);
};
