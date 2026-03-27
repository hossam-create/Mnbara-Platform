# @mnbara/types Test Suite

This directory contains comprehensive tests for the `@mnbara/types` package, including both unit tests and property-based tests.

## Test Files

### Unit Tests
- `user.types.test.ts` - Tests for user-related type definitions
- `order.types.test.ts` - Tests for order-related type definitions
- `payment.types.test.ts` - Tests for payment-related type definitions
- `delivery.types.test.ts` - Tests for delivery-related type definitions
- `common.types.test.ts` - Tests for common shared type definitions
- `index.test.ts` - Tests for package exports

### Property-Based Tests
- `type-validation.property.test.ts` - Property-based tests using fast-check

## Property-Based Testing

Property-based tests validate that type definitions maintain their invariants across a wide range of generated inputs. These tests use the `fast-check` library to generate hundreds of test cases automatically.

### Prerequisites

To run property-based tests, you need to install fast-check:

```bash
npm install --save-dev fast-check
```

### Running Tests

Run all tests:
```bash
npm test
```

Run only property-based tests:
```bash
npx vitest run type-validation.property.test.ts
```

Run tests in watch mode:
```bash
npm test -- --watch
```

## Property-Based Test Coverage

The property-based tests validate the following correctness properties:

### User Types
- ✅ Email format validation
- ✅ User roles are valid enum values
- ✅ Profile names are non-empty strings
- ✅ Statistics are non-negative
- ✅ Completed orders ≤ total orders
- ✅ Average rating between 0 and 5
- ✅ Trust score between 0 and 100

### Order Types
- ✅ Order total = subtotal + tax + shipping - discount
- ✅ Item total = quantity × unit price
- ✅ Quantity is positive
- ✅ Status values are valid enums
- ✅ Pricing components are non-negative

### Payment Types
- ✅ Payment amount is positive
- ✅ Net amount = amount - fee
- ✅ Status values are valid enums
- ✅ Method types are valid enums
- ✅ Refund amount ≤ payment amount

### Delivery Types
- ✅ Package weight is positive
- ✅ Package quantity is positive
- ✅ Status values are valid enums
- ✅ Route distance is non-negative
- ✅ Pricing total = sum of all fees

### Common Types
- ✅ Latitude between -90 and 90
- ✅ Longitude between -180 and 180
- ✅ Money amount is non-negative
- ✅ Address fields are non-empty
- ✅ Currency codes are valid
- ✅ Pagination parameters are positive

### Cross-Type Invariants
- ✅ Timestamps are chronologically ordered (createdAt ≤ updatedAt)
- ✅ Currency consistency across related entities
- ✅ ID fields are non-empty strings
- ✅ Enum values are strings

## Test Configuration

Tests are configured in `vitest.config.ts` at the workspace root.

## Writing New Property-Based Tests

When adding new type definitions, follow this pattern:

```typescript
import * as fc from 'fast-check';

describe('Property: Your property description', () => {
  it('should maintain the invariant', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // Generator
        (value) => {
          // Your assertion
          expect(value).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 } // Number of test cases to generate
    );
  });
});
```

## Benefits of Property-Based Testing

1. **Comprehensive Coverage**: Tests hundreds of cases automatically
2. **Edge Case Discovery**: Finds edge cases you might not think of
3. **Regression Prevention**: Ensures invariants hold across refactoring
4. **Documentation**: Properties serve as executable specifications
5. **Confidence**: Provides stronger guarantees than example-based tests

## Troubleshooting

### Fast-check not installed
If you see errors about `fast-check` not being found, install it:
```bash
npm install --save-dev fast-check
```

### Tests timing out
If property-based tests are slow, reduce the number of runs:
```typescript
fc.assert(property, { numRuns: 50 }); // Reduced from 100
```

### Flaky tests
Property-based tests should be deterministic. If you see flaky behavior:
1. Check for non-deterministic code (random, Date.now(), etc.)
2. Use fc.seed() to reproduce specific failures
3. Review the generated counterexample

## References

- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)
- [Vitest Documentation](https://vitest.dev/)
