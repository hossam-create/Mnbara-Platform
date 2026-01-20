import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { UIConfigResponse, UISection, UISectionItem, Platform } from '../types/ui-config';

const prisma = new PrismaClient();

export class UIConfigController {
  /**
   * Get full UI configuration for the mobile app
   * This is the main endpoint called by Flutter app on startup
   */
  async getUIConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform = 'all', lang = 'ar', user_type = 'all', country } = req.query;
      const now = new Date();

      // Get active sections with items
      const sections = await prisma.uISection.findMany({
        where: {
          is_active: true,
          is_visible: true,
          OR: [
            { start_date: null },
            { start_date: { lte: now } }
          ],
          AND: [
            {
              OR: [
                { end_date: null },
                { end_date: { gte: now } }
              ]
            }
          ],
          // Platform targeting
          ...(platform !== 'all' && {
            target_platforms: { has: platform as string }
          }),
          // User type targeting
          ...(user_type !== 'all' && {
            OR: [
              { target_user_types: { has: 'all' } },
              { target_user_types: { has: user_type as string } }
            ]
          })
        },
        include: {
          component_type: true,
          items: {
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
          }
        },
        orderBy: { sort_order: 'asc' }
      });

      // Get active theme
      const theme = await prisma.uITheme.findFirst({
        where: { is_active: true }
      }) || await prisma.uITheme.findFirst({
        where: { is_default: true }
      });

      // Get banners
      const banners = await prisma.banner.findMany({
        where: {
          is_active: true,
          OR: [
            { start_date: null },
            { start_date: { lte: now } }
          ],
          AND: [
            {
              OR: [
                { end_date: null },
                { end_date: { gte: now } }
              ]
            }
          ],
          ...(platform !== 'all' && {
            target_platforms: { has: platform as string }
          })
        },
        orderBy: [
          { position: 'asc' },
          { sort_order: 'asc' }
        ]
      });

      // Get app config
      const appConfigRecords = await prisma.appConfig.findMany({
        where: {
          is_active: true,
          OR: [
            { platform: 'all' },
            { platform: platform as string }
          ]
        }
      });

      const appConfig = appConfigRecords.reduce((acc, record) => {
        acc[record.key] = record.value;
        return acc;
      }, {} as Record<string, any>);

      // Get latest version number
      const latestVersion = await prisma.uIConfigVersion.findFirst({
        where: { is_published: true },
        orderBy: { version_number: 'desc' }
      });

      // Transform sections for response
      const transformedSections = sections.map(section => ({
        id: section.id,
        component_slug: section.component_type.slug,
        sort_order: section.sort_order,
        is_active: section.is_active,
        is_visible: section.is_visible,
        title_ar: section.title_ar,
        title_en: section.title_en,
        subtitle_ar: section.subtitle_ar,
        subtitle_en: section.subtitle_en,
        config: section.config,
        background_color: section.background_color,
        text_color: section.text_color,
        padding: section.padding,
        margin: section.margin,
        items: section.items.map(item => ({
          id: item.id,
          sort_order: item.sort_order,
          is_active: item.is_active,
          title_ar: item.title_ar,
          title_en: item.title_en,
          subtitle_ar: item.subtitle_ar,
          subtitle_en: item.subtitle_en,
          description_ar: item.description_ar,
          description_en: item.description_en,
          image_url: item.image_url,
          image_url_ar: item.image_url_ar,
          icon: item.icon,
          video_url: item.video_url,
          action: item.action_type ? {
            type: item.action_type,
            url: item.action_url,
            params: item.action_params
          } : undefined,
          badge: (item.badge_text_ar || item.badge_text_en) ? {
            text_ar: item.badge_text_ar,
            text_en: item.badge_text_en,
            color: item.badge_color
          } : undefined,
          price: item.price ? Number(item.price) : undefined,
          original_price: item.original_price ? Number(item.original_price) : undefined,
          currency: item.currency,
          reference: item.reference_type ? {
            type: item.reference_type,
            id: item.reference_id
          } : undefined,
          custom_data: item.custom_data
        }))
      }));

      // Transform banners
      const transformedBanners = banners.map(banner => ({
        id: banner.id,
        title_ar: banner.title_ar,
        title_en: banner.title_en,
        subtitle_ar: banner.subtitle_ar,
        subtitle_en: banner.subtitle_en,
        image_url: banner.image_url,
        image_url_ar: banner.image_url_ar,
        mobile_image_url: banner.mobile_image_url,
        action: banner.action_type ? {
          type: banner.action_type,
          url: banner.action_url
        } : undefined,
        position: banner.position,
        sort_order: banner.sort_order
      }));

      const response: UIConfigResponse = {
        version: latestVersion?.version_number || 1,
        last_updated: latestVersion?.published_at?.toISOString() || new Date().toISOString(),
        cache_ttl: 300, // 5 minutes
        theme: theme ? {
          primary_color: theme.primary_color,
          secondary_color: theme.secondary_color,
          accent_color: theme.accent_color,
          background_color: theme.background_color,
          surface_color: theme.surface_color,
          text_primary: theme.text_primary,
          text_secondary: theme.text_secondary,
          error_color: theme.error_color,
          success_color: theme.success_color,
          font_family_ar: theme.font_family_ar,
          font_family_en: theme.font_family_en,
          border_radius: theme.border_radius
        } : {
          primary_color: '#2563EB',
          secondary_color: '#7C3AED',
          accent_color: '#F59E0B',
          background_color: '#FFFFFF',
          surface_color: '#F3F4F6',
          text_primary: '#111827',
          text_secondary: '#6B7280',
          error_color: '#EF4444',
          success_color: '#10B981',
          font_family_ar: 'Cairo',
          font_family_en: 'Inter',
          border_radius: '8px'
        },
        sections: transformedSections,
        banners: transformedBanners,
        app_config: appConfig
      };

      // Set cache headers
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      res.set('ETag', `"${latestVersion?.version_number || 1}"`);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get UI config with ETag support for efficient caching
   */
  async getUIConfigCached(req: Request, res: Response, next: NextFunction) {
    try {
      const latestVersion = await prisma.uIConfigVersion.findFirst({
        where: { is_published: true },
        orderBy: { version_number: 'desc' }
      });

      const etag = `"${latestVersion?.version_number || 1}"`;
      
      // Check If-None-Match header
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end(); // Not Modified
      }

      // If no match, return full config
      return this.getUIConfig(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get only sections (lighter payload)
   */
  async getSections(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform = 'all' } = req.query;
      const now = new Date();

      const sections = await prisma.uISection.findMany({
        where: {
          is_active: true,
          is_visible: true,
          OR: [
            { start_date: null },
            { start_date: { lte: now } }
          ],
          AND: [
            {
              OR: [
                { end_date: null },
                { end_date: { gte: now } }
              ]
            }
          ],
          ...(platform !== 'all' && {
            target_platforms: { has: platform as string }
          })
        },
        include: {
          component_type: true,
          items: {
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
          }
        },
        orderBy: { sort_order: 'asc' }
      });

      res.json({ sections });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific section by ID or slug
   */
  async getSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier } = req.params;

      const section = await prisma.uISection.findFirst({
        where: {
          OR: [
            { id: identifier },
            { component_type: { slug: identifier } }
          ],
          is_active: true
        },
        include: {
          component_type: true,
          items: {
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
          }
        }
      });

      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      res.json({ section });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get banners for specific position
   */
  async getBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const { position, platform = 'all' } = req.query;
      const now = new Date();

      const banners = await prisma.banner.findMany({
        where: {
          is_active: true,
          ...(position && { position: position as string }),
          OR: [
            { start_date: null },
            { start_date: { lte: now } }
          ],
          AND: [
            {
              OR: [
                { end_date: null },
                { end_date: { gte: now } }
              ]
            }
          ],
          ...(platform !== 'all' && {
            target_platforms: { has: platform as string }
          })
        },
        orderBy: { sort_order: 'asc' }
      });

      res.json({ banners });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active theme
   */
  async getTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const theme = await prisma.uITheme.findFirst({
        where: { is_active: true }
      }) || await prisma.uITheme.findFirst({
        where: { is_default: true }
      });

      res.json({ theme });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get app configuration
   */
  async getAppConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform = 'all' } = req.query;

      const configs = await prisma.appConfig.findMany({
        where: {
          is_active: true,
          OR: [
            { platform: 'all' },
            { platform: platform as string }
          ]
        }
      });

      const appConfig = configs.reduce((acc, record) => {
        acc[record.key] = record.value;
        return acc;
      }, {} as Record<string, any>);

      res.json({ config: appConfig });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track analytics (views, clicks)
   */
  async trackAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, entity_type, entity_id } = req.body;

      if (!type || !entity_type || !entity_id) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const field = type === 'view' ? 'view_count' : 'click_count';

      if (entity_type === 'section') {
        await prisma.uISection.update({
          where: { id: entity_id },
          data: { [field]: { increment: 1 } }
        });
      } else if (entity_type === 'item') {
        await prisma.uISectionItem.update({
          where: { id: entity_id },
          data: { [field]: { increment: 1 } }
        });
      } else if (entity_type === 'banner') {
        await prisma.banner.update({
          where: { id: entity_id },
          data: { [field === 'view_count' ? 'impressions' : 'clicks']: { increment: 1 } }
        });
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check for updates
   */
  async checkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { current_version } = req.query;

      const latestVersion = await prisma.uIConfigVersion.findFirst({
        where: { is_published: true },
        orderBy: { version_number: 'desc' }
      });

      const hasUpdate = latestVersion && 
        Number(current_version) < latestVersion.version_number;

      res.json({
        has_update: hasUpdate,
        current_version: Number(current_version) || 0,
        latest_version: latestVersion?.version_number || 1,
        last_updated: latestVersion?.published_at?.toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}
