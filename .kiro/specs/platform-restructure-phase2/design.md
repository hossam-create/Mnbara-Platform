# Design Document: Platform Restructure Phase 2
## Creating Monorepo Structure with Nx

**Feature:** platform-restructure-phase2  
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** March 2, 2026

---

**⚠️ CRITICAL: DO NOT CREATE NEW APPS OR SERVICES. INTEGRATE EXISTING CODE ONLY.**

---

## 1. Architecture Overview

### 1.1 System Architecture
```
mnbara-platform/ (Nx Workspace Root)
├── apps/                          # Applications
│   ├── web/                      # Web Application (Next.js 15)
│   └── mobile/                    # Mobile Application (Flutter 3.x)
├── services/                      # Microservices
│   ├── core/                      # Core services
│   │   ├── auth-service/
│   │   ├── user-service/
│   │   └── notification-service/
│   ├── marketplace/               # E-commerce services
│   │   ├── product-service/
│   │   ├── order-service/
│   │   └── cart-service/
│   ├── crowdshipping/             # Delivery services
│   │   ├── trips-service/
│   │   └── matching-service/
│   └── financial/                 # Financial services
│       ├── payment-service/
│       ├── wallet-service/
│       ├── escrow-service/
│       └── settlement-service/
├── packages/                      # Shared packages
│   ├── @mnbara/types/            # Shared TypeScript types
│   ├── @mnbara/ui-components/    # UI Component library
│   ├── @mnbara/utils/            # Utility functions
│   ├── @mnbara/api-client/       # API client library
│   └── @mnbara/validation/       # Validation schemas
├── infrastructure/                 # Infrastructure as Code
├── docs/                          # Documentation
└── archive/                       # Archived services (read-only)
```

### 1.2 Technology Stack
- **Monorepo Tool:** Nx (with Nx Cloud for caching)
- **Package Manager:** npm
- **Frontend:** Next.js 15, TypeScript
- **Mobile:** Flutter 3.x
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Testing:** Jest, React Testing Library, Cypress
- **CI/CD:** GitHub Actions, Docker, Kubernetes

---

## 2. Directory Structure Specification

### 2.1 Root Structure
```
mnbara-platform/
├── .nx/                          # Nx cache and configuration
├── .nx/                          # Nx workspace cache
├── .github/                       # GitHub workflows
├── .vscode/                       # VS Code settings
├── apps/                          # Applications
│   ├── web/                       # Web application
│   └── mobile/                    # Mobile application
├── services/                      # Backend services
│   ├── core/                      # Core services
│   ├── marketplace/               # Marketplace services
│   ├── crowdshipping/              # Delivery services
│   └── financial/                 # Financial services
├── packages/                      # Shared packages
├── infrastructure/                 # Infrastructure as Code
├── docs/                          # Documentation
├── scripts/                       # Build and utility scripts
└── archive/                       # Archived services (read-only)
```

### 2.2 Package Structure
Each service/package follows this structure:
```
service-name/
├── src/
│   ├── index.ts                   # Main entry point
│   ├── types/                     # TypeScript types
│   ├── services/                  # Business logic
│   ├── controllers/               # Request handlers
│   ├── middleware/                 # Express middleware
│   ├── routes/                    # API routes
│   └── tests/                     # Unit tests
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml (if needed)
└── README.md
```

---

## 3. Shared Packages Design

### 3.1 @mnbara/types
**Purpose:** Shared TypeScript type definitions
```typescript
// packages/types/src/index.ts
export * from './user.types';
export * from './order.types';
export * from './payment.types';
export * from './delivery.types';
export * from './common.types';
```

**Key Types:**
```typescript
// User-related types
interface User {
  id: string;
  email: string;
  roles: UserRole[];
  profile: UserProfile;
}

// Order-related types
interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  currency: Currency;
}

// Payment-related types
interface Payment {
  id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  metadata: PaymentMetadata;
}
```

### 3.2 @mnbara/ui-components
**Purpose:** Reusable React components
```typescript
// Button component example
export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  ...props 
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### 3.3 @mnbara/utils
**Purpose:** Shared utility functions
```typescript
// Currency formatting
export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Date utilities
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  // Date formatting logic
};
```

### 3.4 @mnbara/api-client
**Purpose:** Type-safe API client
```typescript
export class ApiClient {
  private client: AxiosInstance;
  
  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });
  }
  
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }
}
```

### 3.5 @mnbara/validation
**Purpose:** Data validation schemas
```typescript
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shippingAddress: addressSchema,
  paymentMethod: paymentMethodSchema,
});
```

---

## 4. Service Architecture

### 4.1 Core Services
```
services/core/
├── auth-service/           # Authentication & Authorization
├── user-service/          # User management
└── notification-service/  # Notifications & alerts
```

### 4.2 Marketplace Services
```
services/marketplace/
├── product-service/       # Product catalog
├── order-service/         # Order management
└── cart-service/         # Shopping cart
```

### 4.3 Crowdshipping Services
```
services/crowdshipping/
├── trips-service/         # Delivery trips
└── matching-service/      # Trip-driver matching
```

### 4.4 Financial Services
```
services/financial/
├── payment-service/        # Payment processing
├── wallet-service/        # Digital wallet
├── escrow-service/        # Escrow management
└── settlement-service/    # Financial settlements
```

---

## 5. Configuration Management

### 5.1 Environment Configuration
```typescript
// config/default.json
{
  "environment": "development",
  "api": {
    "baseUrl": "http://localhost:3000",
    "timeout": 30000
  },
  "database": {
    "url": "postgresql://localhost:5432/mnbara",
    "pool": {
      "min": 2,
      "max": 10
    }
  }
}
```

### 5.2 Environment Variables
```bash
# .env.example
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/mnbara
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

---

## 6. Testing Strategy

### 6.1 Unit Testing
```typescript
// Example test for utility function
describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toBe('$1,234.56');
  });
});
```

### 6.2 Integration Testing
```typescript
describe('Order Service', () => {
  it('should create an order', async () => {
    const order = await orderService.createOrder({
      items: [/* items */],
      userId: 'user-123'
    });
    
    expect(order).toHaveProperty('id');
    expect(order.status).toBe('pending');
  });
});
```

### 6.3 E2E Testing
```typescript
describe('Checkout Flow', () => {
  it('completes purchase flow', async () => {
    await page.goto('/products/1');
    await page.click('button[data-testid="add-to-cart"]');
    await page.click('button[data-testid="checkout"]');
    // ... complete checkout flow
  });
});
```

---

## 7. Deployment Architecture

### 7.1 Development Environment
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: mnbara_dev
      POSTGRES_USER: mnbara
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### 7.2 Production Architecture
```
Load Balancer (Nginx)
├── Web Application (apps/web)
├── Mobile API Gateway
├── Auth Service
├── Product Service
├── Order Service
└── Payment Service
```

---

## 8. Monitoring & Observability

### 8.1 Logging Strategy
```typescript
// Centralized logging
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.Console()
  ]
});
```

### 8.2 Metrics Collection
- **Application Metrics:** Response times, error rates
- **Business Metrics:** Orders, revenue, active users
- **Infrastructure:** CPU, memory, disk usage

---

## 9. Security Considerations

### 9.1 Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API key management for services

### 9.2 Data Protection
- Encryption at rest and in transit
- Regular security audits
- Penetration testing

### 9.3 Compliance
- GDPR compliance for EU users
- PCI DSS for payment processing
- Data retention policies

---

## 10. Migration Strategy

### Phase 1: Foundation (Week 1-2)
1. Set up Nx workspace
2. Create shared packages
3. Configure CI/CD pipeline

### Phase 2: Service Migration (Week 3-4)
1. Migrate authentication service
2. Migrate product catalog
3. Migrate order management

### Phase 3: Integration (Week 5-6)
1. Service-to-service communication
2. Data migration
3. Performance testing

### Phase 4: Optimization (Week 7-8)
1. Performance optimization
2. Security hardening
3. Documentation

---

## 11. Success Metrics

### 11.1 Performance Metrics
- Build time reduction: Target 50% faster builds
- Deployment frequency: Multiple deployments per day
- Error rate: < 0.1% of requests
- Response time: < 200ms p95

### 11.2 Business Metrics
- Time to market for new features
- Developer onboarding time
- Infrastructure cost reduction

---

## 12. Risk Mitigation

### 12.1 Technical Risks
- **Risk:** Service discovery failures
  - **Mitigation:** Implement service mesh with Istio
- **Risk:** Data consistency issues
  - **Mitigation:** Saga pattern for distributed transactions
- **Risk:** Performance bottlenecks
  - **Mitigation:** Load testing with k6 or Gatling

### 12.2 Operational Risks
- **Risk:** Single point of failure
  - **Mitigation:** Multi-AZ deployment with failover
- **Risk:** Data loss
  - **Mitigation:** Regular backups and point-in-time recovery

---

## 13. Correctness Properties

### 13.1 Structural Properties
**Property 1: Directory Structure**
```typescript
// Property: All applications must be in apps/ directory
const hasValidAppStructure = (structure: DirectoryTree): boolean => {
  return structure.apps && 
         structure.apps.web && 
         structure.apps.mobile;
};

// Property: All services must be in services/ directory
const hasValidServiceStructure = (structure: DirectoryTree): boolean => {
  const requiredServices = ['core', 'marketplace', 'crowdshipping', 'financial'];
  return requiredServices.every(service => 
    structure.services[service] !== undefined
  );
};
```

**Property 2: Package Dependencies**
```typescript
// Property: No circular dependencies between packages
const hasNoCircularDeps = (packages: Package[]): boolean => {
  // Implementation of cycle detection
  return !hasCycles(buildDependencyGraph(packages));
};

// Property: All packages must have proper exports
const hasValidExports = (pkg: Package): boolean => {
  return pkg.exports && 
         pkg.exports['.'] && 
         pkg.exports['./package.json'];
};
```

**Property 3: Configuration Validation**
```typescript
// Property: All services must have required configuration
const hasValidConfig = (service: Service): boolean => {
  const requiredConfig = ['name', 'port', 'database'];
  return requiredConfig.every(key => service.config[key] !== undefined);
};
```

### 13.2 Runtime Properties
**Property 4: Service Health**
```typescript
// Property: All services must have health endpoints
const hasHealthEndpoint = (service: Service): boolean => {
  return service.endpoints.some(endpoint => 
    endpoint.path === '/health' && 
    endpoint.method === 'GET'
  );
};

// Property: Services must respond within timeout
const respondsWithinTimeout = async (service: Service, timeout: number): Promise<boolean> => {
  const start = Date.now();
  await service.healthCheck();
  const responseTime = Date.now() - start;
  return responseTime < timeout;
};
```

**Property 5: Data Consistency**
```typescript
// Property: All database transactions must be atomic
const isTransactionAtomic = async (transaction: Transaction): Promise<boolean> => {
  try {
    await transaction.execute();
    return transaction.isCommitted() || transaction.isRolledBack();
  } catch (error) {
    return transaction.isRolledBack();
  }
};
```

### 13.3 Security Properties
**Property 6: Authentication Required**
```typescript
// Property: All protected endpoints require authentication
const requiresAuth = (endpoint: Endpoint): boolean => {
  if (endpoint.requiresAuth) {
    return endpoint.middleware.includes('authenticate');
  }
  return true;
};
```

**Property 7: Input Validation**
```typescript
// Property: All user input must be validated
const hasInputValidation = (endpoint: Endpoint): boolean => {
  return endpoint.validators.length > 0;
};
```

### 13.4 Performance Properties
**Property 8: Response Time**
```typescript
// Property: 95th percentile response time < 200ms
const meetsPerformanceSLA = (responseTimes: number[]): boolean => {
  const sorted = responseTimes.sort((a, b) => a - b);
  const p95Index = Math.floor(sorted.length * 0.95);
  return sorted[p95Index] < 200;
};
```

**Property 9: Error Rate**
```typescript
// Property: Error rate must be below 1%
const meetsErrorRateSLA = (requests: Request[]): boolean => {
  const total = requests.length;
  const errors = requests.filter(r => r.status >= 500).length;
  return (errors / total) < 0.01;
};
```

### 13.5 Business Logic Properties
**Property 10: Order Total Calculation**
```typescript
// Property: Order total = sum(item.price * quantity) + tax - discount
const orderTotalCorrect = (order: Order): boolean => {
  const itemsTotal = order.items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0);
  const tax = itemsTotal * TAX_RATE;
  const discount = order.discount || 0;
  
  const expectedTotal = itemsTotal + tax - discount;
  return Math.abs(order.total - expectedTotal) < 0.01;
};
```

**Property 11: Inventory Consistency**
```typescript
// Property: Inventory cannot go negative
const inventoryNonNegative = (inventory: Inventory): boolean => {
  return inventory.quantity >= 0;
};
```

### 13.6 Integration Properties
**Property 12: Eventual Consistency**
```typescript
// Property: All replicas eventually consistent
const isEventuallyConsistent = async (key: string, replicas: Replica[]): Promise<boolean> => {
  const values = await Promise.all(
    replicas.map(r => r.read(key))
  );
  // All replicas should have same value eventually
  return values.every(v => v === values[0]);
};
```

**Property 13: Idempotency**
```typescript
// Property: Idempotent operations
const isIdempotent = async (operation: Operation, idempotencyKey: string): Promise<boolean> => {
  const result1 = await operation.execute();
  const result2 = await operation.execute(); // Same idempotency key
  
  return result1 === result2;
};
```

### 13.7 Testing Properties
These properties will be tested using property-based testing with fast-check:

```typescript
import * as fc from 'fast-check';

// Property: All user emails must be valid
const emailProperty = fc.property(
  fc.emailAddress(),
  (email) => {
    const user = { email, name: 'Test User' };
    const result = validateUser(user);
    return result.valid === (email.includes('@'));
  }
);

// Property: Order total calculation
const orderTotalProperty = fc.property(
  fc.array(fc.record({
    price: fc.float({ min: 0.01, max: 1000 }),
    quantity: fc.integer({ min: 1, max: 100 })
  })),
  (items) => {
    const order = createOrder(items);
    const expectedTotal = items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
    
    return Math.abs(order.total - expectedTotal) < 0.01;
  }
);
```

### 13.8 Property-Based Tests
```typescript
describe('Order Service Properties', () => {
  it('should always calculate correct order total', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          price: fc.float({ min: 0.01, max: 1000 }),
          quantity: fc.integer({ min: 1, max: 100 })
        })),
        (items) => {
          const order = createOrder(items);
          const expected = items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
          return Math.abs(order.total - expected) < 0.01;
        }
      )
    );
  });
});
```

### 13.9 Monitoring Properties
**Property 14: Health Check**
```typescript
// Property: All services must respond to health checks
const allServicesHealthy = async (services: Service[]): Promise<boolean> => {
  const healthChecks = services.map(s => s.healthCheck());
  const results = await Promise.all(healthChecks);
  return results.every(result => result.healthy);
};
```

**Property 15: Resource Limits**
```typescript
// Property: Memory usage must stay below threshold
const memoryUsageProperty = (service: Service): boolean => {
  const memoryUsage = process.memoryUsage();
  return memoryUsage.heapUsed < service.memoryLimit;
};
```

### 13.10 Security Properties
**Property 16: No Hardcoded Secrets**
```typescript
// Property: No secrets in source code
const hasNoHardcodedSecrets = (code: string): boolean => {
  const secrets = ['password', 'secret', 'key', 'token'];
  return !secrets.some(secret => 
    code.toLowerCase().includes(secret)
  );
};
```

These properties will be encoded as property-based tests using a library like fast-check or jsverify, ensuring that the system maintains these invariants throughout development and in production.

---

## 14. Implementation Plan

### Phase 1: Foundation (Week 1-2)
1. Set up Nx workspace
2. Create shared packages
3. Configure CI/CD pipeline

### Phase 2: Service Migration (Week 3-4)
1. Migrate authentication service
2. Migrate product catalog
3. Migrate order management

### Phase 3: Integration (Week 5-6)
1. Service-to-service communication
2. Data migration
3. Performance testing

### Phase 4: Optimization (Week 7-8)
1. Performance optimization
2. Security hardening
3. Documentation

---

## 15. Success Criteria

### 15.1 Technical Success Criteria
- [ ] All services build and test successfully
- [ ] 95% test coverage for shared packages
- [ ] Build time under 10 minutes
- [ ] Zero critical security vulnerabilities

### 15.2 Business Success Criteria
- [ ] 50% reduction in build time
- [ ] 30% faster deployment frequency
- [ ] 99.9% service availability

---

## 16. Risk Mitigation

### 16.1 Technical Risks
- **Risk:** Service discovery failures
  - **Mitigation:** Implement service mesh with Istio
- **Risk:** Data consistency issues
  - **Mitigation:** Saga pattern for distributed transactions
- **Risk:** Performance bottlenecks
  - **Mitigation:** Load testing with k6

### 16.2 Operational Risks
- **Risk:** Single point of failure
  - **Mitigation:** Multi-AZ deployment with failover
- **Risk:** Data loss
  - **Mitigation:** Regular backups and point-in-time recovery

---

## 17. Monitoring and Alerting

### 17.1 Key Metrics
- Application performance (APM)
- Business metrics (orders, revenue)
- Infrastructure health

### 17.2 Alerting Strategy
- Real-time alerting for critical issues
- Business hour vs after-hours alerts
- Escalation policies

---

## 18. Rollback Plan

### 18.1 Rollback Triggers
- 5% increase in error rate
- Performance degradation > 20%
- Critical security vulnerability

### 18.2 Rollback Procedure
1. Automated rollback on critical failure
2. Manual approval for non-critical issues
3. Staged rollback for data consistency

---

## 19. Success Metrics

### 19.1 Technical Metrics
- Build time reduction: Target 50% reduction
- Deployment frequency: Multiple times per day
- Mean time to recovery: < 1 hour

### 19.2 Business Metrics
- Time to market for new features
- Developer productivity
- Infrastructure cost optimization

---

## 20. Appendices

### A. Technology Choices
- **Monorepo Tool:** Nx for monorepo management
- **Frontend:** Next.js 15, TypeScript
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL, Redis
- **Testing:** Jest, React Testing Library, Cypress

### B. Team Structure
- **Platform Team:** Infrastructure and shared packages
- **Product Teams:** Feature development
- **DevOps Team:** CI/CD and infrastructure

### C. Change Management
- Weekly sync meetings
- Bi-weekly demos
- Monthly retrospectives

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Status:** Draft for Review