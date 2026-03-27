# Service-to-Service Communication Guide

This guide explains how to configure and use service-to-service communication in the Mnbara platform.

## Overview

The Mnbara platform uses a service-to-service communication infrastructure based on HTTP/REST APIs. Each service can communicate with other services through a centralized service client library that provides:

- **Service Discovery**: Automatic service registration and discovery
- **Retry Logic**: Exponential backoff for resilient communication
- **Circuit Breaker**: Prevents cascading failures
- **Health Checks**: Monitors service availability
- **Error Handling**: Comprehensive error handling with meaningful error codes

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
│  (Routes external requests to appropriate services)         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Core Services   │ │ Marketplace      │ │ Financial        │
│  - Auth          │ │ - Product        │ │ - Payment        │
│  - User          │ │ - Order          │ │ - Wallet         │
│  - Notification  │ │ - Cart           │ │ - Escrow         │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│  Service Client Library          │  │  Service Discovery               │
│  - HTTP Client                   │  │  - Health Checks                 │
│  - Retry Handler                 │  │  - Service Registry              │
│  - Circuit Breaker               │  │  - Availability Monitoring       │
└──────────────────────────────────┘  └──────────────────────────────────┘
```

## Service Configuration

### Environment Variables

Each service should define the following environment variables for service-to-service communication:

```bash
# Service URLs
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
ORDER_SERVICE_URL=http://order-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3004
WALLET_SERVICE_URL=http://wallet-service:3005
PRODUCT_SERVICE_URL=http://product-service:3006
CART_SERVICE_URL=http://cart-service:3007
NOTIFICATION_SERVICE_URL=http://notification-service:3008

# Communication settings
SERVICE_TIMEOUT=30000
SERVICE_RETRIES=3
SERVICE_RETRY_DELAY=1000

# Health check settings
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
```

### Service Ports

Standard ports for each service:

| Service | Port | Environment |
|---------|------|-------------|
| API Gateway | 3000 | All |
| Auth Service | 3001 | All |
| User Service | 3002 | All |
| Order Service | 3003 | All |
| Payment Service | 3004 | All |
| Wallet Service | 3005 | All |
| Product Service | 3006 | All |
| Cart Service | 3007 | All |
| Notification Service | 3008 | All |

## Implementation

### 1. Initialize Service Client in NestJS Module

```typescript
// services/auth-service/src/service-client/service-client.module.ts
import { Module } from '@nestjs/common';
import { ServiceClientService } from './service-client.service';

@Module({
  providers: [ServiceClientService],
  exports: [ServiceClientService],
})
export class ServiceClientModule {}
```

```typescript
// services/auth-service/src/service-client/service-client.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createServiceRegistry,
  createServiceClient,
  createServiceDiscovery,
} from '@mnbara/service-client';

@Injectable()
export class ServiceClientService implements OnModuleInit, OnModuleDestroy {
  private registry: any;
  private discovery: any;
  private clients: Map<string, any> = new Map();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeServices();
  }

  onModuleDestroy() {
    this.discovery?.destroy();
  }

  private initializeServices() {
    // Create registry
    this.registry = createServiceRegistry();

    // Register all services
    this.registry.registerMultiple([
      {
        name: 'auth-service',
        baseURL: this.configService.get('AUTH_SERVICE_URL'),
        timeout: this.configService.get('SERVICE_TIMEOUT', 30000),
        retries: this.configService.get('SERVICE_RETRIES', 3),
      },
      {
        name: 'user-service',
        baseURL: this.configService.get('USER_SERVICE_URL'),
      },
      {
        name: 'order-service',
        baseURL: this.configService.get('ORDER_SERVICE_URL'),
      },
      {
        name: 'payment-service',
        baseURL: this.configService.get('PAYMENT_SERVICE_URL'),
      },
      {
        name: 'wallet-service',
        baseURL: this.configService.get('WALLET_SERVICE_URL'),
      },
      {
        name: 'product-service',
        baseURL: this.configService.get('PRODUCT_SERVICE_URL'),
      },
      {
        name: 'cart-service',
        baseURL: this.configService.get('CART_SERVICE_URL'),
      },
      {
        name: 'notification-service',
        baseURL: this.configService.get('NOTIFICATION_SERVICE_URL'),
      },
    ]);

    // Create clients
    this.registry.getAllServices().forEach((service: any) => {
      const client = createServiceClient(service);
      this.clients.set(service.name, client);
    });

    // Create service discovery
    this.discovery = createServiceDiscovery({
      enableHealthChecks: this.configService.get('HEALTH_CHECK_ENABLED', true),
      healthCheckInterval: this.configService.get('HEALTH_CHECK_INTERVAL', 30000),
      healthCheckTimeout: this.configService.get('HEALTH_CHECK_TIMEOUT', 5000),
    });

    // Register clients for health checks
    this.clients.forEach((client, serviceName) => {
      this.discovery.registerClient(serviceName, client);
    });
  }

  getClient(serviceName: string) {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new Error(`Service client not found: ${serviceName}`);
    }
    return client;
  }

  getDiscovery() {
    return this.discovery;
  }

  getRegistry() {
    return this.registry;
  }
}
```

### 2. Use Service Client in Controllers/Services

```typescript
// services/order-service/src/order/order.service.ts
import { Injectable } from '@nestjs/common';
import { ServiceClientService } from '../service-client/service-client.service';

@Injectable()
export class OrderService {
  constructor(private serviceClient: ServiceClientService) {}

  async createOrder(orderData: any) {
    // Get payment service client
    const paymentClient = this.serviceClient.getClient('payment-service');

    // Call payment service
    const paymentResponse = await paymentClient.post('/payments', {
      amount: orderData.total,
      currency: 'USD',
      orderId: orderData.id,
    });

    if (paymentResponse.status !== 200) {
      throw new Error('Payment failed');
    }

    // Get wallet service client
    const walletClient = this.serviceClient.getClient('wallet-service');

    // Update wallet
    await walletClient.post('/wallets/debit', {
      userId: orderData.userId,
      amount: orderData.total,
    });

    return {
      id: orderData.id,
      status: 'created',
      payment: paymentResponse.data,
    };
  }

  async getOrderDetails(orderId: string) {
    try {
      // Get product service client
      const productClient = this.serviceClient.getClient('product-service');

      // Fetch product details
      const productResponse = await productClient.get(`/products/${orderId}`);

      return productResponse.data;
    } catch (error: any) {
      if (error.code === 'CIRCUIT_BREAKER_OPEN') {
        // Use cached data or return default
        return this.getCachedOrderDetails(orderId);
      }
      throw error;
    }
  }

  private getCachedOrderDetails(orderId: string) {
    // Return cached data
    return { id: orderId, cached: true };
  }
}
```

### 3. Monitor Service Health

```typescript
// services/api-gateway/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ServiceClientService } from '../service-client/service-client.service';

@Controller('health')
export class HealthController {
  constructor(private serviceClient: ServiceClientService) {}

  @Get()
  async getHealth() {
    const discovery = this.serviceClient.getDiscovery();
    const status = discovery.getStatus();

    return {
      status: status.unhealthyServices === 0 ? 'healthy' : 'degraded',
      timestamp: new Date(),
      services: status.services,
    };
  }

  @Get('services')
  async getServicesStatus() {
    const discovery = this.serviceClient.getDiscovery();

    return {
      healthy: discovery.getHealthyServices(),
      unhealthy: discovery.getUnhealthyServices(),
      details: discovery.getAllHealthCheckResults(),
    };
  }
}
```

## Error Handling

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `CIRCUIT_BREAKER_OPEN` | Service is temporarily unavailable | Use cached data or return error |
| `SERVICE_UNREACHABLE` | Service is not responding | Retry or use fallback |
| `HTTP_5xx` | Server error | Retry with backoff |
| `HTTP_4xx` | Client error | Fix request and retry |
| `TIMEOUT` | Request timed out | Retry or increase timeout |

### Error Handling Pattern

```typescript
async function callService(serviceName: string, endpoint: string) {
  try {
    const client = serviceClientService.getClient(serviceName);
    const response = await client.get(endpoint);
    return response.data;
  } catch (error: any) {
    if (error.code === 'CIRCUIT_BREAKER_OPEN') {
      // Service is down, use fallback
      logger.warn(`Circuit breaker open for ${serviceName}`);
      return getFallbackData();
    } else if (error.code === 'SERVICE_UNREACHABLE') {
      // Service is not responding
      logger.error(`Service unreachable: ${serviceName}`);
      throw new ServiceUnavailableException();
    } else if (error.code?.startsWith('HTTP_5')) {
      // Server error, might be temporary
      logger.error(`Server error from ${serviceName}: ${error.code}`);
      throw new InternalServerErrorException();
    } else if (error.code?.startsWith('HTTP_4')) {
      // Client error, don't retry
      logger.error(`Client error from ${serviceName}: ${error.code}`);
      throw new BadRequestException();
    } else {
      // Unknown error
      logger.error(`Unknown error from ${serviceName}:`, error);
      throw error;
    }
  }
}
```

## Testing

### Unit Tests

```typescript
describe('OrderService', () => {
  let service: OrderService;
  let serviceClient: ServiceClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: ServiceClientService,
          useValue: {
            getClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    serviceClient = module.get<ServiceClientService>(ServiceClientService);
  });

  it('should create order with payment', async () => {
    const mockPaymentClient = {
      post: jest.fn().mockResolvedValue({
        status: 200,
        data: { id: 'payment-123' },
      }),
    };

    jest.spyOn(serviceClient, 'getClient').mockReturnValue(mockPaymentClient);

    const result = await service.createOrder({
      id: 'order-123',
      total: 100,
      userId: 'user-123',
    });

    expect(result.id).toBe('order-123');
    expect(mockPaymentClient.post).toHaveBeenCalled();
  });

  it('should handle circuit breaker open', async () => {
    const mockClient = {
      get: jest.fn().mockRejectedValue({
        code: 'CIRCUIT_BREAKER_OPEN',
        message: 'Service temporarily unavailable',
      }),
    };

    jest.spyOn(serviceClient, 'getClient').mockReturnValue(mockClient);

    const result = await service.getOrderDetails('order-123');
    expect(result.cached).toBe(true);
  });
});
```

## Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  auth-service:
    image: mnbara/auth-service:latest
    ports:
      - "3001:3001"
    environment:
      - USER_SERVICE_URL=http://user-service:3002
      - NOTIFICATION_SERVICE_URL=http://notification-service:3008
    depends_on:
      - postgres

  user-service:
    image: mnbara/user-service:latest
    ports:
      - "3002:3002"
    environment:
      - AUTH_SERVICE_URL=http://auth-service:3001
      - NOTIFICATION_SERVICE_URL=http://notification-service:3008
    depends_on:
      - postgres

  order-service:
    image: mnbara/order-service:latest
    ports:
      - "3003:3003"
    environment:
      - PAYMENT_SERVICE_URL=http://payment-service:3004
      - PRODUCT_SERVICE_URL=http://product-service:3006
      - WALLET_SERVICE_URL=http://wallet-service:3005
    depends_on:
      - postgres
```

### Kubernetes

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: service-urls
data:
  AUTH_SERVICE_URL: "http://auth-service:3001"
  USER_SERVICE_URL: "http://user-service:3002"
  ORDER_SERVICE_URL: "http://order-service:3003"
  PAYMENT_SERVICE_URL: "http://payment-service:3004"
  WALLET_SERVICE_URL: "http://wallet-service:3005"
  PRODUCT_SERVICE_URL: "http://product-service:3006"
  CART_SERVICE_URL: "http://cart-service:3007"
  NOTIFICATION_SERVICE_URL: "http://notification-service:3008"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: mnbara/order-service:latest
        ports:
        - containerPort: 3003
        envFrom:
        - configMapRef:
            name: service-urls
        livenessProbe:
          httpGet:
            path: /health
            port: 3003
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3003
          initialDelaySeconds: 10
          periodSeconds: 5
```

## Monitoring

### Metrics to Track

1. **Request Latency**: Response time for each service call
2. **Error Rate**: Percentage of failed requests
3. **Circuit Breaker State**: Open/Closed/Half-Open state
4. **Service Health**: Health check results
5. **Retry Count**: Number of retries per request

### Example Monitoring Setup

```typescript
// services/shared/monitoring/service-metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const serviceRequestDuration = new Histogram({
  name: 'service_request_duration_ms',
  help: 'Service request duration in milliseconds',
  labelNames: ['service', 'method', 'endpoint', 'status'],
});

export const serviceRequestErrors = new Counter({
  name: 'service_request_errors_total',
  help: 'Total service request errors',
  labelNames: ['service', 'error_code'],
});

export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
  labelNames: ['service'],
});

export const serviceHealth = new Gauge({
  name: 'service_health',
  help: 'Service health status (1=healthy, 0=unhealthy)',
  labelNames: ['service'],
});
```

## Troubleshooting

### Service Not Responding

1. Check service URL configuration
2. Verify service is running
3. Check network connectivity
4. Review service logs

### Circuit Breaker Open

1. Check service health
2. Review error logs
3. Verify service configuration
4. Check for cascading failures

### High Latency

1. Check service response times
2. Review database queries
3. Check network latency
4. Increase timeout if needed

### Retry Loop

1. Check retry configuration
2. Verify service is responding
3. Review error handling logic
4. Check for infinite retry loops

## References

- [Service Client Library Documentation](./shared/service-client/README.md)
- [API Gateway Documentation](./api-gateway/README.md)
- [NestJS Documentation](https://docs.nestjs.com)
- [Microservices Patterns](https://microservices.io/patterns/index.html)
