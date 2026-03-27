# CORS and Security Headers Implementation - Task 5.1.3

## Overview

This document summarizes the implementation of CORS (Cross-Origin Resource Sharing) and security headers for the Mnbara API Gateway as part of Phase 5: Integration & Testing.

## Implementation Summary

### Files Created

1. **`src/middleware/cors.middleware.ts`**
   - CORS middleware factory with configurable origins
   - Support for multiple origins (dev, staging, prod)
   - Proper origin validation
   - CORS error handler

2. **`src/middleware/security-headers.middleware.ts`**
   - Security headers middleware implementing OWASP best practices
   - Environment-aware configuration
   - Support for all major security headers

3. **`src/docs/SECURITY_CONFIGURATION.md`**
   - Comprehensive documentation of CORS and security headers
   - Configuration examples for all environments
   - Testing procedures and troubleshooting guide

### Files Modified

1. **`src/config/index.ts`**
   - Added CORS configuration options
   - Added security headers configuration options
   - New environment variables for fine-tuning

2. **`src/index.ts`**
   - Integrated CORS middleware
   - Integrated security headers middleware
   - Proper middleware ordering

## CORS Configuration

### Features

- **Multiple Origin Support**: Configure different origins for dev, staging, and production
- **Flexible Configuration**: Comma-separated origins or wildcard support
- **Proper Headers**: Supports all standard CORS headers
- **Credentials Support**: Allows credentials in cross-origin requests
- **Preflight Caching**: 24-hour cache for preflight requests

### Environment Variables

```bash
# Single origin
CORS_ORIGIN=https://example.com

# Multiple origins
CORS_ORIGIN=https://example.com,https://app.example.com

# All origins (development)
CORS_ORIGIN=*

# Additional options
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400
```

### Allowed Methods

- GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD

### Allowed Headers

- Content-Type
- Authorization
- X-Request-ID
- X-Correlation-ID
- Accept
- Accept-Language
- Content-Language
- Last-Event-ID

### Exposed Headers

- X-Request-ID
- X-Correlation-ID
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset
- Retry-After

## Security Headers Implementation

### Headers Implemented

1. **X-Frame-Options: DENY**
   - Prevents clickjacking attacks
   - Page cannot be displayed in frames

2. **X-Content-Type-Options: nosniff**
   - Prevents MIME type sniffing
   - Browser must use Content-Type header

3. **X-XSS-Protection: 1; mode=block**
   - Legacy XSS protection
   - Blocks page if attack detected

4. **Strict-Transport-Security**
   - Development: `max-age=3600`
   - Production: `max-age=31536000; includeSubDomains; preload`
   - Forces HTTPS connections

5. **Content-Security-Policy** (Production only)
   - Restricts resource loading
   - Prevents XSS attacks
   - Configurable directives

6. **Referrer-Policy: strict-origin-when-cross-origin**
   - Controls referrer information sharing
   - Full referrer for same-origin
   - Origin-only for cross-origin

7. **Permissions-Policy**
   - Disables unnecessary browser features
   - Includes: camera, microphone, geolocation, etc.

8. **Server Header: Mnbara-API-Gateway**
   - Hides server information
   - Prevents information disclosure

### Environment Variables

```bash
ENABLE_SECURITY_HEADERS=true
HSTS_MAX_AGE=31536000
ENABLE_CSP=true
```

## Configuration by Environment

### Development

```bash
NODE_ENV=development
CORS_ORIGIN=*
ENABLE_SECURITY_HEADERS=true
HSTS_MAX_AGE=3600
ENABLE_CSP=false
```

### Staging

```bash
NODE_ENV=staging
CORS_ORIGIN=https://staging.example.com,https://app-staging.example.com
ENABLE_SECURITY_HEADERS=true
HSTS_MAX_AGE=86400
ENABLE_CSP=true
```

### Production

```bash
NODE_ENV=production
CORS_ORIGIN=https://example.com,https://app.example.com
ENABLE_SECURITY_HEADERS=true
HSTS_MAX_AGE=31536000
ENABLE_CSP=true
```

## Middleware Integration

### Middleware Order

The middleware is registered in the following order in `src/index.ts`:

1. **Helmet** - Basic security headers
2. **Security Headers Middleware** - Custom security headers
3. **CORS Middleware** - CORS configuration
4. **CORS Error Handler** - CORS error handling
5. **Compression** - Response compression
6. **Body Parsing** - JSON/URL-encoded parsing
7. **Request ID** - Request tracking
8. **Logging** - Request logging
9. **Rate Limiting** - Rate limiting
10. **Routes** - API routes

### Code Example

```typescript
// Security middleware
app.use(helmet());

// Security headers middleware
if (config.enableSecurityHeaders) {
  app.use(securityHeadersMiddleware);
}

// CORS configuration
app.use(corsMiddleware());

// CORS error handler
app.use(corsErrorHandler);
```

## Testing

### CORS Testing

```bash
# Preflight request
curl -X OPTIONS http://localhost:3000/api/users \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Actual request
curl -X GET http://localhost:3000/api/users \
  -H "Origin: http://localhost:3001" \
  -v
```

### Security Headers Testing

```bash
# Check headers
curl -I http://localhost:3000/api/users

# Online tools
# - https://securityheaders.com/
# - https://observatory.mozilla.org/
```

### Expected Response Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), ...
Server: Mnbara-API-Gateway
```

## Success Criteria Met

✅ CORS middleware properly configured
✅ Security headers middleware implemented
✅ Configuration supports multiple origins (dev, staging, prod)
✅ All middleware properly registered in the application
✅ Documentation updated with comprehensive guide

## Files Structure

```
services/api-gateway/
├── src/
│   ├── middleware/
│   │   ├── cors.middleware.ts (NEW)
│   │   ├── security-headers.middleware.ts (NEW)
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── logging.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── routing.middleware.ts
│   ├── config/
│   │   └── index.ts (MODIFIED)
│   ├── docs/
│   │   ├── SECURITY_CONFIGURATION.md (NEW)
│   │   └── ROUTING_GUIDE.md
│   └── index.ts (MODIFIED)
└── CORS_SECURITY_HEADERS_IMPLEMENTATION.md (NEW)
```

## Next Steps

1. **Testing**: Run the API gateway and verify CORS and security headers are applied
2. **Validation**: Use online tools to validate security headers
3. **Documentation**: Review and update environment configuration documentation
4. **Deployment**: Deploy to development, staging, and production environments

## References

- [OWASP CORS](https://owasp.org/www-community/Cross-Origin_Resource_Sharing_(CORS))
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)

## Completion Status

**Task 5.1.3: Configure CORS and security headers** - COMPLETED

All requirements have been implemented:
- ✅ CORS middleware configured with origin validation
- ✅ Security headers middleware implemented
- ✅ Support for multiple origins (dev, staging, prod)
- ✅ All middleware properly registered
- ✅ Comprehensive documentation provided
