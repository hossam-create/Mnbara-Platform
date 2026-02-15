"use strict";
// Chat Manager
// Handles real-time chat functionality for live streams
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatManager = void 0;
const events_1 = require("events");
class ChatManager extends events_1.EventEmitter {
    constructor(prisma, redis, logger) {
        super();
        this.prisma = prisma;
        this.redis = redis;
        this.logger = logger;
        this.chatRooms = new Map();
        this.messageQueue = new Map();
        this.moderationQueue = new Map();
        this.setupMessageProcessing();
    }
    /**
     * Send a chat message
     */
    async sendMessage(data) {
        try {
            // Validate message
            if (!data.content || data.content.trim().length === 0) {
                throw new Error('Message content is required');
            }
            if (data.content.length > 500) {
                throw new Error('Message too long (max 500 characters)');
            }
            // Check if user is muted
            const isMuted = await this.isUserMuted(data.streamId, data.userId);
            if (isMuted) {
                throw new Error('You are currently muted in this stream');
            }
            // Create message in database
            const message = await this.prisma.streamMessage.create({
                data: {
                    streamId: data.streamId,
                    userId: data.userId,
                    content: data.content.trim(),
                    messageType: data.messageType || 'text',
                    metadata: data.metadata || {}
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true
                        }
                    }
                }
            });
            // Add to room cache
            const room = this.getOrCreateRoom(data.streamId);
            room.messages.push(message);
            room.lastActivity = new Date();
            // Apply moderation if enabled
            if (room.isModerated) {
                await this.moderateMessage(message);
            }
            else {
                // Emit message immediately
                this.emit('new-message', message);
            }
            // Update room stats
            await this.updateRoomStats(data.streamId);
            this.logger.info(`Message sent in stream ${data.streamId} by user ${data.userId}`);
            return message;
        }
        catch (error) {
            this.logger.error('Failed to send message', error);
            throw error;
        }
    }
    /**
     * Get chat messages
     */
    async getMessages(filters) {
        try {
            const where = { streamId: filters.streamId };
            if (filters.messageType) {
                where.messageType = filters.messageType;
            }
            if (filters.userId) {
                where.userId = filters.userId;
            }
            const messages = await this.prisma.streamMessage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters.limit || 50,
                skip: filters.offset || 0,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true
                        }
                    }
                }
            });
            return messages.reverse(); // Return in chronological order
        }
        catch (error) {
            this.logger.error('Failed to get messages', error);
            throw new Error('Failed to get messages');
        }
    }
    /**
     * Delete a message
     */
    async deleteMessage(messageId, userId, isModerator = false) {
        try {
            const message = await this.prisma.streamMessage.findUnique({
                where: { id: messageId }
            });
            if (!message) {
                throw new Error('Message not found');
            }
            // Check permissions
            if (message.userId !== userId && !isModerator) {
                throw new Error('You can only delete your own messages');
            }
            await this.prisma.streamMessage.update({
                where: { id: messageId },
                data: {
                    isDeleted: true,
                    content: '[Message deleted]'
                }
            });
            this.emit('message-deleted', { messageId, streamId: message.streamId });
            this.logger.info(`Message ${messageId} deleted by user ${userId}`);
        }
        catch (error) {
            this.logger.error('Failed to delete message', error);
            throw error;
        }
    }
    /**
     * Pin a message
     */
    async pinMessage(messageId, userId) {
        try {
            const message = await this.prisma.streamMessage.findUnique({
                where: { id: messageId }
            });
            if (!message) {
                throw new Error('Message not found');
            }
            // Check if user is the stream owner or moderator
            const hasPermission = await this.hasModerationPermission(message.streamId, userId);
            if (!hasPermission) {
                throw new Error('You do not have permission to pin messages');
            }
            // Unpin previous pinned messages in the stream
            await this.prisma.streamMessage.updateMany({
                where: {
                    streamId: message.streamId,
                    isPinned: true
                },
                data: { isPinned: false }
            });
            // Pin the new message
            await this.prisma.streamMessage.update({
                where: { id: messageId },
                data: { isPinned: true }
            });
            this.emit('message-pinned', { messageId, streamId: message.streamId });
            this.logger.info(`Message ${messageId} pinned in stream ${message.streamId}`);
        }
        catch (error) {
            this.logger.error('Failed to pin message', error);
            throw error;
        }
    }
    /**
     * Mute a user
     */
    async muteUser(streamId, userId, duration = 300) {
        try {
            const muteKey = `mute:${streamId}:${userId}`;
            await this.redis.setex(muteKey, duration, '1');
            this.emit('user-muted', { streamId, userId, duration });
            this.logger.info(`User ${userId} muted in stream ${streamId} for ${duration} seconds`);
        }
        catch (error) {
            this.logger.error('Failed to mute user', error);
            throw error;
        }
    }
    /**
     * Unmute a user
     */
    async unmuteUser(streamId, userId) {
        try {
            const muteKey = `mute:${streamId}:${userId}`;
            await this.redis.del(muteKey);
            this.emit('user-unmuted', { streamId, userId });
            this.logger.info(`User ${userId} unmuted in stream ${streamId}`);
        }
        catch (error) {
            this.logger.error('Failed to unmute user', error);
            throw error;
        }
    }
    /**
     * Check if user is muted
     */
    async isUserMuted(streamId, userId) {
        try {
            const muteKey = `mute:${streamId}:${userId}`;
            const result = await this.redis.get(muteKey);
            return result === '1';
        }
        catch (error) {
            this.logger.error('Failed to check mute status', error);
            return false;
        }
    }
    /**
     * Get or create chat room
     */
    getOrCreateRoom(streamId) {
        if (!this.chatRooms.has(streamId)) {
            this.chatRooms.set(streamId, {
                streamId,
                participants: new Set(),
                messages: [],
                lastActivity: new Date(),
                isModerated: false
            });
        }
        return this.chatRooms.get(streamId);
    }
    /**
     * Moderate message
     */
    async moderateMessage(message) {
        try {
            // Simple moderation - check for banned words
            const bannedWords = await this.getBannedWords(message.streamId);
            const containsBanned = bannedWords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
            if (containsBanned) {
                // Flag message for review
                await this.prisma.streamMessage.update({
                    where: { id: message.id },
                    data: {
                        isFlagged: true,
                        moderationStatus: 'PENDING'
                    }
                });
                this.emit('message-flagged', message);
            }
            else {
                this.emit('new-message', message);
            }
        }
        catch (error) {
            this.logger.error('Failed to moderate message', error);
            // Emit message anyway to avoid blocking
            this.emit('new-message', message);
        }
    }
    /**
     * Get banned words for stream
     */
    async getBannedWords(streamId) {
        try {
            // Get stream-specific banned words
            const streamWords = await this.redis.smembers(`banned:${streamId}`);
            // Get global banned words
            const globalWords = await this.redis.smembers('banned:global');
            return [...streamWords, ...globalWords];
        }
        catch (error) {
            this.logger.error('Failed to get banned words', error);
            return [];
        }
    }
    /**
     * Check moderation permission
     */
    async hasModerationPermission(streamId, userId) {
        try {
            // Check if user is stream owner
            const stream = await this.prisma.liveStream.findUnique({
                where: { id: streamId },
                select: { sellerId: true }
            });
            if (stream && stream.sellerId === userId) {
                return true;
            }
            // Check if user is moderator
            const isModerator = await this.redis.sismember(`moderators:${streamId}`, userId);
            return isModerator === 1;
        }
        catch (error) {
            this.logger.error('Failed to check moderation permission', error);
            return false;
        }
    }
    /**
     * Update room statistics
     */
    async updateRoomStats(streamId) {
        try {
            const room = this.getOrCreateRoom(streamId);
            // Update Redis stats
            const statsKey = `chat:stats:${streamId}`;
            await this.redis.hset(statsKey, {
                participants: room.participants.size,
                messageCount: room.messages.length,
                lastActivity: room.lastActivity.toISOString()
            });
            await this.redis.expire(statsKey, 3600); // 1 hour TTL
        }
        catch (error) {
            this.logger.error('Failed to update room stats', error);
        }
    }
    /**
     * Get chat room statistics
     */
    async getRoomStats(streamId) {
        try {
            const statsKey = `chat:stats:${streamId}`;
            const stats = await this.redis.hgetall(statsKey);
            const room = this.getOrCreateRoom(streamId);
            return {
                participants: stats.participants ? parseInt(stats.participants) : room.participants.size,
                messageCount: stats.messageCount ? parseInt(stats.messageCount) : room.messages.length,
                lastActivity: stats.lastActivity ? new Date(stats.lastActivity) : room.lastActivity,
                isModerated: room.isModerated
            };
        }
        catch (error) {
            this.logger.error('Failed to get room stats', error);
            const room = this.getOrCreateRoom(streamId);
            return {
                participants: room.participants.size,
                messageCount: room.messages.length,
                lastActivity: room.lastActivity,
                isModerated: room.isModerated
            };
        }
    }
    /**
     * Join chat room
     */
    async joinRoom(streamId, userId) {
        try {
            const room = this.getOrCreateRoom(streamId);
            room.participants.add(userId);
            room.lastActivity = new Date();
            await this.updateRoomStats(streamId);
            this.logger.info(`User ${userId} joined chat room ${streamId}`);
        }
        catch (error) {
            this.logger.error('Failed to join room', error);
        }
    }
    /**
     * Leave chat room
     */
    async leaveRoom(streamId, userId) {
        try {
            const room = this.getOrCreateRoom(streamId);
            room.participants.delete(userId);
            room.lastActivity = new Date();
            await this.updateRoomStats(streamId);
            this.logger.info(`User ${userId} left chat room ${streamId}`);
        }
        catch (error) {
            this.logger.error('Failed to leave room', error);
        }
    }
    /**
     * Setup message processing
     */
    setupMessageProcessing() {
        // Process message queue every 100ms
        setInterval(() => {
            this.processMessageQueue();
        }, 100);
    }
    /**
     * Process message queue
     */
    processMessageQueue() {
        // Process flagged messages
        this.messageQueue.forEach((messages, streamId) => {
            if (messages.length > 0) {
                const message = messages.shift();
                this.emit('new-message', message);
            }
        });
    }
    /**
     * Enable/disable moderation for room
     */
    async setRoomModeration(streamId, enabled) {
        try {
            const room = this.getOrCreateRoom(streamId);
            room.isModerated = enabled;
            this.logger.info(`Moderation ${enabled ? 'enabled' : 'disabled'} for room ${streamId}`);
        }
        catch (error) {
            this.logger.error('Failed to set room moderation', error);
            throw error;
        }
    }
}
exports.ChatManager = ChatManager;
//# sourceMappingURL=ChatManager.js.map