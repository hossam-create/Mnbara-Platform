# 🛠️ MNBARA PLATFORM - DEVELOPER COMPANION GUIDE
**Document Version:** 1.0  
**Last Updated:** 2026-02-13  
**Status:** Technical Implementation Guide  
**Companion To:** MNBARA_UNIFIED_PRD_v1.0.md  

---

## 📋 DOCUMENT PURPOSE

This document serves as the technical implementation companion to the MNBARA_UNIFIED_PRD_v1.0.md, providing developers with:
- Detailed API specifications and examples
- Service communication patterns and event flows
- Security best practices and implementation guidelines
- Performance optimization strategies
- Debugging and troubleshooting procedures
- Code standards and development workflows

---

## 🔗 API REFERENCE

### Core API Endpoints

#### Authentication Service (Port 3001)

**POST /api/v1/auth/register**
```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "userType": "buyer|seller|traveler",
  "country": "US",
  "preferredLanguage": "en"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "userId": "usr_123456789",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": "usr_123456789",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "buyer",
      "isVerified": false,
      "createdAt": "2026-02-13T10:00:00Z"
    }
  },
  "message": "User registered successfully"
}
```

**POST /api/v1/auth/login**
```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true,
  "deviceInfo": {
    "type": "web|mobile",
    "os": "Windows|iOS|Android",
    "browser": "Chrome|Safari|Firefox",
    "ip": "192.168.1.1"
  }
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": "usr_123456789",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "buyer",
      "isVerified": true,
      "trustScore": 85,
      "profileComplete": true
    }
  },
  "message": "Login successful"
}
```

#### User Service (Port 3002)

**GET /api/v1/users/profile**
```json
// Headers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response (200 OK)
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456789",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "avatar": "https://cdn.mnbara.com/avatars/usr_123456789.jpg",
      "userType": "buyer",
      "isVerified": true,
      "trustScore": 85,
      "rating": 4.8,
      "totalTransactions": 45,
      "joinDate": "2024-01-15T00:00:00Z",
      "preferredLanguage": "en",
      "country": "US",
      "timezone": "America/New_York",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    }
  }
}
```

**PUT /api/v1/users/profile**
```json
// Request
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567891",
  "preferredLanguage": "en",
  "timezone": "America/New_York",
  "notifications": {
    "email": true,
    "sms": true,
    "push": true
  }
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456789",
      "firstName": "John",
      "lastName": "Smith",
      "phone": "+1234567891",
      "preferredLanguage": "en",
      "timezone": "America/New_York",
      "notifications": {
        "email": true,
        "sms": true,
        "push": true
      }
    }
  },
  "message": "Profile updated successfully"
}
```

#### Listing Service (Port 3003)

**POST /api/v1/listings**
```json
// Request
{
  "title": "Vintage Rolex Submariner Watch",
  "description": "Authentic vintage Rolex Submariner in excellent condition. Serviced recently.",
  "categoryId": "cat_watches_luxury",
  "condition": "excellent",
  "price": 8500.00,
  "currency": "USD",
  "listingType": "fixed_price|auction|best_offer",
  "location": {
    "country": "US",
    "state": "CA",
    "city": "Los Angeles",
    "zipCode": "90210"
  },
  "shipping": {
    "domestic": {
      "method": "standard|express|overnight",
      "cost": 25.00,
      "freeShipping": false,
      "estimatedDays": 3
    },
    "international": {
      "available": true,
      "method": "standard|express",
      "cost": 75.00,
      "estimatedDays": 7
    }
  },
  "returnPolicy": {
    "accepted": true,
    "days": 14,
    "buyerPaysReturnShipping": false
  },
  "images": [
    "https://cdn.mnbara.com/listings/img_1.jpg",
    "https://cdn.mnbara.com/listings/img_2.jpg",
    "https://cdn.mnbara.com/listings/img_3.jpg"
  ],
  "attributes": {
    "brand": "Rolex",
    "model": "Submariner",
    "year": 1985,
    "material": "Stainless Steel",
    "movement": "Automatic"
  },
  "auction": {
    "startPrice": 8000.00,
    "reservePrice": 8500.00,
    "duration": 7,
    "startTime": "2026-02-14T10:00:00Z"
  }
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "listing": {
      "id": "lst_987654321",
      "title": "Vintage Rolex Submariner Watch",
      "description": "Authentic vintage Rolex Submariner in excellent condition...",
      "sellerId": "usr_123456789",
      "categoryId": "cat_watches_luxury",
      "condition": "excellent",
      "price": 8500.00,
      "currency": "USD",
      "listingType": "auction",
      "status": "active",
      "location": {
        "country": "US",
        "state": "CA",
        "city": "Los Angeles"
      },
      "shipping": {
        "domestic": {
          "method": "standard",
          "cost": 25.00,
          "freeShipping": false,
          "estimatedDays": 3
        },
        "international": {
          "available": true,
          "method": "standard",
          "cost": 75.00,
          "estimatedDays": 7
        }
      },
      "returnPolicy": {
        "accepted": true,
        "days": 14,
        "buyerPaysReturnShipping": false
      },
      "images": [
        "https://cdn.mnbara.com/listings/img_1.jpg",
        "https://cdn.mnbara.com/listings/img_2.jpg",
        "https://cdn.mnbara.com/listings/img_3.jpg"
      ],
      "attributes": {
        "brand": "Rolex",
        "model": "Submariner",
        "year": 1985,
        "material": "Stainless Steel",
        "movement": "Automatic"
      },
      "auction": {
        "startPrice": 8000.00,
        "reservePrice": 8500.00,
        "currentBid": null,
        "bidCount": 0,
        "duration": 7,
        "startTime": "2026-02-14T10:00:00Z",
        "endTime": "2026-02-21T10:00:00Z",
        "status": "scheduled"
      },
      "createdAt": "2026-02-13T10:00:00Z",
      "updatedAt": "2026-02-13T10:00:00Z"
    }
  },
  "message": "Listing created successfully"
}
```

**GET /api/v1/listings/search**
```json
// Query Parameters
?query=rolex+watch&category=watches&minPrice=1000&maxPrice=10000&condition=excellent&location=US&sortBy=price_asc&page=1&limit=20

// Response (200 OK)
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "lst_987654321",
        "title": "Vintage Rolex Submariner Watch",
        "price": 8500.00,
        "currency": "USD",
        "condition": "excellent",
        "images": ["https://cdn.mnbara.com/listings/img_1.jpg"],
        "seller": {
          "id": "usr_123456789",
          "name": "John S.",
          "rating": 4.8,
          "trustScore": 85
        },
        "location": {
          "country": "US",
          "state": "CA",
          "city": "Los Angeles"
        },
        "shipping": {
          "domestic": {
            "cost": 25.00,
            "estimatedDays": 3
          }
        },
        "auction": {
          "status": "active",
          "endTime": "2026-02-21T10:00:00Z",
          "currentBid": 8200.00,
          "bidCount": 3
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "applied": {
        "query": "rolex watch",
        "category": "watches",
        "minPrice": 1000,
        "maxPrice": 10000,
        "condition": "excellent",
        "location": "US"
      }
    }
  }
}
```

#### Payment Service (Port 3004)

**POST /api/v1/payments/intent**
```json
// Request
{
  "listingId": "lst_987654321",
  "amount": 8500.00,
  "currency": "USD",
  "paymentMethod": "stripe|paypal|mpesa",
  "buyerId": "usr_buyer_123",
  "shippingAddress": {
    "firstName": "Jane",
    "lastName": "Buyer",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US",
    "phone": "+1234567890"
  },
  "billingAddress": {
    "firstName": "Jane",
    "lastName": "Buyer",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  }
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "paymentIntent": {
      "id": "pi_1234567890",
      "clientSecret": "pi_1234567890_secret_xyz",
      "status": "requires_payment_method",
      "amount": 8500.00,
      "currency": "USD",
      "escrowId": "esc_987654321",
      "fees": {
        "marketplace": 425.00,
        "escrow": 212.50,
        "total": 637.50
      },
      "netAmount": 7862.50
    }
  },
  "message": "Payment intent created successfully"
}
```

**POST /api/v1/payments/confirm**
```json
// Request
{
  "paymentIntentId": "pi_1234567890",
  "paymentMethodId": "pm_1234567890",
  "savePaymentMethod": false
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_1234567890",
      "status": "completed",
      "amount": 8500.00,
      "currency": "USD",
      "method": "stripe",
      "escrowId": "esc_987654321",
      "transactionId": "txn_1234567890",
      "fees": {
        "marketplace": 425.00,
        "escrow": 212.50,
        "processing": 255.00,
        "total": 892.50
      },
      "netAmount": 7607.50
    }
  },
  "message": "Payment confirmed successfully"
}
```

---

## 🔄 SERVICE COMMUNICATION PATTERNS

### Event-Driven Architecture

```mermaid
graph TD
    subgraph "Event Bus (Redis Pub/Sub)"
        Redis[Redis Event Bus<br/>Channel: mnbara_events]
    end

    subgraph "Event Publishers"
        UserService[User Service<br/>User Events]
        ListingService[Listing Service<br/>Listing Events]
        PaymentService[Payment Service<br/>Payment Events]
        OrderService[Order Service<br/>Order Events]
        AuctionService[Auction Service<br/>Auction Events]
    end

    subgraph "Event Consumers"
        NotificationService[Notification Service<br/>Send Notifications]
        AnalyticsService[Analytics Service<br/>Track Analytics]
        SearchService[Search Service<br/>Update Search Index]
        EscrowService[Escrow Service<br/>Process Escrow]
        AuditService[Audit Service<br/>Log Events]
    end

    UserService --> Redis
    ListingService --> Redis
    PaymentService --> Redis
    OrderService --> Redis
    AuctionService --> Redis

    Redis --> NotificationService
    Redis --> AnalyticsService
    Redis --> SearchService
    Redis --> EscrowService
    Redis --> AuditService
```

### Core Event Types

#### User Events
```typescript
// User Registration Event
interface UserRegisteredEvent {
  eventType: 'user.registered';
  eventId: string;
  timestamp: string;
  userId: string;
  email: string;
  userType: 'buyer' | 'seller' | 'traveler';
  country: string;
  ipAddress: string;
  userAgent: string;
}

// User Verification Event
interface UserVerifiedEvent {
  eventType: 'user.verified';
  eventId: string;
  timestamp: string;
  userId: string;
  verificationLevel: 'basic' | 'phone' | 'document' | 'full';
  verifiedBy?: string; // Admin ID if manual verification
}

// User Login Event
interface UserLoginEvent {
  eventType: 'user.login';
  eventId: string;
  timestamp: string;
  userId: string;
  deviceInfo: {
    type: 'web' | 'mobile';
    os: string;
    browser?: string;
    appVersion?: string;
  };
  ipAddress: string;
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}
```

#### Listing Events
```typescript
// Listing Created Event
interface ListingCreatedEvent {
  eventType: 'listing.created';
  eventId: string;
  timestamp: string;
  listingId: string;
  sellerId: string;
  title: string;
  categoryId: string;
  price: number;
  currency: string;
  listingType: 'fixed_price' | 'auction' | 'best_offer';
  location: {
    country: string;
    state: string;
    city: string;
  };
}

// Listing Activated Event
interface ListingActivatedEvent {
  eventType: 'listing.activated';
  eventId: string;
  timestamp: string;
  listingId: string;
  sellerId: string;
  approvedBy?: string; // Admin ID if manual approval
}

// Listing Sold Event
interface ListingSoldEvent {
  eventType: 'listing.sold';
  eventId: string;
  timestamp: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  finalPrice: number;
  currency: string;
  orderId: string;
}
```

#### Payment Events
```typescript
// Payment Intent Created Event
interface PaymentIntentCreatedEvent {
  eventType: 'payment.intent.created';
  eventId: string;
  timestamp: string;
  paymentIntentId: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'mpesa';
  escrowId?: string;
}

// Payment Completed Event
interface PaymentCompletedEvent {
  eventType: 'payment.completed';
  eventId: string;
  timestamp: string;
  paymentId: string;
  paymentIntentId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  fees: {
    marketplace: number;
    escrow: number;
    processing: number;
    total: number;
  };
  netAmount: number;
  escrowId: string;
}

// Payment Failed Event
interface PaymentFailedEvent {
  eventType: 'payment.failed';
  eventId: string;
  timestamp: string;
  paymentIntentId: string;
  buyerId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'mpesa';
  failureReason: string;
  errorCode?: string;
}
```

### Event Publishing Example

```typescript
// Event Publisher Service
import { RedisClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';

class EventPublisher {
  private redisClient: RedisClient;
  private serviceName: string;

  constructor(redisClient: RedisClient, serviceName: string) {
    this.redisClient = redisClient;
    this.serviceName = serviceName;
  }

  async publishEvent(event: BaseEvent): Promise<void> {
    const enrichedEvent = {
      ...event,
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      version: '1.0'
    };

    try {
      await this.redisClient.publish(
        'mnbara_events',
        JSON.stringify(enrichedEvent)
      );
      
      console.log(`Event published: ${event.eventType}`, enrichedEvent);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw new Error(`Event publishing failed: ${error.message}`);
    }
  }
}

// Usage Example
const eventPublisher = new EventPublisher(redisClient, 'payment-service');

// Publish payment completed event
await eventPublisher.publishEvent({
  eventType: 'payment.completed',
  buyerId: 'usr_buyer_123',
  sellerId: 'usr_seller_456',
  amount: 8500.00,
  currency: 'USD',
  paymentMethod: 'stripe',
  paymentId: 'pay_1234567890',
  escrowId: 'esc_987654321'
});
```

### Event Consumer Example

```typescript
// Event Consumer Service
import { RedisClient } from 'redis';

class EventConsumer {
  private redisClient: RedisClient;
  private handlers: Map<string, EventHandler>;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.handlers = new Map();
  }

  registerHandler(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
  }

  async startConsuming(): Promise<void> {
    const subscriber = this.redisClient.duplicate();
    
    subscriber.subscribe('mnbara_events');
    
    subscriber.on('message', async (channel, message) => {
      if (channel !== 'mnbara_events') return;
      
      try {
        const event = JSON.parse(message);
        const handler = this.handlers.get(event.eventType);
        
        if (handler) {
          await handler(event);
        } else {
          console.warn(`No handler registered for event type: ${event.eventType}`);
        }
      } catch (error) {
        console.error('Error processing event:', error);
      }
    });

    console.log('Event consumer started, listening for events...');
  }
}

// Usage Example
const eventConsumer = new EventConsumer(redisClient);

// Register event handlers
eventConsumer.registerHandler('payment.completed', async (event) => {
  console.log('Processing payment completed event:', event);
  
  // Send notification to seller
  await notificationService.sendPaymentReceivedNotification(event.sellerId, event.amount);
  
  // Update seller analytics
  await analyticsService.recordSale(event.sellerId, event.amount);
  
  // Trigger escrow release (if applicable)
  if (event.escrowId) {
    await escrowService.scheduleRelease(event.escrowId, 'payment_completed');
  }
});

eventConsumer.registerHandler('listing.sold', async (event) => {
  console.log('Processing listing sold event:', event);
  
  // Update search index
  await searchService.markListingSold(event.listingId);
  
  // Send notifications
  await notificationService.sendListingSoldNotification(event.sellerId, event.listingId);
  await notificationService.sendPurchaseConfirmation(event.buyerId, event.listingId);
  
  // Update recommendations
  await recommendationService.recordPurchase(event.buyerId, event.listingId);
});

// Start consuming events
eventConsumer.startConsuming();
```

---

## 🔒 SECURITY BEST PRACTICES

### Input Validation & Sanitization

```typescript
// Validation Middleware
import { body, validationResult } from 'express-validator';

export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Valid email required (max 100 characters)'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be 8-128 characters with uppercase, lowercase, number, and special character'),
  
  body('firstName')
    .trim()
    .escape()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name must be 1-50 characters, letters only'),
  
  body('lastName')
    .trim()
    .escape()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name must be 1-50 characters, letters only'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number required'),
  
  body('userType')
    .isIn(['buyer', 'seller', 'traveler'])
    .withMessage('User type must be buyer, seller, or traveler'),
  
  body('country')
    .isLength({ min: 2, max: 2 })
    .isISO31661Alpha2()
    .withMessage('Valid 2-letter country code required')
];

// Usage in route
app.post('/api/v1/auth/register', validateRegistration, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  // Process registration
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

### SQL Injection Prevention

```typescript
// Database Query Builder with Parameterized Queries
import { Pool } from 'pg';

class SecureDatabaseService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ✅ SECURE: Parameterized query
  async getUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, first_name, last_name, user_type, is_verified, trust_score
      FROM users
      WHERE email = $1 AND is_active = true
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  // ✅ SECURE: Parameterized query with multiple parameters
  async searchListings(filters: ListingFilters): Promise<Listing[]> {
    const conditions: string[] = ['is_active = true'];
    const parameters: any[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`category_id = $${paramIndex}`);
      parameters.push(filters.category);
      paramIndex++;
    }

    if (filters.minPrice) {
      conditions.push(`price >= $${paramIndex}`);
      parameters.push(filters.minPrice);
      paramIndex++;
    }

    if (filters.maxPrice) {
      conditions.push(`price <= $${paramIndex}`);
      parameters.push(filters.maxPrice);
      paramIndex++;
    }

    if (filters.condition) {
      conditions.push(`condition = $${paramIndex}`);
      parameters.push(filters.condition);
      paramIndex++;
    }

    if (filters.location) {
      conditions.push(`location_country = $${paramIndex}`);
      parameters.push(filters.location);
      paramIndex++;
    }

    const query = `
      SELECT id, title, description, price, currency, condition, seller_id, location_country, location_state, location_city
      FROM listings
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const result = await this.pool.query(query, parameters);
    return result.rows;
  }

  // ❌ INSECURE: Never do this - string concatenation
  async insecureSearch(query: string): Promise<any[]> {
    // NEVER DO THIS - Vulnerable to SQL injection
    const dangerousQuery = `SELECT * FROM listings WHERE title LIKE '%${query}%'`;
    const result = await this.pool.query(dangerousQuery);
    return result.rows;
  }

  // ✅ SECURE: Using query builder for complex queries
  async advancedSearch(filters: AdvancedFilters): Promise<Listing[]> {
    const builder = this.pool.createQueryBuilder('listings', 'l');
    
    builder
      .select(['l.id', 'l.title', 'l.price', 'l.currency', 'l.condition', 'l.seller_id'])
      .where('l.is_active = :isActive', { isActive: true });

    if (filters.category) {
      builder.andWhere('l.category_id = :category', { category: filters.category });
    }

    if (filters.minPrice) {
      builder.andWhere('l.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice) {
      builder.andWhere('l.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.sellerId) {
      builder.andWhere('l.seller_id = :sellerId', { sellerId: filters.sellerId });
    }

    if (filters.condition) {
      builder.andWhere('l.condition = :condition', { condition: filters.condition });
    }

    if (filters.location) {
      builder.andWhere('l.location_country = :location', { location: filters.location });
    }

    builder
      .orderBy('l.created_at', 'DESC')
      .limit(50);

    return await builder.getMany();
  }
}
```

### Authentication Middleware

```typescript
// JWT Authentication Middleware
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: 'buyer' | 'seller' | 'traveler' | 'admin';
    trustScore: number;
    isVerified: boolean;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = decoded as AuthRequest['user'];
    next();
  });
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Usage in routes
app.get('/api/v1/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  // Admin-only endpoint
  const users = await adminService.getAllUsers();
  res.json({ success: true, data: users });
});

app.get('/api/v1/seller/listings', authenticateToken, requireRole(['seller', 'admin']), async (req, res) => {
  // Seller and admin only endpoint
  const listings = await listingService.getSellerListings(req.user!.id);
  res.json({ success: true, data: listings });
});
```

### Rate Limiting

```typescript
// Rate Limiting Configuration
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 1 // Use separate Redis DB for rate limiting
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/v1/health';
  }
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  skipFailedRequests: false // Count failed attempts
});

// Payment endpoint rate limiting
export const paymentRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:payment:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 payment requests per minute
  message: {
    success: false,
    message: 'Too many payment attempts, please try again later'
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? req.user.id : req.ip;
  }
});

// Usage in routes
app.use('/api/v1', apiRateLimit);
app.use('/api/v1/auth/login', authRateLimit);
app.use('/api/v1/payments', paymentRateLimit);
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### Caching Strategies

```typescript
// Multi-layer Caching Implementation
import Redis from 'ioredis';
import NodeCache from 'node-cache';

class CacheService {
  private redisClient: Redis;
  private localCache: NodeCache;
  private defaultTTL: number;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.localCache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every minute
      useClones: false // Better performance for objects
    });

    this.defaultTTL = 300; // 5 minutes
  }

  // Generate cache key
  private generateKey(prefix: string, identifier: string): string {
    return `mnbara:${prefix}:${identifier}`;
  }

  // Get from cache (local first, then Redis)
  async get<T>(prefix: string, key: string): Promise<T | null> {
    const cacheKey = this.generateKey(prefix, key);
    
    // Check local cache first
    const localValue = this.localCache.get<T>(cacheKey);
    if (localValue) {
      return localValue;
    }

    // Check Redis
    try {
      const redisValue = await this.redisClient.get(cacheKey);
      if (redisValue) {
        const parsed = JSON.parse(redisValue) as T;
        // Store in local cache for faster access
        this.localCache.set(cacheKey, parsed, this.defaultTTL);
        return parsed;
      }
    } catch (error) {
      console.error('Redis get error:', error);
    }

    return null;
  }

  // Set in cache (both local and Redis)
  async set<T>(prefix: string, key: string, value: T, ttl?: number): Promise<void> {
    const cacheKey = this.generateKey(prefix, key);
    const finalTTL = ttl || this.defaultTTL;
    
    try {
      // Store in Redis
      await this.redisClient.setex(cacheKey, finalTTL, JSON.stringify(value));
      
      // Store in local cache
      this.localCache.set(cacheKey, value, finalTTL);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete from cache (both local and Redis)
  async del(prefix: string, key: string): Promise<void> {
    const cacheKey = this.generateKey(prefix, key);
    
    try {
      // Delete from local cache
      this.localCache.del(cacheKey);
      
      // Delete from Redis
      await this.redisClient.del(cacheKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Clear all cache for a prefix
  async clearPrefix(prefix: string): Promise<void> {
    const pattern = this.generateKey(prefix, '*');
    
    try {
      // Clear from Redis
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
      
      // Clear from local cache
      const localKeys = this.localCache.keys().filter(key => key.startsWith(pattern));
      this.localCache.del(localKeys);
    } catch (error) {
      console.error('Cache prefix clear error:', error);
    }
  }

  // Cache-aside pattern implementation
  async getOrSet<T>(
    prefix: string,
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(prefix, key);
    if (cached) {
      return cached;
    }

    // Fetch from source
    const data = await fetchFunction();
    
    // Store in cache
    await this.set(prefix, key, data, ttl);
    
    return data;
  }
}

// Usage Examples
const cacheService = new CacheService();

// Cache user profile
const userProfile = await cacheService.getOrSet(
  'user',
  'profile:usr_123456789',
  () => userService.getUserProfile('usr_123456789'),
  600 // 10 minutes TTL
);

// Cache listing details
const listingDetails = await cacheService.getOrSet(
  'listing',
  'details:lst_987654321',
  () => listingService.getListingDetails('lst_987654321'),
  300 // 5 minutes TTL
);

// Cache search results
const searchResults = await cacheService.getOrSet(
  'search',
  'results:rolex:watches:price_1000_10000:page_1',
  () => searchService.searchListings({
    query: 'rolex',
    category: 'watches',
    minPrice: 1000,
    maxPrice: 10000,
    page: 1
  }),
  120 // 2 minutes TTL for search results
);
```

### Database Connection Pooling

```typescript
// Database Connection Pool Configuration
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mnbara_db',
  user: process.env.DB_USER || 'mnbara_user',
  password: process.env.DB_PASSWORD,
  
  // Connection Pool Settings
  max: 20, // Maximum number of clients in the pool
  min: 5,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
  
  // Performance Settings
  statement_timeout: 30000, // Statements timeout after 30 seconds
  query_timeout: 25000, // Queries timeout after 25 seconds
  
  // Health Check Settings
  healthCheckPeriod: 30000, // Check connection health every 30 seconds
  healthCheckTimeout: 5000, // Health check timeout after 5 seconds
  
  // SSL Configuration (for production)
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA,
    cert: process.env.DB_SSL_CERT,
    key: process.env.DB_SSL_KEY
  } : false
});

// Connection Pool Monitoring
pool.on('connect', (client) => {
  console.log('New database connection established');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Handle the error appropriately
});

pool.on('remove', (client) => {
  console.log('Database connection removed from pool');
});

// Connection Health Check
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const startTime = Date.now();
    const result = await pool.query('SELECT 1');
    const endTime = Date.now();
    
    console.log(`Database health check passed in ${endTime - startTime}ms`);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Execute query with timeout and retry logic
async function executeQueryWithRetry(
  query: string,
  params: any[],
  maxRetries: number = 3,
  timeout: number = 25000
): Promise<any> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        pool.query(query, params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ]);
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Query attempt ${attempt} failed:`, error);
      
      // Don't retry on certain errors
      if (error.code === '42P01' || // Table doesn't exist
          error.code === '42703' || // Column doesn't exist
          error.code === '23505') { // Unique constraint violation
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

// Transaction Management
async function executeTransaction(
  callback: (client: PoolClient) => Promise<any>
): Promise<any> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Usage Example
async function createOrderWithItems(orderData: OrderData, items: OrderItem[]): Promise<Order> {
  return await executeTransaction(async (client) => {
    // Insert order
    const orderQuery = `
      INSERT INTO orders (user_id, total_amount, currency, status, shipping_address, billing_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const orderResult = await client.query(orderQuery, [
      orderData.userId,
      orderData.totalAmount,
      orderData.currency,
      'pending',
      JSON.stringify(orderData.shippingAddress),
      JSON.stringify(orderData.billingAddress)
    ]);
    
    const order = orderResult.rows[0];
    
    // Insert order items
    const itemQuery = `
      INSERT INTO order_items (order_id, listing_id, quantity, unit_price, total_price)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    for (const item of items) {
      await client.query(itemQuery, [
        order.id,
        item.listingId,
        item.quantity,
        item.unitPrice,
        item.totalPrice
      ]);
    }
    
    // Update listing quantities
    const updateQuantityQuery = `
      UPDATE listings 
      SET quantity = quantity - $1 
      WHERE id = $2
    `;
    
    for (const item of items) {
      await client.query(updateQuantityQuery, [item.quantity, item.listingId]);
    }
    
    return order;
  });
}
```

### Query Optimization

```typescript
// Database Query Optimization
import { Pool } from 'pg';

class QueryOptimizationService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Index optimization recommendations
  async analyzeQueryPerformance(query: string, params: any[]): Promise<QueryAnalysis> {
    try {
      // Execute EXPLAIN ANALYZE
      const explainResult = await this.pool.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`, params);
      const executionPlan = explainResult.rows[0]['QUERY PLAN'][0];
      
      return {
        query: query,
        executionTime: executionPlan['Execution Time'],
        planningTime: executionPlan['Planning Time'],
        totalCost: executionPlan['Total Cost'],
        rowsReturned: executionPlan['Plan Rows'],
        actualRows: executionPlan['Plan']['Actual Rows'],
        indexUsage: this.analyzeIndexUsage(executionPlan),
        recommendations: this.generateRecommendations(executionPlan)
      };
    } catch (error) {
      console.error('Query analysis error:', error);
      throw error;
    }
  }

  private analyzeIndexUsage(plan: any): IndexUsage[] {
    const indexUsages: IndexUsage[] = [];
    
    function traversePlan(node: any): void {
      if (node['Node Type'] === 'Index Scan' || node['Node Type'] === 'Index Only Scan') {
        indexUsages.push({
          type: node['Node Type'],
          relation: node['Relation Name'],
          index: node['Index Name'],
          condition: node['Index Cond'],
          rows: node['Actual Rows'],
          loops: node['Actual Loops']
        });
      }
      
      if (node['Plans']) {
        node['Plans'].forEach(traversePlan);
      }
    }
    
    traversePlan(plan['Plan']);
    return indexUsages;
  }

  private generateRecommendations(plan: any): string[] {
    const recommendations: string[] = [];
    
    // Check for sequential scans on large tables
    function checkForSequentialScans(node: any): void {
      if (node['Node Type'] === 'Seq Scan' && node['Actual Rows'] > 1000) {
        recommendations.push(`Consider adding index on ${node['Relation Name']} for condition: ${node['Filter'] || 'N/A'}`);
      }
      
      if (node['Plans']) {
        node['Plans'].forEach(checkForSequentialScans);
      }
    }
    
    checkForSequentialScans(plan['Plan']);
    
    // Check for expensive operations
    if (plan['Execution Time'] > 1000) {
      recommendations.push('Query execution time exceeds 1 second - consider optimization');
    }
    
    if (plan['Plan Rows'] > plan['Actual Rows'] * 10) {
      recommendations.push('Large discrepancy between estimated and actual rows - update table statistics');
    }
    
    return recommendations;
  }

  // Pagination optimization with cursor-based approach
  async getPaginatedResults(
    table: string,
    conditions: Record<string, any>,
    cursor?: string,
    limit: number = 20
  ): Promise<PaginatedResults> {
    let query: string;
    let params: any[] = [];
    
    if (cursor) {
      // Cursor-based pagination (more efficient for large datasets)
      query = `
        SELECT * FROM ${table}
        WHERE id > $1
        ${this.buildWhereClause(conditions, params.length + 1)}
        ORDER BY id ASC
        LIMIT $${params.length + 2}
      `;
      params = [cursor, ...Object.values(conditions), limit + 1];
    } else {
      // Initial query
      query = `
        SELECT * FROM ${table}
        WHERE 1=1
        ${this.buildWhereClause(conditions, params.length + 1)}
        ORDER BY id ASC
        LIMIT $${params.length + 1}
      `;
      params = [...Object.values(conditions), limit + 1];
    }
    
    const result = await this.pool.query(query, params);
    const hasMore = result.rows.length > limit;
    const items = hasMore ? result.rows.slice(0, -1) : result.rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    
    return {
      items,
      hasMore,
      nextCursor,
      totalCount: await this.getTotalCount(table, conditions)
    };
  }

  private buildWhereClause(conditions: Record<string, any>, startParam: number): string {
    const clauses: string[] = [];
    let paramIndex = startParam;
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          clauses.push(`${key} = ANY($${paramIndex})`);
        } else {
          clauses.push(`${key} = $${paramIndex}`);
        }
        paramIndex++;
      }
    });
    
    return clauses.length > 0 ? ' AND ' + clauses.join(' AND ') : '';
  }

  private async getTotalCount(table: string, conditions: Record<string, any>): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM ${table}
      WHERE 1=1
      ${this.buildWhereClause(conditions, 1)}
    `;
    
    const result = await this.pool.query(query, Object.values(conditions));
    return parseInt(result.rows[0].count);
  }
}

// Usage Example
const queryOptimizer = new QueryOptimizationService(pool);

// Analyze a slow query
const analysis = await queryOptimizer.analyzeQueryPerformance(`
  SELECT l.*, u.first_name, u.last_name, u.rating as seller_rating
  FROM listings l
  JOIN users u ON l.seller_id = u.id
  WHERE l.category_id = $1 
    AND l.price BETWEEN $2 AND $3
    AND l.is_active = true
  ORDER BY l.created_at DESC
  LIMIT 20
`, ['cat_watches', 1000, 10000]);

console.log('Query Analysis:', analysis);
```

---

## 🔍 DEBUGGING & TROUBLESHOOTING

### Logging Configuration

```typescript
// Structured Logging Setup
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console logger for development
const consoleLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// File logger for production
const fileLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Application logs
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    
    // Error logs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    }),
    
    // Audit logs for security events
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '90d'
    })
  ]
});

// Request logging middleware
export const requestLogger = (logger: winston.Logger) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log request
    logger.info('Incoming request', {
      type: 'request',
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id'],
      userId: (req as any).user?.id
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      logger.info('Request completed', {
        type: 'response',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: duration,
        requestId: req.headers['x-request-id'],
        userId: (req as any).user?.id
      });

      // Log slow requests
      if (duration > 1000) {
        logger.warn('Slow request detected', {
          type: 'performance',
          method: req.method,
          url: req.url,
          duration: duration,
          statusCode: res.statusCode
        });
      }
    });

    next();
  };
};

// Error logging
export const errorLogger = (logger: winston.Logger) => {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Application error', {
      type: 'error',
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      requestId: req.headers['x-request-id'],
      userId: (req as any).user?.id,
      ip: req.ip
    });

    next(error);
  };
};

// Security event logging
export const securityLogger = (logger: winston.Logger) => {
  return (event: string, details: any, req?: Request) => {
    logger.warn('Security event', {
      type: 'security',
      event: event,
      details: details,
      timestamp: new Date().toISOString(),
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      userId: (req as any)?.user?.id
    });
  };
};
```

### Health Check Implementation

```typescript
// Comprehensive Health Check System
import { Pool } from 'pg';
import Redis from 'ioredis';
import axios from 'axios';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: any;
}

interface HealthReport {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
  overallResponseTime: number;
}

class HealthCheckService {
  private dbPool: Pool;
  private redisClient: Redis;
  private services: Map<string, () => Promise<HealthCheck>>;

  constructor(dbPool: Pool, redisClient: Redis) {
    this.dbPool = dbPool;
    this.redisClient = redisClient;
    this.services = new Map();
    this.registerDefaultServices();
  }

  private registerDefaultServices(): void {
    // Database health check
    this.services.set('database', async () => {
      const startTime = Date.now();
      
      try {
        const result = await this.dbPool.query('SELECT 1');
        const responseTime = Date.now() - startTime;
        
        return {
          name: 'PostgreSQL Database',
          status: responseTime < 1000 ? 'healthy' : 'degraded',
          responseTime,
          details: {
            connected: true,
            queryTime: responseTime
          }
        };
      } catch (error) {
        return {
          name: 'PostgreSQL Database',
          status: 'unhealthy',
          error: error.message,
          details: {
            connected: false
          }
        };
      }
    });

    // Redis health check
    this.services.set('redis', async () => {
      const startTime = Date.now();
      
      try {
        await this.redisClient.ping();
        const responseTime = Date.now() - startTime;
        
        return {
          name: 'Redis Cache',
          status: responseTime < 500 ? 'healthy' : 'degraded',
          responseTime,
          details: {
            connected: true,
            pingTime: responseTime
          }
        };
      } catch (error) {
        return {
          name: 'Redis Cache',
          status: 'unhealthy',
          error: error.message,
          details: {
            connected: false
          }
        };
      }
    });

    // External services health check
    this.services.set('external-services', async () => {
      const checks = await Promise.allSettled([
        this.checkStripeHealth(),
        this.checkPayPalHealth(),
        this.checkMPesaHealth()
      ]);
      
      const results = checks.map((check, index) => {
        const serviceName = ['Stripe', 'PayPal', 'M-Pesa'][index];
        
        if (check.status === 'fulfilled') {
          return {
            service: serviceName,
            status: check.value.status,
            responseTime: check.value.responseTime
          };
        } else {
          return {
            service: serviceName,
            status: 'unhealthy',
            error: check.reason.message
          };
        }
      });
      
      const unhealthyCount = results.filter(r => r.status !== 'healthy').length;
      const overallStatus = unhealthyCount === 0 ? 'healthy' : 
                           unhealthyCount <= 1 ? 'degraded' : 'unhealthy';
      
      return {
        name: 'External Payment Services',
        status: overallStatus,
        details: {
          services: results,
          healthyCount: results.filter(r => r.status === 'healthy').length,
          totalCount: results.length
        }
      };
    });

    // Memory usage check
    this.services.set('memory', async () => {
      const memUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      return {
        name: 'System Memory',
        status: memoryUsagePercent < 80 ? 'healthy' : 
                memoryUsagePercent < 90 ? 'degraded' : 'unhealthy',
        details: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          systemUsed: Math.round(usedMemory / 1024 / 1024), // MB
          systemTotal: Math.round(totalMemory / 1024 / 1024), // MB
          usagePercent: Math.round(memoryUsagePercent)
        }
      };
    });

    // Disk space check
    this.services.set('disk', async () => {
      try {
        const stats = await fs.stat('/');
        // This is a simplified check - in production, use a proper disk space library
        return {
          name: 'Disk Space',
          status: 'healthy', // Simplified for example
          details: {
            message: 'Disk space check not implemented in detail'
          }
        };
      } catch (error) {
        return {
          name: 'Disk Space',
          status: 'unhealthy',
          error: error.message
        };
      }
    });
  }

  private async checkStripeHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check Stripe API health
      const response = await axios.get('https://api.stripe.com/v1/health', {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Stripe API',
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          statusCode: response.status,
          status: response.data?.status || 'unknown'
        }
      };
    } catch (error) {
      return {
        name: 'Stripe API',
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  private async checkPayPalHealth(): Promise<HealthCheck> {
    // Similar implementation for PayPal
    // Implementation details omitted for brevity
    return {
      name: 'PayPal API',
      status: 'healthy',
      responseTime: 150
    };
  }

  private async checkMPesaHealth(): Promise<HealthCheck> {
    // Similar implementation for M-Pesa
    // Implementation details omitted for brevity
    return {
      name: 'M-Pesa API',
      status: 'healthy',
      responseTime: 200
    };
  }

  // Register custom health check
  registerService(name: string, checkFunction: () => Promise<HealthCheck>): void {
    this.services.set(name, checkFunction);
  }

  // Run all health checks
  async runHealthChecks(): Promise<HealthReport> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];
    
    // Run all registered health checks in parallel
    const checkPromises = Array.from(this.services.entries()).map(async ([name, checkFn]) => {
      try {
        const result = await checkFn();
        return { name, ...result };
      } catch (error) {
        return {
          name: name,
          status: 'unhealthy',
          error: error.message
        };
      }
    });
    
    checks.push(...await Promise.all(checkPromises));
    
    // Determine overall status
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: checks,
      overallResponseTime: Date.now() - startTime
    };
  }
}

// Usage Example
const healthCheckService = new HealthCheckService(dbPool, redisClient);

// Register custom health check
healthCheckService.registerService('custom-service', async () => {
  // Custom health check logic
  return {
    name: 'Custom Service',
    status: 'healthy',
    details: { message: 'All good!' }
  };
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthReport = await healthCheckService.runHealthChecks();
    
    const statusCode = healthReport.status === 'healthy' ? 200 :
                      healthReport.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthReport);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check endpoint
app.get('/health/detailed', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const healthReport = await healthCheckService.runHealthChecks();
    res.json(healthReport);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
```

### Common Issues & Solutions

```typescript
// Common Issues and Troubleshooting Guide

/**
 * ISSUE 1: Database Connection Pool Exhaustion
 * 
 * Symptoms:
 * - Error: "sorry, too many clients already"
 * - Error: "Connection pool is at maximum size"
 * - Slow response times
 * - Requests timing out
 * 
 * Solutions:
 */

// Solution 1: Monitor connection pool usage
async function monitorConnectionPool(): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = $1
    `, [process.env.DB_NAME]);
    
    console.log('Connection Pool Status:', result.rows[0]);
    
    // Alert if approaching limit
    const activeConnections = parseInt(result.rows[0].active_connections);
    const totalConnections = parseInt(result.rows[0].total_connections);
    
    if (activeConnections > pool.options.max * 0.8) {
      securityLogger(logger)('high_connection_usage', {
        activeConnections,
        maxConnections: pool.options.max
      });
    }
  } catch (error) {
    console.error('Failed to monitor connection pool:', error);
  }
}

/**
 * ISSUE 2: Redis Connection Issues
 * 
 * Symptoms:
 * - Error: "Redis connection lost"
 * - Error: "Connection refused"
 * - Cache misses increasing
 * - Performance degradation
 * 
 * Solutions:
 */

// Solution 1: Implement connection retry logic
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis retry attempt ${times}, next delay: ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  connectTimeout: 10000,
  commandTimeout: 5000,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

// Solution 2: Monitor Redis health
redisClient.on('error', (error) => {
  console.error('Redis error:', error);
  securityLogger(logger)('redis_connection_error', { error: error.message });
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

redisClient.on('reconnecting', (delay) => {
  console.log(`Redis reconnecting in ${delay}ms`);
});

/**
 * ISSUE 3: Memory Leaks
 * 
 * Symptoms:
 * - Increasing memory usage over time
 * - Node.js process crashes with OOM
 * - Performance degradation
 * - Garbage collection pressure
 * 
 * Solutions:
 */

// Solution 1: Monitor memory usage
function monitorMemoryUsage(): void {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const externalMB = Math.round(memUsage.external / 1024 / 1024);
  
  console.log(`Memory Usage - Heap: ${heapUsedMB}/${heapTotalMB}MB, External: ${externalMB}MB`);
  
  // Alert on high memory usage
  if (heapUsedMB > 500) { // 500MB threshold
    securityLogger(logger)('high_memory_usage', {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      external: externalMB
    });
  }
}

// Run memory monitoring every 30 seconds
setInterval(monitorMemoryUsage, 30000);

/**
 * ISSUE 4: High Response Times
 * 
 * Symptoms:
 * - Requests taking > 1 second
 * - Timeouts increasing
 * - User complaints about slowness
 * - Database queries slow
 * 
 * Solutions:
 */

// Solution 1: Query performance monitoring
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (duration > 1000) { // 1 second threshold
      console.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
      
      // Log slow requests for analysis
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: duration,
        statusCode: res.statusCode,
        userId: (req as any).user?.id
      });
    }
  });
  
  next();
});

/**
 * ISSUE 5: Authentication Failures
 * 
 * Symptoms:
 * - Users unable to login
 * - Token validation errors
 * - Session issues
 * - Permission denied errors
 * 
 * Solutions:
 */

// Solution 1: Enhanced authentication error handling
app.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    securityLogger(logger)('jwt_error', {
      error: err.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    securityLogger(logger)('token_expired', {
      expiredAt: err.expiredAt,
      ip: req.ip
    });
    
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired'
    });
  }
  
  next(err);
});
```

---

## 🚀 DEPLOYMENT & DEVOPS

### Docker Configuration

```dockerfile
# Multi-stage Dockerfile for Production
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start the application
CMD ["node", "dist/index.js"]
```

### Docker Compose for Development

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: mnbara-postgres
    environment:
      POSTGRES_DB: mnbara_db
      POSTGRES_USER: mnbara_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-dev_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mnbara_user -d mnbara_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - mnbara-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: mnbara-redis
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - mnbara-network

  # API Gateway
  api-gateway:
    build:
      context: ./backend/services/api-gateway
      dockerfile: Dockerfile.dev
    container_name: mnbara-api-gateway
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=mnbara_db
      - DB_USER=mnbara_user
      - DB_PASSWORD=${DB_PASSWORD:-dev_password}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET:-dev_jwt_secret}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID}
      - PAYPAL_CLIENT_SECRET=${PAYPAL_CLIENT_SECRET}
    volumes:
      - ./backend/services/api-gateway:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - mnbara-network

  # User Service
  user-service:
    build:
      context: ./backend/services/user-service
      dockerfile: Dockerfile.dev
    container_name: mnbara-user-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=mnbara_db
      - DB_USER=mnbara_user
      - DB_PASSWORD=${DB_PASSWORD:-dev_password}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET:-dev_jwt_secret}
    volumes:
      - ./backend/services/user-service:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - mnbara-network

  # Frontend Development Server
  frontend:
    build:
      context: ./frontend/web-app
      dockerfile: Dockerfile.dev
    container_name: mnbara-frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:8080
      - REACT_APP_WS_URL=ws://localhost:8080
    volumes:
      - ./frontend/web-app:/app
      - /app/node_modules
    depends_on:
      - api-gateway
    networks:
      - mnbara-network

  # Admin Panel
  admin-panel:
    build:
      context: ./frontend/admin-panel
      dockerfile: Dockerfile.dev
    container_name: mnbara-admin-panel
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:8080
      - REACT_APP_WS_URL=ws://localhost:8080
    volumes:
      - ./frontend/admin-panel:/app
      - /app/node_modules
    depends_on:
      - api-gateway
    networks:
      - mnbara-network

volumes:
  postgres_data:
  redis_data:

networks:
  mnbara-network:
    driver: bridge
```

### Kubernetes Deployment

```yaml
# k8s/api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mnbara-api-gateway
  namespace: mnbara
  labels:
    app: api-gateway
    component: backend
    tier: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: mnbara/api-gateway:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: metrics
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: mnbara-db-secret
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mnbara-db-secret
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: mnbara-jwt-secret
              key: secret
        - name: REDIS_HOST
          value: "mnbara-redis-service"
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mnbara-redis-secret
              key: password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: logs
          mountPath: /app/logs
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: logs
        emptyDir: {}
      - name: tmp
        emptyDir: {}
      securityContext:
        fsGroup: 1001
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - api-gateway
              topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: mnbara-api-gateway-service
  namespace: mnbara
  labels:
    app: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  - name: metrics
    port: 8081
    targetPort: 8081
    protocol: TCP
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mnbara-api-gateway-ingress
  namespace: mnbara
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.mnbara.com
    secretName: mnbara-api-tls
  rules:
  - host: api.mnbara.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mnbara-api-gateway-service
            port:
              number: 80
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: test_db
        DB_USER: postgres
        DB_PASSWORD: postgres
        REDIS_HOST: localhost
        REDIS_PORT: 6379
        JWT_SECRET: test_secret
        NODE_ENV: test
    
    - name: Run security audit
      run: npm audit --audit-level moderate
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.24.0'
    
    - name: Configure kubectl
      run: |
        mkdir -p $HOME/.kube
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > $HOME/.kube/config
        chmod 600 $HOME/.kube/config
    
    - name: Deploy to Kubernetes
      run: |
        # Update image tags in deployment files
        sed -i "s|image: mnbara/api-gateway:latest|image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}|g" k8s/*.yaml
        
        # Apply Kubernetes manifests
        kubectl apply -f k8s/
        
        # Wait for deployment to complete
        kubectl rollout status deployment/mnbara-api-gateway -n mnbara --timeout=300s
        
        # Verify deployment
        kubectl get pods -n mnbara
    
    - name: Run post-deployment tests
      run: |
        # Wait for services to be ready
        sleep 30
        
        # Run health checks
        kubectl exec -n mnbara deployment/mnbara-api-gateway -- node dist/scripts/health-check.js
        
        # Run smoke tests
        kubectl exec -n mnbara deployment/mnbara-api-gateway -- npm run test:smoke
    
    - name: Notify deployment status
      if: always()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        fields: repo,message,commit,author,action,eventName,ref,workflow
```

---

## 📞 SUPPORT & ESCALATION

### Support Tier Structure

| **Tier** | **Scope** | **Response Time** | **Resolution Time** | **Escalation** |
|----------|-----------|-------------------|---------------------|----------------|
| **Tier 1** | Basic issues, account help, general questions | 1 hour | 24 hours | Tier 2 |
| **Tier 2** | Technical issues, API problems, payment issues | 30 minutes | 8 hours | Tier 3 |
| **Tier 3** | Complex technical issues, security incidents | 15 minutes | 4 hours | Engineering |
| **Engineering** | Critical system issues, outages, security breaches | 5 minutes | 2 hours | CTO |

### Emergency Contacts

#### Critical Issues (P1 - System Down)
- **Phone**: +1-555-EMERGENCY
- **Email**: emergency@mnbara.com
- **Slack**: #critical-incidents
- **Response**: 5 minutes

#### High Priority (P2 - Major Feature Down)
- **Phone**: +1-555-HIGH-PRIORITY
- **Email**: high-priority@mnbara.com
- **Slack**: #high-priority
- **Response**: 15 minutes

#### Medium Priority (P3 - Minor Issues)
- **Email**: support@mnbara.com
- **Slack**: #support
- **Response**: 1 hour

### Runbooks

#### Database Recovery Runbook
```bash
#!/bin/bash
# Database Recovery Procedures

echo "=== MNBARA DATABASE RECOVERY RUNBOOK ==="
echo "Date: $(date)"
echo ""

# Step 1: Assess the situation
echo "1. ASSESSING DATABASE STATUS..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT pg_database_size(current_database());"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM pg_stat_activity;"

# Step 2: Check recent backups
echo ""
echo "2. CHECKING RECENT BACKUPS..."
ls -la /backups/postgres/

# Step 3: If restore needed
if [ "$RECOVERY_MODE" = "restore" ]; then
    echo ""
    echo "3. RESTORING FROM BACKUP..."
    # Stop application services
    kubectl scale deployment mnbara-api-gateway --replicas=0 -n mnbara
    
    # Restore database
    pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME --clean --create /backups/postgres/latest.dump
    
    # Restart services
    kubectl scale deployment mnbara-api-gateway --replicas=3 -n mnbara
fi

# Step 4: Verify recovery
echo ""
echo "4. VERIFYING RECOVERY..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM users;"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM listings;"

echo ""
echo "=== RECOVERY COMPLETED ==="
```

#### Security Incident Response
```typescript
// Security Incident Response Procedures

class SecurityIncidentResponse {
  async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // Step 1: Immediate containment
    await this.containIncident(incident);
    
    // Step 2: Assess impact
    const impact = await this.assessImpact(incident);
    
    // Step 3: Notify stakeholders
    await this.notifyStakeholders(incident, impact);
    
    // Step 4: Investigate
    const findings = await this.investigateIncident(incident);
    
    // Step 5: Remediate
    await this.remediateIncident(incident, findings);
    
    // Step 6: Document and review
    await this.documentIncident(incident, findings);
  }

  private async containIncident(incident: SecurityIncident): Promise<void> {
    switch (incident.type) {
      case 'data_breach':
        // Isolate affected systems
        await this.isolateAffectedSystems(incident.affectedSystems);
        // Revoke compromised credentials
        await this.revokeCompromisedCredentials(incident.compromisedCredentials);
        break;
        
      case 'unauthorized_access':
        // Block suspicious IP addresses
        await this.blockSuspiciousIPs(incident.suspiciousIPs);
        // Force password resets for affected users
        await this.forcePasswordResets(incident.affectedUsers);
        break;
        
      case 'malware_detection':
        // Quarantine affected systems
        await this.quarantineSystems(incident.infectedSystems);
        // Update security signatures
        await this.updateSecuritySignatures();
        break;
    }
  }
}
```

---

## 🎯 CONCLUSION

This Developer Companion Guide provides the technical foundation needed to implement, maintain, and scale the Mnbara Platform effectively. It serves as a practical reference for:

- **API Integration**: Complete endpoint specifications and examples
- **System Architecture**: Service communication patterns and event flows
- **Security Implementation**: Best practices for secure coding
- **Performance Optimization**: Caching, database, and query optimization
- **Debugging Tools**: Comprehensive logging and health monitoring
- **Deployment Procedures**: Docker, Kubernetes, and CI/CD pipelines
- **Operational Excellence**: Troubleshooting guides and support procedures

**Next Steps:**
1. Review and implement the security best practices
2. Set up the development environment using Docker Compose
3. Configure monitoring and logging systems
4. Establish the CI/CD pipeline for automated deployments
5. Train the development team on the established patterns and procedures

For questions or clarifications, refer to the main PRD document or contact the technical team through the established support channels.

---

**Document Classification:** Internal Use - Development Team  
**Last Updated:** February 13, 2026  
**Next Review:** March 13, 2026