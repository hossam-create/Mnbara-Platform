# 🔴 HOUR 0: Security Sweep - Execution Plan

**START TIME:** Now  
**DURATION:** 2 hours (0:00 - 2:00)  
**TEAM:** 1 Security Engineer + 1 DevOps  
**STATUS:** 🚀 IN PROGRESS

---

## ⏱️ Timeline Breakdown

### 0:00 - 0:30: Gitleaks Scan & Analysis

**STEP 1: Install Gitleaks**
```bash
# Windows (using chocolatey or direct download)
choco install gitleaks
# OR download from: https://github.com/gitleaks/gitleaks/releases

# Verify installation
gitleaks version
```

**STEP 2: Run Full Scan**
```bash
# Scan entire repository
gitleaks detect --source . --verbose --report-path gitleaks-report.json

# Check for secrets in Git history
gitleaks detect --source . --verbose --log-opts=--all --report-path gitleaks-history.json
```

**STEP 3: Review Results**
```bash
# Check what was found
type gitleaks-report.json
type gitleaks-history.json

# Count findings
findstr /c:"Secret" gitleaks-report.json
```

**EXPECTED OUTPUT:**
- ✅ No secrets found in current files
- ✅ No secrets found in Git history
- ✅ .gitignore is properly configured

---

### 0:30 - 1:00: Git History Cleanup (If Needed)

**IF SECRETS FOUND:**

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove .env files from history
git filter-repo --invert-paths --path .env --path .env.production --path .env.render

# Remove any other sensitive files
git filter-repo --invert-paths --path "*.key" --path "*.pem" --path "*.cert"

# Force push (CAREFUL - only if no one else is working)
git push origin --force-all
git push origin --force --tags
```

**IF NO SECRETS FOUND:**
- Skip this step
- Document that scan was clean

---

### 1:00 - 1:30: .gitignore Verification & Update

**STEP 1: Verify Current .gitignore**
```bash
# Check if all sensitive files are ignored
type .gitignore | findstr /i "env key pem cert secret"
```

**STEP 2: Ensure All Secrets Are Ignored**

The `.gitignore` should already have:
```
.env
.env.local
.env.*.local
.env.production
.env.development
.env.test
*.pem
*.key
*.cert
secrets/
credentials/
.secrets/
```

**STEP 3: Add Missing Patterns (if any)**
```bash
# Check for any missed patterns
git status --ignored

# If needed, update .gitignore and commit
git add .gitignore
git commit -m "chore: ensure all secrets are in .gitignore"
git push origin main
```

---

### 1:30 - 2:00: CI/CD Security Integration

**STEP 1: Verify GitHub Actions Workflows**
```bash
# Check existing workflows
type .github\workflows\ci.yml
type .github\workflows\pr-check.yml
```

**STEP 2: Add Gitleaks to CI/CD**

Create/Update `.github/workflows/security-scan.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

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
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: gitleaks-report
          path: report.json

  trivy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

**STEP 3: Commit Security Workflow**
```bash
git add .github/workflows/security-scan.yml
git commit -m "chore: add gitleaks and trivy security scanning"
git push origin main
```

**STEP 4: Verify Workflow Runs**
- Go to GitHub Actions
- Confirm security-scan workflow runs successfully
- Check for any findings

---

## ✅ Completion Checklist

### Before Moving to Hour 1:

- [ ] Gitleaks installed and working
- [ ] Full repository scanned (no secrets found)
- [ ] Git history scanned (no secrets found)
- [ ] .gitignore verified and complete
- [ ] Security workflow added to CI/CD
- [ ] GitHub Actions security-scan runs successfully
- [ ] All findings documented
- [ ] Team notified of completion

---

## 📊 Success Criteria

✅ **PASS** if:
- No secrets found in current code
- No secrets found in Git history
- .gitignore properly configured
- Security scanning in CI/CD
- All tests pass

❌ **FAIL** if:
- Secrets found in current code
- Secrets found in Git history
- .gitignore incomplete
- Security scanning fails
- Any tests fail

---

## 🚨 If Issues Found

### Secrets in Current Code:
```bash
# Remove from files
# Update .gitignore
# Commit and push
git add .
git commit -m "chore: remove secrets from codebase"
git push origin main
```

### Secrets in Git History:
```bash
# Use git-filter-repo to remove
git filter-repo --invert-paths --path .env
# Force push
git push origin --force-all
```

### CI/CD Failures:
```bash
# Check workflow logs
# Fix any issues
# Re-run workflow
```

---

## 📝 Documentation

**Files to Update:**
- [ ] SECURITY.md - Add security scanning info
- [ ] README.md - Add security badge
- [ ] CONTRIBUTING.md - Add security guidelines

**Example Security Badge:**
```markdown
[![Security: Gitleaks](https://img.shields.io/badge/Security-Gitleaks-blue)](https://github.com/gitleaks/gitleaks)
```

---

## 🎯 Next Steps (Hour 1)

After Hour 0 completion:
1. ✅ Security sweep complete
2. ➡️ Move to Hour 1: CI/CD Setup
3. ➡️ Then: MVP Marketplace (Hour 2-6)

---

## 📞 Support

**If you encounter issues:**

1. **Gitleaks not found:**
   - Download from: https://github.com/gitleaks/gitleaks/releases
   - Add to PATH

2. **Git filter-repo not working:**
   - Install: `pip install git-filter-repo`
   - Ensure Python is in PATH

3. **GitHub Actions failing:**
   - Check workflow syntax
   - Verify secrets are configured
   - Check runner logs

---

## 🔐 Security Notes

- ⚠️ Never commit `.env` files
- ⚠️ Never commit private keys
- ⚠️ Never commit API keys
- ⚠️ Always use `.env.example` for templates
- ⚠️ Use GitHub Secrets for sensitive data

---

**HOUR 0 STATUS:** 🚀 Ready to Execute

**ESTIMATED COMPLETION:** 2 hours from now

**NEXT MILESTONE:** Hour 1 - CI/CD Setup Complete

