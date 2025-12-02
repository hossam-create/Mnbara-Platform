import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://mnbara_user:mnbara_pass@rabbitmq:5672';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

/**
 * RabbitMQ Helper Service
 * Handles connection, publishing, and consuming messages
 */
export class RabbitMQService {
    
    /**
     * Connect to RabbitMQ
     */
    static async connect(): Promise<void> {
        try {
            connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();
            
            // Create exchanges
            await channel.assertExchange('mnbara.events', 'topic', { durable: true });
            
            // Create queues
            await channel.assertQueue('notifications', { durable: true });
            await channel.assertQueue('escrow', { durable: true });
            await channel.assertQueue('rewards', { durable: true });
            await channel.assertQueue('location-updates', { durable: true });
            await channel.assertQueue('matching', { durable: true });
            
            console.log('✅ RabbitMQ connected successfully');
        } catch (error) {
            console.error('❌ RabbitMQ connection failed:', error);
            throw error;
        }
    }

    /**
     * Publish message to queue
     */
    static async publish(queue: string, message: any): Promise<void> {
        try {
            if (!channel) {
                await this.connect();
            }

            const msgBuffer = Buffer.from(JSON.stringify(message));
            channel!.sendToQueue(queue, msgBuffer, { persistent: true });

            console.log(`[RabbitMQ] Published to ${queue}:`, message);
        } catch (error) {
            console.error('[RabbitMQ] Publish error:', error);
        }
    }

    /**
     * Publish event to topic exchange
     */
    static async publishEvent(routingKey: string, message: any): Promise<void> {
        try {
            if (!channel) {
                await this.connect();
            }

            const msgBuffer = Buffer.from(JSON.stringify(message));
            channel!.publish('mnbara.events', routingKey, msgBuffer, { persistent: true });

            console.log(`[RabbitMQ] Published event ${routingKey}:`, message);
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
            if (!channel) {
                await this.connect();
            }

            channel!.consume(queue, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await callback(content);
                        channel!.ack(msg);
                    } catch (error) {
                        console.error(`[RabbitMQ] Error processing message from ${queue}:`, error);
                        channel!.nack(msg, false, false); // Don't requeue
                    }
                }
            });

            console.log(`[RabbitMQ] Consuming from queue: ${queue}`);
        } catch (error) {
            console.error('[RabbitMQ] Consume error:', error);
        }
    }

    /**
     * Close connection
     */
    static async close(): Promise<void> {
        try {
            if (channel) await channel.close();
            if (connection) await connection.close();
            console.log('✅ RabbitMQ connection closed');
        } catch (error) {
            console.error('❌ RabbitMQ close error:', error);
        }
    }
}

// Auto-connect on module load
RabbitMQService.connect().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
    await RabbitMQService.close();
    process.exit(0);
});
