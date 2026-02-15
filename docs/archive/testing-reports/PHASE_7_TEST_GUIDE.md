# Phase 7: Testing Guide - How to Run Tests

**Date**: January 27, 2026  
**Phase**: 7 - Testing & Quality Assurance  
**Status**: 🚀 READY TO RUN

---

## 📁 Test File Structure

```
frontend/web-app/
├── vitest.config.ts                          # Vitest configuration
├── src/
│   ├── __tests__/
│   │   ├── setup.ts                          # Global test setup
│   │   ├── utils/
│   │   │   └── test-utils.tsx                # Custom render function
│   │   ├── fixtures/
│   │   │   └── mock-data.ts                  # Mock data fixtures
│   │   └── mocks/
│   │       ├── server.ts                     # MSW server
│   │       └── handlers.ts                   # API mock handlers
│   ├── components/
│   │   └── p2p-exchange/
│   │       ├── __tests__/
│   │       │   ├── ExchangeRequestForm.test.tsx
│   │       │   ├── MarketplaceBrowser.test.tsx
│   │       │   └── MatchChat.test.tsx
│   │       ├── ExchangeRequestForm.tsx
│   │       ├── MarketplaceBrowser.tsx
│   │       └── MatchChat.tsx
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── useExchangeRequest.test.ts
│   │   │   └── useMarketplace.test.ts
│   │   ├── useExchangeRequest.ts
│   │   └── useMarketplace.ts
│   └── api/
│       └── p2p-exchange/
│           ├── __tests__/
│           │   ├── exchange-request.api.test.ts
│           │   └── marketplace.api.test.ts
│           ├── exchange-request.api.ts
│           └── marketplace.api.ts
└── package.json
```

---

## 🚀 Running Tests

### Install Dependencies First
```bash
cd frontend/web-app
npm install
```

### Run All Tests
```bash
npm run test:run
```

### Run Tests in Watch Mode
```bash
npm run test
```

### Run Specific Test File
```bash
npm run test:run -- ExchangeRequestForm.test.tsx
```

### Run Tests Matching Pattern
```bash
npm run test:run -- --grep "should render"
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Open Test UI
```bash
npm run test:ui
```

---

## 📊 Test Coverage

### Current Coverage (Day 1)
- **Components**: 3/32 (9%)
- **Hooks**: 2/10 (20%)
- **API Clients**: 2/6 (33%)
- **Total**: 9/48 (19%)

### Expected Coverage (Full Phase 7)
- **Components**: 32/32 (100%)
- **Hooks**: 10/10 (100%)
- **API Clients**: 6/6 (100%)
- **Integration**: 15+ tests
- **E2E**: 5 test suites
- **Performance**: 10+ tests
- **Security**: 10+ tests
- **Accessibility**: 10+ tests
- **Total**: 100+ tests

---

## 🧪 Test Categories

### 1. Component Tests (32 total, 3 written)

#### Exchange Request Components (4)
- [x] ExchangeRequestForm.test.tsx ✅
- [ ] ExchangeRequestList.test.tsx
- [ ] ExchangeRequestDetails.test.tsx
- [ ] useExchangeRequest.test.ts ✅

#### Marketplace Components (4)
- [x] MarketplaceBrowser.test.tsx ✅
- [ ] MarketplaceFilters.test.tsx
- [ ] MarketplaceRequestCard.test.tsx
- [ ] useMarketplace.test.ts ✅

#### Match Management Components (5)
- [ ] MatchDetails.test.tsx
- [ ] PaymentInitiation.test.tsx
- [ ] ProofUpload.test.tsx
- [ ] ReceiptConfirmation.test.tsx
- [ ] useMatch.test.ts

#### Security & Trust Components (5)
- [ ] SecurityDepositCard.test.tsx
- [ ] TrustLevelBadge.test.tsx
- [ ] ExternalEscrowSelector.test.tsx
- [ ] useSecurity.test.ts
- [ ] security.api.test.ts

#### Communication Components (5)
- [x] MatchChat.test.tsx ✅
- [ ] MessageList.test.tsx
- [ ] MessageInput.test.tsx
- [ ] useMatchChat.test.ts
- [ ] communication.api.test.ts

#### Admin Components (4)
- [ ] AdminExchangeDashboard.test.tsx
- [ ] AdminProofVerification.test.tsx
- [ ] admin-exchange.api.test.ts
- [ ] index.test.ts

#### API Clients (5)
- [x] exchange-request.api.test.ts ✅
- [x] marketplace.api.test.ts ✅
- [ ] match.api.test.ts
- [ ] security.api.test.ts
- [ ] communication.api.test.ts

### 2. Integration Tests (15+ total, 0 written)

#### User Flows
- [ ] Create Exchange Request
- [ ] Browse Marketplace
- [ ] Accept Match
- [ ] Initiate Payment
- [ ] Upload Proof
- [ ] Confirm Receipt
- [ ] Complete Settlement
- [ ] View Match History
- [ ] Manage Security Deposit
- [ ] Check Trust Level

#### Admin Flows
- [ ] View Dashboard
- [ ] Review Pending Proofs
- [ ] Verify Proof
- [ ] Freeze Deposit
- [ ] Monitor Matches
- [ ] Handle Disputes

#### Error Scenarios
- [ ] Network Failure
- [ ] Invalid Input
- [ ] Timeout Handling
- [ ] Concurrent Operations
- [ ] State Inconsistency

### 3. E2E Tests (5 total, 0 written)

- [ ] Journey 1: Internal Settlement
- [ ] Journey 2: External Escrow
- [ ] Journey 3: Timeout & Dispute
- [ ] Journey 4: Admin Verification
- [ ] Journey 5: Fraud Detection

### 4. Performance Tests (10+ total, 0 written)

- [ ] Bundle Size Analysis
- [ ] Load Time Testing
- [ ] API Performance
- [ ] Memory Leaks
- [ ] Render Performance
- [ ] Cache Effectiveness
- [ ] Concurrent Requests
- [ ] Error Recovery
- [ ] Pagination Performance
- [ ] Search Performance

### 5. Security Tests (10+ total, 0 written)

- [ ] Input Validation (XSS)
- [ ] CSRF Protection
- [ ] Authentication
- [ ] Authorization
- [ ] Data Encryption
- [ ] Secure Storage
- [ ] PII Handling
- [ ] Audit Logging
- [ ] Rate Limiting
- [ ] SQL Injection Prevention

### 6. Accessibility Tests (10+ total, 0 written)

- [ ] WCAG 2.1 AA Compliance
- [ ] Keyboard Navigation
- [ ] Screen Reader Compatibility
- [ ] Color Contrast
- [ ] Focus Management
- [ ] Form Labels
- [ ] Error Messages
- [ ] Skip Links
- [ ] Semantic HTML
- [ ] ARIA Attributes

---

## 📝 Test Examples

### Component Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<MyComponent />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      render(<MyComponent />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(screen.getByText(/clicked/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MyComponent />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label');
    });
  });
});
```

### Hook Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useMyHook from '../useMyHook';

describe('useMyHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.state).toBe(initialValue);
  });

  it('should update state on action', async () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.setState(newValue);
    });
    
    expect(result.current.state).toBe(newValue);
  });
});
```

### API Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import myApi from '../myApi';

describe('MyAPI', () => {
  it('should fetch data', async () => {
    const result = await myApi.getData();
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle errors', async () => {
    server.use(
      http.get('/api/endpoint', () => {
        return HttpResponse.json(
          { success: false, error: 'Error' },
          { status: 500 }
        );
      })
    );

    await expect(myApi.getData()).rejects.toThrow();
  });
});
```

---

## 🛠️ Debugging Tests

### Run Single Test File
```bash
npm run test:run -- ExchangeRequestForm.test.tsx
```

### Run Tests Matching Pattern
```bash
npm run test:run -- --grep "should render"
```

### Run with Debug Output
```bash
npm run test:run -- --reporter=verbose
```

### Watch Specific File
```bash
npm run test -- ExchangeRequestForm.test.tsx
```

### Open Test UI for Debugging
```bash
npm run test:ui
```

---

## 📊 Coverage Reports

### Generate Coverage Report
```bash
npm run test:coverage
```

### View Coverage Report
```bash
# Open coverage/index.html in browser
open coverage/index.html
```

### Coverage Thresholds
- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

---

## 🔍 Common Issues & Solutions

### Issue: Tests not running
**Solution**: 
```bash
npm install
npm run test:run
```

### Issue: MSW not intercepting requests
**Solution**: Ensure `setup.ts` is configured in `vitest.config.ts`

### Issue: React Query cache issues
**Solution**: Each test gets a fresh QueryClient via `renderWithProviders`

### Issue: Timeout errors
**Solution**: Increase timeout in vitest.config.ts or use `waitFor` with longer timeout

### Issue: Module not found
**Solution**: Check path aliases in `vitest.config.ts` match `tsconfig.json`

---

## 📚 Test Documentation

### Test Naming Convention
```
describe('Component/Hook/API Name', () => {
  describe('Feature/Category', () => {
    it('should [expected behavior]', () => {
      // Test implementation
    });
  });
});
```

### Test Organization
1. **Rendering** - Component renders correctly
2. **User Interactions** - User can interact with component
3. **Validation** - Input validation works
4. **Error Handling** - Errors are handled gracefully
5. **Accessibility** - Component is accessible
6. **RTL Support** - Component supports RTL

### Best Practices
- ✅ Use descriptive test names
- ✅ Test behavior, not implementation
- ✅ Use `userEvent` instead of `fireEvent`
- ✅ Use `waitFor` for async operations
- ✅ Mock external dependencies
- ✅ Test accessibility
- ✅ Test error scenarios
- ✅ Keep tests focused and isolated

---

## 🚀 Next Steps

### Day 2 Tasks
1. Write 20+ component tests
2. Write 5+ hook tests
3. Write 3+ API client tests
4. Achieve 50%+ unit test coverage

### Day 3 Tasks
1. Write 15+ integration tests
2. Test all critical user flows
3. Test error scenarios

### Day 4 Tasks
1. Write 5 E2E test suites
2. Test critical journeys
3. Test admin workflows

### Day 5 Tasks
1. Write 10+ performance tests
2. Write 10+ security tests
3. Verify all metrics

### Day 6 Tasks
1. Write 10+ accessibility tests
2. Fix accessibility issues
3. Final code review

### Day 7 Tasks
1. Final testing pass
2. Generate reports
3. Phase completion

---

## 📞 Support

### Questions?
- Check test examples in this guide
- Review existing test files
- Check Vitest documentation
- Check React Testing Library docs

### Resources
- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io)
- [Playwright Documentation](https://playwright.dev)

---

**Test Guide Created**: January 27, 2026  
**Phase**: 7 - Testing & Quality Assurance  
**Status**: 🚀 READY TO RUN

---

# 🧪 Ready to Run Tests! 🎯

