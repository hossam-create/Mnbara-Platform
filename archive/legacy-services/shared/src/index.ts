// Shared utilities and middleware for mnbarh platform services

export * from './middleware/auth.middleware';
export * from './utils/env-validator';

// Health check utility
export const createHealthCheck = (serviceName: string) => {
  return (req: any, res: any) => {
    res.json({
      status: 'ok',
      service: serviceName,
      timestamp: new Date().toISOString()
    });
  };
};

// Common error handler
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

console.log('Shared utilities loaded');