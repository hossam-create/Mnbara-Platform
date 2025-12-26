// Chat Controller - متحكم الدردشة

import { Request, Response } from 'express';
import { chatbotService } from '../services/chatbot.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const chatController = {
  async createConversation(req: Request, res: Response) {
    try {
      const conversation = await chatbotService.createConversation(req.body);
      res.status(201).json({ success: true, data: conversation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getConversation(req: Request, res: Response) {
    try {
      const conversation = await chatbotService.getConversation(req.params.conversationId);
      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
      res.json({ success: true, data: conversation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getUserConversations(req: Request, res: Response) {
    try {
      const { page, limit } = req.query;
      const result = await chatbotService.getUserConversations(
        req.params.userId,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async sendMessage(req: Request, res: Response) {
    try {
      const { content, language } = req.body;
      const result = await chatbotService.processMessage(req.params.conversationId, content, language);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async closeConversation(req: Request, res: Response) {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: req.params.conversationId },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
      res.json({ success: true, data: conversation, message: 'Conversation closed', messageAr: 'تم إغلاق المحادثة' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async rateConversation(req: Request, res: Response) {
    try {
      const { rating, feedback } = req.body;
      const conversation = await prisma.conversation.update({
        where: { id: req.params.conversationId },
        data: { rating, feedback },
      });
      res.json({ success: true, data: conversation, message: 'Thank you for your feedback', messageAr: 'شكراً لملاحظاتك' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async escalateConversation(req: Request, res: Response) {
    try {
      const { reason } = req.body;
      const conversation = await prisma.conversation.update({
        where: { id: req.params.conversationId },
        data: {
          status: 'ESCALATED',
          isEscalated: true,
          escalatedAt: new Date(),
          escalationReason: reason,
        },
      });
      res.json({ success: true, data: conversation, message: 'Escalated to agent', messageAr: 'تم التحويل لموظف' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
