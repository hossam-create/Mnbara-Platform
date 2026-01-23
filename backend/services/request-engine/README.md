# Request Engine - Crowdshipping Marketplace

## 🎯 Overview

Minimal request engine for crowdshipping marketplace similar to Uber. Users can paste product URLs, the system extracts product information, and travelers can accept delivery requests.

## 📋 Requirements

1. **Product URL Processing**: User pastes product URL
2. **Data Extraction**: System extracts title, image, price
3. **Delivery Requests**: User submits with origin, destination, deadline
4. **Request States**: Complete lifecycle management
5. **Traveler Interface**: View and accept requests
6. **No Payments**: Focus on request management only

## 🏗️ Architecture

```
request-engine/
├── src/
│   ├── models/
│   │   ├── Request.ts
│   │   ├── Product.ts
│   │   ├── User.ts
│   │   └── enums/
│   ├── controllers/
│   │   ├── RequestController.ts
│   │   └── ProductController.ts
│   ├── services/
│   │   ├── RequestService.ts
│   │   ├── ProductExtractionService.ts
│   │   └── StateTransitionService.ts
│   ├── routes/
│   │   ├── requestRoutes.ts
│   │   └── productRoutes.ts
│   ├── middleware/
│   │   ├── validation.ts
│   │   └── auth.ts
│   └── utils/
│       ├── urlExtractor.ts
│       └── stateMachine.ts
├── migrations/
│   └── 001_request_engine_schema.sql
├── tests/
│   ├── models/
│   ├── services/
│   └── controllers/
├── package.json
├── tsconfig.json
└── .env.example
```

## 🚀 Features

### Core Functionality
- **URL Product Extraction**: Automatic product data extraction
- **Request Management**: Complete CRUD operations
- **State Machine**: Robust request lifecycle management
- **Traveler Dashboard**: Available requests interface
- **Real-time Updates**: WebSocket support for live updates

### Request States
1. **CREATED** - Initial request creation
2. **VISIBLE_TO_TRAVELERS** - Visible to travelers
3. **ACCEPTED** - Traveler accepted request
4. **IN_PROGRESS** - Delivery in progress
5. **DELIVERED** - Request completed

## 📊 API Endpoints

### Product Extraction
- `POST /api/products/extract` - Extract product from URL
- `GET /api/products/:id` - Get product details

### Request Management
- `POST /api/requests` - Create new request
- `GET /api/requests` - List requests (with filters)
- `GET /api/requests/:id` - Get request details
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Cancel request

### Traveler Operations
- `GET /api/traveler/requests` - Available requests for travelers
- `POST /api/traveler/requests/:id/accept` - Accept a request
- `PUT /api/traveler/requests/:id/status` - Update delivery status

## 🔧 Tech Stack

- **Node.js** with TypeScript
- **Express.js** for API framework
- **PostgreSQL** with Prisma ORM
- **Redis** for caching
- **RabbitMQ** for event streaming
- **Jest** for testing
- **Docker** for containerization

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 🚀 Deployment

```bash
# Development
npm run dev

# Production
npm start

# Docker
docker-compose up
```

## 📝 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/request_engine

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Server
PORT=3004
NODE_ENV=development

# External APIs
PRODUCT_EXTRACTOR_API_KEY=your_api_key_here
```
