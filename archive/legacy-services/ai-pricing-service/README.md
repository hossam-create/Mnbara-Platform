# AI Pricing Service

Advanced Predictive AI & Dynamic Pricing Engine for Mnbara E-commerce Platform.

## 🚀 Features

### 1. Predictive Buying AI
- **User Behavior Analysis**: Build comprehensive user profiles based on purchase history, browsing patterns, and engagement metrics
- **Need Prediction Algorithms**: Predict when users will need to repurchase products based on consumption patterns
- **Proactive Suggestions**: Generate intelligent product recommendations before users actively search
- **Purchase Timing Optimization**: Recommend optimal purchase times for maximum savings

### 2. Dynamic Pricing Engine
- **Smart Pricing Algorithms**: Calculate optimal prices based on demand, competition, and inventory
- **Supply/Demand Analysis**: Real-time analysis of market supply and demand dynamics
- **Competitive Price Suggestions**: Get AI-powered pricing recommendations for seller competitiveness
- **Price Optimization for Sellers**: Maximize revenue while maintaining competitive positioning
- **Pricing Rules Engine**: Flexible rule-based pricing with conditions and actions

### 3. Market Intelligence
- **Trend Analysis**: Track and analyze market trends across categories and products
- **Price History Tracking**: Comprehensive historical price data with analytics
- **Demand Forecasting**: Predict future demand using ML-powered forecasting
- **Market Insights**: AI-generated insights about market opportunities and risks

## 📁 Project Structure

```
ai-pricing-service/
├── prisma/
│   └── schema.prisma          # Database schema with all AI pricing models
├── src/
│   ├── index.ts               # Entry point
│   ├── controllers/
│   │   └── ai-pricing.controller.ts  # HTTP request handlers
│   ├── routes/
│   │   └── ai-pricing.routes.ts      # API route definitions
│   ├── services/
│   │   ├── predictive-buying.service.ts    # Predictive buying AI
│   │   ├── dynamic-pricing.service.ts       # Dynamic pricing engine
│   │   └── market-intelligence.service.ts   # Market intelligence
│   ├── types/
│   │   └── ai-pricing.types.ts      # TypeScript type definitions
│   └── utils/
│       └── logger.ts                 # Logger utility
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Quick Start

### Installation

```bash
cd backend/services/ai-pricing-service
npm install
```

### Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## 🔗 API Endpoints

### Predictive Buying

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai-pricing/predictive/profile` | Build user behavior profile |
| GET | `/api/ai-pricing/predictive/predictions/:userId` | Get user predictions |
| POST | `/api/ai-pricing/predictive/needs` | Predict user purchase needs |
| GET | `/api/ai-pricing/predictive/suggestions/:userId` | Get proactive suggestions |
| POST | `/api/ai-pricing/predictive/timing` | Optimize purchase timing |
| PUT | `/api/ai-pricing/predictive/predictions/:id/acknowledge` | Acknowledge prediction |
| PUT | `/api/ai-pricing/predictive/predictions/:id/result` | Record prediction result |

### Dynamic Pricing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai-pricing/pricing/optimize` | Optimize product price |
| POST | `/api/ai-pricing/pricing/batch-optimize` | Batch optimize prices |
| POST | `/api/ai-pricing/pricing/competitive` | Get competitive price suggestion |
| POST | `/api/ai-pricing/pricing/rules/apply` | Apply pricing rules |
| GET | `/api/ai-pricing/pricing/optimizations/:productId` | Get optimizations |
| PUT | `/api/ai-pricing/pricing/optimizations/:id/apply` | Apply optimization |

### Market Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai-pricing/market/overview` | Get market overview |
| GET | `/api/ai-pricing/market/trends` | Get market trends |
| GET | `/api/ai-pricing/market/direction` | Get market direction |
| GET | `/api/ai-pricing/market/price-index` | Get price index history |
| GET | `/api/ai-pricing/market/price-compare/:categoryId` | Compare category prices |
| POST | `/api/ai-pricing/market/forecast` | Generate demand forecast |
| GET | `/api/ai-pricing/market/insights` | Get active insights |
| POST | `/api/ai-pricing/market/insights/generate` | Generate insights |
| GET | `/api/ai-pricing/market/price-history/:productId` | Get price history |
| GET | `/api/ai-pricing/market/price-stats/:productId` | Get price statistics |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai-pricing/health` | Health check |

## 📊 Usage Examples

### Optimize Product Price

```javascript
const response = await fetch('http://localhost:3040/api/ai-pricing/pricing/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'prod_123',
    basePrice: 99.99,
    costPrice: 50.00,
    categoryId: 'cat_electronics',
    inventoryLevel: 150,
    targetMargin: 0.30,
  }),
});

const result = await response.json();
console.log(result.data.recommendedPrice);
```

### Get Proactive Suggestions

```javascript
const response = await fetch('http://localhost:3040/api/ai-pricing/predictive/suggestions/user_456');
const suggestions = await response.json();

// Returns personalized product suggestions with timing recommendations
```

### Get Market Overview

```javascript
const response = await fetch('http://localhost:3040/api/ai-pricing/market/overview?categoryId=cat_electronics');
const overview = await response.json();

console.log(overview.data.marketSize);
console.log(overview.data.demandIndex);
console.log(overview.data.competitionLevel);
```

### Generate Demand Forecast

```javascript
const response = await fetch('http://localhost:3040/api/ai-pricing/market/forecast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetType: 'CATEGORY',
    targetId: 'cat_electronics',
    targetName: 'Electronics',
    periodType: 'WEEKLY',
    periods: 12,
  }),
});

const forecasts = await response.json();
// Returns 12-week demand forecast with confidence intervals
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 3040 |
| NODE_ENV | Environment | development |
| LOG_LEVEL | Logging level | info |
| DATABASE_URL | PostgreSQL connection string | - |
| CORS_ORIGIN | CORS origin | * |

## 📈 Key Algorithms

### Price Elasticity Calculation

The service uses midpoint method for calculating price elasticity:

```
Elasticity = (% Change in Quantity) / (% Change in Price)
```

### Demand Forecasting

Uses seasonal decomposition and trend analysis:

```
Predicted Demand = Base Demand × Seasonal Multiplier × Trend Adjustment
```

### Purchase Need Prediction

Combines multiple signals:

```
Need Score = w1 × Replenishment Score
           + w2 × Browsing Intent Score
           + w3 × Seasonal Score
           + w4 × Price Sensitivity Score
```

## 🎯 Model Features

### User Behavior Profile
- Purchase frequency and intervals
- Category preferences
- Price range sensitivity
- Optimal purchase timing
- Engagement metrics

### Dynamic Pricing Factors
- Demand elasticity
- Competition index
- Inventory levels
- Margin requirements
- Trend indicators

### Market Intelligence
- Price volatility
- Trend strength
- Seasonality patterns
- Competition intensity
- Sentiment analysis

## 📄 Database Models

### Core Models
- **UserBehaviorProfile**: User purchase patterns and preferences
- **PurchaseNeed**: AI-predicted purchase needs
- **PriceHistory**: Historical price tracking
- **PricingRule**: Configurable pricing rules
- **PriceOptimization**: Optimization results
- **MarketTrend**: Market trend data
- **PriceIndex**: Category price indices
- **DemandForecast**: Demand predictions
- **MarketInsight**: AI-generated insights

## 🔒 Security

- Helmet.js security headers
- CORS configuration
- Input validation
- Error handling with safe messages

## 📝 License

Mnbara Platform - All Rights Reserved

## 🤝 Integration

This service integrates with:
- User Service (behavior data)
- Order Service (purchase history)
- Product Service (pricing data)
- Inventory Service (stock levels)
- Analytics Service (market data)
