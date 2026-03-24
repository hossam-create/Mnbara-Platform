# Service Client Library

Service-to-service communication client for Mnbara microservices. Provides a robust, type-safe HTTP client with built-in retry logic, circuit breaker pattern, and service discovery.

## Features

- **Service Registry**: Centralized service discovery and configuration management
- **HTTP Client**: Type-safe HTTP client with automatic retry logic
- **Circuit Breaker**: Prevents cascading failures with circuit breaker pattern
- **Retry Handler**: Exponential backoff with jitter for resilient communication
- **Service Discovery**: Health checks and service availability monitoring
- **Error Handling**: Comprehensive error handling with meaningful error codes
- **Request/Response Logging**: Built-in logging for debugging and monitoring

## Installation

```bash
npm install @mnbara/service-client
```

## Quick Start

### 1. Register Services

```typescript
import { createServiceRegistry, createServiceClient, createServiceDiscovery } from '@mnbara/service-client';

// Create registry
const registry = createServiceRegistry();

// Register services
registry.register({
  name: 'auth-service',
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
});

registry.register({
  name: 'user-service',
  baseURL: 'http://localhost:3002',
});

registry.register({
  name: 'order-service',
  baseURL: 'http://localhost:3003',
});
```

### 2. Create Service Clients

```typescript
// Create clients for each service
const authClient = createServiceClient(registry.getService('auth-service')!);
const userClient = createServiceClient(registry.getService('user-service')!);
const orderClient = createServiceClient(registry.getService('order-service')!);
```

### 3. Make Requests

```typescript
// GET request
const userResponse = await userClient.get<User>('/users/123');
console.log(userResponse.data);
console.log(userResponse.status);
console.log(userResponse.duration);

// POST request
const orderResponse = await orderClient.post<Order>('/orders', {
  userId: '123',
  items: [{ productId: '456', quantity: 2 }],
});

// PUT request
await userClient.put('/users/123', {
  name: 'John Doe',
  email: 'john@example.com',
});

// DELETE request
await orderClient.delete('/orders/789');
```

### 4. Set Up Service Discovery

```typescript
// Create service discovery
const discovery = createServiceDiscovery({
  enableHealthChecks: true,
  healthCheckInterval: 30000,
  healthCheckTimeout: 5000,
});

// Register clients
discovery.registerClient('auth-service', authClient);
discovery.registerClient('user-service', userClient);
discovery.registerClient('order-service', orderClient);

// Get health status
const status = discovery.getStatus();
console.log(status);
// {
//   totalServices: 3,
//   healthyServices: 3,
//   unhealthyServices: 0,
//   services: [...]
// }

// Check specific service
const isHealthy = discovery.isServiceHealthy('auth-service');
console.log(isHealthy); // true

// Get all healthy services
const healthyServices = discovery.getHealthyServices();
console.log(healthyServices); // ['auth-service', 'user-service', 'order-service']
```

## Architecture

### Service Registry

Manages service discovery and configuration:

```typescript
const registry = createServiceRegistry();

// Register a service
registry.register({
  name: 'auth-service',
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

// Get service configuration
const config = registry.getService('auth-service');

// Update service configuration
registry.updateService('auth-service', { timeout: 5000 });

// Check if service exists
if (registry.hasService('auth-service')) {
  // ...
}

// Get all services
const allServices = registry.getAllServices();
```

### Service Client

Type-safe HTTP client with automatic retry and circuit breaker:

```typescript
const client = createServiceClient({
  name: 'auth-service',
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

// Make requests
const response = await client.get<User>('/users/123');

// Check circuit breaker status
const cbStatus = client.getCircuitBreakerStatus();
console.log(cbStatus);
// {
//   state: 'CLOSED',
//   failureCount: 0,
//   successCount: 0,
//   lastFailureTime: 0
// }
```

### Retry Handler

Implements exponential backoff with jitter:

```typescript
const retryHandler = createRetryHandler({
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
});

// Execute with retry
const result = await retryHandler.execute(
  async () => {
    return await someAsyncOperation();
  },
  'operation-name'
);
```

### Circuit Breaker

Prevents cascading failures:

```typescript
const circuitBreaker = createCircuitBreaker('auth-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
});

// Check if request should be allowed
if (circuitBreaker.canExecute()) {
  // Make request
  try {
    // ...
    circuitBreaker.recordSuccess();
  } catch (error) {
    circuitBreaker.recordFailure();
  }
}

// Get status
const status = circuitBreaker.getStatus();
console.log(status);
// {
//   state: 'CLOSED',
//   failureCount: 0,
//   successCount: 0,
//   lastFailureTime: 0
// }
```

### Service Discovery

Monitors service health and availability:

```typescript
const discovery = createServiceDiscovery({
  enableHealthChecks: true,
  healthCheckInterval: 30000,
  healthCheckTimeout: 5000,
});

// Register clients
discovery.registerClient('auth-service', authClient);

// Get health check result
const result = discovery.getHealthCheckResult('auth-service');
console.log(result);
// {
//   service: 'auth-service',
//   healthy: true,
//   responseTime: 45,
//   lastCheck: Date,
//   error: undefined
// }

// Get all health check results
const allResults = discovery.getAllHealthCheckResults();

// Get healthy services
const healthyServices = discovery.getHealthyServices();

// Get unhealthy services
const unhealthyServices = discovery.getUnhealthyServices();

// Stop health checks
discovery.stopHealthCheck('auth-service');
discovery.stopAllHealthChecks();

// Cleanup
discovery.destroy();
```

## Error Handling

The client provides comprehensive error handling:

```typescript
try {
  const response = await client.get('/users/123');
} catch (error: any) {
  if (error.code === 'CIRCUIT_BREAKER_OPEN') {
    console.error('Service is temporarily unavailable');
  } else if (error.code === 'SERVICE_UNREACHABLE') {
    console.error('Service is not responding');
  } else if (error.code?.startsWith('HTTP_')) {
    console.error(`HTTP Error: ${error.status}`);
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## Configuration

### Service Configuration

```typescript
interface ServiceConfig {
  name: string;              // Service name
  baseURL: string;           // Service base URL
  timeout?: number;          // Request timeout (default: 30000ms)
  retries?: number;          // Number of retries (default: 3)
  retryDelay?: number;       // Initial retry delay (default: 1000ms)
}
```

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries: number;        // Maximum number of retries (default: 3)
  initialDelayMs: number;    // Initial delay in ms (default: 1000)
  maxDelayMs: number;        // Maximum delay in ms (default: 30000)
  backoffMultiplier: number; // Backoff multiplier (default: 2)
}
```

### Circuit Breaker Configuration

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;  // Failures before opening (default: 5)
  successThreshold: number;  // Successes before closing (default: 2)
  timeout: number;           // Timeout before half-open (default: 60000ms)
}
```

### Service Discovery Configuration

```typescript
interface ServiceDiscoveryConfig {
  enableHealthChecks: boolean;      // Enable health checks (default: true)
  healthCheckInterval: number;      // Check interval in ms (default: 30000)
  healthCheckTimeout: number;       // Check timeout in ms (default: 5000)
}
```

## Best Practices

### 1. Use Service Registry

Always use a centralized service registry for managing service configurations:

```typescript
const registry = createServiceRegistry();
registry.registerMultiple([
  { name: 'auth-service', baseURL: 'http://auth:3001' },
  { name: 'user-service', baseURL: 'http://user:3002' },
  { name: 'order-service', baseURL: 'http://order:3003' },
]);
```

### 2. Enable Service Discovery

Always enable service discovery for monitoring service health:

```typescript
const discovery = createServiceDiscovery({
  enableHealthChecks: true,
  healthCheckInterval: 30000,
});

// Register all clients
registry.getAllServices().forEach(service => {
  const client = createServiceClient(service);
  discovery.registerClient(service.name, client);
});
```

### 3. Handle Errors Gracefully

Always handle errors and implement fallback logic:

```typescript
try {
  const response = await client.get('/users/123');
  return response.data;
} catch (error: any) {
  if (error.code === 'CIRCUIT_BREAKER_OPEN') {
    // Use cached data or return default
    return getCachedUser('123') || getDefaultUser();
  }
  throw error;
}
```

### 4. Monitor Circuit Breaker Status

Regularly check circuit breaker status for debugging:

```typescript
const status = client.getCircuitBreakerStatus();
if (status.state === 'OPEN') {
  logger.warn(`Circuit breaker open for ${serviceName}`);
}
```

### 5. Configure Appropriate Timeouts

Set timeouts based on service SLAs:

```typescript
// Fast service
registry.register({
  name: 'cache-service',
  baseURL: 'http://cache:3001',
  timeout: 5000,
});

// Slow service
registry.register({
  name: 'report-service',
  baseURL: 'http://report:3002',
  timeout: 60000,
});
```

## Integration with NestJS

```typescript
import { Injectable } from '@nestjs/common';
import { createServiceRegistry, createServiceClient, createServiceDiscovery } from '@mnbara/service-client';

@Injectable()
export class ServiceClientService {
  private registry = createServiceRegistry();
  private discovery = createServiceDiscovery();
  private clients: Map<string, any> = new Map();

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Register services
    this.registry.registerMultiple([
      { name: 'auth-service', baseURL: process.env.AUTH_SERVICE_URL },
      { name: 'user-service', baseURL: process.env.USER_SERVICE_URL },
    ]);

    // Create clients
    this.registry.getAllServices().forEach(service => {
      const client = createServiceClient(service);
      this.clients.set(service.name, client);
      this.discovery.registerClient(service.name, client);
    });
  }

  getClient(serviceName: string) {
    return this.clients.get(serviceName);
  }

  getDiscovery() {
    return this.discovery;
  }
}
```

## Testing

```typescript
import { createServiceClient } from '@mnbara/service-client';

describe('Service Communication', () => {
  it('should make successful request', async () => {
    const client = createServiceClient({
      name: 'test-service',
      baseURL: 'http://localhost:3001',
    });

    const response = await client.get('/health');
    expect(response.status).toBe(200);
  });

  it('should retry on failure', async () => {
    const client = createServiceClient({
      name: 'test-service',
      baseURL: 'http://localhost:3001',
      retries: 3,
    });

    // Should retry and eventually succeed
    const response = await client.get('/users/123');
    expect(response.status).toBe(200);
  });

  it('should open circuit breaker on repeated failures', async () => {
    const client = createServiceClient({
      name: 'test-service',
      baseURL: 'http://localhost:9999', // Non-existent service
    });

    // Make multiple requests to trigger circuit breaker
    for (let i = 0; i < 5; i++) {
      try {
        await client.get('/health');
      } catch (error) {
        // Expected to fail
      }
    }

    // Circuit breaker should be open
    const status = client.getCircuitBreakerStatus();
    expect(status.state).toBe('OPEN');
  });
});
```

## Troubleshooting

### Circuit Breaker is Open

If the circuit breaker is open, the service is experiencing issues:

```typescript
const status = client.getCircuitBreakerStatus();
if (status.state === 'OPEN') {
  // Check service health
  const healthResult = discovery.getHealthCheckResult('service-name');
  console.log(healthResult);
}
```

### High Latency

If requests are slow, check response times:

```typescript
const response = await client.get('/endpoint');
console.log(`Response time: ${response.duration}ms`);

// Adjust timeout if needed
registry.updateService('service-name', { timeout: 60000 });
```

### Service Unreachable

If service is unreachable, check configuration:

```typescript
const config = registry.getService('service-name');
console.log(`Service URL: ${config?.baseURL}`);

// Verify service is running
const isHealthy = discovery.isServiceHealthy('service-name');
console.log(`Service healthy: ${isHealthy}`);
```

## License

MIT
