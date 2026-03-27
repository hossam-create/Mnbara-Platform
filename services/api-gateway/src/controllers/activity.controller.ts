/**
 * Activity Controller
 * 
 * Handles HTTP requests for the aggregated activity endpoint.
 * Routes:
 * - GET /activity
 * - GET /activity?domain=wallet
 * - GET /activity?domain=traveler
 * - GET /activity?domain=marketplace
 * - GET /activity?limit=20
 * - GET /activity?cursor=xyz
 */

import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service';
import { ActivityQueryParams, ActivityDomain } from '../dto/activity.dto';

// Extend Express Request to include user from JWT
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
  };
}

export class ActivityController {
  /**
   * GET /activity
   * Main endpoint for aggregated activity data
   */
  async getActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract userId from JWT (set by auth middleware)
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in token',
          code: 'MISSING_USER_ID',
        });
        return;
      }

      // Parse and validate query parameters
      const params = this.parseQueryParams(req.query);

      // Extract auth headers to forward to downstream services
      const authHeaders: Record<string, string> = {};
      const authHeader = req.headers.authorization;
      if (authHeader) {
        authHeaders.Authorization = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      }
      const requestId = req.headers['x-request-id'];
      if (requestId) {
        authHeaders['X-Request-ID'] = Array.isArray(requestId) ? requestId[0] : requestId;
      }

      // Call aggregation service
      const result = await activityService.aggregateActivity(userId, params, authHeaders);

      // Return response
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /activity/health
   * Health check for activity aggregation service
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    const health = activityService.getHealth();
    
    const allServicesHealthy = Object.values(health.services).every(Boolean);
    const status = health.redis && allServicesHealthy ? 'healthy' : 'degraded';
    const statusCode = health.redis || allServicesHealthy ? 200 : 503;

    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      service: 'activity-aggregation',
      components: health,
    });
  }

  /**
   * POST /activity/invalidate-cache
   * Admin endpoint to invalidate user cache (for testing/debugging)
   */
  async invalidateCache(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in token',
          code: 'MISSING_USER_ID',
        });
        return;
      }

      await activityService.invalidateCache(userId);

      res.status(200).json({
        success: true,
        message: 'Cache invalidated successfully',
        userId,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Parse and validate query parameters
   */
  private parseQueryParams(query: Record<string, unknown>): ActivityQueryParams {
    const params: ActivityQueryParams = {};

    // Domain filter
    if (query.domain && typeof query.domain === 'string') {
      const validDomains: ActivityDomain[] = ['wallet', 'traveler', 'marketplace'];
      if (validDomains.includes(query.domain as ActivityDomain) || query.domain === 'all') {
        params.domain = query.domain as ActivityDomain | 'all';
      }
    }

    // Limit (pagination)
    if (query.limit) {
      const limit = parseInt(String(query.limit), 10);
      if (!isNaN(limit) && limit > 0 && limit <= 100) {
        params.limit = limit;
      }
    }

    // Cursor (pagination)
    if (query.cursor && typeof query.cursor === 'string') {
      params.cursor = query.cursor;
    }

    // Date range filters
    if (query.startDate && typeof query.startDate === 'string') {
      const date = new Date(query.startDate);
      if (!isNaN(date.getTime())) {
        params.startDate = query.startDate;
      }
    }

    if (query.endDate && typeof query.endDate === 'string') {
      const date = new Date(query.endDate);
      if (!isNaN(date.getTime())) {
        params.endDate = query.endDate;
      }
    }

    return params;
  }
}

// Singleton instance
export const activityController = new ActivityController();
export default activityController;
