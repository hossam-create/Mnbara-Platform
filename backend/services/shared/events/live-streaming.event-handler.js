"use strict";
/**
 * Live Streaming Event Handler Service
 *
 * This service handles all live streaming related events and integrates
 * with the existing audit logging system to provide comprehensive
 * tracking of live streaming activities.
 *
 * Usage:
 * ```typescript
 * import { LiveStreamingEventHandler } from './live-streaming.event-handler';
 *
 * // Initialize the handler
 * const eventHandler = new LiveStreamingEventHandler(auditService);
 *
 * // Log a stream start event
 * await eventHandler.logStreamStart({
 *   streamId: 'stream-123',
 *   sellerId: 'user-456',
 *   streamTitle: 'Live Auction Event',
 *   scheduledStartTime: new Date(),
 * });
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamingEventHandler = void 0;
const live_streaming_events_1 = require("./live-streaming.events");
class LiveStreamingEventHandler {
    constructor(auditService) {
        this.auditService = auditService;
    }
    /**
     * Log stream start event
     */
    async logStreamStart(data) {
        const metadata = {
            streamId: data.streamId,
            streamTitle: data.streamTitle,
            category: data.category,
            scheduledStartTime: data.scheduledStartTime?.toISOString(),
            streamKey: data.streamKey,
            rtmpUrl: data.rtmpUrl,
            hlsUrl: data.hlsUrl,
            webrtcUrl: data.webrtcUrl,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_STARTED',
            description: `Live stream "${data.streamTitle}" started by seller ${data.sellerId}`,
            actorId: parseInt(data.sellerId) || undefined,
            targetId: parseInt(data.streamId) || undefined,
            targetType: 'LiveStream',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_STARTED,
            success: true,
        });
    }
    /**
     * Log stream end event
     */
    async logStreamEnd(data) {
        const metadata = {
            streamId: data.streamId,
            endTime: data.endTime.toISOString(),
            duration: data.duration,
            totalViewers: data.totalViewers,
            peakViewers: data.peakViewers,
            totalSales: data.totalSales,
            reason: data.reason,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_ENDED',
            description: `Live stream ${data.streamId} ended after ${data.duration} seconds`,
            targetId: parseInt(data.streamId) || undefined,
            targetType: 'LiveStream',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_ENDED,
            success: data.reason !== 'technical_error',
        });
    }
    /**
     * Log viewer joined event
     */
    async logViewerJoined(data) {
        const metadata = {
            streamId: data.streamId,
            userId: data.userId,
            username: data.username,
            joinTime: new Date().toISOString(),
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            country: data.country,
            deviceType: data.deviceType,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_VIEWER_JOINED',
            description: `User ${data.userId} joined live stream ${data.streamId}`,
            actorId: parseInt(data.userId) || undefined,
            targetId: parseInt(data.streamId) || undefined,
            targetType: 'LiveStream',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_VIEWER_JOINED,
            success: true,
        });
    }
    /**
     * Log viewer left event
     */
    async logViewerLeft(data) {
        const metadata = {
            streamId: data.streamId,
            userId: data.userId,
            leaveTime: new Date().toISOString(),
            duration: data.duration,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_VIEWER_LEFT',
            description: `User ${data.userId} left live stream ${data.streamId} after ${data.duration} seconds`,
            actorId: parseInt(data.userId) || undefined,
            targetId: parseInt(data.streamId) || undefined,
            targetType: 'LiveStream',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_VIEWER_LEFT,
            success: true,
        });
    }
    /**
     * Log chat message sent event
     */
    async logChatMessageSent(data) {
        const metadata = {
            streamId: data.streamId,
            messageId: data.messageId,
            userId: data.userId,
            username: data.username,
            messageContent: data.messageContent,
            messageType: data.messageType || 'text',
            parentMessageId: data.parentMessageId,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_CHAT_MESSAGE_SENT',
            description: `Chat message sent in stream ${data.streamId} by user ${data.userId}`,
            actorId: parseInt(data.userId) || undefined,
            targetId: parseInt(data.streamId) || undefined,
            targetType: 'LiveStream',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_CHAT_MESSAGE_SENT,
            success: true,
        });
    }
    /**
     * Log chat message deleted event
     */
    async logChatMessageDeleted(data) {
        const metadata = {
            streamId: data.streamId,
            messageId: data.messageId,
            isDeleted: true,
            moderationReason: data.moderationReason,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_CHAT_MESSAGE_DELETED',
            description: `Chat message deleted in stream ${data.streamId} by ${data.deletedBy}`,
            actorId: parseInt(data.deletedBy) || undefined,
            targetId: parseInt(data.messageId) || undefined,
            targetType: 'ChatMessage',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_CHAT_MESSAGE_DELETED,
            success: true,
        });
    }
    /**
     * Log user banned event
     */
    async logUserBanned(data) {
        const metadata = {
            streamId: data.streamId,
            userId: data.userId,
            username: data.username,
            banReason: data.banReason,
            banDuration: data.banDuration,
            bannedBy: data.bannedBy,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_USER_BANNED',
            description: `User ${data.userId} banned from stream ${data.streamId} by ${data.bannedBy}`,
            actorId: parseInt(data.bannedBy) || undefined,
            targetId: parseInt(data.userId) || undefined,
            targetType: 'User',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_USER_BANNED,
            success: true,
        });
    }
    /**
     * Log product pinned event
     */
    async logProductPinned(data) {
        const metadata = {
            streamId: data.streamId,
            productId: data.productId,
            productName: data.productName,
            pinPosition: data.pinPosition,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_PRODUCT_PINNED',
            description: `Product ${data.productId} pinned in stream ${data.streamId} by ${data.pinnedBy}`,
            actorId: parseInt(data.pinnedBy) || undefined,
            targetId: parseInt(data.productId) || undefined,
            targetType: 'Product',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_PRODUCT_PINNED,
            success: true,
        });
    }
    /**
     * Log auction start event
     */
    async logAuctionStart(data) {
        const metadata = {
            streamId: data.streamId,
            auctionId: data.auctionId,
            productId: data.productId,
            productName: data.productName,
            startingBid: data.startingBid,
            softCloseEnabled: data.softCloseEnabled,
        };
        await this.auditService.log({
            action: 'LIVE_AUCTION_STARTED',
            description: `Live auction started for product ${data.productId} in stream ${data.streamId}`,
            targetId: parseInt(data.auctionId) || undefined,
            targetType: 'LiveAuction',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_AUCTION_STARTED,
            success: true,
        });
    }
    /**
     * Log bid placed event
     */
    async logBidPlaced(data) {
        const metadata = {
            streamId: data.streamId,
            auctionId: data.auctionId,
            productId: data.productId,
            productName: data.productName,
            bidAmount: data.bidAmount,
            currentBid: data.currentBid,
            bidderId: data.bidderId,
            bidderUsername: data.bidderUsername,
            bidCount: data.bidCount,
            timeRemaining: data.timeRemaining,
        };
        await this.auditService.log({
            action: 'LIVE_AUCTION_BID_PLACED',
            description: `Bid placed in auction ${data.auctionId}: $${data.bidAmount} by ${data.bidderId}`,
            actorId: parseInt(data.bidderId) || undefined,
            targetId: parseInt(data.auctionId) || undefined,
            targetType: 'LiveAuction',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_AUCTION_BID_PLACED,
            success: true,
        });
    }
    /**
     * Log technical error event
     */
    async logTechnicalError(data) {
        const metadata = {
            streamId: data.streamId,
            errorType: data.errorType,
            errorCode: data.errorCode,
            errorMessage: data.errorMessage,
            retryCount: data.retryCount,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_TECHNICAL_ERROR',
            description: `Technical error in stream ${data.streamId}: ${data.errorMessage}`,
            targetId: parseInt(data.streamId) || undefined,
            targetType: 'LiveStream',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_TECHNICAL_ERROR,
            success: false,
            errorMessage: data.errorMessage,
        });
    }
    /**
     * Log quality degraded event
     */
    async logQualityDegraded(data) {
        const metadata = {
            streamId: data.streamId,
            quality: data.quality,
            bitrate: data.bitrate,
            resolution: data.resolution,
            fps: data.fps,
        };
        await this.auditService.log({
            action: 'LIVE_STREAM_QUALITY_DEGRADED',
            description: `Stream quality degraded for ${data.streamId}: ${data.quality} quality`,
            targetId: parseInt(data.streamId) || undefined,
            targetType: 'LiveStream',
            metadata,
            severity: live_streaming_events_1.LiveStreamEventSeverityMap.LIVE_STREAM_QUALITY_DEGRADED,
            success: true,
        });
    }
}
exports.LiveStreamingEventHandler = LiveStreamingEventHandler;
//# sourceMappingURL=live-streaming.event-handler.js.map