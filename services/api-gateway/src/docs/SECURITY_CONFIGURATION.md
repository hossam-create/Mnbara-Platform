# API Gateway Security Configuration

## Overview

This document describes the CORS and security headers configuration for the Mnbara API Gateway. The gateway implements industry-standard security practices to protect against common web vulnerabilities.

## CORS Configuration

### What is CORS?

Cross-Origin Resource Sharing (CORS) is a mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the first resource was served.

### Configuration

The CORS middleware is configured in `src/middleware/cors.middleware.ts` and supports:

#### Allowed Origins

Origins can be configured via the `CORS_ORIGIN` environment variable:

```bash
# Single origin
CORS_ORIGIN=https://example.com

# Multiple origins (comma-separated)
CORS_ORIGIN=https://example.com,https://app.example.com,http://localhost:3000

# All origins (development only)
CORS_ORIGIN=*
```

#### Allowed Methods

The following HTTP methods are allowed:
- GET
- POST
- PUT
- DELETE
- PATCH
- OPTIONS
- HEAD

#### Allowed Headers

Requests can include the following headers:
- `Content-Type`
- `Authorization`
- `X-Request-ID`
- `X-Correlation-ID`
- `Accept`
- `Accept-Language`
- `Content-Language`
- `Last-Event-ID`

#### Exposed Headers

The following headers are exposed to the client:
- `X-Request-ID`
- `X-Correlation-ID`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After`

#### Credentials

Credentials (cookies, authorization headers) are allowed in cross-origin requests:

```typescript
credentials: true
```

#### Preflight Cache

Preflight requests are cached for 24 hours (86400 seconds):

```typescript
maxAge: 86400
```

### Environment Variables

```bash
# CORS configuration
CORS_ORIGIN=https://example.com,https://app.example.com
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400
```

### Development vs Production

#### Development
- Origins: `*` (all origins allowed)
- Credentials: true
- CSP: disabled

#### Production
- Origins: Specific whitelisted domains
- Credentials: true
- CSP: enabled with strict directives

## Security Headers

### Overview

Security headers are HTTP response headers that instruct browsers on how to behave when handling your site's content. They help protect against various attacks.

### Implemented Headers

#### 1. X-Frame-Options

**Purpose:** Prevent clickjacking attacks

**Value:** `DENY`

**Meaning:** The page cannot be displayed in a frame, regardless of which site is attempting to do so.

```
X-Frame-Options: DENY
```

#### 2. X-Content-Type-Options

**Purpose:** Prevent MIME type sniffing

**Value:** `nosniff`

**Meaning:** The browser must not sniff the MIME type and must use the type specified in the Content-Type header.

```
X-Content-Type-Options: nosniff
```

#### 3. X-XSS-Protection

**Purpose:** Legacy XSS protection (deprecated but still useful for older browsers)

**Value:** `1; mode=block`

**Meaning:** Enable XSS protection and block the page if an attack is detected.

```
X-XSS-Protection: 1; mode=block
```

#### 4. Strict-Transport-Security (HSTS)

**Purpose:** Force HTTPS connections

**Development Value:**
```
Strict-Transport-Security: max-age=3600
```

**Production Value:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Parameters:**
- `max-age`: Time in seconds to remember HTTPS requirement
- `includeSubDomains`: Apply to all subdomains
- `preload`: Allow inclusion in HSTS preload list

#### 5. Content-Security-Policy (CSP)

**Purpose:** Restrict resource loading to prevent XSS attacks

**Enabled in:** Production only

**Directives:**
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
font-src 'self' data:
connect-src 'self' https:
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

**Note:** Adjust `script-src` and `style-src` based on your application's needs. Remove `'unsafe-inline'` and `'unsafe-eval'` if possible.

#### 6. Referrer-Policy

**Purpose:** Control how much referrer information is shared

**Value:** `strict-origin-when-cross-origin`

**Meaning:** Send full referrer for same-origin requests, only origin for cross-origin requests.

```
Referrer-Policy: strict-origin-when-cross-origin
```

#### 7. Permissions-Policy (formerly Feature-Policy)

**Purpose:** Control which browser features can be used

**Disabled Features:**
- accelerometer
- ambient-light-sensor
- autoplay
- battery
- camera
- display-capture
- document-domain
- encrypted-media
- execution-while-not-rendered
- execution-while-out-of-viewport
- fullscreen
- geolocation
- gyroscope
- magnetometer
- microphone
- midi
- navigation-override
- payment
- picture-in-picture
- publickey-credentials-get
- speaker-selection
- sync-xhr
- usb
- vr
- xr-spatial-tracking

```
Permissions-Policy: accelerometer=(), ambient-light-sensor=(), ...
```

#### 8. Server Header

**Purpose:** Hide server information to prevent information disclosure

**Value:** `Mnbara-API-Gateway`

```
Server: Mnbara-API-Gateway
```

### Environment Variables

```bash
# Security headers configuration
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

## Testing CORS

### Using curl

```bash
# Preflight request
curl -X OPTIONS http://localhost:3000/api/users \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Actual request
curl -X GET http://localhost:3000/api/users \
  -H "Origin: http://localhost:3001" \
  -v
```

### Using browser console

```javascript
// Test CORS from browser
fetch('http://localhost:3000/api/users', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('CORS error:', error));
```

## Testing Security Headers

### Using curl

```bash
curl -I http://localhost:3000/api/users
```

### Using online tools

- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

### Expected headers

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

## Troubleshooting

### CORS Errors

**Error:** `Access to XMLHttpRequest at 'http://localhost:3000/api/users' from origin 'http://localhost:3001' has been blocked by CORS policy`

**Solution:**
1. Check that the origin is in the `CORS_ORIGIN` environment variable
2. Verify the request includes the `Origin` header
3. Check that the request method is in the allowed methods list
4. Verify the request headers are in the allowed headers list

### CSP Violations

**Error:** `Refused to load the script 'https://example.com/script.js' because it violates the following Content Security Policy directive`

**Solution:**
1. Add the source to the appropriate CSP directive
2. Use nonces or hashes instead of `'unsafe-inline'`
3. Consider using a CSP report-only mode for testing

### HSTS Issues

**Error:** `HSTS policy prevents connection to non-HTTPS site`

**Solution:**
1. Ensure the site is served over HTTPS
2. Clear browser HSTS cache
3. Use `max-age=0` to remove HSTS policy

## Best Practices

1. **Always use HTTPS in production** - HSTS requires HTTPS
2. **Whitelist specific origins** - Avoid using `*` in production
3. **Use CSP** - Implement Content-Security-Policy to prevent XSS
4. **Test security headers** - Use online tools to verify configuration
5. **Monitor CORS errors** - Log and monitor CORS-related errors
6. **Update regularly** - Keep security headers up-to-date with best practices
7. **Document exceptions** - Document any exceptions to security policies

## References

- [OWASP CORS](https://owasp.org/www-community/Cross-Origin_Resource_Sharing_(CORS))
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Glossary/Response_header)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)

## Support

For questions or issues related to CORS and security headers configuration, please contact the platform team.
