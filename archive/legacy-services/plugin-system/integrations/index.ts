/**
 * Plugin System Live Streaming Integrations
 * 
 * This module exports all live streaming related integrations
 * for the plugin system.
 */

export * from './live-streaming-plugin-bridge';
export * from './ebay-live-plugin-integration';

// Re-export for convenience
export {
  LiveStreamingPluginBridge,
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
} from './live-streaming-plugin-bridge';

export { EbayLivePluginIntegration } from './ebay-live-plugin-integration';