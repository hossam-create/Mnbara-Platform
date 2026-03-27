# TRN-001: Fee Calculation Service Implementation

## Summary
Implemented a configuration-based fee calculation service that provides transparent fee breakdowns for sellers before listing creation and checkout confirmation.

## What Was Done

### 1. Database Changes
- Created `FeeRule` model in Prisma schema with fields:
  - `name`, `version`: Rule identification and versioning
  - `listingType`: Applies to "buy_now", "auction", or all
  - `categoryId`: Category-specific rules (optional)
  - `minPrice`, `maxPrice`: Price range for tiered fees
  - `feeType`: PERCENTAGE, FIXED, or TIERED
  - `feeValue`: Fee amount or percentage
  - `paymentProcessingFee`: Payment processing percentage
  - `listingFee`: Fixed listing fee
  - `priority`: Rule priority (higher overrides lower)
  - `effectiveFrom`, `effectiveTo`: Rule validity period
- Created migration file: `prisma/migrations/20250103_add_fee_rules/migration.sql`
- Seeded default fee rules:
  - Tier 1 ($0-$100): 10% platform fee
  - Tier 2 ($101-$500): 8% platform fee
  - Tier 3 ($500+): 6% platform fee
  - Default payment processing: 2.9%

### 2. FeeCalculationService (`src/services/fee-calculation.service.ts`)
- `calculateFees()`: Main fee calculation method
  - Input: price, categoryId (optional), listingType (optional), currency (optional)
  - Output: Structured fee breakdown with platform fee, payment processing fee, listing fee, total fee, and net amount
- `getApplicableRules()`: Fetches active fee rules based on criteria
- `calculatePlatformFee()`: Calculates platform fee using applicable rules
- `calculatePaymentProcessingFee()`: Calculates payment processing fee
- `calculateListingFee()`: Calculates fixed listing fee
- `calculateFeesWithVersion()`: For historical fee calculations (future use)

**Default Fee Structure (when no rules match):**
- $0-$100: 10% platform fee
- $101-$500: 8% platform fee
- $500+: 6% platform fee
- Payment processing: 2.9% (Stripe standard)

### 3. Controller (`src/controllers/fee.controller.ts`)
- `calculateFees()`: Endpoint for listing preview fee calculation
- `calculateCheckoutFees()`: Endpoint for checkout preview fee calculation
- Both endpoints validate input and return structured fee breakdown

### 4. Routes (`src/routes/fee.routes.ts`)
- Added `/api/v1/fees/calculate` (POST): Calculate fees for listing preview
- Added `/api/v1/fees/calculate-checkout` (POST): Calculate fees for checkout preview
- Both routes include validation for price, categoryId, listingType, and currency

### 5. Service Integration (`src/index.ts`)
- Added fee routes to the Express app

### 6. Tests (`src/services/fee-calculation.service.test.ts`)
- Tests for all three price tiers ($50, $250, $1000)
- Tests for custom fee rules
- Tests for invalid inputs (negative price, exceeding maximum)
- Tests for auction listings
- Tests for category-specific rules
- Tests for edge cases (boundary prices, very small prices)
- Tests for structured breakdown response

## Acceptance Criteria Met

✅ **1. System must calculate platform fees based on listing type, category, and price**
- Fee rules support listing type, category, and price range filters
- Rules are matched based on priority and applicability

✅ **2. Fee breakdown must be returned as a structured response**
- Returns: `platformFee`, `paymentProcessingFee`, `listingFee`, `totalFee`, `netAmount`
- Includes detailed breakdown with descriptions and percentages
- Includes applied rule IDs for audit trail

✅ **3. Fee calculation must be available before listing creation (preview mode)**
- Endpoint: `/api/v1/fees/calculate`
- Can be called with price, categoryId, listingType before creating listing

✅ **4. Fee calculation must be available before checkout confirmation**
- Endpoint: `/api/v1/fees/calculate-checkout`
- Same calculation logic, separate endpoint for clarity

✅ **5. Fees must be calculated consistently and deterministically**
- Same inputs always produce same outputs
- Rules are fetched deterministically (sorted by priority)
- Calculations use fixed decimal precision (rounded to 2 decimals)

✅ **6. If fee rules change, existing transactions must not be affected**
- Fee rules are versioned (`version` field)
- Rules have effective dates (`effectiveFrom`, `effectiveTo`)
- `calculateFeesWithVersion()` method available for historical calculations
- Existing transactions can reference rule version used at time of transaction

✅ **7. Invalid inputs must return clear validation errors**
- Validates price > 0
- Validates price < maximum (1,000,000)
- Validates categoryId is positive integer
- Validates listingType is "buy_now" or "auction"
- Validates currency is 3-letter code
- Returns clear error messages for each validation failure

## Fee Calculation Logic

1. **Rule Matching:**
   - Filters rules by: isActive, effective dates, price range, category, listing type
   - Orders by priority (highest first), then version (newest first)
   - Uses highest priority matching rule

2. **Platform Fee:**
   - If rule found: Uses rule's feeType and feeValue
   - If no rule: Uses default tiered structure based on price

3. **Payment Processing Fee:**
   - If rule has paymentProcessingFee: Uses that percentage
   - Default: 2.9% (Stripe standard)

4. **Listing Fee:**
   - If rule has listingFee: Uses that fixed amount
   - Default: $0 (no listing fee)

5. **Total Calculation:**
   - `totalFee = platformFee + paymentProcessingFee + listingFee`
   - `netAmount = price - totalFee`
   - All amounts rounded to 2 decimal places

## API Endpoints

### Calculate Fees (Listing Preview)
```
POST /api/v1/fees/calculate
Content-Type: application/json

{
  "price": 100.00,
  "categoryId": 5,        // optional
  "listingType": "buy_now", // optional: "buy_now" or "auction"
  "currency": "USD"        // optional, default: "USD"
}

Response:
{
  "success": true,
  "data": {
    "platformFee": 10.00,
    "paymentProcessingFee": 2.90,
    "listingFee": 0.00,
    "totalFee": 12.90,
    "netAmount": 87.10,
    "currency": "USD",
    "breakdown": {
      "platformFee": {
        "amount": 10.00,
        "percentage": 10.00,
        "description": "Platform fee"
      },
      "paymentProcessingFee": {
        "amount": 2.90,
        "percentage": 2.90,
        "description": "Payment processing fee"
      },
      "listingFee": {
        "amount": 0.00,
        "description": "Listing fee"
      }
    },
    "appliedRules": {
      "platformFeeRuleId": 1,
      "paymentProcessingRuleId": 1
    }
  }
}
```

### Calculate Fees (Checkout Preview)
```
POST /api/v1/fees/calculate-checkout
Content-Type: application/json

{
  "price": 100.00,
  "categoryId": 5,        // optional
  "listingType": "buy_now", // optional
  "currency": "USD"        // optional
}

Response: Same structure as /calculate
```

## Configuration-Based Fee Rules

Fee rules are stored in the database and can be managed by admins. Example rule creation:

```sql
INSERT INTO "FeeRule" (
    "name", "version", "isActive", "listingType", "categoryId",
    "minPrice", "maxPrice", "feeType", "feeValue", "paymentProcessingFee",
    "priority", "effectiveFrom", "description"
) VALUES (
    'Electronics Category Fee',
    1,
    true,
    NULL,  -- Applies to all listing types
    10,    -- Category ID for Electronics
    0.00,
    NULL,  -- No max price
    'PERCENTAGE',
    7.50,  -- 7.5% for electronics
    2.90,  -- 2.9% payment processing
    10,    -- High priority
    NOW(),
    'Reduced fee for electronics category'
);
```

## Next Steps

1. Run database migration: `npx prisma migrate dev`
2. Generate Prisma client: `npx prisma generate`
3. Test the endpoints with various price ranges
4. (Future) Add admin interface for managing fee rules
5. (Future) Add fee rule history/audit trail

## Notes

- Fee calculations are deterministic: same inputs always produce same outputs
- Rules are versioned to support historical fee calculations
- Default fee structure matches the frontend fee schedule (10%, 8%, 6%)
- Payment processing fee is separate from platform fee
- All amounts are rounded to 2 decimal places for currency precision
- The service follows existing transaction and pricing architecture patterns





