import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { CustomError } from '@/utils/error-handler';
import { ChatMessage, ChatUser } from '@/types';

export interface ModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'regex' | 'link' | 'spam' | 'length';
  pattern?: string;
  keywords?: string[];
  maxLength?: number;
  maxLinks?: number;
  maxCapsRatio?: number;
  action: 'block' | 'flag' | 'timeout' | 'delete';
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
  description: string;
}

export interface ModerationAction {
  id: string;
  userId: string;
  username: string;
  action: 'block' | 'flag' | 'timeout' | 'delete' | 'ban';
  reason: string;
  severity: 'low' | 'medium' | 'high';
  duration?: number; // in seconds
  messageId?: string;
  message?: string;
  moderatorId?: string;
  moderatorName?: string;
  timestamp: Date;
  roomId: string;
}

export interface ModerationStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsBySeverity: Record<string, number>;
  topViolators: Array<{
    userId: string;
    username: string;
    actionCount: number;
    lastAction: Date;
  }>;
  recentActions: ModerationAction[];
}

export class ChatModeration extends EventEmitter {
  private rules: Map<string, ModerationRule> = new Map();
  private actions: Map<string, ModerationAction[]> = new Map();
  private userViolations: Map<string, number> = new Map();
  private bannedUsers: Set<string> = new Set();
  private timedOutUsers: Map<string, number> = new Map(); // userId -> timeout end timestamp
  private spamDetectors: Map<string, SpamDetector> = new Map();
  private running: boolean = false;

  constructor() {
    super();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Profanity filter
    this.addRule({
      id: 'profanity',
      name: 'Profanity Filter',
      type: 'keyword',
      keywords: ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'nigger', 'faggot'],
      action: 'block',
      severity: 'high',
      enabled: true,
      description: 'Blocks messages containing profanity'
    });

    // Caps filter
    this.addRule({
      id: 'excessive_caps',
      name: 'Excessive Caps',
      type: 'length',
      maxCapsRatio: 0.7,
      action: 'flag',
      severity: 'low',
      enabled: true,
      description: 'Flags messages with excessive capitalization'
    });

    // Link filter
    this.addRule({
      id: 'excessive_links',
      name: 'Excessive Links',
      type: 'link',
      maxLinks: 3,
      action: 'flag',
      severity: 'medium',
      enabled: true,
      description: 'Flags messages with too many links'
    });

    // Spam detection
    this.addRule({
      id: 'spam_detection',
      name: 'Spam Detection',
      type: 'spam',
      action: 'timeout',
      severity: 'medium',
      enabled: true,
      description: 'Detects and times out spam messages'
    });
  }

  public async moderateMessage(
    message: ChatMessage,
    user: ChatUser,
    roomId: string
  ): Promise<{
    allowed: boolean;
    action?: ModerationAction;
    reason?: string;
  }> {
    try {
      // Check if user is banned
      if (this.isUserBanned(user.id)) {
        return {
          allowed: false,
          reason: 'User is banned'
        };
      }

      // Check if user is timed out
      if (this.isUserTimedOut(user.id)) {
        return {
          allowed: false,
          reason: 'User is timed out'
        };
      }

      // Apply moderation rules
      for (const rule of this.rules.values()) {
        if (!rule.enabled) continue;

        const violation = await this.checkRule(rule, message, user);
        
        if (violation) {
          const action = await this.executeAction(rule, message, user, roomId);
          
          this.emit('moderation-action', {
            action,
            rule,
            message,
            user
          });

          return {
            allowed: rule.action === 'flag',
            action,
            reason: violation.reason
          };
        }
      }

      // Check spam patterns
      const spamDetector = this.getSpamDetector(user.id);
      if (spamDetector.isSpam(message.message)) {
        const action = await this.createAction(
          'timeout',
          'Spam detected',
          'medium',
          300, // 5 minutes timeout
          user,
          roomId,
          message.id,
          message.message
        );

        return {
          allowed: false,
          action,
          reason: 'Spam detected'
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Error during message moderation:', error);
      return { allowed: false, reason: 'Moderation error' };
    }
  }

  private async checkRule(
    rule: ModerationRule,
    message: ChatMessage,
    user: ChatUser
  ): Promise<{ violated: boolean; reason: string } | null> {
    const content = message.message.toLowerCase();

    switch (rule.type) {
      case 'keyword':
        if (rule.keywords) {
          for (const keyword of rule.keywords) {
            if (content.includes(keyword.toLowerCase())) {
              return {
                violated: true,
                reason: `Contains blocked keyword: ${keyword}`
              };
            }
          }
        }
        break;

      case 'regex':
        if (rule.pattern) {
          const regex = new RegExp(rule.pattern, 'i');
          if (regex.test(message.message)) {
            return {
              violated: true,
              reason: 'Matches blocked pattern'
            };
          }
        }
        break;

      case 'link':
        const linkCount = (message.message.match(/https?:\/\/[^\s]+/g) || []).length;
        if (rule.maxLinks && linkCount > rule.maxLinks) {
          return {
            violated: true,
            reason: `Too many links: ${linkCount}`
          };
        }
        break;

      case 'length':
        if (rule.maxCapsRatio) {
          const capsCount = (message.message.match(/[A-Z]/g) || []).length;
          const totalCount = message.message.length;
          const capsRatio = totalCount > 0 ? capsCount / totalCount : 0;
          
          if (capsRatio > rule.maxCapsRatio) {
            return {
              violated: true,
              reason: `Excessive caps: ${Math.round(capsRatio * 100)}%`
            };
          }
        }
        break;

      case 'spam':
        // Handled separately in main moderation logic
        break;
    }

    return null;
  }

  private async executeAction(
    rule: ModerationRule,
    message: ChatMessage,
    user: ChatUser,
    roomId: string
  ): Promise<ModerationAction> {
    let duration: number | undefined;
    
    if (rule.action === 'timeout') {
      duration = this.getTimeoutDuration(rule.severity, user.id);
    }

    return await this.createAction(
      rule.action,
      rule.description,
      rule.severity,
      duration,
      user,
      roomId,
      message.id,
      message.message
    );
  }

  private async createAction(
    action: 'block' | 'flag' | 'timeout' | 'delete' | 'ban',
    reason: string,
    severity: 'low' | 'medium' | 'high',
    duration: number | undefined,
    user: ChatUser,
    roomId: string,
    messageId?: string,
    message?: string,
    moderatorId?: string,
    moderatorName?: string
  ): Promise<ModerationAction> {
    const moderationAction: ModerationAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      username: user.username,
      action,
      reason,
      severity,
      duration,
      messageId,
      message,
      moderatorId,
      moderatorName,
      timestamp: new Date(),
      roomId
    };

    // Store action
    if (!this.actions.has(roomId)) {
      this.actions.set(roomId, []);
    }
    this.actions.get(roomId)!.push(moderationAction);

    // Update user violations
    const currentViolations = this.userViolations.get(user.id) || 0;
    this.userViolations.set(user.id, currentViolations + 1);

    // Apply action
    switch (action) {
      case 'timeout':
        if (duration) {
          this.timedOutUsers.set(user.id, Date.now() + (duration * 1000));
        }
        break;
      
      case 'ban':
        this.bannedUsers.add(user.id);
        break;
    }

    logger.info(`Moderation action: ${action} for user ${user.username} in room ${roomId}: ${reason}`);
    
    return moderationAction;
  }

  private getTimeoutDuration(severity: string, userId: string): number {
    const violations = this.userViolations.get(userId) || 0;
    
    switch (severity) {
      case 'low':
        return 60; // 1 minute
      case 'medium':
        return violations > 3 ? 900 : 300; // 15 minutes for repeat offenders, 5 minutes otherwise
      case 'high':
        return violations > 2 ? 3600 : 600; // 1 hour for repeat offenders, 10 minutes otherwise
      default:
        return 300; // 5 minutes
    }
  }

  private getSpamDetector(userId: string): SpamDetector {
    if (!this.spamDetectors.has(userId)) {
      this.spamDetectors.set(userId, new SpamDetector());
    }
    return this.spamDetectors.get(userId)!;
  }

  public addRule(rule: ModerationRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`Added moderation rule: ${rule.name}`);
  }

  public removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      logger.info(`Removed moderation rule: ${ruleId}`);
    }
    return removed;
  }

  public updateRule(ruleId: string, updates: Partial<ModerationRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    logger.info(`Updated moderation rule: ${ruleId}`);
    return true;
  }

  public getRules(): ModerationRule[] {
    return Array.from(this.rules.values());
  }

  public getRule(ruleId: string): ModerationRule | undefined {
    return this.rules.get(ruleId);
  }

  public isUserBanned(userId: string): boolean {
    return this.bannedUsers.has(userId);
  }

  public isUserTimedOut(userId: string): boolean {
    const timeoutEnd = this.timedOutUsers.get(userId);
    if (!timeoutEnd) return false;
    
    if (Date.now() > timeoutEnd) {
      this.timedOutUsers.delete(userId);
      return false;
    }
    
    return true;
  }

  public banUser(user: ChatUser, roomId: string, moderatorId?: string, moderatorName?: string): Promise<ModerationAction> {
    return this.createAction(
      'ban',
      'User banned by moderator',
      'high',
      undefined,
      user,
      roomId,
      undefined,
      undefined,
      moderatorId,
      moderatorName
    );
  }

  public unbanUser(userId: string): boolean {
    const removed = this.bannedUsers.delete(userId);
    if (removed) {
      this.userViolations.delete(userId);
      this.spamDetectors.delete(userId);
      logger.info(`User ${userId} unbanned`);
    }
    return removed;
  }

  public timeoutUser(
    user: ChatUser,
    duration: number,
    reason: string,
    roomId: string,
    moderatorId?: string,
    moderatorName?: string
  ): Promise<ModerationAction> {
    return this.createAction(
      'timeout',
      reason,
      'medium',
      duration,
      user,
      roomId,
      undefined,
      undefined,
      moderatorId,
      moderatorName
    );
  }

  public getStats(roomId?: string): ModerationStats {
    const actions = roomId ? this.actions.get(roomId) || [] : 
      Array.from(this.actions.values()).flat();

    const totalActions = actions.length;
    const actionsByType: Record<string, number> = {};
    const actionsBySeverity: Record<string, number> = {};
    const userActionCounts: Record<string, { userId: string; username: string; count: number; lastAction: Date }> = {};

    for (const action of actions) {
      // Count by type
      actionsByType[action.action] = (actionsByType[action.action] || 0) + 1;
      
      // Count by severity
      actionsBySeverity[action.severity] = (actionsBySeverity[action.severity] || 0) + 1;
      
      // Count by user
      const key = `${action.userId}_${action.username}`;
      if (!userActionCounts[key]) {
        userActionCounts[key] = {
          userId: action.userId,
          username: action.username,
          count: 0,
          lastAction: action.timestamp
        };
      }
      userActionCounts[key].count++;
      if (action.timestamp > userActionCounts[key].lastAction) {
        userActionCounts[key].lastAction = action.timestamp;
      }
    }

    const topViolators = Object.values(userActionCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        userId: item.userId,
        username: item.username,
        actionCount: item.count,
        lastAction: item.lastAction
      }));

    const recentActions = actions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    return {
      totalActions,
      actionsByType,
      actionsBySeverity,
      topViolators,
      recentActions
    };
  }

  public async start(): Promise<void> {
    logger.info('Chat moderation started');
    this.running = true;
  }

  public async stop(): Promise<void> {
    logger.info('Chat moderation stopping...');
    this.running = false;
    
    this.rules.clear();
    this.actions.clear();
    this.userViolations.clear();
    this.bannedUsers.clear();
    this.timedOutUsers.clear();
    this.spamDetectors.clear();
  }

  public isRunning(): boolean {
    return this.running;
  }
}

class SpamDetector {
  private messageHistory: Array<{ message: string; timestamp: number }> = [];
  private readonly maxHistory = 10;
  private readonly similarityThreshold = 0.8;
  private readonly timeWindow = 60000; // 1 minute

  public isSpam(message: string): boolean {
    const now = Date.now();
    
    // Clean old history
    this.messageHistory = this.messageHistory.filter(
      item => now - item.timestamp < this.timeWindow
    );

    // Check for repeated messages
    const similarMessages = this.messageHistory.filter(
      item => this.calculateSimilarity(item.message, message) > this.similarityThreshold
    );

    // Add current message to history
    this.messageHistory.push({ message, timestamp: now });
    
    // Keep only recent history
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistory);
    }

    // Consider spam if more than 3 similar messages in time window
    return similarMessages.length >= 3;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}