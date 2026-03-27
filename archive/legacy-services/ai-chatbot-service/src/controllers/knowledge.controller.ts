// Knowledge Controller - متحكم قاعدة المعرفة

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const knowledgeController = {
  async getArticles(req: Request, res: Response) {
    try {
      const { category, page = '1', limit = '20' } = req.query;
      const where: any = { isPublished: true };
      
      if (category) where.category = category;

      const [articles, total] = await Promise.all([
        prisma.knowledgeArticle.findMany({
          where,
          orderBy: { viewCount: 'desc' },
          skip: (parseInt(page as string) - 1) * parseInt(limit as string),
          take: parseInt(limit as string),
        }),
        prisma.knowledgeArticle.count({ where }),
      ]);

      res.json({ success: true, data: articles, total, page: parseInt(page as string), limit: parseInt(limit as string) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async searchArticles(req: Request, res: Response) {
    try {
      const { q, language = 'ar' } = req.query;
      
      if (!q) {
        return res.status(400).json({ success: false, error: 'Search query required', errorAr: 'مطلوب نص البحث' });
      }

      const searchTerm = (q as string).toLowerCase();
      const articles = await prisma.knowledgeArticle.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { titleAr: { contains: searchTerm, mode: 'insensitive' } },
            { keywords: { has: searchTerm } },
            { keywordsAr: { has: searchTerm } },
            { tags: { has: searchTerm } },
          ],
        },
        orderBy: { helpfulCount: 'desc' },
        take: 10,
      });

      res.json({ success: true, data: articles });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getArticle(req: Request, res: Response) {
    try {
      const article = await prisma.knowledgeArticle.update({
        where: { id: req.params.articleId },
        data: { viewCount: { increment: 1 } },
      });

      if (!article) {
        return res.status(404).json({ success: false, error: 'Article not found', errorAr: 'المقال غير موجود' });
      }

      res.json({ success: true, data: article });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createArticle(req: Request, res: Response) {
    try {
      const { title, titleAr, content, contentAr, category, tags, keywords, keywordsAr } = req.body;

      const article = await prisma.knowledgeArticle.create({
        data: {
          title,
          titleAr,
          content,
          contentAr,
          category,
          tags: tags || [],
          keywords: keywords || [],
          keywordsAr: keywordsAr || [],
        },
      });

      res.status(201).json({ success: true, data: article, message: 'Article created', messageAr: 'تم إنشاء المقال' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateArticle(req: Request, res: Response) {
    try {
      const { title, titleAr, content, contentAr, category, tags, keywords, keywordsAr, isPublished } = req.body;

      const article = await prisma.knowledgeArticle.update({
        where: { id: req.params.articleId },
        data: { title, titleAr, content, contentAr, category, tags, keywords, keywordsAr, isPublished },
      });

      res.json({ success: true, data: article, message: 'Article updated', messageAr: 'تم تحديث المقال' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async deleteArticle(req: Request, res: Response) {
    try {
      await prisma.knowledgeArticle.delete({ where: { id: req.params.articleId } });
      res.json({ success: true, message: 'Article deleted', messageAr: 'تم حذف المقال' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async submitFeedback(req: Request, res: Response) {
    try {
      const { helpful } = req.body;
      const field = helpful ? 'helpfulCount' : 'notHelpfulCount';

      const article = await prisma.knowledgeArticle.update({
        where: { id: req.params.articleId },
        data: { [field]: { increment: 1 } },
      });

      res.json({ success: true, data: article, message: 'Thank you for feedback', messageAr: 'شكراً لملاحظاتك' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
