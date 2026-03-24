/**
 * Service Registry
 * 
 * Manages service discovery, health checks, and service metadata.
 * Provides a centralized registry of all backend services.
 */

import { logger } from '../utils/logger';
import { config, serviceUrls } from '../config';

export interface ServiceInfo {
  name: string;
  url: string;
  port: number;
  healthy: boolean;
  lastHealthCheck: Date | null;
  version: string;
  endpoints: string[];
  metadata: Record<string, any>;
}

export interface ServiceRegistry {
  [serviceName: string]: ServiceInfo;
}

class ServiceRegistryManager {
  private registry: ServiceRegistry = {};
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthCheckIntervalMs = 30000; // 30 seconds

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Initialize the service registry with configured services
   */
  private initializeRegistry(): void {
    const services = [
      { name: 'auth', url: config.authServiceUrl, port: 3001 },
      { name: 'user', url: config.userServiceUrl, port: 3002 },
      { name: 'marketplace', url: config.orderServiceUrl, port: 3003 },
      { name: 'payment', url: config.paymentServiceUrl, port: 3004 },
      { name: 'delivery', url: config.deliveryServiceUrl, port: 3005 },
      { name: 'wallet', url: config.walletServiceUrl, port: 3006 },
      { name: 'traveler', url: config.travelerServiceUrl, port: 3007 },
      { name: 'notification', url: config.authServiceUrl, port: 3008 },
    ];

    services.forEach((service) => {
      this.registry[service.name] = {
        name: service.name,
        url: service.url,
        port: service.port,
        healthy: false,
        lastHealthCheck: null,
        version: 'unknown',
        endpoints: [],
        metadata: {},
      };
    });

    logger.info('Service registry initialized', {
      services: Object.keys(this.registry),
    });
  }

  /**
   * Register a new service
   */
  registerService(
    name: string,
    url: string,
    port: number,
    metadata?: Record<string, any>
  ): void {
    this.registry[name] = {
      name,
      url,
      port,
      healthy: false,
      lastHealthCheck: null,
      version: 'unknown',
      endpoints: [],
      metadata: metadata || {},
    };

    logger.info('Service registered', { name, url, port });
  }

  /**
   * Unregister a service
   */
  unregisterService(name: string): void {
    delete this.registry[name];
    logger.info('Service unregistered', { name });
  }

  /**
   * Get service info
   */
  getService(name: string): ServiceInfo | undefined {
    return this.registry[name];
  }

  /**
   * Get all services
   */
  getAllServices(): ServiceInfo[] {
    return Object.values(this.registry);
  }

  /**
   * Get healthy services
   */
  getHealthyServices(): ServiceInfo[] {
    return Object.values(this.registry).filter((service) => service.healthy);
  }

  /**
   * Get unhealthy services
   */
  getUnhealthyServices(): ServiceInfo[] {
    return Object.values(this.registry).filter((service) => !service.healthy);
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(name: string): Promise<boolean> {
    const service = this.registry[name];
    if (!service) {
      logger.warn('Service not found in registry', { name });
      return false;
    }

    try {
      const response = await fetch(`${service.url}/health`, {
        method: 'GET',
        timeout: 5000,
      });

      const healthy = response.ok;
      service.healthy = healthy;
      service.lastHealthCheck = new Date();

      if (healthy) {
        try {
          const data = await response.json();
          service.version = data.version || 'unknown';
          service.metadata = data.metadata || {};
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      logger.debug('Service health check', {
        name,
        healthy,
        status: response.status,
      });

      return healthy;
    } catch (error) {
      service.healthy = false;
      service.lastHealthCheck = new Date();

      logger.warn('Service health check failed', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });

      return false;
    }
  }

  /**
   * Check health of all services
   */
  async checkAllServicesHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    const promises = Object.keys(this.registry).map(async (name) => {
      results[name] = await this.checkServiceHealth(name);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = this.healthCheckIntervalMs): void {
    if (this.healthCheckInterval) {
      logger.warn('Health checks already running');
      return;
    }

    logger.info('Starting periodic health checks', { intervalMs });

    // Initial health check
    this.checkAllServicesHealth().catch((error) => {
      logger.error('Initial health check failed', { error });
    });

    // Periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      try {
        const results = await this.checkAllServicesHealth();
        const healthy = Object.values(results).filter(Boolean).length;
        const total = Object.keys(results).length;

        logger.debug('Periodic health check completed', {
          healthy,
          total,
          results,
        });
      } catch (error) {
        logger.error('Periodic health check error', { error });
      }
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Health checks stopped');
    }
  }

  /**
   * Get registry status
   */
  getStatus(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    services: Record<string, any>;
  } {
    const services = this.getAllServices();
    const healthy = services.filter((s) => s.healthy).length;
    const unhealthy = services.filter((s) => !s.healthy).length;

    return {
      totalServices: services.length,
      healthyServices: healthy,
      unhealthyServices: unhealthy,
      services: Object.fromEntries(
        services.map((s) => [
          s.name,
          {
            healthy: s.healthy,
            url: s.url,
            version: s.version,
            lastHealthCheck: s.lastHealthCheck,
          },
        ])
      ),
    };
  }

  /**
   * Get service URL
   */
  getServiceUrl(name: string): string | undefined {
    const service = this.registry[name];
    return service?.url;
  }

  /**
   * Update service metadata
   */
  updateServiceMetadata(name: string, metadata: Record<string, any>): void {
    const service = this.registry[name];
    if (service) {
      service.metadata = { ...service.metadata, ...metadata };
      logger.debug('Service metadata updated', { name, metadata });
    }
  }

  /**
   * Update service endpoints
   */
  updateServiceEndpoints(name: string, endpoints: string[]): void {
    const service = this.registry[name];
    if (service) {
      service.endpoints = endpoints;
      logger.debug('Service endpoints updated', { name, endpoints });
    }
  }
}

// Export singleton instance
export const serviceRegistry = new ServiceRegistryManager();

export default serviceRegistry;
