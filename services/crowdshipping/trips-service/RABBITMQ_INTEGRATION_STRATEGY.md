# Trips Service RabbitMQ Integration Strategy

**Date:** February 18, 2026
**Status:** DOCUMENTED - DEFERRED TO POST-MVP

---

## Current State

The trips-service has a stub implementation for RabbitMQ publishing:

```typescript
private async publishLocationEvent(location: LocationUpdate) {
  // TODO: Implement actual RabbitMQ publish
  console.log('[RabbitMQ] Location updated:', location);
  
  // This will trigger:
  // 1. Recommendation service to check nearby requests
  // 2. Matching service to find suitable orders
  // 3. Notification service to alert about opportunities
}
```

---

## Integration Options

### Option 1: Direct RabbitMQ Integration (RECOMMENDED FOR PRODUCTION)

```typescript
import amqp from 'amqplib';

private async publishLocationEvent(location: LocationUpdate) {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    const exchange = 'traveler.location';
    await channel.assertExchange(exchange, 'fanout', { durable: true });
    
    const message = JSON.stringify({
      event: 'location.updated',
      data: location,
      timestamp: new Date().toISOString()
    });
    
    channel.publish(exchange, '', Buffer.from(message));
    
    await channel.close();
    await connection.close();
    
    logger.info('Location event published', { travelerId: location.travelerId });
  } catch (error) {
    logger.error('Failed to publish location event', error);
    // Don't throw - location update should succeed even if event fails
  }
}
```

### Option 2: Event Bus Abstraction

```typescript
import { EventBus } from '../lib/event-bus';

private async publishLocationEvent(location: LocationUpdate) {
  await this.eventBus.publish('traveler.location.updated', location);
}
```

### Option 3: HTTP Webhooks (Fallback)

```typescript
private async publishLocationEvent(location: LocationUpdate) {
  const services = [
    process.env.RECOMMENDATION_SERVICE_URL,
    process.env.MATCHING_SERVICE_URL,
    process.env.NOTIFICATION_SERVICE_URL
  ];
  
  await Promise.allSettled(
    services.map(url => 
      axios.post(`${url}/webhooks/location-updated`, location)
    )
  );
}
```

---

## MVP Strategy: POLLING-BASED MATCHING

For MVP launch, instead of real-time events:

1. **Matching service polls** traveler locations periodically
2. **Recommendation service** queries on-demand when needed
3. **Notification service** checks for opportunities on schedule

### Why This Works for MVP:

- No RabbitMQ infrastructure required
- Simpler deployment and debugging
- Sufficient for initial user base
- Can be upgraded to event-driven later

### Current Flow:

```
1. Traveler updates location
   → trips-service saves to database
   → console.log for debugging

2. Matching service (every 5 minutes):
   → Queries all active travelers
   → Checks for nearby delivery requests
   → Creates matches

3. Notification service (every 10 minutes):
   → Queries new matches
   → Sends notifications to travelers

4. Recommendation service (on-demand):
   → When user opens app
   → Queries nearby opportunities
   → Returns recommendations
```

---

## Post-MVP Integration Plan

### Phase 1: RabbitMQ Setup (Q2 2026)
- Set up RabbitMQ cluster
- Implement connection pooling
- Add retry logic and dead letter queues
- Implement proper error handling

### Phase 2: Event-Driven Architecture (Q2 2026)
- Migrate to real-time event publishing
- Implement event consumers in matching-service
- Implement event consumers in recommendation-service
- Implement event consumers in notification-service

### Phase 3: Advanced Features (Q3 2026)
- Event sourcing for location history
- Real-time geofencing alerts
- Predictive matching based on travel patterns
- WebSocket push for instant notifications

---

## Decision: DEFER TO POST-MVP

**Rationale:**
- Polling-based approach is sufficient for MVP user base
- Avoids RabbitMQ infrastructure complexity
- Easier to debug and monitor
- Can be upgraded without user-facing changes

**Action Items:**
- ✅ Document current strategy
- ✅ Keep stub implementation with clear TODO
- ✅ Implement polling in matching-service
- ✅ Add RabbitMQ integration to post-MVP roadmap
- ✅ Update audit report to reflect this decision

---

## For Developers

**Current Implementation:**
- Location updates save to database only
- Matching happens via periodic polling
- No real-time event propagation

**Do NOT:**
- Try to implement RabbitMQ without proper infrastructure
- Block location updates on event publishing
- Assume real-time event delivery

**Do:**
- Save location updates to database reliably
- Log location changes for debugging
- Design services to work with polling
- Plan for eventual event-driven upgrade

---

## Polling Configuration

**Matching Service:**
```typescript
// Poll every 5 minutes for new matches
setInterval(async () => {
  const travelers = await getTravelersWithRecentLocationUpdates();
  const requests = await getActiveDeliveryRequests();
  await findMatches(travelers, requests);
}, 5 * 60 * 1000);
```

**Recommendation Service:**
```typescript
// On-demand queries when user opens app
async getRecommendations(travelerId: string) {
  const location = await getLatestLocation(travelerId);
  const nearby = await findNearbyRequests(location);
  return nearby;
}
```

---

## Conclusion

The stub implementation is INTENTIONAL for MVP. The trips-service saves location updates to the database, and other services poll for changes. This polling-based approach is sufficient for MVP and will be upgraded to event-driven architecture post-launch when RabbitMQ infrastructure is in place.
