/**
 * Live Streaming Plugin Bridge
 * 
 * This integration connects the eBay Live service events with the plugin system,
 * allowing plugins to respond to live streaming events through hooks.
 */

import { EventEmitter } from 'events';
import { HookSystem } from '../core/hooks/HookSystem';
import { LiveStreamingEventHandler } from '../../shared/events/live-streaming.event-handler';
import { AuditService } from '../../shared/audit/audit.service';
import { 
  StreamStartData, 
  StreamEndData, 
  ViewerJoinData, 
  ViewerLeaveData,
  ChatMessageData,
  ChatMessageDeleteData,
  UserBanData,
  ProductPinData,
  AuctionStartData,
  AuctionBidData,
  TechnicalErrorData,
  QualityDegradedData
} from '../../shared/events/live-streaming.event-handler';

export class LiveStreamingPluginBridge extends EventEmitter {
  private hookSystem: HookSystem;
  private eventHandler: LiveStreamingEventHandler;
  private auditService: AuditService;

  constructor(
    hookSystem: HookSystem,
    auditService: AuditService
  ) {
    super();
    this.hookSystem = hookSystem;
    this.auditService = auditService;
    this.eventHandler = new LiveStreamingEventHandler(auditService);
  }

  /**
   * Initialize the bridge and start listening to live streaming events
   */
  async initialize(): Promise<void> {
    // Listen to our own events and trigger plugin hooks
    this.on('stream:start', this.handleStreamStart.bind(this));
    this.on('stream:end', this.handleStreamEnd.bind(this));
    this.on('stream:viewer-joined', this.handleViewerJoined.bind(this));
    this.on('stream:viewer-left', this.handleViewerLeft.bind(this));
    this.on('stream:chat-message', this.handleChatMessage.bind(this));
    this.on('stream:chat-message-deleted', this.handleChatMessageDeleted.bind(this));
    this.on('stream:user-banned', this.handleUserBanned.bind(this));
    this.on('stream:product-pinned', this.handleProductPinned.bind(this));
    this.on('stream:auction-started', this.handleAuctionStarted.bind(this));
    this.on('stream:auction-bid', this.handleAuctionBid.bind(this));
    this.on('stream:technical-error', this.handleTechnicalError.bind(this));
    this.on('stream:quality-degraded', this.handleQualityDegraded.bind(this));

    console.log('🎬 Live Streaming Plugin Bridge initialized');
  }

  /**
   * Handle stream start event - trigger plugin hooks
   */
  private async handleStreamStart(data: StreamStartData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logStreamStart(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:start', {
        streamId: data.streamId,
        sellerId: data.sellerId,
        title: data.streamTitle,
        category: data.category,
        scheduledStartTime: data.scheduledStartTime,
        streamKey: data.streamKey,
        rtmpUrl: data.rtmpUrl,
        hlsUrl: data.hlsUrl,
        webrtcUrl: data.webrtcUrl,
        timestamp: new Date().toISOString()
      });

      console.log(`🎬 Stream start hook executed for stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle stream start event:', error);
      throw error;
    }
  }

  /**
   * Handle stream end event - trigger plugin hooks
   */
  private async handleStreamEnd(data: StreamEndData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logStreamEnd(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:end', {
        streamId: data.streamId,
        endTime: data.endTime,
        duration: data.duration,
        totalViewers: data.totalViewers,
        peakViewers: data.peakViewers,
        totalSales: data.totalSales,
        reason: data.reason,
        timestamp: new Date().toISOString()
      });

      console.log(`🎬 Stream end hook executed for stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle stream end event:', error);
      throw error;
    }
  }

  /**
   * Handle viewer joined event - trigger plugin hooks
   */
  private async handleViewerJoined(data: ViewerJoinData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logViewerJoined(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:viewer-joined', {
        streamId: data.streamId,
        userId: data.userId,
        username: data.username,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        country: data.country,
        deviceType: data.deviceType,
        joinTime: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });

      console.log(`👥 Viewer joined hook executed for user ${data.userId} in stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle viewer joined event:', error);
      throw error;
    }
  }

  /**
   * Handle viewer left event - trigger plugin hooks
   */
  private async handleViewerLeft(data: ViewerLeaveData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logViewerLeft(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:viewer-left', {
        streamId: data.streamId,
        userId: data.userId,
        joinTime: data.joinTime,
        duration: data.duration,
        leaveTime: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });

      console.log(`👥 Viewer left hook executed for user ${data.userId} in stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle viewer left event:', error);
      throw error;
    }
  }

  /**
   * Handle chat message event - trigger plugin hooks
   */
  private async handleChatMessage(data: ChatMessageData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logChatMessageSent(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:chat-message', {
        streamId: data.streamId,
        messageId: data.messageId,
        userId: data.userId,
        username: data.username,
        message: data.messageContent,
        messageType: data.messageType,
        parentMessageId: data.parentMessageId,
        timestamp: new Date().toISOString()
      });

      console.log(`💬 Chat message hook executed for message ${data.messageId} in stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle chat message event:', error);
      throw error;
    }
  }

  /**
   * Handle chat message deleted event - trigger plugin hooks
   */
  private async handleChatMessageDeleted(data: ChatMessageDeleteData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logChatMessageDeleted(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:chat-message-deleted', {
        streamId: data.streamId,
        messageId: data.messageId,
        deletedBy: data.deletedBy,
        moderationReason: data.moderationReason,
        timestamp: new Date().toISOString()
      });

      console.log(`🗑️ Chat message deleted hook executed for message ${data.messageId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle chat message deleted event:', error);
      throw error;
    }
  }

  /**
   * Handle user banned event - trigger plugin hooks
   */
  private async handleUserBanned(data: UserBanData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logUserBanned(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:user-banned', {
        streamId: data.streamId,
        userId: data.userId,
        username: data.username,
        bannedBy: data.bannedBy,
        banReason: data.banReason,
        banDuration: data.banDuration,
        timestamp: new Date().toISOString()
      });

      console.log(`🚫 User banned hook executed for user ${data.userId} in stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle user banned event:', error);
      throw error;
    }
  }

  /**
   * Handle product pinned event - trigger plugin hooks
   */
  private async handleProductPinned(data: ProductPinData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logProductPinned(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:product-pinned', {
        streamId: data.streamId,
        productId: data.productId,
        productName: data.productName,
        pinnedBy: data.pinnedBy,
        pinPosition: data.pinPosition,
        timestamp: new Date().toISOString()
      });

      console.log(`📌 Product pinned hook executed for product ${data.productId} in stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle product pinned event:', error);
      throw error;
    }
  }

  /**
   * Handle auction started event - trigger plugin hooks
   */
  private async handleAuctionStarted(data: AuctionStartData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logAuctionStarted(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:auction-started', {
        streamId: data.streamId,
        auctionId: data.auctionId,
        productId: data.productId,
        productName: data.productName,
        startingBid: data.startingBid,
        endTime: data.endTime,
        softCloseEnabled: data.softCloseEnabled,
        softCloseExtension: data.softCloseExtension,
        timestamp: new Date().toISOString()
      });

      console.log(`🏆 Auction started hook executed for auction ${data.auctionId} in stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle auction started event:', error);
      throw error;
    }
  }

  /**
   * Handle auction bid event - trigger plugin hooks
   */
  private async handleAuctionBid(data: AuctionBidData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logAuctionBidPlaced(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:auction-bid', {
        streamId: data.streamId,
        auctionId: data.auctionId,
        productId: data.productId,
        productName: data.productName,
        bidderId: data.bidderId,
        bidderUsername: data.bidderUsername,
        bidAmount: data.bidAmount,
        currentBid: data.currentBid,
        bidCount: data.bidCount,
        timeRemaining: data.timeRemaining,
        timestamp: new Date().toISOString()
      });

      console.log(`💰 Auction bid hook executed for bid ${data.bidAmount} in auction ${data.auctionId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle auction bid event:', error);
      throw error;
    }
  }

  /**
   * Handle technical error event - trigger plugin hooks
   */
  private async handleTechnicalError(data: TechnicalErrorData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logTechnicalError(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:technical-error', {
        streamId: data.streamId,
        errorType: data.errorType,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        retryCount: data.retryCount,
        timestamp: new Date().toISOString()
      });

      console.log(`⚠️ Technical error hook executed for stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle technical error event:', error);
      throw error;
    }
  }

  /**
   * Handle quality degraded event - trigger plugin hooks
   */
  private async handleQualityDegraded(data: QualityDegradedData): Promise<void> {
    try {
      // Log the event through the audit system
      await this.eventHandler.logQualityDegraded(data);

      // Trigger plugin hooks
      const hookResult = await this.hookSystem.executeHook('stream:quality-degraded', {
        streamId: data.streamId,
        quality: data.quality,
        bitrate: data.bitrate,
        resolution: data.resolution,
        fps: data.fps,
        reason: data.reason,
        timestamp: new Date().toISOString()
      });

      console.log(`📉 Quality degraded hook executed for stream ${data.streamId}:`, hookResult);
    } catch (error) {
      console.error('❌ Failed to handle quality degraded event:', error);
      throw error;
    }
  }

  /**
   * Bridge method to connect external live streaming events to plugin system
   */
  bridgeEvent(eventType: string, data: any): void {
    this.emit(eventType, data);
  }
}