# خطة تنفيذ السبرينتات - منصة Mnbara

**التاريخ**: 1 فبراير 2026  
**الحالة**: ✅ جاهز للتنفيذ  
**الهدف**: تنفيذ منظم بمراحل وسبرينتات واضحة

---

## 🎯 نظرة عامة

### المبدأ الأساسي
```
كل مرحلة → سبرينتات منظمة → إنجاز كامل → الانتقال للمرحلة التالية
```

### نموذج العمل
1. **قبل MVP**: تطوير محلي + اختبار شامل + إطلاق أول نسخة
2. **بعد MVP**: تطوير مستمر + CI/CD تلقائي (Commit → Push → Deploy)

---

## 📊 الحالة الحالية للمشروع

### ما تم إنجازه (40% من الرؤية الكاملة)

#### ✅ البنية الأساسية (80%)
- Microservices Architecture
- Docker Containerization
- PostgreSQL + Redis + RabbitMQ + Elasticsearch
- API Gateway
- Authentication System (JWT)
- Database Migrations

#### ✅ الميزات الأساسية (70%)
- نظام المستخدمين والمصادقة
- نظام الإعلانات (Listings)
- نظام المزادات (Auctions)
- نظام السلة والطلبات
- نظام P2P Exchange (كامل)
- نظام Decision Authority (Custodii)
- نظام النزاعات والاستردادات
- نظام KYC والكشف عن الاحتيال
- نظام Trust & Safety

#### ✅ الواجهات (65%)
- تطبيق الويب (React/TypeScript)
- لوحة الإدارة
- جميع الصفحات الأساسية
- تطبيق الموبايل (Flutter - هيكل فقط)

### ❌ ما ينقص (60% من الرؤية الكاملة)

#### 🔴 الفجوات الحرجة
1. **لا يوجد ترخيص نقل الأموال** (Money Transmitter License)
2. **لا يوجد حفظ حقيقي للأموال** (Real Money Custody)
3. **لا يوجد تكامل بنكي حقيقي** (Bank Integration)
4. **لا يوجد مزود Escrow مرخص** (Licensed Escrow Provider)
5. **لا يوجد تكامل FX حقيقي** (Real FX Integration)

#### 🟡 الميزات المتقدمة المفقودة
- الذكاء الاصطناعي (90% مفقود)
- الميزات الجغرافية (95% مفقود)
- تطبيقات الموبايل (80% مفقود)
- الميزات المالية المتقدمة (60% مفقود)

---

## 🚀 الاستراتيجية: Fast-Track Launch

### الحل السريع (4-6 أسابيع)
بدلاً من الانتظار 9-12 شهر للحصول على التراخيص، نستخدم:

1. **Stripe Connect** - معالجة الدفع (مرخص)
2. **Escrow Kenya** - حفظ الأموال (مرخص) - **لديك حساب شريك!**
3. **OpenExchangeRates** - أسعار الصرف الحقيقية

### الفوائد
- ⚡ **السرعة**: 4-6 أسابيع بدلاً من 9-12 شهر (83% أسرع)
- 💰 **التكلفة**: $25K-$50K بدلاً من $335K-$665K (92% أرخص)
- 🛡️ **المخاطر**: منخفضة (مزودون موثوقون)
- ✅ **الامتثال**: صفر عوائق تنظيمية

---

## 📅 المراحل والسبرينتات

## المرحلة 0: الإعداد والتجهيز (أسبوع واحد)

### Sprint 0.1: إعداد البيئة المحلية (يومان)
**الحالة**: ⏳ جاهز للبدء

**المهام**:
- [ ] تثبيت جميع Dependencies
- [ ] إعداد قواعد البيانات المحلية
- [ ] تشغيل جميع الخدمات محلياً
- [ ] التحقق من عمل Docker Compose

**الأوامر**:
```bash
# تثبيت Dependencies
npm install

# إعداد قواعد البيانات
docker-compose up -d postgres redis

# تشغيل Migrations
npm run migrate:all

# تشغيل الخدمات
docker-compose up
```

**معايير النجاح**:
- ✅ جميع الخدمات تعمل محلياً
- ✅ قواعد البيانات متصلة
- ✅ لا توجد أخطاء في Console

---

### Sprint 0.2: إعداد Git و CI/CD (3 أيام)
**الحالة**: ⏳ جاهز للبدء

**المهام**:
- [ ] إعداد GitHub Repository
- [ ] إنشاء GitHub Actions Workflows
- [ ] إعداد AWS Account
- [ ] ربط GitHub مع AWS

**الملفات المطلوبة**:
```
.github/workflows/ci.yml
.github/workflows/deploy-staging.yml
.github/workflows/deploy-production.yml
```

**معايير النجاح**:
- ✅ GitHub Actions يعمل
- ✅ AWS متصل
- ✅ CI/CD Pipeline جاهز

---

## المرحلة 1: MVP الأساسي (4-6 أسابيع)

### الهدف
إطلاق منصة عاملة بالميزات الأساسية:
- تسجيل المستخدمين ✅ (موجود)
- إنشاء الإعلانات ✅ (موجود)
- نظام المزادات الأساسي ✅ (موجود)
- الدفع عبر Escrow Kenya + Stripe ❌ (يحتاج تنفيذ)

---

### Sprint 1.1: مراجعة وتثبيت الموجود (أسبوع واحد)

#### المهام
**Backend**:
- [ ] مراجعة Authentication API
- [ ] مراجعة Listing Service
- [ ] مراجعة Auction Service
- [ ] مراجعة Orders Service
- [ ] التأكد من جميع الاختبارات تعمل

**Frontend**:
- [ ] مراجعة صفحات التسجيل والدخول
- [ ] مراجعة صفحات الإعلانات
- [ ] مراجعة صفحات المزادات
- [ ] مراجعة صفحات الطلبات

**الاختبارات**:
- [ ] تشغيل جميع الاختبارات الموجودة
- [ ] إصلاح أي اختبارات فاشلة
- [ ] التأكد من Test Coverage > 80%

**معايير النجاح**:
- ✅ جميع الخدمات الأساسية تعمل
- ✅ جميع الاختبارات تنجح
- ✅ لا توجد أخطاء حرجة

---

### Sprint 1.2: تكامل Stripe Connect (أسبوعان)

#### المهام
**Backend**:
- [ ] ترقية Stripe Integration إلى Stripe Connect
- [ ] إنشاء Connected Accounts للبائعين
- [ ] تنفيذ Payment Flow مع application_fee
- [ ] تنفيذ Hold Funds Logic
- [ ] تنفيذ Release Funds Logic
- [ ] معالجة Webhooks

**Frontend**:
- [ ] صفحة Seller Onboarding
- [ ] صفحة Payout Settings
- [ ] صفحة Payout History
- [ ] عرض Balance

**الاختبارات**:
- [ ] Unit Tests للـ Services
- [ ] Integration Tests للـ Payment Flow
- [ ] E2E Tests للـ Seller Journey
- [ ] Webhook Tests

**الملفات الجديدة**:
```
backend/services/payment-service/src/services/stripe-connect.service.ts
frontend/web-app/src/components/seller/StripeOnboarding.tsx
frontend/web-app/src/pages/seller/PayoutSettings.tsx
```

**معايير النجاح**:
- ✅ البائعون يمكنهم إنشاء Connected Accounts
- ✅ المنصة تجمع الرسوم تلقائياً
- ✅ الأموال محفوظة حتى الإفراج
- ✅ المدفوعات للبائعين تعمل
- ✅ Tests: 95%+ coverage

---

### Sprint 1.3: تكامل Escrow Kenya (أسبوعان)

#### المهام
**Backend**:
- [ ] إنشاء Escrow Kenya API Client
- [ ] تنفيذ Create Escrow
- [ ] تنفيذ Fund Escrow
- [ ] تنفيذ Release Escrow
- [ ] تنفيذ Refund Escrow
- [ ] معالجة Webhooks
- [ ] تكامل مع Stripe Connect

**Frontend**:
- [ ] عرض حالة Escrow
- [ ] صفحة تأكيد الاستلام
- [ ] صفحة طلب الاسترداد

**الاختبارات**:
- [ ] Unit Tests للـ Adapter
- [ ] Integration Tests للـ Escrow Flow
- [ ] E2E Tests للـ Complete Payment Journey
- [ ] Webhook Tests

**الملفات الجديدة**:
```
backend/services/escrow-service/src/adapters/escrow-kenya.adapter.ts
backend/services/payment-service/src/services/hybrid-payment.service.ts
```

**معايير النجاح**:
- ✅ يمكن إنشاء Escrow عبر API
- ✅ يمكن تمويل Escrow من Stripe
- ✅ يمكن إطلاق Escrow للبائع
- ✅ يمكن استرداد Escrow للمشتري
- ✅ معالجة Webhooks تعمل
- ✅ Tests: 95%+ coverage

---

### Sprint 1.4: تكامل OpenExchangeRates (أسبوع واحد)

#### المهام
**Backend**:
- [ ] إنشاء Real FX Service
- [ ] تنفيذ Get Rate
- [ ] تنفيذ Convert Amount
- [ ] تنفيذ Caching (5 min TTL)
- [ ] تكامل مع Wallet Service

**Frontend**:
- [ ] عرض أسعار الصرف الحقيقية
- [ ] حاسبة التحويل
- [ ] عرض الرسوم بالعملات المختلفة

**الاختبارات**:
- [ ] Unit Tests للـ FX Service
- [ ] Integration Tests للـ Rate Fetching
- [ ] Cache Tests

**الملفات المعدلة**:
```
backend/services/wallet-service/src/services/forex.service.ts
```

**معايير النجاح**:
- ✅ أسعار الصرف الحقيقية تُجلب
- ✅ التخزين المؤقت يعمل (5 دقائق)
- ✅ التحويل دقيق
- ✅ دعم عملات متعددة
- ✅ Tests: 95%+ coverage

---

### Sprint 1.5: الاختبار النهائي والإطلاق (أسبوع واحد)

#### المهام
**الاختبارات**:
- [ ] Full E2E Testing
- [ ] Performance Testing
- [ ] Security Testing
- [ ] User Acceptance Testing (UAT)
- [ ] Load Testing

**الإطلاق**:
- [ ] إعداد AWS Infrastructure
- [ ] Deploy to Staging
- [ ] Smoke Tests
- [ ] Deploy to Production
- [ ] Monitor Logs
- [ ] إعداد Alerts

**معايير النجاح**:
- ✅ جميع الاختبارات تنجح
- ✅ MVP يعمل على Production
- ✅ لا توجد أخطاء حرجة
- ✅ المستخدمون يمكنهم استخدام المنصة
- ✅ Uptime > 95%

---

## 🎉 نقطة الإطلاق: MVP Live!

**بعد إطلاق MVP، ننتقل إلى نموذج التطوير المستمر**

---

## المرحلة 2: التحسينات الأساسية (4 أسابيع)

### الاستراتيجية
```
تطوير محلي → Commit → Push → GitHub Actions → AWS Deploy تلقائي
```

### Sprint 2.1: تحسين UX/UI (أسبوع واحد)
**المهام**:
- [ ] تحسين التصميم
- [ ] إضافة Loading States
- [ ] تحسين Error Messages
- [ ] إضافة Notifications
- [ ] تحسين Mobile Responsiveness
- [ ] تحسين الأداء (Lazy Loading)

**النشر**:
```bash
git add .
git commit -m "feat: improve UX/UI"
git push origin develop
# GitHub Actions يقوم بالنشر تلقائياً على Staging
```

---

### Sprint 2.2: تحسين الأداء (أسبوع واحد)
**المهام**:
- [ ] Database Indexing
- [ ] Query Optimization
- [ ] Caching (Redis)
- [ ] Image Optimization
- [ ] Code Splitting
- [ ] Bundle Size Optimization

**النشر**:
```bash
git add .
git commit -m "perf: optimize performance"
git push origin develop
# نشر تلقائي على Staging
```

---

### Sprint 2.3: تحسين KYC (أسبوع واحد)
**المهام**:
- [ ] تحسين KYC Form
- [ ] تحسين Document Upload
- [ ] تحسين Verification Status
- [ ] تحسين Admin Review Panel
- [ ] إضافة Email Notifications

**النشر**:
```bash
git add .
git commit -m "feat: improve KYC system"
git push origin develop
# نشر تلقائي
```

---

### Sprint 2.4: تحسين Fraud Detection (أسبوع واحد)
**المهام**:
- [ ] تحسين Rate Limiting
- [ ] تحسين Suspicious Activity Detection
- [ ] إضافة IP Blocking
- [ ] إضافة Admin Alerts
- [ ] تحسين Logging

**النشر**:
```bash
git add .
git commit -m "feat: improve fraud detection"
git push origin main  # نشر على Production
# GitHub Actions ينشر على Production تلقائياً
```

---

## المرحلة 3: الميزات المتقدمة (8 أسابيع)

### Sprint 3.1-3.2: تحسين نظام النزاعات (أسبوعان)
**المهام**:
- [ ] تحسين Dispute Creation
- [ ] تحسين Evidence Upload
- [ ] تحسين Admin Resolution
- [ ] تحسين Refund Logic
- [ ] إضافة Dispute Timeline
- [ ] إضافة Dispute Notifications

**النشر**: تلقائي عبر CI/CD

---

### Sprint 3.3-3.4: تحسين P2P Exchange (أسبوعان)
**المهام**:
- [ ] تحسين Exchange Requests
- [ ] تحسين Matching Engine
- [ ] تحسين Communication System
- [ ] تحسين Settlement
- [ ] إضافة Real-time Updates
- [ ] تحسين Security

**النشر**: تلقائي عبر CI/CD

---

### Sprint 3.5-3.6: تحسين Trust & Safety (أسبوعان)
**المهام**:
- [ ] تحسين Trust Score System
- [ ] تحسين Automated Safeguards
- [ ] تحسين Trust Actions
- [ ] تحسين Appeals System
- [ ] إضافة Trust Dashboard
- [ ] تحسين Analytics

**النشر**: تلقائي عبر CI/CD

---

### Sprint 3.7-3.8: Analytics & Reporting (أسبوعان)
**المهام**:
- [ ] User Analytics
- [ ] Transaction Reports
- [ ] Admin Dashboard
- [ ] Financial Reports
- [ ] Performance Metrics
- [ ] Business Intelligence

**النشر**: تلقائي عبر CI/CD

---

## المرحلة 4: التوسع والنمو (مستمر)

### الميزات المستقبلية
- Mobile App (Flutter) - إكمال التطبيق
- AI Recommendations - نظام التوصيات الذكية
- Geolocation Features - الميزات الجغرافية
- Multi-Currency Support - دعم عملات إضافية
- Advanced Analytics - تحليلات متقدمة
- Marketing Tools - أدوات التسويق

### نموذج التطوير
```
كل ميزة جديدة:
1. تطوير محلي
2. Commit & Push
3. CI/CD ينشر تلقائياً
4. Monitor & Iterate
```

---

## 📋 استراتيجية Git Workflow

### Branches
```
main          → Production (نشر تلقائي)
develop       → Staging (نشر تلقائي)
feature/*     → Feature branches
hotfix/*      → Hotfix branches
```

### Workflow
```bash
# تطوير ميزة جديدة
git checkout -b feature/new-feature develop
# ... تطوير ...
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create Pull Request to develop
# بعد المراجعة والموافقة
git checkout develop
git merge feature/new-feature
git push origin develop
# ← نشر تلقائي على Staging

# بعد الاختبار على Staging
git checkout main
git merge develop
git push origin main
# ← نشر تلقائي على Production
```

---

## 📊 معايير النجاح

### MVP (المرحلة 1)
- [ ] 100+ مستخدم مسجل
- [ ] 50+ إعلان منشور
- [ ] 10+ مزاد مكتمل
- [ ] 5+ معاملة دفع ناجحة
- [ ] Uptime > 95%

### بعد 3 أشهر (المرحلة 2-3)
- [ ] 1000+ مستخدم
- [ ] 500+ إعلان
- [ ] 100+ مزاد
- [ ] 50+ معاملة
- [ ] Uptime > 99%

### بعد 6 أشهر (المرحلة 4)
- [ ] 10,000+ مستخدم
- [ ] 5,000+ إعلان
- [ ] 1,000+ مزاد
- [ ] 500+ معاملة
- [ ] Uptime > 99.9%

---

## 💰 التكلفة المتوقعة

### One-Time Costs (المرحلة 1)
| البند | التكلفة | ملاحظات |
|------|---------|---------|
| Stripe Connect Setup | $0 | مجاني |
| Escrow Kenya Partner Account | $0 | لديك حساب بالفعل |
| OpenExchangeRates API | $97 | سنوي |
| Development (4-6 weeks) | $20K-$40K | 2 مطورين |
| Testing & QA (1 week) | $5K-$10K | مهندس QA |
| **المجموع** | **$25K-$50K** | |

### Ongoing Costs (شهرياً)
| البند | التكلفة | ملاحظات |
|------|---------|---------|
| Stripe Connect Fees | 2.9% + $0.30 | لكل معاملة |
| Escrow Kenya Fees | 1.5-2% | لكل معاملة escrow |
| OpenExchangeRates | $8/month | أو $97/سنة |
| AWS Infrastructure | $75-$150 | حسب الاستخدام |
| **المجموع** | **~4-5%** | لكل معاملة + $75-$150 |

---

## 🎯 الخطوات التالية الفورية

### هذا الأسبوع (الأسبوع 1)
1. [ ] مراجعة هذه الخطة مع الفريق
2. [ ] البدء في Sprint 0.1 (إعداد البيئة)
3. [ ] إعداد GitHub Repository
4. [ ] إعداد AWS Account
5. [ ] الحصول على API Keys (Stripe, Escrow Kenya, OpenExchangeRates)

### الأسبوع القادم (الأسبوع 2)
1. [ ] إكمال Sprint 0.2 (CI/CD)
2. [ ] البدء في Sprint 1.1 (مراجعة الموجود)
3. [ ] تشغيل جميع الاختبارات
4. [ ] إصلاح أي مشاكل

### الأسبوع 3-4
1. [ ] البدء في Sprint 1.2 (Stripe Connect)
2. [ ] تنفيذ Seller Onboarding
3. [ ] تنفيذ Payment Flow

### الأسبوع 5-6
1. [ ] البدء في Sprint 1.3 (Escrow Kenya)
2. [ ] تنفيذ Escrow Integration
3. [ ] تنفيذ Hybrid Payment Service

---

## 📝 ملاحظات مهمة

### قبل MVP
- ✅ التطوير محلي فقط
- ✅ الاختبار الشامل
- ✅ لا نشر حتى يكون MVP جاهز
- ✅ التركيز على الميزات الأساسية فقط

### بعد MVP
- ✅ CI/CD تلقائي
- ✅ كل commit ينشر تلقائياً
- ✅ Staging أولاً، ثم Production
- ✅ Monitoring مستمر
- ✅ تطوير تدريجي للميزات المتقدمة

### الأولويات
1. **الأولوية القصوى**: إطلاق MVP (المرحلة 1)
2. **الأولوية العالية**: التحسينات الأساسية (المرحلة 2)
3. **الأولوية المتوسطة**: الميزات المتقدمة (المرحلة 3)
4. **الأولوية المنخفضة**: التوسع والنمو (المرحلة 4)

---

## 🔄 نموذج التطوير المستمر

### بعد إطلاق MVP
```
1. تطوير ميزة جديدة محلياً
2. كتابة الاختبارات
3. Commit & Push to develop
4. GitHub Actions يختبر تلقائياً
5. إذا نجحت الاختبارات → نشر على Staging
6. اختبار على Staging
7. Merge to main
8. نشر تلقائي على Production
9. مراقبة الأداء
10. تكرار العملية
```

---

**الخلاصة**: خطة واضحة ومنظمة للوصول إلى MVP في 4-6 أسابيع، ثم التطوير المستمر مع CI/CD تلقائي.

**الحالة**: ✅ جاهز للبدء  
**التاريخ**: 1 فبراير 2026  
**الخطوة التالية**: البدء في Sprint 0.1 (إعداد البيئة المحلية)
