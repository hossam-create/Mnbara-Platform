// Feature Controller - Feature Flags Management
// متحكم الميزات - إدارة أعلام الميزات

import { Request, Response } from 'express';
import { featureService } from '../services/feature.service';
import { io } from '../index';

export class FeatureController {
  // Create feature
  async create(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const feature = await featureService.createFeature(req.body, adminId);
      
      res.status(201).json({
        success: true,
        message: 'Feature created successfully',
        messageAr: 'تم إنشاء الميزة بنجاح',
        data: feature
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إنشاء الميزة'
      });
    }
  }

  // Get feature by key
  async getByKey(req: Request, res: Response): Promise<void> {
    try {
      const feature = await featureService.getFeatureByKey(req.params.key);
      
      if (!feature) {
        res.status(404).json({
          success: false,
          message: 'Feature not found',
          messageAr: 'الميزة غير موجودة'
        });
        return;
      }
      
      res.json({
        success: true,
        data: feature
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // List features
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { category, service, isEnabled } = req.query;
      
      const features = await featureService.listFeatures({
        category: category as any,
        service: service as string,
        isEnabled: isEnabled === 'true' ? true : isEnabled === 'false' ? false : undefined
      });
      
      res.json({
        success: true,
        data: features,
        total: features.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update feature
  async update(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const feature = await featureService.updateFeature(req.params.key, req.body, adminId);
      
      res.json({
        success: true,
        message: 'Feature updated successfully',
        messageAr: 'تم تحديث الميزة بنجاح',
        data: feature
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Enable feature
  async enable(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const { reason } = req.body;
      
      const feature = await featureService.enableFeature(req.params.key, adminId, reason);
      
      // Broadcast to connected clients
      io.to('feature-updates').emit('feature:enabled', {
        key: feature.key,
        name: feature.name,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: `Feature "${feature.name}" enabled successfully`,
        messageAr: `تم تفعيل الميزة "${feature.nameAr || feature.name}" بنجاح`,
        data: feature
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Disable feature
  async disable(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const { reason } = req.body;
      
      const feature = await featureService.disableFeature(req.params.key, adminId, reason);
      
      // Broadcast to connected clients
      io.to('feature-updates').emit('feature:disabled', {
        key: feature.key,
        name: feature.name,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: `Feature "${feature.name}" disabled successfully`,
        messageAr: `تم تعطيل الميزة "${feature.nameAr || feature.name}" بنجاح`,
        data: feature
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Set rollout percentage
  async setRollout(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const { percentage } = req.body;
      
      const feature = await featureService.setRolloutPercentage(req.params.key, percentage, adminId);
      
      io.to('feature-updates').emit('feature:rollout', {
        key: feature.key,
        percentage: feature.rolloutPercentage,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: `Rollout set to ${percentage}%`,
        messageAr: `تم ضبط النشر التدريجي على ${percentage}%`,
        data: feature
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check feature status
  async check(req: Request, res: Response): Promise<void> {
    try {
      const { userId, region, subscription, organizationId } = req.query;
      
      const isEnabled = await featureService.isFeatureEnabled(req.params.key, {
        userId: userId as string,
        region: region as string,
        subscription: subscription as string,
        organizationId: organizationId as string
      });
      
      res.json({
        success: true,
        data: {
          key: req.params.key,
          isEnabled
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Bulk check features
  async bulkCheck(req: Request, res: Response): Promise<void> {
    try {
      const { keys, context } = req.body;
      const results = await featureService.checkFeatures(keys, context);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get enabled features for client
  async getClientFeatures(req: Request, res: Response): Promise<void> {
    try {
      const { userId, region, subscription } = req.query;
      
      const features = await featureService.getEnabledFeaturesForClient({
        userId: userId as string,
        region: region as string,
        subscription: subscription as string
      });
      
      res.json({
        success: true,
        data: features
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add override
  async addOverride(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const { type, targetId, isEnabled, expiresAt } = req.body;
      
      const override = await featureService.addOverride(
        req.params.key,
        type,
        targetId,
        isEnabled,
        adminId,
        expiresAt ? new Date(expiresAt) : undefined
      );
      
      res.json({
        success: true,
        message: 'Override added successfully',
        messageAr: 'تم إضافة الاستثناء بنجاح',
        data: override
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Remove override
  async removeOverride(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const { type, targetId } = req.body;
      
      await featureService.removeOverride(req.params.key, type, targetId, adminId);
      
      res.json({
        success: true,
        message: 'Override removed successfully',
        messageAr: 'تم إزالة الاستثناء بنجاح'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get feature metrics
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const metrics = await featureService.getFeatureMetrics(req.params.key, days);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const featureController = new FeatureController();
