# Dead Letter Queues Setup

Configuration for RabbitMQ dead letter exchanges and queues for failed message handling.

---

## Overview

Dead letter queues (DLQ) capture messages that cannot be processed successfully. Each service has its own DLQ for failed events.

---

## RabbitMQ DLQ Configuration

### Product Service DLQ

**Exchange**: `mnbarh.product.dlx`
**Queue**: `mnbarh.product.dlq`
**Routing Key**: `product.*`

```bash
# Create DLQ exchange
rabbitmqctl add_exchange mnbarh.product.dlx direct

# Create DLQ queue
rabbitmqctl add_queue mnbarh.product.dlx

# Bind queue to exchange
rabbitmqctl set_policy -h -p "^product.*$" product-dlx-policy \
  '{"dead-letter-exchange":"mnbarh.product.dlx","dead-letter-routing-key":"product.*"}'

# Bind queue to exchange
rabbitmqctl bind_queue mnbarh.product.dlx mnbarh.product.dlx product.*
```

### Order Service DLQ

**Exchange**: `mnbarh.order.dlx`
**Queue**: `mnbarh.order.dlq`
**Routing Key**: `order.*`

```bash
rabbitmqctl add_exchange mnbarh.order.dlx direct
rabbitmq add_queue mnbarh.order.dlx
rabbitmqctl set_policy -h -p "^order.*$" order-dlx-policy \
  '{"dead-letter-exchange":"mnbarh.order.dlx","dead-letter-routing-key":"order.*"}'
rabbitmqctl bind_queue mnbarh.order.dlx mnbarh.order.dlx order.*
```

### Payment Service DLQ

**Exchange**: `mnbarh.payment.dlx`
**Queue**: `mnbarh.payment.dlq`
**Routing Key**: `payment.*`

```bash
rabbitmqctl add_exchange mnbarh.payment.dlx direct
rabbitmqctl add_queue mnbarh.payment.dlx
rabbitmqctl set_policy -h -p "^payment.*$" payment-dlx-policy \
  '{"dead-letter-exchange":"mnbarh.payment.dlx","dead-letter-routing-key":"payment.*"}'
rabbitmq bind_queue mnbarh.payment.dlx mnbarh.payment.dlx payment.*
```

### Escrow Service DLQ

**Exchange**: `mnbarh.escrow.dlx`
**Queue**: `mnbarh.escrow.dlq`
**Routing Key**: `escrow.*`

```bash
rabbitmqctl add_exchange mnbarh.escrow.dlx direct
rabbitmq add_queue mnbarh.escrow.dlq
rabbitmqctl set_policy -h -p "^escrow.*$" escrow-dlx-policy \
  '{"dead-letter-exchange":"mnbarh.escrow.dlx","dead-letter-routing-key":"escrow.*"}'
rabbitmq bind_queue mnbarh.escrow.dlx mnbarh.escrow.dlx escrow.*
```

### Matching Service DLQ

**Exchange**: `mnbarh.matching.dlx`
**Queue**: `mnbarh.matching.dlq`
**Routing Key**: `matching.*`

```bash
rabbitmqctl add_exchange mnbarh.matching.dlx direct
rabbitmq add_queue mnbarh.matching.dlq
rabbitmqctl set_policy -h -p "^matching.*$" matching-dlx-policy \
  '{"dead-letter-exchange":"mnbarh.matching.dlx","dead-letter-routing-key":"matching.*"}'
rabbitmq bind_queue mnbarh.matching.dlx mnbarh.matching.dlx matching.*
```

---

## Kafka Dead Letter Topics

### Product Events DLQ
**Topic**: `products.dlq`
**Purpose**: Failed product events

```bash
# Create DLQ topic
kafka-topics --bootstrap-server localhost:9092 --create --if-not-exists \
  --topic products.dlq \
  --partitions 3 \
  --replication-factor 1
```

### Order Events DLQ
**Topic**: `orders.dlq`
**Purpose**: Failed order events

```bash
kafka-topics --bootstrap-server localhost:9092 --create --if-not-exists \
  --topic orders.dlq \
  --partitions 3 \
  --replication-factor 1
```

### Payment Events DLQ
**Topic**: `payments.dlq`
**Purpose**: Failed payment events

```bash
kafka-topics --bootstrap-server localhost:9092 --create --if-not-exists \
  --topic payments.dlq \
  --partitions 3 \
  --replication-factor 1
```

---

## Consumer Configuration

### RabbitMQ Consumer with DLQ

```javascript
const amqp = require('amqplib');

async function createDLQConsumer() {
  const connection = await amqp.connect('amqp://mnbarh:mnbarh_dev_password@localhost:5672');
  const channel = await connection.createChannel();

  // Declare main exchange
  await channel.assertExchange('mnbarh.product', 'topic', { durable: true });
  
  // Declare DLQ exchange
  await channel.assertExchange('mnbarh.product.dlx', 'direct', { durable: true });
  
  // Declare DLQ queue
  await channel.assertQueue('mnbarh.product.dlq', { durable: true });
  
  // Bind DLQ queue to DLQ exchange
  await channel.bindQueue('mnbarh.product.dlx', 'mnbarh.product.dlx', 'product.*');
  
  // Declare main queue with DLQ
  const args = {
    'x-dead-letter-exchange': 'mnbarh.product.dlx',
    'x-dead-letter-routing-key': 'product.*'
  };
  
  await channel.assertQueue('mnbarh.product', args);
  await channel.bindQueue('mnbarh.product', 'mnbarh.product', 'product.*');
  
  // Consume with error handler
  await channel.consume('mnbarh.product', {
    noAck: false
  }, async (msg) => {
    try {
      const event = JSON.parse(msg.content.toString());
      // Process event
      await processEvent(event);
      channel.ack(msg);
    } catch (error) {
      console.error('Error processing event:', error);
      // Reject and send to DLQ
      channel.reject(msg, false);
    }
  });
}
```

### Kafka Consumer with DLQ

```javascript
const { Kafka } = require('kafkajs');

async function createDLQConsumer() {
  const kafka = new Kafka({
    clientId: 'order-service',
    brokers: ['localhost:9092']
  });

  const consumer = kafka.consumer({
    groupId: 'order-service-group',
    topics: [{ topic: 'orders', fromBeginning: false }]
  });

  await consumer.connect();
  
  await consumer.subscribe({
    topic: 'orders',
    fromBeginning: false
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        // Process event
        await processEvent(event);
      } catch (error) {
        console.error('Error processing event:', error);
        // Send to DLQ topic
        await producer.send({
          topic: 'orders.dlq',
          messages: [{
            key: message.key,
            value: message.value
          }]
        });
      }
    }
  });
}
```

---

## Retry Logic

### Exponential Backoff

```javascript
async function processWithRetry(event, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processEvent(event);
      return true;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Monitoring

### DLQ Metrics

```javascript
// RabbitMQ DLQ metrics
async function getDQLMetrics() {
  const connection = await amqp.connect('amqp://mnbarh:mnbarh_dev_password@localhost:5672');
  const channel = await connection.createChannel();
  
  const queue = 'mnbarh.product.dlq';
  const { messageCount } = await channel.checkQueue(queue);
  
  console.log(`DLQ message count: ${messageCount}`);
  
  // Alert if DLQ is filling up
  if (messageCount > 1000) {
    console.error('DLQ is filling up!');
    // Send alert
  }
}
```

---

**Status**: ✅ Dead Letter Queues Configured
**Next**: Set up PostgreSQL read replicas
