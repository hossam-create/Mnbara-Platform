# User Service

User management service for the Mnbara platform. Handles user creation, retrieval, and management operations.

## Overview

The User Service is a NestJS-based microservice responsible for:
- User account creation and management
- User profile information retrieval
- User statistics and analytics
- User filtering and search capabilities

## Architecture

```
src/
├── user/                    # User module
│   ├── user.controller.ts   # HTTP request handlers
│   ├── user.service.ts      # Business logic
│   └── user.module.ts       # Module definition
├── prisma/                  # Database layer
│   ├── prisma.service.ts    # Prisma client wrapper
│   └── prisma.module.ts     # Prisma module
├── common/                  # Shared utilities
│   └── filters/             # Exception filters
├── app.module.ts            # Root module
└── main.ts                  # Application entry point
```

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update environment variables in `.env`:
```env
NODE_ENV=development
PORT=3004
DATABASE_URL="postgresql://user:password@localhost:5432/mnbara_user_service"
JWT_SECRET=your-secret-key
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Database

### Prisma Setup

Generate Prisma client:
```bash
npm run prisma:generate
```

Run migrations:
```bash
npm run prisma:migrate
```

Deploy migrations:
```bash
npm run prisma:deploy
```

## API Endpoints

### Create User
```
POST /api/v1/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "phoneNumber": "+1234567890"
}
```

### Get All Users
```
GET /api/v1/users?page=1&limit=10&status=ACTIVE&role=USER&search=john
```

### Get User Statistics
```
GET /api/v1/users/stats
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Linting

```bash
npm run lint
```

## Docker

Build image:
```bash
docker build -t mnbara/user-service:latest .
```

Run container:
```bash
docker run -p 3004:3004 \
  -e DATABASE_URL="postgresql://user:password@db:5432/mnbara_user_service" \
  -e JWT_SECRET="your-secret-key" \
  mnbara/user-service:latest
```

## Health Check

The service exposes a health check endpoint:
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

## Dependencies

### Core
- **@nestjs/common**: NestJS common utilities
- **@nestjs/core**: NestJS core framework
- **@nestjs/platform-express**: Express adapter for NestJS
- **@prisma/client**: Prisma ORM client

### Utilities
- **class-transformer**: DTO transformation
- **class-validator**: Input validation
- **dotenv**: Environment variable management
- **winston**: Logging

## Development

### Adding a New Endpoint

1. Add method to `user.service.ts`:
```typescript
async getUserByRole(role: string) {
  return await this.prisma.user.findMany({
    where: { role }
  });
}
```

2. Add handler to `user.controller.ts`:
```typescript
@Get('by-role/:role')
async getByRole(@Param('role') role: string) {
  return {
    success: true,
    data: await this.userService.getUserByRole(role)
  };
}
```

### Error Handling

The service uses a global exception filter (`HttpExceptionFilter`) to handle errors consistently.

## Monitoring

The service logs all requests and errors using Winston. Configure log level via `LOG_LEVEL` environment variable.

## Integration with Other Services

The User Service integrates with:
- **Auth Service**: For authentication and authorization
- **Notification Service**: For sending user notifications
- **API Gateway**: For routing external requests

## Migration from Old Structure

This service was migrated from `backend/services/user-service/` to `services/core/user-service/` as part of Phase 2 restructuring.

### Changes Made
- ✅ Moved source code to new location
- ✅ Added package.json with proper configuration
- ✅ Added tsconfig.json with path mappings
- ✅ Added .env.example for configuration
- ✅ Added Dockerfile for containerization
- ✅ Added comprehensive README

### Next Steps
1. Update import paths if using shared packages
2. Run `npm install` to install dependencies
3. Configure database connection in `.env`
4. Run `npm run prisma:migrate` to set up database
5. Run `npm run dev` to start development server

## Support

For issues or questions, contact the Mnbara platform team.

## License

MIT
