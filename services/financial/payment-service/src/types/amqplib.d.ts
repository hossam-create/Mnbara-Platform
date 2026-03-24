/**
 * Type declarations for amqplib
 * These will be replaced by @types/amqplib when npm install is run
 */

declare module 'amqplib' {
  export interface Connection {
    createChannel(): Promise<Channel>;
    close(): Promise<void>;
    on(event: 'close' | 'error', listener: (err?: Error) => void): this;
  }

  export interface Channel {
    assertExchange(exchange: string, type: string, options?: any): Promise<any>;
    assertQueue(queue: string, options?: any): Promise<any>;
    bindQueue(queue: string, exchange: string, pattern: string): Promise<any>;
    publish(exchange: string, routingKey: string, content: Buffer, options?: any): boolean;
    close(): Promise<void>;
  }

  export function connect(url: string): Promise<Connection>;
}
