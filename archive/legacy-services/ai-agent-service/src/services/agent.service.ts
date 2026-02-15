import { PrismaClient } from '@prisma/client';
import { LLMService, LLMMessage } from './llm.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateAgentInput {
  name: string;
  type: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  config?: Record<string, any>;
}

export interface ChatInput {
  agentId: string;
  message: string;
  userId?: string;
  sessionId?: string;
  conversationId?: string;
}

export class AgentService {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService();
  }

  // Create agent
  async createAgent(input: CreateAgentInput) {
    try {
      const agent = await prisma.agent.create({
        data: {
          name: input.name,
          type: input.type,
          model: input.model,
          systemPrompt: input.systemPrompt,
          temperature: input.temperature || 0.7,
          maxTokens: input.maxTokens || 2000,
          config: input.config || {}
        }
      });

      logger.info(`Agent created: ${agent.id}`);
      return agent;
    } catch (error) {
      logger.error('Create agent error:', error);
      throw error;
    }
  }

  // Get agent
  async getAgent(agentId: string) {
    return prisma.agent.findUnique({
      where: { id: agentId }
    });
  }

  // List agents
  async listAgents(type?: string) {
    return prisma.agent.findMany({
      where: type ? { type, isActive: true } : { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Update agent
  async updateAgent(agentId: string, data: Partial<CreateAgentInput>) {
    return prisma.agent.update({
      where: { id: agentId },
      data
    });
  }

  // Delete agent
  async deleteAgent(agentId: string) {
    return prisma.agent.update({
      where: { id: agentId },
      data: { isActive: false }
    });
  }

  // Chat with agent
  async chat(input: ChatInput) {
    try {
      const agent = await this.getAgent(input.agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Get or create conversation
      let conversation;
      if (input.conversationId) {
        conversation = await prisma.conversation.findUnique({
          where: { id: input.conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
      } else {
        conversation = await prisma.conversation.create({
          data: {
            agentId: input.agentId,
            userId: input.userId,
            sessionId: input.sessionId || `sess_${Date.now()}`,
            title: input.message.substring(0, 50)
          },
          include: { messages: true }
        });
      }

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Build message history
      const messages: LLMMessage[] = [
        { role: 'system', content: agent.systemPrompt }
      ];

      // Add conversation history
      for (const msg of conversation.messages) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      }

      // Add new user message
      messages.push({
        role: 'user',
        content: input.message
      });

      // Save user message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: input.message
        }
      });

      // Generate response
      const response = await this.llm.generate(
        messages,
        agent.model,
        agent.temperature,
        agent.maxTokens
      );

      // Save assistant message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: response.content,
          tokens: response.tokens
        }
      });

      logger.info(`Chat completed: ${conversation.id}`);

      return {
        conversationId: conversation.id,
        message: response.content,
        tokens: response.tokens
      };
    } catch (error) {
      logger.error('Chat error:', error);
      throw error;
    }
  }

  // Get conversation
  async getConversation(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  // List conversations
  async listConversations(userId?: string, agentId?: string) {
    return prisma.conversation.findMany({
      where: {
        ...(userId && { userId }),
        ...(agentId && { agentId })
      },
      include: {
        agent: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  // Delete conversation
  async deleteConversation(conversationId: string) {
    return prisma.conversation.delete({
      where: { id: conversationId }
    });
  }
}
