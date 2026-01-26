import { CommunicationService } from '../services/communication.service';

/**
 * Communication Guard - Layer 5 of Seven-Layer Anti-Scam Architecture
 * 
 * Monitors in-platform communication for external contact attempts.
 * Flags messages containing phone numbers, emails, or social media handles.
 * Enforces communication policy violations.
 */
export class CommunicationGuard {
  /**
   * Patterns for detecting external contact information
   */
  private readonly EXTERNAL_CONTACT_PATTERNS = [
    /\b\d{10,}\b/, // Phone numbers (10+ digits)
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
    /\b(whatsapp|telegram|signal|wechat|line)\b/i, // Messaging apps
    /\b(facebook|instagram|twitter|snapchat|tiktok)\b/i, // Social media
    /\b(skype|zoom|meet|teams)\b/i, // Video call apps
    /\b(call me|text me|dm me|add me)\b/i, // Contact requests
  ];

  constructor(private readonly communicationService: CommunicationService) {}

  /**
   * Validate message for external contact patterns
   */
  async validateMessage(message: string): Promise<{ valid: boolean; reason?: string }> {
    // Check for external contact patterns
    for (const pattern of this.EXTERNAL_CONTACT_PATTERNS) {
      if (pattern.test(message)) {
        return {
          valid: false,
          reason: 'External contact information detected',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Detect external contact attempts in message
   */
  detectExternalContact(message: string): boolean {
    return this.EXTERNAL_CONTACT_PATTERNS.some((pattern) => pattern.test(message));
  }

  /**
   * Flag message for policy violation
   */
  async flagMessage(messageId: number, reason: string, userId: number): Promise<void> {
    await this.communicationService.flagMessage({ messageId, reason }, userId);

    console.log('COMMUNICATION_VIOLATION', {
      messageId,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get violation count for user
   * In production, this would query a violations table
   */
  async getViolationCount(userId: number): Promise<number> {
    // Placeholder - would query database in production
    return 0;
  }

  /**
   * Check if message should be blocked
   */
  async shouldBlockMessage(message: string): Promise<boolean> {
    const validation = await this.validateMessage(message);
    return !validation.valid;
  }

  /**
   * Sanitize message by removing external contact info
   * Returns sanitized message and list of removed patterns
   */
  sanitizeMessage(message: string): { sanitized: string; removed: string[] } {
    let sanitized = message;
    const removed: string[] = [];

    for (const pattern of this.EXTERNAL_CONTACT_PATTERNS) {
      const matches = message.match(pattern);
      if (matches) {
        removed.push(...matches);
        sanitized = sanitized.replace(pattern, '[REMOVED]');
      }
    }

    return { sanitized, removed };
  }

  /**
   * Enforce policy in dispute resolution
   * Automatically resolves dispute against violating party
   */
  async enforceInDisputeResolution(disputeId: number): Promise<boolean> {
    // In production, this would:
    // 1. Get all messages for the match
    // 2. Check for flagged messages
    // 3. Automatically resolve dispute against violator
    
    console.log('DISPUTE_COMMUNICATION_CHECK', {
      disputeId,
      timestamp: new Date().toISOString(),
    });

    return false; // No violations found
  }

  /**
   * Get all flagged messages for a match
   */
  async getFlaggedMessages(matchId: number, userId: number): Promise<number[]> {
    const messages = await this.communicationService.getMatchMessages({ matchId }, userId);
    return messages.filter((m) => m.flagged).map((m) => m.id);
  }
}
