# 🧪 دليل الاختبارات - Testing Guide

**آخر تحديث:** 25 ديسمبر 2025

---

## 📋 الفرق بين أنواع الاختبارات

### ❌ Mock Tests (الاختبارات الوهمية)
```typescript
// هذا مجرد وهم - لا يختبر الكود الحقيقي
const mockService = {
  searchProducts: jest.fn().mockResolvedValue({
    products: [{ id: '1', name: 'Product' }]
  })
};

it('should search products', async () => {
  const result = await mockService.searchProducts('test');
  expect(result.products).toHaveLength(1); // ✅ يمر دائماً
});
```

**المشاكل:**
- لا يختبر الكود الفعلي
- يمر دائماً حتى لو الكود كسران
- لا فائدة منه

---

### ✅ Real Unit Tests (الاختبارات الحقيقية)
```typescript
// يختبر الكود الفعلي
import { VoiceService } from '../services/voice.service';

let voiceService: VoiceService;

beforeEach(() => {
  voiceService = new VoiceService(prisma);
});

it('should search products', async () => {
  const result = await voiceService.searchProducts('آيفون');
  
  // يختبر الكود الحقيقي
  expect(result.products).toBeDefined();
  expect(result.products.length).toBeGreaterThanOrEqual(0);
  
  if (result.products.length > 0) {
    expect(result.products[0]).toHaveProperty('id');
    expect(result.products[0]).toHaveProperty('name');
  }
});
```

**المميزات:**
- يختبر الكود الفعلي
- يكتشف الأخطاء الحقيقية
- يضمن أن الكود يعمل

---

## 🎯 أنواع الاختبارات

### 1️⃣ Unit Tests (اختبارات الوحدة)
**ماذا تختبر؟** دالة واحدة أو class واحد بمعزل عن الآخرين

```typescript
describe('VoiceService', () => {
  describe('detectIntent', () => {
    it('should detect SEARCH_PRODUCT intent', async () => {
      const result = await voiceService.detectIntent('ابحث عن آيفون');
      expect(result.intent).toBe('SEARCH_PRODUCT');
    });
  });
});
```

### 2️⃣ Integration Tests (اختبارات التكامل)
**ماذا تختبر؟** تفاعل عدة components مع بعضها

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

### 3️⃣ E2E Tests (اختبارات من البداية للنهاية)
**ماذا تختبر؟** السيناريو الكامل من واجهة المستخدم

```typescript
describe('User Journey', () => {
  it('should complete purchase', async () => {
    // 1. Login
    await page.goto('https://mnbara.com/login');
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

## 🛠️ كيفية كتابة اختبارات حقيقية

### الخطوة 1: Setup
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { VoiceService } from '../services/voice.service';
import { PrismaClient } from '@prisma/client';

describe('VoiceService', () => {
  let voiceService: VoiceService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    // إعداد قبل كل اختبار
    prisma = new PrismaClient();
    voiceService = new VoiceService(prisma);
  });

  afterEach(async () => {
    // تنظيف بعد كل اختبار
    await prisma.$disconnect();
  });
});
```

### الخطوة 2: كتابة الاختبار
```typescript
it('should detect intent correctly', async () => {
  // Arrange - تحضير البيانات
  const query = 'ابحث عن آيفون';
  
  // Act - تنفيذ الكود
  const result = await voiceService.detectIntent(query);
  
  // Assert - التحقق من النتيجة
  expect(result.intent).toBe('SEARCH_PRODUCT');
  expect(result.confidence).toBeGreaterThan(0.8);
});
```

### الخطوة 3: اختبار الأخطاء
```typescript
it('should handle invalid input', async () => {
  // يجب أن يرمي خطأ
  await expect(voiceService.detectIntent(''))
    .rejects.toThrow('Query cannot be empty');
});
```

---

## 📊 Coverage (تغطية الاختبارات)

### ما هي التغطية؟
نسبة الكود المختبر من إجمالي الكود

```
✅ 100% Coverage = كل سطر كود مختبر
✅ 80% Coverage = 80% من الكود مختبر
❌ 50% Coverage = نصف الكود فقط مختبر
```

### كيفية قياس التغطية؟
```bash
npm run test:coverage

# النتيجة:
# ✅ Statements: 85%
# ✅ Branches: 80%
# ✅ Functions: 90%
# ✅ Lines: 85%
```

---

## 🚀 تشغيل الاختبارات

### تشغيل جميع الاختبارات
```bash
npm run test
```

### تشغيل اختبارات خدمة معينة
```bash
cd backend/services/voice-commerce-service
npm run test
```

### تشغيل اختبار معين
```bash
npm run test -- voice.service.test.ts
```

### تشغيل مع مراقبة التغييرات
```bash
npm run test:watch
```

### قياس التغطية
```bash
npm run test:coverage
```

---

## ✅ Checklist لكتابة اختبارات جيدة

- [ ] الاختبار يختبر الكود الحقيقي (ليس mock)
- [ ] الاختبار مستقل (لا يعتمد على اختبارات أخرى)
- [ ] الاختبار سريع (أقل من 1 ثانية)
- [ ] الاختبار واضح (يفهم الآخرون ماذا يختبر)
- [ ] الاختبار يغطي الحالات الناجحة والفاشلة
- [ ] الاختبار يتعامل مع الأخطاء
- [ ] الاختبار نظيف (بدون hardcoded values)

---

## 📈 أهداف التغطية

| المكون | الهدف | الحالي |
|--------|-------|--------|
| Services | 90% | ⏳ 70% |
| Controllers | 85% | ⏳ 60% |
| Utils | 95% | ⏳ 80% |
| Models | 80% | ⏳ 75% |

---

## 🔄 CI/CD Integration

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

**آخر تحديث:** 25 ديسمبر 2025
