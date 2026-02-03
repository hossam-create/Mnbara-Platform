---
name: mnbara-backend-setup
description: Complete guide for setting up and working with Mnbara backend services (microservices architecture, Prisma, TypeScript)
---

# Mnbara Backend Setup Skill

## Purpose
Guide for working with Mnbara's microservices backend architecture.

## When to Use
Load this skill when:
- Creating new backend services
- Setting up Prisma schemas
- Working with TypeScript services
- Understanding the microservices structure

## Architecture Overview

Mnbara uses a microservices architecture:

```
backend/services/
├── ai-recommendations/      # AI-powered recommendations (Port 3010)
├── escrow-service/          # Escrow transactions (Port 3011)
├── auction-service/         # Auctions (Port 3002)
├── payment-service/         # Payments - Stripe (Port 3003)
├── internal-ledger-service/ # Internal wallet (Port 3009)
├── request-engine/          # Request management
├── decision-authority-service/ # Decision making
├── p2p-exchange-service/    # P2P Exchange
└── listing-service/         # Listings (Port 3001)
```

## Creating a New Service

To create a new backend service:

1. Create service directory:
   ```bash
   mkdir -p backend/services/my-service/src
   cd backend/services/my-service
   ```

2. Initialize package.json:
   ```bash
   npm init -y
   ```

3. Install dependencies:
   ```bash
   npm install express typescript @types/node @types/express
   npm install prisma @prisma/client dotenv winston cors
   npm install -D ts-node-dev jest @types/jest ts-jest
   npm install -D eslint @typescript-eslint/eslint-plugin
   ```

4. Create tsconfig.json:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "lib": ["ES2020"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist", "**/*.test.ts"]
   }
   ```

5. Create Prisma schema:
   ```bash
   mkdir prisma
   npx prisma init
   ```

6. Create service structure:
   ```
   src/
   ├── services/           # Business logic
   ├── controllers/        # HTTP handlers
   ├── routes/            # API routes
   ├── types/             # TypeScript types
   ├── utils/             # Utilities (logger, etc.)
   ├── middleware/        # Express middleware
   └── index.ts           # Entry point
   ```

7. Create .env.example:
   ```env
   PORT=3012
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   JWT_SECRET=your-secret-key
   ```

## Service Template

### index.ts (Entry Point)
```typescript
import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import myRoutes from './routes/my.routes';
import { logger } from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3012;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/v1/my', myRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'My Service',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Service running on port ${PORT}`);
});

export default app;
```

### Service Layer
```typescript
// src/services/my.service.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class MyService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: any) {
    logger.info('Creating item');
    return await this.prisma.myModel.create({ data });
  }

  async getById(id: string) {
    return await this.prisma.myModel.findUnique({
      where: { id }
    });
  }
}
```

### Controller
```typescript
// src/controllers/my.controller.ts
import { Request, Response } from 'express';
import { MyService } from '../services/my.service';
import { logger } from '../utils/logger';

export class MyController {
  private service: MyService;

  constructor() {
    this.service = new MyService();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.create(req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error creating:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.service.getById(id);
      
      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Not found'
        });
        return;
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
```

### Routes
```typescript
// src/routes/my.routes.ts
import { Router } from 'express';
import { MyController } from '../controllers/my.controller';

const router = Router();
const controller = new MyController();

router.post('/', controller.create.bind(controller));
router.get('/:id', controller.getById.bind(controller));

export default router;
```

### Logger Utility
```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'my-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
```

## Prisma Best Practices

### Schema Structure
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model MyModel {
  id        String   @id @default(uuid())
  name      String
  status    Status   @default(ACTIVE)
  data      Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([status])
  @@index([createdAt])
  @@map("my_models")
}

enum Status {
  ACTIVE
  INACTIVE
  PENDING
}
```

### Migrations
```bash
# Create migration
npx prisma migrate dev --name my_migration

# Apply to production
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## TypeScript Patterns

### Types
```typescript
// src/types/my.types.ts
export interface MyData {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
}

export interface CreateMyDto {
  name: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface MyResponse {
  success: boolean;
  data?: MyData;
  error?: string;
}
```

### Error Handling
```typescript
// src/errors/MyErrors.ts
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## Port Allocation

Reserve ports to avoid conflicts:
- 3001: Listing Service
- 3002: Auction Service
- 3003: Payment Service
- 3009: Internal Ledger Service
- 3010: AI Recommendations
- 3011: Escrow Service
- 3012+: New services

## Testing

### Unit Tests
```typescript
// src/services/__tests__/my.service.test.ts
import { MyService } from '../my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should create item', async () => {
    const data = { name: 'Test' };
    const result = await service.create(data);
    expect(result).toBeDefined();
    expect(result.name).toBe('Test');
  });
});
```

### Run Tests
```bash
npm test
```

## Documentation

Create README.md:
```markdown
# My Service

Description of the service.

## Installation
\`\`\`bash
npm install
\`\`\`

## Configuration
Copy .env.example to .env and configure.

## Running
\`\`\`bash
npm run dev
\`\`\`

## API Endpoints
- POST /api/v1/my - Create
- GET /api/v1/my/:id - Get by ID
```

## Best Practices

1. **Always use TypeScript strict mode**
2. **Implement proper error handling**
3. **Use Winston for logging**
4. **Add indexes to frequently queried fields**
5. **Write unit tests**
6. **Document API endpoints**
7. **Use environment variables for configuration**
8. **Follow service layer pattern**
9. **Implement health check endpoint**
10. **Use Prisma for database operations**
