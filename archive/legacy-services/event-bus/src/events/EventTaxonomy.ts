// ============================================================
// Event Taxonomy Extension - Comprehensive Event System
// ============================================================

/**
 * Core Event Categories for the expanded MNBara platform
 * This extends the existing event system to support plugins, live streaming, and new features
 */

export enum EventCategory {
  // Core Platform Events
  USER = 'user',
  WALLET = 'wallet',
  TRANSACTION = 'transaction',
  AUTH = 'auth',
  SYSTEM = 'system',
  
  // Plugin System Events
  PLUGIN = 'plugin',
  PLUGIN_INSTALLATION = 'plugin_installation',
  PLUGIN_EXECUTION = 'plugin_execution',
  PLUGIN_MARKETPLACE = 'plugin_marketplace',
  
  // Live Streaming Events
  STREAM = 'stream',
  STREAM_CHAT = 'stream_chat',
  STREAM_AUCTION = 'stream_auction',
  STREAM_ANALYTICS = 'stream_analytics',
  
  // eBay Live Events
  EBAY_LIVE = 'ebay_live',
  PRODUCT_CAROUSEL = 'product_carousel',
  LIVE_AUCTION = 'live_auction',
  
  // Developer Events
  DEVELOPER = 'developer',
  DEVELOPER_ONBOARDING = 'developer_onboarding',
  PLUGIN_SUBMISSION = 'plugin_submission',
  
  // Integration Events
  INTEGRATION = 'integration',
  WEBHOOK = 'webhook',
  API = 'api',
  
  // Monitoring Events
  MONITORING = 'monitoring',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SECURITY = 'security'
}

/**
 * User Events - Extended for new platform features
 */
export enum UserEvent {
  // Basic user events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PROFILE_UPDATED = 'user.profile_updated',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  USER_EMAIL_VERIFIED = 'user.email_verified',
  USER_DELETED = 'user.deleted',
  
  // KYC/AML events
  USER_KYC_SUBMITTED = 'user.kyc_submitted',
  USER_KYC_APPROVED = 'user.kyc_approved',
  USER_KYC_REJECTED = 'user.kyc_rejected',
  USER_KYC_EXPIRED = 'user.kyc_expired',
  
  // Multi-factor authentication
  USER_MFA_ENABLED = 'user.mfa_enabled',
  USER_MFA_DISABLED = 'user.mfa_disabled',
  USER_MFA_VERIFIED = 'user.mfa_verified',
  
  // User preferences and settings
  USER_PREFERENCES_UPDATED = 'user.preferences_updated',
  USER_NOTIFICATION_SETTINGS_CHANGED = 'user.notification_settings_changed',
  USER_PRIVACY_SETTINGS_CHANGED = 'user.privacy_settings_changed',
  
  // User activity
  USER_SESSION_STARTED = 'user.session_started',
  USER_SESSION_ENDED = 'user.session_ended',
  USER_ACTIVITY_DETECTED = 'user.activity_detected',
  USER_INACTIVE = 'user.inactive'
}

/**
 * Wallet Events - Extended for unified wallet service
 */
export enum WalletEvent {
  // Wallet lifecycle
  WALLET_CREATED = 'wallet.created',
  WALLET_ACTIVATED = 'wallet.activated',
  WALLET_DEACTIVATED = 'wallet.deactivated',
  WALLET_LOCKED = 'wallet.locked',
  WALLET_UNLOCKED = 'wallet.unlocked',
  WALLET_DELETED = 'wallet.deleted',
  
  // Balance events
  WALLET_BALANCE_UPDATED = 'wallet.balance_updated',
  WALLET_BALANCE_LOW = 'wallet.balance_low',
  WALLET_BALANCE_ZERO = 'wallet.balance_zero',
  WALLET_BALANCE_NEGATIVE = 'wallet.balance_negative',
  
  // Multi-currency support
  WALLET_CURRENCY_ADDED = 'wallet.currency_added',
  WALLET_CURRENCY_REMOVED = 'wallet.currency_removed',
  WALLET_CURRENCY_CONVERTED = 'wallet.currency_converted',
  
  // Transaction events
  WALLET_DEPOSIT_INITIATED = 'wallet.deposit_initiated',
  WALLET_DEPOSIT_COMPLETED = 'wallet.deposit_completed',
  WALLET_DEPOSIT_FAILED = 'wallet.deposit_failed',
  WALLET_WITHDRAWAL_INITIATED = 'wallet.withdrawal_initiated',
  WALLET_WITHDRAWAL_COMPLETED = 'wallet.withdrawal_completed',
  WALLET_WITHDRAWAL_FAILED = 'wallet.withdrawal_failed',
  WALLET_TRANSFER_INITIATED = 'wallet.transfer_initiated',
  WALLET_TRANSFER_COMPLETED = 'wallet.transfer_completed',
  WALLET_TRANSFER_FAILED = 'wallet.transfer_failed',
  
  // Limits and restrictions
  WALLET_LIMIT_EXCEEDED = 'wallet.limit_exceeded',
  WALLET_DAILY_LIMIT_EXCEEDED = 'wallet.daily_limit_exceeded',
  WALLET_MONTHLY_LIMIT_EXCEEDED = 'wallet.monthly_limit_exceeded',
  WALLET_TRANSACTION_LIMIT_EXCEEDED = 'wallet.transaction_limit_exceeded',
  
  // Compliance events
  WALLET_COMPLIANCE_CHECK_INITIATED = 'wallet.compliance_check_initiated',
  WALLET_COMPLIANCE_CHECK_PASSED = 'wallet.compliance_check_passed',
  WALLET_COMPLIANCE_CHECK_FAILED = 'wallet.compliance_check_failed',
  WALLET_COMPLIANCE_FLAGGED = 'wallet.compliance_flagged'
}

/**
 * Plugin System Events - New comprehensive event taxonomy
 */
export enum PluginEvent {
  // Plugin lifecycle
  PLUGIN_CREATED = 'plugin.created',
  PLUGIN_UPDATED = 'plugin.updated',
  PLUGIN_DELETED = 'plugin.deleted',
  PLUGIN_ACTIVATED = 'plugin.activated',
  PLUGIN_DEACTIVATED = 'plugin.deactivated',
  PLUGIN_SUSPENDED = 'plugin.suspended',
  PLUGIN_RESTORED = 'plugin.restored',
  
  // Plugin installation
  PLUGIN_INSTALLATION_STARTED = 'plugin.installation_started',
  PLUGIN_INSTALLATION_COMPLETED = 'plugin.installation_completed',
  PLUGIN_INSTALLATION_FAILED = 'plugin.installation_failed',
  PLUGIN_INSTALLATION_ROLLED_BACK = 'plugin.installation_rolled_back',
  PLUGIN_UNINSTALLATION_STARTED = 'plugin.uninstallation_started',
  PLUGIN_UNINSTALLATION_COMPLETED = 'plugin.uninstallation_completed',
  PLUGIN_UNINSTALLATION_FAILED = 'plugin.uninstallation_failed',
  
  // Plugin execution
  PLUGIN_EXECUTION_STARTED = 'plugin.execution_started',
  PLUGIN_EXECUTION_COMPLETED = 'plugin.execution_completed',
  PLUGIN_EXECUTION_FAILED = 'plugin.execution_failed',
  PLUGIN_EXECUTION_TIMEOUT = 'plugin.execution_timeout',
  PLUGIN_EXECUTION_TERMINATED = 'plugin.execution_terminated',
  
  // Plugin hooks
  PLUGIN_HOOK_REGISTERED = 'plugin.hook_registered',
  PLUGIN_HOOK_UNREGISTERED = 'plugin.hook_unregistered',
  PLUGIN_HOOK_TRIGGERED = 'plugin.hook_triggered',
  PLUGIN_HOOK_EXECUTED = 'plugin.hook_executed',
  PLUGIN_HOOK_FAILED = 'plugin.hook_failed',
  
  // Plugin API
  PLUGIN_API_ENDPOINT_REGISTERED = 'plugin.api_endpoint_registered',
  PLUGIN_API_ENDPOINT_UNREGISTERED = 'plugin.api_endpoint_unregistered',
  PLUGIN_API_REQUEST_RECEIVED = 'plugin.api_request_received',
  PLUGIN_API_RESPONSE_SENT = 'plugin.api_response_sent',
  PLUGIN_API_ERROR_OCCURRED = 'plugin.api_error_occurred',
  
  // Plugin configuration
  PLUGIN_CONFIG_UPDATED = 'plugin.config_updated',
  PLUGIN_CONFIG_VALIDATED = 'plugin.config_validated',
  PLUGIN_CONFIG_INVALID = 'plugin.config_invalid',
  PLUGIN_PERMISSIONS_UPDATED = 'plugin.permissions_updated',
  
  // Plugin sandbox
  PLUGIN_SANDBOX_CREATED = 'plugin.sandbox_created',
  PLUGIN_SANDBOX_DESTROYED = 'plugin.sandbox_destroyed',
  PLUGIN_SANDBOX_VIOLATION = 'plugin.sandbox_violation',
  PLUGIN_MEMORY_LIMIT_EXCEEDED = 'plugin.memory_limit_exceeded',
  PLUGIN_CPU_LIMIT_EXCEEDED = 'plugin.cpu_limit_exceeded'
}

/**
 * Plugin Marketplace Events
 */
export enum PluginMarketplaceEvent {
  // Plugin submission
  PLUGIN_SUBMITTED = 'plugin.submitted',
  PLUGIN_SUBMISSION_APPROVED = 'plugin.submission_approved',
  PLUGIN_SUBMISSION_REJECTED = 'plugin.submission_rejected',
  PLUGIN_SUBMISSION_WITHDRAWN = 'plugin.submission_withdrawn',
  
  // Plugin review
  PLUGIN_REVIEW_STARTED = 'plugin.review_started',
  PLUGIN_REVIEW_COMPLETED = 'plugin.review_completed',
  PLUGIN_REVIEW_REJECTED = 'plugin.review_rejected',
  PLUGIN_REVIEW_REQUESTED = 'plugin.review_requested',
  
  // Plugin publishing
  PLUGIN_PUBLISHED = 'plugin.published',
  PLUGIN_UNPUBLISHED = 'plugin.unpublished',
  PLUGIN_VERSION_PUBLISHED = 'plugin.version_published',
  PLUGIN_VERSION_UNPUBLISHED = 'plugin.version_unpublished',
  
  // Plugin discovery
  PLUGIN_SEARCH_PERFORMED = 'plugin.search_performed',
  PLUGIN_VIEWED = 'plugin.viewed',
  PLUGIN_DOWNLOADED = 'plugin.downloaded',
  PLUGIN_INSTALLED_FROM_MARKETPLACE = 'plugin.installed_from_marketplace',
  
  // Plugin ratings and reviews
  PLUGIN_RATED = 'plugin.rated',
  PLUGIN_REVIEW_SUBMITTED = 'plugin.review_submitted',
  PLUGIN_REVIEW_APPROVED = 'plugin.review_approved',
  PLUGIN_REVIEW_REJECTED = 'plugin.review_rejected',
  
  // Plugin monetization
  PLUGIN_PURCHASED = 'plugin.purchased',
  PLUGIN_SUBSCRIBED = 'plugin.subscribed',
  PLUGIN_UNSUBSCRIBED = 'plugin.unsubscribed',
  PLUGIN_REFUND_REQUESTED = 'plugin.refund_requested',
  PLUGIN_REFUND_PROCESSED = 'plugin.refund_processed'
}

/**
 * Developer Events
 */
export enum DeveloperEvent {
  // Developer onboarding
  DEVELOPER_REGISTERED = 'developer.registered',
  DEVELOVER_EMAIL_VERIFIED = 'developer.email_verified',
  DEVELOPER_PROFILE_COMPLETED = 'developer.profile_completed',
  DEVELOPER_KYC_SUBMITTED = 'developer.kyc_submitted',
  DEVELOPER_KYC_APPROVED = 'developer.kyc_approved',
  DEVELOPER_KYC_REJECTED = 'developer.kyc_rejected',
  
  // Developer account
  DEVELOPER_ACCOUNT_ACTIVATED = 'developer.account_activated',
  DEVELOPER_ACCOUNT_SUSPENDED = 'developer.account_suspended',
  DEVELOPER_ACCOUNT_DELETED = 'developer.account_deleted',
  DEVELOPER_API_KEY_GENERATED = 'developer.api_key_generated',
  DEVELOPER_API_KEY_REVOKED = 'developer.api_key_revoked',
  
  // Developer activity
  DEVELOPER_LOGIN = 'developer.login',
  DEVELOPER_LOGOUT = 'developer.logout',
  DEVELOPER_SESSION_EXPIRED = 'developer.session_expired',
  DEVELOPER_PASSWORD_RESET = 'developer.password_reset',
  
  // Developer support
  DEVELOPER_SUPPORT_TICKET_CREATED = 'developer.support_ticket_created',
  DEVELOPER_SUPPORT_TICKET_UPDATED = 'developer.support_ticket_updated',
  DEVELOPER_SUPPORT_TICKET_RESOLVED = 'developer.support_ticket_resolved',
  
  // Developer documentation
  DEVELOPER_DOCUMENTATION_CREATED = 'developer.documentation_created',
  DEVELOPER_DOCUMENTATION_UPDATED = 'developer.documentation_updated',
  DEVELOPER_DOCUMENTATION_PUBLISHED = 'developer.documentation_published'
}

/**
 * Live Streaming Events - New comprehensive taxonomy
 */
export enum StreamEvent {
  // Stream lifecycle
  STREAM_CREATED = 'stream.created',
  STREAM_STARTED = 'stream.started',
  STREAM_ENDED = 'stream.ended',
  STREAM_CANCELLED = 'stream.cancelled',
  STREAM_SCHEDULED = 'stream.scheduled',
  STREAM_RESCHEDULED = 'stream.rescheduled',
  
  // Stream status
  STREAM_STATUS_CHANGED = 'stream.status_changed',
  STREAM_CONNECTION_ESTABLISHED = 'stream.connection_established',
  STREAM_CONNECTION_LOST = 'stream.connection_lost',
  STREAM_RECONNECTED = 'stream.reconnected',
  
  // Stream quality
  STREAM_QUALITY_CHANGED = 'stream.quality_changed',
  STREAM_BITRATE_ADJUSTED = 'stream.bitrate_adjusted',
  STREAM_RESOLUTION_CHANGED = 'stream.resolution_changed',
  STREAM_FRAME_RATE_CHANGED = 'stream.frame_rate_changed',
  
  // Stream protocols
  STREAM_RTMP_CONNECTED = 'stream.rtmp_connected',
  STREAM_RTMP_DISCONNECTED = 'stream.rtmp_disconnected',
  STREAM_HLS_SEGMENT_CREATED = 'stream.hls_segment_created',
  STREAM_WEBRTC_PEER_CONNECTED = 'stream.webrtc_peer_connected',
  STREAM_WEBRTC_PEER_DISCONNECTED = 'stream.webrtc_peer_disconnected',
  
  // Stream analytics
  STREAM_VIEWER_JOINED = 'stream.viewer_joined',
  STREAM_VIEWER_LEFT = 'stream.viewer_left',
  STREAM_VIEWER_COUNT_UPDATED = 'stream.viewer_count_updated',
  STREAM_PEAK_VIEWERS_REACHED = 'stream.peak_viewers_reached',
  STREAM_AVERAGE_VIEWERS_UPDATED = 'stream.average_viewers_updated',
  
  // Stream recording
  STREAM_RECORDING_STARTED = 'stream.recording_started',
  STREAM_RECORDING_STOPPED = 'stream.recording_stopped',
  STREAM_RECORDING_COMPLETED = 'stream.recording_completed',
  STREAM_RECORDING_FAILED = 'stream.recording_failed',
  STREAM_RECORDING_UPLOADED = 'stream.recording_uploaded',
  
  // Stream errors
  STREAM_ERROR_OCCURRED = 'stream.error_occurred',
  STREAM_TIMEOUT_OCCURRED = 'stream.timeout_occurred',
  STREAM_BUFFERING_DETECTED = 'stream.buffering_detected',
  STREAM_LAG_DETECTED = 'stream.lag_detected'
}

/**
 * Stream Chat Events
 */
export enum StreamChatEvent {
  // Chat lifecycle
  CHAT_ROOM_CREATED = 'chat.room_created',
  CHAT_ROOM_DELETED = 'chat.room_deleted',
  CHAT_ROOM_JOINED = 'chat.room_joined',
  CHAT_ROOM_LEFT = 'chat.room_left',
  CHAT_ROOM_MODERATED = 'chat.room_moderated',
  
  // Chat messages
  CHAT_MESSAGE_SENT = 'chat.message_sent',
  CHAT_MESSAGE_RECEIVED = 'chat.message_received',
  CHAT_MESSAGE_EDITED = 'chat.message_edited',
  CHAT_MESSAGE_DELETED = 'chat.message_deleted',
  CHAT_MESSAGE_PINNED = 'chat.message_pinned',
  CHAT_MESSAGE_UNPINNED = 'chat.message_unpinned',
  
  // Chat reactions
  CHAT_REACTION_ADDED = 'chat.reaction_added',
  CHAT_REACTION_REMOVED = 'chat.reaction_removed',
  CHAT_REACTION_UPDATED = 'chat.reaction_updated',
  
  // Chat moderation
  CHAT_USER_MUTED = 'chat.user_muted',
  CHAT_USER_UNMUTED = 'chat.user_unmuted',
  CHAT_USER_BANNED = 'chat.user_banned',
  CHAT_USER_UNBANNED = 'chat.user_unbanned',
  CHAT_USER_TIMEOUTED = 'chat.user_timeouted',
  
  // Chat spam detection
  CHAT_SPAM_DETECTED = 'chat.spam_detected',
  CHAT_SPAM_BLOCKED = 'chat.spam_blocked',
  CHAT_RATE_LIMIT_EXCEEDED = 'chat.rate_limit_exceeded',
  
  // Chat features
  CHAT_EMOTE_USED = 'chat.emote_used',
  CHAT_GIFT_SENT = 'chat.gift_sent',
  CHAT_GIFT_RECEIVED = 'chat.gift_received',
  CHAT_POLL_CREATED = 'chat.poll_created',
  CHAT_POLL_VOTED = 'chat.poll_voted',
  CHAT_POLL_ENDED = 'chat.poll_ended'
}

/**
 * Stream Auction Events
 */
export enum StreamAuctionEvent {
  // Auction lifecycle
  AUCTION_CREATED = 'auction.created',
  AUCTION_STARTED = 'auction.started',
  AUCTION_ENDED = 'auction.ended',
  AUCTION_CANCELLED = 'auction.cancelled',
  AUCTION_EXTENDED = 'auction.extended',
  
  // Auction items
  AUCTION_ITEM_ADDED = 'auction.item_added',
  AUCTION_ITEM_REMOVED = 'auction.item_removed',
  AUCTION_ITEM_UPDATED = 'auction.item_updated',
  AUCTION_ITEM_SOLD = 'auction.item_sold',
  AUCTION_ITEM_UNSOLD = 'auction.item_unsold',
  
  // Bidding
  BID_PLACED = 'auction.bid_placed',
  BID_ACCEPTED = 'auction.bid_accepted',
  BID_REJECTED = 'auction.bid_rejected',
  BID_OUTBID = 'auction.bid_outbid',
  BID_WITHDRAWN = 'auction.bid_withdrawn',
  
  // Auction features
  AUCTION_PROXY_BID_ENABLED = 'auction.proxy_bid_enabled',
  AUCTION_PROXY_BID_TRIGGERED = 'auction.proxy_bid_triggered',
  AUCTION_ANTI_SNIPE_ACTIVATED = 'auction.anti_snipe_activated',
  AUCTION_RESERVE_PRICE_MET = 'auction.reserve_price_met',
  AUCTION_RESERVE_PRICE_NOT_MET = 'auction.reserve_price_not_met',
  
  // Auction analytics
  AUCTION_VIEWER_COUNT_UPDATED = 'auction.viewer_count_updated',
  AUCTION_BID_COUNT_UPDATED = 'auction.bid_count_updated',
  AUCTION_FINAL_PRICE_DETERMINED = 'auction.final_price_determined'
}

/**
 * Product Carousel Events
 */
export enum ProductCarouselEvent {
  // Carousel lifecycle
  CAROUSEL_CREATED = 'carousel.created',
  CAROUSEL_UPDATED = 'carousel.updated',
  CAROUSEL_DELETED = 'carousel.deleted',
  CAROUSEL_ACTIVATED = 'carousel.activated',
  CAROUSEL_DEACTIVATED = 'carousel.deactivated',
  
  // Carousel items
  CAROUSEL_ITEM_ADDED = 'carousel.item_added',
  CAROUSEL_ITEM_REMOVED = 'carousel.item_removed',
  CAROUSEL_ITEM_UPDATED = 'carousel.item_updated',
  CAROUSEL_ITEM_HIGHLIGHTED = 'carousel.item_highlighted',
  
  // Carousel rotation
  CAROUSEL_ROTATION_STARTED = 'carousel.rotation_started',
  CAROUSEL_ROTATION_STOPPED = 'carousel.rotation_stopped',
  CAROUSEL_ITEM_CHANGED = 'carousel.item_changed',
  CAROUSEL_AUTO_ROTATION_ENABLED = 'carousel.auto_rotation_enabled',
  CAROUSEL_AUTO_ROTATION_DISABLED = 'carousel.auto_rotation_disabled',
  
  // User interaction
  CAROUSEL_ITEM_CLICKED = 'carousel.item_clicked',
  CAROUSEL_ITEM_VIEWED = 'carousel.item_viewed',
  CAROUSEL_ITEM_SHARED = 'carousel.item_shared',
  CAROUSEL_ITEM_BOOKMARKED = 'carousel.item_bookmarked'
}

/**
 * eBay Live Integration Events
 */
export enum EbayLiveEvent {
  // eBay integration
  EBAY_CONNECTION_ESTABLISHED = 'ebay.connection_established',
  EBAY_CONNECTION_LOST = 'ebay.connection_lost',
  EBAY_API_RATE_LIMIT_HIT = 'ebay.api_rate_limit_hit',
  EBAY_WEBHOOK_RECEIVED = 'ebay.webhook_received',
  
  // Product synchronization
  EBAY_PRODUCT_SYNC_STARTED = 'ebay.product_sync_started',
  EBAY_PRODUCT_SYNC_COMPLETED = 'ebay.product_sync_completed',
  EBAY_PRODUCT_SYNC_FAILED = 'ebay.product_sync_failed',
  EBAY_PRODUCT_UPDATED = 'ebay.product_updated',
  EBAY_PRODUCT_REMOVED = 'ebay.product_removed',
  
  // Listing management
  EBAY_LISTING_CREATED = 'ebay.listing_created',
  EBAY_LISTING_UPDATED = 'ebay.listing_updated',
  EBAY_LISTING_ENDED = 'ebay.listing_ended',
  EBAY_LISTING_SOLD = 'ebay.listing_sold',
  
  // Order management
  EBAY_ORDER_RECEIVED = 'ebay.order_received',
  EBAY_ORDER_UPDATED = 'ebay.order_updated',
  EBAY_ORDER_CANCELLED = 'ebay.order_cancelled',
  EBAY_ORDER_SHIPPED = 'ebay.order_shipped',
  EBAY_ORDER_DELIVERED = 'ebay.order_delivered'
}

/**
 * Integration Events
 */
export enum IntegrationEvent {
  // API integration
  API_REQUEST_RECEIVED = 'integration.api_request_received',
  API_RESPONSE_SENT = 'integration.api_response_sent',
  API_ERROR_OCCURRED = 'integration.api_error_occurred',
  API_RATE_LIMIT_EXCEEDED = 'integration.api_rate_limit_exceeded',
  API_AUTHENTICATION_FAILED = 'integration.api_authentication_failed',
  
  // Webhook events
  WEBHOOK_RECEIVED = 'integration.webhook_received',
  WEBHOOK_PROCESSED = 'integration.webhook_processed',
  WEBHOOK_FAILED = 'integration.webhook_failed',
  WEBHOOK_RETRY_ATTEMPTED = 'integration.webhook_retry_attempted',
  WEBHOOK_DISABLED = 'integration.webhook_disabled',
  
  // Third-party integrations
  INTEGRATION_CONNECTED = 'integration.connected',
  INTEGRATION_DISCONNECTED = 'integration.disconnected',
  INTEGRATION_SYNC_STARTED = 'integration.sync_started',
  INTEGRATION_SYNC_COMPLETED = 'integration.sync_completed',
  INTEGRATION_SYNC_FAILED = 'integration.sync_failed',
  INTEGRATION_DATA_RECEIVED = 'integration.data_received',
  INTEGRATION_DATA_SENT = 'integration.data_sent'
}

/**
 * Monitoring Events
 */
export enum MonitoringEvent {
  // System health
  SYSTEM_HEALTH_CHECK_PASSED = 'monitoring.health_check_passed',
  SYSTEM_HEALTH_CHECK_FAILED = 'monitoring.health_check_failed',
  SYSTEM_RESOURCE_USAGE_HIGH = 'monitoring.resource_usage_high',
  SYSTEM_MEMORY_USAGE_HIGH = 'monitoring.memory_usage_high',
  SYSTEM_CPU_USAGE_HIGH = 'monitoring.cpu_usage_high',
  SYSTEM_DISK_USAGE_HIGH = 'monitoring.disk_usage_high',
  
  // Performance events
  PERFORMANCE_RESPONSE_TIME_HIGH = 'monitoring.response_time_high',
  PERFORMANCE_QUERY_TIME_HIGH = 'monitoring.query_time_high',
  PERFORMANCE_CACHE_HIT_RATE_LOW = 'monitoring.cache_hit_rate_low',
  PERFORMANCE_QUEUE_SIZE_HIGH = 'monitoring.queue_size_high',
  
  // Error events
  ERROR_UNHANDLED_EXCEPTION = 'monitoring.unhandled_exception',
  ERROR_DATABASE_CONNECTION_LOST = 'monitoring.database_connection_lost',
  ERROR_REDIS_CONNECTION_LOST = 'monitoring.redis_connection_lost',
  ERROR_EXTERNAL_SERVICE_UNAVAILABLE = 'monitoring.external_service_unavailable',
  ERROR_RATE_LIMIT_EXCEEDED = 'monitoring.rate_limit_exceeded',
  
  // Security events
  SECURITY_LOGIN_ATTEMPT = 'monitoring.login_attempt',
  SECURITY_LOGIN_FAILED = 'monitoring.login_failed',
  SECURITY_SUSPICIOUS_ACTIVITY = 'monitoring.suspicious_activity',
  SECURITY_POTENTIAL_ATTACK = 'monitoring.potential_attack',
  SECURITY_IP_BLOCKED = 'monitoring.ip_blocked',
  SECURITY_RATE_LIMIT_TRIGGERED = 'monitoring.rate_limit_triggered'
}

/**
 * Base Event Interface
 */
export interface BaseEvent {
  id: string;
  type: string;
  category: EventCategory;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Event Metadata Interfaces
 */
export interface UserEventMetadata {
  userId: string;
  userType?: 'individual' | 'business' | 'merchant';
  kycLevel?: 'basic' | 'verified' | 'enhanced';
  previousValue?: any;
  newValue?: any;
  changeReason?: string;
}

export interface WalletEventMetadata {
  walletId: string;
  currency: string;
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  transactionId?: string;
  referenceId?: string;
  fees?: {
    platform?: number;
    processing?: number;
    conversion?: number;
  };
}

export interface PluginEventMetadata {
  pluginId: string;
  pluginVersion?: string;
  pluginName?: string;
  developerId?: string;
  executionTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface StreamEventMetadata {
  streamId: string;
  streamKey?: string;
  viewerCount?: number;
  quality?: string;
  bitrate?: number;
  duration?: number;
  protocol?: 'rtmp' | 'hls' | 'webrtc';
  errorCode?: string;
}

export interface AuctionEventMetadata {
  auctionId: string;
  itemId?: string;
  bidAmount?: number;
  bidderId?: string;
  reservePrice?: number;
  currentPrice?: number;
  bidCount?: number;
  timeRemaining?: number;
}

/**
 * Event Priority Levels
 */
export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Event Routing Rules
 */
export interface EventRoutingRule {
  eventType: string;
  category: EventCategory;
  priority: EventPriority;
  destinations: string[]; // Redis channels, webhook URLs, etc.
  filters?: {
    userId?: string[];
    metadata?: Record<string, any>;
    tags?: string[];
  };
  transformations?: {
    fieldMappings?: Record<string, string>;
    valueTransformers?: Record<string, (value: any) => any>;
  };
}

/**
 * Event Validation Rules
 */
export interface EventValidationRule {
  eventType: string;
  requiredFields: string[];
  optionalFields: string[];
  metadataSchema?: Record<string, any>;
  maxSizeBytes?: number;
  ttlSeconds?: number;
}

/**
 * Event Retention Policies
 */
export interface EventRetentionPolicy {
  category: EventCategory;
  priority: EventPriority;
  retentionDays: number;
  archiveAfterDays?: number;
  compressAfterDays?: number;
}

/**
 * Event Indexing Configuration
 */
export interface EventIndexingConfig {
  eventType: string;
  indexedFields: string[];
  fullTextSearchFields?: string[];
  timeSeriesFields?: string[];
  aggregationFields?: string[];
}

/**
 * Event Analytics Configuration
 */
export interface EventAnalyticsConfig {
  eventType: string;
  metrics: {
    count?: boolean;
    rate?: boolean;
    duration?: boolean;
    errorRate?: boolean;
  };
  dimensions: string[];
  timeWindows: ('1m' | '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d')[];
  alerts?: {
    threshold: number;
    window: string;
    comparison: 'greater_than' | 'less_than' | 'equals';
  }[];
}