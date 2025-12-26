# 🚀 Render Deployment - Step by Step Guide

**Status:** Ready to Deploy  
**Date:** December 26, 2025  
**Platform:** Mnbara Platform  
**Estimated Time:** 30-45 minutes

---

## ✅ Pre-Deployment Checklist

- [x] Code committed to GitHub main branch
- [x] All package.json files verified (no typos)
- [x] Environment variables prepared
- [x] Render account created
- [x] GitHub connected to Render
- [x] Render CLI installed locally

---

## 🎯 Deployment Overview

We're deploying:

1. **PostgreSQL Database** - Data persistence
2. **Redis Cache** - Session & caching
3. **API Gateway** - Backend service (Node.js)
4. **Web Frontend** - React app (Vite)

---

## 📋 OPTION 1: Web UI Deployment (Recommended for First Time)

### Step 1: Create PostgreSQL Database

```
1. Go to: https://dashboard.render.com
2. Click: New + → PostgreSQL
3. Fill in:
   - Name: mnbara-db
   - Database: mnbara_prod
   - User: mnbara_user
   - Region: Frankfurt (or closest to you)
   - Plan: Free (or Pro for production)
4. Click: Create Database
5. Wait 2-3 minutes for creation
6. Copy the "Internal Database URL" (you'll need this)
```

**Expected URL format:**

```
postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod
```

---

### Step 2: Create Redis Cache

```
1. Click: New + → Redis
2. Fill in:
   - Name: mnbara-redis
   - Region: Same as Database (Frankfurt)
   - Plan: Free (or Pro for production)
3. Click: Create Redis
4. Wait 2-3 minutes for creation
5. Copy the "Internal Redis URL" (you'll need this)
```

**Expected URL format:**

```
redis://default:PASSWORD@dpg-xxxxx.render.internal:6379
```

---

### Step 3: Deploy API Gateway (Backend)

```
1. Click: New + → Web Service
2. Select: Build and deploy from a Git repository
3. Connect GitHub (if not already connected)
4. Select Repository:
   - Repository: hossam-create/Mnbara-Platform
   - Branch: main
5. Fill in Service Details:
   - Name: mnbara-api
   - Environment: Node
   - Build Command: cd backend/services/api-gateway && npm install
   - Start Command: cd backend/services/api-gateway && npm start
   - Plan: Pro (minimum for production)
6. Click: Advanced
7. Add Environment Variables:
   ├─ NODE_ENV = production
   ├─ PORT = 3001
   ├─ DATABASE_URL = (paste from Step 1)
   ├─ REDIS_URL = (paste from Step 2)
   └─ JWT_SECRET = a7f3e9c2b1d4f6a8e5c3b9d2f7a4e1c6b8d3f5a2e7c4b1d6f3a8e5c2b9d4f7
8. Click: Create Web Service
9. Wait 10-15 minutes for build and deployment
```

**Monitor the deployment:**

- Watch the build logs in real-time
- Check for any errors
- Verify the service is "Running" (green status)

---

### Step 4: Deploy Web Frontend

```
1. Click: New + → Web Service
2. Select: Build and deploy from a Git repository
3. Select Repository:
   - Repository: hossam-create/Mnbara-Platform
   - Branch: main
4. Fill in Service Details:
   - Name: mnbara-web
   - Environment: Node
   - Build Command: cd frontend/web && npm install && npm run build
   - Start Command: cd frontend/web && npm run preview
   - Plan: Pro (minimum for production)
5. Click: Advanced
6. Add Environment Variables:
   ├─ NODE_ENV = production
   └─ PORT = 5173
7. Click: Create Web Service
8. Wait 10-15 minutes for build and deployment
```

---

### Step 5: Verify Deployment

```bash
# Test API Gateway
curl https://mnbara-api.onrender.com/health

# Expected response:
# {"status": "ok", "database": "connected", "redis": "connected"}

# Test Web Frontend
# Open in browser: https://mnbara-web.onrender.com
```

---

## 🖥️ OPTION 2: Render CLI Deployment (Faster)

### Prerequisites

```bash
# Install Render CLI (if not already installed)
npm install -g @render-oss/render-cli

# Login to Render
render login
```

### Deploy with CLI

```bash
# 1. Create PostgreSQL
render create --type postgres \
  --name mnbara-db \
  --database mnbara_prod \
  --user mnbara_user \
  --region frankfurt \
  --plan free

# 2. Create Redis
render create --type redis \
  --name mnbara-redis \
  --region frankfurt \
  --plan free

# 3. Deploy API Gateway
render create --type web \
  --name mnbara-api \
  --repo hossam-create/Mnbara-Platform \
  --branch main \
  --build-command "cd backend/services/api-gateway && npm install && npm run build" \
  --start-command "cd backend/services/api-gateway && npm start" \
  --plan pro \
  --env NODE_ENV=production \
  --env PORT=3001 \
  --env DATABASE_URL="postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod" \
  --env REDIS_URL="redis://default:PASSWORD@dpg-xxxxx.render.internal:6379" \
  --env JWT_SECRET="a7f3e9c2b1d4f6a8e5c3b9d2f7a4e1c6b8d3f5a2e7c4b1d6f3a8e5c2b9d4f7"

# 4. Deploy Web Frontend
render create --type web \
  --name mnbara-web \
  --repo hossam-create/Mnbara-Platform \
  --branch main \
  --build-command "cd frontend/web-app && npm install && npm run build" \
  --start-command "cd frontend/web-app && npm run preview" \
  --plan pro \
  --env NODE_ENV=production \
  --env PORT=5173

# 5. Monitor deployment
render logs mnbara-api
render logs mnbara-web
```

---

## 🔍 Troubleshooting

### Build Fails with "npm ERR! notarget"

**Solution:** Check package.json for typos in package names

```bash
# Search for typos
grep -r "jsonwebtokena" backend/services/*/package.json
```

### Database Connection Error

**Solution:** Verify DATABASE_URL is correct

```bash
# Test connection
psql "postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod"
```

### Redis Connection Error

**Solution:** Verify REDIS_URL is correct

```bash
# Test connection
redis-cli -u "redis://default:PASSWORD@dpg-xxxxx.render.internal:6379"
```

### Service Won't Start

**Solution:** Check logs

```bash
# View logs
render logs mnbara-api --tail 100
```

---

## 📊 Environment Variables Reference

| Variable     | Value                                                          | Notes                  |
| ------------ | -------------------------------------------------------------- | ---------------------- |
| NODE_ENV     | production                                                     | Required               |
| PORT         | 3001 (API), 5173 (Web)                                         | Service-specific       |
| DATABASE_URL | postgresql://...                                               | From Render PostgreSQL |
| REDIS_URL    | redis://...                                                    | From Render Redis      |
| JWT_SECRET   | a7f3e9c2b1d4f6a8e5c3b9d2f7a4e1c6b8d3f5a2e7c4b1d6f3a8e5c2b9d4f7 | Pre-generated          |

---

## ✅ Post-Deployment Verification

### 1. Check Service Status

```bash
# All services should show "Running" (green)
render services
```

### 2. Test API Endpoints

```bash
# Health check
curl https://mnbara-api.onrender.com/health

# Should return:
# {"status": "ok", "database": "connected", "redis": "connected"}
```

### 3. Test Web Frontend

```
Open in browser: https://mnbara-web.onrender.com
Should load the Mnbara homepage
```

### 4. Check Database

```bash
# Connect to database
psql "postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod"

# List tables
\dt
```

### 5. Check Redis

```bash
# Connect to Redis
redis-cli -u "redis://default:PASSWORD@dpg-xxxxx.render.internal:6379"

# Ping
PING
# Should return: PONG
```

---

## 🎯 Next Steps After Deployment

1. **Setup Custom Domain** (Optional)
   - Go to Service Settings
   - Add custom domain
   - Update DNS records

2. **Enable Auto-Deploy** (Recommended)
   - Service Settings → Auto-Deploy
   - Select "Yes" for main branch

3. **Setup Monitoring** (Recommended)
   - Enable Render Metrics
   - Setup alerts for errors

4. **Backup Database** (Important)
   - Create automated backups
   - Test restore procedure

5. **Setup SSL/TLS** (Automatic)
   - Render provides free SSL certificates
   - Auto-renews every 90 days

---

## 📞 Support & Resources

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **GitHub Issues:** https://github.com/hossam-create/Mnbara-Platform/issues
- **Mnbara Support:** support@mnbara.com

---

## 🎉 Success Indicators

✅ All services showing "Running" status  
✅ API health check returns 200 OK  
✅ Web frontend loads without errors  
✅ Database connection successful  
✅ Redis connection successful  
✅ No errors in service logs

---

**Ready to deploy? Start with Option 1 (Web UI) if this is your first time!**
