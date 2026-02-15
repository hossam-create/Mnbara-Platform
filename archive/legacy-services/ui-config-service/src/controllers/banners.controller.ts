import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BannersController {
  async getAllBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const { position } = req.query;
      const banners = await prisma.banner.findMany({
        where: position ? { position: position as string } : undefined,
        orderBy: [{ position: 'asc' }, { sort_order: 'asc' }]
      });
      res.json({ banners });
    } catch (error) {
      next(error);
    }
  }

  async getBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const banner = await prisma.banner.findUnique({ where: { id } });
      if (!banner) return res.status(404).json({ error: 'Banner not found' });
      res.json({ banner });
    } catch (error) {
      next(error);
    }
  }

  async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const userId = (req as any).user?.id;

      const maxOrder = await prisma.banner.aggregate({
        where: { position: data.position || 'home_top' },
        _max: { sort_order: true }
      });

      const banner = await prisma.banner.create({
        data: {
          title_ar: data.title_ar,
          title_en: data.title_en,
          subtitle_ar: data.subtitle_ar,
          subtitle_en: data.subtitle_en,
          image_url: data.image_url,
          image_url_ar: data.image_url_ar,
          mobile_image_url: data.mobile_image_url,
          action_type: data.action_type,
          action_url: data.action_url,
          position: data.position || 'home_top',
          sort_order: (maxOrder._max.sort_order || 0) + 1,
          target_platforms: data.target_platforms || ['ios', 'android', 'web'],
          target_countries: data.target_countries || [],
          start_date: data.start_date ? new Date(data.start_date) : null,
          end_date: data.end_date ? new Date(data.end_date) : null,
          created_by: userId
        }
      });

      res.status(201).json({ banner });
    } catch (error) {
      next(error);
    }
  }


  async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;

      const banner = await prisma.banner.update({
        where: { id },
        data: {
          ...(data.title_ar !== undefined && { title_ar: data.title_ar }),
          ...(data.title_en !== undefined && { title_en: data.title_en }),
          ...(data.subtitle_ar !== undefined && { subtitle_ar: data.subtitle_ar }),
          ...(data.subtitle_en !== undefined && { subtitle_en: data.subtitle_en }),
          ...(data.image_url !== undefined && { image_url: data.image_url }),
          ...(data.image_url_ar !== undefined && { image_url_ar: data.image_url_ar }),
          ...(data.mobile_image_url !== undefined && { mobile_image_url: data.mobile_image_url }),
          ...(data.action_type !== undefined && { action_type: data.action_type }),
          ...(data.action_url !== undefined && { action_url: data.action_url }),
          ...(data.position !== undefined && { position: data.position }),
          ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
          ...(data.target_platforms !== undefined && { target_platforms: data.target_platforms }),
          ...(data.target_countries !== undefined && { target_countries: data.target_countries }),
          ...(data.start_date !== undefined && { start_date: data.start_date ? new Date(data.start_date) : null }),
          ...(data.end_date !== undefined && { end_date: data.end_date ? new Date(data.end_date) : null })
        }
      });

      res.json({ banner });
    } catch (error) {
      next(error);
    }
  }

  async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.banner.delete({ where: { id } });
      res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const banner = await prisma.banner.findUnique({ where: { id } });
      if (!banner) return res.status(404).json({ error: 'Banner not found' });

      const updated = await prisma.banner.update({
        where: { id },
        data: { is_active: !banner.is_active }
      });

      res.json({ banner: updated });
    } catch (error) {
      next(error);
    }
  }

  async reorderBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;
      await prisma.$transaction(
        items.map((item: { id: string; sort_order: number }) =>
          prisma.banner.update({
            where: { id: item.id },
            data: { sort_order: item.sort_order }
          })
        )
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
