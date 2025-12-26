# 🎯 Render CLI Commands - دليل الأوامر الكاملة

**Status:** Ready to Use  
**Date:** December 26, 2025

---

## 🔧 Installation

```bash
# Install Render CLI
npm install -g @render-oss/render-cli

# Or using Homebrew (macOS)
brew install render

# Verify installation
render --version
```

---

## 🔐 Authentication

### Login to Render

```bash
render login
```

**Output:**
```
Opening browser to https://dashboard.render.com/cli-auth
Waiting for authentication...
✓ Authenticated as: your-email@example.com
```

### Logout

```bash
render logout
```

### Check Current User

```bash
render whoami
```

---

## 📋 Service Management

### List All Services

```bash
render services
```

**Output:**
```
ID                    Name                    Type        Status
srv_abc123           mnbara-platform         web         live
srv_def456           mnbara-postgres         pserv       live
srv_ghi789           mnbara-redis            redis       live
```

### Get Service Details

```bash
render service info mnbara-platform
```

**Output:**
```
Service: mnbara-platform
Type: Web Service
Status: live
URL: https://mnbara-platform.onrender.com
Plan: Pro
Region: Oregon
Created: 2025-12-26
```

### Create New Service

```bash
render create-service
```

**Interactive prompts:**
```
? Service name: mnbara-platform
? Environment: Node
? Build command: npm install && npm run build
? Start command: npm start
? Plan: Pro
```

### Update Service

```bash
render update-service mnbara-platform --plan pro
```

### Delete Service

```bash
render delete-service mnbara-platform
```

---

## 🚀 Deployment

### Deploy Service

```bash
render deploy mnbara-platform
```

### Deploy Specific Branch

```bash
render deploy mnbara-platform --branch main
```

### Deploy Specific Commit

```bash
render deploy mnbara-platform --commit abc123def456
```

### View Deployment History

```bash
render deployments mnbara-platform
```

**Output:**
```
ID          Status    Branch    Commit    Created
dep_abc123  live      main      abc123    2025-12-26 10:30
dep_def456  failed    main      def456    2025-12-26 10:00
dep_ghi789  live      main      ghi789    2025-12-25 15:45
```

### Rollback to Previous Deployment

```bash
render rollback mnbara-platform --deployment dep_def456
```

### Cancel Deployment

```bash
render cancel-deployment mnbara-platform --deployment dep_abc123
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Last 100 lines
render logs mnbara-platform

# Follow logs in real-time
render logs mnbara-platform --follow

# Last 50 lines
render logs mnbara-platform --lines 50

# Filter by level
render logs mnbara-platform --filter "ERROR"

# Last 1 hour
render logs mnbara-platform --since 1h
```

### View Metrics

```bash
# CPU usage
render metrics mnbara-platform --metric cpu

# Memory usage
render metrics mnbara-platform --metric memory

# Request count
render metrics mnbara-platform --metric requests

# Response time
render metrics mnbara-platform --metric response_time

# All metrics
render metrics mnbara-platform
```

### Health Check

```bash
render health mnbara-platform
```

**Output:**
```
Service: mnbara-platform
Status: healthy
Last check: 2025-12-26 10:30:00
Response time: 45ms
```

---

## 🔐 Environment Variables

### List Environment Variables

```bash
render env list mnbara-platform
```

**Output:**
```
KEY                    VALUE
NODE_ENV              production
PORT                  3000
DATABASE_URL          postgresql://...
REDIS_URL             redis://...
JWT_SECRET            ••••••••••••••••
```

### Add Environment Variable

```bash
render env add NODE_ENV production
render env add PORT 3000
render env add DATABASE_URL "postgresql://user:pass@host:5432/db"
```

### Update Environment Variable

```bash
render env update JWT_SECRET "new-secret-key"
```

### Remove Environment Variable

```bash
render env remove JWT_SECRET
```

### Set Multiple Variables from File

```bash
# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
EOF

# Load from file
render env load .env
```

---

## 🗄️ Database Management

### List Databases

```bash
render databases
```

**Output:**
```
ID          Name              Type        Status
db_abc123   mnbara-postgres   postgres    available
db_def456   mnbara-redis      redis       available
```

### Get Database Info

```bash
render database info mnbara-postgres
```

**Output:**
```
Database: mnbara-postgres
Type: PostgreSQL
Status: available
Host: dpg-abc123.render.com
Port: 5432
Database: mnbara_db
User: mnbara_user
```

### Create Database Backup

```bash
render backup create mnbara-postgres
```

### List Backups

```bash
render backups mnbara-postgres
```

### Restore from Backup

```bash
render restore mnbara-postgres --backup backup_id
```

---

## 🔄 Service Control

### Restart Service

```bash
render restart mnbara-platform
```

### Suspend Service

```bash
render suspend mnbara-platform
```

### Resume Service

```bash
render resume mnbara-platform
```

### Scale Service

```bash
# Increase instances
render scale mnbara-platform --instances 3

# Increase memory
render scale mnbara-platform --memory 2gb

# Increase CPU
render scale mnbara-platform --cpu 2
```

---

## 🌐 Domain Management

### List Custom Domains

```bash
render domains mnbara-platform
```

### Add Custom Domain

```bash
render domain add mnbara-platform mnbara.com
```

### Remove Custom Domain

```bash
render domain remove mnbara-platform mnbara.com
```

### Update DNS Records

```bash
render dns-records mnbara-platform
```

---

## 🔔 Alerts & Notifications

### List Alerts

```bash
render alerts mnbara-platform
```

### Create Alert

```bash
render alert create mnbara-platform \
  --metric cpu \
  --threshold 80 \
  --duration 5m \
  --action email
```

### Delete Alert

```bash
render alert delete mnbara-platform --alert alert_id
```

---

## 📦 Build & Deploy

### Build Service

```bash
render build mnbara-platform
```

### View Build Logs

```bash
render build-logs mnbara-platform
```

### Trigger Rebuild

```bash
render rebuild mnbara-platform
```

---

## 🔗 GitHub Integration

### Connect GitHub Repository

```bash
render connect-github
```

### Disconnect GitHub

```bash
render disconnect-github mnbara-platform
```

### View GitHub Integration Status

```bash
render github-status mnbara-platform
```

---

## 📊 Usage & Billing

### View Usage

```bash
render usage
```

**Output:**
```
Service: mnbara-platform
Plan: Pro
CPU: 2 cores
Memory: 4GB
Storage: 100GB
Monthly Cost: $25.00
```

### View Billing

```bash
render billing
```

---

## 🆘 Troubleshooting Commands

### Validate Configuration

```bash
render validate mnbara-platform
```

### Check Service Health

```bash
render health mnbara-platform
```

### Get Service Events

```bash
render events mnbara-platform
```

### Debug Service

```bash
render debug mnbara-platform
```

---

## 📝 Configuration Files

### Create render.yaml

```yaml
services:
  - type: web
    name: mnbara-platform
    env: node
    plan: pro
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
    healthCheckPath: /health

databases:
  - name: mnbara-postgres
    databaseName: mnbara_db
    user: mnbara_user
    plan: pro
```

### Deploy from render.yaml

```bash
render deploy-config render.yaml
```

---

## 🎯 Common Workflows

### Deploy New Version

```bash
# 1. Commit changes
git add .
git commit -m "New feature"

# 2. Push to GitHub
git push origin main

# 3. Render auto-deploys (if configured)
# Or manually deploy:
render deploy mnbara-platform
```

### Monitor Deployment

```bash
# Watch logs
render logs mnbara-platform --follow

# Check metrics
render metrics mnbara-platform

# Verify health
render health mnbara-platform
```

### Rollback if Issues

```bash
# View deployments
render deployments mnbara-platform

# Rollback to previous
render rollback mnbara-platform --deployment dep_id
```

### Update Environment

```bash
# Update variable
render env update DATABASE_URL "new-url"

# Restart service
render restart mnbara-platform

# Verify
render logs mnbara-platform --follow
```

---

## 💡 Tips & Tricks

### Alias Commands

```bash
# Add to ~/.bashrc or ~/.zshrc
alias rl='render logs'
alias rm='render metrics'
alias rd='render deploy'
alias rr='render restart'
```

### Batch Operations

```bash
# Deploy all services
for service in $(render services | awk '{print $2}'); do
  render deploy $service
done

# Restart all services
for service in $(render services | awk '{print $2}'); do
  render restart $service
done
```

### Export Configuration

```bash
# Export service config
render service info mnbara-platform > service-config.json

# Export environment variables
render env list mnbara-platform > env-vars.txt
```

---

## 📚 Additional Resources

- **Render Documentation:** https://render.com/docs
- **Render CLI Reference:** https://render.com/docs/cli
- **Render API:** https://render.com/docs/api
- **GitHub Issues:** https://github.com/hossam-create/Mnbara-Platform/issues

---

**Status:** ✅ Complete  
**Last Updated:** December 26, 2025  
**Version:** 3.2.0

