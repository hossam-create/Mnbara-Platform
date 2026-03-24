# @mnbara/api-client

Shared API client for the Mnbara Platform with built-in interceptors for authentication, error handling, and retry logic.

## Installation

```bash
npm install @mnbara/api-client
# or
yarn add @mnbara/api-client
```

## Quick Start

```typescript
import { ApiClient } from '@mnbara/api-client';

const client = new ApiClient({
  baseURL: 'https://api.mnbara.com',
  timeout: 30000,
  interceptorConfig: {
    enableLogging: true,
    enableRetry: true,
    maxRetries: 3,
  },
  getToken: () => localStorage.getItem('authToken'),
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
| timeout | number | No | Request timeout in milliseconds (default: 30000) |
| headers | Record<string, string> | No | Custom headers to include in all requests |
| interceptorConfig | InterceptorConfig | No | Configuration for built-in interceptors |
| getToken | () => string \| null | No | Function to retrieve authentication token |

### Interceptor Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| enableLogging | boolean | true | Enable request/response logging |
| enableRetry | boolean | true | Enable automatic retry on failure |
| maxRetries | number | 3 | Maximum number of retry attempts |
| retryDelay | number | 1000 | Base delay between retries (ms) |
| onTokenExpired | () => Promise<string \| null> | undefined | Callback for token refresh on 401 |
| onUnauthorized | () => void | undefined | Callback for unauthorized access |

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

The API client includes powerful built-in interceptors for common use cases. For detailed documentation, see [INTERCEPTORS.md](./INTERCEPTORS.md).

### Built-in Interceptors

1. **Request Interceptor** - Adds metadata and logging
2. **Response Interceptor** - Handles errors and implements retry logic
3. **Auth Interceptor** - Automatically adds JWT tokens
4. **Content Type Interceptor** - Ensures proper content type headers
5. **Response Transform Interceptor** - Transforms API responses
6. **Error Transform Interceptor** - Normalizes error format

### Authentication

```typescript
const client = new ApiClient({
  baseURL: 'https://api.mnbara.com',
  getToken: () => localStorage.getItem('authToken'),
  interceptorConfig: {
    onTokenExpired: async () => {
      // Refresh token logic
      const newToken = await refreshAuthToken();
      localStorage.setItem('authToken', newToken);
      return newToken;
    },
    onUnauthorized: () => {
      // Redirect to login
      window.location.href = '/login';
    },
  },
});
```

### Error Handling

```typescript
import { ApiError } from '@mnbara/api-client';

try {
  await client.post('/orders', orderData);
} catch (error) {
  const apiError = error as ApiError;
  console.error(apiError.message);  // User-friendly message
  console.error(apiError.status);   // HTTP status code
  console.error(apiError.details);  // Original error data
}
```

### Retry Logic

The client automatically retries failed requests with exponential backoff:
- 5xx server errors (up to maxRetries)
- Network errors (up to maxRetries)
- Exponential backoff: 1s, 2s, 4s, 8s, etc.

```typescript
const client = new ApiClient({
  baseURL: 'https://api.mnbara.com',
  interceptorConfig: {
    enableRetry: true,
    maxRetries: 5,
    retryDelay: 1000,
  },
});
```

### Custom Interceptors

You can add custom interceptors for specific needs:

```typescript
// Add custom request interceptor
const requestId = client.addRequestInterceptor(
  (config) => {
    config.headers['X-Request-ID'] = generateRequestId();
    return config;
  },
  (error) => Promise.reject(error)
);

// Add custom response interceptor
const responseId = client.addResponseInterceptor(
  (response) => {
    // Custom response handling
    return response;
  },
  (error) => {
    // Custom error handling
    return Promise.reject(error);
  }
);

// Remove interceptors when needed
client.removeRequestInterceptor(requestId);
client.removeResponseInterceptor(responseId);
```

### Using Standalone Interceptors

You can also use interceptors independently with your own Axios instance:

```typescript
import axios from 'axios';
import {
  createRequestInterceptor,
  createResponseInterceptor,
  createAuthInterceptor,
} from '@mnbara/api-client';

const axiosInstance = axios.create({
  baseURL: 'https://api.mnbara.com',
});

// Add interceptors
const requestInterceptor = createRequestInterceptor({ enableLogging: true });
axiosInstance.interceptors.request.use(
  requestInterceptor.onFulfilled,
  requestInterceptor.onRejected
);

const authInterceptor = createAuthInterceptor(() => localStorage.getItem('token'));
axiosInstance.interceptors.request.use(
  authInterceptor.onFulfilled,
  authInterceptor.onRejected
);

const responseInterceptor = createResponseInterceptor({
  enableRetry: true,
  maxRetries: 3,
});
axiosInstance.interceptors.response.use(
  responseInterceptor.onFulfilled,
  responseInterceptor.onRejected
);
```

## License

MIT
