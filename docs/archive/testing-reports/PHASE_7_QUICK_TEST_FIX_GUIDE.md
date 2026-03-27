# Phase 7 - Quick Test Fix Guide

**Quick Reference for Fixing 255 Failing Tests**

## Most Common Issues & Fixes

### Issue 1: Element Not Found (80 tests)

**Problem:**
```
TestingLibraryElementError: Unable to find an element with the text: /matched/i
```

**Fix 1: Use getByTestId instead**
```typescript
// Before (FAILS)
expect(screen.getByText(/matched/i)).toBeInTheDocument();

// After (WORKS)
expect(screen.getByTestId('status-badge')).toBeInTheDocument();
```

**Fix 2: Add testId to component**
```typescript
// In component
<div data-testid="status-badge" className="...">
  {request.status}
</div>
```

**Fix 3: Use getByRole for buttons**
```typescript
// Before
screen.getByText('Accept Request')

// After
screen.getByRole('button', { name: /accept request/i })
```

---

### Issue 2: Async Data Not Loaded (60 tests)

**Problem:**
```
Expected element to be in the document, but it was not found
```

**Fix: Use waitFor or findBy**
```typescript
// Before (FAILS)
render(<Component />);
expect(screen.getByText('Data')).toBeInTheDocument();

// After (WORKS)
render(<Component />);
await screen.findByText('Data');
expect(screen.getByText('Data')).toBeInTheDocument();

// Or
render(<Component />);
await waitFor(() => {
  expect(screen.getByText('Data')).toBeInTheDocument();
});
```

---

### Issue 3: Mock Data Type Mismatch (50 tests)

**Problem:**
```
Component expects id: number, but mock provides id: string
```

**Fix: Use factory functions with proper types**
```typescript
// Before (WRONG)
const mockRequest = {
  id: '1',  // String!
  status: 'OPEN',
};

// After (CORRECT)
export const createMockRequest = (overrides = {}): ExchangeRequest => ({
  id: 1,  // Number
  userId: 1,
  fromCurrency: 'USD',
  toCurrency: 'SAR',
  fromAmount: '100',
  toAmount: '375',
  desiredRate: '3.75',
  actualRate: '3.75',
  platformFee: '2.50',
  protectionFee: '1.00',
  status: ExchangeStatus.OPEN,
  trustLevel: 5,
  securityDeposit: '50',
  useExternalEscrow: false,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  matchedAt: null,
  completedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
```

---

### Issue 4: Missing API Mock Handlers (40 tests)

**Problem:**
```
MSW: unhandled request POST /api/exchange-requests
```

**Fix: Add handler to MSW**
```typescript
// In src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Exchange Requests
  http.get('/api/exchange-requests', () => {
    return HttpResponse.json([mockExchangeRequest]);
  }),
  
  http.post('/api/exchange-requests', () => {
    return HttpResponse.json(mockExchangeRequest, { status: 201 });
  }),
  
  // Matches
  http.get('/api/matches', () => {
    return HttpResponse.json([mockExchangeMatch]);
  }),
  
  http.post('/api/matches/:id/accept', () => {
    return HttpResponse.json({ success: true });
  }),
  
  // Add more as needed...
];
```

---

### Issue 5: Flaky Async Tests (25 tests)

**Problem:**
```
Test passes sometimes, fails other times
```

**Fix: Use proper async patterns**
```typescript
// Before (FLAKY)
render(<Component />);
setTimeout(() => {
  expect(screen.getByText('Data')).toBeInTheDocument();
}, 100);

// After (RELIABLE)
render(<Component />);
await waitFor(() => {
  expect(screen.getByText('Data')).toBeInTheDocument();
}, { timeout: 3000 });

// Or better
render(<Component />);
const element = await screen.findByText('Data', {}, { timeout: 3000 });
expect(element).toBeInTheDocument();
```

---

## Quick Fix Checklist

For each failing test:

- [ ] **Step 1:** Check if element exists in DOM
  - Use `screen.debug()` to see rendered HTML
  - Look for text/role/testId in output

- [ ] **Step 2:** Check if it's an async issue
  - Add `await waitFor()` or `await screen.findBy*()`
  - Check if component loads data on mount

- [ ] **Step 3:** Check mock data types
  - Verify mock data matches component prop types
  - Use TypeScript to catch type mismatches

- [ ] **Step 4:** Check API mocks
  - Verify MSW handler exists for API call
  - Check handler returns correct data structure

- [ ] **Step 5:** Add testId if needed
  - Add `data-testid` to component
  - Use `getByTestId()` in test

---

## Common Test Patterns

### Pattern 1: Component with Props
```typescript
it('should render with props', () => {
  const mockRequest = createMockRequest({ status: 'MATCHED' });
  render(
    <MarketplaceRequestCard 
      request={mockRequest}
      onSelect={vi.fn()}
    />
  );
  expect(screen.getByTestId('request-card')).toBeInTheDocument();
});
```

### Pattern 2: Component with API Call
```typescript
it('should load data from API', async () => {
  render(<AdminDashboard />);
  
  // Wait for data to load
  const element = await screen.findByTestId('decision-list');
  expect(element).toBeInTheDocument();
});
```

### Pattern 3: Component with User Interaction
```typescript
it('should handle user interaction', async () => {
  const mockOnClick = vi.fn();
  render(
    <Button onClick={mockOnClick}>
      Click Me
    </Button>
  );
  
  const button = screen.getByRole('button', { name: /click me/i });
  await userEvent.click(button);
  
  expect(mockOnClick).toHaveBeenCalled();
});
```

### Pattern 4: Component with Form
```typescript
it('should submit form', async () => {
  const mockOnSubmit = vi.fn();
  render(<ExchangeRequestForm onSubmit={mockOnSubmit} />);
  
  const input = screen.getByRole('textbox', { name: /amount/i });
  await userEvent.type(input, '100');
  
  const button = screen.getByRole('button', { name: /submit/i });
  await userEvent.click(button);
  
  expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
    amount: '100',
  }));
});
```

---

## Testing Library Best Practices

### ✅ DO
- Use `getByRole()` for buttons, inputs, etc.
- Use `getByTestId()` for complex queries
- Use `findBy*()` for async elements
- Use `waitFor()` for async assertions
- Use `userEvent` instead of `fireEvent`
- Mock API calls with MSW
- Create factory functions for mock data
- Add descriptive test names

### ❌ DON'T
- Use `getByText()` for everything
- Use `fireEvent` for user interactions
- Use `setTimeout` for async waits
- Create mock data inline
- Forget to add `data-testid` attributes
- Test implementation details
- Use `screen.debug()` in final tests
- Ignore TypeScript errors

---

## Debug Commands

```typescript
// See rendered HTML
screen.debug();

// See specific element
screen.debug(screen.getByTestId('my-element'));

// List all elements with role
screen.logTestingPlaygroundURL();

// Check if element exists
screen.queryByTestId('my-element'); // Returns null if not found

// Find all elements matching query
screen.getAllByRole('button');
```

---

## File Locations

- **Test Setup:** `src/__tests__/setup.ts`
- **Mock Data:** `src/__tests__/fixtures/mock-data.ts`
- **Mock Handlers:** `src/__tests__/mocks/handlers.ts`
- **Test Utils:** `src/__tests__/utils/test-utils.tsx`
- **Component Tests:** `src/components/**/__tests__/*.test.tsx`
- **Integration Tests:** `src/__tests__/integration/*.test.tsx`
- **E2E Tests:** `src/__tests__/e2e/*.test.tsx`

---

## Next Steps

1. **Immediate:** Fix test utilities and mock data
2. **Short-term:** Fix component tests (use patterns above)
3. **Medium-term:** Fix integration tests
4. **Long-term:** Add E2E tests

---

**Last Updated:** January 29, 2026  
**Status:** Ready to Use
