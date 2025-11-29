# GitHub Security Setup Guide

# دليل إعداد الأمان على GitHub

## Prerequisites - المتطلبات

- Repository: https://github.com/hossam-create/Mnbara-Platform
- Admin access to repository
- Branch protection will be configured in Task 7

---

## 1. Enable Secret Scanning - تفعيل فحص الأسرار

### Steps:

1. Go to repository settings:

   ```
   https://github.com/hossam-create/Mnbara-Platform/settings/security_analysis
   ```

2. Find **"Secret scanning"** section

3. Click **"Enable"** button

4. **Enable push protection** (Recommended):
   - ✅ Block commits that contain secrets
   - ✅ Alert before pushing
   - ✅ Scan for 200+ secret patterns

### Verification:

- Check **"Secret scanning"** shows **"Enabled"** ✅
- Check **"Push protection"** shows **"Enabled"** ✅

### What it does:

- Scans for leaked API keys, tokens, credentials
- Blocks pushes containing secrets
- Sends alerts when secrets detected
- Scans: AWS, Azure, GitHub, Stripe, etc.

---

## 2. Enable Code Scanning (CodeQL) - فحص الكود

### Method 1: Using GitHub UI (Easiest)

1. Go to **Security** tab:

   ```
   https://github.com/hossam-create/Mnbara-Platform/security/code-scanning
   ```

2. Click **"Set up code scanning"**

3. Choose **"Default setup"**:
   - ✅ JavaScript/TypeScript
   - ✅ Runs on: push, pull_request
   - ✅ Automated scheduling

4. Click **"Enable CodeQL"**

### Method 2: Manual Workflow (Advanced)

Create `.github/workflows/codeql.yml`:

```yaml
name: "CodeQL"

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: "0 0 * * 0" # Weekly on Sunday

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: ["javascript", "typescript"]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: ${{ matrix.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@v2

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

### Verification:

- Go to **Security** → **Code scanning**
- Should show **"CodeQL enabled"** ✅
- First scan will run on next push

### What it does:

- Finds security vulnerabilities
- Detects code quality issues
- SQL injection detection
- XSS vulnerability detection
- Path traversal detection

---

## 3. Enable Dependabot - تفعيل Dependabot

### Security Updates:

1. Go to Settings:

   ```
   https://github.com/hossam-create/Mnbara-Platform/settings/security_analysis
   ```

2. Find **"Dependabot security updates"**

3. Click **"Enable"**

### Version Updates:

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Services
  - package-ecosystem: "npm"
    directory: "/services/auth-service"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "npm"
    directory: "/services/listing-service"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "npm"
    directory: "/services/auction-service"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "npm"
    directory: "/services/payment-service"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # Web App
  - package-ecosystem: "npm"
    directory: "/web/mnbara-web"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # Mobile App
  - package-ecosystem: "npm"
    directory: "/mobile/mnbara-app"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # Docker
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Verification:

- Check **"Dependabot"** → **"Enabled"** ✅
- PRs will be created for outdated dependencies

### What it does:

- Automatic security updates
- Dependency version updates
- Creates PRs for updates
- Supports npm, Docker, GitHub Actions

---

## 4. Repository Security Settings - إعدادات أمان المستودع

### Enable All Recommended Features:

Go to: **Settings** → **Code security and analysis**

Enable:

- [x] **Dependency graph** - Visualize dependencies
- [x] **Dependabot alerts** - Security vulnerability alerts
- [x] **Dependabot security updates** - Auto security patches
- [x] **Grouped security updates** - Combine related updates
- [x] **Secret scanning** - Detect leaked secrets
- [x] **Push protection** - Block secret commits
- [x] **Code scanning** - Find vulnerabilities

---

## 5. Security Policies - سياسات الأمان

### Create SECURITY.md:

In repository root, create `SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

- Email: security@mnbara.com (replace with actual)
- Or use GitHub Security Advisories:
  https://github.com/hossam-create/Mnbara-Platform/security/advisories/new

You should receive a response within 48 hours.

## Security Measures

- All secrets managed via GitHub Secrets
- Secret scanning enabled
- Code scanning with CodeQL
- Dependabot security updates
- Regular security audits
- Principle of least privilege

## Responsible Disclosure

We kindly ask that you:

1. Give us reasonable time to fix the issue
2. Don't publicly disclose until we release a fix
3. Don't exploit the vulnerability

We will:

1. Acknowledge within 48 hours
2. Provide regular updates
3. Credit you (unless you prefer anonymity)
4. Address critical issues within 7 days
```

---

## 6. Verification Checklist - قائمة التحقق

After setup, verify:

### Security Tab:

```
https://github.com/hossam-create/Mnbara-Platform/security
```

Should show:

- [x] Code scanning: **Enabled** ✅
- [x] Secret scanning: **Enabled** ✅
- [x] Dependabot: **Enabled** ✅
- [x] Security policy: **Published** ✅

### Settings → Code security:

- [x] Dependency graph: **On**
- [x] Dependabot alerts: **On**
- [x] Dependabot security updates: **On**
- [x] Secret scanning: **On**
- [x] Push protection: **On**
- [x] Code scanning: **On**

### Workflows:

- [x] `.github/workflows/ci.yml` - Running ✅
- [x] `.github/workflows/codeql.yml` - Running ✅ (if manual setup)

---

## 7. Testing Security Features - اختبار الميزات

### Test Secret Scanning:

Try to commit a fake AWS key:

```bash
# This should be BLOCKED by push protection
echo "AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" > test.txt
git add test.txt
git commit -m "test"
git push
```

Expected: ❌ **Push blocked** with secret detected message

### Test Code Scanning:

Create a PR and check:

```
Security → Code scanning alerts
```

Should analyze code and show results

### Test Dependabot:

Check:

```
Security → Dependabot
```

Should show dependency alerts (if any)

---

## 8. Maintenance - الصيانة

### Weekly:

- Review Dependabot PRs
- Check secret scanning alerts
- Review code scanning results

### Monthly:

- Review security advisories
- Update security policy
- Audit access permissions

### Quarterly:

- Full security audit
- Rotate secrets
- Review branch protection rules

---

## 9. Alerts & Notifications - التنبيهات

### Configure Notifications:

Settings → Notifications → Security alerts

Enable:

- [x] Email notifications
- [x] Web notifications
- [x] Dependabot alerts
- [x] Secret scanning alerts
- [x] Code scanning alerts

---

## 10. Additional Security Tools - أدوات إضافية

### Consider Adding:

1. **Snyk** - Vulnerability scanning
   - https://snyk.io/

2. **SonarCloud** - Code quality
   - https://sonarcloud.io/

3. **GitGuardian** - Secret detection
   - https://www.gitguardian.com/

4. **FOSSA** - License compliance
   - https://fossa.com/

---

## Support Resources - موارد الدعم

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Security Best Practices](https://docs.github.com/en/code-security/getting-started)

---

**Last Updated**: 2025-11-26  
**Maintained By**: Security Team
