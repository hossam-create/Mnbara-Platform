// ============================================================
// Communication Service Tests
// ============================================================

import { PrismaClient } from '@prisma/client';
import { CommunicationService } from '../communication.service';
import {
  ExternalContactDetectedError,
  UnauthorizedAccessError,
} from '../../errors/ExchangeErrors';

// Mock Prisma Client
const mockPrisma = {
  communicationLog: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  exchangeMatch: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

describe('CommunicationService', () => {
  let service: CommunicationService;

  beforeEach(() => {
    service = new CommunicationService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    const mockMatch = {
      id: 1,
      request: { userId: 100 },
      counterRequest: { userId: 200 },
    };

    it('should send message successfully', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (mockPrisma.communicationLog.create as jest.Mock).mockResolvedValue({
        id: 1,
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Hello, when can we complete the exchange?',
        flagged: false,
        flagReason: null,
        createdAt: new Date(),
      });

      const result = await service.sendMessage({
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Hello, when can we complete the exchange?',
      });

      expect(result.flagged).toBe(false);
      expect(result.message).toBe('Hello, when can we complete the exchange?');
      expect(mockPrisma.communicationLog.create).toHaveBeenCalled();
    });

    it('should reject unauthorized sender', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      await expect(
        service.sendMessage({
          matchId: 1,
          senderId: 999, // Not part of match
          recipientId: 200,
          message: 'Hello',
        })
      ).rejects.toThrow(UnauthorizedAccessError);
    });

    it('should reject unauthorized recipient', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      await expect(
        service.sendMessage({
          matchId: 1,
          senderId: 100,
          recipientId: 999, // Not part of match
          message: 'Hello',
        })
      ).rejects.toThrow(UnauthorizedAccessError);
    });

    it('should detect and flag phone number', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (mockPrisma.communicationLog.create as jest.Mock).mockResolvedValue({
        id: 1,
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Call me at 123-456-7890',
        flagged: true,
        flagReason: 'External contact detected: phone number',
        createdAt: new Date(),
      });

      await expect(
        service.sendMessage({
          matchId: 1,
          senderId: 100,
          recipientId: 200,
          message: 'Call me at 123-456-7890',
        })
      ).rejects.toThrow(ExternalContactDetectedError);

      expect(mockPrisma.communicationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            flagged: true,
          }),
        })
      );
    });

    it('should detect and flag email address', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (mockPrisma.communicationLog.create as jest.Mock).mockResolvedValue({
        id: 1,
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Email me at user@example.com',
        flagged: true,
        flagReason: 'External contact detected: email address',
        createdAt: new Date(),
      });

      await expect(
        service.sendMessage({
          matchId: 1,
          senderId: 100,
          recipientId: 200,
          message: 'Email me at user@example.com',
        })
      ).rejects.toThrow(ExternalContactDetectedError);
    });

    it('should detect and flag social media', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (mockPrisma.communicationLog.create as jest.Mock).mockResolvedValue({
        id: 1,
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Message me on WhatsApp',
        flagged: true,
        flagReason: 'External contact detected: social media',
        createdAt: new Date(),
      });

      await expect(
        service.sendMessage({
          matchId: 1,
          senderId: 100,
          recipientId: 200,
          message: 'Message me on WhatsApp',
        })
      ).rejects.toThrow(ExternalContactDetectedError);
    });

    it('should detect and flag URLs', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (mockPrisma.communicationLog.create as jest.Mock).mockResolvedValue({
        id: 1,
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Check out https://example.com',
        flagged: true,
        flagReason: 'External contact detected: URL/link',
        createdAt: new Date(),
      });

      await expect(
        service.sendMessage({
          matchId: 1,
          senderId: 100,
          recipientId: 200,
          message: 'Check out https://example.com',
        })
      ).rejects.toThrow(ExternalContactDetectedError);
    });
  });

  describe('getMatchMessages', () => {
    const mockMatch = {
      id: 1,
      request: { userId: 100 },
      counterRequest: { userId: 200 },
    };

    it('should get messages for a match', async () => {
      const mockMessages = [
        {
          id: 1,
          matchId: 1,
          senderId: 100,
          recipientId: 200,
          message: 'Hello',
          flagged: false,
          flagReason: null,
          createdAt: new Date('2026-01-25T10:00:00Z'),
        },
        {
          id: 2,
          matchId: 1,
          senderId: 200,
          recipientId: 100,
          message: 'Hi there',
          flagged: false,
          flagReason: null,
          createdAt: new Date('2026-01-25T10:01:00Z'),
        },
      ];

      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (mockPrisma.communicationLog.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await service.getMatchMessages({ matchId: 1 }, 100);

      expect(result).toHaveLength(2);
      expect(result[0].message).toBe('Hello');
      expect(result[1].message).toBe('Hi there');
    });

    it('should reject unauthorized access', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      await expect(
        service.getMatchMessages({ matchId: 1 }, 999)
      ).rejects.toThrow(UnauthorizedAccessError);
    });

    it('should apply limit and offset', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (mockPrisma.communicationLog.findMany as jest.Mock).mockResolvedValue([]);

      await service.getMatchMessages({ matchId: 1, limit: 10, offset: 5 }, 100);

      expect(mockPrisma.communicationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        })
      );
    });
  });

  describe('flagMessage', () => {
    it('should flag a message', async () => {
      const mockMessage = {
        id: 1,
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Suspicious message',
        flagged: false,
        flagReason: null,
        createdAt: new Date(),
        match: {
          request: { userId: 100 },
          counterRequest: { userId: 200 },
        },
      };

      (mockPrisma.communicationLog.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (mockPrisma.communicationLog.update as jest.Mock).mockResolvedValue({
        ...mockMessage,
        flagged: true,
        flagReason: 'Inappropriate content',
      });

      const result = await service.flagMessage(
        { messageId: 1, reason: 'Inappropriate content' },
        200
      );

      expect(result.flagged).toBe(true);
      expect(result.flagReason).toBe('Inappropriate content');
    });

    it('should reject unauthorized flagging', async () => {
      const mockMessage = {
        id: 1,
        matchId: 1,
        match: {
          request: { userId: 100 },
          counterRequest: { userId: 200 },
        },
      };

      (mockPrisma.communicationLog.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(
        service.flagMessage({ messageId: 1, reason: 'Test' }, 999)
      ).rejects.toThrow(UnauthorizedAccessError);
    });
  });

  describe('detectExternalContact', () => {
    it('should detect phone numbers', () => {
      const testCases = [
        '123-456-7890',
        '1234567890',
        '+1-234-567-8900',
        '01234567890',
      ];

      testCases.forEach((phoneNumber) => {
        const result = service.detectExternalContact(`Call me at ${phoneNumber}`);
        expect(result.containsExternalContact).toBe(true);
        expect(result.detectedPatterns).toContain('phone number');
      });
    });

    it('should detect email addresses', () => {
      const result = service.detectExternalContact('Email me at user@example.com');
      expect(result.containsExternalContact).toBe(true);
      expect(result.detectedPatterns).toContain('email address');
    });

    it('should detect social media keywords', () => {
      const testCases = [
        'Message me on WhatsApp',
        'Add me on Telegram',
        'Find me on Facebook',
        'DM me @username',
      ];

      testCases.forEach((message) => {
        const result = service.detectExternalContact(message);
        expect(result.containsExternalContact).toBe(true);
        expect(result.detectedPatterns).toContain('social media');
      });
    });

    it('should detect URLs', () => {
      const testCases = [
        'Check out https://example.com',
        'Visit www.example.com',
        'Go to http://test.org',
      ];

      testCases.forEach((message) => {
        const result = service.detectExternalContact(message);
        expect(result.containsExternalContact).toBe(true);
        expect(result.detectedPatterns).toContain('URL/link');
      });
    });

    it('should detect suspicious keywords', () => {
      const testCases = [
        'Call me later',
        'Text me your number',
        'Contact me at my email',
        'Let\'s talk outside the platform',
      ];

      testCases.forEach((message) => {
        const result = service.detectExternalContact(message);
        expect(result.containsExternalContact).toBe(true);
        expect(result.detectedPatterns).toContain('suspicious keyword');
      });
    });

    it('should allow clean messages', () => {
      const cleanMessages = [
        'Hello, how are you?',
        'When can we complete the exchange?',
        'I have received the payment',
        'Thank you for the transaction',
      ];

      cleanMessages.forEach((message) => {
        const result = service.detectExternalContact(message);
        expect(result.containsExternalContact).toBe(false);
        expect(result.valid).toBe(true);
        expect(result.detectedPatterns).toHaveLength(0);
      });
    });

    it('should detect multiple patterns', () => {
      const result = service.detectExternalContact(
        'Call me at 123-456-7890 or email user@example.com'
      );
      expect(result.containsExternalContact).toBe(true);
      expect(result.detectedPatterns).toContain('phone number');
      expect(result.detectedPatterns).toContain('email address');
    });
  });

  describe('getFlaggedMessages', () => {
    it('should get flagged messages', async () => {
      const mockMessages = [
        {
          id: 1,
          matchId: 1,
          senderId: 100,
          recipientId: 200,
          message: 'Flagged message 1',
          flagged: true,
          flagReason: 'Spam',
          createdAt: new Date(),
          match: {
            request: { userId: 100 },
            counterRequest: { userId: 200 },
          },
        },
        {
          id: 2,
          matchId: 2,
          senderId: 101,
          recipientId: 201,
          message: 'Flagged message 2',
          flagged: true,
          flagReason: 'External contact',
          createdAt: new Date(),
          match: {
            request: { userId: 101 },
            counterRequest: { userId: 201 },
          },
        },
      ];

      (mockPrisma.communicationLog.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await service.getFlaggedMessages(50);

      expect(result).toHaveLength(2);
      expect(result[0].flagged).toBe(true);
      expect(result[1].flagged).toBe(true);
    });
  });

  describe('deleteMessage', () => {
    it('should delete message within 5 minutes', async () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      const mockMessage = {
        id: 1,
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Test message',
        flagged: false,
        flagReason: null,
        createdAt: recentDate,
      };

      (mockPrisma.communicationLog.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (mockPrisma.communicationLog.delete as jest.Mock).mockResolvedValue(mockMessage);

      await service.deleteMessage(1, 100);

      expect(mockPrisma.communicationLog.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should reject deletion after 5 minutes', async () => {
      const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const mockMessage = {
        id: 1,
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Test message',
        flagged: false,
        flagReason: null,
        createdAt: oldDate,
      };

      (mockPrisma.communicationLog.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(service.deleteMessage(1, 100)).rejects.toThrow(
        'Messages can only be deleted within 5 minutes'
      );
    });

    it('should reject deletion by non-sender', async () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 1000);
      const mockMessage = {
        id: 1,
        matchId: 1,
        senderId: 100,
        recipientId: 200,
        message: 'Test message',
        flagged: false,
        flagReason: null,
        createdAt: recentDate,
      };

      (mockPrisma.communicationLog.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(service.deleteMessage(1, 999)).rejects.toThrow(
        UnauthorizedAccessError
      );
    });
  });
});
