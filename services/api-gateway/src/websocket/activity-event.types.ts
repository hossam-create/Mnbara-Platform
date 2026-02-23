/**
 * Activity Event Types
 * 
 * Defines the standard event payload for real-time activity streaming.
 */

export type ActivityDomain = 'wallet' | 'traveler' | 'marketplace';

export type ActivityStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * Standardized activity event payload for Kafka and WebSocket
 */
export interface ActivityEventPayload {
  eventId: string;
  userId: string;
  domain: ActivityDomain;
  title: string;
  description: string;
  timestamp: string; // ISO 8601
  amount?: number;
  currency?: string;
  status?: ActivityStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Kafka message header for context propagation
 */
export interface MessageHeader {
  key: string;
  value: string;
}

/**
 * Kafka message wrapper for activity events
 */
export interface ActivityKafkaMessage {
  key: string; // userId for partition routing
  value: ActivityEventPayload;
  headers?: MessageHeader[];
}

/**
 * WebSocket event types
 */
export type WebSocketEventType = 
  | 'activity:new'
  | 'activity:updated'
  | 'activity:deleted'
  | 'connection:established'
  | 'connection:error'
  | 'heartbeat';

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
  requestId?: string;
}

/**
 * Activity WebSocket event
 */
export interface ActivityWebSocketEvent {
  type: 'activity:new';
  payload: ActivityEventPayload;
  timestamp: string;
}

/**
 * WebSocket client metadata
 */
export interface WebSocketClientMetadata {
  userId: string;
  socketId: string;
  connectedAt: string;
  lastHeartbeat: string;
  ip: string;
  userAgent?: string;
}

/**
 * Connection query params
 */
export interface WebSocketQueryParams {
  token: string;
  deviceId?: string;
}

/**
 * Heartbeat message
 */
export interface HeartbeatMessage {
  type: 'heartbeat';
  timestamp: string;
}
