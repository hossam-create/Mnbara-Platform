# Phase 7 - Systematic Fix Guide for All Components

**Objective:** Apply consistent fixes to all 50 failing test files  
**Pattern:** Add testIds → Update tests → Use factories → Add async waits

---

## Quick Reference: 4-Step Fix Pattern

### Step 1: Add testIds to Component
```typescript
// Add to main container
<div data-testid="component-name">

// Add to key elements
<button data-testid="action-button">
<div data-testid="status-badge">
<input data-testid="form-input" />
```

### Step 2: Add htmlFor to Labels
```typescript
// Before
<label className="...">From Currency</label>

// After
<label htmlFor="from-currency" className="...">From Currency</label>
<select id="from-currency" data-testid="from-currency-select">
```

### Step 3: Update Test Imports
```typescript
import { render, waitForElement, clickButton } from '../../../__tests__/utils/test-utils';
import { createMockExchangeRequest } from '../../../__tests__/fixtures/mock-data';
```

### Step 4: Update Test Assertions
```typescript
// Before
expect(screen.getByText('Content')).toBeInTheDocument();

// After
expect(screen.getByTestId('element-id')).toBeInTheDocument();
```

---

## Components to Fix (Priority Order)

### Tier 1: High Impact (6+ failures each)
1. **MarketplaceFilters** - 6+ failures
   - Add testIds to selects and buttons
   - Fix label queries

2. **ExchangeRequestForm** - 6+ failures
   - Add testIds to form fields
   - Add async waits for submission

3. **AdminDecisionDashboard** - 7+ failures
   - Add testIds to list and filters
   - Add async waits for data loading

4. **MatchChat** - 5+ failures
   - Add testIds to messages
   - Add async waits for message loading

5. **PaymentInitiation** - 5+ failures
   - Add testIds to payment fields
   - Add async waits for payment processing

### Tier 2: Medium Impact (4-5 failures each)
6. **ProofUpload** - 4+ failures
7. **ReceiptConfirmation** - 4+ failures
8. **SecurityDepositCard** - 4+ failures
9. **TrustLevelBadge** - 3+ failures
10. **AdminProofVerification** - 3+ failures

### Tier 3: Lower Impact (2-3 failures each)
11-50. Other components with fewer failures

---

## Detailed Fix Checklist

### For Each Component:

#### 1. Component File (src/components/*/ComponentName.tsx)
- [ ] Add `data-testid="component-name"` to main container
- [ ] Add `data-testid` to all key elements (buttons, badges, inputs)
- [ ] Add `htmlFor` to all labels
- [ ] Add `id` to all form inputs
- [ ] No logic changes

#### 2. Test File (src/components/*/__tests__/ComponentName.test.tsx)
- [ ] Update imports to use test utilities
- [ ] Replace `getByText()` with `getByTestId()`
- [ ] Replace `getByLabelText()` with `getByRole()` or `getByTestId()`
- [ ] Add `await` for async operations
- [ ] Use factory functions for mock data
- [ ] Add proper test descriptions

#### 3. Mock Data (src/__tests__/fixtures/mock-data.ts)
- [ ] Verify factory functions exist
- [ ] Use factory functions in tests

#### 4. Test Utilities (src/__tests__/utils/test-utils.tsx)
- [ ] Verify helper functions exist
- [ ] Use helpers in tests

---

## Common testId Naming Convention

```
Component Level:
  data-testid="component-name"

Container Elements:
  data-testid="component-name-container"
  data-testid="component-name-header"
  data-testid="component-name-body"
  data-testid="component-name-footer"

Interactive Elements:
  data-testid="component-name-button"
  data-testid="component-name-input"
  data-testid="component-name-select"
  data-testid="component-name-checkbox"

Display Elements:
  data-testid="component-name-badge"
  data-testid="component-name-status"
  data-testid="component-name-message"
  data-testid="component-name-list"

Specific Elements:
  data-testid="component-name-{specific-element}"
  Example: data-testid="marketplace-filters-from-currency-select"
```

---

## Test Pattern Examples

### Pattern 1: Simple Rendering Test
```typescript
it('should render component', () => {
  render(<Component />);
  expect(screen.getByTestId('component-name')).toBeInTheDocument();
});
```

### Pattern 2: Props Test
```typescript
it('should display with props', () => {
  const mock = createMockExchangeRequest({ status: ExchangeStatus.MATCHED });
  render(<Component request={mock} />);
  expect(screen.getByTestId('component-name')).toBeInTheDocument();
});
```

### Pattern 3: User Interaction Test
```typescript
it('should handle click', async () => {
  const mockOnClick = vi.fn();
  render(<Component onClick={mockOnClick} />);
  
  const button = screen.getByRole('button', { name: /click me/i });
  await userEvent.click(button);
  
  expect(mockOnClick).toHaveBeenCalled();
});
```

### Pattern 4: Async Data Test
```typescript
it('should load data', async () => {
  render(<Component />);
  
  const element = await screen.findByTestId('data-element');
  expect(element).toBeInTheDocument();
});
```

### Pattern 5: Form Test
```typescript
it('should submit form', async () => {
  const mockOnSubmit = vi.fn();
  render(<Form onSubmit={mockOnSubmit} />);
  
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

## Batch Fix Strategy

### Phase 1: Setup (Already Done)
- [x] Add factory functions to mock-data.ts
- [x] Add helpers to test-utils.tsx
- [x] Verify MSW handlers

### Phase 2: High-Impact Components (Next 2 hours)
- [ ] Fix MarketplaceFilters
- [ ] Fix ExchangeRequestForm
- [ ] Fix AdminDecisionDashboard
- [ ] Fix MatchChat
- [ ] Fix PaymentInitiation
- **Expected Result:** 30+ tests fixed, 50% pass rate

### Phase 3: Medium-Impact Components (Next 2 hours)
- [ ] Fix ProofUpload
- [ ] Fix ReceiptConfirmation
- [ ] Fix SecurityDepositCard
- [ ] Fix TrustLevelBadge
- [ ] Fix AdminProofVerification
- **Expected Result:** 20+ tests fixed, 60% pass rate

### Phase 4: Lower-Impact Components (Next 2 hours)
- [ ] Fix remaining 40 components
- [ ] Fix integration tests
- [ ] Fix E2E tests
- **Expected Result:** 50+ tests fixed, 70%+ pass rate

---

## Verification Checklist

After fixing each component:

- [ ] Component renders without errors
- [ ] All testIds are present
- [ ] All labels have htmlFor
- [ ] All inputs have id
- [ ] Tests use getByTestId
- [ ] Tests use factory functions
- [ ] Tests use async patterns
- [ ] Tests pass locally
- [ ] No console errors

---

## Expected Timeline

| Phase | Components | Tests Fixed | Pass Rate | Time |
|-------|-----------|------------|-----------|------|
| 1 | Setup | 12 | 42% | 30 min |
| 2 | 5 high-impact | 30+ | 50% | 2 hours |
| 3 | 5 medium-impact | 20+ | 60% | 2 hours |
| 4 | 40 low-impact | 50+ | 70%+ | 2 hours |
| **Total** | **50** | **112+** | **70%+** | **6.5 hours** |

---

## Success Metrics

- [x] Phase 1: Setup complete
- [ ] Phase 2: 50% pass rate
- [ ] Phase 3: 60% pass rate
- [ ] Phase 4: 70%+ pass rate
- [ ] Final: 80%+ pass rate (Day 4)

---

## Key Files to Reference

1. **Component Example:** `frontend/web-app/src/components/p2p-exchange/MarketplaceRequestCard.tsx`
2. **Test Example:** `frontend/web-app/src/components/p2p-exchange/__tests__/MarketplaceRequestCard.test.tsx`
3. **Mock Data:** `frontend/web-app/src/__tests__/fixtures/mock-data.ts`
4. **Test Utils:** `frontend/web-app/src/__tests__/utils/test-utils.tsx`
5. **MSW Handlers:** `frontend/web-app/src/__tests__/mocks/handlers.ts`

---

## Quick Commands

```bash
# Run tests
npm run test:run

# Run specific test file
npm run test:run -- src/components/p2p-exchange/__tests__/ComponentName.test.tsx

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Notes

- All fixes follow the same 4-step pattern
- No logic changes to components
- Only adding testIds and updating tests
- Factory functions ensure type safety
- Async patterns prevent flaky tests
- Consistent naming makes maintenance easier

---

**Status:** Ready for systematic application  
**Next:** Apply to Tier 1 components
