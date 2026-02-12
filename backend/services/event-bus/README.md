# 📡 Event Taxonomy Extension - Comprehensive Documentation

## 🎯 Overview

The Event Taxonomy Extension provides a comprehensive, scalable event system for the MNBara platform, supporting plugins, live streaming, eBay integration, and all new platform features. This system enables real-time event processing, analytics, monitoring, and integration across all services.

## 📋 Table of Contents

1. [Event Categories](#event-categories)
2. [Event Types](#event-types)
3. [Event Routing](#event-routing)
4. [Event Validation](#event-validation)
5. [Event Retention](#event-retention)
6. [Event Analytics](#event-analytics)
7. [API Reference](#api-reference)
8. [Integration Guide](#integration-guide)
9. [Configuration](#configuration)
10. [Monitoring & Alerting](#monitoring--alerting)

## 🏷️ Event Categories

### Core Platform Events
- **USER**: User lifecycle, authentication, preferences
- **WALLET**: Wallet operations, transactions, compliance
- **TRANSACTION**: Payment processing, settlements, fees
- **AUTH**: Authentication, authorization, security
- **SYSTEM**: System health, maintenance, configuration

### Plugin System Events
- **PLUGIN**: Plugin lifecycle, execution, configuration
- **PLUGIN_INSTALLATION**: Installation, updates, removal
- **PLUGIN_EXECUTION**: Runtime execution, errors, performance
- **PLUGIN_MARKETPLACE**: Publishing, discovery, ratings

### Live Streaming Events
- **STREAM**: Stream lifecycle, quality, protocols
- **STREAM_CHAT**: Chat messages, moderation, reactions
- **STREAM_AUCTION**: Live auctions, bidding, sales
- **STREAM_ANALYTICS**: Viewer metrics, engagement

### Integration Events
- **INTEGRATION**: Third-party integrations, webhooks
- **WEBHOOK**: Outbound webhook delivery, responses
- **API**: API requests, responses, errors

### Monitoring Events
- **MONITORING**: Health checks, performance metrics
- **PERFORMANCE**: Response times, resource usage
- **ERROR**: System errors, exceptions, failures
- **SECURITY**: Security events, threats, compliance

## 🔖 Event Types

### User Events
```typescript
// Authentication
user.registered
user.login
user.logout
user.password_changed
user.mfa_enabled

// Profile Management
user.profile_updated
user.preferences_updated
user.email_verified

// KYC/AML
user.kyc_submitted
user.kyc_approved
user.kyc_rejected
```

### Wallet Events
```typescript
// Wallet Lifecycle
wallet.created
wallet.activated
wallet.locked
wallet.unlocked

// Transactions
wallet.deposit_completed
wallet.withdrawal_completed
wallet.transfer_completed
wallet.settlement_completed

// Compliance
wallet.compliance_check_passed
wallet.compliance_check_failed
wallet.limit_exceeded
```

### Plugin Events
```typescript
// Plugin Lifecycle
plugin.created
plugin.activated
plugin.deactivated
plugin.deleted

// Installation
plugin.installation_started
plugin.installation_completed
plugin.installation_failed

// Execution
plugin.execution_started
plugin.execution_completed
plugin.execution_failed
plugin.sandbox_violation
```

### Stream Events
```typescript
// Stream Lifecycle
stream.created
stream.started
stream.ended
stream.cancelled

// Quality & Performance
stream.quality_changed
stream.bitrate_adjusted
stream.connection_lost
stream.reconnected

// Analytics
stream.viewer_joined
stream.viewer_left
stream.viewer_count_updated
```

## 🔄 Event Routing

### Routing Rules
Events are automatically routed based on:
- **Event Type**: Specific event name
- **Category**: Event category
- **Priority**: Event priority level
- **Metadata**: Event payload filters
- **User Context**: User-specific routing

### Default Destinations
```typescript
// User events
user.login → ['user-events', 'analytics', 'security-monitoring']

// Wallet events  
wallet.deposit_completed → ['wallet-events', 'analytics', 'compliance']

// Plugin events
plugin.execution_failed → ['plugin-events', 'error-tracking', 'developer-notifications']

// Stream events
stream.started → ['stream-events', 'analytics', 'live-notifications']
```

### Custom Routing
```bash
# Add custom routing rule
curl -X POST https://api.mnbara.com/api/events/routing-rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "custom.event",
    "category": "custom",
    "destinations": ["webhook-url", "analytics", "notifications"],
    "filters": {
      "priority": ["high", "critical"],
      "metadata": { "amount": { "$gte": 1000 } }
    }
  }'
```

## ✅ Event Validation

### Validation Rules
Events are validated against JSON Schema:

```typescript
// Example validation for wallet deposit
{
  eventType: 'wallet.deposit_completed',
  requiredFields: ['walletId', 'amount', 'currency', 'timestamp'],
  metadataSchema: {
    type: 'object',
    properties: {
      walletId: { type: 'string' },
      amount: { type: 'number', minimum: 0.01 },
      currency: { type: 'string', pattern: '^[A-Z]{3}$' },
      referenceId: { type: 'string' },
      fees: {
        type: 'object',
        properties: {
          platform: { type: 'number' },
          processing: { type: 'number' }
        }
      }
    },
    required: ['walletId', 'amount', 'currency']
  }
}
```

### Validation Failures
- **Missing Required Fields**: Event rejected
- **Invalid Data Types**: Event rejected  
- **Schema Violations**: Event rejected
- **Size Limits**: Event rejected if > 10MB

## 📦 Event Retention

### Retention Policies
Events are retained based on category and priority:

| Category | Priority | Retention | Archive | Compress |
|----------|----------|-----------|---------|----------|
| USER | LOW | 90 days | 30 days | 7 days |
| USER | MEDIUM | 365 days | 90 days | 30 days |
| USER | HIGH | 3 years | 365 days | 90 days |
| USER | CRITICAL | 7 years | 3 years | 365 days |
| WALLET | ANY | 7 years | 3 years | 365 days |
| PLUGIN | LOW | 90 days | 30 days | 7 days |
| PLUGIN | MEDIUM | 365 days | 90 days | 30 days |
| STREAM | LOW | 30 days | 7 days | 1 day |
| STREAM | MEDIUM | 90 days | 30 days | 7 days |

### Storage Tiers
- **HOT**: Recent events (fast access)
- **WARM**: Older events (standard access)
- **COLD**: Archived events (slow access)
- **GLACIER**: Long-term backup (very slow access)

## 📊 Event Analytics

### Real-time Analytics
- **Event Counts**: By type, category, time window
- **Event Rates**: Events per second/minute/hour
- **User Activity**: Unique users, sessions, engagement
- **Error Rates**: Failed events, validation errors

### Time-series Data
```bash
# Get event statistics
curl -X GET "https://api.mnbara.com/api/events/stats?category=wallet&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
{
  "totalEvents": 15000,
  "eventsByType": {
    "wallet.deposit_completed": 5000,
    "wallet.withdrawal_completed": 3000,
    "wallet.transfer_completed": 2000
  },
  "eventsByPriority": {
    "low": 8000,
    "medium": 5000,
    "high": 1500,
    "critical": 500
  }
}
```

### Custom Analytics
```typescript
// Configure custom analytics
eventBus.configureAnalytics({
  eventType: 'custom.event',
  metrics: {
    count: true,
    rate: true,
    duration: true,
    errorRate: true
  },
  dimensions: ['userId', 'category', 'source'],
  timeWindows: ['1m', '5m', '15m', '1h'],
  alerts: [
    { threshold: 100, window: '1m', comparison: 'greater_than' }
  ]
});
```

## 🔌 API Reference

### Publish Event
```bash
POST /api/events/publish
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "type": "user.login",
  "category": "user",
  "userId": "user123",
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "loginMethod": "password"
  },
  "tags": ["authentication", "web"],
  "priority": "medium"
}
```

### Batch Publish
```bash
POST /api/events/publish/batch
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "events": [
    {
      "type": "wallet.deposit_completed",
      "category": "wallet",
      "metadata": { "amount": 100, "currency": "USD" }
    },
    {
      "type": "plugin.installed",
      "category": "plugin",
      "metadata": { "pluginId": "plugin123" }
    }
  ]
}
```

### Subscribe to Events
```bash
POST /api/events/subscribe
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "eventTypes": ["wallet.deposit_completed", "wallet.withdrawal_completed"],
  "webhookUrl": "https://your-app.com/webhook",
  "filter": {
    "priority": ["high", "critical"],
    "metadata": { "amount": { "$gte": 1000 } }
  }
}
```

### Replay Events
```bash
POST /api/events/replay
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-31T23:59:59Z",
  "eventTypes": ["user.login"],
  "categories": ["user"],
  "handler": {
    "webhookUrl": "https://your-app.com/replay-handler"
  }
}
```

## 🔗 Integration Guide

### Node.js Integration
```typescript
import { EnhancedEventBus } from '@mnbara/event-bus';

const eventBus = new EnhancedEventBus({
  redis: {
    host: 'localhost',
    port: 6379
  },
  logger: winstonLogger
});

// Publish event
await eventBus.publish({
  type: 'user.login',
  category: EventCategory.USER,
  userId: user.id,
  metadata: {
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  }
});

// Subscribe to events
const subscriptionId = await eventBus.subscribe(
  ['wallet.deposit_completed'],
  async (event, metadata) => {
    // Handle wallet deposit
    console.log(`Deposit completed: ${event.metadata.amount} ${event.metadata.currency}`);
  }
);
```

### Webhook Integration
```bash
# Your webhook endpoint will receive:
POST https://your-app.com/webhook
Content-Type: application/json
X-Event-Id: evt_1234567890
X-Event-Type: wallet.deposit_completed
X-Event-Category: wallet
X-Event-Priority: medium

{
  "event": {
    "id": "evt_1234567890",
    "type": "wallet.deposit_completed",
    "category": "wallet",
    "timestamp": "2024-01-01T00:00:00Z",
    "userId": "user123",
    "metadata": {
      "walletId": "wallet123",
      "amount": 100,
      "currency": "USD"
    }
  },
  "metadata": {
    "eventId": "evt_1234567890",
    "timestamp": "2024-01-01T00:00:00Z",
    "priority": "medium"
  }
}
```

### Plugin Integration
```typescript
// In your plugin
import { PluginContext } from '@mnbara/plugin-sdk';

export default class MyPlugin {
  constructor(private context: PluginContext) {}

  async onUserLogin(userId: string, metadata: any) {
    // Emit custom event
    await this.context.events.emit('plugin.user_login_tracked', {
      userId,
      pluginId: this.context.pluginId,
      loginTime: new Date()
    });
  }
}
```

## ⚙️ Configuration

### Environment Variables
```bash
# Core Configuration
NODE_ENV=production
PORT=3017
DATABASE_URL=postgresql://user:pass@host:5435/event_bus_db
REDIS_URL=redis://localhost:6382

# Event Processing
EVENT_BATCH_SIZE=100
EVENT_FLUSH_INTERVAL=5000
EVENT_MAX_RETRIES=3

# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_AGGREGATION_INTERVAL=60000
ANALYTICS_ALERT_CHECK_INTERVAL=300000

# Security
EVENT_RATE_LIMIT_MAX=1000
EVENT_RATE_LIMIT_WINDOW=60000
EVENT_ENCRYPTION_ENABLED=false
```

### Service Configuration
```typescript
const config = {
  routingRules: defaultEventRoutingRules,
  validationRules: defaultEventValidationRules,
  retentionPolicies: defaultEventRetentionPolicies,
  
  processing: {
    batchSize: 100,
    flushInterval: 5000,
    maxRetries: 3,
    maxConcurrency: 10
  },
  
  storage: {
    redis: { host: 'localhost', port: 6379, db: 0 },
    timeseries: { enabled: true, retentionDays: 365 },
    archive: { enabled: true, storageType: 'local' }
  },
  
  analytics: {
    enabled: true,
    realTimeProcessing: true,
    integrations: {
      googleAnalytics: { enabled: false },
      mixpanel: { enabled: false },
      amplitude: { enabled: false }
    }
  }
};
```

## 📈 Monitoring & Alerting

### Health Checks
```bash
# Service health
curl http://localhost:3017/health

# Event statistics
curl http://localhost:3017/api/events/stats

# Configuration
curl http://localhost:3017/api/events/config
```

### Metrics
- **Event Throughput**: Events per second
- **Processing Latency**: Time to process events
- **Error Rates**: Failed events percentage
- **Queue Sizes**: Pending events count
- **Storage Usage**: Database and Redis usage

### Alerts
```bash
# Configure alerts
curl -X POST https://api.mnbara.com/api/events/alerts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Error Rate",
    "eventType": "monitoring.unhandled_exception",
    "conditionType": "RATE_THRESHOLD",
    "thresholdValue": 10,
    "timeWindow": "5m",
    "comparison": "greater_than",
    "actions": ["email", "slack"],
    "recipients": ["admin@mnbara.com"]
  }'
```

## 🔧 Troubleshooting

### Common Issues

#### Event Publishing Failures
```bash
# Check validation errors
curl -X POST /api/events/publish ...
# Response: {"success": false, "error": "Validation failed", "details": [...]}

# Solution: Fix validation errors in event payload
```

#### High Processing Latency
- Check Redis connection health
- Verify event batch sizes
- Monitor queue depths
- Scale processing workers

#### Storage Issues
- Check database connection limits
- Verify retention policies
- Monitor disk usage
- Archive old events

### Debug Commands
```bash
# Check service logs
docker logs event-bus-service

# Check Redis connectivity
docker exec event-bus-redis redis-cli ping

# Validate configuration
curl http://localhost:3017/api/events/config
```

## 📚 Best Practices

### Event Design
1. **Use Descriptive Names**: `user.login` not `login`
2. **Include Timestamps**: Always include event timestamps
3. **Add Context**: Include user ID, session ID, IP address
4. **Keep It Small**: Events should be < 10KB
5. **Use Categories**: Group related events

### Performance
1. **Batch Operations**: Use batch APIs when possible
2. **Filter Early**: Apply filters before processing
3. **Compress Data**: Enable compression for large events
4. **Monitor Queues**: Watch queue sizes and processing times
5. **Scale Horizontally**: Add more processing workers

### Security
1. **Validate Input**: Always validate event data
2. **Sanitize Data**: Remove sensitive information
3. **Use Encryption**: Enable encryption for sensitive events
4. **Rate Limit**: Implement rate limiting
5. **Audit Logs**: Keep audit trails

## 🚀 Deployment

### Docker Deployment
```bash
# Build and deploy
docker-compose up -d

# Scale processing workers
docker-compose up -d --scale event-bus-service=3
```

### Kubernetes Deployment
```bash
# Apply manifests
kubectl apply -f k8s-event-bus.yaml

# Scale horizontally
kubectl scale deployment event-bus-service --replicas=5
```

### Migration from Old System
```bash
# Run migration
npm run migrate:events

# Validate migration
npm run validate:events
```

---

**Service Status**: ✅ Production Ready  
**API Version**: v1.0.0  
**Last Updated**: January 2024  
**Support**: events@mnbara.com