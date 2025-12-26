import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateItemDTO } from '../types/ui-config';

const prisma = new PrismaClient();

export class ItemsController {
  async getItemsBySection(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectionId } = req.params;
      const items = await prisma.uISectionItem.findMany({
        where: { section_id: sectionId },
        orderBy: { sort_order: 'asc' }
      });
      res.json({ items });
    } catch (error) {
      next(error);
    }
  }

  async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await prisma.uISectionItem.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ error: 'Item not found' });
      res.json({ item });
    } catch (error) {
      next(error);
    }
  }

  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateItemDTO = req.body;
      const maxOrder = await prisma.uISectionItem.aggregate({
        where: { section_id: data.section_id },
        _max: { sort_order: true }
      });

      const item = await prisma.uISectionItem.create({
        data: {
          section_id: data.section_id,
          sort_order: (maxOrder._max.sort_order || 0) + 1,
          title_ar: data.title_ar,
          title_en: data.title_en,
          subtitle_ar: data.subtitle_ar,
          subtitle_en: data.subtitle_en,
          description_ar: data.description_ar,
          description_en: data.description_en,
          image_url: data.image_url,
          image_url_ar: data.image_url_ar,
          icon: data.icon,
          action_type: data.action_type,
          action_url: data.action_url,
          action_params: data.action_params,
          badge_text_ar: data.badge_text_ar,
          badge_text_en: data.badge_text_en,
          badge_color: data.badge_color,
          price: data.price,
          original_price: data.original_price,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
          custom_data: data.custom_data
        }
      });

      res.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  }


  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = (req as any).user?.id;

      const currentItem = await prisma.uISectionItem.findUnique({ where: { id } });
      if (!currentItem) return res.status(404).json({ error: 'Item not found' });

      const item = await prisma.uISectionItem.update({
        where: { id },
        data: {
          ...(data.title_ar !== undefined && { title_ar: data.title_ar }),
          ...(data.title_en !== undefined && { title_en: data.title_en }),
          ...(data.subtitle_ar !== undefined && { subtitle_ar: data.subtitle_ar }),
          ...(data.subtitle_en !== undefined && { subtitle_en: data.subtitle_en }),
          ...(data.description_ar !== undefined && { description_ar: data.description_ar }),
          ...(data.description_en !== undefined && { description_en: data.description_en }),
          ...(data.image_url !== undefined && { image_url: data.image_url }),
          ...(data.image_url_ar !== undefined && { image_url_ar: data.image_url_ar }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(data.video_url !== undefined && { video_url: data.video_url }),
          ...(data.action_type !== undefined && { action_type: data.action_type }),
          ...(data.action_url !== undefined && { action_url: data.action_url }),
          ...(data.action_params !== undefined && { action_params: data.action_params }),
          ...(data.badge_text_ar !== undefined && { badge_text_ar: data.badge_text_ar }),
          ...(data.badge_text_en !== undefined && { badge_text_en: data.badge_text_en }),
          ...(data.badge_color !== undefined && { badge_color: data.badge_color }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.original_price !== undefined && { original_price: data.original_price }),
          ...(data.currency !== undefined && { currency: data.currency }),
          ...(data.reference_type !== undefined && { reference_type: data.reference_type }),
          ...(data.reference_id !== undefined && { reference_id: data.reference_id }),
          ...(data.custom_data !== undefined && { custom_data: data.custom_data }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
          ...(data.sort_order !== undefined && { sort_order: data.sort_order })
        }
      });

      await prisma.uIAuditLog.create({
        data: {
          entity_type: 'item',
          entity_id: id,
          action: 'update',
          old_value: currentItem as any,
          new_value: item as any,
          user_id: userId || 'system'
        }
      });

      res.json({ item });
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await prisma.uISectionItem.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ error: 'Item not found' });

      await prisma.uISectionItem.delete({ where: { id } });
      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async duplicateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const original = await prisma.uISectionItem.findUnique({ where: { id } });
      if (!original) return res.status(404).json({ error: 'Item not found' });

      const maxOrder = await prisma.uISectionItem.aggregate({
        where: { section_id: original.section_id },
        _max: { sort_order: true }
      });

      const duplicate = await prisma.uISectionItem.create({
        data: {
          section_id: original.section_id,
          sort_order: (maxOrder._max.sort_order || 0) + 1,
          is_active: false,
          title_ar: original.title_ar ? `${original.title_ar} (نسخة)` : null,
          title_en: original.title_en ? `${original.title_en} (Copy)` : null,
          subtitle_ar: original.subtitle_ar,
          subtitle_en: original.subtitle_en,
          description_ar: original.description_ar,
          description_en: original.description_en,
          image_url: original.image_url,
          image_url_ar: original.image_url_ar,
          icon: original.icon,
          video_url: original.video_url,
          action_type: original.action_type,
          action_url: original.action_url,
          action_params: original.action_params as any,
          badge_text_ar: original.badge_text_ar,
          badge_text_en: original.badge_text_en,
          badge_color: original.badge_color,
          price: original.price,
          original_price: original.original_price,
          currency: original.currency,
          reference_type: original.reference_type,
          reference_id: original.reference_id,
          custom_data: original.custom_data as any
        }
      });

      res.status(201).json({ item: duplicate });
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await prisma.uISectionItem.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ error: 'Item not found' });

      const updated = await prisma.uISectionItem.update({
        where: { id },
        data: { is_active: !item.is_active }
      });

      res.json({ item: updated });
    } catch (error) {
      next(error);
    }
  }

  async reorderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;
      await prisma.$transaction(
        items.map((item: { id: string; sort_order: number }) =>
          prisma.uISectionItem.update({
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

  async bulkCreateItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id, items } = req.body;
      const maxOrder = await prisma.uISectionItem.aggregate({
        where: { section_id },
        _max: { sort_order: true }
      });

      let currentOrder = maxOrder._max.sort_order || 0;
      const createdItems = await prisma.$transaction(
        items.map((item: any) =>
          prisma.uISectionItem.create({
            data: { ...item, section_id, sort_order: ++currentOrder }
          })
        )
      );

      res.status(201).json({ items: createdItems });
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      await prisma.uISectionItem.deleteMany({ where: { id: { in: ids } } });
      res.json({ success: true, deleted: ids.length });
    } catch (error) {
      next(error);
    }
  }
}
