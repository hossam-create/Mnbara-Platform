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
import { AuditService } from '../audit/audit.service';
export interface StreamStartData {
    streamId: string;
    sellerId: string;
    streamTitle: string;
    category?: string;
    scheduledStartTime?: Date;
    streamKey?: string;
    rtmpUrl?: string;
    hlsUrl?: string;
    webrtcUrl?: string;
}
export interface StreamEndData {
    streamId: string;
    endTime: Date;
    duration: number;
    totalViewers: number;
    peakViewers: number;
    totalSales?: number;
    reason?: 'completed' | 'cancelled' | 'technical_error' | 'user_terminated';
}
export interface ViewerJoinData {
    streamId: string;
    userId: string;
    username?: string;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    deviceType?: string;
}
export interface ViewerLeaveData {
    streamId: string;
    userId: string;
    joinTime: Date;
    duration: number;
}
export interface ChatMessageData {
    streamId: string;
    messageId: string;
    userId: string;
    username?: string;
    messageContent: string;
    messageType?: 'text' | 'emoji' | 'system';
    parentMessageId?: string;
}
export interface ChatMessageDeleteData {
    streamId: string;
    messageId: string;
    deletedBy: string;
    moderationReason?: string;
}
export interface UserBanData {
    streamId: string;
    userId: string;
    username?: string;
    bannedBy: string;
    banReason?: string;
    banDuration?: number;
}
export interface ProductPinData {
    streamId: string;
    productId: string;
    productName?: string;
    pinnedBy: string;
    pinPosition?: number;
}
export interface AuctionStartData {
    streamId: string;
    auctionId: string;
    productId: string;
    productName?: string;
    startingBid: number;
    endTime: Date;
    softCloseEnabled?: boolean;
    softCloseExtension?: number;
}
export interface AuctionBidData {
    streamId: string;
    auctionId: string;
    productId: string;
    productName?: string;
    bidderId: string;
    bidderUsername?: string;
    bidAmount: number;
    currentBid: number;
    bidCount: number;
    timeRemaining?: number;
}
export interface TechnicalErrorData {
    streamId: string;
    errorType: 'connection' | 'encoding' | 'network' | 'server' | 'client';
    errorCode?: string;
    errorMessage: string;
    retryCount?: number;
}
export interface QualityDegradedData {
    streamId: string;
    quality: 'low' | 'medium' | 'high' | 'hd' | '4k';
    bitrate: number;
    resolution: string;
    fps: number;
    reason?: string;
}
export declare class LiveStreamingEventHandler {
    private auditService;
    constructor(auditService: typeof AuditService);
    /**
     * Log stream start event
     */
    logStreamStart(data: StreamStartData): Promise<void>;
    /**
     * Log stream end event
     */
    logStreamEnd(data: StreamEndData): Promise<void>;
    /**
     * Log viewer joined event
     */
    logViewerJoined(data: ViewerJoinData): Promise<void>;
    /**
     * Log viewer left event
     */
    logViewerLeft(data: ViewerLeaveData): Promise<void>;
    /**
     * Log chat message sent event
     */
    logChatMessageSent(data: ChatMessageData): Promise<void>;
    /**
     * Log chat message deleted event
     */
    logChatMessageDeleted(data: ChatMessageDeleteData): Promise<void>;
    /**
     * Log user banned event
     */
    logUserBanned(data: UserBanData): Promise<void>;
    /**
     * Log product pinned event
     */
    logProductPinned(data: ProductPinData): Promise<void>;
    /**
     * Log auction start event
     */
    logAuctionStart(data: AuctionStartData): Promise<void>;
    /**
     * Log bid placed event
     */
    logBidPlaced(data: AuctionBidData): Promise<void>;
    /**
     * Log technical error event
     */
    logTechnicalError(data: TechnicalErrorData): Promise<void>;
    /**
     * Log quality degraded event
     */
    logQualityDegraded(data: QualityDegradedData): Promise<void>;
}
//# sourceMappingURL=live-streaming.event-handler.d.ts.map