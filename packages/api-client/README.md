# @mnbara/api-client

Shared API client for the Mnbara Platform.

## Installation

```bash
npm install @mnbara/api-client @mnbara/shared-types
# or
yarn add @mnbara/api-client @mnbara/shared-types
```

## Usage

```typescript
import { ApiClient } from '@mnbara/api-client';

const client = new ApiClient({
  baseURL: 'https://api.mnbara.com',
  apiKey: 'your-api-key',
});

// Make API requests
const orders = await client.get('/orders');
const order = await client.post('/orders', { ... });
```

## Configuration

### ApiClient Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| baseURL | string | Yes | Base URL for all API requests |
| apiKey | string | Yes | API key for authentication |
| timeout | number | No | Request timeout in milliseconds (default: 30000) |
| retries | number | No | Number of retries on failure (default: 3) |

## Available Methods

### GET
```typescript
const data = await client.get<T>(path, params?);
```

### POST
```typescript
const data = await client.post<T>(path, body);
```

### PUT
```typescript
const data = await client.put<T>(path, body);
```

### PATCH
```typescript
const data = await client.patch<T>(path, body);
```

### DELETE
```typescript
const data = await client.delete<T>(path);
```

## Available Endpoints

### Auth
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `POST /auth/refresh`

### Users
- `GET /users/me`
- `PUT /users/me`
- `GET /users/:id`
- `GET /users`

### Orders
- `GET /orders`
- `POST /orders`
- `GET /orders/:id`
- `PUT /orders/:id`
- `DELETE /orders/:id`

### Payments
- `GET /payments`
- `POST /payments`
- `GET /payments/:id`

### Deliveries
- `GET /deliveries`
- `GET /deliveries/:id`
- `PUT /deliveries/:id`

## Interceptors

### Request Interceptor
```typescript
client.addRequestInterceptor((config) => {
  // Modify request config
  return config;
});
```

### Response Interceptor
```typescript
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    // Handle error
    return Promise.reject(error);
  }
);
```

## License

MIT
