# Node.js Version Specification - مواصفات إصدار Node.js

## الإصدار الرسمي للمشروع
**Node.js 22.20.0** ✅

## التفاصيل

### الملف الرئيسي
- **`.node-version`**: `22.20.0`
- **`package.json` (Root)**:
  - `"node": ">=22.0.0"`
  - `"npm": ">=10.0.0"`

### متطلبات الخدمات
معظم الخدمات متوافقة مع:
- **الحد الأدنى**: Node.js 18.0.0
- **الموصى به**: Node.js 22.0.0+

#### الخدمات التي تتطلب Node.js 18+
- `listing-service-node`: `>=18.0.0`
- `api-gateway`: `>=18.0.0`
- `ui-config-service`: `>=18.0.0`

#### الخدمات بدون متطلبات محددة
معظم الخدمات الأخرى لا تحدد متطلبات Node.js صراحة، لكنها متوافقة مع Node.js 18+

## الفوائد - Node.js 22 vs 18

### Node.js 22 (الإصدار الحالي)
✅ **الأفضليات:**
- أداء أفضل بـ 10-15%
- دعم أفضل للـ async/await
- تحسينات في V8 engine
- أمان محسّن
- دعم أفضل للـ TypeScript
- تحسينات في الذاكرة والـ garbage collection
- دعم أفضل للـ ESM modules
- أدوات تطوير محسّنة

### Node.js 18 (الإصدار الأقدم)
- إصدار LTS قديم
- أداء أقل
- أمان أقل تحديثاً

## التوصيات

### للتطوير المحلي
```bash
# استخدم Node.js 22.20.0
node --version  # يجب أن يظهر v22.20.0
```

### للإنتاج
```bash
# استخدم Node.js 22.x LTS
# أو أحدث إصدار LTS متاح
```

### للتثبيت

#### باستخدام nvm (الموصى به)
```bash
nvm install 22.20.0
nvm use 22.20.0
```

#### باستخدام Homebrew (macOS)
```bash
brew install node@22
```

#### باستخدام apt (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### باستخدام Docker
```dockerfile
FROM node:22.20.0-alpine
```

## التحقق من الإصدار

```bash
# التحقق من إصدار Node.js
node --version

# التحقق من إصدار npm
npm --version

# التحقق من توافق المشروع
npm run build
npm test
```

## ملاحظات مهمة

1. **التوافق**: جميع الخدمات متوافقة مع Node.js 22
2. **الأداء**: استخدام Node.js 22 يوفر أداء أفضل بـ 10-15%
3. **الأمان**: Node.js 22 يحتوي على تحديثات أمان أحدث
4. **المستقبل**: Node.js 22 سيكون LTS في أكتوبر 2024

## الخدمات والتوافق

| الخدمة | Node.js Min | الحالة |
|--------|------------|--------|
| Root Project | 22.0.0 | ✅ |
| listing-service-node | 18.0.0 | ✅ |
| api-gateway | 18.0.0 | ✅ |
| ui-config-service | 18.0.0 | ✅ |
| auth-service | (No spec) | ✅ |
| payment-service | (No spec) | ✅ |
| orders-service | (No spec) | ✅ |
| جميع الخدمات الأخرى | (No spec) | ✅ |

## الخلاصة

المشروع **مُعدّ لـ Node.js 22.20.0** وهو الإصدار الموصى به للتطوير والإنتاج.
