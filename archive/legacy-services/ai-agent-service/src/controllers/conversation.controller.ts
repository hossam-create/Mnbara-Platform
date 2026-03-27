import { Request, Response } from 'express';
import { AgentService } from '../services/agent.service';
import { logger } from '../utils/logger';

const agentService = new AgentService();

export class ConversationController {
  // Get conversation
  async getConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;

      const conversation = await agentService.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }

      res.json({ success: true, data: conversation });
    } catch (error: any) {
      logger.error('Get conversation error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // List conversations
  async listConversations(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string | undefined;
      const agentId = req.query.agentId as string | undefined;

      const conversations = await agentService.listConversations(userId, agentId);

      res.json({ success: true, data: conversations });
    } catch (error: any) {
      logger.error('List conversations error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Delete conversation
  async deleteConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;

      await agentService.deleteConversation(conversationId);

      res.json({ success: true, message: 'Conversation deleted' });
    } catch (error: any) {
      logger.error('Delete conversation error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
