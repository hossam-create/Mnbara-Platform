// ============================================================
// Communication Service
// Handles in-app messaging between match participants (Layer 5 Anti-Scam)
// ============================================================

import { PrismaClient } from '@prisma/client';
import {
  CommunicationLog,
  SendMessageInput,
  FlagMessageInput,
  MessageValidationResult,
  GetMessagesFilters,
} from '../types/communication.types';
import {
  ExternalContactDetectedError,
  MessageFlaggedError,
  UnauthorizedAccessError,
} from '../errors/ExchangeErrors';

export class CommunicationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Send a message between match participants
   */
  async sendMessage(input: SendMessageInput): Promise<CommunicationLog> {
    const { matchId, senderId, recipientId, message } = input;

    // Verify match exists and users are participants
    const match = await this.prisma.exchangeMatch.findUnique({
      where: { id: matchId },
      include: {
        request: true,
        counterRequest: true,
      },
    });

    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Verify sender is part of the match
    if (
      match.request.userId !== senderId &&
      match.counterRequest.userId !== senderId
    ) {
      throw new UnauthorizedAccessError(senderId, `match ${matchId}`);
    }

    // Verify recipient is part of the match
    if (
      match.request.userId !== recipientId &&
      match.counterRequest.userId !== recipientId
    ) {
      throw new UnauthorizedAccessError(recipientId, `match ${matchId}`);
    }

    // Validate message for external contact information
    const validation = this.detectExternalContact(message);

    if (validation.containsExternalContact) {
      // Auto-flag message with external contact
      const log = await this.prisma.communicationLog.create({
        data: {
          matchId,
          senderId,
          recipientId,
          message,
          flagged: true,
          flagReason: `External contact detected: ${validation.detectedPatterns.join(', ')}`,
        },
      });

      // TODO: Notify admin
      // TODO: Log security event
      // TODO: Potentially freeze match

      throw new ExternalContactDetectedError(matchId, validation.detectedPatterns);
    }

    // Create message log
    const log = await this.prisma.communicationLog.create({
      data: {
        matchId,
        senderId,
        recipientId,
        message,
        flagged: false,
      },
    });

    // TODO: Send real-time notification to recipient
    // TODO: Log event

    return this.mapToCommunicationLog(log);
  }

  /**
   * Get messages for a match
   */
  async getMatchMessages(
    filters: GetMessagesFilters,
    userId: number
  ): Promise<CommunicationLog[]> {
    const { matchId, limit = 50, offset = 0 } = filters;

    // Verify user has access to match
    const match = await this.prisma.exchangeMatch.findUnique({
      where: { id: matchId },
      include: {
        request: true,
        counterRequest: true,
      },
    });

    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    if (
      match.request.userId !== userId &&
      match.counterRequest.userId !== userId
    ) {
      throw new UnauthorizedAccessError(userId, `match ${matchId}`);
    }

    // Get messages
    const messages = await this.prisma.communicationLog.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    return messages.map((msg) => this.mapToCommunicationLog(msg));
  }

  /**
   * Flag a message as suspicious
   */
  async flagMessage(input: FlagMessageInput, userId: number): Promise<CommunicationLog> {
    const { messageId, reason } = input;

    const message = await this.prisma.communicationLog.findUnique({
      where: { id: messageId },
      include: {
        match: {
          include: {
            request: true,
            counterRequest: true,
          },
        },
      },
    });

    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Verify user has access to the match
    if (
      message.match.request.userId !== userId &&
      message.match.counterRequest.userId !== userId
    ) {
      throw new UnauthorizedAccessError(userId, `message ${messageId}`);
    }

    // Update message as flagged
    const updatedMessage = await this.prisma.communicationLog.update({
      where: { id: messageId },
      data: {
        flagged: true,
        flagReason: reason,
      },
    });

    // TODO: Notify admin for review
    // TODO: Log security event
    // TODO: Potentially escalate to fraud detection

    return this.mapToCommunicationLog(updatedMessage);
  }

  /**
   * Detect external contact information in message
   */
  detectExternalContact(message: string): MessageValidationResult {
    const detectedPatterns: string[] = [];

    // Phone number patterns
    const phonePatterns = [
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // US format: 123-456-7890
      /\b\d{10,15}\b/g, // Generic 10-15 digit numbers
      /\+\d{1,3}[-.\s]?\d{1,14}\b/g, // International format: +1-234-567-8900
      /\b0\d{9,10}\b/g, // UK/EU format: 01234567890
    ];

    for (const pattern of phonePatterns) {
      if (pattern.test(message)) {
        detectedPatterns.push('phone number');
        break;
      }
    }

    // Email patterns
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailPattern.test(message)) {
      detectedPatterns.push('email address');
    }

    // Social media patterns
    const socialMediaPatterns = [
      /\b(?:whatsapp|telegram|signal|viber|wechat|line)\b/gi,
      /\b(?:facebook|instagram|twitter|snapchat|tiktok)\b/gi,
      /\b(?:@[A-Za-z0-9_]{1,15})\b/g, // Twitter/Instagram handles
    ];

    for (const pattern of socialMediaPatterns) {
      if (pattern.test(message)) {
        detectedPatterns.push('social media');
        break;
      }
    }

    // URL patterns
    const urlPattern = /\b(?:https?:\/\/|www\.)[^\s]+\b/gi;
    if (urlPattern.test(message)) {
      detectedPatterns.push('URL/link');
    }

    // Suspicious keywords
    const suspiciousKeywords = [
      /\b(?:call me|text me|dm me|message me)\b/gi,
      /\b(?:my number|my email|my whatsapp)\b/gi,
      /\b(?:contact me at|reach me at)\b/gi,
      /\b(?:outside|off platform|off-platform)\b/gi,
    ];

    for (const pattern of suspiciousKeywords) {
      if (pattern.test(message)) {
        detectedPatterns.push('suspicious keyword');
        break;
      }
    }

    return {
      valid: detectedPatterns.length === 0,
      containsExternalContact: detectedPatterns.length > 0,
      detectedPatterns: [...new Set(detectedPatterns)], // Remove duplicates
    };
  }

  /**
   * Get flagged messages for admin review
   */
  async getFlaggedMessages(limit: number = 50): Promise<CommunicationLog[]> {
    const messages = await this.prisma.communicationLog.findMany({
      where: {
        flagged: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        match: {
          include: {
            request: true,
            counterRequest: true,
          },
        },
      },
    });

    return messages.map((msg) => this.mapToCommunicationLog(msg));
  }

  /**
   * Get message by ID (admin only)
   */
  async getMessage(messageId: number): Promise<CommunicationLog> {
    const message = await this.prisma.communicationLog.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    return this.mapToCommunicationLog(message);
  }

  /**
   * Delete message (admin only, within 5 minutes)
   */
  async deleteMessage(messageId: number, userId: number): Promise<void> {
    const message = await this.prisma.communicationLog.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Check if user is sender
    if (message.senderId !== userId) {
      throw new UnauthorizedAccessError(userId, `message ${messageId}`);
    }

    // Check if message was sent within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.createdAt < fiveMinutesAgo) {
      throw new Error('Messages can only be deleted within 5 minutes of sending');
    }

    await this.prisma.communicationLog.delete({
      where: { id: messageId },
    });

    // TODO: Log event
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private mapToCommunicationLog(data: any): CommunicationLog {
    return {
      id: data.id,
      matchId: data.matchId,
      senderId: data.senderId,
      recipientId: data.recipientId,
      message: data.message,
      flagged: data.flagged,
      flagReason: data.flagReason,
      createdAt: data.createdAt,
    };
  }
}
