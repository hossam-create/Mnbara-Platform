import { Request, Response, NextFunction } from 'express';
import { recordHttpRequest } from '../utils/metrics';

/**
 * Middleware to record HTTP request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Record metrics after response is sent
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    
    recordHttpRequest(req.method, route, res.statusCode, duration);
  });

  next();
};
