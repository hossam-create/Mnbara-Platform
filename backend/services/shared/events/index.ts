/**
 * Live Streaming Events - Index
 * 
 * This module exports all live streaming event types, handlers, and utilities
 * for the eBay Live service integration.
 */

// Event Types
export * from './live-streaming.events';

// Event Handler
export * from './live-streaming.event-handler';

// Re-export for convenience
export { 
  LiveStreamEventType,
  LiveStreamEventCategory,
  LiveStreamEventCategoryMap,
  LiveStreamEventSeverityMap,
  LiveStreamMetadata,
  LiveStreamViewerMetadata,
  LiveStreamChatMetadata,
  LiveStreamAuctionMetadata,
  LiveStreamTechnicalMetadata,
} from './live-streaming.events';

export {
  LiveStreamingEventHandler,
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
  QualityDegradedData,
} from './live-streaming.event-handler';