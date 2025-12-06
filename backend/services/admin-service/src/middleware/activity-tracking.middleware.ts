import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../database/database.service';
import * as UAParser from 'ua-parser-js';
import * as geoip from 'geoip-lite';

@Injectable()
export class ActivityTrackingMiddleware implements NestMiddleware {
  constructor(private readonly db: DatabaseService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip tracking for health checks and static files
    if (req.path === '/api/admin/health' || req.path.startsWith('/static')) {
      return next();
    }

    // Extract user from JWT (if authenticated)
    const user = (req as any).user;
    
    if (user && user.userId) {
      try {
        // Parse user agent
        const parser = new UAParser(req.headers['user-agent']);
        const deviceInfo = {
          browser: parser.getBrowser().name,
          browserVersion: parser.getBrowser().version,
          os: parser.getOS().name,
          osVersion: parser.getOS().version,
          device: parser.getDevice().type || 'desktop',
        };

        // Get IP address
        const ipAddress = this.getClientIp(req);

        // Get location from IP
        const geo = geoip.lookup(ipAddress);
        const country = geo?.country || 'Unknown';
        const city = geo?.city || 'Unknown';

        // Determine action type from request
        const actionType = this.determineActionType(req);
        const resourceType = this.determineResourceType(req);
        const resourceId = this.extractResourceId(req);

        // Log activity
        await this.db.insert('user_activity_logs', {
          user_id: user.userId,
          action_type: actionType,
          resource_type: resourceType,
          resource_id: resourceId,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            deviceInfo,
          },
          ip_address: ipAddress,
        });

        // Update user's last activity
        await this.db.update(
          'users',
          { id: user.userId },
          {
            last_login_at: new Date(),
            last_login_ip: ipAddress,
            last_login_country: country,
          }
        );
      } catch (error) {
        // Don't block request if tracking fails
        console.error('Activity tracking error:', error.message);
      }
    }

    next();
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    );
  }

  private determineActionType(req: Request): string {
    const method = req.method;
    const path = req.path;

    if (method === 'GET') {
      if (path.includes('/users/')) return 'VIEW_USER';
      if (path.includes('/orders/')) return 'VIEW_ORDER';
      if (path.includes('/analytics')) return 'VIEW_ANALYTICS';
      return 'VIEW_RESOURCE';
    }

    if (method === 'POST') {
      if (path.includes('/orders')) return 'CREATE_ORDER';
      if (path.includes('/bids')) return 'PLACE_BID';
      return 'CREATE_RESOURCE';
    }

    if (method === 'PUT' || method === 'PATCH') {
      if (path.includes('/orders')) return 'UPDATE_ORDER';
      if (path.includes('/users')) return 'UPDATE_USER';
      return 'UPDATE_RESOURCE';
    }

    if (method === 'DELETE') {
      return 'DELETE_RESOURCE';
    }

    return 'UNKNOWN_ACTION';
  }

  private determineResourceType(req: Request): string | null {
    const path = req.path;

    if (path.includes('/users')) return 'USER';
    if (path.includes('/orders')) return 'ORDER';
    if (path.includes('/listings')) return 'LISTING';
    if (path.includes('/auctions')) return 'AUCTION';
    if (path.includes('/analytics')) return 'ANALYTICS';

    return null;
  }

  private extractResourceId(req: Request): number | null {
    // Extract ID from path like /users/123
    const match = req.path.match(/\/(\d+)(?:\/|$)/);
    return match ? parseInt(match[1]) : null;
  }
}
