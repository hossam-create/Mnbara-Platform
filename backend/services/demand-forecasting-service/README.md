# 📊 Demand Forecasting Service - خدمة التنبؤ بالطلب

AI-powered demand forecasting, inventory optimization, and price optimization for Mnbara platform.

تنبؤ بالطلب مدعوم بالذكاء الاصطناعي، تحسين المخزون، وتحسين الأسعار لمنصة منبرة.

## Features | الميزات

### Demand Forecasting | التنبؤ بالطلب
- Time series forecasting (hourly, daily, weekly, monthly)
- Trend analysis
- Seasonal pattern detection
- 95% confidence intervals

### Inventory Optimization | تحسين المخزون
- Reorder point calculation
- Safety stock recommendations
- Stockout risk assessment
- Overstock warnings

### Price Optimization | تحسين الأسعار
- Price elasticity analysis
- Revenue maximization
- Dynamic pricing recommendations
- A/B testing support

### Alerts | التنبيهات
- Demand spike/drop alerts
- Stockout warnings
- Price opportunity alerts
- Anomaly detection

## API Endpoints | نقاط النهاية

### Forecasting
```
POST /api/forecast/generate              - Generate forecast
GET  /api/forecast/:targetType/:targetId - Get forecasts
GET  /api/forecast/trend/:type/:id       - Analyze trend
POST /api/forecast/sales                 - Record sales
GET  /api/forecast/model/performance     - Model metrics
```

### Inventory
```
POST /api/inventory/recommend            - Generate recommendation
GET  /api/inventory/recommendations      - List recommendations
GET  /api/inventory/recommendations/:id  - Product recommendation
GET  /api/inventory/health               - Inventory health
```

### Pricing
```
POST /api/price/optimize                 - Optimize price
GET  /api/price/optimizations            - List optimizations
GET  /api/price/optimizations/:productId - Product optimization
POST /api/price/optimizations/:id/apply  - Apply optimization
POST /api/price/optimizations/:id/reject - Reject optimization
```

### Alerts
```
GET  /api/alerts                    - List alerts
GET  /api/alerts/:id                - Get alert
POST /api/alerts/:id/acknowledge    - Acknowledge alert
POST /api/alerts/:id/dismiss        - Dismiss alert
```

## Forecasting Models | نماذج التنبؤ

- Exponential Smoothing (Holt-Winters)
- Moving Average
- Seasonal Decomposition
- Trend Analysis

## Accuracy Metrics | مقاييس الدقة

- MAPE (Mean Absolute Percentage Error)
- RMSE (Root Mean Square Error)
- MAE (Mean Absolute Error)
- R² (Coefficient of Determination)

## Setup | الإعداد

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Environment Variables | متغيرات البيئة

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/forecast_db
REDIS_URL=redis://localhost:6379
PORT=3023
```

## Tech Stack | التقنيات

- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Redis (caching)
- simple-statistics (statistical analysis)
- ml-regression (regression models)

## Port: 3023
