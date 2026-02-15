# Phase 7 Day 1 - Test Fixes Action Plan

**Date:** January 29, 2026  
**Priority:** Critical - 255 test failures need resolution

## Root Cause Analysis

### Issue 1: DOM Query Mismatches (Primary - ~150 failures)
**Problem:** Tests expect text that components don't render
**Example:** Test looks for `/matched/i` but component doesn't render status text
**Impact:** 55% of failures

**Solution:**
1. Update test assertions to match actual component output
2. Use `getByRole()` instead of `getByText()` where appropriate
3. Use `getByTestId()` for complex queries
4. Update mock data to match component expectations

### Issue 2: Mock Data Structure Mismatch (~80 failures)
**Problem:** Mock data doesn't match component prop types
**Example:** Component expects `id: number` but mock provides `id: string`
**Impact:** 30% of failures

**Solution:**
1. Audit all mock data fixtures
2. Ensure types match component prop interfaces
3. Add type validation to mock data
4. Create factory functions for consistent mock generation

### Issue 3: Missing Mock Handlers (~40 failures)
**Problem:** API calls fail because MSW handlers aren't defined
**Example:** Payment API calls have no mock response
**Impact:** 15% of failures

**Solution:**
1. Audit all API calls in components
2. Add corresponding MSW handlers
3. Create handler factory for common patterns
4. Document all API endpoints that need mocking

### Issue 4: Async/Timing Issues (~25 failures)
**Problem:** Tests don't wait for async operations
**Example:** Component loads data but test checks before data arrives
**Impact:** 10% of failures

**Solution:**
1. Use `waitFor()` for async assertions
2. Add proper async/await patterns
3. Mock timers where needed
4. Use `screen.findBy*` instead of `screen.getBy*` for async

## Detailed Fix Strategy

### Phase 1: Setup & Infrastructure (2 hours)

#### 1.1 Update Test Utilities
**File:** `src/__tests__/utils/test-utils.tsx`

Add helper functions:
```typescript
// Query helpers
export const getByTestId = (testId: string) => screen.getByTestId(testId);
export const queryByTestId = (testId: string) => screen.queryByTestId(testId);

// Async helpers
export const waitForElement = (testId: string) => 
  screen.findByTestId(testId);

// Mock data helpers
export const createMockRequest = (overrides = {}) => ({
  ...mockExchangeRequest,
  ...overrides,
});
```

#### 1.2 Enhance Mock Data
**File:** `src/__tests__/fixtures/mock-data.ts`

Add factory functions:
```typescript
export const createMockExchangeRequest = (overrides = {}) => ({
  ...mockExchangeRequest,
  ...overrides,
});

export const createMockMatch = (overrides = {}) => ({
  ...mockExchangeMatch,
  ...overrides,
});
```

#### 1.3 Audit MSW Handlers
**File:** `src/__tests__/mocks/handlers.ts`

Ensure all endpoints are covered:
- [ ] GET /api/exchange-requests
- [ ] POST /api/exchange-requests
- [ ] GET /api/matches
- [ ] POST /api/matches/:id/accept
- [ ] GET /api/settlements
- [ ] POST /api/payments
- [ ] GET /api/admin/decisions
- [ ] POST /api/admin/decisions/:id/approve

### Phase 2: Component Test Fixes (4 hours)

#### 2.1 MarketplaceRequestCard Tests
**File:** `src/components/p2p-exchange/__tests__/MarketplaceRequestCard.test.tsx`

**Changes:**
1. Replace `getByText(/matched/i)` with `getByTestId('status-badge')`
2. Replace `getByText(mockRequest.id)` with `getByTestId('request-id')`
3. Add `data-testid` attributes to component
4. Update mock data to match component types

**Estimated Fixes:** 8 tests

#### 2.2 AdminDecisionDashboard Tests
**File:** `src/components/admin/__tests__/AdminDecisionDashboard.test.tsx`

**Changes:**
1. Add MSW handlers for decision API
2. Use `waitFor()` for async data loading
3. Update selectors to use `getByRole()` for buttons
4. Fix mock data structure

**Estimated Fixes:** 7 tests

#### 2.3 ExchangeRequestForm Tests
**File:** `src/components/p2p-exchange/__tests__/ExchangeRequestForm.test.tsx`

**Changes:**
1. Add form field `data-testid` attributes
2. Use `userEvent` instead of `fireEvent`
3. Add proper async/await for form submission
4. Mock form validation responses

**Estimated Fixes:** 6 tests

#### 2.4 Integration Tests
**File:** `src/__tests__/integration/*.test.tsx`

**Changes:**
1. Add proper MSW handler setup
2. Use `waitFor()` for all async operations
3. Add proper cleanup between tests
4. Mock all external API calls

**Estimated Fixes:** 20 tests

### Phase 3: Test Data Alignment (2 hours)

#### 3.1 Type Validation
Ensure all mock data matches component prop types:
```typescript
// Before
export const mockRequest = {
  id: 1,
  // ...
};

// After
export const mockRequest: ExchangeRequest = {
  id: 1,
  // ...
};
```

#### 3.2 Mock Data Consistency
Create consistent mock data across all tests:
- Use factory functions
- Validate against types
- Document expected values
- Add comments for non-obvious values

### Phase 4: Async Pattern Fixes (1.5 hours)

#### 4.1 Update Async Patterns
Replace:
```typescript
// Before
expect(screen.getByText('Loading')).toBeInTheDocument();

// After
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});
```

#### 4.2 Add Proper Waits
```typescript
// Before
render(<Component />);
expect(screen.getByText('Data')).toBeInTheDocument();

// After
render(<Component />);
await screen.findByText('Data');
expect(screen.getByText('Data')).toBeInTheDocument();
```

## Implementation Order

### Day 1 Afternoon (2-3 hours)
1. Fix test utilities and mock data setup
2. Add missing MSW handlers
3. Fix top 5 failing component tests

### Day 2 Morning (3-4 hours)
1. Fix remaining component tests
2. Update async patterns
3. Add proper test IDs to components

### Day 2 Afternoon (2-3 hours)
1. Fix integration tests
2. Add error scenario tests
3. Verify all fixes

## Success Criteria

- [ ] 80% of tests passing (346/432)
- [ ] All component tests passing
- [ ] All integration tests passing
- [ ] No flaky tests
- [ ] All async operations properly handled
- [ ] Coverage report generated

## Files to Modify

### High Priority (Must Fix)
1. `src/__tests__/utils/test-utils.tsx` - Add helpers
2. `src/__tests__/fixtures/mock-data.ts` - Add factories
3. `src/__tests__/mocks/handlers.ts` - Add endpoints
4. `src/__tests__/setup.ts` - Verify setup

### Medium Priority (Component Updates)
1. All component test files - Update selectors
2. All component files - Add test IDs
3. All integration test files - Add async waits

### Low Priority (Documentation)
1. Create test writing guide
2. Document mock data patterns
3. Document async test patterns

## Estimated Timeline

- **Setup & Infrastructure:** 2 hours
- **Component Test Fixes:** 4 hours
- **Test Data Alignment:** 2 hours
- **Async Pattern Fixes:** 1.5 hours
- **Verification & Documentation:** 1.5 hours
- **Total:** ~11 hours

## Risk Mitigation

1. **Risk:** Breaking existing passing tests
   **Mitigation:** Run full suite after each change

2. **Risk:** Incomplete mock data
   **Mitigation:** Audit all API calls before fixing

3. **Risk:** Flaky async tests
   **Mitigation:** Use proper wait patterns consistently

4. **Risk:** Test maintenance burden
   **Mitigation:** Create reusable test utilities

## Next Steps

1. Start with test utilities and mock data
2. Add missing MSW handlers
3. Fix component tests systematically
4. Verify all fixes with full test run
5. Generate coverage report
6. Document findings and patterns

---

**Created:** January 29, 2026, 19:15 UTC  
**Status:** Ready for Implementation
