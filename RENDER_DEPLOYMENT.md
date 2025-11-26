# Mnbara Platform - Render.com Deployment Guide

## Prerequisites

1. **Render Account**: https://dashboard.render.com/
2. **GitHub Repository**: Code must be pushed to GitHub
3. **Git installed** locally

---

## Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Mnbara Platform"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/mnbara-platform.git

# Push to GitHub
git push -u origin main
```

---

## Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended)

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Click **"Apply"**
6. Wait for all services to deploy

### Option B: Manual Deployment

#### 2.1 Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Name: `mnbara-postgres`
3. Database: `mnbara_db`
4. User: `mnbara_user`
5. Plan: **Free**
6. Click **"Create Database"**
7. **Copy the Internal Database URL** (you'll need this)

#### 2.2 Create Redis Instance

1. Click **"New +"** → **"Redis"**
2. Name: `mnbara-redis`
3. Plan: **Free**
4. Click **"Create Redis"**
5. **Copy the Internal Redis URL**

#### 2.3 Deploy Each Service

For each service (auth, listing, auction, payment, crowdship, notification, recommendation, rewards):

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `mnbara-[service-name]`
   - **Root Directory**: `services/[service-name]`
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: Free

4. Add Environment Variables:

   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[paste Internal Database URL]
   REDIS_URL=[paste Internal Redis URL]
   JWT_SECRET=[generate random string]
   ```

5. Click **"Create Web Service"**

---

## Step 3: Run Database Migrations

After all services are deployed:

1. Go to **auth-service** in Render dashboard
2. Click **"Shell"** tab
3. Run:

   ```bash
   npx prisma migrate deploy
   ```

4. Repeat for: listing-service, auction-service, payment-service, crowdship-service, recommendation-service, rewards-service

---

## Step 4: Test Your Deployment

Each service will have a URL like:

- Auth: `https://mnbara-auth.onrender.com`
- Listing: `https://mnbara-listing.onrender.com`
- etc.

Test health endpoints:

```bash
curl https://mnbara-auth.onrender.com/health
curl https://mnbara-listing.onrender.com/health
```

---

## Important Notes

### Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free (enough for testing)

### Upgrade to Paid Plan

For production use, upgrade to **Starter ($7/month per service)**:

- Always-on (no spin-down)
- Faster performance
- More resources

---

## Troubleshooting

### Build Failures

- Check build logs in Render dashboard
- Verify `package.json` has correct scripts
- Ensure Prisma schema is valid

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check if migrations ran successfully
- Ensure PostgreSQL is running

### Service Not Responding

- Check service logs
- Verify PORT environment variable
- Ensure health check path is correct

---

## Next Steps

1. ✅ Deploy all services
2. ✅ Run migrations
3. ✅ Test endpoints
4. 📱 Connect mobile app to Render URLs
5. 🌐 Set up custom domain (optional)
6. 🔒 Add SSL certificates (automatic on Render)

---

## Useful Commands

```bash
# View logs
# Go to service → Logs tab in Render dashboard

# Restart service
# Go to service → Manual Deploy → Deploy latest commit

# Run migrations
# Go to service → Shell → npx prisma migrate deploy
```
