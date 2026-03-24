# API Client Interceptors

This document describes the request and response interceptors available in the `@mnbara/api-client` package.

## Overview

Interceptors allow you to intercept and modify HTTP requests and responses before they are handled by the application. The API client provides several pre-built interceptors for common use cases.

## Available Interceptors

### 1. Request Interceptor

Adds metadata and logging to outgoing requests.

```typescript
import { createRequestInterceptor } from '@mnbara/api-client';

const interceptor = createRequestInterceptor({
  enableLogging: true,
});

// Use with axios instance
axiosInstance.interceptors.request.use(
  interceptor.onFulfilled,
  interceptor.onRejected
);
```

**Features:**
- Adds timestamp metadata for performance tracking
- Logs request method, URL, and data
- Tracks retry count for failed requests

**Configuration:**
```typescript
interface InterceptorConfig {
  enableLogging?: boolean;  // Default: true
}
```

### 2. Response Interceptor

Handles responses, errors, and implements retry logic.

```typescript
import { createResponseInterceptor } from '@mnbara/api-client';

const interceptor = createResponseInterceptor({
  enableLogging: true,
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  onTokenExpired: async () => {
    // Refresh token logic
    return newToken;
  },
  onUnauthorized: () => {
    // Redirect to login
    window.location.href = '/login';
  },
});

axiosInstance.interceptors.response.use(
  interceptor.onFulfilled,
  interceptor.onRejected
);
```

**Features:**
- Logs response time and status
- Handles 401 (Unauthorized) with token refresh
- Handles 403 (Forbidden), 404 (Not Found), 429 (Rate Limit)
- Automatic retry for 5xx server errors
- Automatic retry for network errors
- Exponential backoff for retries

**Configuration:**
```typescript
interface InterceptorConfig {
  enableLogging?: boolean;      // Default: true
  enableRetry?: boolean;         // Default: true
  maxRetries?: number;           // Default: 3
  retryDelay?: number;           // Default: 1000ms
  onTokenExpired?: () => Promise<string | null>;
  onUnauthorized?: () => void;
}
```

### 3. Auth Interceptor

Automatically adds JWT tokens to requests.

```typescript
import { createAuthInterceptor } from '@mnbara/api-client';

const getToken = () => localStorage.getItem('authToken');

const interceptor = createAuthInterceptor(getToken);

axiosInstance.interceptors.request.use(
  interceptor.onFulfilled,
  interceptor.onRejected
);
```

**Features:**
- Adds `Authorization: Bearer <token>` header
- Only adds header when token is available
- Calls token getter function on each request

### 4. Content Type Interceptor

Ensures proper Content-Type headers.

```typescript
import { createContentTypeInterceptor } from '@mnbara/api-client';

const interceptor = createContentTypeInterceptor();

axiosInstance.interceptors.request.use(
  interceptor.onFulfilled,
  interceptor.onRejected
);
```

**Features:**
- Sets `Content-Type: application/json` for JSON data
- Removes Content-Type for FormData (browser sets it with boundary)
- Preserves existing Content-Type if already set

### 5. Response Transform Interceptor

Transforms API responses into desired format.

```typescript
import { createResponseTransformInterceptor } from '@mnbara/api-client';

const transform = (data: any) => ({
  ...data,
  timestamp: new Date().toISOString(),
});

const interceptor = createResponseTransformInterceptor(transform);

axiosInstance.interceptors.response.use(
  interceptor.onFulfilled,
  interceptor.onRejected
);
```

**Features:**
- Applies custom transformation to response data
- Useful for normalizing API responses
- Can add computed fields or metadata

### 6. Error Transform Interceptor

Transforms errors into consistent format.

```typescript
import { createErrorTransformInterceptor, ApiError } from '@mnbara/api-client';

const interceptor = createErrorTransformInterceptor();

axiosInstance.interceptors.response.use(
  interceptor.onFulfilled,
  interceptor.onRejected
);

// Catch transformed errors
try {
  await apiClient.get('/endpoint');
} catch (error) {
  const apiError = error as ApiError;
  console.log(apiError.message);  // User-friendly message
  console.log(apiError.status);   // HTTP status code
  console.log(apiError.details);  // Original error data
}
```

**Features:**
- Transforms all errors into consistent `ApiError` format
- Provides user-friendly error messages
- Includes HTTP status code and original error details
- Handles server errors, network errors, and request setup errors

**ApiError Interface:**
```typescript
interface ApiError {
  message: string;    // User-friendly error message
  status?: number;    // HTTP status code (if available)
  code?: string;      // Error code (if provided by API)
  details?: unknown;  // Original error data
}
```

## Usage with ApiClient

The `ApiClient` class automatically sets up interceptors:

```typescript
import { ApiClient } from '@mnbara/api-client';

const client = new ApiClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  interceptorConfig: {
    enableLogging: true,
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    onTokenExpired: async () => {
      // Refresh token
      const newToken = await refreshAuthToken();
      return newToken;
    },
    onUnauthorized: () => {
      // Redirect to login
      window.location.href = '/login';
    },
  },
  getToken: () => localStorage.getItem('authToken'),
});
```

## Custom Interceptors

You can also add custom interceptors:

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

## Retry Logic

The response interceptor implements exponential backoff for retries:

- **First retry:** Wait 1 second (1000ms × 2^0)
- **Second retry:** Wait 2 seconds (1000ms × 2^1)
- **Third retry:** Wait 4 seconds (1000ms × 2^2)

Retries are triggered for:
- 5xx server errors (500, 502, 503, 504)
- Network errors (no response received)

Retries are NOT triggered for:
- 4xx client errors (400, 401, 403, 404, etc.)
- Successful responses (2xx, 3xx)

## Error Handling Flow

```
Request Error
    ↓
Response Interceptor
    ↓
Is 401? → Token Refresh → Retry Request
    ↓
Is 5xx? → Retry with Backoff (up to maxRetries)
    ↓
Network Error? → Retry with Backoff (up to maxRetries)
    ↓
Transform Error → ApiError
    ↓
Reject Promise
```

## Best Practices

1. **Enable logging in development, disable in production:**
   ```typescript
   enableLogging: process.env.NODE_ENV === 'development'
   ```

2. **Implement token refresh for 401 errors:**
   ```typescript
   onTokenExpired: async () => {
     const newToken = await refreshToken();
     localStorage.setItem('authToken', newToken);
     return newToken;
   }
   ```

3. **Handle unauthorized access:**
   ```typescript
   onUnauthorized: () => {
     localStorage.removeItem('authToken');
     window.location.href = '/login';
   }
   ```

4. **Adjust retry settings based on use case:**
   - Critical operations: Higher maxRetries (5-10)
   - Background tasks: Lower maxRetries (1-3)
   - Real-time operations: Disable retry

5. **Use error transform for consistent error handling:**
   ```typescript
   try {
     await apiClient.post('/endpoint', data);
   } catch (error) {
     const apiError = error as ApiError;
     showNotification(apiError.message);
   }
   ```

## Testing

All interceptors are fully tested. See `src/__tests__/interceptors.test.ts` for examples.

```typescript
import { createRequestInterceptor } from '@mnbara/api-client';

describe('Request Interceptor', () => {
  it('should add metadata to request', () => {
    const interceptor = createRequestInterceptor();
    const config = { url: '/test', method: 'GET' };
    const result = interceptor.onFulfilled(config);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata.startTime).toBeInstanceOf(Date);
  });
});
```

## TypeScript Support

All interceptors are fully typed with TypeScript:

```typescript
import {
  InterceptorConfig,
  ApiError,
  createRequestInterceptor,
  createResponseInterceptor,
} from '@mnbara/api-client';

const config: InterceptorConfig = {
  enableLogging: true,
  maxRetries: 3,
};

const requestInterceptor = createRequestInterceptor(config);
const responseInterceptor = createResponseInterceptor(config);
```

## License

MIT
