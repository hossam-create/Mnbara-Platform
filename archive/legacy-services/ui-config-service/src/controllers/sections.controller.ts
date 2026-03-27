import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateSectionDTO, UpdateSectionDTO, ReorderDTO } from '../types/ui-config';

const prisma = new PrismaClient();

export class SectionsController {
  /**
   * Get all sections (including inactive) for dashboard
   */
  async getAllSections(req: Request, res: Response, next: NextFunction) {
    try {
      const sections = await prisma.uISection.findMany({
        include: {
          component_type: true,
          items: {
            orderBy: { sort_order: 'asc' }
          },
          _count: {
            select: { items: true }
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
   * Get single section with all details
   */
  async getSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const section = await prisma.uISection.findUnique({
        where: { id },
        include: {
          component_type: true,
          items: {
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
   * Create new section
   */
  async createSection(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateSectionDTO = req.body;
      const userId = (req as any).user?.id;

      // Get component type by slug
      const componentType = await prisma.componentType.findUnique({
        where: { slug: data.component_slug }
      });

      if (!componentType) {
        return res.status(400).json({ error: 'Invalid component type' });
      }

      // Get max sort order
      const maxOrder = await prisma.uISection.aggregate({
        _max: { sort_order: true }
      });

      const section = await prisma.uISection.create({
        data: {
          component_type_id: componentType.id,
          sort_order: (maxOrder._max.sort_order || 0) + 1,
          title_ar: data.title_ar,
          title_en: data.title_en,
          subtitle_ar: data.subtitle_ar,
          subtitle_en: data.subtitle_en,
          config: data.config || componentType.schema,
          target_platforms: data.target_platforms || ['ios', 'android', 'web'],
          target_user_types: data.target_user_types || ['all'],
          start_date: data.start_date ? new Date(data.start_date) : null,
          end_date: data.end_date ? new Date(data.end_date) : null,
          created_by: userId
        },
        include: {
          component_type: true
        }
      });

      // Log audit
      await prisma.uIAuditLog.create({
        data: {
          entity_type: 'section',
          entity_id: section.id,
          action: 'create',
          new_value: section as any,
          user_id: userId || 'system',
          user_email: (req as any).user?.email
        }
      });

      res.status(201).json({ section });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update section
   */
  async updateSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateSectionDTO = req.body;
      const userId = (req as any).user?.id;

      // Get current section for audit
      const currentSection = await prisma.uISection.findUnique({
        where: { id }
      });

      if (!currentSection) {
        return res.status(404).json({ error: 'Section not found' });
      }

      const section = await prisma.uISection.update({
        where: { id },
        data: {
          ...(data.title_ar !== undefined && { title_ar: data.title_ar }),
          ...(data.title_en !== undefined && { title_en: data.title_en }),
          ...(data.subtitle_ar !== undefined && { subtitle_ar: data.subtitle_ar }),
          ...(data.subtitle_en !== undefined && { subtitle_en: data.subtitle_en }),
          ...(data.config !== undefined && { config: data.config }),
          ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
          ...(data.is_visible !== undefined && { is_visible: data.is_visible }),
          ...(data.background_color !== undefined && { background_color: data.background_color }),
          ...(data.text_color !== undefined && { text_color: data.text_color }),
          ...(data.padding !== undefined && { padding: data.padding }),
          ...(data.margin !== undefined && { margin: data.margin }),
          ...(data.target_platforms !== undefined && { target_platforms: data.target_platforms }),
          ...(data.target_user_types !== undefined && { target_user_types: data.target_user_types }),
          ...(data.start_date !== undefined && { start_date: data.start_date ? new Date(data.start_date) : null }),
          ...(data.end_date !== undefined && { end_date: data.end_date ? new Date(data.end_date) : null }),
          updated_by: userId
        },
        include: {
          component_type: true,
          items: {
            orderBy: { sort_order: 'asc' }
          }
        }
      });

      // Log audit
      await prisma.uIAuditLog.create({
        data: {
          entity_type: 'section',
          entity_id: section.id,
          action: 'update',
          old_value: currentSection as any,
          new_value: section as any,
          user_id: userId || 'system',
          user_email: (req as any).user?.email
        }
      });

      res.json({ section });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete section
   */
  async deleteSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const section = await prisma.uISection.findUnique({
        where: { id }
      });

      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      // Delete section (items will be cascade deleted)
      await prisma.uISection.delete({
        where: { id }
      });

      // Log audit
      await prisma.uIAuditLog.create({
        data: {
          entity_type: 'section',
          entity_id: id,
          action: 'delete',
          old_value: section as any,
          user_id: userId || 'system',
          user_email: (req as any).user?.email
        }
      });

      res.json({ success: true, message: 'Section deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate section
   */
  async duplicateSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const original = await prisma.uISection.findUnique({
        where: { id },
        include: {
          items: true
        }
      });

      if (!original) {
        return res.status(404).json({ error: 'Section not found' });
      }

      // Get max sort order
      const maxOrder = await prisma.uISection.aggregate({
        _max: { sort_order: true }
      });

      // Create duplicate section
      const duplicate = await prisma.uISection.create({
        data: {
          component_type_id: original.component_type_id,
          sort_order: (maxOrder._max.sort_order || 0) + 1,
          is_active: false, // Start as inactive
          is_visible: original.is_visible,
          title_ar: original.title_ar ? `${original.title_ar} (نسخة)` : null,
          title_en: original.title_en ? `${original.title_en} (Copy)` : null,
          subtitle_ar: original.subtitle_ar,
          subtitle_en: original.subtitle_en,
          config: original.config as any,
          background_color: original.background_color,
          text_color: original.text_color,
          padding: original.padding as any,
          margin: original.margin as any,
          target_platforms: original.target_platforms,
          target_user_types: original.target_user_types,
          target_countries: original.target_countries,
          created_by: userId,
          items: {
            create: original.items.map(item => ({
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
              action_type: item.action_type,
              action_url: item.action_url,
              action_params: item.action_params as any,
              badge_text_ar: item.badge_text_ar,
              badge_text_en: item.badge_text_en,
              badge_color: item.badge_color,
              price: item.price,
              original_price: item.original_price,
              currency: item.currency,
              reference_type: item.reference_type,
              reference_id: item.reference_id,
              custom_data: item.custom_data as any
            }))
          }
        },
        include: {
          component_type: true,
          items: true
        }
      });

      res.status(201).json({ section: duplicate });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle section visibility
   */
  async toggleVisibility(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const section = await prisma.uISection.findUnique({
        where: { id }
      });

      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      const updated = await prisma.uISection.update({
        where: { id },
        data: { is_visible: !section.is_visible }
      });

      res.json({ section: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle section active status
   */
  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const section = await prisma.uISection.findUnique({
        where: { id }
      });

      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      const updated = await prisma.uISection.update({
        where: { id },
        data: { is_active: !section.is_active }
      });

      res.json({ section: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder sections (drag & drop)
   */
  async reorderSections(req: Request, res: Response, next: NextFunction) {
    try {
      const { items }: ReorderDTO = req.body;
      const userId = (req as any).user?.id;

      // Update all sections in a transaction
      await prisma.$transaction(
        items.map(item =>
          prisma.uISection.update({
            where: { id: item.id },
            data: { sort_order: item.sort_order }
          })
        )
      );

      // Log audit
      await prisma.uIAuditLog.create({
        data: {
          entity_type: 'section',
          entity_id: 'bulk',
          action: 'reorder',
          new_value: items as any,
          user_id: userId || 'system',
          user_email: (req as any).user?.email
        }
      });

      res.json({ success: true, message: 'Sections reordered successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get section analytics
   */
  async getSectionAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const section = await prisma.uISection.findUnique({
        where: { id },
        select: {
          id: true,
          view_count: true,
          click_count: true,
          items: {
            select: {
              id: true,
              title_en: true,
              title_ar: true,
              view_count: true,
              click_count: true
            }
          }
        }
      });

      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      const ctr = section.view_count > 0 
        ? ((section.click_count / section.view_count) * 100).toFixed(2)
        : '0.00';

      res.json({
        analytics: {
          section_id: section.id,
          views: section.view_count,
          clicks: section.click_count,
          ctr: `${ctr}%`,
          items: section.items.map(item => ({
            id: item.id,
            title: item.title_en || item.title_ar,
            views: item.view_count,
            clicks: item.click_count,
            ctr: item.view_count > 0 
              ? `${((item.click_count / item.view_count) * 100).toFixed(2)}%`
              : '0.00%'
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
