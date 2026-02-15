import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ThemesController {
  async getAllThemes(req: Request, res: Response, next: NextFunction) {
    try {
      const themes = await prisma.uITheme.findMany({
        orderBy: { created_at: 'desc' }
      });
      res.json({ themes });
    } catch (error) {
      next(error);
    }
  }

  async getActiveTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const theme = await prisma.uITheme.findFirst({ where: { is_active: true } })
        || await prisma.uITheme.findFirst({ where: { is_default: true } });
      res.json({ theme });
    } catch (error) {
      next(error);
    }
  }

  async getTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const theme = await prisma.uITheme.findUnique({ where: { id } });
      if (!theme) return res.status(404).json({ error: 'Theme not found' });
      res.json({ theme });
    } catch (error) {
      next(error);
    }
  }

  async createTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const theme = await prisma.uITheme.create({
        data: {
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
          primary_color: data.primary_color || '#2563EB',
          secondary_color: data.secondary_color || '#7C3AED',
          accent_color: data.accent_color || '#F59E0B',
          background_color: data.background_color || '#FFFFFF',
          surface_color: data.surface_color || '#F3F4F6',
          text_primary: data.text_primary || '#111827',
          text_secondary: data.text_secondary || '#6B7280',
          error_color: data.error_color || '#EF4444',
          success_color: data.success_color || '#10B981',
          font_family_ar: data.font_family_ar || 'Cairo',
          font_family_en: data.font_family_en || 'Inter',
          border_radius: data.border_radius || '8px',
          shadow_config: data.shadow_config
        }
      });
      res.status(201).json({ theme });
    } catch (error) {
      next(error);
    }
  }


  async updateTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;

      const theme = await prisma.uITheme.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.primary_color !== undefined && { primary_color: data.primary_color }),
          ...(data.secondary_color !== undefined && { secondary_color: data.secondary_color }),
          ...(data.accent_color !== undefined && { accent_color: data.accent_color }),
          ...(data.background_color !== undefined && { background_color: data.background_color }),
          ...(data.surface_color !== undefined && { surface_color: data.surface_color }),
          ...(data.text_primary !== undefined && { text_primary: data.text_primary }),
          ...(data.text_secondary !== undefined && { text_secondary: data.text_secondary }),
          ...(data.error_color !== undefined && { error_color: data.error_color }),
          ...(data.success_color !== undefined && { success_color: data.success_color }),
          ...(data.font_family_ar !== undefined && { font_family_ar: data.font_family_ar }),
          ...(data.font_family_en !== undefined && { font_family_en: data.font_family_en }),
          ...(data.border_radius !== undefined && { border_radius: data.border_radius }),
          ...(data.shadow_config !== undefined && { shadow_config: data.shadow_config })
        }
      });

      res.json({ theme });
    } catch (error) {
      next(error);
    }
  }

  async deleteTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const theme = await prisma.uITheme.findUnique({ where: { id } });
      if (!theme) return res.status(404).json({ error: 'Theme not found' });
      if (theme.is_default) return res.status(400).json({ error: 'Cannot delete default theme' });

      await prisma.uITheme.delete({ where: { id } });
      res.json({ success: true, message: 'Theme deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async activateTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Deactivate all themes
      await prisma.uITheme.updateMany({ data: { is_active: false } });

      // Activate selected theme
      const theme = await prisma.uITheme.update({
        where: { id },
        data: { is_active: true }
      });

      res.json({ theme });
    } catch (error) {
      next(error);
    }
  }

  async duplicateTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const original = await prisma.uITheme.findUnique({ where: { id } });
      if (!original) return res.status(404).json({ error: 'Theme not found' });

      const duplicate = await prisma.uITheme.create({
        data: {
          name: `${original.name} (Copy)`,
          slug: `${original.slug}-copy-${Date.now()}`,
          primary_color: original.primary_color,
          secondary_color: original.secondary_color,
          accent_color: original.accent_color,
          background_color: original.background_color,
          surface_color: original.surface_color,
          text_primary: original.text_primary,
          text_secondary: original.text_secondary,
          error_color: original.error_color,
          success_color: original.success_color,
          font_family_ar: original.font_family_ar,
          font_family_en: original.font_family_en,
          border_radius: original.border_radius,
          shadow_config: original.shadow_config as any,
          is_active: false,
          is_default: false
        }
      });

      res.status(201).json({ theme: duplicate });
    } catch (error) {
      next(error);
    }
  }
}
