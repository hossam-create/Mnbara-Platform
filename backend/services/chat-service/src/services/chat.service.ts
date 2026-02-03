import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  CreateConversationDto,
  SendMessageDto,
  EditMessageDto,
  DeleteMessageDto,
  AddReactionDto,
  MarkAsReadDto,
} from '../types/chat.types';

export class ChatService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createConversation(data: CreateConversationDto) {
    logger.info(`Creating conversation: ${data.type}`);

    // For direct conversations, check if one already exists
    if (data.type === 'DIRECT' && data.participantIds.length === 2) {
      const existing = await this.findDirectConversation(
        data.participantIds[0],
        data.participantIds[1]
      );
      if (existing) {
        return existing;
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: data.type,
        name: data.name,
        avatar: data.avatar,
        createdBy: data.createdBy,
        participants: {
          create: data.participantIds.map((userId, index) => ({
            userId,
            role: userId === data.createdBy ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: true,
      },
    });

    logger.info(`Conversation created: ${conversation.id}`);
    return conversation;
  }

  async findDirectConversation(userId1: string, userId2: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            userId: { in: [userId1, userId2] },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    return conversations.find(
      (conv) =>
        conv.participants.length === 2 &&
        conv.participants.some((p) => p.userId === userId1) &&
        conv.participants.some((p) => p.userId === userId2)
    );
  }

  async getUserConversations(userId: string, limit = 50) {
    return await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          select: {
            userId: true,
            role: true,
            lastReadAt: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: limit,
    });
  }

  async sendMessage(data: SendMessageDto) {
    logger.info(`Sending message to conversation: ${data.conversationId}`);

    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        type: data.type || 'TEXT',
        metadata: data.metadata || {},
        replyToId: data.replyToId,
      },
      include: {
        replyTo: true,
      },
    });

    // Update conversation last message
    await this.prisma.conversation.update({
      where: { id: data.conversationId },
      data: {
        lastMessage: data.content.substring(0, 100),
        lastMessageAt: new Date(),
      },
    });

    logger.info(`Message sent: ${message.id}`);
    return message;
  }

  async getMessages(conversationId: string, limit = 50, before?: string) {
    const where: any = { conversationId, isDeleted: false };
    
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    return await this.prisma.message.findMany({
      where,
      include: {
        replyTo: true,
        reactions: true,
        readReceipts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async editMessage(data: EditMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== data.userId) {
      throw new Error('Unauthorized');
    }

    return await this.prisma.message.update({
      where: { id: data.messageId },
      data: {
        content: data.content,
        isEdited: true,
      },
    });
  }

  async deleteMessage(data: DeleteMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== data.userId) {
      throw new Error('Unauthorized');
    }

    return await this.prisma.message.update({
      where: { id: data.messageId },
      data: {
        isDeleted: true,
        content: '[Deleted]',
      },
    });
  }

  async addReaction(data: AddReactionDto) {
    return await this.prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId: data.messageId,
          userId: data.userId,
          emoji: data.emoji,
        },
      },
      create: {
        messageId: data.messageId,
        userId: data.userId,
        emoji: data.emoji,
      },
      update: {},
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    await this.prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async markAsRead(data: MarkAsReadDto) {
    // Create read receipt
    await this.prisma.messageReadReceipt.upsert({
      where: {
        messageId_userId: {
          messageId: data.messageId,
          userId: data.userId,
        },
      },
      create: {
        messageId: data.messageId,
        userId: data.userId,
      },
      update: {
        readAt: new Date(),
      },
    });

    // Update participant last read
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId: data.conversationId,
        userId: data.userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  async getUnreadCount(userId: string, conversationId: string): Promise<number> {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return 0;
    }

    return await this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        createdAt: {
          gt: participant.lastReadAt || new Date(0),
        },
        isDeleted: false,
      },
    });
  }

  async addParticipant(conversationId: string, userId: string, addedBy: string) {
    // Check if user adding has permission
    const adder = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: addedBy,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!adder) {
      throw new Error('Unauthorized');
    }

    return await this.prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId,
        role: 'MEMBER',
      },
    });
  }

  async removeParticipant(conversationId: string, userId: string, removedBy: string) {
    // Check if user removing has permission
    const remover = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: removedBy,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!remover && removedBy !== userId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.conversationParticipant.deleteMany({
      where: {
        conversationId,
        userId,
      },
    });
  }
}
