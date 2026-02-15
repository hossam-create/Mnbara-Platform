/**
 * RabbitMQ Helper Service
 * Handles connection, publishing, and consuming messages with auto-recovery
 */
export declare class RabbitMQService {
    private static connection;
    private static channel;
    private static isConnecting;
    /**
     * Connect to RabbitMQ with retry logic
     */
    static connect(): Promise<any>;
    private static reconnect;
    private static reconnectAttempts;
    /**
     * Publish message to queue
     */
    static publish(queue: string, message: any): Promise<void>;
    /**
     * Publish event to topic exchange
     */
    static publishEvent(routingKey: string, message: any): Promise<void>;
    /**
     * Consume messages from queue
     */
    static consume(queue: string, callback: (msg: any) => Promise<void>, options?: {
        noAck?: boolean;
    }): Promise<void>;
    /**
     * Close connection
     */
    static close(): Promise<void>;
}
//# sourceMappingURL=rabbitmq.service.d.ts.map