/**
 * eBay Live Service Plugin Integration
 * 
 * This module integrates the eBay Live service with the plugin system,
 * allowing plugins to respond to live streaming events.
 */

import { LiveStreamingPluginBridge } from './live-streaming-plugin-bridge';
import { HookSystem } from '../core/hooks/HookSystem';
import { AuditService } from '../../shared/audit/audit.service';
import { LiveStreamManager } from '../../ebay-live-service/src/streaming/LiveStreamManager';
import { ChatManager } from '../../ebay-live-service/src/chat/ChatManager';
import { LiveAuctionManager } from '../../ebay-live-service/src/auction/LiveAuctionManager';
import { Logger } from '../../ebay-live-service/src/utils/logger';

export class EbayLivePluginIntegration {
  private bridge: LiveStreamingPluginBridge;
  private hookSystem: HookSystem;
  private auditService: AuditService;
  private logger: Logger;

  constructor(
    hookSystem: HookSystem,
    auditService: AuditService
  ) {
    this.hookSystem = hookSystem;
    this.auditService = auditService;
    this.logger = new Logger('EbayLivePluginIntegration');
    this.bridge = new LiveStreamingPluginBridge(hookSystem, auditService);
  }

  /**
   * Initialize the integration
   */
  async initialize(): Promise<void> {
    await this.bridge.initialize();
    this.logger.info('🎬 eBay Live Plugin Integration initialized');
  }

  /**
   * Connect to LiveStreamManager events
   */
  connectToLiveStreamManager(streamManager: LiveStreamManager): void {
    // Listen to stream lifecycle events
    streamManager.on('streamStarted', (streamId: string) => {
      this.logger.info(`Stream started: ${streamId}`);
      this.bridge.bridgeEvent('stream:start', {
        streamId,
        timestamp: new Date().toISOString()
      });
    });

    streamManager.on('streamEnded', (streamId: string) => {
      this.logger.info(`Stream ended: ${streamId}`);
      this.bridge.bridgeEvent('stream:end', {
        streamId,
        timestamp: new Date().toISOString()
      });
    });

    streamManager.on('viewerCountChange', (streamId: string, viewerCount: number) => {
      this.logger.info(`Viewer count changed: ${streamId} - ${viewerCount}`);
      // This could trigger viewer-related hooks
    });
  }

  /**
   * Connect to ChatManager events
   */
  connectToChatManager(chatManager: ChatManager): void {
    // Listen to chat events
    chatManager.on('messageSent', (message: any) => {
      this.logger.info(`Chat message sent: ${message.id} in stream ${message.streamId}`);
      this.bridge.bridgeEvent('stream:chat-message', {
        streamId: message.streamId,
        messageId: message.id,
        userId: message.userId,
        username: message.username,
        messageContent: message.content,
        messageType: message.type,
        parentMessageId: message.parentId,
        timestamp: new Date().toISOString()
      });
    });

    chatManager.on('messageDeleted', (message: any) => {
      this.logger.info(`Chat message deleted: ${message.id} in stream ${message.streamId}`);
      this.bridge.bridgeEvent('stream:chat-message-deleted', {
        streamId: message.streamId,
        messageId: message.id,
        deletedBy: message.deletedBy,
        moderationReason: message.reason,
        timestamp: new Date().toISOString()
      });
    });

    chatManager.on('userBanned', (banData: any) => {
      this.logger.info(`User banned: ${banData.userId} from stream ${banData.streamId}`);
      this.bridge.bridgeEvent('stream:user-banned', {
        streamId: banData.streamId,
        userId: banData.userId,
        username: banData.username,
        bannedBy: banData.bannedBy,
        banReason: banData.reason,
        banDuration: banData.duration,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Connect to LiveAuctionManager events
   */
  connectToLiveAuctionManager(auctionManager: LiveAuctionManager): void {
    // Listen to auction events
    auctionManager.on('auctionStarted', (auction: any) => {
      this.logger.info(`Auction started: ${auction.id} in stream ${auction.streamId}`);
      this.bridge.bridgeEvent('stream:auction-started', {
        streamId: auction.streamId,
        auctionId: auction.id,
        productId: auction.productId,
        productName: auction.productName,
        startingBid: auction.startingBid,
        endTime: auction.endTime,
        softCloseEnabled: auction.softCloseEnabled,
        softCloseExtension: auction.softCloseExtension,
        timestamp: new Date().toISOString()
      });
    });

    auctionManager.on('bidPlaced', (bid: any) => {
      this.logger.info(`Bid placed: ${bid.amount} in auction ${bid.auctionId}`);
      this.bridge.bridgeEvent('stream:auction-bid', {
        streamId: bid.streamId,
        auctionId: bid.auctionId,
        productId: bid.productId,
        productName: bid.productName,
        bidderId: bid.bidderId,
        bidderUsername: bid.bidderUsername,
        bidAmount: bid.amount,
        currentBid: bid.currentBid,
        bidCount: bid.count,
        timeRemaining: bid.timeRemaining,
        timestamp: new Date().toISOString()
      });
    });

    auctionManager.on('productPinned', (pinData: any) => {
      this.logger.info(`Product pinned: ${pinData.productId} in stream ${pinData.streamId}`);
      this.bridge.bridgeEvent('stream:product-pinned', {
        streamId: pinData.streamId,
        productId: pinData.productId,
        productName: pinData.productName,
        pinnedBy: pinData.pinnedBy,
        pinPosition: pinData.position,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle technical errors from streaming services
   */
  handleTechnicalError(streamId: string, error: any): void {
    this.logger.error(`Technical error in stream ${streamId}:`, error);
    this.bridge.bridgeEvent('stream:technical-error', {
      streamId,
      errorType: error.type || 'unknown',
      errorCode: error.code,
      errorMessage: error.message,
      retryCount: error.retryCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle quality degradation events
   */
  handleQualityDegraded(streamId: string, qualityData: any): void {
    this.logger.warn(`Quality degraded in stream ${streamId}:`, qualityData);
    this.bridge.bridgeEvent('stream:quality-degraded', {
      streamId,
      quality: qualityData.quality,
      bitrate: qualityData.bitrate,
      resolution: qualityData.resolution,
      fps: qualityData.fps,
      reason: qualityData.reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get integration status
   */
  getStatus(): { 
    connected: boolean; 
    bridgeReady: boolean; 
    hookSystemReady: boolean;
    auditServiceReady: boolean;
  } {
    return {
      connected: true,
      bridgeReady: this.bridge !== null,
      hookSystemReady: this.hookSystem !== null,
      auditServiceReady: this.auditService !== null
    };
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting eBay Live Plugin Integration');
    // Remove all listeners
    this.bridge.removeAllListeners();
  }
}