/**
 * Request Validation Middleware
 * Validates incoming requests against defined schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Common validation schemas
 */
export const schemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),

  // UUID parameter
  uuidParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  // Search query
  searchQuery: z.object({
    q: z.string().min(1).max(200),
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    condition: z.enum(['new', 'like_new', 'good', 'fair']).optional(),
  }),

  // Bid submission
  bidSubmission: z.object({
    amount: z.number().positive('Bid amount must be positive'),
    isProxy: z.boolean().optional(),
    maxAmount: z.number().positive().optional(),
  }),

  // Order creation
  orderCreation: z.object({
    listingId: z.string().uuid(),
    quantity: z.number().int().min(1).default(1),
    shippingAddressId: z.string().uuid().optional(),
    paymentMethodId: z.string().optional(),
    useEscrow: z.boolean().optional(),
  }),

  // Trip creation
  tripCreation: z.object({
    origin: z.string().min(1),
    destination: z.string().min(1),
    departAt: z.string().datetime(),
    arriveAt: z.string().datetime(),
    capacityKg: z.number().positive(),
  }),

  // Location update
  locationUpdate: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().positive().optional(),
  }),
};

/**
 * Format Zod validation errors
 */
const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  
  return errors;
};

/**
 * Create validation middleware for request body
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        res.status(422).json({
          error: 'Validation Error',
          message: 'Request body validation failed',
          details: formatZodErrors(result.error),
        });
        return;
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request body',
      });
    }
  };
};

/**
 * Create validation middleware for query parameters
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        res.status(422).json({
          error: 'Validation Error',
          message: 'Query parameter validation failed',
          details: formatZodErrors(result.error),
        });
        return;
      }
      
      req.query = result.data as any;
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid query parameters',
      });
    }
  };
};

/**
 * Create validation middleware for URL parameters
 */
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        res.status(422).json({
          error: 'Validation Error',
          message: 'URL parameter validation failed',
          details: formatZodErrors(result.error),
        });
        return;
      }
      
      req.params = result.data as any;
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid URL parameters',
      });
    }
  };
};

/**
 * Basic request sanitization
 */
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove potentially dangerous headers
  delete req.headers['x-forwarded-host'];
  
  // Limit body size check (should also be done at nginx/load balancer level)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxBodySize = parseInt(process.env.MAX_BODY_SIZE || '10485760', 10); // 10MB default
  
  if (contentLength > maxBodySize) {
    res.status(413).json({
      error: 'Payload Too Large',
      message: `Request body exceeds maximum size of ${maxBodySize} bytes`,
    });
    return;
  }
  
  next();
};

/**
 * Content-Type validation
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }
    
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type header is required',
      });
      return;
    }
    
    const isAllowed = allowedTypes.some((type) => contentType.includes(type));
    
    if (!isAllowed) {
      res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
      });
      return;
    }
    
    next();
  };
};
