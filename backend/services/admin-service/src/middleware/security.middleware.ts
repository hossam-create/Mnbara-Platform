import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as rateLimit from 'express-rate-limit';
import * as helmet from 'helmet';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private rateLimiter;

  constructor(private readonly logger: LoggerService) {
    // Rate limiting configuration
    this.rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply helmet security headers
    helmet()(req, res, () => {});

    // Apply rate limiting
    this.rateLimiter(req, res, () => {});

    // Log security events
    if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
      this.logger.logSecurity({
        event: 'sensitive_endpoint_access',
        severity: 'low',
        ipAddress: req.ip,
        details: {
          path: req.path,
          method: req.method,
        },
      });
    }

    // Input sanitization
    this.sanitizeInput(req);

    next();
  }

  private sanitizeInput(req: Request) {
    // Basic XSS protection
    if (req.body) {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
      });
    }
  }
}

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean);

    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  }
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      this.logger.logAPI({
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: duration,
        userId: (req as any).user?.sub,
      });
    });

    next();
  }
}
