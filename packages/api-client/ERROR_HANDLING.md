# Error Handling and Retry Logic

The `@mnbara/api-client` package provides comprehensive error handling and automatic retry logic for failed requests.

## Features

### 1. Automatic Retry Logic

The client automatically retries failed requests based on configurable rules:

- **Network Errors**: Automatically retried (connection failures, timeouts)
- **Server Errors (5xx)**: Automatically retried (500, 502, 503, 504)
- **Rate Limiting (429)**: Automatically retried with respect to `Retry-After` header
- **Request Timeout (408)**: Automatically retried
- **Client Errors (4xx)**: NOT retried by default (except 408 and 429)

### 2. Exponential Backoff

Retry delays use exponential backoff with jitter to prevent thundering herd:

```
Retry 1: ~100ms + jitter
Retry 2: ~200ms + jitter
Retry 3: ~400ms + jitter
```

Jitter adds up to 30% random delay to prevent synchronized retries.

### 3. Token Refresh on 401

Automatically attempts to refresh expired tokens and retry the request:

```typescript
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    onTokenExpired: async () => {
      // Refresh token logic
      const newToken = await refreshToken();
      return newToken;
    },
    onUnauthorized: () => {
      // Redirect to login or show error
      window.location.href = '/login';
    },
  },
});
```

### 4. Error Transformation

All errors are transformed into a consistent format:

```typescript
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}
```

## Configuration

### Basic Configuration

```typescript
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000, // Base delay in milliseconds
  },
});
```

### Advanced Configuration

```typescript
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    enableLogging: true,
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    
    // Custom retryable status codes
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    
    // Custom retry logic
    shouldRetry: (error: AxiosError) => {
      // Custom logic to determine if request should be retried
      return error.response?.status === 418; // Retry on "I'm a teapot"
    },
    
    // Token refresh callback
    onTokenExpired: async () => {
      const newToken = await refreshToken();
      return newToken;
    },
    
    // Unauthorized callback
    onUnauthorized: () => {
      window.location.href = '/login';
    },
    
    // Error callback
    onError: (error: ApiError) => {
      console.error('API Error:', error);
      // Send to error tracking service
      trackError(error);
    },
  },
});
```

## Usage Examples

### Example 1: Basic Error Handling

```typescript
try {
  const data = await client.get('/users');
  console.log('Users:', data);
} catch (error) {
  const apiError = error as ApiError;
  
  if (apiError.status === 404) {
    console.error('Users not found');
  } else if (apiError.code === 'NETWORK_ERROR') {
    console.error('Network error - please check your connection');
  } else {
    console.error('Error:', apiError.message);
  }
}
```

### Example 2: Handling Validation Errors

```typescript
try {
  await client.post('/users', userData);
} catch (error) {
  const apiError = error as ApiError;
  
  if (apiError.status === 400 && apiError.details) {
    const validationErrors = apiError.details as {
      errors: Array<{ field: string; message: string }>;
    };
    
    validationErrors.errors.forEach((err) => {
      console.error(`${err.field}: ${err.message}`);
    });
  }
}
```

### Example 3: Custom Retry Logic

```typescript
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    shouldRetry: (error: AxiosError) => {
      // Only retry on specific error codes
      const errorCode = (error.response?.data as { code?: string })?.code;
      return errorCode === 'TEMPORARY_ERROR';
    },
  },
});
```

### Example 4: Disable Retry for Specific Request

```typescript
// Retry is enabled by default, but you can disable it per request
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    enableRetry: false, // Disable retry globally
  },
});

// Or use custom config per request
const axiosInstance = client.getAxiosInstance();
axiosInstance.get('/users', {
  // Custom config for this request
});
```

### Example 5: Token Refresh Flow

```typescript
let currentToken = 'initial-token';

const client = new ApiClient({
  baseURL: 'https://api.example.com',
  getToken: () => currentToken,
  interceptorConfig: {
    onTokenExpired: async () => {
      try {
        // Call refresh token endpoint
        const response = await fetch('/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
          },
        });
        
        const data = await response.json();
        currentToken = data.token;
        
        return currentToken;
      } catch (error) {
        return null; // Refresh failed
      }
    },
    onUnauthorized: () => {
      // Clear token and redirect to login
      currentToken = '';
      window.location.href = '/login';
    },
  },
});
```

### Example 6: Error Tracking Integration

```typescript
import * as Sentry from '@sentry/browser';

const client = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    onError: (error: ApiError) => {
      // Send to Sentry
      Sentry.captureException(error, {
        tags: {
          status: error.status,
          code: error.code,
        },
        extra: {
          details: error.details,
        },
      });
    },
  },
});
```

## Error Types

### Network Errors

```typescript
{
  message: 'Network error - please check your connection',
  code: 'NETWORK_ERROR'
}
```

### Server Errors (5xx)

```typescript
{
  message: 'Internal Server Error',
  status: 500,
  code: 'SERVER_ERROR',
  details: { /* server response */ }
}
```

### Client Errors (4xx)

```typescript
{
  message: 'Bad Request',
  status: 400,
  code: 'VALIDATION_ERROR',
  details: {
    errors: [
      { field: 'email', message: 'Invalid email' }
    ]
  }
}
```

### Authentication Errors (401)

```typescript
{
  message: 'Unauthorized',
  status: 401,
  code: 'UNAUTHORIZED'
}
```

### Rate Limiting (429)

```typescript
{
  message: 'Too Many Requests',
  status: 429,
  code: 'RATE_LIMIT_EXCEEDED'
}
```

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad
const data = await client.get('/users');

// ✅ Good
try {
  const data = await client.get('/users');
} catch (error) {
  handleError(error);
}
```

### 2. Use Specific Error Handling

```typescript
try {
  const data = await client.get('/users');
} catch (error) {
  const apiError = error as ApiError;
  
  switch (apiError.status) {
    case 400:
      handleValidationError(apiError);
      break;
    case 401:
      handleUnauthorized();
      break;
    case 404:
      handleNotFound();
      break;
    default:
      handleGenericError(apiError);
  }
}
```

### 3. Configure Retry Appropriately

```typescript
// For critical operations, increase retries
const criticalClient = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    maxRetries: 5,
    retryDelay: 2000,
  },
});

// For non-critical operations, disable retry
const nonCriticalClient = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    enableRetry: false,
  },
});
```

### 4. Implement Token Refresh

```typescript
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    onTokenExpired: async () => {
      // Implement token refresh logic
      return await refreshToken();
    },
    onUnauthorized: () => {
      // Handle unauthorized access
      redirectToLogin();
    },
  },
});
```

### 5. Monitor Errors

```typescript
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  interceptorConfig: {
    onError: (error: ApiError) => {
      // Log to monitoring service
      logError(error);
      
      // Track metrics
      trackMetric('api_error', {
        status: error.status,
        code: error.code,
      });
    },
  },
});
```

## Testing

See `__tests__/error-handling.test.ts` and `__tests__/auth-error-handling.test.ts` for comprehensive test examples.

## Related Documentation

- [Interceptors Documentation](./INTERCEPTORS.md)
- [API Client README](./README.md)
