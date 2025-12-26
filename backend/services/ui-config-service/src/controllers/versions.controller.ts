import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VersionsController {
  async getAllVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const versions = await prisma.uIConfigVersion.findMany({
        orderBy: { version_number: 'desc' },
        take: 50
      });
      res.json({ versions });
    } catch (error) {
      next(error);
    }
  }

  async getLatestVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const version = await prisma.uIConfigVersion.findFirst({
        where: { is_published: true },
        orderBy: { version_number: 'desc' }
      });
      res.json({ version });
    } catch (error) {
      next(error);
    }
  }

  async getVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const version = await prisma.uIConfigVersion.findUnique({ where: { id } });
      if (!version) return res.status(404).json({ error: 'Version not found' });
      res.json({ version });
    } catch (error) {
      next(error);
    }
  }

  async publishVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;
      const userId = (req as any).user?.id;

      // Get current config snapshot
      const sections = await prisma.uISection.findMany({
        include: { component_type: true, items: { orderBy: { sort_order: 'asc' } } },
        orderBy: { sort_order: 'asc' }
      });
      const banners = await prisma.banner.findMany({ where: { is_active: true } });
      const theme = await prisma.uITheme.findFirst({ where: { is_active: true } });

      // Get next version number
      const lastVersion = await prisma.uIConfigVersion.findFirst({
        orderBy: { version_number: 'desc' }
      });

      const version = await prisma.uIConfigVersion.create({
        data: {
          version_number: (lastVersion?.version_number || 0) + 1,
          name: name || `Version ${(lastVersion?.version_number || 0) + 1}`,
          description,
          config_snapshot: { sections, banners, theme },
          is_published: true,
          published_at: new Date(),
          published_by: userId,
          created_by: userId
        }
      });

      res.status(201).json({ version });
    } catch (error) {
      next(error);
    }
  }


  async rollbackToVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const version = await prisma.uIConfigVersion.findUnique({ where: { id } });
      if (!version) return res.status(404).json({ error: 'Version not found' });

      const snapshot = version.config_snapshot as any;

      // Clear current sections and items
      await prisma.uISectionItem.deleteMany({});
      await prisma.uISection.deleteMany({});

      // Restore sections from snapshot
      for (const section of snapshot.sections || []) {
        const { items, component_type, ...sectionData } = section;
        await prisma.uISection.create({
          data: {
            ...sectionData,
            items: {
              create: items?.map((item: any) => {
                const { id: itemId, section_id, ...itemData } = item;
                return itemData;
              }) || []
            }
          }
        });
      }

      // Create new version for rollback
      const lastVersion = await prisma.uIConfigVersion.findFirst({
        orderBy: { version_number: 'desc' }
      });

      const newVersion = await prisma.uIConfigVersion.create({
        data: {
          version_number: (lastVersion?.version_number || 0) + 1,
          name: `Rollback to v${version.version_number}`,
          description: `Rolled back from version ${lastVersion?.version_number}`,
          config_snapshot: snapshot,
          is_published: true,
          published_at: new Date(),
          published_by: userId,
          is_rollback: true,
          rollback_from: lastVersion?.id,
          created_by: userId
        }
      });

      res.json({ version: newVersion, message: 'Rollback successful' });
    } catch (error) {
      next(error);
    }
  }

  async deleteVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const version = await prisma.uIConfigVersion.findUnique({ where: { id } });
      if (!version) return res.status(404).json({ error: 'Version not found' });

      // Don't delete the only published version
      const publishedCount = await prisma.uIConfigVersion.count({ where: { is_published: true } });
      if (version.is_published && publishedCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only published version' });
      }

      await prisma.uIConfigVersion.delete({ where: { id } });
      res.json({ success: true, message: 'Version deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
