# Quick Start Guide - Run Mnbara Platform Locally

## Prerequisites

- **Node.js** 18+ 
- **Docker Desktop** (for PostgreSQL, Redis)
- **npm** or **yarn**

---

## 🚀 Step 1: Clone & Install

```bash
cd "e:/New computer/Development & Coding/Projects/المستودعات الحالية (Current Repos)/geo/mnbara-platform"

# Install root dependencies
npm install

# Install dependencies for all services
npm run install:all
```

---

## 🐳 Step 2: Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify containers are running
docker ps
```

**Expected output:**
```
mnbara-postgres    (port 5432)
mnbara-redis       (port 6379)
```

---

## 🗄️ Step 3: Setup Database

```bash
# Run migrations for each service
cd services/auth-service
npx prisma migrate deploy
npx prisma db seed  # Optional: load sample data

cd ../listing-service
npx prisma migrate deploy

cd ../auction-service
npx prisma migrate deploy

cd ../payment-service
npx prisma migrate deploy

cd ../crowdship-service
npx prisma migrate deploy
```

**Alternative (unified schema):**
```bash
# If using unified schema
psql -h localhost -U mnbara_user -d mnbara_db < database/unified-schema.sql
```

---

## ⚡ Step 4: Start Services

### Option A: Start All Services (Docker Compose)
```bash
docker-compose up
```

### Option B: Start Services Individually (for development)

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm run dev
```

**Terminal 2 - Listing Service:**
```bash
cd services/listing-service
npm run dev
```

**Terminal 3 - Auction Service:**
```bash
cd services/auction-service
npm run dev
```

**Terminal 4 - Payment Service:**
```bash
cd services/payment-service
npm run dev
```

**Terminal 5 - Recommendation Service:**
```bash
cd services/recommendation-service
npm run dev
```

**Terminal 6 - Rewards Service:**
```bash
cd services/rewards-service
npm run dev
```

**Terminal 7 - Notification Service:**
```bash
cd services/notification-service
npm run dev
```

---

## 🌐 Step 5: Start Frontend

```bash
cd web/mnbara-web
npm run dev
```

---

## ✅ Step 6: Verify Everything Works

### Service Health Checks:
- Auth: http://localhost:3001/health
- Listing: http://localhost:3002/health
- Auction: http://localhost:3003/health
- Payment: http://localhost:3004/health
- Crowdship: http://localhost:3005/health
- Recommendation: http://localhost:3006/health
- Rewards: http://localhost:3007/health
- Notification: http://localhost:3008/health

### Frontend:
- **Web App**: http://localhost:3000

---

## 🧪 Test API Endpoints

### Register a new user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@mnbara.com",
    "password": "Test123!",
    "fullName": "Test User",
    "role": "buyer"
  }'
```

### Get categories:
```bash
curl http://localhost:3002/api/categories
```

### Get recommendations:
```bash
curl "http://localhost:3006/api/recommendations?userId=USER_ID&lat=25.2048&lon=55.2708&radius=50"
```

---

## 🛑 Stop All Services

```bash
# Stop Docker containers
docker-compose down

# Or stop individual terminals (Ctrl+C)
```

---

## 🐛 Troubleshooting

### Docker Issues
```bash
# Check Docker is running
docker info

# Restart Docker Desktop if needed
```

### Port Already in Use
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker logs mnbara-postgres

# Verify connection string in .env files
DATABASE_URL=postgresql://mnbara_user:mnbara_pass@localhost:5432/mnbara_db
```

### Missing Dependencies
```bash
# Reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Environment Variables

Create `.env` files in each service:

```env
# services/auth-service/.env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://mnbara_user:mnbara_pass@localhost:5432/mnbara_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-change-me
JWT_EXPIRES_IN=7d
```

Copy for other services, changing PORT accordingly.

---

## 🎯 Next Steps

1. ✅ All services running locally
2. 📱 Explore the web app at http://localhost:3000
3. 📖 Read API documentation (coming soon)
4. 🧪 Run tests: `npm test`
5. 🚀 Deploy to AWS (see `AWS_DEPLOYMENT.md`)

---

**Need Help?** Check `docker_troubleshooting.md` or create an issue on GitHub.
