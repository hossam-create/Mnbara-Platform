/**
 * Live Streaming Event Types
 *
 * This file defines all event types related to live streaming functionality
 * for the eBay Live service integration.
 *
 * These events extend the existing AuditAction enum and provide comprehensive
 * tracking of all live streaming activities for audit, analytics, and monitoring.
 */
export declare enum LiveStreamEventType {
    LIVE_STREAM_STARTED = "LIVE_STREAM_STARTED",
    LIVE_STREAM_ENDED = "LIVE_STREAM_ENDED",
    LIVE_STREAM_CANCELLED = "LIVE_STREAM_CANCELLED",
    LIVE_STREAM_VIEWER_JOINED = "LIVE_STREAM_VIEWER_JOINED",
    LIVE_STREAM_VIEWER_LEFT = "LIVE_STREAM_VIEWER_LEFT",
    LIVE_STREAM_CHAT_MESSAGE_SENT = "LIVE_STREAM_CHAT_MESSAGE_SENT",
    LIVE_STREAM_CHAT_MESSAGE_DELETED = "LIVE_STREAM_CHAT_MESSAGE_DELETED",
    LIVE_STREAM_USER_BANNED = "LIVE_STREAM_USER_BANNED",
    LIVE_STREAM_USER_UNBANNED = "LIVE_STREAM_USER_UNBANNED",
    LIVE_STREAM_MODERATION_ACTION_TAKEN = "LIVE_STREAM_MODERATION_ACTION_TAKEN",
    LIVE_STREAM_PRODUCT_PINNED = "LIVE_STREAM_PRODUCT_PINNED",
    LIVE_STREAM_PRODUCT_UNPINNED = "LIVE_STREAM_PRODUCT_UNPINNED",
    LIVE_AUCTION_STARTED = "LIVE_AUCTION_STARTED",
    LIVE_AUCTION_ENDED = "LIVE_AUCTION_ENDED",
    LIVE_AUCTION_BID_PLACED = "LIVE_AUCTION_BID_PLACED",
    LIVE_AUCTION_BID_CANCELLED = "LIVE_AUCTION_BID_CANCELLED",
    LIVE_AUCTION_WINNER_DETERMINED = "LIVE_AUCTION_WINNER_DETERMINED",
    LIVE_AUCTION_PAYMENT_CAPTURED = "LIVE_AUCTION_PAYMENT_CAPTURED",
    LIVE_STREAM_TECHNICAL_ERROR = "LIVE_STREAM_TECHNICAL_ERROR",
    LIVE_STREAM_QUALITY_DEGRADED = "LIVE_STREAM_QUALITY_DEGRADED",
    LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED = "LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED",
    LIVE_STREAM_RTMP_CONNECTION_LOST = "LIVE_STREAM_RTMP_CONNECTION_LOST",
    LIVE_STREAM_HLS_SEGMENT_CREATED = "LIVE_STREAM_HLS_SEGMENT_CREATED",
    LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED = "LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED",
    LIVE_STREAM_WEBRTC_CONNECTION_LOST = "LIVE_STREAM_WEBRTC_CONNECTION_LOST",
    LIVE_STREAM_RECORDING_STARTED = "LIVE_STREAM_RECORDING_STARTED",
    LIVE_STREAM_RECORDING_ENDED = "LIVE_STREAM_RECORDING_ENDED",
    LIVE_STREAM_RECORDING_UPLOADED = "LIVE_STREAM_RECORDING_UPLOADED",
    LIVE_STREAM_THUMBNAIL_UPDATED = "LIVE_STREAM_THUMBNAIL_UPDATED",
    LIVE_STREAM_METADATA_UPDATED = "LIVE_STREAM_METADATA_UPDATED",
    LIVE_STREAM_ANALYTICS_DATA_COLLECTED = "LIVE_STREAM_ANALYTICS_DATA_COLLECTED"
}
/**
 * Live Stream Event Categories
 *
 * Groups related events for easier filtering and analysis
 */
export declare enum LiveStreamEventCategory {
    LIFECYCLE = "lifecycle",
    VIEWER = "viewer",
    CHAT = "chat",
    MODERATION = "moderation",
    PRODUCT = "product",
    AUCTION = "auction",
    TECHNICAL = "technical",
    RECORDING = "recording",
    MEDIA = "media",
    ANALYTICS = "analytics"
}
/**
 * Live Stream Event Metadata Interfaces
 *
 * Defines the structure of metadata for different event types
 */
export interface LiveStreamMetadata {
    streamId: string;
    streamTitle?: string;
    streamKey?: string;
    category?: string;
    scheduledStartTime?: string;
    actualStartTime?: string;
    endTime?: string;
    duration?: number;
    totalViewers?: number;
    peakViewers?: number;
    thumbnailUrl?: string;
    rtmpUrl?: string;
    hlsUrl?: string;
    webrtcUrl?: string;
}
export interface LiveStreamViewerMetadata {
    streamId: string;
    userId: string;
    username?: string;
    joinTime?: string;
    leaveTime?: string;
    duration?: number;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    deviceType?: string;
}
export interface LiveStreamChatMetadata {
    streamId: string;
    messageId: string;
    userId: string;
    username?: string;
    messageContent?: string;
    messageType?: 'text' | 'emoji' | 'system';
    parentMessageId?: string;
    isDeleted?: boolean;
    moderationReason?: string;
}
export interface LiveStreamAuctionMetadata {
    streamId: string;
    auctionId: string;
    productId: string;
    productName?: string;
    startingBid?: number;
    currentBid?: number;
    bidAmount?: number;
    bidderId?: string;
    bidderUsername?: string;
    bidCount?: number;
    timeRemaining?: number;
    softCloseEnabled?: boolean;
    winnerId?: string;
    finalPrice?: number;
}
export interface LiveStreamTechnicalMetadata {
    streamId: string;
    errorType?: 'connection' | 'encoding' | 'network' | 'server' | 'client';
    errorCode?: string;
    errorMessage?: string;
    quality?: 'low' | 'medium' | 'high' | 'hd' | '4k';
    bitrate?: number;
    resolution?: string;
    fps?: number;
    connectionType?: 'rtmp' | 'hls' | 'webrtc';
    retryCount?: number;
}
/**
 * Event Type to Category Mapping
 */
export declare const LiveStreamEventCategoryMap: Record<LiveStreamEventType, LiveStreamEventCategory>;
/**
 * Event Severity Mapping
 *
 * Maps event types to their default severity levels for audit logging
 */
export declare const LiveStreamEventSeverityMap: Record<LiveStreamEventType, 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'>;
//# sourceMappingURL=live-streaming.events.d.ts.map