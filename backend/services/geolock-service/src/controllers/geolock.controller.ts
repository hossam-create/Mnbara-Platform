// GeoLock Controller
// متحكم GeoLock

import { Request, Response } from 'express';
import { geoLockService } from '../services/geolock.service';
import { ipDetectionService } from '../services/ip-detection.service';
import { GeoLockCheckRequest } from '../types';
import { logger } from '../utils/logger';

export class GeoLockController {
  /**
   * Check if access is allowed
   */
  async checkAccess(req: Request, res: Response): Promise<void> {
    try {
      const request: GeoLockCheckRequest = {
        targetType: req.body.targetType || 'user',
        targetId: req.body.targetId,
        ipAddress: req.ip || req.body.ipAddress,
        gpsLocation: req.body.gpsLocation,
        userAgent: req.headers['user-agent'],
        endpoint: req.path,
        method: req.method,
        userRoles: req.body.userRoles
      };

      const result = await geoLockService.checkAccess(request);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('GeoLock check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check access',
        errorAr: 'فشل في التحقق من الوصول'
      });
    }
  }

  /**
   * Detect location from IP
   */
  async detectLocation(req: Request, res: Response): Promise<void> {
    try {
      const ip = req.body.ip || req.ip;
      if (!ip) {
        return res.status(400).json({
          success: false,
          error: 'IP address required',
          errorAr: 'عنوان IP مطلوب'
        });
      }

      const location = await ipDetectionService.detectFromIP(ip);
      const networkType = await ipDetectionService.detectNetworkType(ip, location);

      res.json({
        success: true,
        data: {
          location,
          networkType
        }
      });
    } catch (error) {
      logger.error('Location detection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect location',
        errorAr: 'فشل في كشف الموقع'
      });
    }
  }

  /**
   * Fuse IP and GPS location
   */
  async fuseLocation(req: Request, res: Response): Promise<void> {
    try {
      const { ip, gpsLocation } = req.body;
      
      if (!ip) {
        return res.status(400).json({
          success: false,
          error: 'IP address required',
          errorAr: 'عنوان IP مطلوب'
        });
      }

      const result = await ipDetectionService.fuseLocation(ip, gpsLocation);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Location fusion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fuse location data',
        errorAr: 'فشل في دمج بيانات الموقع'
      });
    }
  }

  /**
   * Create a new GeoLock rule
   */
  async createRule(req: Request, res: Response): Promise<void> {
    try {
      const rule = await geoLockService.createRule(req.body);

      res.status(201).json({
        success: true,
        data: rule
      });
    } catch (error) {
      logger.error('Create rule error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create rule',
        errorAr: 'فشل في إنشاء القاعدة'
      });
    }
  }

  /**
   * Update a GeoLock rule
   */
  async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rule = await geoLockService.updateRule(id, req.body);

      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      logger.error('Update rule error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update rule',
        errorAr: 'فشل في تحديث القاعدة'
      });
    }
  }

  /**
   * Delete a GeoLock rule
   */
  async deleteRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await geoLockService.deleteRule(id);

      res.json({
        success: true,
        message: 'Rule deleted successfully',
        messageAr: 'تم حذف القاعدة بنجاح'
      });
    } catch (error) {
      logger.error('Delete rule error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete rule',
        errorAr: 'فشل في حذف القاعدة'
      });
    }
  }

  /**
   * List all GeoLock rules
   */
  async listRules(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active === 'true';
      const rules = await geoLockService.listRules(activeOnly);

      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      logger.error('List rules error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list rules',
        errorAr: 'فشل في عرض القواعد'
      });
    }
  }
}

export const geoLockController = new GeoLockController();
