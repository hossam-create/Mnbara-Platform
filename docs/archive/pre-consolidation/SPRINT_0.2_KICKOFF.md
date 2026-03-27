# Sprint 0.2 - CI/CD Pipeline Setup

**التاريخ**: 2 فبراير 2026  
**الحالة**: 🚀 بدء التنفيذ  
**المدة المتوقعة**: 2-3 أيام

---

## 🎯 الهدف

إعداد CI/CD Pipeline كامل للنشر التلقائي من GitHub إلى AWS:
- **Push to main** → Auto-deploy to AWS
- **Automated testing** قبل النشر
- **Zero-downtime deployment**
- **Rollback capability**

---

## 📋 المهام الرئيسية

### Phase 1: GitHub Actions Setup (يوم 1)
- [ ] إنشاء GitHub Actions workflow
- [ ] إعداد secrets في GitHub
- [ ] إعداد automated testing
- [ ] إعداد build pipeline

### Phase 2: AWS Infrastructure (يوم 1-2)
- [ ] إعداد EC2 instances
- [ ] إعداد RDS (PostgreSQL)
- [ ] إعداد ElastiCache (Redis)
- [ ] إعداد S3 buckets
- [ ] إعداد Load Balancer
- [ ] إعداد Security Groups

### Phase 3: Deployment Scripts (يوم 2)
- [ ] إنشاء deployment scripts
- [ ] إعداد environment variables
- [ ] إعداد database migrations
- [ ] إعداد health checks

### Phase 4: Testing & Validation (يوم 2-3)
- [ ] اختبار deployment pipeline
- [ ] اختبار rollback
- [ ] اختبار zero-downtime
- [ ] توثيق العملية

---

## 🏗️ البنية المعمارية

### AWS Infrastructure

```
┌─────────────────────────────────────────────┐
│           Application Load Balancer          │
│              (Port 80/443)                   │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌─────▼───────┐
│   EC2 #1    │ │   EC2 #2    │
│  (Backend)  │ │  (Backend)  │
└──────┬──────┘ └─────┬───────┘
       │              │
       └──────┬───────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐      ┌──────▼──────┐
│  RDS   │      │ ElastiCache │
│ (PG)   │      │   (Redis)   │
└────────┘      └─────────────┘
```

### CI/CD Pipeline

```
GitHub Push → GitHub Actions → Build → Test → Deploy → Health Check
                                                  ↓
                                            AWS EC2 Instances
```

---

## 📝 الخطوات التفصيلية

### Step 1: إنشاء GitHub Actions Workflow

**الملف**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          chmod +x ./scripts/deploy-aws.sh
          ./scripts/deploy-aws.sh
```

### Step 2: إعداد AWS Infrastructure

**الخيار 1: Manual Setup (أسرع)**
- إنشاء EC2 instances يدوياً
- إعداد RDS و ElastiCache
- تكوين Security Groups

**الخيار 2: Terraform (موصى به)**
- Infrastructure as Code
- سهل التكرار والصيانة
- Version control للبنية التحتية

### Step 3: إنشاء Deployment Script

**الملف**: `scripts/deploy-aws.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment to AWS..."

# 1. Build Docker images
echo "📦 Building Docker images..."
docker-compose build

# 2. Push to ECR
echo "📤 Pushing to AWS ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker-compose push

# 3. Update ECS services
echo "🔄 Updating ECS services..."
aws ecs update-service --cluster mnbara-cluster --service backend --force-new-deployment

# 4. Wait for deployment
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable --cluster mnbara-cluster --services backend

# 5. Run health checks
echo "🏥 Running health checks..."
./scripts/health-check.sh

echo "✅ Deployment completed successfully!"
```

---

## 🔐 GitHub Secrets المطلوبة

يجب إضافة هذه Secrets في GitHub Repository Settings:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ECR_REGISTRY
DATABASE_URL
REDIS_URL
JWT_SECRET
STRIPE_SECRET_KEY
```

---

## 💰 التكلفة المتوقعة (AWS)

### Development Environment
- **EC2 (t3.small x2)**: ~$30/month
- **RDS (db.t3.micro)**: ~$15/month
- **ElastiCache (cache.t3.micro)**: ~$12/month
- **Load Balancer**: ~$20/month
- **S3 Storage**: ~$5/month
- **Data Transfer**: ~$10/month
- **Total**: ~$92/month

### Production Environment (بعد الإطلاق)
- **EC2 (t3.medium x3)**: ~$100/month
- **RDS (db.t3.small)**: ~$30/month
- **ElastiCache (cache.t3.small)**: ~$25/month
- **Load Balancer**: ~$20/month
- **S3 + CloudFront**: ~$20/month
- **Data Transfer**: ~$50/month
- **Total**: ~$245/month

---

## 📊 الجدول الزمني

| اليوم | المهام | الوقت |
|------|--------|-------|
| 1 | GitHub Actions + AWS Setup | 6-8 ساعات |
| 2 | Deployment Scripts + Testing | 6-8 ساعات |
| 3 | Validation + Documentation | 4-6 ساعات |

**المجموع**: 16-22 ساعة عمل (2-3 أيام)

---

## ✅ معايير النجاح

- [ ] Push to main ينشر تلقائياً
- [ ] Tests تعمل قبل النشر
- [ ] Zero-downtime deployment
- [ ] Health checks تعمل
- [ ] Rollback يعمل
- [ ] Documentation كاملة

---

## 🚀 البدء الآن

**الخطوة الأولى**: إنشاء GitHub Actions workflow

```powershell
# إنشاء المجلد
mkdir -p .github/workflows

# إنشاء الملف
# سنقوم بإنشاء deploy.yml
```

---

**الحالة**: 🚀 جاهز للبدء  
**الخطوة التالية**: إنشاء `.github/workflows/deploy.yml`

---

**آخر تحديث**: 2 فبراير 2026 - 00:35
