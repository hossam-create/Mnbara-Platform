# ًںڑ€ ط¯ظ„ظٹظ„ ط§ظ„ظ†ط´ط± ظˆط§ظ„طھط­ط¯ظٹط«ط§طھ - Deployment & Update Guide

**ط¢ط®ط± طھط­ط¯ظٹط«:** 25 ط¯ظٹط³ظ…ط¨ط± 2025

---

## ًں“‹ ط¬ط¯ظˆظ„ ط§ظ„ظ…ط­طھظˆظٹط§طھ

1. [ط§ظ„ظ†ط´ط± ط§ظ„ط£ظˆظ„ (Initial Deployment)](#ط§ظ„ظ†ط´ط±-ط§ظ„ط£ظˆظ„)
2. [ط¹ظ…ظ„ظٹط© ط§ظ„طھط­ط¯ظٹط« (Update Process)](#ط¹ظ…ظ„ظٹط©-ط§ظ„طھط­ط¯ظٹط«)
3. [ط£ظ†ظˆط§ط¹ ط§ظ„طھط­ط¯ظٹط«ط§طھ](#ط£ظ†ظˆط§ط¹-ط§ظ„طھط­ط¯ظٹط«ط§طھ)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Rollback Strategy](#rollback-strategy)
6. [Best Practices](#best-practices)

---

## ًںژ¯ ط§ظ„ظ†ط´ط± ط§ظ„ط£ظˆظ„

### ط§ظ„ط®ط·ظˆط§طھ:
```bash
# 1. Build all services
npm run build:all

# 2. Run tests
npm run test:all

# 3. Build Docker images
docker-compose -f docker-compose.prod.yml build

# 4. Push to registry
docker-compose -f docker-compose.prod.yml push

# 5. Deploy to Kubernetes
kubectl apply -f k8s/

# 6. Verify deployment
kubectl get pods -n mnbarh
```

---

## ًں”„ ط¹ظ…ظ„ظٹط© ط§ظ„طھط­ط¯ظٹط«

### ط§ظ„ط®ط·ظˆط© 1: ط¥ظ†ط´ط§ط، Branch ط¬ط¯ظٹط¯
```bash
# ظ…ظ† main branch
git checkout main
git pull origin main

# ط¥ظ†ط´ط§ط، branch ظ„ظ„طھط­ط¯ظٹط«
git checkout -b feature/new-feature-name
# ط£ظˆ
git checkout -b hotfix/bug-fix-name
# ط£ظˆ
git checkout -b release/v3.3.0
```

### ط§ظ„ط®ط·ظˆط© 2: ط¹ظ…ظ„ ط§ظ„طھط؛ظٹظٹط±ط§طھ
```bash
# ط¹ط¯ظ„ ط§ظ„ظƒظˆط¯ ط§ظ„ظ…ط·ظ„ظˆط¨
# ...

# طھط£ظƒط¯ ظ…ظ† ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ
npm run test

# طھط£ظƒط¯ ظ…ظ† ط¹ط¯ظ… ظˆط¬ظˆط¯ ط£ط®ط·ط§ط،
npm run lint
npm run type-check
```

### ط§ظ„ط®ط·ظˆط© 3: Commit ظˆ Push
```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature-name
```

### ط§ظ„ط®ط·ظˆط© 4: ط¥ظ†ط´ط§ط، Pull Request
- ط§ظپطھط­ GitHub/GitLab
- ط£ظ†ط´ط¦ Pull Request ظ…ظ† branch ط§ظ„ط¬ط¯ظٹط¯ ط¥ظ„ظ‰ main
- ط§ط·ظ„ط¨ Code Review ظ…ظ† ط§ظ„ظپط±ظٹظ‚
- ط§ظ†طھط¸ط± ظ…ظˆط§ظپظ‚ط© CI/CD Pipeline

### ط§ظ„ط®ط·ظˆط© 5: Merge ظˆ Deploy
```bash
# ط¨ط¹ط¯ ط§ظ„ظ…ظˆط§ظپظ‚ط©طŒ ظٹطھظ… ط§ظ„ظ€ merge طھظ„ظ‚ط§ط¦ظٹط§ظ‹
# CI/CD Pipeline ظٹط¹ظ…ظ„:
# 1. Build
# 2. Test
# 3. Deploy to Staging
# 4. Deploy to Production (ط¨ط¹ط¯ ط§ظ„ظ…ظˆط§ظپظ‚ط©)
```

---

## ًں“¦ ط£ظ†ظˆط§ط¹ ط§ظ„طھط­ط¯ظٹط«ط§طھ

### 1ï¸ڈâƒ£ طھط­ط¯ظٹط« طµط؛ظٹط± (Patch) - v3.2.0 â†’ v3.2.1
**ظ…طھظ‰طں** ط¥طµظ„ط§ط­ bugs ط¨ط³ظٹط·ط©
```bash
git checkout -b hotfix/fix-login-bug
# ط¹ط¯ظ„ ط§ظ„ظƒظˆط¯
git commit -m "fix: resolve login timeout issue"
```

### 2ï¸ڈâƒ£ طھط­ط¯ظٹط« ظ…طھظˆط³ط· (Minor) - v3.2.0 â†’ v3.3.0
**ظ…طھظ‰طں** ط¥ط¶ط§ظپط© ظ…ظٹط²ط§طھ ط¬ط¯ظٹط¯ط© ط¨ط¯ظˆظ† ظƒط³ط± ط§ظ„طھظˆط§ظپظ‚ظٹط©
```bash
git checkout -b feature/add-dark-mode
# ط£ط¶ظپ ط§ظ„ظ…ظٹط²ط©
git commit -m "feat: add dark mode support"
```

### 3ï¸ڈâƒ£ طھط­ط¯ظٹط« ظƒط¨ظٹط± (Major) - v3.0.0 â†’ v4.0.0
**ظ…طھظ‰طں** طھط؛ظٹظٹط±ط§طھ ظƒط¨ظٹط±ط© ظ‚ط¯ طھظƒط³ط± ط§ظ„طھظˆط§ظپظ‚ظٹط©
```bash
git checkout -b release/v4.0.0
# طھط؛ظٹظٹط±ط§طھ ظƒط¨ظٹط±ط©
git commit -m "feat!: redesign payment system"
```

---

## ًں”§ طھط­ط¯ظٹط« ظƒظ„ ظ…ظƒظˆظ†

### طھط­ط¯ظٹط« Backend Service
```bash
# 1. ط¹ط¯ظ„ ط§ظ„ظƒظˆط¯ ظپظٹ backend/services/[service-name]/
cd backend/services/auth-service

# 2. ط§ط®طھط¨ط± ظ…ط­ظ„ظٹط§ظ‹
npm run dev
npm run test

# 3. Build Docker image
docker build -t mnbarh/auth-service:v3.3.0 .

# 4. Push to registry
docker push mnbarh/auth-service:v3.3.0

# 5. Update Kubernetes deployment
kubectl set image deployment/auth-service \
  auth-service=mnbarh/auth-service:v3.3.0 -n mnbarh
```

### طھط­ط¯ظٹط« Frontend (Web)
```bash
# 1. ط¹ط¯ظ„ ط§ظ„ظƒظˆط¯ ظپظٹ frontend/web-app/
cd frontend/web-app

# 2. ط§ط®طھط¨ط± ظ…ط­ظ„ظٹط§ظ‹
npm run dev
npm run build

# 3. Build ظˆ Deploy
docker build -t mnbarh/web-app:v3.3.0 .
docker push mnbarh/web-app:v3.3.0

# 4. Update deployment
kubectl set image deployment/web-app \
  web-app=mnbarh/web-app:v3.3.0 -n mnbarh
```

### طھط­ط¯ظٹط« Flutter App
```bash
# 1. ط¹ط¯ظ„ ط§ظ„ظƒظˆط¯ ظپظٹ mobile/flutter_app/
cd mobile/flutter_app

# 2. ط§ط®طھط¨ط± ظ…ط­ظ„ظٹط§ظ‹
flutter run

# 3. Build ظ„ظ„ط¥ظ†طھط§ط¬
# Android
flutter build apk --release
flutter build appbundle --release

# iOS
flutter build ios --release

# 4. ط±ظپط¹ ظ„ظ„ظ…طھط§ط¬ط±
# Android â†’ Google Play Console
# iOS â†’ App Store Connect
```

---

## ًں¤– CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: npm run test:all

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Images
        run: docker-compose build

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to Staging
        run: kubectl apply -f k8s/staging/

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        run: kubectl apply -f k8s/production/
```

---

## âڈھ Rollback Strategy

### ط¥ط°ط§ ط­طµظ„ ظ…ط´ظƒظ„ط© ط¨ط¹ط¯ ط§ظ„طھط­ط¯ظٹط«:
```bash
# 1. Rollback ط³ط±ظٹط¹ ظپظٹ Kubernetes
kubectl rollout undo deployment/[service-name] -n mnbarh

# 2. ط£ظˆ ط§ط±ط¬ط¹ ظ„ظ€ version ظ…ط¹ظٹظ†
kubectl rollout undo deployment/auth-service \
  --to-revision=5 -n mnbarh

# 3. طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط­ط§ظ„ط©
kubectl rollout status deployment/auth-service -n mnbarh
```

### Database Rollback
```bash
# ط¥ط°ط§ ظپظٹ migration ط¬ط¯ظٹط¯
npx prisma migrate reset
# ط£ظˆ
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## ًں“± طھط­ط¯ظٹط« ط§ظ„طھط·ط¨ظٹظ‚ (App Store / Play Store)

### Android (Google Play)
1. ط²ظˆط¯ `versionCode` ظپظٹ `android/app/build.gradle`
2. Build: `flutter build appbundle --release`
3. ط§ط±ظپط¹ ط¹ظ„ظ‰ Google Play Console
4. ط§ط®طھط± Release Track (Internal â†’ Beta â†’ Production)
5. ط§ظ†طھط¸ط± ط§ظ„ظ…ط±ط§ط¬ط¹ط© (ط¹ط§ط¯ط© 1-3 ط£ظٹط§ظ…)

### iOS (App Store)
1. ط²ظˆط¯ version ظپظٹ Xcode
2. Build: `flutter build ios --release`
3. Archive ظ…ظ† Xcode
4. ط§ط±ظپط¹ ط¹ظ„ظ‰ App Store Connect
5. ط§ط®طھط± TestFlight ط£ظˆ Production
6. ط§ظ†طھط¸ط± ط§ظ„ظ…ط±ط§ط¬ط¹ط© (ط¹ط§ط¯ط© 1-7 ط£ظٹط§ظ…)

---

## ًںژ›ï¸ڈ Feature Flags ظ„ظ„طھط­ط¯ظٹط«ط§طھ ط§ظ„ط¢ظ…ظ†ط©

### طھظپط¹ظٹظ„ ظ…ظٹط²ط© ط¬ط¯ظٹط¯ط© طھط¯ط±ظٹط¬ظٹط§ظ‹:
```typescript
// ظپظٹ ط§ظ„ظƒظˆط¯
if (await featureService.isEnabled('new-checkout-flow', userId)) {
  // ط§ظ„ظ…ظٹط²ط© ط§ظ„ط¬ط¯ظٹط¯ط©
  return newCheckoutFlow();
} else {
  // ط§ظ„ظ…ظٹط²ط© ط§ظ„ظ‚ط¯ظٹظ…ط©
  return oldCheckoutFlow();
}
```

### ظ…ظ† ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…:
1. ط§ظپطھط­ Admin Dashboard â†’ Feature Flags
2. ط£ظ†ط´ط¦ Feature Flag ط¬ط¯ظٹط¯
3. ظپط¹ظ‘ظ„ ظ„ظ€ 10% ظ…ظ† ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†
4. ط±ط§ظ‚ط¨ ط§ظ„ط£ط¯ط§ط،
5. ط²ظˆط¯ ط§ظ„ظ†ط³ط¨ط© طھط¯ط±ظٹط¬ظٹط§ظ‹
6. ظپط¹ظ‘ظ„ ظ„ظ„ط¬ظ…ظٹط¹

---

## ًں“ٹ ظ…ط±ط§ظ‚ط¨ط© ط§ظ„طھط­ط¯ظٹط«

### ط¨ط¹ط¯ ظƒظ„ طھط­ط¯ظٹط« ط±ط§ظ‚ط¨:
```bash
# 1. طµط­ط© ط§ظ„ظ€ Pods
kubectl get pods -n mnbarh

# 2. Logs
kubectl logs -f deployment/[service-name] -n mnbarh

# 3. Metrics ظپظٹ Grafana
# - Response Time
# - Error Rate
# - CPU/Memory Usage

# 4. Alerts ظپظٹ PagerDuty/Slack
```

---

## âœ… Checklist ظ‚ط¨ظ„ ظƒظ„ طھط­ط¯ظٹط«

- [ ] ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ ظ†ط§ط¬ط­ط© 100%
- [ ] Code Review طھظ…
- [ ] Documentation ظ…ط­ط¯ط«ط©
- [ ] Database migrations ط¬ط§ظ‡ط²ط©
- [ ] Rollback plan ظ…ظˆط¬ظˆط¯
- [ ] Monitoring alerts ظ…ظپط¹ظ„ط©
- [ ] Team notified
- [ ] Backup ظ…ظˆط¬ظˆط¯

---

## ًں—“ï¸ڈ ط¬ط¯ظˆظ„ ط§ظ„طھط­ط¯ظٹط«ط§طھ ط§ظ„ظ…ظ‚طھط±ط­

| ط§ظ„ظ†ظˆط¹ | ط§ظ„طھظƒط±ط§ط± | ط§ظ„ظˆظ‚طھ ط§ظ„ظ…ظ†ط§ط³ط¨ |
|-------|---------|---------------|
| Hotfix | ظپظˆط±ظٹ | ط£ظٹ ظˆظ‚طھ |
| Patch | ط£ط³ط¨ظˆط¹ظٹ | ط§ظ„ط«ظ„ط§ط«ط§ط، 10 طµط¨ط§ط­ط§ظ‹ |
| Minor | ط´ظ‡ط±ظٹ | ط£ظˆظ„ ط£ط³ط¨ظˆط¹ |
| Major | ط±ط¨ط¹ ط³ظ†ظˆظٹ | ط¨ط¯ط§ظٹط© ط§ظ„ط±ط¨ط¹ |

---

**ط¢ط®ط± طھط­ط¯ظٹط«:** 25 ط¯ظٹط³ظ…ط¨ط± 2025

