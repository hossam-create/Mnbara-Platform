/**
 * Service Registry - Manages service discovery and configuration
 */

import { ServiceConfig, ServiceRegistry } from './types';

export class ServiceRegistryManager {
  private registry: ServiceRegistry = {};
  private readonly logger: any;

  constructor(logger?: any) {
    this.logger = logger || console;
  }

  /**
   * Register a service in the registry
   */
  register(config: ServiceConfig): void {
    if (!config.name || !config.baseURL) {
      throw new Error('Service name and baseURL are required');
    }

    this.registry[config.name] = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.logger.info(`Service registered: ${config.name} -> ${config.baseURL}`);
  }

  /**
   * Register multiple services at once
   */
  registerMultiple(configs: ServiceConfig[]): void {
    configs.forEach(config => this.register(config));
  }

  /**
   * Get service configuration by name
   */
  getService(serviceName: string): ServiceConfig | undefined {
    return this.registry[serviceName];
  }

  /**
   * Get all registered services
   */
  getAllServices(): ServiceRegistry {
    return { ...this.registry };
  }

  /**
   * Check if a service is registered
   */
  hasService(serviceName: string): boolean {
    return serviceName in this.registry;
  }

  /**
   * Unregister a service
   */
  unregister(serviceName: string): void {
    if (this.registry[serviceName]) {
      delete this.registry[serviceName];
      this.logger.info(`Service unregistered: ${serviceName}`);
    }
  }

  /**
   * Update service configuration
   */
  updateService(serviceName: string, config: Partial<ServiceConfig>): void {
    if (!this.hasService(serviceName)) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    this.registry[serviceName] = {
      ...this.registry[serviceName],
      ...config,
    };

    this.logger.info(`Service updated: ${serviceName}`);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.registry = {};
    this.logger.info('Service registry cleared');
  }

  /**
   * Get service count
   */
  getServiceCount(): number {
    return Object.keys(this.registry).length;
  }
}

export const createServiceRegistry = (logger?: any): ServiceRegistryManager => {
  return new ServiceRegistryManager(logger);
};
