// Release Controller - Release Management
// متحكم الإصدارات - إدارة الإصدارات

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { featureService } from '../services/feature.service';
import { io } from '../index';

const prisma = new PrismaClient();

export class ReleaseController {
  // Create release
  async create(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      
      const release = await prisma.release.create({
        data: {
          ...req.body,
          createdBy: adminId
        }
      });
      
      res.status(201).json({
        success: true,
        message: 'Release created successfully',
        messageAr: 'تم إنشاء الإصدار بنجاح',
        data: release
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get release by version
  async getByVersion(req: Request, res: Response): Promise<void> {
    try {
      const release = await prisma.release.findUnique({
        where: { version: req.params.version }
      });
      
      if (!release) {
        res.status(404).json({
          success: false,
          message: 'Release not found',
          messageAr: 'الإصدار غير موجود'
        });
        return;
      }
      
      // Get feature details
      const features = await prisma.feature.findMany({
        where: { key: { in: release.features } }
      });
      
      res.json({
        success: true,
        data: {
          ...release,
          featureDetails: features
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // List releases
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { status, limit = 20 } = req.query;
      
      const releases = await prisma.release.findMany({
        where: status ? { status: status as any } : undefined,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string)
      });
      
      res.json({
        success: true,
        data: releases,
        total: releases.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update release
  async update(req: Request, res: Response): Promise<void> {
    try {
      const release = await prisma.release.update({
        where: { version: req.params.version },
        data: req.body
      });
      
      res.json({
        success: true,
        message: 'Release updated successfully',
        messageAr: 'تم تحديث الإصدار بنجاح',
        data: release
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Schedule release
  async schedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduledAt } = req.body;
      
      const release = await prisma.release.update({
        where: { version: req.params.version },
        data: {
          status: 'SCHEDULED',
          scheduledAt: new Date(scheduledAt)
        }
      });
      
      res.json({
        success: true,
        message: `Release scheduled for ${scheduledAt}`,
        messageAr: `تم جدولة الإصدار في ${scheduledAt}`,
        data: release
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Deploy release (enable all features)
  async deploy(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      
      const release = await prisma.release.findUnique({
        where: { version: req.params.version }
      });
      
      if (!release) {
        res.status(404).json({
          success: false,
          message: 'Release not found'
        });
        return;
      }
      
      // Update release status
      await prisma.release.update({
        where: { version: req.params.version },
        data: {
          status: 'IN_PROGRESS'
        }
      });
      
      // Enable all features in release
      const enabledFeatures = [];
      for (const featureKey of release.features) {
        try {
          const feature = await featureService.enableFeature(featureKey, adminId, `Release ${release.version}`);
          enabledFeatures.push(feature.key);
        } catch (err) {
          console.error(`Failed to enable feature ${featureKey}:`, err);
        }
      }
      
      // Mark release as complete
      const updatedRelease = await prisma.release.update({
        where: { version: req.params.version },
        data: {
          status: 'RELEASED',
          releasedAt: new Date()
        }
      });
      
      // Broadcast release
      io.to('feature-updates').emit('release:deployed', {
        version: release.version,
        name: release.name,
        features: enabledFeatures,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: `Release ${release.version} deployed successfully`,
        messageAr: `تم نشر الإصدار ${release.version} بنجاح`,
        data: {
          release: updatedRelease,
          enabledFeatures
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Rollback release
  async rollback(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const { reason } = req.body;
      
      const release = await prisma.release.findUnique({
        where: { version: req.params.version }
      });
      
      if (!release) {
        res.status(404).json({
          success: false,
          message: 'Release not found'
        });
        return;
      }
      
      // Disable all features in release
      const disabledFeatures = [];
      for (const featureKey of release.features) {
        try {
          await featureService.disableFeature(featureKey, adminId, `Rollback: ${reason}`);
          disabledFeatures.push(featureKey);
        } catch (err) {
          console.error(`Failed to disable feature ${featureKey}:`, err);
        }
      }
      
      // Mark release as rolled back
      const updatedRelease = await prisma.release.update({
        where: { version: req.params.version },
        data: {
          status: 'ROLLED_BACK'
        }
      });
      
      // Broadcast rollback
      io.to('feature-updates').emit('release:rolledback', {
        version: release.version,
        reason,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: `Release ${release.version} rolled back`,
        messageAr: `تم التراجع عن الإصدار ${release.version}`,
        data: {
          release: updatedRelease,
          disabledFeatures
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get release changelog
  async getChangelog(req: Request, res: Response): Promise<void> {
    try {
      const releases = await prisma.release.findMany({
        where: { status: 'RELEASED' },
        orderBy: { releasedAt: 'desc' },
        take: 10
      });
      
      const changelog = releases.map(r => ({
        version: r.version,
        name: r.name,
        nameAr: r.nameAr,
        releaseNotes: r.releaseNotes,
        releaseNotesAr: r.releaseNotesAr,
        releasedAt: r.releasedAt,
        features: r.features,
        breakingChanges: r.breakingChanges
      }));
      
      res.json({
        success: true,
        data: changelog
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const releaseController = new ReleaseController();
