/**
 * Health Check Service
 * Monitors health of all downstream microservices
 */

import axios, { AxiosError } from 'axios';
import { servicesConfig, ServiceConfig } from '../config/routes.config';
import { logger } from '../middleware/logging.middleware';

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastChecked: string;
  error?: string;
}

export interface GatewayHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceHealth[];
  uptime: number;
}

// Cache health status
const healthCache = new Map<string, ServiceHealth>();
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
const CACHE_TTL = 30000; // 30 seconds

/**
 * Check health of a single service
 */
const checkServiceHealth = async (service: ServiceConfig): Promise<ServiceHealth> => {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${service.url}${service.healthPath}`, {
      timeout: HEALTH_CHECK_TIMEOUT,
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: service.name,
      status: response.status === 200 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    const responseTime = Date.now() - startTime;
    
    return {
      name: service.name,
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: axiosError.message || 'Service unavailable',
    };
  }
};

/**
 * Check health of all services
 */
export const checkAllServicesHealth = async (): Promise<ServiceHealth[]> => {
  const healthChecks = servicesConfig.map(async (service) => {
    // Check cache first
    const cached = healthCache.get(service.name);
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.lastChecked).getTime();
      if (cacheAge < CACHE_TTL) {
        return cached;
      }
    }
    
    const health = await checkServiceHealth(service);
    healthCache.set(service.name, health);
    return health;
  });
  
  return Promise.all(healthChecks);
};

/**
 * Get overall gateway health
 */
export const getGatewayHealth = async (): Promise<GatewayHealth> => {
  const services = await checkAllServicesHealth();
  
  const unhealthyCount = services.filter((s) => s.status === 'unhealthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  
  let status: GatewayHealth['status'] = 'healthy';
  if (unhealthyCount > 0) {
    status = unhealthyCount === services.length ? 'unhealthy' : 'degraded';
  } else if (degradedCount > 0) {
    status = 'degraded';
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    services,
    uptime: process.uptime(),
  };
};

/**
 * Start periodic health checks
 */
export const startHealthChecks = (intervalMs: number = 60000): NodeJS.Timeout => {
  logger.info('Starting periodic health checks', { intervalMs });
  
  return setInterval(async () => {
    try {
      const health = await getGatewayHealth();
      
      if (health.status !== 'healthy') {
        logger.warn('Gateway health degraded', {
          status: health.status,
          unhealthyServices: health.services
            .filter((s) => s.status !== 'healthy')
            .map((s) => s.name),
        });
      }
    } catch (error) {
      logger.error('Health check failed', error as Error);
    }
  }, intervalMs);
};

/**
 * Get cached health for a specific service
 */
export const getServiceHealthCached = (serviceName: string): ServiceHealth | undefined => {
  return healthCache.get(serviceName);
};

/**
 * Clear health cache
 */
export const clearHealthCache = (): void => {
  healthCache.clear();
};
