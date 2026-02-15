import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { logger } from '../utils/logger';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const { type, name, avatar, participantIds } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!participantIds || !Array.isArray(participantIds)) {
        res.status(400).json({ success: false, error: 'participantIds required' });
        return;
      }

      const conversation = await this.chatService.createConversation({
        type: type || 'DIRECT',
        name,
        avatar,
        participantIds: [...participantIds, userId],
        createdBy: userId,
      });

      res.json({ success: true, data: conversation });
    } catch (error) {
      logger.error('Create conversation error:', error);
      res.status(500).json({ success: false, error: 'Failed to create conversation' });
    }
  }

  async getUserConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const conversations = await this.chatService.getUserConversations(userId, limit);

      res.json({ success: true, data: conversations });
    } catch (error) {
      logger.error('Get conversations error:', error);
      res.status(500).json({ success: false, error: 'Failed to get conversations' });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before as string;

      const messages = await this.chatService.getMessages(conversationId, limit, before);

      res.json({ success: true, data: messages });
    } catch (error) {
      logger.error('Get messages error:', error);
      res.status(500).json({ success: false, error: 'Failed to get messages' });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const count = await this.chatService.getUnreadCount(userId, conversationId);

      res.json({ success: true, data: { count } });
    } catch (error) {
      logger.error('Get unread count error:', error);
      res.status(500).json({ success: false, error: 'Failed to get unread count' });
    }
  }

  async addParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { userId: newUserId } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await this.chatService.addParticipant(conversationId, newUserId, userId);

      res.json({ success: true, message: 'Participant added' });
    } catch (error) {
      logger.error('Add participant error:', error);
      res.status(500).json({ success: false, error: 'Failed to add participant' });
    }
  }

  async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, userId: targetUserId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await this.chatService.removeParticipant(conversationId, targetUserId, userId);

      res.json({ success: true, message: 'Participant removed' });
    } catch (error) {
      logger.error('Remove participant error:', error);
      res.status(500).json({ success: false, error: 'Failed to remove participant' });
    }
  }
}
