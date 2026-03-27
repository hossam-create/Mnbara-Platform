# Testing Infrastructure Setup - Phase 5

**Status:** Complete  
**Last Updated:** March 23, 2026

---

## Overview

This document describes the complete testing infrastructure for the Mnbara Platform monorepo, including unit tests, integration tests, E2E tests, and property-based tests.

---

## 1. Testing Stack

### 1.1 Test Frameworks
- **Unit Testing:** Vitest (primary), Jest (legacy support)
- **React Component Testing:** React Testing Library
- **E2E Testing:** Cypress, Playwright
- **Property-Based Testing:** fast-check
- **API Testing:** Supertest
- **Load Testing:** k6 (optional)

### 1.2 Coverage Tools
- **Provider:** V8 (built into Node.js)
- **Reporters:** text, json, html, lcov
- **Thresholds:** 80% lines, 80% functions, 75% branches, 80% statements

---

## 2. Unit Testing Setup

### 2.1 Vitest Configuration

Root configuration: `vitest.config.ts`

```typescript
// Key settings:
- globals: true (describe, it, expect available globally)
- environment: 'node' (default, can override per project)
- coverage: V8 provider with 80% thresholds
- retry: 1 (retry failed tests once)
- pool: 'threads' (parallel execution)
```

### 2.2 Running Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- packages/utils/src/__tests__/currency.test.ts

# Run tests matching pattern
npm test -- --grep "currency"
```

### 2.3 Test File Structure

```
packages/utils/
├── src/
│   ├── currency.ts
│   └── __tests__/
│       ├── currency.test.ts
│       └── currency.property.test.ts
├── package.json
└── vitest.config.ts (optional, extends root)
```

---

## 3. Integration Testing Setup

### 3.1 Service-to-Service Integration

Location: `services/__tests__/`

Tests verify:
- Service discovery and registration
- Inter-service communication
- API gateway routing
- Request/response handling
- Error propagation

### 3.2 Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific service integration tests
npm test -- services/core/__tests__/

# Run with coverage
npm run test:integration:coverage
```

### 3.3 Integration Test Example

```typescript
// services/__tests__/service-discovery.property.test.ts
import { describe, it, expect } from 'vitest';
import { fc } from 'fast-check';

describe('Service Discovery', () => {
  it('should discover all registered services', async () => {
    const services = await discoverServices();
    expect(services.length).toBeGreaterThan(0);
  });

  it('should handle service registration/deregistration', () => {
    fc.assert(
      fc.property(fc.string(), (serviceName) => {
        // Property-based test logic
      })
    );
  });
});
```

---

## 4. E2E Testing Setup

### 4.1 Cypress Configuration

Location: `apps/web/cypress.config.ts`

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotOnRunFailure: true,
  },
});
```

### 4.2 Running E2E Tests

```bash
# Run E2E tests (headless)
npm run e2e

# Run E2E tests (interactive)
npm run e2e:open

# Run specific E2E test
npm run e2e -- --spec "cypress/e2e/auth.cy.ts"

# Run with specific browser
npm run e2e -- --browser chrome
```

### 4.3 E2E Test Structure

```
apps/web/
├── cypress/
│   ├── e2e/
│   │   ├── auth.cy.ts
│   │   ├── marketplace.cy.ts
│   │   └── checkout.cy.ts
│   ├── fixtures/
│   │   └── test-data.json
│   └── support/
│       ├── commands.ts
│       └── e2e.ts
└── cypress.config.ts
```

---

## 5. Property-Based Testing Setup

### 5.1 fast-check Integration

All property-based tests use `fast-check` for generating test data.

### 5.2 Running Property-Based Tests

```bash
# Run all property-based tests
npm run test:property

# Run specific property test
npm test -- --grep "property"

# Run with verbose output
npm test -- --reporter=verbose
```

### 5.3 Property Test Examples

#### Example 1: Currency Formatting
```typescript
// packages/utils/src/__tests__/currency.property.test.ts
import { fc } from 'fast-check';
import { formatCurrency } from '../currency';

describe('Currency Formatting (Property-Based)', () => {
  it('should format any valid amount', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000000 }), (amount) => {
        const result = formatCurrency(amount);
        expect(result).toMatch(/^\$[\d,]+\.\d{2}$/);
      })
    );
  });

  it('should preserve value after formatting', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000000 }), (amount) => {
        const formatted = formatCurrency(amount);
        const parsed = parseInt(formatted.replace(/\D/g, ''));
        expect(parsed).toBe(amount);
      })
    );
  });
});
```

#### Example 2: Order Total Calculation
```typescript
// services/marketplace/order-service/src/__tests__/order-total.property.test.ts
import { fc } from 'fast-check';
import { calculateOrderTotal } from '../services/order.service';

describe('Order Total Calculation (Property-Based)', () => {
  it('should calculate correct total for any valid items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            price: fc.integer({ min: 1, max: 100000 }),
            quantity: fc.integer({ min: 1, max: 100 }),
          })
        ),
        (items) => {
          const total = calculateOrderTotal(items);
          const expected = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          expect(total).toBe(expected);
        }
      )
    );
  });

  it('should never return negative total', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            price: fc.integer({ min: 0, max: 100000 }),
            quantity: fc.integer({ min: 0, max: 100 }),
          })
        ),
        (items) => {
          const total = calculateOrderTotal(items);
          expect(total).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });
});
```

---

## 6. Test Coverage Configuration

### 6.1 Coverage Thresholds

```typescript
// vitest.config.ts
coverage: {
  lines: 80,        // 80% of lines must be covered
  functions: 80,    // 80% of functions must be covered
  branches: 75,     // 75% of branches must be covered
  statements: 80,   // 80% of statements must be covered
}
```

### 6.2 Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html

# View coverage summary
npm run test:coverage -- --reporter=text
```

### 6.3 Coverage Exclusions

Files excluded from coverage:
- `**/__tests__/**` - Test files themselves
- `**/*.test.ts` - Test files
- `**/*.spec.ts` - Spec files
- `**/dist/**` - Built files
- `**/node_modules/**` - Dependencies
- `**/*.config.ts` - Configuration files

---

## 7. CI/CD Integration

### 7.1 GitHub Actions Workflow

Location: `.github/workflows/ci.yml`

Key jobs:
- `lint-and-format` - ESLint and Prettier checks
- `backend-ci` - Backend service tests
- `frontend-web-ci` - Web app tests
- `frontend-admin-ci` - Admin dashboard tests
- `mobile-ci` - Mobile app tests
- `security-scan` - Security checks
- `docker-build` - Docker image builds
- `helm-validate` - Kubernetes Helm charts

### 7.2 Test Execution in CI

```yaml
- name: Run tests
  run: npm test -- --run --coverage
  env:
    NODE_ENV: test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    flags: ${{ matrix.service }}
```

### 7.3 PR Checks

All PRs must pass:
- ✅ Linting (ESLint)
- ✅ Formatting (Prettier)
- ✅ Type checking (TypeScript)
- ✅ Unit tests (Vitest)
- ✅ Integration tests
- ✅ Security scan (Gitleaks)
- ✅ Docker build (if applicable)

---

## 8. Test Data Factories

### 8.1 Factory Pattern

Location: `tests/factories/`

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  createdAt: faker.date.past(),
  ...overrides,
});

export const createUsers = (count: number) =>
  Array.from({ length: count }, () => createUser());
```

### 8.2 Using Factories in Tests

```typescript
import { createUser, createUsers } from '../factories/user.factory';

describe('User Service', () => {
  it('should create user', () => {
    const user = createUser({ email: 'test@example.com' });
    expect(user.email).toBe('test@example.com');
  });

  it('should handle multiple users', () => {
    const users = createUsers(5);
    expect(users).toHaveLength(5);
  });
});
```

---

## 9. Mocking and Fixtures

### 9.1 Mock Setup

Location: `tests/mocks/`

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Test User' });
  }),
];
```

### 9.2 Test Fixtures

Location: `tests/fixtures/`

```typescript
// tests/fixtures/mock-data.ts
export const mockUser = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
};

export const mockOrder = {
  id: 'order-123',
  userId: '123',
  total: 9999,
  items: [],
};
```

---

## 10. Performance Testing

### 10.1 Response Time Validation

Property-based test for response times:

```typescript
// services/__tests__/performance.property.test.ts
import { fc } from 'fast-check';

describe('Performance (Property-Based)', () => {
  it('should respond within 200ms for 95th percentile', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), async (requestCount) => {
        const times = [];
        for (let i = 0; i < requestCount; i++) {
          const start = performance.now();
          await makeRequest();
          times.push(performance.now() - start);
        }
        const sorted = times.sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        expect(p95).toBeLessThan(200);
      })
    );
  });
});
```

### 10.2 Load Testing with k6

Location: `tests/load/`

```javascript
// tests/load/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 100 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

---

## 11. Debugging Tests

### 11.1 Debug Mode

```bash
# Run tests with debugging
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# Run specific test with debugging
npm test -- --inspect-brk packages/utils/src/__tests__/currency.test.ts
```

### 11.2 Verbose Output

```bash
# Run with verbose reporter
npm test -- --reporter=verbose

# Run with detailed output
npm test -- --reporter=verbose --no-coverage
```

### 11.3 Watch Mode

```bash
# Run tests in watch mode
npm run test:watch

# Watch specific file
npm run test:watch -- packages/utils/src/__tests__/currency.test.ts
```

---

## 12. Best Practices

### 12.1 Test Organization
- ✅ One test file per source file
- ✅ Group related tests with `describe` blocks
- ✅ Use descriptive test names
- ✅ Keep tests focused and isolated

### 12.2 Assertions
- ✅ Use specific assertions (not just `toBeTruthy`)
- ✅ Test both happy path and error cases
- ✅ Verify side effects
- ✅ Test edge cases

### 12.3 Mocking
- ✅ Mock external dependencies
- ✅ Use factories for test data
- ✅ Reset mocks between tests
- ✅ Avoid mocking implementation details

### 12.4 Property-Based Testing
- ✅ Use for algorithmic correctness
- ✅ Test invariants and properties
- ✅ Generate diverse test data
- ✅ Shrink failing cases

---

## 13. Troubleshooting

### 13.1 Common Issues

**Issue:** Tests timeout
```bash
# Increase timeout
npm test -- --testTimeout=60000
```

**Issue:** Coverage threshold not met
```bash
# Check coverage report
npm run test:coverage
# Review uncovered lines in HTML report
```

**Issue:** Flaky tests
```bash
# Run tests multiple times
npm test -- --run --reporter=verbose
# Check for timing issues or race conditions
```

### 13.2 Getting Help

- Check test output for specific error messages
- Review test file for logic errors
- Verify mock setup is correct
- Check for timing/async issues

---

## 14. Next Steps

### 14.1 Immediate Actions
- [ ] Run `npm test` to verify all tests pass
- [ ] Check coverage with `npm run test:coverage`
- [ ] Review coverage report in `coverage/index.html`

### 14.2 Continuous Improvement
- [ ] Add tests for new features
- [ ] Increase coverage to 90%+
- [ ] Implement load testing
- [ ] Set up performance monitoring

---

**Document Version:** 1.0  
**Last Updated:** March 23, 2026  
**Status:** Complete
