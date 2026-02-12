# @mnbara/shared-types

Shared TypeScript types for the Mnbara Platform.

## Installation

```bash
npm install @mnbara/shared-types
# or
yarn add @mnbara/shared-types
```

## Usage

```typescript
import { User, Order, PaymentStatus } from '@mnbara/shared-types';
```

## Available Types

### User Types
- `User` - Base user interface
- `UserRole` - User role enum
- `UserProfile` - User profile data

### Order Types
- `Order` - Order interface
- `OrderStatus` - Order status enum
- `OrderItem` - Order item interface

### Payment Types
- `Payment` - Payment interface
- `PaymentStatus` - Payment status enum
- `PaymentMethod` - Payment method enum

### Delivery Types
- `Delivery` - Delivery interface
- `DeliveryStatus` - Delivery status enum
- `DeliveryAddress` - Delivery address interface

### Common Types
- `PaginationParams` - Pagination parameters
- `ApiResponse` - Generic API response
- `ErrorResponse` - Error response interface

## License

MIT
