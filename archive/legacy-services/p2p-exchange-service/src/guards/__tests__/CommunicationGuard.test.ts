import { CommunicationGuard } from '../CommunicationGuard';
import { CommunicationService } from '../../services/communication.service';

// Mock the service
jest.mock('../../services/communication.service');

describe('CommunicationGuard', () => {
  let guard: CommunicationGuard;
  let mockService: jest.Mocked<CommunicationService>;

  beforeEach(() => {
    mockService = new CommunicationService(null as any) as jest.Mocked<CommunicationService>;
    guard = new CommunicationGuard(mockService);
    jest.clearAllMocks();
  });

  describe('validateMessage', () => {
    it('should pass validation for clean message', async () => {
      const message = 'Hello, I am ready to proceed with the exchange';
      const result = await guard.validateMessage(message);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should detect phone numbers', async () => {
      const message = 'Call me at 1234567890';
      const result = await guard.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('External contact information detected');
    });

    it('should detect email addresses', async () => {
      const message = 'Email me at user@example.com';
      const result = await guard.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('External contact information detected');
    });

    it('should detect messaging apps', async () => {
      const messages = [
        'Add me on WhatsApp',
        'Message me on Telegram',
        'Contact via Signal',
        'WeChat me',
        'Line ID: user123',
      ];

      for (const message of messages) {
        const result = await guard.validateMessage(message);
        expect(result.valid).toBe(false);
      }
    });

    it('should detect social media', async () => {
      const messages = [
        'Find me on Facebook',
        'DM me on Instagram',
        'Follow me on Twitter',
        'Add me on Snapchat',
        'Check my TikTok',
      ];

      for (const message of messages) {
        const result = await guard.validateMessage(message);
        expect(result.valid).toBe(false);
      }
    });

    it('should detect video call apps', async () => {
      const messages = ['Let\'s Skype', 'Join my Zoom', 'Google Meet link', 'Teams call'];

      for (const message of messages) {
        const result = await guard.validateMessage(message);
        expect(result.valid).toBe(false);
      }
    });

    it('should detect contact requests', async () => {
      const messages = ['Call me later', 'Text me when ready', 'DM me', 'Add me'];

      for (const message of messages) {
        const result = await guard.validateMessage(message);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('detectExternalContact', () => {
    it('should return true for messages with external contact', () => {
      expect(guard.detectExternalContact('Call me at 1234567890')).toBe(true);
      expect(guard.detectExternalContact('Email: user@example.com')).toBe(true);
      expect(guard.detectExternalContact('WhatsApp me')).toBe(true);
    });

    it('should return false for clean messages', () => {
      expect(guard.detectExternalContact('Hello, how are you?')).toBe(false);
      expect(guard.detectExternalContact('Ready to proceed')).toBe(false);
    });
  });

  describe('flagMessage', () => {
    it('should flag message and log event', async () => {
      const messageId = 1;
      const reason = 'Phone number detected';
      const userId = 1;

      mockService.flagMessage = jest.fn().mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.flagMessage(messageId, reason, userId);

      expect(mockService.flagMessage).toHaveBeenCalledWith({ messageId, reason }, userId);
      expect(consoleSpy).toHaveBeenCalledWith(
        'COMMUNICATION_VIOLATION',
        expect.objectContaining({
          messageId,
          reason,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getViolationCount', () => {
    it('should return violation count', async () => {
      const userId = 1;
      const count = await guard.getViolationCount(userId);

      expect(count).toBe(0); // Placeholder implementation
    });
  });

  describe('shouldBlockMessage', () => {
    it('should return true for messages with external contact', async () => {
      const message = 'Call me at 1234567890';
      const result = await guard.shouldBlockMessage(message);

      expect(result).toBe(true);
    });

    it('should return false for clean messages', async () => {
      const message = 'Hello, ready to proceed';
      const result = await guard.shouldBlockMessage(message);

      expect(result).toBe(false);
    });
  });

  describe('sanitizeMessage', () => {
    it('should remove phone numbers', () => {
      const message = 'Call me at 1234567890 or 9876543210';
      const result = guard.sanitizeMessage(message);

      expect(result.sanitized).toContain('[REMOVED]');
      expect(result.removed).toHaveLength(2);
    });

    it('should remove email addresses', () => {
      const message = 'Email me at user@example.com';
      const result = guard.sanitizeMessage(message);

      expect(result.sanitized).toContain('[REMOVED]');
      expect(result.removed).toContain('user@example.com');
    });

    it('should remove messaging app mentions', () => {
      const message = 'Add me on WhatsApp';
      const result = guard.sanitizeMessage(message);

      expect(result.sanitized).toContain('[REMOVED]');
      expect(result.removed.length).toBeGreaterThan(0);
    });

    it('should not modify clean messages', () => {
      const message = 'Hello, ready to proceed';
      const result = guard.sanitizeMessage(message);

      expect(result.sanitized).toBe(message);
      expect(result.removed).toHaveLength(0);
    });
  });

  describe('enforceInDisputeResolution', () => {
    it('should check for communication violations', async () => {
      const disputeId = 1;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await guard.enforceInDisputeResolution(disputeId);

      expect(result).toBe(false); // No violations in placeholder
      expect(consoleSpy).toHaveBeenCalledWith(
        'DISPUTE_COMMUNICATION_CHECK',
        expect.objectContaining({
          disputeId,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getFlaggedMessages', () => {
    it('should return flagged message IDs', async () => {
      const matchId = 1;
      const userId = 1;

      mockService.getMatchMessages = jest.fn().mockResolvedValue([
        { id: 1, matchId, senderId: 1, content: 'Hello', flagged: false, createdAt: new Date() },
        { id: 2, matchId, senderId: 2, content: 'Call me', flagged: true, createdAt: new Date() },
        { id: 3, matchId, senderId: 1, content: 'OK', flagged: false, createdAt: new Date() },
        { id: 4, matchId, senderId: 2, content: 'Email me', flagged: true, createdAt: new Date() },
      ]);

      const flaggedIds = await guard.getFlaggedMessages(matchId, userId);

      expect(flaggedIds).toEqual([2, 4]);
    });

    it('should return empty array when no flagged messages', async () => {
      const matchId = 1;
      const userId = 1;

      mockService.getMatchMessages = jest.fn().mockResolvedValue([
        { id: 1, matchId, senderId: 1, content: 'Hello', flagged: false, createdAt: new Date() },
        { id: 2, matchId, senderId: 2, content: 'Hi', flagged: false, createdAt: new Date() },
      ]);

      const flaggedIds = await guard.getFlaggedMessages(matchId, userId);

      expect(flaggedIds).toEqual([]);
    });
  });
});
