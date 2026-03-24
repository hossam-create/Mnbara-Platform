# Auth Service

OAuth2 authentication service with social login support (Google, Facebook, Apple) and JWT-based authentication.

## Features

- **Email/Password Authentication**: Traditional registration and login
- **OAuth2 Social Login**: Google, Facebook, Apple Sign-In
- **JWT Tokens**: Access tokens (15min) and refresh tokens (7 days)
- **Role-Based Access Control**: USER, ADMIN, MODERATOR roles
- **Account Status Management**: ACTIVE, SUSPENDED, DELETED
- **Secure Password Hashing**: bcrypt with salt rounds
- **Session Management**: Express sessions for OAuth flows
- **Token Refresh**: Automatic token renewal

## Installation

```bash
cd backend/services/auth-service
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure environment variables:
```env
PORT=3014
DATABASE_URL="postgresql://user:password@localhost:5432/auth_db"
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ... other OAuth credentials
```

3. Set up OAuth providers:
   - **Google**: https://console.cloud.google.com/
   - **Facebook**: https://developers.facebook.com/
   - **Apple**: https://developer.apple.com/

## Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Tests
npm test
```

## API Endpoints

### Email/Password Authentication

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "jwt-refresh-token"
    }
  }
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: Same as register
```

#### Refresh Token
```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}

Response:
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "new-jwt-token",
      "refreshToken": "new-jwt-refresh-token"
    }
  }
}
```

#### Logout
```bash
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get Current User
```bash
GET /auth/me
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    }
  }
}
```

### OAuth2 Social Login

#### Google Login
```bash
# Redirect user to:
GET /auth/google

# Callback (handled automatically):
GET /auth/google/callback

# User redirected to frontend with tokens:
http://localhost:3000/auth/callback?accessToken=...&refreshToken=...&isNewUser=true
```

#### Facebook Login
```bash
GET /auth/facebook
GET /auth/facebook/callback
```

#### Apple Login
```bash
GET /auth/apple
GET /auth/apple/callback
```

## Integration Examples

### Frontend Integration

```typescript
// Register
const register = async (email: string, password: string, name: string) => {
  const response = await fetch('http://localhost:3014/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return response.json();
};

// Login
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3014/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// Protected API call
const getProfile = async (accessToken: string) => {
  const response = await fetch('http://localhost:3014/auth/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  return response.json();
};

// OAuth login
const loginWithGoogle = () => {
  window.location.href = 'http://localhost:3014/auth/google';
};
```

### Backend Integration (Other Services)

```typescript
import jwt from 'jsonwebtoken';

// Verify JWT token
const verifyToken = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Middleware for protected routes
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

## Security Features

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Tokens**: Short-lived access tokens (15min)
3. **Refresh Tokens**: Stored in database, can be revoked
4. **HTTPS Only**: Secure cookies in production
5. **CORS Protection**: Configured for specific origins
6. **Rate Limiting**: Recommended for production
7. **Session Security**: HTTP-only cookies

## Database Schema

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  emailVerified Boolean        @default(false)
  password      String?
  name          String?
  avatar        String?
  role          UserRole       @default(USER)
  status        UserStatus     @default(ACTIVE)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  lastLoginAt   DateTime?
  
  oauthAccounts OAuthAccount[]
  refreshTokens RefreshToken[]
}

model OAuthAccount {
  id           String       @id @default(uuid())
  userId       String
  provider     OAuthProvider
  providerId   String
  profile      Json?
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([provider, providerId])
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  
  user User @relation(fields: [userId], references: [id])
}
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Test specific file
npm test -- auth.service.test.ts
```

## Production Deployment

1. Set strong secrets for JWT and session
2. Configure OAuth redirect URLs for production domain
3. Enable HTTPS
4. Set `NODE_ENV=production`
5. Configure CORS for production frontend URL
6. Set up rate limiting
7. Enable logging and monitoring
8. Use secure database connection

## Port

Default: **3014**

## Dependencies

- express: Web framework
- passport: Authentication middleware
- passport-google-oauth20: Google OAuth strategy
- passport-facebook: Facebook OAuth strategy
- passport-apple: Apple Sign-In strategy
- passport-jwt: JWT authentication strategy
- jsonwebtoken: JWT token generation
- bcrypt: Password hashing
- @prisma/client: Database ORM
- winston: Logging

## Architecture

```
src/
├── config/
│   └── jwt.config.ts          # JWT and OAuth configuration
├── controllers/
│   └── auth.controller.ts     # HTTP request handlers
├── middleware/
│   └── auth.middleware.ts     # JWT authentication middleware
├── routes/
│   └── auth.routes.ts         # API routes
├── services/
│   ├── auth.service.ts        # Business logic
│   └── __tests__/
│       └── auth.service.test.ts
├── strategies/
│   ├── google.strategy.ts     # Google OAuth strategy
│   ├── facebook.strategy.ts   # Facebook OAuth strategy
│   ├── apple.strategy.ts      # Apple OAuth strategy
│   └── jwt.strategy.ts        # JWT strategy
├── types/
│   └── auth.types.ts          # TypeScript types
├── utils/
│   └── logger.ts              # Winston logger
└── index.ts                   # Entry point
```

## License

MIT
