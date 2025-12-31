import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://mnbarh:mnbarh_dev_password@rabbitmq:5672';

/**
 * RabbitMQ Helper Service
 * Handles connection, publishing, and consuming messages with auto-recovery
 */
export class RabbitMQService {
    private static connection: any = null;
    private static channel: any = null;
    private static isConnecting = false;

    /**
     * Connect to RabbitMQ with retry logic
     */
    static async connect(): Promise<any> {
        if (this.channel) return this.channel;
        if (this.isConnecting) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return this.connect();
        }

        this.isConnecting = true;
        try {
            this.connection = await amqp.connect(RABBITMQ_URL);
            this.channel = await this.connection.createChannel();
            
            this.connection.on('error', (err: any) => {
                console.error('❌ RabbitMQ Connection Error:', err);
                this.reconnect();
            });

            this.connection.on('close', () => {
                console.warn('⚠️ RabbitMQ Connection Closed');
                this.reconnect();
            });

            // Standard Exchanges
            await this.channel.assertExchange('mnbarh.events', 'topic', { durable: true });
            await this.channel.assertExchange('mnbarh.transactions', 'topic', { durable: true });
            await this.channel.assertExchange('mnbarh.fraud', 'topic', { durable: true });
            await this.channel.assertExchange('mnbarh.audit', 'fanout', { durable: true });
            
            // Standard Queues
            const queues = [
                'notifications', 
                'escrow', 
                'rewards', 
                'location-updates', 
                'matching', 
                'trips',
                'transaction-events',
                'fraud-alerts',
                'audit-logs',
                'limit-exceeded',
                'security-events'
            ];
            for (const queue of queues) {
                await this.channel.assertQueue(queue, { durable: true });
            }

            // Bind transaction events
            await this.channel.bindQueue('transaction-events', 'mnbarh.transactions', 'transaction.*');
            await this.channel.bindQueue('fraud-alerts', 'mnbarh.fraud', 'fraud.*');
            await this.channel.bindQueue('security-events', 'mnbarh.fraud', 'security.*');
            await this.channel.bindQueue('audit-logs', 'mnbarh.audit', '');
            
            console.log('✅ RabbitMQ connected successfully');
            this.isConnecting = false;
            return this.channel;
        } catch (error) {
            this.isConnecting = false;
            console.error('❌ RabbitMQ connection failed, retrying in 5s...', error);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return this.connect();
        }
    }


    private static async reconnect() {
        this.channel = null;
        this.connection = null;
        await this.connect();
    }

    /**
     * Publish message to queue
     */
    static async publish(queue: string, message: any): Promise<void> {
        try {
            const channel = await this.connect();
            const msgBuffer = Buffer.from(JSON.stringify(message));
            channel.sendToQueue(queue, msgBuffer, { persistent: true });
            console.log(`[RabbitMQ] Published to ${queue}`);
        } catch (error) {
            console.error('[RabbitMQ] Publish error:', error);
        }
    }

    /**
     * Publish event to topic exchange
     */
    static async publishEvent(routingKey: string, message: any): Promise<void> {
        try {
            const channel = await this.connect();
            const msgBuffer = Buffer.from(JSON.stringify(message));
            channel.publish('mnbarh.events', routingKey, msgBuffer, { persistent: true });
            console.log(`[RabbitMQ] Published event ${routingKey}`);
        } catch (error) {
            console.error('[RabbitMQ] Publish event error:', error);
        }
    }

    /**
     * Consume messages from queue
     */
    static async consume(
        queue: string,
        callback: (message: any) => Promise<void>
    ): Promise<void> {
        try {
            const channel = await this.connect();
            await channel.consume(queue, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await callback(content);
                        channel.ack(msg);
                    } catch (error) {
                        console.error(`[RabbitMQ] Error processing message from ${queue}:`, error);
                        // Optional: Move to Dead Letter Queue instead of just NACK
                        channel.nack(msg, false, false);
                    }
                }
            });
            console.log(`[RabbitMQ] Consuming from: ${queue}`);
        } catch (error) {
            console.error('[RabbitMQ] Consume error:', error);
        }
    }

    /**
     * Close connection
     */
    static async close(): Promise<void> {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            this.channel = null;
            this.connection = null;
            console.log('✅ RabbitMQ connection closed');
        } catch (error) {
            console.error('❌ RabbitMQ close error:', error);
        }
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    await RabbitMQService.close();
});

