/**
 * Kafka Activity Events - Topic Configuration
 * 
 * This file defines the Kafka topic schema for future event-driven
 * activity aggregation. Not implemented yet, but prepared for migration.
 * 
 * Topic: activity-events
 * Partitions: 10 (scalable per domain)
 * Replication Factor: 3 (production)
 */

export const ACTIVITY_TOPIC_CONFIG = {
  topic: 'activity-events',
  partitions: 10,
  replicationFactor: 3,
  configEntries: [
    { name: 'cleanup.policy', value: 'delete' },
    { name: 'retention.ms', value: '604800000' }, // 7 days
    { name: 'min.insync.replicas', value: '2' },
  ],
};

// Partition assignment by domain for consistent ordering
export const DOMAIN_PARTITIONS = {
  wallet: [0, 1, 2],
  traveler: [3, 4, 5],
  marketplace: [6, 7, 8],
  system: [9],
};

// Message key structure: {domain}:{userId}:{timestamp}
export const generateMessageKey = (
  domain: string,
  userId: string,
  timestamp: string
): string => `${domain}:${userId}:${timestamp}`;

// Example producer configuration (for future implementation)
export const PRODUCER_CONFIG = {
  clientId: 'activity-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  ssl: process.env.NODE_ENV === 'production',
  sasl: process.env.KAFKA_SASL_USERNAME
    ? {
        mechanism: 'scram-sha-256',
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD,
      }
    : undefined,
  retry: {
    initialRetryTime: 100,
    retries: 3,
  },
};

// Consumer group configuration
export const CONSUMER_CONFIG = {
  groupId: 'activity-aggregation-consumer',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576, // 1MB
  maxBytes: 5242880, // 5MB
};

// Event types by domain
export const EVENT_TYPES = {
  wallet: [
    'deposit',
    'withdrawal',
    'transfer',
    'escrow_hold',
    'escrow_release',
    'refund',
    'fee',
  ],
  traveler: [
    'route_created',
    'route_updated',
    'route_cancelled',
    'offer_accepted',
    'offer_rejected',
    'delivery_completed',
    'review_received',
  ],
  marketplace: [
    'order_placed',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'review_submitted',
    'product_listed',
    'product_sold',
  ],
};
