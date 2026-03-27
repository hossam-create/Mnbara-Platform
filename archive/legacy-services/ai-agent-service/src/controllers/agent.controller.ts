import { Request, Response } from 'express';
import { AgentService } from '../services/agent.service';
import { logger } from '../utils/logger';

const agentService = new AgentService();

export class AgentController {
  // Create agent
  async createAgent(req: Request, res: Response) {
    try {
      const { name, type, model, systemPrompt, temperature, maxTokens, config } = req.body;

      const agent = await agentService.createAgent({
        name,
        type,
        model,
        systemPrompt,
        temperature,
        maxTokens,
        config
      });

      res.json({ success: true, data: agent });
    } catch (error: any) {
      logger.error('Create agent error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get agent
  async getAgent(req: Request, res: Response) {
    try {
      const { agentId } = req.params;

      const agent = await agentService.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({ success: false, error: 'Agent not found' });
      }

      res.json({ success: true, data: agent });
    } catch (error: any) {
      logger.error('Get agent error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // List agents
  async listAgents(req: Request, res: Response) {
    try {
      const type = req.query.type as string | undefined;

      const agents = await agentService.listAgents(type);

      res.json({ success: true, data: agents });
    } catch (error: any) {
      logger.error('List agents error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Update agent
  async updateAgent(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const updates = req.body;

      const agent = await agentService.updateAgent(agentId, updates);

      res.json({ success: true, data: agent });
    } catch (error: any) {
      logger.error('Update agent error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Delete agent
  async deleteAgent(req: Request, res: Response) {
    try {
      const { agentId } = req.params;

      await agentService.deleteAgent(agentId);

      res.json({ success: true, message: 'Agent deleted' });
    } catch (error: any) {
      logger.error('Delete agent error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Chat with agent
  async chat(req: Request, res: Response) {
    try {
      const { agentId, message, userId, sessionId, conversationId } = req.body;

      const response = await agentService.chat({
        agentId,
        message,
        userId,
        sessionId,
        conversationId
      });

      res.json({ success: true, data: response });
    } catch (error: any) {
      logger.error('Chat error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
