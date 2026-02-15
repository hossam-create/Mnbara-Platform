/**
 * Shopping Assistant Controller
 * 
 * Handles all shopping assistant requests
 */

import { Request, Response } from 'express';
import shoppingAssistantService from '../services/shopping-assistant.service';

export class ShoppingAssistantController {
  /**
   * POST /api/shopping-assistant/chat
   * Chat with the shopping assistant
   */
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { userId, message, conversationHistory } = req.body;

      if (!userId || !message) {
        res.status(400).json({
          error: 'userId and message are required'
        });
        return;
      }

      const response = await shoppingAssistantService.chat({
        userId,
        message,
        conversationHistory
      });

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Shopping assistant error:', error);
      res.status(500).json({
        error: 'Failed to process request'
      });
    }
  }

  /**
   * GET /api/shopping-assistant/conversation/:userId
   * Get conversation history
   */
  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Find shopping assistant agent
      const agent = await prisma.agent.findFirst({
        where: { name: 'Shopping Assistant' }
      });

      if (!agent) {
        res.json({
          success: true,
          data: []
        });
        return;
      }

      // Get conversation with messages
      const conversation = await prisma.conversation.findFirst({
        where: {
          agentId: agent.id,
          userId: userId
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      const messages = conversation?.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt
      })) || [];

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        error: 'Failed to get conversation'
      });
    }
  }

  /**
   * DELETE /api/shopping-assistant/conversation/:userId
   * Clear conversation history
   */
  async clearConversation(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Find shopping assistant agent
      const agent = await prisma.agent.findFirst({
        where: { name: 'Shopping Assistant' }
      });

      if (agent) {
        // Delete all conversations for this user with this agent
        await prisma.conversation.deleteMany({
          where: {
            agentId: agent.id,
            userId: userId
          }
        });
      }

      res.json({
        success: true,
        message: 'Conversation cleared'
      });
    } catch (error) {
      console.error('Clear conversation error:', error);
      res.status(500).json({
        error: 'Failed to clear conversation'
      });
    }
  }
}

export default new ShoppingAssistantController();
