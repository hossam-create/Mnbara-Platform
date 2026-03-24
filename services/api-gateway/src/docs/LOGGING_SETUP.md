# Request/Response Logging Setup

## Overview

The API Gateway implements comprehensive request/response logging with the following features:

- **Structured Logging**: JSON-formatted logs for easy parsing and analysis
- **Multiple Transports**: Console, file, and error-specific logging
- **Sensitive Data Redaction**: Automatic redaction of passwords, tokens, and API keys
- **Performance Tracking**: Request duration and slow request detection
- **Request Correlation**: Unique request IDs for tracing across services
- **Error Tracking**: Detailed error logging with stack traces
- **Contextual Logging**: User ID, service, and action tracking

## Architecture

### Components

1. **Logging Middleware** (`middleware/logging.middleware.ts`)
   - Intercepts all HTTP requests and responses
   - Captures request/response metadata
   - Measures request duration
   - Redacts sensitive data

2. **Logging Configuration** (`config/logging.config.ts`)
   - Centralized logging configuration
   - Environment variable support
   - Configurable log levels and transports

3. **Logger Utilities** (`utils/logger.ts`)
   - Helper functions for structured logging
   - Domain-specific logging methods
   - Performance timing utilities

### Log Files

The logging system creates the following log files in the `logs/` directory:

- **api-gateway.log**: All application logs
- **api-gateway-error.log**: Error-level logs only
- **api-gateway-requests.log**: Request/response logs

Each file is rotated when it reaches 10MB, with up to 5 backup files retained.

## Configuration

### Environment Variables

```bash
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Log request body (true/false)
LOG_REQUEST_BODY=true

# Log response body (true/false)
LOG_RESPONSE_BODY=true

# Log headers (true/false)
LOG_HEADERS=true

# Slow request threshold in milliseconds
SLOW_REQUEST_THRESHOLD=1000
```

### Logging Config File

Edit `src/config/logging.config.ts` to customize:

```typescript
export const loggingConfig: LoggingConfig = {
  level: 'info',
  format: 'json',
  transports: {
    console: true,
    file: true,
    errorFile: true,
    requestFile: true,
  },
  files: {
    general: 'logs/api-gateway.log',
    error: 'logs/api-gateway-error.log',
    requests: 'logs/api-gateway-requests.log',
  },
  maxFileSize: 10485760, // 10MB
  maxFiles: 5,
  redactedFields: [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'cvv',
    'authorization',
    'x-api-key',
    'x-auth-token',
    'cookie',
    'set-cookie',
    'bearer',
    'jwt',
  ],
  logRequestBody: true,
  logResponseBody: true,
  logHeaders: true,
  slowRequestThreshold: 1000,
};
```

## Request Logging

### Request Log Format

```json
{
  "requestId": "gw-550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-22T10:30:45.123Z",
  "method": "POST",
  "path": "/api/orders",
  "query": {},
  "headers": {
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0...",
    "authorization": "[REDACTED]"
  },
  "ip": "192.168.1.100",
  "userId": "user-123",
  "body": {
    "items": [{"id": "item-1", "quantity": 2}],
    "password": "[REDACTED]"
  },
  "contentLength": 256,
  "service": "api-gateway"
}
```

### Request ID Tracking

Every request receives a unique request ID:

- Generated from `X-Request-ID` header if provided
- Otherwise generated as `gw-{uuid}`
- Included in response headers for client tracking
- Used for correlating logs across services

## Response Logging

### Response Log Format

```json
{
  "requestId": "gw-550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-22T10:30:45.456Z",
  "method": "POST",
  "path": "/api/orders",
  "statusCode": 201,
  "statusMessage": "Created",
  "duration": 333,
  "userId": "user-123",
  "responseSize": 512,
  "service": "api-gateway"
}
```

### Log Levels

- **INFO**: Successful requests (2xx, 3xx status codes)
- **WARN**: Client errors (4xx status codes) or slow responses (> 1000ms)
- **ERROR**: Server errors (5xx status codes)

## Sensitive Data Redaction

The logging system automatically redacts the following fields:

- `password`
- `token`
- `secret`
- `apiKey`
- `creditCard`
- `cvv`
- `authorization`
- `x-api-key`
- `x-auth-token`
- `cookie`
- `set-cookie`
- `bearer`
- `jwt`

Redacted values are replaced with `[REDACTED]`.

### Adding Custom Redacted Fields

Edit `src/config/logging.config.ts`:

```typescript
redactedFields: [
  'password',
  'token',
  'secret',
  'apiKey',
  'creditCard',
  'cvv',
  'authorization',
  'x-api-key',
  'x-auth-token',
  'cookie',
  'set-cookie',
  'bearer',
  'jwt',
  'customSensitiveField', // Add custom fields here
],
```

## Using Logger Utilities

### Basic Logging

```typescript
import { logInfo, logWarn, logError } from './utils/logger';

// Log info
logInfo('User logged in', {
  context: { userId: 'user-123', requestId: 'req-456' },
});

// Log warning
logWarn('Rate limit approaching', {
  context: { userId: 'user-123' },
  data: { remaining: 10, limit: 100 },
});

// Log error
logError('Database connection failed', {
  context: { service: 'user-service' },
  error: new Error('Connection timeout'),
});
```

### Performance Timing

```typescript
import { createTimer, logApiCall } from './utils/logger';

const timer = createTimer();

// ... perform operation ...

logApiCall('GET', '/api/users/123', 200, timer.elapsed(), {
  userId: 'user-123',
});
```

### Domain-Specific Logging

```typescript
import {
  logServiceCall,
  logDatabaseOperation,
  logAuthEvent,
  logCircuitBreakerEvent,
} from './utils/logger';

// Service-to-service call
logServiceCall('api-gateway', 'user-service', 'GET', '/users/123', 200, 45, {
  requestId: 'req-456',
});

// Database operation
logDatabaseOperation('INSERT', 'users', 125, 1, {
  userId: 'user-123',
});

// Authentication event
logAuthEvent('login', 'user-123', undefined, {
  requestId: 'req-456',
});

// Circuit breaker event
logCircuitBreakerEvent('payment-service', 'open', 'Too many failures', {
  requestId: 'req-456',
});
```

## Log Analysis

### Viewing Logs

```bash
# View all logs
tail -f logs/api-gateway.log

# View errors only
tail -f logs/api-gateway-error.log

# View requests only
tail -f logs/api-gateway-requests.log

# Search for specific request ID
grep "gw-550e8400-e29b-41d4-a716-446655440000" logs/api-gateway.log

# Search for errors
grep "ERROR" logs/api-gateway.log

# Count requests by status code
grep "statusCode" logs/api-gateway-requests.log | jq '.statusCode' | sort | uniq -c
```

### JSON Log Parsing

```bash
# Pretty print JSON logs
cat logs/api-gateway.log | jq '.'

# Filter by log level
cat logs/api-gateway.log | jq 'select(.level == "error")'

# Filter by user ID
cat logs/api-gateway.log | jq 'select(.userId == "user-123")'

# Calculate average response time
cat logs/api-gateway-requests.log | jq '.duration' | awk '{sum+=$1; count++} END {print sum/count}'
```

## Performance Considerations

### Log File Rotation

- Files are rotated when they reach 10MB
- Up to 5 backup files are retained per log type
- Older files are automatically deleted

### Async Logging

Winston uses async transports by default, so logging doesn't block request processing.

### Sampling

For high-traffic environments, consider implementing log sampling:

```typescript
// Log only 10% of requests
if (Math.random() < 0.1) {
  logInfo('Request', { context: { requestId } });
}
```

## Troubleshooting

### Logs Not Appearing

1. Check `LOG_LEVEL` environment variable
2. Verify `logs/` directory exists and is writable
3. Check file permissions: `chmod 755 logs/`
4. Verify Winston transports are configured

### Sensitive Data Not Redacted

1. Add field name to `redactedFields` in `logging.config.ts`
2. Field names are case-insensitive
3. Nested objects are recursively redacted

### High Disk Usage

1. Reduce `maxFiles` in logging config
2. Increase `maxFileSize` to rotate less frequently
3. Implement log sampling for high-traffic endpoints
4. Use external log aggregation service

## Integration with Monitoring

### Prometheus Metrics

Export logging metrics to Prometheus:

```typescript
import { register, Counter } from 'prom-client';

const requestCounter = new Counter({
  name: 'api_gateway_requests_total',
  help: 'Total API Gateway requests',
  labelNames: ['method', 'path', 'status'],
});

// In logging middleware
requestCounter.inc({
  method: req.method,
  path: req.path,
  status: res.statusCode,
});
```

### ELK Stack Integration

Send logs to Elasticsearch:

```typescript
import * as Elasticsearch from 'winston-elasticsearch';

const esTransport = new Elasticsearch.ElasticsearchTransport({
  level: 'info',
  clientOpts: { node: 'http://localhost:9200' },
  index: 'api-gateway-logs',
});

logger.add(esTransport);
```

### Datadog Integration

```typescript
import { datadog } from 'winston-datadog';

const datadogTransport = new datadog({
  apiKey: process.env.DATADOG_API_KEY,
  service: 'api-gateway',
  env: process.env.NODE_ENV,
});

logger.add(datadogTransport);
```

## Best Practices

1. **Use Request IDs**: Always include request IDs for tracing
2. **Redact Sensitive Data**: Never log passwords, tokens, or API keys
3. **Structured Logging**: Use JSON format for easy parsing
4. **Contextual Information**: Include user ID, service, and action
5. **Performance Tracking**: Log request duration for performance analysis
6. **Error Details**: Include stack traces for debugging
7. **Log Rotation**: Implement file rotation to manage disk space
8. **Monitoring**: Set up alerts for error rates and slow requests

## References

- [Winston Logger Documentation](https://github.com/winstonjs/winston)
- [Structured Logging Best Practices](https://www.kartar.net/2015/12/structured-logging/)
- [Log Aggregation Patterns](https://www.splunk.com/en_us/blog/learn/log-aggregation.html)
