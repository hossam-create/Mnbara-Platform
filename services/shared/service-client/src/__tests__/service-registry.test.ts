/**
 * Service Registry Tests
 */

import { ServiceRegistryManager } from '../service-registry';
import { ServiceConfig } from '../types';

describe('ServiceRegistryManager', () => {
  let registry: ServiceRegistryManager;

  beforeEach(() => {
    registry = new ServiceRegistryManager();
  });

  describe('register', () => {
    it('should register a service', () => {
      const config: ServiceConfig = {
        name: 'auth-service',
        baseURL: 'http://localhost:3001',
      };

      registry.register(config);

      expect(registry.hasService('auth-service')).toBe(true);
    });

    it('should throw error if name is missing', () => {
      const config: any = {
        baseURL: 'http://localhost:3001',
      };

      expect(() => registry.register(config)).toThrow('Service name and baseURL are required');
    });

    it('should throw error if baseURL is missing', () => {
      const config: any = {
        name: 'auth-service',
      };

      expect(() => registry.register(config)).toThrow('Service name and baseURL are required');
    });

    it('should set default values', () => {
      const config: ServiceConfig = {
        name: 'auth-service',
        baseURL: 'http://localhost:3001',
      };

      registry.register(config);
      const service = registry.getService('auth-service');

      expect(service?.timeout).toBe(30000);
      expect(service?.retries).toBe(3);
      expect(service?.retryDelay).toBe(1000);
    });
  });

  describe('registerMultiple', () => {
    it('should register multiple services', () => {
      const configs: ServiceConfig[] = [
        { name: 'auth-service', baseURL: 'http://localhost:3001' },
        { name: 'user-service', baseURL: 'http://localhost:3002' },
        { name: 'order-service', baseURL: 'http://localhost:3003' },
      ];

      registry.registerMultiple(configs);

      expect(registry.getServiceCount()).toBe(3);
      expect(registry.hasService('auth-service')).toBe(true);
      expect(registry.hasService('user-service')).toBe(true);
      expect(registry.hasService('order-service')).toBe(true);
    });
  });

  describe('getService', () => {
    it('should return service configuration', () => {
      const config: ServiceConfig = {
        name: 'auth-service',
        baseURL: 'http://localhost:3001',
        timeout: 5000,
      };

      registry.register(config);
      const service = registry.getService('auth-service');

      expect(service?.name).toBe('auth-service');
      expect(service?.baseURL).toBe('http://localhost:3001');
      expect(service?.timeout).toBe(5000);
    });

    it('should return undefined for non-existent service', () => {
      const service = registry.getService('non-existent');
      expect(service).toBeUndefined();
    });
  });

  describe('getAllServices', () => {
    it('should return all registered services', () => {
      const configs: ServiceConfig[] = [
        { name: 'auth-service', baseURL: 'http://localhost:3001' },
        { name: 'user-service', baseURL: 'http://localhost:3002' },
      ];

      registry.registerMultiple(configs);
      const services = registry.getAllServices();

      expect(Object.keys(services)).toHaveLength(2);
      expect(services['auth-service']).toBeDefined();
      expect(services['user-service']).toBeDefined();
    });
  });

  describe('hasService', () => {
    it('should return true for registered service', () => {
      const config: ServiceConfig = {
        name: 'auth-service',
        baseURL: 'http://localhost:3001',
      };

      registry.register(config);

      expect(registry.hasService('auth-service')).toBe(true);
    });

    it('should return false for non-existent service', () => {
      expect(registry.hasService('non-existent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should unregister a service', () => {
      const config: ServiceConfig = {
        name: 'auth-service',
        baseURL: 'http://localhost:3001',
      };

      registry.register(config);
      expect(registry.hasService('auth-service')).toBe(true);

      registry.unregister('auth-service');
      expect(registry.hasService('auth-service')).toBe(false);
    });
  });

  describe('updateService', () => {
    it('should update service configuration', () => {
      const config: ServiceConfig = {
        name: 'auth-service',
        baseURL: 'http://localhost:3001',
        timeout: 30000,
      };

      registry.register(config);
      registry.updateService('auth-service', { timeout: 5000 });

      const service = registry.getService('auth-service');
      expect(service?.timeout).toBe(5000);
    });

    it('should throw error if service not found', () => {
      expect(() => registry.updateService('non-existent', { timeout: 5000 })).toThrow(
        'Service not found: non-existent'
      );
    });
  });

  describe('clear', () => {
    it('should clear all services', () => {
      const configs: ServiceConfig[] = [
        { name: 'auth-service', baseURL: 'http://localhost:3001' },
        { name: 'user-service', baseURL: 'http://localhost:3002' },
      ];

      registry.registerMultiple(configs);
      expect(registry.getServiceCount()).toBe(2);

      registry.clear();
      expect(registry.getServiceCount()).toBe(0);
    });
  });

  describe('getServiceCount', () => {
    it('should return correct service count', () => {
      expect(registry.getServiceCount()).toBe(0);

      registry.register({ name: 'auth-service', baseURL: 'http://localhost:3001' });
      expect(registry.getServiceCount()).toBe(1);

      registry.register({ name: 'user-service', baseURL: 'http://localhost:3002' });
      expect(registry.getServiceCount()).toBe(2);
    });
  });
});
