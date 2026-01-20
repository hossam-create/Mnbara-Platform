# GitHub Security Setup Guide

# ط¯ظ„ظٹظ„ ط¥ط¹ط¯ط§ط¯ ط§ظ„ط£ظ…ط§ظ† ط¹ظ„ظ‰ GitHub

## Prerequisites - ط§ظ„ظ…طھط·ظ„ط¨ط§طھ

- Repository: https://github.com/hossam-create/Mnbarh-Platform
- Admin access to repository
- Branch protection will be configured in Task 7

---

## 1. Enable Secret Scanning - طھظپط¹ظٹظ„ ظپط­طµ ط§ظ„ط£ط³ط±ط§ط±

### Steps:

1. Go to repository settings:

   ```
   https://github.com/hossam-create/Mnbarh-Platform/settings/security_analysis
   ```

2. Find **"Secret scanning"** section

3. Click **"Enable"** button

4. **Enable push protection** (Recommended):
   - âœ… Block commits that contain secrets
   - âœ… Alert before pushing
   - âœ… Scan for 200+ secret patterns

### Verification:

- Check **"Secret scanning"** shows **"Enabled"** âœ…
- Check **"Push protection"** shows **"Enabled"** âœ…

### What it does:

- Scans for leaked API keys, tokens, credentials
- Blocks pushes containing secrets
- Sends alerts when secrets detected
- Scans: AWS, Azure, GitHub, Stripe, etc.

---

## 2. Enable Code Scanning (CodeQL) - ظپط­طµ ط§ظ„ظƒظˆط¯

### Method 1: Using GitHub UI (Easiest)

1. Go to **Security** tab:

   ```
   https://github.com/hossam-create/Mnbarh-Platform/security/code-scanning
   ```

2. Click **"Set up code scanning"**

3. Choose **"Default setup"**:
   - âœ… JavaScript/TypeScript
   - âœ… Runs on: push, pull_request
   - âœ… Automated scheduling

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

- Go to **Security** â†’ **Code scanning**
- Should show **"CodeQL enabled"** âœ…
- First scan will run on next push

### What it does:

- Finds security vulnerabilities
- Detects code quality issues
- SQL injection detection
- XSS vulnerability detection
- Path traversal detection

---

## 3. Enable Dependabot - طھظپط¹ظٹظ„ Dependabot

### Security Updates:

1. Go to Settings:

   ```
   https://github.com/hossam-create/Mnbarh-Platform/settings/security_analysis
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
    directory: "/web/mnbarh-web"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # Mobile App
  - package-ecosystem: "npm"
    directory: "/mobile/mnbarh-app"
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

- Check **"Dependabot"** â†’ **"Enabled"** âœ…
- PRs will be created for outdated dependencies

### What it does:

- Automatic security updates
- Dependency version updates
- Creates PRs for updates
- Supports npm, Docker, GitHub Actions

---

## 4. Repository Security Settings - ط¥ط¹ط¯ط§ط¯ط§طھ ط£ظ…ط§ظ† ط§ظ„ظ…ط³طھظˆط¯ط¹

### Enable All Recommended Features:

Go to: **Settings** â†’ **Code security and analysis**

Enable:

- [x] **Dependency graph** - Visualize dependencies
- [x] **Dependabot alerts** - Security vulnerability alerts
- [x] **Dependabot security updates** - Auto security patches
- [x] **Grouped security updates** - Combine related updates
- [x] **Secret scanning** - Detect leaked secrets
- [x] **Push protection** - Block secret commits
- [x] **Code scanning** - Find vulnerabilities

---

## 5. Security Policies - ط³ظٹط§ط³ط§طھ ط§ظ„ط£ظ…ط§ظ†

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

- Email: security@mnbarh.com (replace with actual)
- Or use GitHub Security Advisories:
  https://github.com/hossam-create/Mnbarh-Platform/security/advisories/new

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

## 6. Verification Checklist - ظ‚ط§ط¦ظ…ط© ط§ظ„طھط­ظ‚ظ‚

After setup, verify:

### Security Tab:

```
https://github.com/hossam-create/Mnbarh-Platform/security
```

Should show:

- [x] Code scanning: **Enabled** âœ…
- [x] Secret scanning: **Enabled** âœ…
- [x] Dependabot: **Enabled** âœ…
- [x] Security policy: **Published** âœ…

### Settings â†’ Code security:

- [x] Dependency graph: **On**
- [x] Dependabot alerts: **On**
- [x] Dependabot security updates: **On**
- [x] Secret scanning: **On**
- [x] Push protection: **On**
- [x] Code scanning: **On**

### Workflows:

- [x] `.github/workflows/ci.yml` - Running âœ…
- [x] `.github/workflows/codeql.yml` - Running âœ… (if manual setup)

---

## 7. Testing Security Features - ط§ط®طھط¨ط§ط± ط§ظ„ظ…ظٹط²ط§طھ

### Test Secret Scanning:

Try to commit a fake AWS key:

```bash
# This should be BLOCKED by push protection
echo "AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" > test.txt
git add test.txt
git commit -m "test"
git push
```

Expected: â‌Œ **Push blocked** with secret detected message

### Test Code Scanning:

Create a PR and check:

```
Security â†’ Code scanning alerts
```

Should analyze code and show results

### Test Dependabot:

Check:

```
Security â†’ Dependabot
```

Should show dependency alerts (if any)

---

## 8. Maintenance - ط§ظ„طµظٹط§ظ†ط©

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

## 9. Alerts & Notifications - ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ

### Configure Notifications:

Settings â†’ Notifications â†’ Security alerts

Enable:

- [x] Email notifications
- [x] Web notifications
- [x] Dependabot alerts
- [x] Secret scanning alerts
- [x] Code scanning alerts

---

## 10. Additional Security Tools - ط£ط¯ظˆط§طھ ط¥ط¶ط§ظپظٹط©

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

## Support Resources - ظ…ظˆط§ط±ط¯ ط§ظ„ط¯ط¹ظ…

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Security Best Practices](https://docs.github.com/en/code-security/getting-started)

---

**Last Updated**: 2025-11-26  
**Maintained By**: Security Team

