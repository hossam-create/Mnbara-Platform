/**
 * Service Client Library - Main exports
 */

export * from './types';
export * from './service-registry';
export * from './service-client';
export * from './service-discovery';
export * from './retry-handler';
export * from './circuit-breaker';

// Factory functions
export { createServiceRegistry } from './service-registry';
export { createServiceClient } from './service-client';
export { createServiceDiscovery } from './service-discovery';
export { createRetryHandler } from './retry-handler';
export { createCircuitBreaker } from './circuit-breaker';
