# Mnbara Platform - Testing Standards

**Version:** 1.0  
**Last Updated:** 2025-12-22  
**Status:** 🔴 IN PROGRESS

---

## 📋 Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)
7. [Test Coverage](#test-coverage)
8. [Test Data Management](#test-data-management)
9. [CI/CD Integration](#cicd-integration)

---

## 🔺 Testing Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │  5-10%
        │  (Slow, Expensive)
        ├─────────────────┤
        │ Integration     │  15-20%
        │   Tests         │
        │ (Medium Speed)  │
        ├─────────────────┤
        │   Unit Tests    │  70-80%
        │ (Fast, Cheap)   │
        └─────────────────┘
```

### Testing Strategy

- **70-80%** Unit Tests - Fast, isolated, cheap
- **15-20%** Integration Tests - Medium speed, test interactions
- **5-10%** E2E Tests - Slow, expensive, test full workflows

---

## 🧪 Unit Testing

### Purpose
- Test individual functions/methods in isolation
- Verify business logic
- Catch bugs early
- Enable refactoring safely

### Tools

#### JavaScript/TypeScript
- **Framework:** Jest
- **Assertion:** Jest built-in
- **Mocking:** Jest mocks

#### Python
- **Framework:** pytest
- **Assertion:** pytest assertions
- **Mocking:** unittest.mock

#### Dart/Flutter
- **Framework:** test
- **Assertion:** test assertions
- **Mocking:** mockito

### Unit Test Structure

```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    mockDatabase = createMockDatabase();
    userService = new UserService(mockDatabase);
  });

  describe('getUserById', () => {
    it('should return user when user exists', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: '123', name: 'John' };
      mockDatabase.users.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockDatabase.users.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const userId = '999';
      mockDatabase.users.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should cache user for 5 minutes', async () => {
      // Arrange
      const userId = '123';
      const user = { id: '123', name: 'John' };
      mockDatabase.users.findById.mockResolvedValue(user);

      // Act
      await userService.getUserById(userId);
      await userService.getUserById(userId);

      // Assert
      expect(mockDatabase.users.findById).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Unit Test Best Practices

1. **One assertion per test** (when possible)
2. **Descriptive test names** - Explain what is being tested
3. **Arrange-Act-Assert** - Clear test structure
4. **Mock external dependencies** - Isolate the unit
5. **Test edge cases** - Null, empty, invalid inputs
6. **Test error cases** - Exceptions and error handling
7. **Keep tests simple** - Easy to understand and maintain
8. **Don't test framework code** - Focus on business logic

### Unit Test Coverage

- **Minimum:** 80% code coverage
- **Target:** 90% code coverage
- **Critical paths:** 100% coverage

---

## 🔗 Integration Testing

### Purpose
- Test interactions between components
- Verify data flow
- Test with real dependencies
- Catch integration issues

### Tools

#### JavaScript/TypeScript
- **Framework:** Jest
- **Database:** Test database (PostgreSQL)
- **Message Queue:** Test RabbitMQ

#### Python
- **Framework:** pytest
- **Database:** Test database (PostgreSQL)
- **Message Queue:** Test RabbitMQ

### Integration Test Structure

```typescript
describe('UserService Integration', () => {
  let userService: UserService;
  let database: Database;
  let messageQueue: MessageQueue;

  beforeAll(async () => {
    database = await setupTestDatabase();
    messageQueue = await setupTestMessageQueue();
    userService = new UserService(database, messageQueue);
  });

  afterAll(async () => {
    await database.close();
    await messageQueue.close();
  });

  afterEach(async () => {
    await database.clear();
  });

  describe('createUser', () => {
    it('should create user and publish event', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      // Act
      const user = await userService.createUser(userData);

      // Assert
      expect(user.id).toBeDefined();
      expect(user.name).toBe('John Doe');

      // Verify database
      const savedUser = await database.users.findById(user.id);
      expect(savedUser).toEqual(user);

      // Verify event published
      const events = await messageQueue.getEvents('user.created');
      expect(events).toHaveLength(1);
      expect(events[0].data.userId).toBe(user.id);
    });
  });
});
```

### Integration Test Best Practices

1. **Use test database** - Isolated test data
2. **Clean up after tests** - Reset state
3. **Test real interactions** - Use actual dependencies
4. **Test error scenarios** - Database errors, network errors
5. **Test data consistency** - Verify data integrity
6. **Test event publishing** - Verify async operations
7. **Keep tests focused** - Test one integration point

---

## 🌐 End-to-End Testing

### Purpose
- Test complete user workflows
- Verify system integration
- Test from user perspective
- Catch system-level issues

### Tools

#### Web
- **Framework:** Cypress or Playwright
- **Browser:** Chrome, Firefox, Safari

#### Mobile
- **Framework:** Appium or Flutter integration tests
- **Device:** Real device or emulator

### E2E Test Structure

```typescript
describe('User Registration Flow', () => {
  beforeEach(() => {
    cy.visit('https://app.mnbara.com');
  });

  it('should register new user successfully', () => {
    // Navigate to registration
    cy.contains('Sign Up').click();

    // Fill registration form
    cy.get('input[name="name"]').type('John Doe');
    cy.get('input[name="email"]').type('john@example.com');
    cy.get('input[name="password"]').type('SecurePassword123!');
    cy.get('input[name="confirmPassword"]').type('SecurePassword123!');

    // Accept terms
    cy.get('input[type="checkbox"]').check();

    // Submit form
    cy.get('button[type="submit"]').click();

    // Verify success
    cy.contains('Registration successful').should('be.visible');
    cy.url().should('include', '/dashboard');

    // Verify user data
    cy.get('[data-testid="user-name"]').should('contain', 'John Doe');
  });

  it('should show validation errors for invalid input', () => {
    cy.contains('Sign Up').click();

    // Submit empty form
    cy.get('button[type="submit"]').click();

    // Verify errors
    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });
});
```

### E2E Test Best Practices

1. **Test user workflows** - Not implementation details
2. **Use data-testid** - Stable selectors
3. **Avoid hard waits** - Use explicit waits
4. **Test critical paths** - Focus on important flows
5. **Keep tests independent** - No dependencies between tests
6. **Use page objects** - Reusable test code
7. **Test error scenarios** - Network errors, validation errors

---

## ⚡ Performance Testing

### Purpose
- Verify system performance
- Identify bottlenecks
- Test under load
- Ensure SLA compliance

### Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 200ms |
| Database Query Time (p95) | < 100ms |
| Search Query Time (p95) | < 500ms |
| Page Load Time | < 3s |
| System Availability | 99.9% |

### Load Testing

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stay at 100
    { duration: '2m', target: 200 },   // Ramp up to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 0 },     // Ramp down
  ],
};

export default function () {
  let response = http.get('https://api.mnbara.com/api/v1/users');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

### Performance Test Best Practices

1. **Test realistic scenarios** - Simulate real user behavior
2. **Ramp up gradually** - Avoid sudden spikes
3. **Monitor metrics** - CPU, memory, database
4. **Identify bottlenecks** - Use profiling tools
5. **Test regularly** - Before each release
6. **Document baselines** - Track performance over time

---

## 🔒 Security Testing

### Purpose
- Identify security vulnerabilities
- Verify authentication/authorization
- Test input validation
- Verify data protection

### Security Test Checklist

- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF prevention
- [ ] Authentication bypass
- [ ] Authorization bypass
- [ ] Sensitive data exposure
- [ ] Insecure deserialization
- [ ] Broken access control
- [ ] Security misconfiguration
- [ ] Using components with known vulnerabilities

### Security Testing Tools

- **OWASP ZAP** - Web application security scanner
- **Burp Suite** - Security testing platform
- **Snyk** - Dependency vulnerability scanner
- **SonarQube** - Code quality and security

### Security Test Example

```typescript
describe('Security Tests', () => {
  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in user search', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .get(`/api/v1/users/search?q=${maliciousInput}`);

      expect(response.status).toBe(200);
      // Verify table still exists
      const users = await database.users.findAll();
      expect(users).toBeDefined();
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in user input', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/v1/users')
        .send({ name: xssPayload });

      expect(response.status).toBe(201);
      const user = response.body.data;
      expect(user.name).not.toContain('<script>');
    });
  });

  describe('Authentication', () => {
    it('should require valid JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
```

---

## 📊 Test Coverage

### Coverage Metrics

```
Statements   : 85% ( 850/1000 )
Branches     : 80% ( 400/500 )
Functions    : 90% ( 180/200 )
Lines        : 85% ( 850/1000 )
```

### Coverage Requirements

| Component | Minimum | Target |
|-----------|---------|--------|
| Business Logic | 90% | 95% |
| Controllers | 80% | 90% |
| Utilities | 85% | 95% |
| Models | 80% | 90% |
| Middleware | 75% | 85% |

### Coverage Tools

#### JavaScript/TypeScript
```bash
npm test -- --coverage
```

#### Python
```bash
pytest --cov=src --cov-report=html
```

#### Dart/Flutter
```bash
flutter test --coverage
```

---

## 📦 Test Data Management

### Test Data Strategy

1. **Fixtures** - Pre-defined test data
2. **Factories** - Generate test data dynamically
3. **Builders** - Build complex test objects
4. **Mocks** - Simulate external services

### Test Data Example

```typescript
// Fixture
const testUser = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
};

// Factory
function createUser(overrides = {}) {
  return {
    id: generateId(),
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    ...overrides
  };
}

// Builder
class UserBuilder {
  private user = createUser();

  withName(name: string) {
    this.user.name = name;
    return this;
  }

  withRole(role: string) {
    this.user.role = role;
    return this;
  }

  build() {
    return this.user;
  }
}

// Usage
const admin = new UserBuilder()
  .withName('Admin User')
  .withRole('admin')
  .build();
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info

      - name: Check coverage
        run: npm run test:coverage-check
```

### Test Commands

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## ✅ Test Review Checklist

- [ ] Tests are descriptive and clear
- [ ] Tests follow AAA pattern (Arrange-Act-Assert)
- [ ] Tests are independent
- [ ] Tests are fast
- [ ] Tests are reliable (no flakiness)
- [ ] Coverage is adequate
- [ ] Edge cases are tested
- [ ] Error cases are tested
- [ ] Performance is acceptable
- [ ] Security is verified

---

**Status:** 🔴 IN PROGRESS  
**Last Updated:** 2025-12-22  
**Next Review:** 2025-12-29
