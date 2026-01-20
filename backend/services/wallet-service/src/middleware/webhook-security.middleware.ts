import { Request, Response, NextFunction } from 'express';

const hits = new Map<string, number>();
const RESET_INTERVAL = 60 * 1000; // 1 minute

// Cleanup interval
setInterval(() => hits.clear(), RESET_INTERVAL);

/**
 * Simple In-Memory Rate Limiter for Webhooks
 * Configured for 60 requests per minute per IP.
 * In production, use Redis-based limiter (e.g. rate-limiter-flexible).
 */
export const webhookRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Use X-Forwarded-For if behind proxy, or req.ip
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  
  const count = hits.get(ip) || 0;
  
  if (count >= 60) {
    res.status(429).json({ 
      success: false, 
      error: 'Too many requests. Please retry later.' 
    });
    return;
  }
  
  hits.set(ip, count + 1);
  next();
};
