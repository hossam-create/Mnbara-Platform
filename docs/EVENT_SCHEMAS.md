# Event Schemas (Avro)

Event schemas for Mnbara Platform event-driven architecture.

---

## Product Events

### ProductCreated
```json
{
  "type": "record",
  "name": "ProductCreated",
  "namespace": "com.mnbara.product",
  "fields": [
    {"name": "productId", "type": "string"},
    {"name": "sellerId", "type": "string"},
    {"name": "categoryId", "type": "string"},
    {"name": "title", "type": "string"},
    {"name": "price", "type": "double"},
    {"name": "originCountry", "type": ["null", "string"]},
    {"name": "purchaseCountry", "type": ["null", "string"]},
    {"name": "deliveryCountry", "type": ["null", "string"]},
    {"name": "createdAt", "type": "long"}
  ]
}
```

### ProductUpdated
```json
{
  "type": "record",
  "name": "ProductUpdated",
  "namespace": "com.mnbara.product",
  "fields": [
    {"name": "productId", "type": "string"},
    {"name": "sellerId", "type": "string"},
    {"name": "changes", "type": {
      "type": "map",
      "values": "string"
    }},
    {"name": "updatedAt", "type": "long"}
  ]
}
```

### ProductPublished
```json
{
  "type": "record",
  "name": "ProductPublished",
  "namespace": "com.mnbara.product",
  "fields": [
    {"name": "productId", "type": "string"},
    {"name": "sellerId", "type": "string"},
    {"name": "categoryId", "type": "string"},
    {"name": "publishedAt", "type": "long"}
  ]
}
```

---

## Order Events

### OrderCreated
```json
{
  "type": "record",
  "name": "OrderCreated",
  "namespace": "com.mnbara.order",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "buyerId", "type": "string"},
    {"name": "productId", "type": "string"},
    {"name": "quantity", "type": "int"},
    {"name": "totalAmount", "type": "double"},
    {"name": "currency", "type": "string"},
    {"name": "createdAt", "type": "long"}
  ]
}
```

### OrderCompleted
```json
{
  "type": "record",
  "name": "OrderCompleted",
  "namespace": "com.mnbara.order",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "buyerId", "type": "string"},
    {"name": "sellerId", "type": "string"},
    {"name": "travelerId", "type": ["null", "string"]},
    {"name": "totalAmount", "type": "double"},
    {"name": "platformFee", "type": "double"},
    {"name": "sellerPayout", "type": "double"},
    {"name": "travelerPayout", "type": ["null", "double"]},
    {"name": "completedAt", "type": "long"}
  ]
}
```

### OrderCancelled
```json
{
  "type": "record",
  "name": "OrderCancelled",
  "namespace": "com.mnbara.order",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "buyerId", "type": "string"},
    {"name": "reason", "type": "string"},
    {"name": "cancelledAt", "type": "long"}
  ]
}
```

---

## Payment Events

### PaymentInitiated
```json
{
  "type": "record",
  "name": "PaymentInitiated",
  "namespace": "com.mnbara.payment",
  "fields": [
    {"name": "paymentId", "type": "string"},
    {"name": "orderId", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "currency", "type": "string"},
    {"name": "paymentMethod", "type": "string"},
    {"name": "initiatedAt", "type": "long"}
  ]
}
```

### PaymentCompleted
```json
{
  "type": "record",
  "name": "PaymentCompleted",
  "namespace": "com.mnbara.payment",
  "fields": [
    {"name": "paymentId", "type": "string"},
    {"name": "orderId", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "currency", "type": "string"},
    {"name": "stripePaymentIntentId", "type": "string"},
    {"name": "completedAt", "type": "long"}
  ]
}
```

### PaymentFailed
```json
{
  "type": "record",
  "name": "PaymentFailed",
  "namespace": "com.mnbara.payment",
  "fields": [
    {"name": "paymentId", "type": "string"},
    {"name": "orderId", "type": "string"},
    {"name": "error", "type": "string"},
    {"name": "failedAt", "type": "long"}
  ]
}
```

---

## Escrow Events

### EscrowCreated
```json
{
  "type": "record",
  "name": "EscrowCreated",
  "namespace": "com.mnbara.escrow",
  "fields": [
    {"name": "escrowId", "type": "string"},
    {"name": "orderId", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "currency", "type": "string"},
    {"name": "status", "type": "string"},
    {"name": "createdAt", "type": "long"}
  ]
}
```

### EscrowReleased
```json
{
  "type": "record",
  "name": "EscrowReleased",
  "namespace": "com.mnbara.escrow",
  "fields": [
    {"name": "escrowId", "type": "string"},
    {"name": "orderId", "type": "string"},
    {"name": "sellerPayout", "type": "double"},
    {"name": "travelerPayout", "type": ["null", "double"]},
    {"name": "releasedAt", "type": "long"}
  ]
}
```

### EscrowRefunded
```json
{
  "type": "record",
  "name": "EscrowRefunded",
  "namespace": "com.mnbara.escrow",
  "fields": [
    {"name": "escrowId", "type": "string"},
    {"name": "orderId", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "reason", "type": "string"},
    {"name": "refundedAt", "type": "long"}
  ]
}
```

---

## Matching Events

### MatchCreated
```json
{
  "type": "record",
  "name": "MatchCreated",
  "namespace": "com.mnbara.matching",
  "fields": [
    {"name": "matchId", "type": "string"},
    {"name": "orderId", "type": "string"},
    {"name": "tripId", "type": "string"},
    {"name": "score", "type": "float"},
    {"name": "productOriginCountry", "type": ["null", "string"]},
    {"name": "productPurchaseCountry", "type": ["null", "string"]},
    {"name": "productDeliveryCountry", "type": ["null", "string"]},
    {"name": "tripOriginCountry", "type": ["null", "string"]},
    {"name": "tripDestinationCountry", "type": ["null", "string"]},
    {"name": "countryMatchValid", "type": "boolean"},
    {"name": "createdAt", "type": "long"}
  ]
}
```

### MatchAccepted
```json
{
  "type": "record",
  "name": "MatchAccepted",
  "namespace": "com.mnbara.matching",
  "fields": [
    {"name": "matchId", "type": "string"},
    {"name": "travelerId", "type": "string"},
    {"name": "acceptedAt", "type": "long"}
  ]
}
```

---

## Notification Events

### NotificationSent
```json
{
  "type": "record",
  "name": "NotificationSent",
  "namespace": "com.mnbara.notification",
  "fields": [
    {"name": "notificationId", "type": "string"},
    {"name": "userId", "type": "string"},
    {"name": "type", "type": "string"},
    {"name": "title", "type": "string"},
    {"name": "message", "type": "string"},
    {"name": "data", "type": ["null", {
      "type": "map",
      "values": "string"
    }]},
    {"name": "sentAt", "type": "long"}
  ]
}
```

---

## Usage

### Producer Example (Node.js)
```javascript
const { Producer } = require('kafkajs');

const producer = new Producer({
  'brokers': ['localhost:9092'],
});

const event = {
  type: 'ProductCreated',
  productId: 'prod_123',
  sellerId: 'seller_456',
  categoryId: 'cat_789',
  title: 'iPhone 15 Pro',
  price: 999.99,
  originCountry: 'US',
  purchaseCountry: 'US',
  deliveryCountry: 'UK',
  createdAt: Date.now()
};

await producer.send({
  topic: 'products',
  messages: [{ value: Buffer.from(JSON.stringify(event)) }]
});
```

### Consumer Example (Node.js)
```javascript
const { Consumer } = require('kafkajs');

const consumer = new Consumer({
  'groupId': 'order-service',
  'brokers': ['localhost:9092'],
});

await consumer.subscribe({ topic: 'products', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());
    console.log('Received event:', event);
    // Process event
  }
});
```

---

**Status**: ✅ Event Schemas Created
**Next**: Set up dead letter queues
