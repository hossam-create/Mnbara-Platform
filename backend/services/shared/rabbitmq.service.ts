import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://mnbara:mnbara_dev_password@rabbitmq:5672';

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
            await this.channel.assertExchange('mnbara.events', 'topic', { durable: true });
            
            // Standard Queues
            const queues = ['notifications', 'escrow', 'rewards', 'location-updates', 'matching', 'trips'];
            for (const queue of queues) {
                await this.channel.assertQueue(queue, { durable: true });
            }
            
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
            channel.publish('mnbara.events', routingKey, msgBuffer, { persistent: true });
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

