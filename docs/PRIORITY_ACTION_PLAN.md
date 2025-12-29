# 🎯 خطة العمل بالأولويات - MNBara

**التاريخ:** 28 ديسمبر 2025

---

## 🔴 الأولوية 1 - الأمان (أسبوع واحد)

### المشكلة:
- Issue مفتوح: "Security sweep — remove secrets"
- أسرار قد تكون مكشوفة في Git history
- مفاتيح API وكلمات مرور في الملفات

### الحل الفوري:

#### الخطوة 1: تثبيت الأدوات
```bash
# تثبيت Gitleaks
npm install -g gitleaks

# تثبيت git-filter-repo
pip install git-filter-repo
```

#### الخطوة 2: فحص السجل
```bash
# فحص شامل
gitleaks detect --source . --verbose --report-path gitleaks-report.json

# عرض النتائج
cat gitleaks-report.json
```

#### الخطوة 3: تنظيف Git History
```bash
# إزالة ملفات .env من السجل
git filter-repo --invert-paths --path .env

# إزالة ملفات أخرى حساسة
git filter-repo --invert-paths --path '*.key'
git filter-repo --invert-paths --path 'secrets/'
git filter-repo --invert-paths --path '.env*'
```

#### الخطوة 4: تحديث .gitignore
```bash
cat >> .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.*.local
.env.production

# Secrets
*.key
*.pem
secrets/
vault/

# API Keys
.api_keys
credentials.json

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# Node modules
node_modules/

# Build
dist/
build/
EOF

git add .gitignore
git commit -m "chore: update .gitignore with sensitive files"
```

#### الخطوة 5: إعادة تعيين المفاتيح
```bash
# إذا كانت هناك مفاتيح مكشوفة:
# 1. غيّر جميع API keys في الخدمات
# 2. أعد تعيين database passwords
# 3. أعد تعيين JWT secrets
# 4. أعد تعيين encryption keys
```

#### الخطوة 6: تفعيل في CI/CD
```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_ENABLE_COMMENTS: true
```

### المسؤول: فريق الأمان  
### الوقت: 3-5 أيام  
### الجهد: صغير (S)

---

## 🔴 الأولوية 2 - الامتثال المالي (أسابيع)

### المشكلة:
- لا يمكن تفعيل مدفوعات بدون ترخيص
- KYC/AML غير مطبق
- PCI-DSS متطلب لكن غير مُثبت

### الحل:

#### المرحلة 1: اختيار PSP (أسبوع)
```
الخيارات:
1. Stripe (عالمي، موثوق)
   - رسوم: 2.9% + $0.30
   - دعم: ممتاز
   - KYC: مدمج

2. Adyen (عالمي، قوي)
   - رسوم: 1.5-2.5%
   - دعم: ممتاز
   - KYC: مدمج

3. محلي (إذا متاح)
   - رسوم: أقل
   - دعم: محدود
   - KYC: يدوي

التوصية: Stripe (الأسهل للبدء)
```

#### المرحلة 2: التكامل (أسبوعان)
```bash
# 1. إنشاء حساب Stripe
# 2. الحصول على API keys
# 3. تثبيت SDK

npm install stripe

# 4. تطبيق Tokenization
# 5. إزالة تخزين بيانات البطاقات
# 6. تفعيل Webhooks
```

#### المرحلة 3: KYC/AML (أسبوعان)
```
الخطوات:
1. اختيار مزود KYC
   - Stripe Identity
   - Jumio
   - IDology

2. تطبيق التحقق
   - التحقق من الهوية
   - التحقق من العنوان
   - التحقق من الحساب البنكي

3. إدارة المخاطر
   - قائمة سوداء
   - قائمة رمادية
   - مراقبة مستمرة
```

#### المرحلة 4: PCI-DSS (شهر)
```
الخطوات:
1. تقييم الامتثال
2. تطبيق الضوابط
3. الاختبار والتدقيق
4. الحصول على الشهادة
```

### المسؤول: فريق المالية + الأمان  
### الوقت: 4-8 أسابيع  
### الجهد: كبير (L)

---

## 🟡 الأولوية 3 - MVP Marketplace (4-6 أسابيع)

### المشكلة:
- لا توجد منصة عملية للبيع والشراء
- تجربة المستخدم غير واضحة

### الحل:

#### الأسبوع 1-2: Marketplace أساسي
```
المميزات:
- عرض المنتجات
- البحث والتصفية
- سلة التسوق
- Checkout بسيط

الملفات:
- frontend/web-app/src/pages/ProductPage.tsx
- frontend/web-app/src/pages/SearchPage.tsx
- frontend/web-app/src/pages/CartPage.tsx
- frontend/web-app/src/pages/CheckoutPage.tsx
```

#### الأسبوع 2-3: لوحة البائع
```
المميزات:
- إدراج سريع (3 خطوات)
- إدارة مخزون
- عرض الطلبات
- إحصائيات بسيطة

الملفات:
- frontend/web-app/src/pages/seller/CreateListing.tsx
- frontend/web-app/src/pages/seller/MyListings.tsx
- frontend/web-app/src/pages/seller/SellerDashboard.tsx
```

#### الأسبوع 3-4: تكامل الدفع
```
المميزات:
- Stripe integration
- Tokenization
- Webhooks
- Refunds

الملفات:
- backend/services/payment-service/
- frontend/web-app/src/pages/CheckoutPage.tsx
```

#### الأسبوع 4-5: Escrow بسيط
```
المميزات:
- حماية المشتري
- حماية البائع
- Refunds
- Disputes

الملفات:
- backend/services/escrow-service/
```

#### الأسبوع 5-6: الاختبارات والتحسينات
```
المميزات:
- Bug fixes
- Performance tuning
- UX improvements
- Documentation
```

### المسؤول: فريق التطوير  
### الوقت: 4-6 أسابيع  
### الجهد: متوسط-كبير (M-L)

---

## 🟡 الأولوية 4 - PoC Crowdshipping (4-6 أسابيع)

### المشكلة:
- ميزة فريدة لكن بدون تطبيق عملي

### الحل:

#### الأسبوع 1: التصميم
```
المكونات:
1. Matching Algorithm
   - تطابق المسافرين مع الطلبات
   - حساب المسافة والوقت
   - تقييم الأمان

2. Safety Policies
   - التحقق من الهوية
   - التأمين
   - سياسات الحد الأدنى

3. Compensation Model
   - رسوم للمسافر
   - رسوم للمشتري
   - حوافز

الملفات:
- docs/CROWDSHIPPING_DESIGN.md
- backend/services/settlement-service/
```

#### الأسبوع 2-3: التطبيق
```
المكونات:
1. Matching Service
   - خوارزمية المطابقة
   - إدارة الطلبات
   - إدارة المسافرين

2. Real-time Tracking
   - WebSocket للتحديثات
   - خريطة حية
   - إشعارات

3. Payment Integration
   - دفع للمسافر
   - استرجاع للمشتري
   - تسويات

الملفات:
- backend/services/settlement-service/
- mobile/flutter_app/lib/features/traveler/
- mobile/flutter_app/lib/features/buyer/
```

#### الأسبوع 3-4: الاختبار
```
المكونات:
1. تجربة محدودة
   - مدينة واحدة
   - 100 طلب
   - 50 مسافر

2. جمع Feedback
   - استطلاعات
   - مقابلات
   - تحليل البيانات

3. تحسينات
   - تحسين الخوارزمية
   - تحسين UX
   - تحسين الأمان
```

#### الأسبوع 4-5: التوسع
```
المكونات:
1. مدن إضافية
2. شراكات محلية
3. تحسين الخوارزمية
4. تحسين الأداء
```

#### الأسبوع 5-6: التحسينات
```
المكونات:
1. UX improvements
2. Performance tuning
3. Analytics
4. Documentation
```

### المسؤول: فريق الابتكار  
### الوقت: 4-6 أسابيع  
### الجهد: متوسط-كبير (M-L)

---

## 🟢 الأولوية 5 - الموثوقية والتوسع (6-8 أسابيع)

### المشكلة:
- بدون إثبات عملي للاستقرار والأداء

### الحل:

#### الأسبوع 1-2: اختبارات الحمل
```
الأدوات:
- k6 (load testing)
- JMeter (alternative)

الأهداف:
- 10,000 concurrent users
- P99 latency < 500ms
- 99.9% uptime

الملفات:
- test/load/
- test/stress/
- test/chaos/
```

#### الأسبوع 2-3: المراقبة
```
الأدوات:
- Prometheus (metrics)
- Grafana (dashboards)
- Jaeger (tracing)

الأهداف:
- SLO: 99.9% uptime
- SLI: P99 < 500ms
- Error rate < 0.1%

الملفات:
- k8s/prometheus-config.yaml
- k8s/grafana-config.yaml
```

#### الأسبوع 3-4: الامتثال المالي
```
المكونات:
1. KYC/AML
2. PCI-DSS
3. Compliance audit
4. Documentation

الملفات:
- backend/services/compliance-service/
- docs/COMPLIANCE_GUIDE.md
```

#### الأسبوع 4-5: سياسات النزاعات
```
المكونات:
1. Dispute resolution
2. Refund policies
3. Chargeback handling
4. Documentation

الملفات:
- backend/services/escrow-service/
- docs/DISPUTE_POLICY.md
```

#### الأسبوع 5-6: تحسين البحث
```
المكونات:
1. Elasticsearch tuning
2. A/B testing
3. Relevancy improvements
4. Analytics

الملفات:
- backend/services/listing-service-node/
- test/integration/search.test.ts
```

#### الأسبوع 6-7: تحسين التوصيات
```
المكونات:
1. ML model improvements
2. Personalization
3. Real-time recommendations
4. Analytics

الملفات:
- backend/services/ai-recommendations-v2/
- backend/services/ai-assistant-service/
```

#### الأسبوع 7-8: التحسينات العامة
```
المكونات:
1. Performance tuning
2. UX improvements
3. Documentation
4. Training
```

### المسؤول: فريق العمليات  
### الوقت: 6-8 أسابيع  
### الجهد: كبير (L)

---

## 📊 جدول زمني موحد

```
الأسبوع 1-2:
├─ الأمان (Security sweep) ✅
└─ CI/CD setup

الأسبوع 3-6:
├─ MVP Marketplace
├─ اختيار PSP
└─ بدء KYC/AML

الأسبوع 7-10:
├─ PoC Crowdshipping
├─ تكامل الدفع
└─ اختبارات الحمل

الأسبوع 11-14:
├─ توسع Crowdshipping
├─ الامتثال المالي
└─ تحسين البحث

الأسبوع 15-18:
├─ تحسين التوصيات
├─ سياسات النزاعات
└─ التحضير للإطلاق

الأسبوع 19+:
└─ الإطلاق والتوسع
```

---

## 🎯 مقاييس النجاح

### المرحلة 1 (الأمان):
- ✅ لا توجد أسرار في Git
- ✅ CI/CD يفحص الأسرار
- ✅ Issue الأمني مغلق

### المرحلة 2 (MVP):
- ✅ 50+ sellers
- ✅ 1,000+ products
- ✅ 100+ orders/month
- ✅ 2%+ conversion rate

### المرحلة 3 (Crowdshipping):
- ✅ 100+ crowdshipping orders/month
- ✅ 95%+ success rate
- ✅ 4.5+/5 satisfaction

### المرحلة 4 (الموثوقية):
- ✅ 99.9% uptime
- ✅ P99 < 500ms
- ✅ <0.1% error rate

---

## 📞 الملاحظات الختامية

**الأولويات الحقيقية:**
1. 🔴 الأمان (أسبوع)
2. 🔴 الامتثال (أسابيع)
3. 🟡 MVP (4-6 أسابيع)
4. 🟡 Crowdshipping (4-6 أسابيع)
5. 🟢 الموثوقية (6-8 أسابيع)

**الإطار الزمني الكلي:** 4-5 أشهر للإطلاق

**الفريق المطلوب:**
- 2-3 مهندسي أمان
- 3-4 مهندسي backend
- 2-3 مهندسي frontend
- 1-2 مهندسي DevOps
- 1 مدير منتج
- 1 مدير عمليات

**الميزانية المقترحة:**
- الأمان: $10K
- الامتثال: $50K
- التطوير: $100K
- الاختبار: $20K
- الإطلاق: $20K
- **الإجمالي:** ~$200K

---

**آخر تحديث:** 28 ديسمبر 2025
