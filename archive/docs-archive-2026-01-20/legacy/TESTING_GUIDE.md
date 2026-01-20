# ًں§ھ ط¯ظ„ظٹظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ - Testing Guide

**ط¢ط®ط± طھط­ط¯ظٹط«:** 25 ط¯ظٹط³ظ…ط¨ط± 2025

---

## ًں“‹ ط§ظ„ظپط±ظ‚ ط¨ظٹظ† ط£ظ†ظˆط§ط¹ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ

### â‌Œ Mock Tests (ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„ظˆظ‡ظ…ظٹط©)
```typescript
// ظ‡ط°ط§ ظ…ط¬ط±ط¯ ظˆظ‡ظ… - ظ„ط§ ظٹط®طھط¨ط± ط§ظ„ظƒظˆط¯ ط§ظ„ط­ظ‚ظٹظ‚ظٹ
const mockService = {
  searchProducts: jest.fn().mockResolvedValue({
    products: [{ id: '1', name: 'Product' }]
  })
};

it('should search products', async () => {
  const result = await mockService.searchProducts('test');
  expect(result.products).toHaveLength(1); // âœ… ظٹظ…ط± ط¯ط§ط¦ظ…ط§ظ‹
});
```

**ط§ظ„ظ…ط´ط§ظƒظ„:**
- ظ„ط§ ظٹط®طھط¨ط± ط§ظ„ظƒظˆط¯ ط§ظ„ظپط¹ظ„ظٹ
- ظٹظ…ط± ط¯ط§ط¦ظ…ط§ظ‹ ط­طھظ‰ ظ„ظˆ ط§ظ„ظƒظˆط¯ ظƒط³ط±ط§ظ†
- ظ„ط§ ظپط§ط¦ط¯ط© ظ…ظ†ظ‡

---

### âœ… Real Unit Tests (ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„ط­ظ‚ظٹظ‚ظٹط©)
```typescript
// ظٹط®طھط¨ط± ط§ظ„ظƒظˆط¯ ط§ظ„ظپط¹ظ„ظٹ
import { VoiceService } from '../services/voice.service';

let voiceService: VoiceService;

beforeEach(() => {
  voiceService = new VoiceService(prisma);
});

it('should search products', async () => {
  const result = await voiceService.searchProducts('ط¢ظٹظپظˆظ†');
  
  // ظٹط®طھط¨ط± ط§ظ„ظƒظˆط¯ ط§ظ„ط­ظ‚ظٹظ‚ظٹ
  expect(result.products).toBeDefined();
  expect(result.products.length).toBeGreaterThanOrEqual(0);
  
  if (result.products.length > 0) {
    expect(result.products[0]).toHaveProperty('id');
    expect(result.products[0]).toHaveProperty('name');
  }
});
```

**ط§ظ„ظ…ظ…ظٹط²ط§طھ:**
- ظٹط®طھط¨ط± ط§ظ„ظƒظˆط¯ ط§ظ„ظپط¹ظ„ظٹ
- ظٹظƒطھط´ظپ ط§ظ„ط£ط®ط·ط§ط، ط§ظ„ط­ظ‚ظٹظ‚ظٹط©
- ظٹط¶ظ…ظ† ط£ظ† ط§ظ„ظƒظˆط¯ ظٹط¹ظ…ظ„

---

## ًںژ¯ ط£ظ†ظˆط§ط¹ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ

### 1ï¸ڈâƒ£ Unit Tests (ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„ظˆط­ط¯ط©)
**ظ…ط§ط°ط§ طھط®طھط¨ط±طں** ط¯ط§ظ„ط© ظˆط§ط­ط¯ط© ط£ظˆ class ظˆط§ط­ط¯ ط¨ظ…ط¹ط²ظ„ ط¹ظ† ط§ظ„ط¢ط®ط±ظٹظ†

```typescript
describe('VoiceService', () => {
  describe('detectIntent', () => {
    it('should detect SEARCH_PRODUCT intent', async () => {
      const result = await voiceService.detectIntent('ط§ط¨ط­ط« ط¹ظ† ط¢ظٹظپظˆظ†');
      expect(result.intent).toBe('SEARCH_PRODUCT');
    });
  });
});
```

### 2ï¸ڈâƒ£ Integration Tests (ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„طھظƒط§ظ…ظ„)
**ظ…ط§ط°ط§ طھط®طھط¨ط±طں** طھظپط§ط¹ظ„ ط¹ط¯ط© components ظ…ط¹ ط¨ط¹ط¶ظ‡ط§

```typescript
describe('Payment Flow', () => {
  it('should complete payment flow', async () => {
    // 1. Add to cart
    const cart = await cartService.addItem(productId);
    
    // 2. Checkout
    const order = await checkoutService.createOrder(cart);
    
    // 3. Process payment
    const payment = await paymentService.process(order);
    
    expect(payment.status).toBe('COMPLETED');
  });
});
```

### 3ï¸ڈâƒ£ E2E Tests (ط§ط®طھط¨ط§ط±ط§طھ ظ…ظ† ط§ظ„ط¨ط¯ط§ظٹط© ظ„ظ„ظ†ظ‡ط§ظٹط©)
**ظ…ط§ط°ط§ طھط®طھط¨ط±طں** ط§ظ„ط³ظٹظ†ط§ط±ظٹظˆ ط§ظ„ظƒط§ظ…ظ„ ظ…ظ† ظˆط§ط¬ظ‡ط© ط§ظ„ظ…ط³طھط®ط¯ظ…

```typescript
describe('User Journey', () => {
  it('should complete purchase', async () => {
    // 1. Login
    await page.goto('https://mnbarh.com/login');
    await page.fill('input[name="email"]', 'user@example.com');
    
    // 2. Search
    await page.fill('input[name="search"]', 'iPhone');
    
    // 3. Add to cart
    await page.click('button:has-text("Add to Cart")');
    
    // 4. Checkout
    await page.click('button:has-text("Checkout")');
    
    // 5. Verify
    expect(page.url()).toContain('/order-success');
  });
});
```

---

## ًں› ï¸ڈ ظƒظٹظپظٹط© ظƒطھط§ط¨ط© ط§ط®طھط¨ط§ط±ط§طھ ط­ظ‚ظٹظ‚ظٹط©

### ط§ظ„ط®ط·ظˆط© 1: Setup
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { VoiceService } from '../services/voice.service';
import { PrismaClient } from '@prisma/client';

describe('VoiceService', () => {
  let voiceService: VoiceService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    // ط¥ط¹ط¯ط§ط¯ ظ‚ط¨ظ„ ظƒظ„ ط§ط®طھط¨ط§ط±
    prisma = new PrismaClient();
    voiceService = new VoiceService(prisma);
  });

  afterEach(async () => {
    // طھظ†ط¸ظٹظپ ط¨ط¹ط¯ ظƒظ„ ط§ط®طھط¨ط§ط±
    await prisma.$disconnect();
  });
});
```

### ط§ظ„ط®ط·ظˆط© 2: ظƒطھط§ط¨ط© ط§ظ„ط§ط®طھط¨ط§ط±
```typescript
it('should detect intent correctly', async () => {
  // Arrange - طھط­ط¶ظٹط± ط§ظ„ط¨ظٹط§ظ†ط§طھ
  const query = 'ط§ط¨ط­ط« ط¹ظ† ط¢ظٹظپظˆظ†';
  
  // Act - طھظ†ظپظٹط° ط§ظ„ظƒظˆط¯
  const result = await voiceService.detectIntent(query);
  
  // Assert - ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظ†طھظٹط¬ط©
  expect(result.intent).toBe('SEARCH_PRODUCT');
  expect(result.confidence).toBeGreaterThan(0.8);
});
```

### ط§ظ„ط®ط·ظˆط© 3: ط§ط®طھط¨ط§ط± ط§ظ„ط£ط®ط·ط§ط،
```typescript
it('should handle invalid input', async () => {
  // ظٹط¬ط¨ ط£ظ† ظٹط±ظ…ظٹ ط®ط·ط£
  await expect(voiceService.detectIntent(''))
    .rejects.toThrow('Query cannot be empty');
});
```

---

## ًں“ٹ Coverage (طھط؛ط·ظٹط© ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ)

### ظ…ط§ ظ‡ظٹ ط§ظ„طھط؛ط·ظٹط©طں
ظ†ط³ط¨ط© ط§ظ„ظƒظˆط¯ ط§ظ„ظ…ط®طھط¨ط± ظ…ظ† ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظƒظˆط¯

```
âœ… 100% Coverage = ظƒظ„ ط³ط·ط± ظƒظˆط¯ ظ…ط®طھط¨ط±
âœ… 80% Coverage = 80% ظ…ظ† ط§ظ„ظƒظˆط¯ ظ…ط®طھط¨ط±
â‌Œ 50% Coverage = ظ†طµظپ ط§ظ„ظƒظˆط¯ ظپظ‚ط· ظ…ط®طھط¨ط±
```

### ظƒظٹظپظٹط© ظ‚ظٹط§ط³ ط§ظ„طھط؛ط·ظٹط©طں
```bash
npm run test:coverage

# ط§ظ„ظ†طھظٹط¬ط©:
# âœ… Statements: 85%
# âœ… Branches: 80%
# âœ… Functions: 90%
# âœ… Lines: 85%
```

---

## ًںڑ€ طھط´ط؛ظٹظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ

### طھط´ط؛ظٹظ„ ط¬ظ…ظٹط¹ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ
```bash
npm run test
```

### طھط´ط؛ظٹظ„ ط§ط®طھط¨ط§ط±ط§طھ ط®ط¯ظ…ط© ظ…ط¹ظٹظ†ط©
```bash
cd backend/services/voice-commerce-service
npm run test
```

### طھط´ط؛ظٹظ„ ط§ط®طھط¨ط§ط± ظ…ط¹ظٹظ†
```bash
npm run test -- voice.service.test.ts
```

### طھط´ط؛ظٹظ„ ظ…ط¹ ظ…ط±ط§ظ‚ط¨ط© ط§ظ„طھط؛ظٹظٹط±ط§طھ
```bash
npm run test:watch
```

### ظ‚ظٹط§ط³ ط§ظ„طھط؛ط·ظٹط©
```bash
npm run test:coverage
```

---

## âœ… Checklist ظ„ظƒطھط§ط¨ط© ط§ط®طھط¨ط§ط±ط§طھ ط¬ظٹط¯ط©

- [ ] ط§ظ„ط§ط®طھط¨ط§ط± ظٹط®طھط¨ط± ط§ظ„ظƒظˆط¯ ط§ظ„ط­ظ‚ظٹظ‚ظٹ (ظ„ظٹط³ mock)
- [ ] ط§ظ„ط§ط®طھط¨ط§ط± ظ…ط³طھظ‚ظ„ (ظ„ط§ ظٹط¹طھظ…ط¯ ط¹ظ„ظ‰ ط§ط®طھط¨ط§ط±ط§طھ ط£ط®ط±ظ‰)
- [ ] ط§ظ„ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹ (ط£ظ‚ظ„ ظ…ظ† 1 ط«ط§ظ†ظٹط©)
- [ ] ط§ظ„ط§ط®طھط¨ط§ط± ظˆط§ط¶ط­ (ظٹظپظ‡ظ… ط§ظ„ط¢ط®ط±ظˆظ† ظ…ط§ط°ط§ ظٹط®طھط¨ط±)
- [ ] ط§ظ„ط§ط®طھط¨ط§ط± ظٹط؛ط·ظٹ ط§ظ„ط­ط§ظ„ط§طھ ط§ظ„ظ†ط§ط¬ط­ط© ظˆط§ظ„ظپط§ط´ظ„ط©
- [ ] ط§ظ„ط§ط®طھط¨ط§ط± ظٹطھط¹ط§ظ…ظ„ ظ…ط¹ ط§ظ„ط£ط®ط·ط§ط،
- [ ] ط§ظ„ط§ط®طھط¨ط§ط± ظ†ط¸ظٹظپ (ط¨ط¯ظˆظ† hardcoded values)

---

## ًں“ˆ ط£ظ‡ط¯ط§ظپ ط§ظ„طھط؛ط·ظٹط©

| ط§ظ„ظ…ظƒظˆظ† | ط§ظ„ظ‡ط¯ظپ | ط§ظ„ط­ط§ظ„ظٹ |
|--------|-------|--------|
| Services | 90% | âڈ³ 70% |
| Controllers | 85% | âڈ³ 60% |
| Utils | 95% | âڈ³ 80% |
| Models | 80% | âڈ³ 75% |

---

## ًں”„ CI/CD Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: npm run test:coverage
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

---

**ط¢ط®ط± طھط­ط¯ظٹط«:** 25 ط¯ظٹط³ظ…ط¨ط± 2025

