/**
 * API Endpoints Configuration
 * 
 * Centralized API endpoint definitions for all services in the Mnbara platform.
 * Organized by service domain for easy maintenance and discoverability.
 * 
 * @module endpoints
 */

// ============================================================================
// Authentication & Authorization Endpoints
// ============================================================================

export const AUTH_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  
  // Password Management
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // Two-Factor Authentication
  ENABLE_2FA: '/auth/2fa/enable',
  DISABLE_2FA: '/auth/2fa/disable',
  VERIFY_2FA: '/auth/2fa/verify',
  
  // Session Management
  GET_SESSIONS: '/auth/sessions',
  REVOKE_SESSION: (sessionId: string) => `/auth/sessions/${sessionId}`,
  REVOKE_ALL_SESSIONS: '/auth/sessions/revoke-all',
} as const;

// ============================================================================
// User Management Endpoints
// ============================================================================

export const USER_ENDPOINTS = {
  // User CRUD
  GET_USERS: '/users',
  GET_USER: (userId: string) => `/users/${userId}`,
  CREATE_USER: '/users',
  UPDATE_USER: (userId: string) => `/users/${userId}`,
  DELETE_USER: (userId: string) => `/users/${userId}`,
  GET_CURRENT_USER: '/users/me',
  UPDATE_CURRENT_USER: '/users/me',
  
  // User Profile
  GET_USER_PROFILE: (userId: string) => `/users/${userId}/profile`,
  UPDATE_USER_PROFILE: (userId: string) => `/users/${userId}/profile`,
  UPLOAD_AVATAR: (userId: string) => `/users/${userId}/avatar`,
  DELETE_AVATAR: (userId: string) => `/users/${userId}/avatar`,
  
  // User Preferences
  GET_USER_PREFERENCES: (userId: string) => `/users/${userId}/preferences`,
  UPDATE_USER_PREFERENCES: (userId: string) => `/users/${userId}/preferences`,
  
  // User Statistics
  GET_USER_STATISTICS: (userId: string) => `/users/${userId}/statistics`,
  
  // KYC Verification
  GET_KYC_STATUS: (userId: string) => `/users/${userId}/kyc`,
  SUBMIT_KYC: (userId: string) => `/users/${userId}/kyc`,
  UPLOAD_KYC_DOCUMENT: (userId: string) => `/users/${userId}/kyc/documents`,
  GET_KYC_DOCUMENTS: (userId: string) => `/users/${userId}/kyc/documents`,
  
  // User Activity
  GET_USER_ACTIVITY: (userId: string) => `/users/${userId}/activity`,
  
  // User Search
  SEARCH_USERS: '/users/search',
  
  // Public Profile
  GET_PUBLIC_PROFILE: (userId: string) => `/users/${userId}/public`,
} as const;

// ============================================================================
// Order Management Endpoints
// ============================================================================

export const ORDER_ENDPOINTS = {
  // Order CRUD
  GET_ORDERS: '/orders',
  GET_ORDER: (orderId: string) => `/orders/${orderId}`,
  CREATE_ORDER: '/orders',
  UPDATE_ORDER: (orderId: string) => `/orders/${orderId}`,
  CANCEL_ORDER: (orderId: string) => `/orders/${orderId}/cancel`,
  
  // Order Status
  UPDATE_ORDER_STATUS: (orderId: string) => `/orders/${orderId}/status`,
  GET_ORDER_TIMELINE: (orderId: string) => `/orders/${orderId}/timeline`,
  
  // Order Items
  GET_ORDER_ITEMS: (orderId: string) => `/orders/${orderId}/items`,
  ADD_ORDER_ITEM: (orderId: string) => `/orders/${orderId}/items`,
  UPDATE_ORDER_ITEM: (orderId: string, itemId: string) => `/orders/${orderId}/items/${itemId}`,
  REMOVE_ORDER_ITEM: (orderId: string, itemId: string) => `/orders/${orderId}/items/${itemId}`,
  
  // Order Tracking
  TRACK_ORDER: (orderId: string) => `/orders/${orderId}/track`,
  GET_TRACKING_EVENTS: (orderId: string) => `/orders/${orderId}/tracking-events`,
  
  // Order Notes
  GET_ORDER_NOTES: (orderId: string) => `/orders/${orderId}/notes`,
  ADD_ORDER_NOTE: (orderId: string) => `/orders/${orderId}/notes`,
  
  // Order Invoice & Receipt
  GET_ORDER_INVOICE: (orderId: string) => `/orders/${orderId}/invoice`,
  GET_ORDER_RECEIPT: (orderId: string) => `/orders/${orderId}/receipt`,
  DOWNLOAD_ORDER_INVOICE: (orderId: string) => `/orders/${orderId}/invoice/download`,
  
  // Order Statistics
  GET_ORDER_STATISTICS: '/orders/statistics',
  GET_ORDER_ANALYTICS: '/orders/analytics',
  
  // Order Search & Filter
  SEARCH_ORDERS: '/orders/search',
  FILTER_ORDERS: '/orders/filter',
  
  // Bulk Operations
  BULK_UPDATE_ORDERS: '/orders/bulk-update',
  BULK_CANCEL_ORDERS: '/orders/bulk-cancel',
  EXPORT_ORDERS: '/orders/export',
} as const;

// ============================================================================
// Payment Endpoints
// ============================================================================

export const PAYMENT_ENDPOINTS = {
  // Payment Methods
  GET_PAYMENT_METHODS: '/payments/methods',
  GET_PAYMENT_METHOD: (methodId: string) => `/payments/methods/${methodId}`,
  ADD_PAYMENT_METHOD: '/payments/methods',
  UPDATE_PAYMENT_METHOD: (methodId: string) => `/payments/methods/${methodId}`,
  DELETE_PAYMENT_METHOD: (methodId: string) => `/payments/methods/${methodId}`,
  SET_DEFAULT_PAYMENT_METHOD: (methodId: string) => `/payments/methods/${methodId}/set-default`,
  
  // Payment Transactions
  GET_PAYMENTS: '/payments',
  GET_PAYMENT: (paymentId: string) => `/payments/${paymentId}`,
  CREATE_PAYMENT: '/payments',
  CAPTURE_PAYMENT: (paymentId: string) => `/payments/${paymentId}/capture`,
  CANCEL_PAYMENT: (paymentId: string) => `/payments/${paymentId}/cancel`,
  
  // Payment Intents
  CREATE_PAYMENT_INTENT: '/payments/intents',
  GET_PAYMENT_INTENT: (intentId: string) => `/payments/intents/${intentId}`,
  CONFIRM_PAYMENT_INTENT: (intentId: string) => `/payments/intents/${intentId}/confirm`,
  
  // Refunds
  GET_REFUNDS: '/payments/refunds',
  GET_REFUND: (refundId: string) => `/payments/refunds/${refundId}`,
  CREATE_REFUND: '/payments/refunds',
  
  // Payouts
  GET_PAYOUTS: '/payments/payouts',
  GET_PAYOUT: (payoutId: string) => `/payments/payouts/${payoutId}`,
  CREATE_PAYOUT: '/payments/payouts',
  
  // Wallet
  GET_WALLET_BALANCE: '/payments/wallet/balance',
  GET_WALLET_TRANSACTIONS: '/payments/wallet/transactions',
  DEPOSIT_TO_WALLET: '/payments/wallet/deposit',
  WITHDRAW_FROM_WALLET: '/payments/wallet/withdraw',
  TRANSFER_FUNDS: '/payments/wallet/transfer',
  
  // Escrow
  CREATE_ESCROW: '/payments/escrow',
  GET_ESCROW: (escrowId: string) => `/payments/escrow/${escrowId}`,
  RELEASE_ESCROW: (escrowId: string) => `/payments/escrow/${escrowId}/release`,
  REFUND_ESCROW: (escrowId: string) => `/payments/escrow/${escrowId}/refund`,
  
  // Payment Verification
  VERIFY_PAYMENT: (paymentId: string) => `/payments/${paymentId}/verify`,
  
  // Payment Statistics
  GET_PAYMENT_STATISTICS: '/payments/statistics',
  GET_PAYMENT_ANALYTICS: '/payments/analytics',
  
  // Disputes & Chargebacks
  GET_DISPUTES: '/payments/disputes',
  GET_DISPUTE: (disputeId: string) => `/payments/disputes/${disputeId}`,
  SUBMIT_DISPUTE_EVIDENCE: (disputeId: string) => `/payments/disputes/${disputeId}/evidence`,
  
  // Payment Links
  CREATE_PAYMENT_LINK: '/payments/links',
  GET_PAYMENT_LINK: (linkId: string) => `/payments/links/${linkId}`,
  
  // Webhooks
  PAYMENT_WEBHOOK: '/payments/webhooks',
} as const;

// ============================================================================
// Delivery & Crowdshipping Endpoints
// ============================================================================

export const DELIVERY_ENDPOINTS = {
  // Delivery CRUD
  GET_DELIVERIES: '/deliveries',
  GET_DELIVERY: (deliveryId: string) => `/deliveries/${deliveryId}`,
  CREATE_DELIVERY: '/deliveries',
  UPDATE_DELIVERY: (deliveryId: string) => `/deliveries/${deliveryId}`,
  CANCEL_DELIVERY: (deliveryId: string) => `/deliveries/${deliveryId}/cancel`,
  
  // Delivery Assignment
  ASSIGN_DELIVERY: (deliveryId: string) => `/deliveries/${deliveryId}/assign`,
  ACCEPT_DELIVERY: (deliveryId: string) => `/deliveries/${deliveryId}/accept`,
  REJECT_DELIVERY: (deliveryId: string) => `/deliveries/${deliveryId}/reject`,
  
  // Delivery Status
  UPDATE_DELIVERY_STATUS: (deliveryId: string) => `/deliveries/${deliveryId}/status`,
  MARK_PICKED_UP: (deliveryId: string) => `/deliveries/${deliveryId}/pickup`,
  MARK_IN_TRANSIT: (deliveryId: string) => `/deliveries/${deliveryId}/in-transit`,
  MARK_DELIVERED: (deliveryId: string) => `/deliveries/${deliveryId}/deliver`,
  
  // Delivery Tracking
  TRACK_DELIVERY: (deliveryId: string) => `/deliveries/${deliveryId}/track`,
  GET_TRACKING_EVENTS: (deliveryId: string) => `/deliveries/${deliveryId}/tracking-events`,
  UPDATE_LOCATION: (deliveryId: string) => `/deliveries/${deliveryId}/location`,
  
  // Proof of Delivery
  SUBMIT_PROOF: (deliveryId: string) => `/deliveries/${deliveryId}/proof`,
  GET_PROOF: (deliveryId: string) => `/deliveries/${deliveryId}/proof`,
  
  // Delivery Rating
  RATE_DELIVERY: (deliveryId: string) => `/deliveries/${deliveryId}/rate`,
  GET_DELIVERY_RATING: (deliveryId: string) => `/deliveries/${deliveryId}/rating`,
  
  // Delivery Issues
  REPORT_ISSUE: (deliveryId: string) => `/deliveries/${deliveryId}/issues`,
  GET_ISSUES: (deliveryId: string) => `/deliveries/${deliveryId}/issues`,
  RESOLVE_ISSUE: (deliveryId: string, issueId: string) => `/deliveries/${deliveryId}/issues/${issueId}/resolve`,
  
  // Delivery Quote
  GET_DELIVERY_QUOTE: '/deliveries/quote',
  CHECK_AVAILABILITY: '/deliveries/availability',
  
  // Delivery Statistics
  GET_DELIVERY_STATISTICS: '/deliveries/statistics',
  GET_DELIVERY_ANALYTICS: '/deliveries/analytics',
  
  // Delivery Search
  SEARCH_DELIVERIES: '/deliveries/search',
  FILTER_DELIVERIES: '/deliveries/filter',
  
  // Delivery Batch
  CREATE_BATCH: '/deliveries/batches',
  GET_BATCH: (batchId: string) => `/deliveries/batches/${batchId}`,
  GET_BATCHES: '/deliveries/batches',
  
  // Delivery Zones
  GET_ZONES: '/deliveries/zones',
  GET_ZONE: (zoneId: string) => `/deliveries/zones/${zoneId}`,
  CHECK_ZONE_SERVICEABILITY: '/deliveries/zones/check',
  
  // Route Optimization
  OPTIMIZE_ROUTE: '/deliveries/optimize-route',
} as const;

// ============================================================================
// Product & Marketplace Endpoints
// ============================================================================

export const PRODUCT_ENDPOINTS = {
  // Product CRUD
  GET_PRODUCTS: '/products',
  GET_PRODUCT: (productId: string) => `/products/${productId}`,
  CREATE_PRODUCT: '/products',
  UPDATE_PRODUCT: (productId: string) => `/products/${productId}`,
  DELETE_PRODUCT: (productId: string) => `/products/${productId}`,
  
  // Product Images
  UPLOAD_PRODUCT_IMAGE: (productId: string) => `/products/${productId}/images`,
  DELETE_PRODUCT_IMAGE: (productId: string, imageId: string) => `/products/${productId}/images/${imageId}`,
  REORDER_PRODUCT_IMAGES: (productId: string) => `/products/${productId}/images/reorder`,
  
  // Product Variants
  GET_PRODUCT_VARIANTS: (productId: string) => `/products/${productId}/variants`,
  CREATE_PRODUCT_VARIANT: (productId: string) => `/products/${productId}/variants`,
  UPDATE_PRODUCT_VARIANT: (productId: string, variantId: string) => `/products/${productId}/variants/${variantId}`,
  DELETE_PRODUCT_VARIANT: (productId: string, variantId: string) => `/products/${productId}/variants/${variantId}`,
  
  // Product Inventory
  GET_PRODUCT_INVENTORY: (productId: string) => `/products/${productId}/inventory`,
  UPDATE_PRODUCT_INVENTORY: (productId: string) => `/products/${productId}/inventory`,
  
  // Product Categories
  GET_CATEGORIES: '/products/categories',
  GET_CATEGORY: (categoryId: string) => `/products/categories/${categoryId}`,
  GET_PRODUCTS_BY_CATEGORY: (categoryId: string) => `/products/categories/${categoryId}/products`,
  
  // Product Search & Filter
  SEARCH_PRODUCTS: '/products/search',
  FILTER_PRODUCTS: '/products/filter',
  
  // Product Reviews
  GET_PRODUCT_REVIEWS: (productId: string) => `/products/${productId}/reviews`,
  CREATE_PRODUCT_REVIEW: (productId: string) => `/products/${productId}/reviews`,
  
  // Featured & Trending
  GET_FEATURED_PRODUCTS: '/products/featured',
  GET_TRENDING_PRODUCTS: '/products/trending',
  GET_RECOMMENDED_PRODUCTS: '/products/recommended',
} as const;

// ============================================================================
// Cart & Checkout Endpoints
// ============================================================================

export const CART_ENDPOINTS = {
  // Cart Operations
  GET_CART: '/cart',
  ADD_TO_CART: '/cart/items',
  UPDATE_CART_ITEM: (itemId: string) => `/cart/items/${itemId}`,
  REMOVE_FROM_CART: (itemId: string) => `/cart/items/${itemId}`,
  CLEAR_CART: '/cart/clear',
  
  // Cart Summary
  GET_CART_SUMMARY: '/cart/summary',
  
  // Discount Codes
  APPLY_DISCOUNT: '/cart/discount',
  REMOVE_DISCOUNT: '/cart/discount',
  
  // Checkout
  INITIATE_CHECKOUT: '/checkout',
  VALIDATE_CHECKOUT: '/checkout/validate',
  COMPLETE_CHECKOUT: '/checkout/complete',
} as const;

// ============================================================================
// Notification Endpoints
// ============================================================================

export const NOTIFICATION_ENDPOINTS = {
  // Notifications
  GET_NOTIFICATIONS: '/notifications',
  GET_NOTIFICATION: (notificationId: string) => `/notifications/${notificationId}`,
  MARK_AS_READ: (notificationId: string) => `/notifications/${notificationId}/read`,
  MARK_ALL_AS_READ: '/notifications/read-all',
  DELETE_NOTIFICATION: (notificationId: string) => `/notifications/${notificationId}`,
  DELETE_ALL_NOTIFICATIONS: '/notifications/delete-all',
  
  // Notification Preferences
  GET_NOTIFICATION_PREFERENCES: '/notifications/preferences',
  UPDATE_NOTIFICATION_PREFERENCES: '/notifications/preferences',
  
  // Push Notifications
  REGISTER_DEVICE: '/notifications/devices',
  UNREGISTER_DEVICE: (deviceId: string) => `/notifications/devices/${deviceId}`,
  
  // Notification Statistics
  GET_UNREAD_COUNT: '/notifications/unread-count',
} as const;

// ============================================================================
// Trip Management Endpoints (Crowdshipping)
// ============================================================================

export const TRIP_ENDPOINTS = {
  // Trip CRUD
  GET_TRIPS: '/trips',
  GET_TRIP: (tripId: string) => `/trips/${tripId}`,
  CREATE_TRIP: '/trips',
  UPDATE_TRIP: (tripId: string) => `/trips/${tripId}`,
  CANCEL_TRIP: (tripId: string) => `/trips/${tripId}/cancel`,
  
  // Trip Status
  UPDATE_TRIP_STATUS: (tripId: string) => `/trips/${tripId}/status`,
  START_TRIP: (tripId: string) => `/trips/${tripId}/start`,
  COMPLETE_TRIP: (tripId: string) => `/trips/${tripId}/complete`,
  
  // Trip Matching
  SEARCH_MATCHING_TRIPS: '/trips/search-matches',
  GET_TRIP_MATCHES: (tripId: string) => `/trips/${tripId}/matches`,
  
  // Trip Deliveries
  GET_TRIP_DELIVERIES: (tripId: string) => `/trips/${tripId}/deliveries`,
  ADD_DELIVERY_TO_TRIP: (tripId: string) => `/trips/${tripId}/deliveries`,
  REMOVE_DELIVERY_FROM_TRIP: (tripId: string, deliveryId: string) => `/trips/${tripId}/deliveries/${deliveryId}`,
  
  // Trip Search
  SEARCH_TRIPS: '/trips/search',
  FILTER_TRIPS: '/trips/filter',
} as const;

// ============================================================================
// Chat & Messaging Endpoints
// ============================================================================

export const CHAT_ENDPOINTS = {
  // Conversations
  GET_CONVERSATIONS: '/chat/conversations',
  GET_CONVERSATION: (conversationId: string) => `/chat/conversations/${conversationId}`,
  CREATE_CONVERSATION: '/chat/conversations',
  DELETE_CONVERSATION: (conversationId: string) => `/chat/conversations/${conversationId}`,
  
  // Messages
  GET_MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
  SEND_MESSAGE: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
  DELETE_MESSAGE: (conversationId: string, messageId: string) => `/chat/conversations/${conversationId}/messages/${messageId}`,
  
  // Message Status
  MARK_AS_READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
  TYPING_INDICATOR: (conversationId: string) => `/chat/conversations/${conversationId}/typing`,
  
  // File Uploads
  UPLOAD_FILE: (conversationId: string) => `/chat/conversations/${conversationId}/files`,
  
  // Unread Count
  GET_UNREAD_COUNT: '/chat/unread-count',
} as const;

// ============================================================================
// Admin Endpoints
// ============================================================================

export const ADMIN_ENDPOINTS = {
  // Dashboard
  GET_DASHBOARD_STATS: '/admin/dashboard',
  
  // User Management
  GET_ALL_USERS: '/admin/users',
  SUSPEND_USER: (userId: string) => `/admin/users/${userId}/suspend`,
  ACTIVATE_USER: (userId: string) => `/admin/users/${userId}/activate`,
  BAN_USER: (userId: string) => `/admin/users/${userId}/ban`,
  
  // Order Management
  GET_ALL_ORDERS: '/admin/orders',
  FORCE_CANCEL_ORDER: (orderId: string) => `/admin/orders/${orderId}/force-cancel`,
  
  // Payment Management
  GET_ALL_PAYMENTS: '/admin/payments',
  PROCESS_REFUND: (paymentId: string) => `/admin/payments/${paymentId}/refund`,
  
  // KYC Verification
  GET_PENDING_KYC: '/admin/kyc/pending',
  APPROVE_KYC: (userId: string) => `/admin/kyc/${userId}/approve`,
  REJECT_KYC: (userId: string) => `/admin/kyc/${userId}/reject`,
  
  // Reports
  GENERATE_REPORT: '/admin/reports/generate',
  GET_REPORTS: '/admin/reports',
  DOWNLOAD_REPORT: (reportId: string) => `/admin/reports/${reportId}/download`,
  
  // System Settings
  GET_SETTINGS: '/admin/settings',
  UPDATE_SETTINGS: '/admin/settings',
} as const;

// ============================================================================
// File Upload Endpoints
// ============================================================================

export const FILE_ENDPOINTS = {
  UPLOAD_FILE: '/files/upload',
  UPLOAD_IMAGE: '/files/upload/image',
  UPLOAD_DOCUMENT: '/files/upload/document',
  GET_FILE: (fileId: string) => `/files/${fileId}`,
  DELETE_FILE: (fileId: string) => `/files/${fileId}`,
  GET_UPLOAD_URL: '/files/upload-url',
} as const;

// ============================================================================
// Analytics Endpoints
// ============================================================================

export const ANALYTICS_ENDPOINTS = {
  GET_USER_ANALYTICS: '/analytics/users',
  GET_ORDER_ANALYTICS: '/analytics/orders',
  GET_PAYMENT_ANALYTICS: '/analytics/payments',
  GET_DELIVERY_ANALYTICS: '/analytics/deliveries',
  GET_PRODUCT_ANALYTICS: '/analytics/products',
  GET_REVENUE_ANALYTICS: '/analytics/revenue',
  GET_CUSTOM_REPORT: '/analytics/custom',
} as const;

// ============================================================================
// Health & Status Endpoints
// ============================================================================

export const HEALTH_ENDPOINTS = {
  HEALTH_CHECK: '/health',
  READY_CHECK: '/ready',
  LIVE_CHECK: '/live',
  VERSION: '/version',
  STATUS: '/status',
} as const;

// ============================================================================
// Export All Endpoints
// ============================================================================

export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  ORDER: ORDER_ENDPOINTS,
  PAYMENT: PAYMENT_ENDPOINTS,
  DELIVERY: DELIVERY_ENDPOINTS,
  PRODUCT: PRODUCT_ENDPOINTS,
  CART: CART_ENDPOINTS,
  NOTIFICATION: NOTIFICATION_ENDPOINTS,
  TRIP: TRIP_ENDPOINTS,
  CHAT: CHAT_ENDPOINTS,
  ADMIN: ADMIN_ENDPOINTS,
  FILE: FILE_ENDPOINTS,
  ANALYTICS: ANALYTICS_ENDPOINTS,
  HEALTH: HEALTH_ENDPOINTS,
} as const;

// Default export
export default API_ENDPOINTS;
