# .gitignore Guidelines for Mnbarh Platform

هدف هذا الملف: توحيد سياسات تجاه ملفات لا يجب أن تدخل إلى المستودع أبداً (secrets, build outputs, local config).

## المبادئ الأساسية

1. **لا تدفع أي ملفات تحتوي مفاتيح أو أسرار إلى git**
   - ملفات `.env` التي تحتوي أسرار
   - ملفات شهادات (`.pem`, `.key`, `.p12`)
   - ملفات keystore

2. **استخدم أدوات إدارة الأسرار الآمنة**
   - HashiCorp Vault
   - Kubernetes Secrets
   - GitHub Secrets
   - Render Environment Variables

3. **أضف قواعد إلى .gitignore لكل ملف محلي تُنشئه أدوات التطوير**
   - IDE settings (`.vscode/`, `.idea/`)
   - Build outputs (`dist/`, `build/`, `node_modules/`)

4. **عند إضافة أداة جديدة، أضف استثناءاتها فوراً**
   - Firebase: `google-services.json`, `GoogleService-Info.plist`
   - Android keystore: `*.jks`, `*.keystore`

## أوامر سريعة مفيدة

### التحقق من وجود ملفات حساسة قبل كل commit
```bash
./scripts/run-gitleaks.sh
```

### تحديث .gitignore
أضف القالب الموجود في `.gitignore` في root وتأكد من عدم وجود ملفات مضمّنة سابقاً.

### فحص التاريخ للأسرار
```bash
gitleaks detect --source . --report-path gitleaks-report.json
```

## الملفات التي يجب تجاهلها دائماً

| النوع | الأنماط |
|-------|---------|
| Environment | `.env`, `.env.*`, `.secrets/` |
| Keys/Certs | `*.pem`, `*.key`, `*.p12`, `*.jks` |
| Build | `dist/`, `build/`, `node_modules/` |
| Mobile | `google-services.json`, `GoogleService-Info.plist` |
| Logs | `*.log`, `npm-debug.log*` |
| IDE | `.vscode/`, `.idea/` |

## عند اكتشاف ملف حساس في التاريخ

اتبع الإرشادات في `security/ROTATE_SECRETS.md`
