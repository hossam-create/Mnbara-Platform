# PR Workflow Guide - دليل سير العمل للـ Pull Requests

## Quick Reference - مرجع سريع

### Creating a PR - إنشاء Pull Request

```bash
# 1. Create feature branch
git checkout -b feature/<task-short-name>

# 2. Make changes
# ... edit files ...

# 3. Test locally
docker-compose up --build
npm test

# 4. Commit
git add .
git commit -m "feat: description of changes"

# 5. Push
git push origin feature/<task-short-name>

# 6. Open PR on GitHub
# Fill in the template
```

---

## Detailed Workflow - سير العمل التفصيلي

### Step 1: Branch Naming Convention

**Format**: `<type>/<short-description>`

**Types**:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

**Examples**:

```bash
git checkout -b feature/security-sweep
git checkout -b fix/auth-login-bug
git checkout -b docs/api-documentation
git checkout -b refactor/payment-service
```

---

### Step 2: Making Changes

```bash
# Make your changes
code .

# Check status
git status

# Add files
git add .
# Or selectively
git add path/to/file

# Commit with conventional commit message
git commit -m "feat: add security audit checks"
```

**Commit Message Format**:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

### Step 3: Local Testing

**Before pushing, always test locally:**

```bash
# Run docker-compose
docker-compose up --build

# In another terminal
# Test health endpoints
curl http://localhost:3001/health

# Run tests
npm test

# Run linter
npm run lint

# Check for secrets
git grep -i "api_key\|secret" .
```

---

### Step 4: Push and Create PR

```bash
# Push branch
git push origin feature/your-branch-name

# Go to GitHub
# Click "Compare & pull request"
```

**Fill in the PR template:**

```markdown
### Summary

Brief description of what this PR does

### Related Issue

Closes #123
Related to ACTION_PLAN.md - Task 1

### Changes

- Added security audit checks
- Created SECURITY_AUDIT.md report
- Enhanced CI workflow

### How to Test Locally

1. git checkout feature/security-sweep
2. docker-compose up --build
3. Check logs for security warnings

### Acceptance Criteria

- [x] No secrets in git history
- [x] .gitignore comprehensive
- [x] CI security checks passing

### Screenshots / Logs

(Attach relevant screenshots or paste logs)

### Notes

- Migrations: NO
- Secrets updated: NO
- Breaking changes: NO

### Checklist

- [x] Code compiles
- [x] Tests pass
- [x] No secrets committed
- [x] Docker Compose runs
- [x] CI will pass

### Reviewer

@hossam-create
```

---

### Step 5: PR Requirements Checklist

Before marking PR as ready for review:

- [ ] All tests pass locally
- [ ] Docker Compose builds and runs
- [ ] No secrets in files or commits
- [ ] Code follows project style
- [ ] Documentation updated (if needed)
- [ ] Migrations documented (if applicable)
- [ ] CI checks will pass
- [ ] PR template fully filled

---

### Step 6: Responding to Review

When reviewer requests changes:

```bash
# Make requested changes
# ... edit files ...

# Commit changes
git add .
git commit -m "fix: address review comments"

# Push update
git push origin feature/your-branch-name
```

**The PR will automatically update!**

---

### Step 7: Merge Policy

PRs can only be merged if:

1. ✅ **CI passes** - All GitHub Actions checks must pass
2. ✅ **Review approved** - At least 1 approval from code owner
3. ✅ **No conflicts** - Branch is up to date with main
4. ✅ **Conversations resolved** - All review comments addressed
5. ✅ **No secrets** - Security checks pass

---

## PR Templates for Each Task

### Task 1: Security Sweep

```markdown
### Summary

Security audit and cleanup for Mnbara Platform

### Related Issue

ACTION_PLAN.md - Task 1

### Changes

- Added PR template and CODEOWNERS
- Created comprehensive CI workflow
- Generated security audit report
- Enhanced .gitignore

### Acceptance Criteria

- [x] No .env files in git history
- [x] No API keys in code
- [x] .gitignore updated
- [x] No files >100MB
- [x] Security audit report created
```

### Task 2: Docker Compose

```markdown
### Summary

Verify and fix Docker Compose local setup

### Related Issue

ACTION_PLAN.md - Task 2

### Changes

- Fixed docker-compose.yml configuration
- Added LOCAL_SETUP.md guide
- Verified all services start correctly

### How to Test

1. docker-compose down -v
2. docker-compose up --build
3. Verify all health endpoints

### Acceptance Criteria

- [x] All services start without errors
- [x] Health endpoints return 200
- [x] Database connections work
```

---

## Common Issues & Solutions

### Issue: PR has conflicts

```bash
# Update from main
git checkout main
git pull origin main

# Rebase your branch
git checkout feature/your-branch
git rebase main

# Resolve conflicts
# ... edit conflicting files ...
git add .
git rebase --continue

# Force push (rebase rewrites history)
git push origin feature/your-branch --force
```

### Issue: CI fails

1. Check GitHub Actions logs
2. Reproduce locally:
   ```bash
   # Run same commands as CI
   npm ci
   npm run lint
   npm test
   ```
3. Fix issues
4. Push update

### Issue: Forgot to add file

```bash
# Add forgotten file
git add path/to/file
git commit --amend --no-edit

# Force push (amend rewrites history)
git push origin feature/your-branch --force
```

---

## Best Practices

### DO ✅

- Write clear, descriptive PR titles
- Fill out the entire PR template
- Keep PRs focused and small
- Test locally before pushing
- Respond to review comments promptly
- Update documentation with code changes

### DON'T ❌

- Push directly to main
- Create huge PRs (>500 lines changed)
- Commit secrets or .env files
- Ignore CI failures
- Skip testing locally
- Leave review comments unaddressed

---

## Emergency: Need to Delete a PR

```bash
# If you accidentally pushed secrets

# 1. Close the PR on GitHub
# 2. Delete the branch
git push origin --delete feature/branch-name

# 3. Follow SECURITY_CLEANUP_SCRIPTS.md to clean history
# 4. Rotate all exposed secrets immediately
```

---

## Automation with GitHub CLI

```bash
# Install GitHub CLI
# https://cli.github.com/

# Create PR from command line
gh pr create --title "feat: security sweep" \
             --body "Security audit and enhancements" \
             --base main \
             --head feature/security-sweep

# Check PR status
gh pr status

# Merge PR (after approval)
gh pr merge --squash
```

---

## Example PR Lifecycle

```
1. Create branch
   └─> git checkout -b feature/security-sweep

2. Make changes
   └─> Edit files, commit

3. Push
   └─> git push origin feature/security-sweep

4. Open PR
   └─> GitHub → New Pull Request

5. CI runs
   └─> GitHub Actions checks code

6. Review
   ├─> Request changes
   │   └─> Fix and push update
   └─> Approve

7. Merge
   └─> Squash and merge to main

8. Cleanup
   └─> Delete feature branch
```

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
