# Phase 7 - Hybrid Testing Strategy: Mocks + Real Functions

**Objective:** Combine fast unit tests with real integration tests  
**Approach:** Use mocks for unit tests, real functions for integration tests

---

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          (5% - Real browser, real API)
                 /________\
                /          \
               /Integration \     (15% - Real functions, MSW)
              /____________\
             /              \
            / Unit Tests     \   (80% - Mocks, fast)
           /________________\
```

---

## Test Types & Strategies

### 1. Unit Tests (80%) - Use Mocks
**Purpose:** Test component logic in isolation  
**Speed:** Fast (< 1ms per test)  
**Setup:** Mock data + MSW handlers

```typescript
// Unit test - uses mocks
it('should render with mock data', () => {
  const mockRequest = createMockExchangeRequest();
  render(<Component request={mockRequest} />);
  expect(screen.getByTestId('component')).toBeInTheDocument();
});
```

### 2. Integration Tests (15%) - Use Real Functions
**Purpose:** Test component + service interaction  
**Speed:** Medium (10-100ms per test)  
**Setup:** Real service functions, MSW for API

```typescript
// Integration test - uses real functions
it('should load and display real data', async () => {
  const realService = new ExchangeRequestService();
  const requests = await realService.getRequests();
  
  render(<Component requests={requests} />);
  expect(screen.getByTestId('request-list')).toBeInTheDocument();
});
```

### 3. E2E Tests (5%) - Use Real Everything
**Purpose:** Test complete user flow  
**Speed:** Slow (1-10s per test)  
**Setup:** Real API, real database, real browser

```typescript
// E2E test - uses real everything
it('should complete full exchange flow', async () => {
  await page.goto('http://localhost:3000');
  await page.fill('[data-testid="amount"]', '100');
  await page.click('[data-testid="submit"]');
  await page.waitForSelector('[data-testid="success"]');
});
```

---

## Implementation: Real Functions for Integration Tests

### Step 1: Create Real Service Functions

```typescript
// src/services/exchange-request.service.ts
export class ExchangeRequestService {
  private apiClient = new ApiClient();

  async getRequests(filters?: Filters): Promise<ExchangeRequest[]> {
    const response = await this.apiClient.get('/exchange-requests', { params: filters });
    return response.data;
  }

  async getRequestById(id: number): Promise<ExchangeRequest> {
    const response = await this.apiClient.get(`/exchange-requests/${id}`);
    return response.data;
  }

  async createRequest(data: CreateRequestDTO): Promise<ExchangeRequest> {
    const response = await this.apiClient.post('/exchange-requests', data);
    return response.data;
  }

  async updateRequest(id: number, data: UpdateRequestDTO): Promise<ExchangeRequest> {
    const response = await this.apiClient.patch(`/exchange-requests/${id}`, data);
    return response.data;
  }
}
```

### Step 2: Create Integration Test Utilities

```typescript
// src/__tests__/utils/integration-test-utils.ts
import { ExchangeRequestService } from '../../services/exchange-request.service';

export class IntegrationTestHelper {
  private service: ExchangeRequestService;

  constructor() {
    this.service = new ExchangeRequestService();
  }

  async createTestRequest(overrides?: Partial<CreateRequestDTO>) {
    return this.service.createRequest({
      fromCurrency: 'USD',
      toCurrency: 'SAR',
      fromAmount: '100',
      toAmount: '375',
      ...overrides,
    });
  }

  async getTestRequests() {
    return this.service.getRequests();
  }

  async cleanupTestData(requestId: number) {
    // Clean up test data if needed
  }
}
```

### Step 3: Write Integration Tests

```typescript
// src/components/p2p-exchange/__tests__/MarketplaceRequestCard.integration.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketplaceRequestCard } from '../MarketplaceRequestCard';
import { IntegrationTestHelper } from '../../../__tests__/utils/integration-test-utils';

describe('MarketplaceRequestCard - Integration Tests', () => {
  let helper: IntegrationTestHelper;
  let testRequestId: number;

  beforeEach(async () => {
    helper = new IntegrationTestHelper();
    const request = await helper.createTestRequest();
    testRequestId = request.id;
  });

  afterEach(async () => {
    await helper.cleanupTestData(testRequestId);
  });

  it('should render with real data from service', async () => {
    const requests = await helper.getTestRequests();
    const request = requests.find(r => r.id === testRequestId);

    render(
      <MarketplaceRequestCard
        request={request!}
        onAccept={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );

    expect(screen.getByTestId('marketplace-request-card')).toBeInTheDocument();
    expect(screen.getByTestId('request-id')).toHaveTextContent(`Request #${testRequestId}`);
  });

  it('should display correct exchange rate from real data', async () => {
    const requests = await helper.getTestRequests();
    const request = requests.find(r => r.id === testRequestId);

    render(
      <MarketplaceRequestCard
        request={request!}
        onAccept={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );

    expect(screen.getByText(new RegExp(request!.desiredRate))).toBeInTheDocument();
  });
});
```

---

## File Organization

```
src/
├── __tests__/
│   ├── fixtures/
│   │   └── mock-data.ts              (Mock data for unit tests)
│   ├── utils/
│   │   ├── test-utils.tsx            (Unit test utilities)
│   │   └── integration-test-utils.ts (Integration test utilities)
│   ├── mocks/
│   │   ├── handlers.ts               (MSW handlers)
│   │   └── server.ts                 (MSW server)
│   └── setup.ts                      (Test setup)
├── services/
│   ├── exchange-request.service.ts   (Real service)
│   └── __tests__/
│       └── exchange-request.service.test.ts (Service unit tests)
└── components/
    └── p2p-exchange/
        ├── MarketplaceRequestCard.tsx
        └── __tests__/
            ├── MarketplaceRequestCard.test.tsx           (Unit tests - mocks)
            └── MarketplaceRequestCard.integration.test.tsx (Integration tests - real)
```

---

## Test Naming Convention

```
// Unit tests - use .test.tsx
MarketplaceRequestCard.test.tsx
├── should render with mock data
├── should handle click with mock callback
└── should display mock values

// Integration tests - use .integration.test.tsx
MarketplaceRequestCard.integration.test.tsx
├── should render with real data from service
├── should display correct exchange rate from real data
└── should handle real API errors
```

---

## Running Tests by Type

```bash
# Run all tests
npm run test:run

# Run only unit tests (fast)
npm run test:run -- --grep "^(?!.*integration)"

# Run only integration tests
npm run test:run -- --grep "integration"

# Run only E2E tests
npm run test:run -- --grep "e2e"

# Run with coverage (unit tests only)
npm run test:coverage -- --grep "^(?!.*integration)"
```

---

## Configuration: vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Test organization
    include: [
      'src/**/*.test.{ts,tsx}',           // Unit tests
      'src/**/*.integration.test.{ts,tsx}', // Integration tests
      'src/**/*.e2e.test.{ts,tsx}',       // E2E tests
    ],
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.integration.test.ts',
        '**/*.integration.test.tsx',
        '**/*.e2e.test.ts',
        '**/*.e2e.test.tsx',
      ],
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Example: Complete Hybrid Test Suite

### Unit Test (Mock Data)
```typescript
// MarketplaceRequestCard.test.tsx
describe('MarketplaceRequestCard - Unit Tests', () => {
  it('should render with mock data', () => {
    const mockRequest = createMockExchangeRequest();
    render(
      <MarketplaceRequestCard
        request={mockRequest}
        onAccept={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    expect(screen.getByTestId('marketplace-request-card')).toBeInTheDocument();
  });

  it('should call onAccept when button clicked', async () => {
    const mockOnAccept = vi.fn();
    const mockRequest = createMockExchangeRequest();
    
    render(
      <MarketplaceRequestCard
        request={mockRequest}
        onAccept={mockOnAccept}
        onViewDetails={vi.fn()}
      />
    );
    
    const button = screen.getByRole('button', { name: /accept/i });
    await userEvent.click(button);
    
    expect(mockOnAccept).toHaveBeenCalledWith(mockRequest.id);
  });
});
```

### Integration Test (Real Functions)
```typescript
// MarketplaceRequestCard.integration.test.tsx
describe('MarketplaceRequestCard - Integration Tests', () => {
  let helper: IntegrationTestHelper;
  let testRequest: ExchangeRequest;

  beforeEach(async () => {
    helper = new IntegrationTestHelper();
    testRequest = await helper.createTestRequest();
  });

  afterEach(async () => {
    await helper.cleanupTestData(testRequest.id);
  });

  it('should render with real data from service', async () => {
    const requests = await helper.getTestRequests();
    const request = requests.find(r => r.id === testRequest.id);

    render(
      <MarketplaceRequestCard
        request={request!}
        onAccept={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );

    expect(screen.getByTestId('marketplace-request-card')).toBeInTheDocument();
    expect(screen.getByTestId('request-id')).toHaveTextContent(`Request #${testRequest.id}`);
  });

  it('should display correct values from real service', async () => {
    const requests = await helper.getTestRequests();
    const request = requests.find(r => r.id === testRequest.id);

    render(
      <MarketplaceRequestCard
        request={request!}
        onAccept={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );

    expect(screen.getByText(new RegExp(request!.fromCurrency))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(request!.toCurrency))).toBeInTheDocument();
  });
});
```

---

## Benefits of Hybrid Approach

| Aspect | Unit Tests | Integration Tests | E2E Tests |
|--------|-----------|------------------|-----------|
| Speed | ⚡⚡⚡ Fast | ⚡⚡ Medium | ⚡ Slow |
| Coverage | 80% | 15% | 5% |
| Reliability | ✅ Reliable | ✅ Reliable | ⚠️ Flaky |
| Real Behavior | ❌ No | ✅ Yes | ✅ Yes |
| Maintenance | ✅ Easy | ⚠️ Medium | ❌ Hard |
| Cost | ✅ Cheap | ⚠️ Medium | ❌ Expensive |

---

## Migration Path

### Phase 1: Keep Current Unit Tests (Mocks)
- Continue using mock data
- Fast execution
- Good for component logic

### Phase 2: Add Integration Tests (Real Functions)
- Create real service functions
- Add integration test utilities
- Test service + component interaction

### Phase 3: Add E2E Tests (Real Everything)
- Use Playwright or Cypress
- Test complete user flows
- Run in CI/CD pipeline

---

## Quick Start: Add Integration Tests

### Step 1: Create Integration Test Helper
```typescript
// src/__tests__/utils/integration-test-utils.ts
export class IntegrationTestHelper {
  private service = new ExchangeRequestService();

  async createTestRequest(overrides?: Partial<CreateRequestDTO>) {
    return this.service.createRequest({
      fromCurrency: 'USD',
      toCurrency: 'SAR',
      fromAmount: '100',
      toAmount: '375',
      ...overrides,
    });
  }

  async getTestRequests() {
    return this.service.getRequests();
  }
}
```

### Step 2: Create Integration Test
```typescript
// src/components/p2p-exchange/__tests__/MarketplaceRequestCard.integration.test.tsx
describe('MarketplaceRequestCard - Integration', () => {
  let helper: IntegrationTestHelper;
  let testRequest: ExchangeRequest;

  beforeEach(async () => {
    helper = new IntegrationTestHelper();
    testRequest = await helper.createTestRequest();
  });

  it('should render with real data', async () => {
    const requests = await helper.getTestRequests();
    const request = requests.find(r => r.id === testRequest.id);

    render(<MarketplaceRequestCard request={request!} />);
    expect(screen.getByTestId('marketplace-request-card')).toBeInTheDocument();
  });
});
```

### Step 3: Run Integration Tests
```bash
npm run test:run -- --grep "integration"
```

---

## Summary

**Use Mocks (Unit Tests) for:**
- Component rendering
- User interactions
- Props handling
- Event callbacks

**Use Real Functions (Integration Tests) for:**
- Service integration
- API calls
- Data transformation
- Error handling

**Use Real Everything (E2E Tests) for:**
- Complete user flows
- Cross-browser testing
- Performance testing
- Real-world scenarios

---

**Status:** Ready to implement  
**Effort:** 4-6 hours to add integration tests  
**Benefit:** 30-40% improvement in test confidence
