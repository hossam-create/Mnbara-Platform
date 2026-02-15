# دليل رفع مشروع Mnbara على GitHub

# GitHub Upload Guide for Mnbara Platform

## 🚨 المشكلة - The Problem

المشروع حجمه أكبر من **1 GB** بسبب:

- **128 مجلد node_modules** (كل خدمة لها مجلدها)
- ملفات البناء (build, dist, .next)
- ملفات مؤقتة وcache
- قواعد بيانات محلية

**حدود GitHub**:

- ❌ حجم الملف الواحد: 100 MB maximum
- ⚠️ حجم المستودع الموصى به: < 1 GB
- 🛑 الحد الأقصى: 5 GB

---

## ✅ الحل - The Solution

رفع **الكود المصدري فقط** بدون:

- ❌ node_modules
- ❌ Build files
- ❌ Cache files
- ❌ Database files
- ❌ IDE configs

---

## 📋 خطوات الرفع - Upload Steps

### الخطوة 1: التأكد من .gitignore ✅

تم تحديث `.gitignore` ليشمل جميع الملفات غير الضرورية.

### الخطوة 2: حذف الملفات الثقيلة (اختياري)

إذا كانت موجودة في git history:

```bash
# حذف node_modules من التاريخ (إذا تم رفعها سابقاً)
git rm -r --cached node_modules
git rm -r --cached '**/node_modules'

# حذف ملفات البناء
git rm -r --cached dist build .next out
git rm -r --cached '**/dist' '**/build' '**/.next'

# Commit التغييرات
git add .gitignore
git commit -m "Remove large files and update .gitignore"
```

### الخطوة 3: إنشاء Repository على GitHub

1. اذهب إلى https://github.com
2. اضغط **"New Repository"** أو **"+"** → **"New repository"**
3. املأ البيانات:
   - **Repository name**: `mnbara-platform`
   - **Description**: `Crowdshipping marketplace platform - منصة منبرة للتوصيل الجماعي`
   - **Visibility**: 🔒 **Private** (موصى به للمشاريع التجارية)
   - ❌ لا تضع علامة على "Add README" (عندك README موجود)
4. اضغط **"Create repository"**

### الخطوة 4: ربط المشروع بـ GitHub

```bash
# تأكد أنك في مجلد المشروع
cd "e:\New computer\Development & Coding\Projects\المستودعات الحالية (Current Repos)\geo\mnbara-platform"

# تهيئة Git (إذا لم يكن موجود)
git init

# إضافة جميع الملفات (سيتجاهل ما في .gitignore تلقائياً)
git add .

# Commit أول
git commit -m "Initial commit - Mnbara Platform with 8 microservices"

# ربط بـ GitHub (استبدل YOUR_USERNAME باسم المستخدم)
git remote add origin https://github.com/YOUR_USERNAME/mnbara-platform.git

# رفع الكود
git branch -M main
git push -u origin main
```

### الخطوة 5: التحقق من الحجم

قبل الرفع، تحقق من الحجم:

```bash
# حساب حجم المشروع بدون node_modules
Get-ChildItem -Recurse -File -Exclude 'node_modules' |
  Measure-Object -Property Length -Sum |
  Select-Object @{Name="SizeGB";Expression={[math]::Round($_.Sum/1GB,2)}}
```

**الحجم المتوقع بعد التنظيف**: حوالي **50-150 MB** ✅

---

## 🔐 ملفات حساسة - Sensitive Files

**⚠️ تحذير مهم**: لا ترفع أبداً:

- ❌ `.env` files (تحتوي معلومات حساسة)
- ❌ API keys او Secrets
- ❌ Database credentials
- ❌ SSL certificates
- ❌ JWT secrets

**تأكد أن `.gitignore` يستثني**:

```
.env
.env.*
*.pem
*.key
secrets/
```

---

## 📦 ما الذي سيتم رفعه؟

### ✅ الملفات التي سترفع:

```
mnbara-platform/
├── services/                    # الخدمات (8 microservices)
│   ├── auth-service/
│   │   ├── src/                # كود TypeScript
│   │   ├── prisma/             # Database schema
│   │   ├── package.json        # Dependencies list
│   │   ├── tsconfig.json       # TypeScript config
│   │   └── Dockerfile          # Container config
│   ├── listing-service/
│   ├── auction-service/
│   ├── payment-service/
│   ├── crowdship-service/
│   ├── notification-service/
│   ├── recommendation-service/
│   └── rewards-service/
├── mobile/mnbara-app/          # React Native app
│   ├── src/                    # Source code
│   ├── App.tsx
│   └── package.json
├── web/                        # Next.js web app
│   ├── src/
│   ├── public/
│   └── package.json
├── infrastructure/             # AWS Terraform configs
│   ├── terraform/
│   └── kubernetes/
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Local development
├── render.yaml                 # Render deployment
├── README.md                   # Documentation
├── RENDER_DEPLOYMENT.md        # Deployment guide
├── AWS_DEPLOYMENT.md           # AWS guide
└── .gitignore                  # Exclusion rules
```

**الحجم التقديري**: 80-120 MB ✅

---

## 🚀 بعد الرفع - After Upload

### 1. إعداد Secrets على GitHub

اذهب إلى **Settings** → **Secrets and variables** → **Actions** وأضف:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_...
```

### 2. تفعيل GitHub Actions (CI/CD)

سيبدأ تلقائياً بناء المشروع عند كل push.

### 3. النشر على Render.com

1. اذهب إلى https://dashboard.render.com
2. **New +** → **Blueprint**
3. اختر المستودع `mnbara-platform`
4. سيكتشف `render.yaml` تلقائياً
5. اضغط **Apply**

---

## 🛠️ الأوامر المفيدة

### فحص حجم المشروع:

```bash
# Windows PowerShell
Get-ChildItem -Recurse -File |
  Measure-Object -Property Length -Sum |
  Select-Object @{Name="TotalGB";Expression={($_.Sum/1GB).ToString("F2")}}
```

### فحص الملفات الكبيرة (> 50MB):

```bash
Get-ChildItem -Recurse -File |
  Where-Object {$_.Length -gt 50MB} |
  Select-Object FullName, @{Name="SizeMB";Expression={($_.Length/1MB).ToString("F2")}} |
  Format-Table -AutoSize
```

### حذف جميع node_modules:

```bash
# ⚠️ احذر: هذا سيحذف كل node_modules
Get-ChildItem -Path . -Include "node_modules" -Recurse -Directory | Remove-Item -Recurse -Force
```

### إعادة تثبيت Dependencies:

```bash
# في المجلد الرئيسي
npm install

# لكل خدمة
cd services/auth-service && npm install
cd services/listing-service && npm install
# ... الخ
```

---

## ❓ حل المشاكل - Troubleshooting

### المشكلة 1: "file is over 100 MB"

```bash
# ابحث عن الملف الكبير
git rev-list --objects --all |
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' |
  sort -k3 -n -r | head

# احذفه من التاريخ
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/large/file" \
  --prune-empty --tag-name-filter cat -- --all
```

### المشكلة 2: "repository is too large"

✅ **الحل**: تأكد من `.gitignore` والتزم بالملفات المصدرية فقط

### المشكلة 3: "push rejected"

```bash
# إذا كان المستودع موجود على GitHub
git pull origin main --rebase
git push origin main
```

---

## 📊 المقارنة

| البند            | قبل التنظيف | بعد التنظيف            |
| ---------------- | ----------- | ---------------------- |
| **الحجم الكلي**  | > 1 GB ❌   | ~100 MB ✅             |
| **node_modules** | 128 مجلد    | 0 (يتم تثبيتها محلياً) |
| **Build files**  | موجودة      | محذوفة                 |
| **وقت الرفع**    | ساعات       | 2-5 دقائق              |
| **سرعة Clone**   | بطيئة       | سريعة                  |

---

## ✅ Checklist قبل الرفع

- [ ] تحديث `.gitignore`
- [ ] حذف ملفات `.env` من المشروع
- [ ] التأكد من عدم وجود ملفات > 100MB
- [ ] إنشاء Repository على GitHub (Private)
- [ ] تجهيز Commit message واضح
- [ ] التأكد من README.md محدث
- [ ] Push إلى GitHub
- [ ] التحقق من GitHub Actions
- [ ] إعداد Secrets على GitHub
- [ ] النشر على Render.com

---

## 🎯 النتيجة المتوقعة

بعد اتباع هذه الخطوات:

✅ مستودع نظيف وخفيف
✅ سريع في الـ clone والـ pull
✅ جاهز للعمل الجماعي
✅ CI/CD يعمل تلقائياً
✅ جاهز للنشر على Render/AWS

---

**آخر تحديث**: 2025-11-26
**الإصدار**: 1.0.0

---

## 💡 نصائح إضافية

1. **استخدم GitHub Desktop** إذا كنت تفضل واجهة رسومية
2. **قسّم الـ commits** بشكل منطقي (مثلاً commit لكل feature)
3. **اكتب commit messages واضحة** بالعربي أو الإنجليزي
4. **استخدم Branches** للـ features الجديدة
5. **اعمل Pull Requests** للمراجعة قبل الدمج

**Happy Coding! 🚀**
