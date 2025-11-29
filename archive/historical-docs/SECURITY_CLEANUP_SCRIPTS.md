# Security Cleanup Scripts

# سكريبتات تنظيف الأمان

⚠️ **WARNING**: These scripts should only be used if sensitive data is found in git history.
**Use with extreme caution!**

---

## 1. Backup Before Cleanup - النسخ الاحتياطي

**ALWAYS backup before running any cleanup scripts:**

```bash
# Create backup
zip -r ../mnbara-platform-backup-$(date +%Y%m%d).zip .

# Or using tar
tar -czf ../mnbara-platform-backup-$(date +%Y%m%d).tar.gz .
```

---

## 2. Check for Sensitive Files - فحص الملفات الحساسة

### 2.1 Search Git History

```bash
# Search for .env files in history
git log --all --full-history -- "**/.env"

# Search for private keys
git log --all --full-history -- "**/*.pem" "**/*.key"

# Search for database dumps
git log --all --full-history -- "**/*.sql" "**/*.db"

# Search for large files
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '$3 > 104857600' | \  # Files > 100MB
  sort -k3 -n -r
```

### 2.2 Search for Secret Patterns

```bash
# Search for API keys
git grep -i "api_key\|apikey" $(git rev-list --all)

# Search for passwords
git grep -i "password\s*=\s*['\"]" $(git rev-list --all)

# Search for tokens
git grep -i "token\s*=\s*['\"]" $(git rev-list --all)
```

---

## 3. BFG Repo-Cleaner Method (Recommended) - الطريقة الموصى بها

BFG is faster and safer than `git filter-branch`.

### 3.1 Install BFG

```bash
# Download BFG (Java required)
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Or on Windows with Chocolatey
choco install bfg-repo-cleaner
```

### 3.2 Clone Mirror

```bash
# Clone as mirror (important!)
git clone --mirror https://github.com/hossam-create/Mnbara-Platform.git
```

### 3.3 Remove Sensitive Files

```bash
# Remove specific files
java -jar bfg.jar --delete-files .env Mnbara-Platform.git
java -jar bfg.jar --delete-files "*.pem" Mnbara-Platform.git
java -jar bfg.jar --delete-files "*.key" Mnbara-Platform.git

# Remove files larger than 100MB
java -jar bfg.jar --strip-blobs-bigger-than 100M Mnbara-Platform.git

# Remove folders
java -jar bfg.jar --delete-folders secrets Mnbara-Platform.git
```

### 3.4 Clean and Push

```bash
cd Mnbara-Platform.git

# Expire reflog
git reflog expire --expire=now --all

# Garbage collect
git gc --prune=now --aggressive

# Push changes (FORCE)
git push --force

# ⚠️ WARNING: This rewrites history!
# All collaborators must re-clone the repository
```

---

## 4. Git Filter-Branch Method (Alternative) - طريقة بديلة

**Note**: BFG is preferred, but this works if BFG is not available.

### 4.1 Remove Specific File

```bash
# Remove file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret/file.env" \
  --prune-empty --tag-name-filter cat -- --all
```

### 4.2 Remove Multiple Files

```bash
# Remove all .env files
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch '*.env'" \
  --prune-empty --tag-name-filter cat -- --all

# Remove all .pem files
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch '*.pem'" \
  --prune-empty --tag-name-filter cat -- --all
```

### 4.3 Remove Directory

```bash
# Remove entire directory
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch secrets/" \
  --prune-empty --tag-name-filter cat -- --all
```

### 4.4 Clean Up

```bash
# Remove old refs
rm -rf .git/refs/original/

# Expire reflog
git reflog expire --expire=now --all

# Garbage collect
git gc --prune=now --aggressive

# Force push
git push origin --force --all
git push origin --force --tags
```

---

## 5. After Cleanup - بعد التنظيف

### 5.1 Rotate ALL Secrets Immediately

**You MUST change all secrets that were in the repository:**

```bash
# Generate new JWT secret
openssl rand -base64 32

# Rotate database password
# - Login to your database provider
# - Change password
# - Update all services

# Rotate API keys
# - Stripe: Generate new keys in dashboard
# - PayPal: Generate new credentials
# - AWS: Rotate access keys
# - Any other third-party services
```

### 5.2 Update GitHub Secrets

Go to: https://github.com/hossam-create/Mnbara-Platform/settings/secrets/actions

Update all secrets with new values.

### 5.3 Notify Team

```bash
# Send message to all collaborators:

Subject: [URGENT] Repository Cleaned - Re-clone Required

The Mnbara Platform repository has been cleaned to remove sensitive data.

ACTION REQUIRED:
1. Delete your local repository
2. Re-clone from GitHub:
   git clone https://github.com/hossam-create/Mnbara-Platform.git
3. DO NOT push any old code
4. Update your local .env files with new secrets (contact admin)

The following secrets have been rotated:
- Database passwords
- API keys
- JWT secrets

Please acknowledge receipt of this message.
```

---

## 6. Prevent Future Issues - منع المشاكل المستقبلية

### 6.1 Enable Git Hooks

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Check for .env files
if git diff --cached --name-only | grep -E '\.env$'; then
  echo "❌ ERROR: Attempting to commit .env file"
  echo "Please remove .env files from your commit"
  exit 1
fi

# Check for private keys
if git diff --cached --name-only | grep -E '\.(pem|key)$'; then
  echo "❌ ERROR: Attempting to commit private key"
  exit 1
fi

# Check for large files
for file in $(git diff --cached --name-only); do
  size=$(git cat-file -s :$file 2>/dev/null || echo 0)
  if [ $size -gt 104857600 ]; then  # 100MB
    echo "❌ ERROR: File $file is larger than 100MB"
    exit 1
  fi
done

echo "✅ Pre-commit checks passed"
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

### 6.2 Enable GitHub Secret Scanning

1. Go to: Settings → Security → Secret scanning
2. Enable "Secret scanning"
3. Enable "Push protection"

### 6.3 Use git-secrets Tool

```bash
# Install git-secrets
# macOS
brew install git-secrets

# Windows (via Git Bash)
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# Initialize in repository
cd /path/to/mnbara-platform
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'STRIPE_SECRET_KEY'
git secrets --add 'JWT_SECRET'
```

---

## 7. Emergency Response Plan - خطة الاستجابة للطوارئ

If secrets are discovered in the repository:

### Immediate (Within 1 hour)

1. [ ] Rotate ALL exposed secrets
2. [ ] Check access logs for unauthorized access
3. [ ] Notify security team/management
4. [ ] Document the incident

### Short-term (Within 24 hours)

5. [ ] Clean git history (using steps above)
6. [ ] Force push cleaned repository
7. [ ] Notify all team members to re-clone
8. [ ] Review .gitignore and CI checks

### Long-term (Within 1 week)

9. [ ] Post-mortem analysis
10. [ ] Update security procedures
11. [ ] Additional security training
12. [ ] Implement monitoring for future breaches

---

## 8. Verification After Cleanup - التحقق بعد التنظيف

```bash
# Verify no secrets remain
git log --all --full-history -- "**/.env"

# Should return empty

# Check repository size reduced
git count-objects -vH

# Verify on GitHub
# Check repository size in Settings → General
```

---

## 9. Status Check - فحص الحالة

**Current Status**: ✅ **No cleanup needed**

The repository is clean. These scripts are provided for reference only.

---

## 10. Support Resources - موارد الدعم

- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Filter-Branch Documentation](https://git-scm.com/docs/git-filter-branch)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [git-secrets Tool](https://github.com/awslabs/git-secrets)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-26
**Maintained By**: Security Team
