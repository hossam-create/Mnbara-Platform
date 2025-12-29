# Steps to Remove & Rotate Secrets from the Repository
# خطوات إزالة وتدوير الأسرار من المستودع

This document provides safe steps to remove secrets from git history and rotate affected credentials.

## 1️⃣ Local Scan - فحص محلي

Install gitleaks: https://github.com/zricethezav/gitleaks

```bash
# Download gitleaks
curl -sSL https://github.com/zricethezav/gitleaks/releases/latest/download/gitleaks-linux-amd64 -o gitleaks
chmod +x gitleaks

# Run scan
./scripts/run-gitleaks.sh gitleaks-report.json
```

## 2️⃣ If Secrets Are Found - إذا وُجدت أسرار

### Option A: Use git-filter-repo (Recommended)

```bash
# Install
pip3 install git-filter-repo

# Remove a file from history
git filter-repo --path .env --invert-paths

# Remove specific pattern
git filter-repo --replace-text <(echo 'YOUR_SECRET_KEY==>REDACTED')
```

### Option B: Use BFG (Simpler for common cases)

```bash
# Download BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Remove file
java -jar bfg.jar --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 3️⃣ Rotate Affected Credentials - تدوير المفاتيح المتأثرة

For each leaked credential:

| Service | Steps |
|---------|-------|
| **Stripe** | Dashboard → Developers → API Keys → Roll Keys |
| **Firebase** | Console → Project Settings → Service Accounts → Generate New |
| **JWT Secret** | Generate new: `openssl rand -hex 64` |
| **Database** | Change password in PostgreSQL and update env |
| **Redis** | Update AUTH password in Redis config |

### Important!
- ❌ Do NOT store the new key in plaintext in the repo
- ✅ Use Vault, Kubernetes Secrets, or GitHub Secrets

## 4️⃣ Replace Secrets Usage with Vault/K8s Secrets

### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mnbarh-secrets
type: Opaque
stringData:
  JWT_SECRET: "your-new-secret"
  DATABASE_URL: "postgresql://..."
```

### HashiCorp Vault
```bash
vault kv put secret/mnbarh/prod \
  JWT_SECRET="your-new-secret" \
  STRIPE_KEY="sk_live_..."
```

## 5️⃣ Force-push Cleaned History

⚠️ **Only after approval and team notification!**

```bash
git push origin --force --all
```

## 6️⃣ Prevent Future Leaks - منع التسريبات المستقبلية

1. ✅ Add gitleaks to CI (already done in `.github/workflows/secret-scan.yml`)
2. ✅ Add pre-commit hooks (`scripts/pre-commit-gitleaks.sh`)
3. ✅ Educate developers on secret hygiene
4. ✅ Regular security audits

## Quick Reference - مرجع سريع

```bash
# Scan for secrets
./scripts/run-gitleaks.sh

# Check report
cat gitleaks-report.json | jq '.'

# Generate new JWT secret
openssl rand -hex 64

# Generate new API key
openssl rand -base64 32
```
