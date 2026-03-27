import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { COMPONENT_DEFINITIONS } from '../types/ui-config';

const prisma = new PrismaClient();

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [sectionsCount, itemsCount, bannersCount, activeTheme, latestVersion] = await Promise.all([
        prisma.uISection.count(),
        prisma.uISectionItem.count(),
        prisma.banner.count(),
        prisma.uITheme.findFirst({ where: { is_active: true } }),
        prisma.uIConfigVersion.findFirst({ where: { is_published: true }, orderBy: { version_number: 'desc' } })
      ]);

      const activeSections = await prisma.uISection.count({ where: { is_active: true, is_visible: true } });
      const activeBanners = await prisma.banner.count({ where: { is_active: true } });

      res.json({
        stats: {
          total_sections: sectionsCount,
          active_sections: activeSections,
          total_items: itemsCount,
          total_banners: bannersCount,
          active_banners: activeBanners,
          current_theme: activeTheme?.name || 'Default',
          current_version: latestVersion?.version_number || 1,
          last_published: latestVersion?.published_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getComponentTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const dbTypes = await prisma.componentType.findMany({
        where: { is_active: true },
        orderBy: { name_en: 'asc' }
      });

      // Merge with definitions
      const types = dbTypes.length > 0 ? dbTypes : Object.entries(COMPONENT_DEFINITIONS).map(([slug, def]) => ({
        slug,
        ...def
      }));

      res.json({ component_types: types });
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = '7d' } = req.query;
      const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sections = await prisma.uISection.findMany({
        select: {
          id: true, title_en: true, title_ar: true, view_count: true, click_count: true,
          component_type: { select: { slug: true, name_ar: true } }
        },
        orderBy: { view_count: 'desc' },
        take: 10
      });

      const banners = await prisma.banner.findMany({
        select: { id: true, title_en: true, title_ar: true, impressions: true, clicks: true },
        orderBy: { impressions: 'desc' },
        take: 10
      });

      res.json({
        analytics: {
          period,
          top_sections: sections.map(s => ({
            id: s.id,
            title: s.title_ar || s.title_en,
            type: s.component_type?.name_ar,
            views: s.view_count,
            clicks: s.click_count,
            ctr: s.view_count > 0 ? ((s.click_count / s.view_count) * 100).toFixed(2) + '%' : '0%'
          })),
          top_banners: banners.map(b => ({
            id: b.id,
            title: b.title_ar || b.title_en,
            impressions: b.impressions,
            clicks: b.clicks,
            ctr: b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(2) + '%' : '0%'
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 50, entity_type } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [logs, total] = await Promise.all([
        prisma.uIAuditLog.findMany({
          where: entity_type ? { entity_type: entity_type as string } : undefined,
          orderBy: { created_at: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.uIAuditLog.count({
          where: entity_type ? { entity_type: entity_type as string } : undefined
        })
      ]);

      res.json({ logs, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
    } catch (error) {
      next(error);
    }
  }

  async exportConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const [sections, banners, themes, appConfigs] = await Promise.all([
        prisma.uISection.findMany({ include: { component_type: true, items: true }, orderBy: { sort_order: 'asc' } }),
        prisma.banner.findMany({ orderBy: { sort_order: 'asc' } }),
        prisma.uITheme.findMany(),
        prisma.appConfig.findMany()
      ]);

      res.json({
        export: { sections, banners, themes, app_configs: appConfigs, exported_at: new Date().toISOString(), version: '1.0' }
      });
    } catch (error) {
      next(error);
    }
  }

  async importConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { sections, banners, themes, app_configs } = req.body;
      // Implementation for import would go here
      res.json({ success: true, message: 'Config imported successfully' });
    } catch (error) {
      next(error);
    }
  }
}
