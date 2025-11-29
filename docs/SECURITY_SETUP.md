# 🔐 Security & Environment Setup Guide

## Environment Variables Configuration

### Critical Security Notice

⚠️ **NEVER commit `.env` files to Git!**

All `.env` files have been removed from this repository for security reasons. Each developer and deployment environment must create their own `.env` files locally.

## Setting Up Environment Variables

### For Each Service

Navigate to each service directory and create a `.env` file based on `.env.example`:

```bash
# Example for auth-service
cd services/auth-service
cp .env.example .env
```

### Required Environment Variables

#### 1. JWT_SECRET (CRITICAL)

**All services need this!**

```env
JWT_SECRET=your-super-secure-random-string-min-32-characters
```

**How to generate a secure JWT_SECRET:**

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Using online generator (use trusted sources only)
# https://randomkeygen.com/ (use CodeIgniter Encryption Keys)
```

#### 2. Database Connection

```env
DATABASE_URL="postgresql://username:password@localhost:5432/mnbara_db?schema=public"
```

#### 3. Redis Connection

```env
REDIS_URL="redis://localhost:6379"
```

#### 4. Service-Specific Variables

Check each service's `.env.example` for additional required variables.

## Production Deployment (Render.com)

### Setting Environment Variables on Render

1. Go to your service dashboard on Render
2. Navigate to "Environment" tab
3. Add each environment variable:
   - `JWT_SECRET`: Use a strong 64+ character random string
   - `DATABASE_URL`: Provided by Render PostgreSQL
   - `REDIS_URL`: Provided by Render Redis
   - `NODE_ENV`: Set to `production`

### Security Best Practices

1. **Unique Secrets per Environment**
   - Development: One JWT_SECRET
   - Staging: Different JWT_SECRET
   - Production: Completely different JWT_SECRET

2. **Secret Rotation**
   - Rotate JWT_SECRET every 90 days
   - Update all deployment environments
   - Invalidates all existing tokens (users need to re-login)

3. **Secret Sharing**
   - **NEVER** share secrets via:
     - Email
     - Slack/Discord
     - GitHub Issues/PRs
   - **USE** instead:
     - 1Password Teams
     - AWS Secrets Manager
     - HashiCorp Vault
     - Encrypted password manager

## Verification Checklist

Before pushing code, verify:

- [ ] No `.env` files in your commit
- [ ] `.env` patterns are in `.gitignore`
- [ ] All services have their `.env` files locally
- [ ] JWT_SECRET is strong (32+ characters, random)
- [ ] No hardcoded secrets in source code
- [ ] All `.env.example` files are up to date

## Common Issues

### Issue: "JWT_SECRET environment variable is not set"

**Solution:** Create `.env` file in the service directory with valid JWT_SECRET

### Issue: Application won't start

**Solution:** Check that all required environment variables from `.env.example` are present in your `.env`

### Issue: Database connection error

**Solution:** Verify DATABASE_URL format and credentials

## Additional Resources

- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App - Config](https://12factor.net/config)
- [Render Environment Variables Guide](https://render.com/docs/environment-variables)

## Support

If you encounter security-related issues, contact the security team immediately.

**Do NOT post security issues publicly!**
