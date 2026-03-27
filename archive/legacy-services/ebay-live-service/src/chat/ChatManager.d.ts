import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
interface ChatMessage {
    streamId: string;
    userId: string;
    userName?: string;
    content: string;
    messageType?: 'text' | 'emoji' | 'system' | 'auction';
    metadata?: any;
}
interface ChatFilters {
    streamId: string;
    limit?: number;
    offset?: number;
    messageType?: string;
    userId?: string;
}
export declare class ChatManager extends EventEmitter {
    private prisma;
    private redis;
    private logger;
    private chatRooms;
    private messageQueue;
    private moderationQueue;
    constructor(prisma: PrismaClient, redis: Redis, logger: Logger);
    /**
     * Send a chat message
     */
    sendMessage(data: ChatMessage): Promise<any>;
    /**
     * Get chat messages
     */
    getMessages(filters: ChatFilters): Promise<any[]>;
    /**
     * Delete a message
     */
    deleteMessage(messageId: string, userId: string, isModerator?: boolean): Promise<void>;
    /**
     * Pin a message
     */
    pinMessage(messageId: string, userId: string): Promise<void>;
    /**
     * Mute a user
     */
    muteUser(streamId: string, userId: string, duration?: number): Promise<void>;
    /**
     * Unmute a user
     */
    unmuteUser(streamId: string, userId: string): Promise<void>;
    /**
     * Check if user is muted
     */
    private isUserMuted;
    /**
     * Get or create chat room
     */
    private getOrCreateRoom;
    /**
     * Moderate message
     */
    private moderateMessage;
    /**
     * Get banned words for stream
     */
    private getBannedWords;
    /**
     * Check moderation permission
     */
    private hasModerationPermission;
    /**
     * Update room statistics
     */
    private updateRoomStats;
    /**
     * Get chat room statistics
     */
    getRoomStats(streamId: string): Promise<any>;
    /**
     * Join chat room
     */
    joinRoom(streamId: string, userId: string): Promise<void>;
    /**
     * Leave chat room
     */
    leaveRoom(streamId: string, userId: string): Promise<void>;
    /**
     * Setup message processing
     */
    private setupMessageProcessing;
    /**
     * Process message queue
     */
    private processMessageQueue;
    /**
     * Enable/disable moderation for room
     */
    setRoomModeration(streamId: string, enabled: boolean): Promise<void>;
}
export {};
//# sourceMappingURL=ChatManager.d.ts.map