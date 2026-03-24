import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Security Headers Configuration
 * Implements OWASP security best practices
 */
interface SecurityHeadersConfig {
  // X-Frame-Options: Prevent clickjacking
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  
  // X-Content-Type-Options: Prevent MIME type sniffing
  contentTypeOptions: 'nosniff';
  
  // X-XSS-Protection: Legacy XSS protection (deprecated but still useful)
  xssProtection: string;
  
  // Strict-Transport-Security: Force HTTPS
  hsts: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  
  // Content-Security-Policy: Restrict resource loading
  csp: {
    enabled: boolean;
    directives: Record<string, string>;
  };
  
  // Referrer-Policy: Control referrer information
  referrerPolicy: string;
  
  // Permissions-Policy: Control browser features
  permissionsPolicy: Record<string, string[]>;
}

/**
 * Get security headers configuration based on environment
 */
const getSecurityHeadersConfig = (): SecurityHeadersConfig => {
  const nodeEnv = config.nodeEnv;
  const isProduction = nodeEnv === 'production';
  
  return {
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    xssProtection: '1; mode=block',
    hsts: {
      maxAge: isProduction ? 31536000 : 3600, // 1 year in prod, 1 hour in dev
      includeSubDomains: isProduction,
      preload: isProduction,
    },
    csp: {
      enabled: isProduction,
      directives: {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on needs
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
        'font-src': "'self' data:",
        'connect-src': "'self' https:",
        'frame-ancestors': "'none'",
        'base-uri': "'self'",
        'form-action': "'self'",
      },
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      'accelerometer': [],
      'ambient-light-sensor': [],
      'autoplay': [],
      'battery': [],
      'camera': [],
      'display-capture': [],
      'document-domain': [],
      'encrypted-media': [],
      'execution-while-not-rendered': [],
      'execution-while-out-of-viewport': [],
      'fullscreen': [],
      'geolocation': [],
      'gyroscope': [],
      'magnetometer': [],
      'microphone': [],
      'midi': [],
      'navigation-override': [],
      'payment': [],
      'picture-in-picture': [],
      'publickey-credentials-get': [],
      'speaker-selection': [],
      'sync-xhr': [],
      'usb': [],
      'vr': [],
      'xr-spatial-tracking': [],
    },
  };
};

/**
 * Format Permissions-Policy header value
 */
const formatPermissionsPolicy = (policies: Record<string, string[]>): string => {
  return Object.entries(policies)
    .map(([feature, allowlist]) => {
      if (allowlist.length === 0) {
        return `${feature}=()`;
      }
      return `${feature}=(${allowlist.join(' ')})`;
    })
    .join(', ');
};

/**
 * Format CSP header value
 */
const formatCSP = (directives: Record<string, string>): string => {
  return Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');
};

/**
 * Security headers middleware
 * Applies security headers to all responses
 */
export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const config = getSecurityHeadersConfig();
  
  // X-Frame-Options: Prevent clickjacking
  res.setHeader('X-Frame-Options', config.frameOptions);
  
  // X-Content-Type-Options: Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', config.contentTypeOptions);
  
  // X-XSS-Protection: Legacy XSS protection
  res.setHeader('X-XSS-Protection', config.xssProtection);
  
  // Strict-Transport-Security: Force HTTPS
  const hstsValue = [
    `max-age=${config.hsts.maxAge}`,
    config.hsts.includeSubDomains ? 'includeSubDomains' : '',
    config.hsts.preload ? 'preload' : '',
  ]
    .filter(Boolean)
    .join('; ');
  res.setHeader('Strict-Transport-Security', hstsValue);
  
  // Content-Security-Policy
  if (config.csp.enabled) {
    res.setHeader('Content-Security-Policy', formatCSP(config.csp.directives));
  }
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', config.referrerPolicy);
  
  // Permissions-Policy (formerly Feature-Policy)
  res.setHeader('Permissions-Policy', formatPermissionsPolicy(config.permissionsPolicy));
  
  // Additional security headers
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Remove server header to avoid information disclosure
  res.removeHeader('Server');
  res.setHeader('Server', 'Mnbara-API-Gateway');
  
  next();
};

export default securityHeadersMiddleware;
