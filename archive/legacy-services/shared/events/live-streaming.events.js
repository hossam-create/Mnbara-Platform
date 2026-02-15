"use strict";
/**
 * Live Streaming Event Types
 *
 * This file defines all event types related to live streaming functionality
 * for the eBay Live service integration.
 *
 * These events extend the existing AuditAction enum and provide comprehensive
 * tracking of all live streaming activities for audit, analytics, and monitoring.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamEventSeverityMap = exports.LiveStreamEventCategoryMap = exports.LiveStreamEventCategory = exports.LiveStreamEventType = void 0;
var LiveStreamEventType;
(function (LiveStreamEventType) {
    // Stream Lifecycle Events
    LiveStreamEventType["LIVE_STREAM_STARTED"] = "LIVE_STREAM_STARTED";
    LiveStreamEventType["LIVE_STREAM_ENDED"] = "LIVE_STREAM_ENDED";
    LiveStreamEventType["LIVE_STREAM_CANCELLED"] = "LIVE_STREAM_CANCELLED";
    // Viewer Events
    LiveStreamEventType["LIVE_STREAM_VIEWER_JOINED"] = "LIVE_STREAM_VIEWER_JOINED";
    LiveStreamEventType["LIVE_STREAM_VIEWER_LEFT"] = "LIVE_STREAM_VIEWER_LEFT";
    // Chat Events
    LiveStreamEventType["LIVE_STREAM_CHAT_MESSAGE_SENT"] = "LIVE_STREAM_CHAT_MESSAGE_SENT";
    LiveStreamEventType["LIVE_STREAM_CHAT_MESSAGE_DELETED"] = "LIVE_STREAM_CHAT_MESSAGE_DELETED";
    // Moderation Events
    LiveStreamEventType["LIVE_STREAM_USER_BANNED"] = "LIVE_STREAM_USER_BANNED";
    LiveStreamEventType["LIVE_STREAM_USER_UNBANNED"] = "LIVE_STREAM_USER_UNBANNED";
    LiveStreamEventType["LIVE_STREAM_MODERATION_ACTION_TAKEN"] = "LIVE_STREAM_MODERATION_ACTION_TAKEN";
    // Product Events
    LiveStreamEventType["LIVE_STREAM_PRODUCT_PINNED"] = "LIVE_STREAM_PRODUCT_PINNED";
    LiveStreamEventType["LIVE_STREAM_PRODUCT_UNPINNED"] = "LIVE_STREAM_PRODUCT_UNPINNED";
    // Auction Events
    LiveStreamEventType["LIVE_AUCTION_STARTED"] = "LIVE_AUCTION_STARTED";
    LiveStreamEventType["LIVE_AUCTION_ENDED"] = "LIVE_AUCTION_ENDED";
    LiveStreamEventType["LIVE_AUCTION_BID_PLACED"] = "LIVE_AUCTION_BID_PLACED";
    LiveStreamEventType["LIVE_AUCTION_BID_CANCELLED"] = "LIVE_AUCTION_BID_CANCELLED";
    LiveStreamEventType["LIVE_AUCTION_WINNER_DETERMINED"] = "LIVE_AUCTION_WINNER_DETERMINED";
    LiveStreamEventType["LIVE_AUCTION_PAYMENT_CAPTURED"] = "LIVE_AUCTION_PAYMENT_CAPTURED";
    // Technical Events
    LiveStreamEventType["LIVE_STREAM_TECHNICAL_ERROR"] = "LIVE_STREAM_TECHNICAL_ERROR";
    LiveStreamEventType["LIVE_STREAM_QUALITY_DEGRADED"] = "LIVE_STREAM_QUALITY_DEGRADED";
    LiveStreamEventType["LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED"] = "LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED";
    LiveStreamEventType["LIVE_STREAM_RTMP_CONNECTION_LOST"] = "LIVE_STREAM_RTMP_CONNECTION_LOST";
    LiveStreamEventType["LIVE_STREAM_HLS_SEGMENT_CREATED"] = "LIVE_STREAM_HLS_SEGMENT_CREATED";
    LiveStreamEventType["LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED"] = "LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED";
    LiveStreamEventType["LIVE_STREAM_WEBRTC_CONNECTION_LOST"] = "LIVE_STREAM_WEBRTC_CONNECTION_LOST";
    // Recording Events
    LiveStreamEventType["LIVE_STREAM_RECORDING_STARTED"] = "LIVE_STREAM_RECORDING_STARTED";
    LiveStreamEventType["LIVE_STREAM_RECORDING_ENDED"] = "LIVE_STREAM_RECORDING_ENDED";
    LiveStreamEventType["LIVE_STREAM_RECORDING_UPLOADED"] = "LIVE_STREAM_RECORDING_UPLOADED";
    // Media Events
    LiveStreamEventType["LIVE_STREAM_THUMBNAIL_UPDATED"] = "LIVE_STREAM_THUMBNAIL_UPDATED";
    LiveStreamEventType["LIVE_STREAM_METADATA_UPDATED"] = "LIVE_STREAM_METADATA_UPDATED";
    // Analytics Events
    LiveStreamEventType["LIVE_STREAM_ANALYTICS_DATA_COLLECTED"] = "LIVE_STREAM_ANALYTICS_DATA_COLLECTED";
})(LiveStreamEventType || (exports.LiveStreamEventType = LiveStreamEventType = {}));
/**
 * Live Stream Event Categories
 *
 * Groups related events for easier filtering and analysis
 */
var LiveStreamEventCategory;
(function (LiveStreamEventCategory) {
    LiveStreamEventCategory["LIFECYCLE"] = "lifecycle";
    LiveStreamEventCategory["VIEWER"] = "viewer";
    LiveStreamEventCategory["CHAT"] = "chat";
    LiveStreamEventCategory["MODERATION"] = "moderation";
    LiveStreamEventCategory["PRODUCT"] = "product";
    LiveStreamEventCategory["AUCTION"] = "auction";
    LiveStreamEventCategory["TECHNICAL"] = "technical";
    LiveStreamEventCategory["RECORDING"] = "recording";
    LiveStreamEventCategory["MEDIA"] = "media";
    LiveStreamEventCategory["ANALYTICS"] = "analytics";
})(LiveStreamEventCategory || (exports.LiveStreamEventCategory = LiveStreamEventCategory = {}));
/**
 * Event Type to Category Mapping
 */
exports.LiveStreamEventCategoryMap = {
    [LiveStreamEventType.LIVE_STREAM_STARTED]: LiveStreamEventCategory.LIFECYCLE,
    [LiveStreamEventType.LIVE_STREAM_ENDED]: LiveStreamEventCategory.LIFECYCLE,
    [LiveStreamEventType.LIVE_STREAM_CANCELLED]: LiveStreamEventCategory.LIFECYCLE,
    [LiveStreamEventType.LIVE_STREAM_VIEWER_JOINED]: LiveStreamEventCategory.VIEWER,
    [LiveStreamEventType.LIVE_STREAM_VIEWER_LEFT]: LiveStreamEventCategory.VIEWER,
    [LiveStreamEventType.LIVE_STREAM_CHAT_MESSAGE_SENT]: LiveStreamEventCategory.CHAT,
    [LiveStreamEventType.LIVE_STREAM_CHAT_MESSAGE_DELETED]: LiveStreamEventCategory.CHAT,
    [LiveStreamEventType.LIVE_STREAM_USER_BANNED]: LiveStreamEventCategory.MODERATION,
    [LiveStreamEventType.LIVE_STREAM_USER_UNBANNED]: LiveStreamEventCategory.MODERATION,
    [LiveStreamEventType.LIVE_STREAM_MODERATION_ACTION_TAKEN]: LiveStreamEventCategory.MODERATION,
    [LiveStreamEventType.LIVE_STREAM_PRODUCT_PINNED]: LiveStreamEventCategory.PRODUCT,
    [LiveStreamEventType.LIVE_STREAM_PRODUCT_UNPINNED]: LiveStreamEventCategory.PRODUCT,
    [LiveStreamEventType.LIVE_AUCTION_STARTED]: LiveStreamEventCategory.AUCTION,
    [LiveStreamEventType.LIVE_AUCTION_ENDED]: LiveStreamEventCategory.AUCTION,
    [LiveStreamEventType.LIVE_AUCTION_BID_PLACED]: LiveStreamEventCategory.AUCTION,
    [LiveStreamEventType.LIVE_AUCTION_BID_CANCELLED]: LiveStreamEventCategory.AUCTION,
    [LiveStreamEventType.LIVE_AUCTION_WINNER_DETERMINED]: LiveStreamEventCategory.AUCTION,
    [LiveStreamEventType.LIVE_AUCTION_PAYMENT_CAPTURED]: LiveStreamEventCategory.AUCTION,
    [LiveStreamEventType.LIVE_STREAM_TECHNICAL_ERROR]: LiveStreamEventCategory.TECHNICAL,
    [LiveStreamEventType.LIVE_STREAM_QUALITY_DEGRADED]: LiveStreamEventCategory.TECHNICAL,
    [LiveStreamEventType.LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED]: LiveStreamEventCategory.TECHNICAL,
    [LiveStreamEventType.LIVE_STREAM_RTMP_CONNECTION_LOST]: LiveStreamEventCategory.TECHNICAL,
    [LiveStreamEventType.LIVE_STREAM_HLS_SEGMENT_CREATED]: LiveStreamEventCategory.TECHNICAL,
    [LiveStreamEventType.LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED]: LiveStreamEventCategory.TECHNICAL,
    [LiveStreamEventType.LIVE_STREAM_WEBRTC_CONNECTION_LOST]: LiveStreamEventCategory.TECHNICAL,
    [LiveStreamEventType.LIVE_STREAM_RECORDING_STARTED]: LiveStreamEventCategory.RECORDING,
    [LiveStreamEventType.LIVE_STREAM_RECORDING_ENDED]: LiveStreamEventCategory.RECORDING,
    [LiveStreamEventType.LIVE_STREAM_RECORDING_UPLOADED]: LiveStreamEventCategory.RECORDING,
    [LiveStreamEventType.LIVE_STREAM_THUMBNAIL_UPDATED]: LiveStreamEventCategory.MEDIA,
    [LiveStreamEventType.LIVE_STREAM_METADATA_UPDATED]: LiveStreamEventCategory.MEDIA,
    [LiveStreamEventType.LIVE_STREAM_ANALYTICS_DATA_COLLECTED]: LiveStreamEventCategory.ANALYTICS,
};
/**
 * Event Severity Mapping
 *
 * Maps event types to their default severity levels for audit logging
 */
exports.LiveStreamEventSeverityMap = {
    [LiveStreamEventType.LIVE_STREAM_STARTED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_ENDED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_CANCELLED]: 'WARNING',
    [LiveStreamEventType.LIVE_STREAM_VIEWER_JOINED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_VIEWER_LEFT]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_CHAT_MESSAGE_SENT]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_CHAT_MESSAGE_DELETED]: 'WARNING',
    [LiveStreamEventType.LIVE_STREAM_USER_BANNED]: 'WARNING',
    [LiveStreamEventType.LIVE_STREAM_USER_UNBANNED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_MODERATION_ACTION_TAKEN]: 'WARNING',
    [LiveStreamEventType.LIVE_STREAM_PRODUCT_PINNED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_PRODUCT_UNPINNED]: 'INFO',
    [LiveStreamEventType.LIVE_AUCTION_STARTED]: 'INFO',
    [LiveStreamEventType.LIVE_AUCTION_ENDED]: 'INFO',
    [LiveStreamEventType.LIVE_AUCTION_BID_PLACED]: 'INFO',
    [LiveStreamEventType.LIVE_AUCTION_BID_CANCELLED]: 'WARNING',
    [LiveStreamEventType.LIVE_AUCTION_WINNER_DETERMINED]: 'INFO',
    [LiveStreamEventType.LIVE_AUCTION_PAYMENT_CAPTURED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_TECHNICAL_ERROR]: 'ERROR',
    [LiveStreamEventType.LIVE_STREAM_QUALITY_DEGRADED]: 'WARNING',
    [LiveStreamEventType.LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_RTMP_CONNECTION_LOST]: 'ERROR',
    [LiveStreamEventType.LIVE_STREAM_HLS_SEGMENT_CREATED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_WEBRTC_CONNECTION_LOST]: 'ERROR',
    [LiveStreamEventType.LIVE_STREAM_RECORDING_STARTED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_RECORDING_ENDED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_RECORDING_UPLOADED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_THUMBNAIL_UPDATED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_METADATA_UPDATED]: 'INFO',
    [LiveStreamEventType.LIVE_STREAM_ANALYTICS_DATA_COLLECTED]: 'INFO',
};
//# sourceMappingURL=live-streaming.events.js.map