# Service Client Implementation Example

This document provides a complete example of implementing service-to-service communication in a NestJS microservice.

## Project Structure

```
order-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── service-client/
│   │   ├── service-client.module.ts
│   │   └── service-client.service.ts
│   ├── order/
│   │   ├── order.module.ts
│   │   ├── order.controller.ts
│   │   ├── order.service.ts
│   │   └── dto/
│   │       ├── create-order.dto.ts
│   │       └── order.dto.ts
│   └── health/
│       ├── health.controller.ts
│       └── health.service.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Step 1: Configuration

### .env.example

```bash
# Service Configuration
NODE_ENV=development
PORT=3003

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/order_service

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
WALLET_SERVICE_URL=http://localhost:3005
PRODUCT_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3008

# Service Communication
SERVICE_TIMEOUT=30000
SERVICE_RETRIES=3
SERVICE_RETRY_DELAY=1000

# Health Checks
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# Logging
LOG_LEVEL=info
```

### src/config/configuration.ts

```typescript
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3003', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    },
    user: {
      url: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    },
    payment: {
      url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
    },
    wallet: {
      url: process.env.WALLET_SERVICE_URL || 'http://localhost:3005',
    },
    product: {
      url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3006',
    },
    notification: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
    },
  },
  communication: {
    timeout: parseInt(process.env.SERVICE_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.SERVICE_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.SERVICE_RETRY_DELAY || '1000', 10),
  },
  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
```

## Step 2: Service Client Module

### src/service-client/service-client.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ServiceClientService } from './service-client.service';

@Module({
  providers: [ServiceClientService],
  exports: [ServiceClientService],
})
export class ServiceClientModule {}
```

### src/service-client/service-client.service.ts

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createServiceRegistry,
  createServiceClient,
  createServiceDiscovery,
  ServiceClient,
  ServiceRegistry,
} from '@mnbara/service-client';

@Injectable()
export class ServiceClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServiceClientService.name);
  private registry: any;
  private discovery: any;
  private clients: Map<string, ServiceClient> = new Map();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.logger.log('Initializing service clients...');
    this.initializeServices();
    this.logger.log('Service clients initialized');
  }

  onModuleDestroy() {
    this.logger.log('Destroying service clients...');
    this.discovery?.destroy();
  }

  private initializeServices() {
    // Create registry
    this.registry = createServiceRegistry(this.logger);

    // Get configuration
    const servicesConfig = this.configService.get('services');
    const communicationConfig = this.configService.get('communication');

    // Register all services
    this.registry.registerMultiple([
      {
        name: 'auth-service',
        baseURL: servicesConfig.auth.url,
        timeout: communicationConfig.timeout,
        retries: communicationConfig.retries,
        retryDelay: communicationConfig.retryDelay,
      },
      {
        name: 'user-service',
        baseURL: servicesConfig.user.url,
        timeout: communicationConfig.timeout,
        retries: communicationConfig.retries,
        retryDelay: communicationConfig.retryDelay,
      },
      {
        name: 'payment-service',
        baseURL: servicesConfig.payment.url,
        timeout: communicationConfig.timeout,
        retries: communicationConfig.retries,
        retryDelay: communicationConfig.retryDelay,
      },
      {
        name: 'wallet-service',
        baseURL: servicesConfig.wallet.url,
        timeout: communicationConfig.timeout,
        retries: communicationConfig.retries,
        retryDelay: communicationConfig.retryDelay,
      },
      {
        name: 'product-service',
        baseURL: servicesConfig.product.url,
        timeout: communicationConfig.timeout,
        retries: communicationConfig.retries,
        retryDelay: communicationConfig.retryDelay,
      },
      {
        name: 'notification-service',
        baseURL: servicesConfig.notification.url,
        timeout: communicationConfig.timeout,
        retries: communicationConfig.retries,
        retryDelay: communicationConfig.retryDelay,
      },
    ]);

    // Create clients
    this.registry.getAllServices().forEach((service: any) => {
      const client = createServiceClient(service, this.logger);
      this.clients.set(service.name, client);
    });

    // Create service discovery
    const healthCheckConfig = this.configService.get('healthCheck');
    this.discovery = createServiceDiscovery(
      {
        enableHealthChecks: healthCheckConfig.enabled,
        healthCheckInterval: healthCheckConfig.interval,
        healthCheckTimeout: healthCheckConfig.timeout,
      },
      this.logger
    );

    // Register clients for health checks
    this.clients.forEach((client, serviceName) => {
      this.discovery.registerClient(serviceName, client);
    });

    this.logger.log(`Registered ${this.clients.size} service clients`);
  }

  /**
   * Get a service client by name
   */
  getClient(serviceName: string): ServiceClient {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new Error(`Service client not found: ${serviceName}`);
    }
    return client;
  }

  /**
   * Get service discovery instance
   */
  getDiscovery() {
    return this.discovery;
  }

  /**
   * Get service registry
   */
  getRegistry() {
    return this.registry;
  }

  /**
   * Check if a service is healthy
   */
  isServiceHealthy(serviceName: string): boolean {
    return this.discovery.isServiceHealthy(serviceName);
  }

  /**
   * Get all healthy services
   */
  getHealthyServices(): string[] {
    return this.discovery.getHealthyServices();
  }

  /**
   * Get all unhealthy services
   */
  getUnhealthyServices(): string[] {
    return this.discovery.getUnhealthyServices();
  }

  /**
   * Get discovery status
   */
  getStatus() {
    return this.discovery.getStatus();
  }
}
```

## Step 3: Order Service Implementation

### src/order/dto/create-order.dto.ts

```typescript
export class CreateOrderDto {
  userId: string;
  items: OrderItemDto[];
  shippingAddress: AddressDto;
}

export class OrderItemDto {
  productId: string;
  quantity: number;
  price: number;
}

export class AddressDto {
  street: string;
  city: string;
  country: string;
  zipCode: string;
}
```

### src/order/dto/order.dto.ts

```typescript
export class OrderDto {
  id: string;
  userId: string;
  items: OrderItemDto[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

### src/order/order.service.ts

```typescript
import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@nestjs/prisma';
import { ServiceClientService } from '../service-client/service-client.service';
import { CreateOrderDto, OrderDto } from './dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private serviceClient: ServiceClientService
  ) {}

  /**
   * Create a new order
   */
  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderDto> {
    this.logger.log(`Creating order for user ${createOrderDto.userId}`);

    try {
      // Validate user exists
      await this.validateUser(createOrderDto.userId);

      // Validate products exist and get prices
      const products = await this.validateProducts(createOrderDto.items);

      // Calculate total
      const total = this.calculateTotal(createOrderDto.items, products);

      // Process payment
      const payment = await this.processPayment(createOrderDto.userId, total);

      // Create order in database
      const order = await this.prisma.order.create({
        data: {
          userId: createOrderDto.userId,
          items: {
            create: createOrderDto.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          total,
          status: 'confirmed',
          paymentId: payment.id,
        },
      });

      // Send notification
      await this.sendOrderConfirmation(createOrderDto.userId, order.id);

      this.logger.log(`Order created: ${order.id}`);
      return this.mapToDto(order);
    } catch (error: any) {
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new BadRequestException(`Order not found: ${orderId}`);
    }

    return this.mapToDto(order);
  }

  /**
   * Validate user exists
   */
  private async validateUser(userId: string): Promise<void> {
    try {
      const userClient = this.serviceClient.getClient('user-service');
      const response = await userClient.get(`/users/${userId}`);

      if (response.status !== 200) {
        throw new BadRequestException(`User not found: ${userId}`);
      }
    } catch (error: any) {
      if (error.code === 'CIRCUIT_BREAKER_OPEN') {
        this.logger.warn('User service circuit breaker open, using cached validation');
        // Use cached validation or allow request
      } else {
        throw new InternalServerErrorException('Failed to validate user');
      }
    }
  }

  /**
   * Validate products exist
   */
  private async validateProducts(items: any[]): Promise<Map<string, any>> {
    try {
      const productClient = this.serviceClient.getClient('product-service');
      const products = new Map();

      for (const item of items) {
        const response = await productClient.get(`/products/${item.productId}`);

        if (response.status !== 200) {
          throw new BadRequestException(`Product not found: ${item.productId}`);
        }

        products.set(item.productId, response.data);
      }

      return products;
    } catch (error: any) {
      if (error.code === 'CIRCUIT_BREAKER_OPEN') {
        this.logger.warn('Product service circuit breaker open');
        throw new InternalServerErrorException('Product service temporarily unavailable');
      }
      throw error;
    }
  }

  /**
   * Calculate order total
   */
  private calculateTotal(items: any[], products: Map<string, any>): number {
    let total = 0;

    for (const item of items) {
      const product = products.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product not found: ${item.productId}`);
      }

      total += product.price * item.quantity;
    }

    return total;
  }

  /**
   * Process payment
   */
  private async processPayment(userId: string, amount: number): Promise<any> {
    try {
      const paymentClient = this.serviceClient.getClient('payment-service');

      const response = await paymentClient.post('/payments', {
        userId,
        amount,
        currency: 'USD',
        description: 'Order payment',
      });

      if (response.status !== 200) {
        throw new InternalServerErrorException('Payment processing failed');
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 'CIRCUIT_BREAKER_OPEN') {
        throw new InternalServerErrorException('Payment service temporarily unavailable');
      }
      throw error;
    }
  }

  /**
   * Send order confirmation
   */
  private async sendOrderConfirmation(userId: string, orderId: string): Promise<void> {
    try {
      const notificationClient = this.serviceClient.getClient('notification-service');

      await notificationClient.post('/notifications', {
        userId,
        type: 'order_confirmation',
        data: {
          orderId,
        },
      });
    } catch (error: any) {
      // Log error but don't fail the order creation
      this.logger.error(`Failed to send order confirmation: ${error.message}`);
    }
  }

  /**
   * Map order to DTO
   */
  private mapToDto(order: any): OrderDto {
    return {
      id: order.id,
      userId: order.userId,
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
```

### src/order/order.controller.ts

```typescript
import { Controller, Post, Get, Body, Param, HttpCode } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, OrderDto } from './dto';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  @HttpCode(201)
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderDto> {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<OrderDto> {
    return this.orderService.getOrder(id);
  }
}
```

### src/order/order.module.ts

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '@nestjs/prisma';
import { ServiceClientModule } from '../service-client/service-client.module';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
  imports: [PrismaModule, ServiceClientModule],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
```

## Step 4: Health Check Implementation

### src/health/health.controller.ts

```typescript
import { Controller, Get } from '@nestjs/common';
import { ServiceClientService } from '../service-client/service-client.service';

@Controller('health')
export class HealthController {
  constructor(private serviceClient: ServiceClientService) {}

  @Get()
  async getHealth() {
    const status = this.serviceClient.getStatus();

    return {
      status: status.unhealthyServices === 0 ? 'healthy' : 'degraded',
      timestamp: new Date(),
      services: status.services.map(s => ({
        name: s.service,
        healthy: s.healthy,
        responseTime: s.responseTime,
        lastCheck: s.lastCheck,
      })),
    };
  }

  @Get('services')
  async getServicesStatus() {
    return {
      healthy: this.serviceClient.getHealthyServices(),
      unhealthy: this.serviceClient.getUnhealthyServices(),
    };
  }
}
```

## Step 5: Main Application Module

### src/app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@nestjs/prisma';
import configuration from './config/configuration';
import { ServiceClientModule } from './service-client/service-client.module';
import { OrderModule } from './order/order.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    ServiceClientModule,
    OrderModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

### src/main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const port = process.env.PORT || 3003;
  await app.listen(port);

  logger.log(`Order Service running on port ${port}`);
}

bootstrap();
```

## Testing

### src/order/order.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { OrderService } from './order.service';
import { ServiceClientService } from '../service-client/service-client.service';
import { PrismaService } from '@nestjs/prisma';

describe('OrderService', () => {
  let service: OrderService;
  let serviceClient: ServiceClientService;
  let prisma: PrismaService;

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
        {
          provide: PrismaService,
          useValue: {
            order: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    serviceClient = module.get<ServiceClientService>(ServiceClientService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const mockUserClient = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          data: { id: 'user-123' },
        }),
      };

      const mockProductClient = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          data: { id: 'product-123', price: 100 },
        }),
      };

      const mockPaymentClient = {
        post: jest.fn().mockResolvedValue({
          status: 200,
          data: { id: 'payment-123' },
        }),
      };

      const mockNotificationClient = {
        post: jest.fn().mockResolvedValue({
          status: 200,
        }),
      };

      jest.spyOn(serviceClient, 'getClient').mockImplementation((serviceName: string) => {
        switch (serviceName) {
          case 'user-service':
            return mockUserClient as any;
          case 'product-service':
            return mockProductClient as any;
          case 'payment-service':
            return mockPaymentClient as any;
          case 'notification-service':
            return mockNotificationClient as any;
          default:
            throw new Error(`Unknown service: ${serviceName}`);
        }
      });

      jest.spyOn(prisma.order, 'create').mockResolvedValue({
        id: 'order-123',
        userId: 'user-123',
        items: [{ productId: 'product-123', quantity: 1, price: 100 }],
        total: 100,
        status: 'confirmed',
        paymentId: 'payment-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createOrder({
        userId: 'user-123',
        items: [{ productId: 'product-123', quantity: 1, price: 100 }],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          country: 'USA',
          zipCode: '10001',
        },
      });

      expect(result.id).toBe('order-123');
      expect(result.status).toBe('confirmed');
    });

    it('should handle payment service circuit breaker open', async () => {
      const mockUserClient = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          data: { id: 'user-123' },
        }),
      };

      const mockProductClient = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          data: { id: 'product-123', price: 100 },
        }),
      };

      const mockPaymentClient = {
        post: jest.fn().mockRejectedValue({
          code: 'CIRCUIT_BREAKER_OPEN',
          message: 'Service temporarily unavailable',
        }),
      };

      jest.spyOn(serviceClient, 'getClient').mockImplementation((serviceName: string) => {
        switch (serviceName) {
          case 'user-service':
            return mockUserClient as any;
          case 'product-service':
            return mockProductClient as any;
          case 'payment-service':
            return mockPaymentClient as any;
          default:
            throw new Error(`Unknown service: ${serviceName}`);
        }
      });

      await expect(
        service.createOrder({
          userId: 'user-123',
          items: [{ productId: 'product-123', quantity: 1, price: 100 }],
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            country: 'USA',
            zipCode: '10001',
          },
        })
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
```

## Running the Service

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run migrations
npm run migrate

# Start the service
npm run start

# Start in development mode
npm run start:dev

# Run tests
npm run test
```

## Next Steps

1. Implement similar service client setup in other services
2. Set up monitoring and metrics collection
3. Configure logging and tracing
4. Set up integration tests
5. Deploy to development environment
