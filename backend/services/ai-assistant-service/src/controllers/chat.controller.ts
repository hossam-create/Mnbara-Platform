// Chat Controller - Gen 10 AI
// متحكم المحادثة - الجيل العاشر

import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';

export class ChatController {
  // Create new conversation
  async createConversation(req: Request, res: Response) {
    try {
      const { userId, type, language, context } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
          messageAr: 'معرف المستخدم مطلوب'
        });
      }

      const conversation = await chatService.createConversation({
        userId,
        type,
        language,
        context
      });

      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        messageAr: 'تم إنشاء المحادثة بنجاح',
        data: conversation
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'حدث خطأ أثناء إنشاء المحادثة'
      });
    }
  }

  // Send message
  async sendMessage(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { userId, content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required',
          messageAr: 'محتوى الرسالة مطلوب'
        });
      }

      const result = await chatService.sendMessage({
        conversationId,
        userId,
        content
      });

      // Emit via WebSocket if available
      const io = req.app.get('io');
      if (io) {
        io.to(conversationId).emit('ai_response', result.assistantMessage);
      }

      res.json({
        success: true,
        message: 'Message sent successfully',
        messageAr: 'تم إرسال الرسالة بنجاح',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'حدث خطأ أثناء إرسال الرسالة'
      });
    }
  }

  // Get conversation
  async getConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const conversation = await chatService.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
          messageAr: 'المحادثة غير موجودة'
        });
      }

      res.json({
        success: true,
        data: conversation
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user conversations
  async getUserConversations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const conversations = await chatService.getUserConversations(
        userId,
        limit ? parseInt(limit as string) : 20
      );

      res.json({
        success: true,
        data: conversations,
        count: conversations.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // End conversation
  async endConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { resolved } = req.body;

      const conversation = await chatService.endConversation(conversationId, resolved);

      res.json({
        success: true,
        message: 'Conversation ended',
        messageAr: 'تم إنهاء المحادثة',
        data: conversation
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Escalate to human
  async escalateToHuman(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { reason } = req.body;

      const conversation = await chatService.escalateToHuman(conversationId, reason);

      res.json({
        success: true,
        message: 'Conversation escalated to human support',
        messageAr: 'تم تصعيد المحادثة للدعم البشري',
        data: conversation
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const chatController = new ChatController();
